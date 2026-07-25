// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser-retry (cron toutes les 5 min)
//
// Récupère toutes les analyses en status='queued' dont le
// last_retry_at remonte à plus de 4 minutes, et retente l'upload
// vers Anthropic Files API + relance analyser-run.
//
// Si le retry réussit → status='processing', notification cloche
// Si encore overload → on incrémente queue_attempts (max 12 = 1h)
// Si > 12 attempts → on abandonne, on rembourse, on envoie email
//
// Sécurité : la fonction ne peut être appelée que par le cron
// (vérifie le header x-cron-secret) — sinon n'importe qui pourrait
// déclencher des retries inutiles.
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_FILES_URL = 'https://api.anthropic.com/v1/files';
const AI_VERSION = '2023-06-01';
const FILES_BETA = 'files-api-2025-04-14';
const STORAGE_BUCKET = 'analyse-temp';

const QUEUE_MAX_ATTEMPTS = 12;
const RETRY_INTERVAL_MIN = 4; // ne retente que si dernière tentative > 4 min

// Message écrit dans progress_message quand un COMPLÉMENT abandonné est restauré.
// ⚠️ MIROIR EXACT : même chaîne dans analyser/index.ts, analyser-run/index.ts et watchdog-stuck-analyses/index.ts.
const COMPLEMENT_FAILED_MSG = 'La mise à jour du dossier n\'a pas abouti — votre rapport d\'origine est conservé. Vous pouvez réessayer via « Compléter mon dossier ».';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SupabaseClient = ReturnType<typeof createClient>;

// ══════════════════════════════════════════════════════════════
// HELPERS — copiés de analyser pour rester autonome
// ══════════════════════════════════════════════════════════════

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  }
  return btoa(chunks.join(''));
}

type UploadError = 'overload' | 'rate_limit' | 'auth' | 'other';
type UploadResult = { id: string; error?: undefined } | { id?: undefined; error: UploadError };

async function uploadToFilesAPI(fileName: string, base64Data: string, apiKey: string): Promise<UploadResult> {
  // 🧪 MODE TEST : si FORCE_OVERLOAD=true, simule une panne Anthropic
  if (Deno.env.get('FORCE_OVERLOAD') === 'true') {
    console.log(`[analyser-retry] 🧪 FORCE_OVERLOAD actif — simule overload pour "${fileName}"`);
    return { error: 'overload' };
  }

  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });

  const formData = new FormData();
  formData.append('file', blob, fileName);

  try {
    const res = await fetch(ANTHROPIC_FILES_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': AI_VERSION,
        'anthropic-beta': FILES_BETA,
      },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.id) return { id: data.id };
      return { error: 'other' };
    }

    const errBody = await res.text();
    console.error(`[analyser-retry] Upload ${res.status} "${fileName}":`, errBody);

    if (res.status === 503 || res.status === 529) return { error: 'overload' };
    if (res.status === 429) return { error: 'rate_limit' };
    if (res.status === 401 || res.status === 403) return { error: 'auth' };
    return { error: 'other' };
  } catch (err) {
    console.error(`[analyser-retry] Erreur réseau "${fileName}":`, err);
    return { error: 'other' };
  }
}

async function refundCredit(analyseId: string, supabaseAdmin: SupabaseClient): Promise<boolean> {
  try {
    // 🔒 Remboursement IDEMPOTENT centralisé (verrou analyses.credit_refunded) — aligné sur
    // analyser / analyser-run / watchdog qui appellent tous refund_analyse_credit.
    // ⚠️ L'ancienne implémentation directe de ce fichier (refund_pro_credit + UPDATE profiles)
    // datait d'avant le fix d'idempotence de juillet et CONTOURNAIT le verrou → 4ᵉ rembourseur
    // oublié, risque de double remboursement. Corrigé : même fonction SQL que les 3 autres.
    const { data, error } = await supabaseAdmin.rpc('refund_analyse_credit', { p_analyse_id: analyseId });
    if (error) {
      console.error('[analyser-retry] Erreur refund_analyse_credit:', error.message);
      return false;
    }
    if (data === true) {
      console.log(`[analyser-retry] ✅ Crédit remboursé (verrou) pour ${analyseId}`);
      return true;
    }
    console.log(`[analyser-retry] Remboursement déjà effectué ou non applicable pour ${analyseId}`);
    return false;
  } catch (err) {
    console.error('[analyser-retry] Erreur remboursement:', err);
    return false;
  }
}

async function insertSystemAlert(
  supabaseAdmin: SupabaseClient,
  params: {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    analyseId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await supabaseAdmin.from('system_alerts').insert({
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      analyse_id: params.analyseId || null,
      user_id: params.userId || null,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error('[analyser-retry] insertSystemAlert error:', err);
  }
}

async function insertNotification(
  supabaseAdmin: SupabaseClient,
  userId: string,
  title: string,
  message: string,
): Promise<void> {
  try {
    await supabaseAdmin.from('user_notifications').insert({
      user_id: userId,
      title,
      message,
      read: false,
    });
  } catch (err) {
    console.error('[analyser-retry] insertNotification error:', err);
  }
}

// ══════════════════════════════════════════════════════════════
// MAILJET — envoi email
// ══════════════════════════════════════════════════════════════

async function sendMailjet(
  to: string,
  toName: string,
  subject: string,
  htmlBody: string,
  isPro: boolean,
): Promise<boolean> {
  const MJ_API_KEY = Deno.env.get('MJ_API_KEY') ?? '';
  const MJ_SECRET_KEY = Deno.env.get('MJ_SECRET_KEY') ?? '';

  if (!MJ_API_KEY || !MJ_SECRET_KEY) {
    console.error('[analyser-retry] Mailjet keys not configured');
    return false;
  }

  const fromEmail = isPro ? 'pro@verimo.fr' : 'hello@verimo.fr';
  const fromName = isPro ? 'Verimo Pro' : 'Verimo';

  try {
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${MJ_API_KEY}:${MJ_SECRET_KEY}`),
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: to, Name: toName }],
          Subject: subject,
          HTMLPart: htmlBody,
        }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[analyser-retry] Mailjet error:', res.status, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[analyser-retry] Mailjet exception:', err);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// TEMPLATES EMAIL — succès et échec
// ══════════════════════════════════════════════════════════════

function buildSuccessEmail(opts: {
  prenom: string;
  isComplete: boolean;
  subject: string; // adresse OU nom du document
  reportUrl: string;
  isPro: boolean;
}): string {
  const intro = opts.isComplete
    ? `Votre analyse complète du bien situé <strong style="color:#0f2d3d;">${opts.subject}</strong> est terminée.`
    : `Votre analyse du document <strong style="color:#0f2d3d;">"${opts.subject}"</strong> est terminée.`;

  const summary = opts.isComplete
    ? `Notre rapport détaille le score global, les points forts et faibles, l'état des finances de la copropriété, les diagnostics, les éventuels risques et nos recommandations avant signature.`
    : `Notre rapport vous résume les points-clés du document, identifie les éléments importants à retenir et signale les points de vigilance éventuels.`;

  const proLabel = opts.isPro ? 'PRO · ANALYSE PRÊTE' : '✓ ANALYSE PRÊTE';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:20px 12px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);width:100%;max-width:560px;">
        <tr><td style="background:linear-gradient(135deg,#0a1f2d,#1a4a5e);padding:36px 24px 28px;text-align:center;">
          <img src="https://www.verimo.fr/logo-blanc.png" alt="Verimo" width="180" style="display:block;margin:0 auto 14px;max-width:180px;height:auto;" />
          <span style="display:inline-block;background:linear-gradient(135deg,#7dd3fc,#38bdf8);color:#0a1f2d;font-size:11px;font-weight:800;padding:5px 16px;border-radius:100px;letter-spacing:0.1em;">${proLabel}</span>
        </td></tr>
        <tr><td style="padding:32px 28px 8px;">
          <h2 style="color:#0f2d3d;font-size:22px;font-weight:800;margin:0 0 20px;text-align:center;">Bonjour ${opts.prenom},</h2>
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 12px;">${intro}</p>
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">${summary}</p>
        </td></tr>
        <tr><td style="padding:0 28px 28px;text-align:center;">
          <a href="${opts.reportUrl}" style="display:inline-block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;font-size:16px;font-weight:700;padding:15px 44px;border-radius:14px;text-decoration:none;">
            🔍 Consulter mon rapport
          </a>
        </td></tr>
        <tr><td style="padding:0 28px 24px;">
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;text-align:center;">
            Une question ? Créez un ticket depuis votre espace via le bouton "Besoin d'aide".
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #f1f5f9;">
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">
            <strong style="color:#64748b;">Verimo${opts.isPro ? ' Pro' : ''}</strong> — Vos documents décryptés, votre décision éclairée.<br>
            <a href="https://verimo.fr" style="color:#2a7d9c;text-decoration:none;">verimo.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildFailureEmail(opts: {
  prenom: string;
  subject: string;
  retryUrl: string;
  isPro: boolean;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:20px 12px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);width:100%;max-width:560px;">
        <tr><td style="background:linear-gradient(135deg,#0a1f2d,#1a4a5e);padding:36px 24px 28px;text-align:center;">
          <img src="https://www.verimo.fr/logo-blanc.png" alt="Verimo" width="180" style="display:block;margin:0 auto 14px;max-width:180px;height:auto;" />
          <span style="display:inline-block;background:rgba(248,113,113,0.2);color:#fca5a5;font-size:11px;font-weight:600;padding:5px 14px;border-radius:100px;">❌ ANALYSE NON ABOUTIE</span>
        </td></tr>
        <tr><td style="padding:32px 28px 8px;">
          <h2 style="color:#0f2d3d;font-size:20px;font-weight:800;margin:0 0 20px;text-align:center;">Toutes nos excuses, ${opts.prenom}</h2>
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px;">
            Notre service est resté indisponible plus longtemps que prévu et nous n'avons pas pu générer votre analyse${opts.subject ? ` <strong style="color:#0f2d3d;">(${opts.subject})</strong>` : ''}.
          </p>
        </td></tr>
        <tr><td style="padding:0 28px 24px;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 18px;">
            <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 6px;">✅ Votre crédit a été restitué</p>
            <p style="color:#166534;font-size:13px;line-height:1.6;margin:0;">Vous pouvez relancer votre analyse depuis votre espace dès que vous le souhaitez.</p>
          </div>
        </td></tr>
        <tr><td style="padding:0 28px 28px;text-align:center;">
          <a href="${opts.retryUrl}" style="display:inline-block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;font-size:15px;font-weight:700;padding:13px 36px;border-radius:12px;text-decoration:none;">
            🔄 Relancer mon analyse
          </a>
        </td></tr>
        <tr><td style="padding:0 28px 24px;">
          <p style="color:#94a3b8;font-size:12px;line-height:1.7;margin:0;text-align:center;">
            Si le problème persiste, ouvrez un ticket depuis l'onglet <strong style="color:#64748b;">Support</strong> de votre espace.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #f1f5f9;">
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">
            <strong style="color:#64748b;">Verimo${opts.isPro ? ' Pro' : ''}</strong> — Vos documents décryptés, votre décision éclairée.<br>
            <a href="https://verimo.fr" style="color:#2a7d9c;text-decoration:none;">verimo.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════
// LOGIQUE PRINCIPALE — RETRY D'UNE ANALYSE EN QUEUE
// ══════════════════════════════════════════════════════════════

async function retryQueuedAnalysis(
  supabaseAdmin: SupabaseClient,
  analyseId: string,
  apiKey: string,
): Promise<{ ok: boolean; finalState: 'processing' | 'still_queued' | 'abandoned' }> {
  // 1. Récupérer l'analyse + son metadata_queue (paths Storage stockés par analyser)
  const { data: analyse } = await supabaseAdmin
    .from('analyses')
    .select('id, user_id, type, title, address, queue_attempts, metadata_queue')
    .eq('id', analyseId)
    .single();

  if (!analyse) {
    console.warn(`[analyser-retry] Analyse ${analyseId} introuvable`);
    return { ok: false, finalState: 'abandoned' };
  }

  const meta = analyse.metadata_queue as {
    storagePaths?: string[];
    fileNames?: string[];
    mode?: string;
    profil?: 'rp' | 'invest';
    typeBienDeclare?: string | null;
    existingReport?: Record<string, unknown> | null;
  } | null;

  if (!meta?.storagePaths || meta.storagePaths.length === 0) {
    console.error(`[analyser-retry] metadata_queue invalide pour ${analyseId}`);
    await abandonAnalysis(supabaseAdmin, {
      id: analyse.id,
      user_id: analyse.user_id,
      type: analyse.type,
      title: analyse.title,
      address: analyse.address,
    }, 'no_metadata_queue');
    return { ok: false, finalState: 'abandoned' };
  }

  // 2. Tenter le re-upload vers Anthropic
  const fileIds: Array<{ id: string; name: string }> = [];
  let hasOverload = false;
  let hasAuth = false;

  for (let i = 0; i < meta.storagePaths.length; i++) {
    const path = meta.storagePaths[i];
    const fileName = meta.fileNames?.[i] || path.split('/').pop() || `doc_${i + 1}.pdf`;

    const { data: blob, error: dlErr } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(path);

    if (dlErr || !blob) {
      console.error(`[analyser-retry] Download error for ${path}:`, dlErr);
      continue;
    }
    const base64 = await blobToBase64(blob);
    const result = await uploadToFilesAPI(fileName, base64, apiKey);

    if (result.error === 'overload' || result.error === 'rate_limit') {
      hasOverload = true;
      break;
    }
    if (result.error === 'auth') {
      hasAuth = true;
      break;
    }
    if (result.id) {
      fileIds.push({ id: result.id, name: fileName });
    }
  }

  // 3a. Encore overload → on incrémente, on reste en queue
  if (hasOverload) {
    const newAttempts = (analyse.queue_attempts || 0) + 1;
    if (newAttempts > QUEUE_MAX_ATTEMPTS) {
      // Cleanup Storage (on abandonne, plus besoin)
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(meta.storagePaths);
      await abandonAnalysis(supabaseAdmin, {
        id: analyse.id,
        user_id: analyse.user_id,
        type: analyse.type,
        title: analyse.title,
        address: analyse.address,
      }, 'max_attempts_reached');
      return { ok: false, finalState: 'abandoned' };
    }
    await supabaseAdmin
      .from('analyses')
      .update({
        queue_attempts: newAttempts,
        last_retry_at: new Date().toISOString(),
      })
      .eq('id', analyseId);

    await insertSystemAlert(supabaseAdmin, {
      type: 'overload',
      severity: 'warning',
      title: `Retry ${newAttempts}/${QUEUE_MAX_ATTEMPTS} — encore en surcharge`,
      message: 'La tentative de retry a échoué — encore en surcharge serveur. Nouvelle tentative dans 5 min.',
      analyseId,
      userId: analyse.user_id,
      metadata: { stage: 'retry_upload', attempts: newAttempts },
    });
    return { ok: false, finalState: 'still_queued' };
  }

  // 3b. Erreur auth → on abandonne (problème admin Anthropic)
  if (hasAuth) {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(meta.storagePaths);
    await abandonAnalysis(supabaseAdmin, {
      id: analyse.id,
      user_id: analyse.user_id,
      type: analyse.type,
      title: analyse.title,
      address: analyse.address,
    }, 'auth_error');
    return { ok: false, finalState: 'abandoned' };
  }

  // 3c. Aucun fichier uploadé pour une autre raison → abandon
  if (fileIds.length === 0) {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(meta.storagePaths);
    await abandonAnalysis(supabaseAdmin, {
      id: analyse.id,
      user_id: analyse.user_id,
      type: analyse.type,
      title: analyse.title,
      address: analyse.address,
    }, 'no_files_uploaded');
    return { ok: false, finalState: 'abandoned' };
  }

  // 4. SUCCESS → cleanup Storage + appel analyser-run
  await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(meta.storagePaths);

  await supabaseAdmin
    .from('analyses')
    .update({
      status: 'files_ready',
      file_ids: fileIds,
      progress_message: 'Documents uploadés, analyse en cours...',
      metadata_queue: null, // cleanup
    })
    .eq('id', analyseId);

  // Appel analyser-run en fire-and-forget (comme dans analyser)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  fetch(`${supabaseUrl}/functions/v1/analyser-run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      analyseId,
      fileIds,
      mode: meta.mode || 'complete', // 🔧 fallback 'complete' (et non 'normal' qui n'existe pas : un gros dossier requeued raterait l'aiguillage MAP-REDUCE et foncerait dans le mur du timeout single-call)
      profil: meta.profil,
      typeBienDeclare: meta.typeBienDeclare,
      existingReport: meta.existingReport || undefined,
      fromRetry: true,
    }),
  }).catch(err => console.error('[analyser-retry] analyser-run call error:', err));

  console.log(`[analyser-retry] ✅ Retry réussi pour ${analyseId} — ${fileIds.length} fichier(s) uploadé(s)`);

  // Note : la notification cloche + l'email "analyse prête" seront envoyés
  // depuis analyser-run quand le rapport est VRAIMENT généré, pas ici.

  return { ok: true, finalState: 'processing' };
}

// ══════════════════════════════════════════════════════════════
// ABANDON — appelé quand on dépasse les 12 tentatives ou erreur fatale
// ══════════════════════════════════════════════════════════════

async function abandonAnalysis(
  supabaseAdmin: SupabaseClient,
  analyse: { id: string; user_id: string; type: string; title: string | null; address: string | null },
  reason: string,
): Promise<void> {
  // 0. Mode : un COMPLÉMENT abandonné ne doit NI rembourser (le complément est gratuit,
  //    le crédit d'origine a été légitimement consommé au premier succès), NI passer en
  //    failed (le rapport d'origine est intact dans `result`).
  //    ⚠️ MIROIR : même logique dans analyser / analyser-run / watchdog (handleAnalyseFailure / cleanupAnalyse).
  const { data: row } = await supabaseAdmin
    .from('analyses')
    .select('mode')
    .eq('id', analyse.id)
    .single();

  if (row?.mode === 'complement') {
    await supabaseAdmin
      .from('analyses')
      .update({
        status: 'completed',
        file_ids: [],
        progress_message: COMPLEMENT_FAILED_MSG,
      })
      .eq('id', analyse.id);

    await insertNotification(
      supabaseAdmin,
      analyse.user_id,
      'Mise à jour du dossier non aboutie',
      `L'ajout de documents à votre dossier${analyse.address ? ` « ${analyse.address} »` : ''} n'a pas abouti malgré plusieurs tentatives. Votre rapport d'origine est intact — vous pouvez réessayer via « Compléter mon dossier ».`,
    );

    await insertSystemAlert(supabaseAdmin, {
      type: 'overload',
      severity: 'warning',
      title: '[Complément] Queue : abandon après échec retries',
      message: `Un complément de dossier a été abandonné après plusieurs tentatives infructueuses (raison: ${reason}). Rapport d'origine restauré, aucun remboursement (le complément est gratuit).`,
      analyseId: analyse.id,
      userId: analyse.user_id,
      metadata: { reason, complement: true },
    });

    // Pas d'email d'échec : le rapport d'origine reste pleinement accessible.
    return;
  }

  const refunded = await refundCredit(analyse.id, supabaseAdmin);

  await supabaseAdmin
    .from('analyses')
    .update({
      status: 'failed',
      progress_message: 'Notre service est resté indisponible plus longtemps que prévu. Votre crédit a été remboursé automatiquement.',
    })
    .eq('id', analyse.id);

  // Notification cloche
  const subject = analyse.address || analyse.title || 'votre analyse';
  await insertNotification(
    supabaseAdmin,
    analyse.user_id,
    'Analyse non aboutie — crédit remboursé',
    `${subject} — vous pouvez relancer votre analyse`,
  );

  // Alerte admin
  await insertSystemAlert(supabaseAdmin, {
    type: 'overload',
    severity: 'warning',
    title: 'Queue : abandon après échec retries',
    message: `Une analyse a été abandonnée après plusieurs tentatives infructueuses (raison: ${reason}). Le crédit a été ${refunded ? 'remboursé' : 'NON remboursé (à vérifier)'}.`,
    analyseId: analyse.id,
    userId: analyse.user_id,
    metadata: { reason, refunded },
  });

  // Email échec
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name, role')
    .eq('id', analyse.user_id)
    .single();

  if (profile?.email) {
    const isPro = profile.role === 'pro';
    const prenom = profile.full_name?.split(' ')[0] || 'Bonjour';
    const retryUrl = isPro
      ? 'https://verimo.fr/dashboard/pro/nouvelle-analyse'
      : 'https://verimo.fr/dashboard/nouvelle-analyse';

    const html = buildFailureEmail({
      prenom,
      subject: analyse.address || analyse.title || '',
      retryUrl,
      isPro,
    });

    await sendMailjet(
      profile.email,
      profile.full_name || '',
      'Désolé, votre crédit a été remboursé',
      html,
      isPro,
    );
  }
}

// ══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL — appelé par pg_cron toutes les 5 min
// ══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Sécurité : vérifier que ça vient bien du cron (header secret)
  const expectedSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = req.headers.get('x-cron-secret');
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'no_anthropic_key' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Récupérer toutes les analyses en queue dont last_retry_at > 4 min
  const cutoff = new Date(Date.now() - RETRY_INTERVAL_MIN * 60 * 1000).toISOString();
  const { data: queued } = await supabaseAdmin
    .from('analyses')
    .select('id')
    .eq('status', 'queued')
    .or(`last_retry_at.is.null,last_retry_at.lt.${cutoff}`)
    .limit(20); // safety : max 20 par cron run

  if (!queued || queued.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  console.log(`[analyser-retry] ${queued.length} analyse(s) en queue à retenter`);

  const results = { processing: 0, still_queued: 0, abandoned: 0 };
  for (const q of queued) {
    try {
      const r = await retryQueuedAnalysis(supabaseAdmin, q.id, apiKey);
      if (r.finalState === 'processing') results.processing++;
      else if (r.finalState === 'still_queued') results.still_queued++;
      else results.abandoned++;
    } catch (err) {
      console.error(`[analyser-retry] Erreur sur ${q.id}:`, err);
      results.abandoned++;
    }
  }

  console.log('[analyser-retry] Résultat:', results);
  return new Response(JSON.stringify({ processed: queued.length, ...results }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});

// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser (v8 — retry + refund backend + alerts)
// Étape 1 : Upload PDFs vers Files API → stocke file_ids dans Supabase
// Répond immédiatement → appelle analyser-run
// Mode complement : lit le rapport existant + uploade les nouveaux docs
// 
// v8 (cette version) :
//   - Retry sur 503/529 (3 tentatives, sleep 15s)
//   - Distinction des erreurs upload (overload, rate_limit, auth, other)
//   - Remboursement backend (indépendant du front)
//   - Insertion alertes dans system_alerts (page admin)
//   - Messages utilisateur en français, jamais de mention technique IA
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_FILES_URL = 'https://api.anthropic.com/v1/files';
const AI_VERSION = '2023-06-01';
const FILES_BETA = 'files-api-2025-04-14';
const STORAGE_BUCKET = 'analyse-temp';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SupabaseClient = ReturnType<typeof createClient>;
type UploadError = 'overload' | 'rate_limit' | 'auth' | 'other';
type UploadResult = { id: string; error?: undefined } | { id?: undefined; error: UploadError };

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ══════════════════════════════════════════════════════════════
// HELPERS UTILITAIRES
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// REMARQUE : blobToBase64() supprimée (refactor CPU)
// Anthropic Files API accepte le binaire direct via FormData multipart.
// La conversion base64 était un détour inutile qui consommait du CPU.
// ══════════════════════════════════════════════════════════════

async function updateProgress(db: SupabaseClient, analyseId: string, current: number, total: number, message: string) {
  await db.from('analyses').update({ progress_current: current, progress_total: total, progress_message: message }).eq('id', analyseId);
}

// ══════════════════════════════════════════════════════════════
// UPLOAD VERS FILES API — avec retry sur 503/529
// Retourne { id } en succès, { error } en cas d'échec
// ══════════════════════════════════════════════════════════════
async function uploadToFilesAPI(fileName: string, blob: Blob, apiKey: string): Promise<UploadResult> {
  // 🧪 MODE TEST : si FORCE_OVERLOAD=true, simule une panne Anthropic
  if (Deno.env.get('FORCE_OVERLOAD') === 'true') {
    console.log(`[analyser] 🧪 FORCE_OVERLOAD actif — simule overload pour "${fileName}"`);
    return { error: 'overload' };
  }

  // 🆕 Refactor CPU : on utilise directement le Blob binaire reçu de Supabase Storage.
  // Plus de conversion base64 ↔ binaire (économie CPU significative sur gros PDFs).

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', blob, fileName);
      const res = await fetch(ANTHROPIC_FILES_URL, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': AI_VERSION, 'anthropic-beta': FILES_BETA },
        body: formData,
      });

      // Succès
      if (res.ok) {
        const data = await res.json() as { id: string };
        console.log(`[analyser] Uploadé "${fileName}" → ${data.id} (tentative ${attempt})`);
        return { id: data.id };
      }

      // Lire le body pour log
      const errBody = await res.text();
      console.error(`[analyser] Upload ${res.status} "${fileName}" (tentative ${attempt}):`, errBody);

      // 503/529 : surcharge serveur — retry
      if (res.status === 503 || res.status === 529) {
        if (attempt < 3) {
          await sleep(15000);
          continue;
        }
        return { error: 'overload' };
      }

      // 429 : rate limit — retry avec backoff
      if (res.status === 429) {
        if (attempt < 3) {
          await sleep(Math.pow(2, attempt) * 5000);
          continue;
        }
        return { error: 'rate_limit' };
      }

      // 401/403 : problème de clé/quota — pas de retry
      if (res.status === 401 || res.status === 403) {
        return { error: 'auth' };
      }

      // Autre erreur (400 PDF invalide, 500, etc.) — pas de retry
      return { error: 'other' };

    } catch (err) {
      console.error(`[analyser] Erreur réseau upload "${fileName}" (tentative ${attempt}):`, err);
      if (attempt < 3) {
        await sleep(3000);
        continue;
      }
      return { error: 'other' };
    }
  }

  return { error: 'other' };
}

// ══════════════════════════════════════════════════════════════
// REMBOURSEMENT AUTOMATIQUE DU CRÉDIT EN CAS D'ÉCHEC
// (Identique à analyser-run pour cohérence)
// ══════════════════════════════════════════════════════════════
async function refundCredit(analyseId: string, supabaseAdmin: SupabaseClient): Promise<boolean> {
  try {
    const { data: analyse } = await supabaseAdmin
      .from('analyses')
      .select('user_id, type')
      .eq('id', analyseId)
      .single();

    if (!analyse?.user_id || !analyse?.type) {
      console.warn('[analyser] Remboursement impossible — user_id ou type manquant');
      return false;
    }

    const creditType = analyse.type;
    if (creditType !== 'document' && creditType !== 'complete') {
      console.log(`[analyser] Pas de remboursement pour type=${creditType}`);
      return false;
    }

    // Vérifier si le user est pro pour utiliser refund_pro_credit
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, credits_document, credits_complete')
      .eq('id', analyse.user_id)
      .single();

    if (!profile) {
      console.error('[analyser] Profil introuvable pour remboursement');
      return false;
    }

    // Branche PRO : appel RPC refund_pro_credit
    if ((profile as Record<string, unknown>).role === 'pro') {
      const { error: rpcErr } = await supabaseAdmin.rpc('refund_pro_credit', {
        p_user_id: analyse.user_id,
        p_credit_type: creditType,
      });
      if (rpcErr) {
        console.error('[analyser] Erreur refund_pro_credit:', rpcErr.message);
        return false;
      }
      console.log(`[analyser] ✅ Crédit pro ${creditType} remboursé pour user ${analyse.user_id} (analyse ${analyseId})`);
      return true;
    }

    // Branche PARTICULIER : UPDATE classique sur profiles
    const col = creditType === 'document' ? 'credits_document' : 'credits_complete';
    const current = (profile as Record<string, number>)[col] || 0;

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ [col]: current + 1 })
      .eq('id', analyse.user_id);

    if (error) {
      console.error('[analyser] Erreur remboursement:', error.message);
      return false;
    }

    console.log(`[analyser] ✅ Crédit ${creditType} remboursé pour user ${analyse.user_id} (analyse ${analyseId})`);
    return true;
  } catch (err) {
    console.error('[analyser] Erreur remboursement:', err);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// INSERTION D'UNE ALERTE SYSTÈME POUR L'ADMIN
// ══════════════════════════════════════════════════════════════
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
    const { error } = await supabaseAdmin.from('system_alerts').insert({
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      analyse_id: params.analyseId || null,
      user_id: params.userId || null,
      metadata: params.metadata || {},
    });
    if (error) {
      console.error('[analyser] Erreur insertion alerte:', error.message);
    } else {
      console.log(`[analyser] 🔔 Alerte système: ${params.type} — ${params.title}`);
    }
  } catch (err) {
    console.error('[analyser] Erreur insertion alerte:', err);
  }
}

// ══════════════════════════════════════════════════════════════
// HANDLER UNIFIÉ : remboursement + alerte + update status
// ══════════════════════════════════════════════════════════════
async function handleAnalyseFailure(
  supabaseAdmin: SupabaseClient,
  analyseId: string,
  errorType: string,
  userMessage: string,
  alertTitle: string,
  alertSeverity: 'info' | 'warning' | 'critical' = 'warning',
  extraMetadata: Record<string, unknown> = {},
): Promise<void> {
  // 0. Récupérer le mode AVANT tout : un échec de COMPLÉMENT ne doit NI rembourser
  //    (le complément est gratuit), NI passer en failed (le rapport d'origine est intact).
  //    ⚠️ MIROIR : même logique dans analyser-run/index.ts et watchdog-stuck-analyses/index.ts.
  const { data: analyse } = await supabaseAdmin
    .from('analyses')
    .select('user_id, type, mode')
    .eq('id', analyseId)
    .single();

  if (analyse?.mode === 'complement') {
    // ── ÉCHEC DE COMPLÉMENT : restaurer le rapport d'origine, AUCUN remboursement ──
    await insertSystemAlert(supabaseAdmin, {
      type: errorType,
      severity: alertSeverity,
      title: `[Complément] ${alertTitle}`,
      message: `Échec d'un complément de dossier (${errorType}). Rapport d'origine restauré, aucun remboursement (le complément est gratuit).`,
      analyseId,
      userId: analyse?.user_id || undefined,
      metadata: { refunded: false, analyseType: analyse?.type || 'unknown', complement: true, ...extraMetadata },
    });

    await supabaseAdmin.from('analyses').update({
      status: 'completed',
      file_ids: [],
      progress_message: COMPLEMENT_FAILED_MSG,
    }).eq('id', analyseId);

    if (analyse?.user_id) {
      await insertNotification(
        supabaseAdmin,
        analyse.user_id,
        'Mise à jour du dossier non aboutie',
        'L\'ajout de documents à votre dossier n\'a pas abouti suite à un incident technique. Votre rapport d\'origine est intact — vous pouvez réessayer via « Compléter mon dossier ».',
      );
    }
    return;
  }

  // ── ÉCHEC D'ANALYSE CLASSIQUE (comportement inchangé) ──
  // 1. Rembourser le crédit
  const refunded = await refundCredit(analyseId, supabaseAdmin);

  // 2. Insérer l'alerte
  await insertSystemAlert(supabaseAdmin, {
    type: errorType,
    severity: alertSeverity,
    title: alertTitle,
    message: userMessage,
    analyseId,
    userId: analyse?.user_id || undefined,
    metadata: { refunded, analyseType: analyse?.type || 'unknown', ...extraMetadata },
  });

  // 3. Update status — adapter le message si remboursement raté
  const finalMsg = refunded
    ? userMessage
    : userMessage.replace(
        'Votre crédit a été remboursé automatiquement.',
        'Contactez le support pour le remboursement de votre crédit.'
      );

  await supabaseAdmin.from('analyses').update({
    status: 'failed',
    progress_message: finalMsg,
  }).eq('id', analyseId);
}

// ══════════════════════════════════════════════════════════════
// 🆕 v9 — MISE EN QUEUE quand Anthropic est surchargée
// Si on a déjà retry ≥ 12 fois (>=1h) → on abandonne + rembourse
// Sinon → status='queued', le cron analyser-retry s'en charge
// ══════════════════════════════════════════════════════════════
const QUEUE_MAX_ATTEMPTS = 12; // 12 × 5 min = 1h max
const QUEUE_USER_MESSAGE = '⏳ Votre dossier a bien été reçu. Notre service connaît un pic d\'activité — votre analyse sera prête sous quelques minutes. Vous pouvez fermer cette page en toute tranquillité, nous vous prévenons par email ET par notification dans la cloche 🔔 dès que c\'est terminé.';
const QUEUE_NOTIF_TITLE = 'Analyse en attente';

// Message écrit dans progress_message quand un COMPLÉMENT échoue (le rapport d'origine est restauré).
// ⚠️ MIROIR EXACT : même chaîne dans analyser-run/index.ts et watchdog-stuck-analyses/index.ts.
const COMPLEMENT_FAILED_MSG = 'La mise à jour du dossier n\'a pas abouti — votre rapport d\'origine est conservé. Vous pouvez réessayer via « Compléter mon dossier ».';

async function insertNotification(
  supabaseAdmin: SupabaseClient,
  userId: string,
  title: string,
  message: string,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('user_notifications').insert({
      user_id: userId,
      title,
      message,
      read: false,
    });
    if (error) console.error('[analyser] Notif insert failed:', error.message);
  } catch (err) {
    console.error('[analyser] Notif insert exception:', err);
  }
}

async function tryEnqueueOrFail(
  supabaseAdmin: SupabaseClient,
  analyseId: string,
  reason: 'overload' | 'rate_limit',
  metadata: Record<string, unknown>,
): Promise<{ queued: boolean; userMessage: string }> {
  // Récupérer les compteurs + user_id + adresse pour la notif
  const { data: a } = await supabaseAdmin
    .from('analyses')
    .select('queue_attempts, user_id, title, address')
    .eq('id', analyseId)
    .single();

  const attempts = (a?.queue_attempts || 0) + 1;
  const isFirstAttempt = (a?.queue_attempts || 0) === 0;

  // Trop de tentatives → abandon + remboursement
  if (attempts > QUEUE_MAX_ATTEMPTS) {
    await handleAnalyseFailure(
      supabaseAdmin,
      analyseId,
      'overload',
      'Notre service est resté indisponible plus longtemps que prévu. Votre crédit a été remboursé automatiquement.',
      'Queue : abandon après 1h de retries',
      'warning',
      { ...metadata, attempts, abandoned: true },
    );
    return { queued: false, userMessage: 'Notre service est resté indisponible plus longtemps que prévu. Votre crédit a été remboursé automatiquement.' };
  }

  // Mise en queue
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: 'queued',
    queue_attempts: attempts,
    last_retry_at: now,
    progress_message: QUEUE_USER_MESSAGE,
  };
  if (isFirstAttempt) update.queued_at = now; // garde le 1er queued_at

  const { error: updErr } = await supabaseAdmin
    .from('analyses')
    .update(update)
    .eq('id', analyseId);

  if (updErr) {
    console.error('[analyser] Mise en queue échouée:', updErr);
    // Fallback : on rembourse immédiatement plutôt que de laisser un état corrompu
    await handleAnalyseFailure(
      supabaseAdmin,
      analyseId,
      'overload',
      'Notre service est temporairement indisponible. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.',
      'Queue : update DB échoué',
      'critical',
      { ...metadata, queueUpdateError: updErr.message },
    );
    return { queued: false, userMessage: 'Notre service est temporairement indisponible. Votre crédit a été remboursé automatiquement.' };
  }

  // Notification cloche (uniquement à la 1ère mise en queue, pas à chaque retry)
  if (isFirstAttempt && a?.user_id) {
    const subject = a?.address || a?.title || 'votre analyse';
    await insertNotification(
      supabaseAdmin,
      a.user_id,
      QUEUE_NOTIF_TITLE,
      `Pic d'activité — ${subject} sera prête sous peu`,
    );
  }

  // Alerte admin (info — c'est pas bloquant mais c'est utile à voir)
  await insertSystemAlert(supabaseAdmin, {
    type: 'overload',
    severity: 'warning',
    title: `Analyse mise en queue (tentative ${attempts}/${QUEUE_MAX_ATTEMPTS})`,
    message: `Le service Anthropic est surchargé. L'analyse a été mise en file d'attente.`,
    analyseId,
    userId: a?.user_id || undefined,
    metadata: { ...metadata, attempts, reason },
  });

  return { queued: true, userMessage: QUEUE_USER_MESSAGE };
}

// ══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) return new Response(JSON.stringify({ error: 'config_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // analyseId est défini en tout début de try pour pouvoir l'utiliser en cas d'erreur catch global
  let analyseIdForCatch: string | null = null;

  try {
    // ══════════════════════════════════════════════════════════
    // 🔒 AUTHENTIFICATION — vérification RÉELLE du jeton
    // Avant : on testait uniquement la PRÉSENCE du header, donc
    // "Authorization: Bearer nimportequoi" passait. On valide désormais
    // le JWT auprès de Supabase Auth.
    // ══════════════════════════════════════════════════════════
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    const jwt = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      console.warn('[analyser] 🚫 Jeton invalide ou expiré');
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const body = await req.json() as {
      analyseId: string; mode: string; profil: 'rp' | 'invest';
      typeBienDeclare?: 'appartement' | 'maison' | 'maison_copro' | 'indetermine' | null;
      storagePaths?: string[]; fileNames?: string[];
    };

    const { analyseId, mode, profil, typeBienDeclare } = body;
    if (!analyseId || !mode) return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    // ══════════════════════════════════════════════════════════
    // 🔒 PROPRIÉTÉ — l'appelant a-t-il le droit sur cette analyse ?
    // supabaseAdmin tourne en service_role : la RLS ne s'applique PAS.
    // Ce contrôle doit donc être fait à la main, sinon n'importe quel
    // compte connecté peut lancer une opération (dont un COMPLÉMENT,
    // qui réécrit le rapport) sur l'analyse de quelqu'un d'autre.
    //
    // ⚠️ Deux cas légitimes, et deux seulement :
    //   1. l'analyse lui appartient
    //   2. l'analyse appartient à un collègue de SA MÊME agence
    //      (les membres travaillent sur les dossiers partagés — ce
    //      comportement existe déjà, on ne le change pas ici)
    // ══════════════════════════════════════════════════════════
    const { data: owner } = await supabaseAdmin
      .from('analyses')
      .select('user_id')
      .eq('id', analyseId)
      .maybeSingle();

    if (!owner) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    if (owner.user_id !== user.id) {
      const { data: memberships } = await supabaseAdmin
        .from('agence_members')
        .select('user_id, agence_id')
        .in('user_id', [user.id, owner.user_id])
        .is('removed_at', null);

      const agenceAppelant = memberships?.find(m => m.user_id === user.id)?.agence_id ?? null;
      const agenceProprio = memberships?.find(m => m.user_id === owner.user_id)?.agence_id ?? null;

      if (!agenceAppelant || !agenceProprio || agenceAppelant !== agenceProprio) {
        console.warn(`[analyser] 🚫 user ${user.id} → analyse ${analyseId} (propriétaire ${owner.user_id})`);
        return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
      console.log(`[analyser] ✅ Accès agence ${agenceAppelant} — user ${user.id} sur l'analyse de ${owner.user_id}`);
    }

    // ══════════════════════════════════════════════════════════
    // 🔒 CHEMINS STORAGE — jamais confiance au navigateur
    // Le client construit ses chemins ainsi : `${analyseId}/${i}_${nom}`.
    // On impose ce préfixe. Sans ça, le body pouvait désigner les PDF
    // d'une autre analyse : ils étaient téléchargés en service_role
    // (fuite RGPD) puis SUPPRIMÉS par le .remove() plus bas.
    // ══════════════════════════════════════════════════════════
    if (body.storagePaths?.length) {
      const prefix = `${analyseId}/`;
      const invalides = body.storagePaths.filter(
        p => typeof p !== 'string' || !p.startsWith(prefix) || p.includes('..')
      );
      if (invalides.length) {
        console.warn(`[analyser] 🚫 Chemins hors analyse ${analyseId} : ${invalides.join(', ')}`);
        return new Response(JSON.stringify({ error: 'invalid_paths' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
    }

    analyseIdForCatch = analyseId;

    console.log(`[analyser] Requête — id:${analyseId} mode:${mode} typeDeclare:${typeBienDeclare || 'null'} docs:${body.storagePaths?.length || 0}`);

    // ══════════════════════════════════════════════════════════
    // MODE COMPLEMENT — Vérifications supplémentaires
    // ══════════════════════════════════════════════════════════
    let existingReport: Record<string, unknown> | null = null;
    let storedTypeBienDeclare: string | null = null;

    if (mode === 'complement') {
      const { data: analyse, error: fetchErr } = await supabaseAdmin
        .from('analyses')
        .select('result, regeneration_deadline, type, type_bien_declare, complement_date')
        .eq('id', analyseId)
        .single();

      if (fetchErr || !analyse?.result) {
        return new Response(JSON.stringify({ error: 'no_existing_report' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }

      // 🔒 One-shot SERVEUR : le front désactive déjà le bouton après un complément,
      // mais on refuse aussi ici tout second complément (anti-rejeu API direct).
      if (analyse.complement_date) {
        return new Response(JSON.stringify({ error: 'already_complemented' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }

      if (analyse.regeneration_deadline) {
        const deadline = new Date(analyse.regeneration_deadline);
        if (Date.now() > deadline.getTime()) {
          return new Response(JSON.stringify({ error: 'deadline_expired' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
        }
      }

      if (body.storagePaths && body.storagePaths.length > 5) {
        return new Response(JSON.stringify({ error: 'too_many_docs', max: 5 }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }

      existingReport = analyse.result as Record<string, unknown>;
      storedTypeBienDeclare = (analyse.type_bien_declare as string) || null;
      console.log(`[analyser] Mode complement — rapport existant trouvé (typeDeclare:${storedTypeBienDeclare || 'null'})`);
    }

    // Marquer en cours + stocker le type_bien déclaré s'il est fourni
    // 🆕 last_retry_at = tampon de "dernière activité" : le watchdog s'en sert pour NE PAS
    // tuer une analyse fraîchement (re)lancée sur une ligne ancienne (cas typique : un
    // COMPLÉMENT sur une analyse vieille de plusieurs jours matchait "processing > 1h"
    // via created_at et se faisait nettoyer en plein vol par le cron 15 min).
    const updateFields: Record<string, unknown> = { status: 'processing', mode, profil, last_retry_at: new Date().toISOString() };
    if (typeBienDeclare) updateFields.type_bien_declare = typeBienDeclare;
    await supabaseAdmin.from('analyses').update(updateFields).eq('id', analyseId);

    // ══════════════════════════════════════════════════════════
    // DOWNLOAD STORAGE + UPLOAD FILES API
    // ══════════════════════════════════════════════════════════
    const fileIds: Array<{ id: string; name: string }> = [];
    const documentsIgnores: string[] = [];
    const uploadErrors: UploadError[] = [];

    if (body.storagePaths?.length) {
      const total = body.storagePaths.length;
      await updateProgress(supabaseAdmin, analyseId, 0, total, `Envoi de ${total} document(s) en cours...`);

      for (let i = 0; i < body.storagePaths.length; i++) {
        const fileName = body.fileNames?.[i] || body.storagePaths[i].split('/').pop() || `doc_${i + 1}.pdf`;
        await updateProgress(supabaseAdmin, analyseId, i, total, `Envoi ${i + 1}/${total} : ${fileName}...`);

        const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).download(body.storagePaths[i]);
        if (error || !data) {
          console.error(`[analyser] Download échoué: ${body.storagePaths[i]}`);
          documentsIgnores.push(fileName);
          uploadErrors.push('other');
          continue;
        }

        const result = await uploadToFilesAPI(fileName, data, apiKey);

        if ('error' in result && result.error) {
          documentsIgnores.push(fileName);
          uploadErrors.push(result.error);
          continue;
        }

        fileIds.push({ id: result.id!, name: fileName });
      }

      // ══════════════════════════════════════════════════════════
      // 🆕 v9 — Si overload détecté → on GARDE les fichiers en Storage
      // pour permettre au cron analyser-retry de les retenter plus tard.
      // Sinon (succès ou erreur définitive) → on supprime comme avant.
      // ══════════════════════════════════════════════════════════
      const willEnqueue = uploadErrors.includes('overload') && fileIds.length === 0;
      if (!willEnqueue) {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(body.storagePaths);
      } else {
        // On stocke les paths en metadata pour que le cron retrouve les fichiers
        await supabaseAdmin.from('analyses').update({
          metadata_queue: {
            storagePaths: body.storagePaths,
            fileNames: body.fileNames || [],
            mode,
            profil,
            typeBienDeclare: typeBienDeclare || null,
            existingReport: existingReport || null,
          },
        }).eq('id', analyseId);
        console.log(`[analyser] 🟡 Overload — fichiers conservés en Storage pour retry (${body.storagePaths.length} fichiers)`);
      }
    }

    // ══════════════════════════════════════════════════════════
    // SI AUCUN FICHIER UPLOADÉ → Détecter la cause + handler
    // ══════════════════════════════════════════════════════════
    if (fileIds.length === 0) {
      // Détecter la cause dominante
      const hasOverload = uploadErrors.includes('overload');
      const hasRateLimit = uploadErrors.includes('rate_limit');
      const hasAuth = uploadErrors.includes('auth');

      if (hasAuth) {
        await handleAnalyseFailure(
          supabaseAdmin,
          analyseId,
          'api_billing',
          'Notre service rencontre un problème technique. Notre équipe est informée. Votre crédit a été remboursé automatiquement.',
          'Service indisponible (auth/quota)',
          'critical',
          { stage: 'upload', uploadErrors },
        );
      } else if (hasOverload) {
        // ══════════════════════════════════════════════════════════
        // 🆕 v9 — METTRE EN QUEUE au lieu de rembourser tout de suite
        // Le cron `analyser-retry` retentera toutes les 5 min pendant 1h
        // ══════════════════════════════════════════════════════════
        const queueResult = await tryEnqueueOrFail(
          supabaseAdmin,
          analyseId,
          'overload',
          { stage: 'upload', uploadErrors },
        );
        return new Response(JSON.stringify({
          error: queueResult.queued ? 'queued' : 'no_files_uploaded',
          queued: queueResult.queued,
          userMessage: queueResult.userMessage,
        }), { status: queueResult.queued ? 202 : 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      } else if (hasRateLimit) {
        await handleAnalyseFailure(
          supabaseAdmin,
          analyseId,
          'rate_limit',
          'Notre service est momentanément surchargé. Votre crédit a été remboursé automatiquement. Réessayez dans 2 à 3 minutes.',
          'Rate limit à l\'upload',
          'warning',
          { stage: 'upload', uploadErrors },
        );
      } else {
        // Vrai problème de PDF (400, fichiers corrompus, protégés)
        await handleAnalyseFailure(
          supabaseAdmin,
          analyseId,
          'no_files',
          'Aucun document n\'a pu être traité. Vérifiez que vos fichiers sont des PDF valides non protégés. Votre crédit a été remboursé automatiquement.',
          'Aucun fichier exploitable',
          'warning',
          { stage: 'upload', uploadErrors, documentsIgnores },
        );
      }

      return new Response(JSON.stringify({ error: 'no_files_uploaded' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // ══════════════════════════════════════════════════════════
    // SUCCÈS PARTIEL OU TOTAL — passer la main à analyser-run
    // ══════════════════════════════════════════════════════════
    await supabaseAdmin.from('analyses').update({
      status: 'files_ready',
      file_ids: fileIds,
      progress_current: fileIds.length,
      progress_total: fileIds.length,
      progress_message: mode === 'complement'
        ? `${fileIds.length} nouveau(x) document(s) prêts — mise à jour en cours...`
        : `${fileIds.length} document(s) prêts — analyse en cours...`,
    }).eq('id', analyseId);

    console.log(`[analyser] ${fileIds.length} fichiers uploadés → status=files_ready (ignorés: ${documentsIgnores.length})`);

    // Si certains fichiers ont été ignorés → log l'info en alerte info (non bloquante)
    if (documentsIgnores.length > 0) {
      const { data: analyseUser } = await supabaseAdmin
        .from('analyses')
        .select('user_id')
        .eq('id', analyseId)
        .single();
      await insertSystemAlert(supabaseAdmin, {
        type: 'no_files',
        severity: 'info',
        title: `${documentsIgnores.length} document(s) ignoré(s)`,
        message: `Certains fichiers n'ont pas pu être traités : ${documentsIgnores.join(', ')}. L'analyse continue avec les ${fileIds.length} document(s) restant(s).`,
        analyseId,
        userId: analyseUser?.user_id || undefined,
        metadata: { documentsIgnores, uploadErrors, partial: true },
      });
    }

    const effectiveTypeBienDeclare = mode === 'complement'
      ? storedTypeBienDeclare
      : (typeBienDeclare || null);

    const runUrl = `${supabaseUrl}/functions/v1/analyser-run`;
    const runPayload: Record<string, unknown> = {
      analyseId,
      fileIds,
      mode,
      profil,
      typeBienDeclare: effectiveTypeBienDeclare,
    };

    if (mode === 'complement' && existingReport) {
      runPayload.existingReport = existingReport;
      runPayload.complementDocNames = fileIds.map(f => f.name);
    }

    EdgeRuntime.waitUntil(
      fetch(runUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify(runPayload),
      })
        .then(r => console.log(`[analyser] analyser-run réponse HTTP: ${r.status}`))
        .catch(err => console.error('[analyser] Erreur appel analyser-run:', err))
    );

    console.log(`[analyser] analyser-run déclenché pour ${analyseId} (mode: ${mode}, typeDeclare: ${effectiveTypeBienDeclare})`);

    return new Response(JSON.stringify({ success: true, analyseId, filesUploaded: fileIds.length }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[analyser] Erreur globale:', err);

    // Tenter de logger une alerte + rembourser si possible
    if (analyseIdForCatch) {
      try {
        await handleAnalyseFailure(
          supabaseAdmin,
          analyseIdForCatch,
          'unexpected_error',
          'Erreur inattendue. Votre crédit a été remboursé automatiquement. Réessayez ou contactez le support.',
          'Erreur inattendue dans analyser',
          'critical',
          { stage: 'global_catch', error: String(err) },
        );
      } catch (innerErr) {
        console.error('[analyser] Erreur dans le catch global:', innerErr);
      }
    }

    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});

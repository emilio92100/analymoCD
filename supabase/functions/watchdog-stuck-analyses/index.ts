// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — watchdog-stuck-analyses (cron toutes les 15min)
//
// Surveille les analyses bloquées et les nettoie automatiquement :
//   • status='processing' depuis >1h    → failed + refund + notif
//   • status='files_ready' depuis >30min → failed + refund + notif
//   • status='queued' depuis >1h30      → failed + refund + notif
//
// Pourquoi : si une edge function crash (CPU exceeded, timeout,
// erreur réseau, etc.), l'analyse reste coincée à vie. L'UI affiche
// "En cours" éternellement et le crédit n'est jamais remboursé.
// Ce watchdog est le filet de sécurité universel qui garantit qu'un
// client ne sera JAMAIS bloqué plus de 1h sans réponse.
//
// Sécurité : appelable uniquement par pg_cron (x-cron-secret).
// Idempotent : si l'analyse a déjà été nettoyée entre-temps, no-op.
// Limite : 50 analyses traitées par exécution (anti-flood).
//
// v2 : couvre AUSSI la table `comparaisons` :
//   • status='processing' depuis >5min → failed + alerte admin
//   Pas de refund (les comparaisons ne consomment pas de crédit).
//   Le frontend affiche alors un bouton "Relancer" sur la ligne.
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SEUIL_PROCESSING_MIN = 60;      // 1h
const SEUIL_FILES_READY_MIN = 30;     // 30min
const SEUIL_QUEUED_MIN = 90;          // 1h30
const SEUIL_COMPARAISON_MIN = 5;      // 5min — une comparaison dure < 2min en temps normal
const MAX_ANALYSES_PAR_EXEC = 50;

// Message écrit dans progress_message quand un COMPLÉMENT coincé est nettoyé (rapport d'origine restauré).
// ⚠️ MIROIR EXACT : même chaîne dans analyser/index.ts et analyser-run/index.ts.
const COMPLEMENT_FAILED_MSG = 'La mise à jour du dossier n\'a pas abouti — votre rapport d\'origine est conservé. Vous pouvez réessayer via « Compléter mon dossier ».';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SupabaseClient = ReturnType<typeof createClient>;

interface StuckAnalyse {
  id: string;
  user_id: string;
  type: string;
  status: string;
  mode?: string | null;
  title: string | null;
  address: string | null;
  created_at: string;
  updated_at?: string;
}

// ══════════════════════════════════════════════════════════════
// REFUND — Logique copiée de analyser-run/index.ts (cohérence)
// ══════════════════════════════════════════════════════════════

async function refundCredit(
  analyse: StuckAnalyse,
  supabaseAdmin: SupabaseClient
): Promise<boolean> {
  try {
    // 🔒 Remboursement IDEMPOTENT centralisé (verrou analyses.credit_refunded) — jamais deux fois
    // (client + analyser-run + watchdog appellent la même fonction).
    const { data, error } = await supabaseAdmin.rpc('refund_analyse_credit', { p_analyse_id: analyse.id });
    if (error) {
      console.error(`[watchdog] Erreur refund_analyse_credit pour ${analyse.id}:`, error.message);
      return false;
    }
    if (data === true) {
      console.log(`[watchdog] ✅ Crédit remboursé (verrou) pour ${analyse.id}`);
      return true;
    }
    console.log(`[watchdog] Remboursement déjà effectué ou non applicable pour ${analyse.id}`);
    return false;
  } catch (err) {
    console.error(`[watchdog] Exception refund pour ${analyse.id}:`, err);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATION — Insert dans user_notifications (cloche)
// ══════════════════════════════════════════════════════════════

async function notifyUser(
  analyse: StuckAnalyse,
  refunded: boolean,
  supabaseAdmin: SupabaseClient
): Promise<void> {
  try {
    // Sujet NON trompeur : si l'analyse a planté avant d'extraire l'adresse, on ne nomme PAS
    // un seul fichier pour une analyse complète (ce serait trompeur) → libellé neutre "complète".
    const isComplete = analyse.type !== 'document';
    const subject = analyse.address
      ? `du bien « ${analyse.address} »`
      : (isComplete ? 'complète' : (analyse.title ? `du document « ${analyse.title} »` : ''));
    const refundMsg = refunded
      ? ' Votre crédit a été remboursé automatiquement.'
      : '';
    
    await supabaseAdmin.from('user_notifications').insert({
      user_id: analyse.user_id,
      title: 'Analyse non aboutie',
      message: `Nous sommes désolés, votre analyse${subject ? ' ' + subject : ''} n'a pas pu être finalisée à cause d'un incident technique.${refundMsg} Vous pouvez relancer une nouvelle analyse à tout moment.`,
    });
  } catch (err) {
    console.error(`[watchdog] Erreur insert user_notifications pour ${analyse.id}:`, err);
  }
}

// ══════════════════════════════════════════════════════════════
// ALERTE SYSTÈME — Pour que l'admin soit prévenu (filtre Cleanup)
// ══════════════════════════════════════════════════════════════

async function insertSystemAlert(
  supabaseAdmin: SupabaseClient,
  params: {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await supabaseAdmin.from('system_alerts').insert({
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      analyse_id: null,
      user_id: null,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error('[watchdog] insertSystemAlert error:', err);
  }
}

// ══════════════════════════════════════════════════════════════
// CLEANUP — Marquer failed + refund + notif pour une analyse
// ══════════════════════════════════════════════════════════════

async function cleanupAnalyse(
  analyse: StuckAnalyse,
  reason: string,
  ageMinutes: number,
  supabaseAdmin: SupabaseClient
): Promise<{ ok: boolean; refunded: boolean }> {
  console.log(`[watchdog] 🧹 Nettoyage analyse ${analyse.id} — status=${analyse.status}, mode=${analyse.mode || 'complete'}, âge=${ageMinutes}min`);

  // ══ CAS COMPLÉMENT COINCÉ : restaurer le rapport d'origine, AUCUN remboursement ══
  // Le complément est gratuit (le crédit d'origine a été légitimement consommé au premier succès)
  // et le rapport d'origine est toujours intact dans `result` → on rend le dossier consultable
  // au lieu de le passer en failed (ce qui le masquait côté front).
  // ⚠️ MIROIR : même logique dans analyser/index.ts et analyser-run/index.ts (handleAnalyseFailure).
  if (analyse.mode === 'complement') {
    console.log(`[watchdog] Raison interne du nettoyage ${analyse.id} (complément): ${reason}`);
    const { error: updateErr } = await supabaseAdmin
      .from('analyses')
      .update({
        status: 'completed',
        file_ids: [],
        progress_message: COMPLEMENT_FAILED_MSG,
      })
      .eq('id', analyse.id)
      .in('status', ['processing', 'files_ready', 'queued']); // idempotent : ne touche QUE si toujours bloquée

    if (updateErr) {
      console.error(`[watchdog] ❌ Erreur restauration complément pour ${analyse.id}:`, updateErr.message);
      return { ok: false, refunded: false };
    }

    try {
      await supabaseAdmin.from('user_notifications').insert({
        user_id: analyse.user_id,
        title: 'Mise à jour du dossier non aboutie',
        message: `L'ajout de documents à votre dossier${analyse.address ? ` « ${analyse.address} »` : ''} n'a pas abouti suite à un incident technique. Votre rapport d'origine est intact — vous pouvez réessayer via « Compléter mon dossier ».`,
      });
    } catch (err) {
      console.error(`[watchdog] Erreur notif complément pour ${analyse.id}:`, err);
    }

    return { ok: true, refunded: false };
  }

  // ══ CAS CLASSIQUE (comportement inchangé) ══
  // 1. Marquer en failed
  // 🔧 FIX : on écrit dans progress_message (colonne réellement présente et lue par le front),
  // PAS dans error_message qui n'existe pas dans la table → l'UPDATE plantait et l'analyse
  // restait bloquée à vie malgré le passage du watchdog. (reason loggé pour le debug interne)
  const errorMessage = `L'analyse n'a pas pu être finalisée (incident technique). Votre crédit a été remboursé automatiquement — vous pouvez relancer l'analyse.`;
  console.log(`[watchdog] Raison interne du nettoyage ${analyse.id}: ${reason}`);
  const { error: updateErr } = await supabaseAdmin
    .from('analyses')
    .update({
      status: 'failed',
      progress_message: errorMessage,
    })
    .eq('id', analyse.id)
    .in('status', ['processing', 'files_ready', 'queued']); // idempotent : ne touche QUE si pas déjà nettoyé

  if (updateErr) {
    console.error(`[watchdog] ❌ Erreur update status pour ${analyse.id}:`, updateErr.message);
    return { ok: false, refunded: false };
  }

  // 2. Rembourser le crédit
  const refunded = await refundCredit(analyse, supabaseAdmin);

  // 3. Notifier le client (cloche)
  await notifyUser(analyse, refunded, supabaseAdmin);

  return { ok: true, refunded };
}

// ══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // ── 1. Vérification du secret cron ──────────────────────────
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.warn('[watchdog] ⛔ Appel non autorisé');
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // ── 2. Setup Supabase ───────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`[watchdog] 🟢 Démarrage — seuils: processing=${SEUIL_PROCESSING_MIN}min, files_ready=${SEUIL_FILES_READY_MIN}min, queued=${SEUIL_QUEUED_MIN}min`);

  try {
    const now = Date.now();
    const processingThreshold = new Date(now - SEUIL_PROCESSING_MIN * 60 * 1000).toISOString();
    const filesReadyThreshold = new Date(now - SEUIL_FILES_READY_MIN * 60 * 1000).toISOString();
    const queuedThreshold = new Date(now - SEUIL_QUEUED_MIN * 60 * 1000).toISOString();

    // ── 3. Chercher les analyses bloquées ────────────────────
    // On utilise created_at comme référence (updated_at peut ne pas exister).
    // 🆕 Garde last_retry_at : `analyser` tamponne last_retry_at à chaque (re)lancement.
    // Sans cette garde, un COMPLÉMENT lancé sur une analyse ancienne (created_at > seuil)
    // était détecté "bloqué" dès le tick suivant du cron et tué en plein vol.
    // Une analyse n'est bloquée que si created_at ET last_retry_at (si présent) dépassent le seuil.
    const { data: stuck, error: queryErr } = await supabaseAdmin
      .from('analyses')
      .select('id, user_id, type, status, mode, title, address, created_at')
      .or(
        `and(status.eq.processing,created_at.lt.${processingThreshold},or(last_retry_at.is.null,last_retry_at.lt.${processingThreshold})),` +
        `and(status.eq.files_ready,created_at.lt.${filesReadyThreshold},or(last_retry_at.is.null,last_retry_at.lt.${filesReadyThreshold})),` +
        `and(status.eq.queued,created_at.lt.${queuedThreshold},or(last_retry_at.is.null,last_retry_at.lt.${queuedThreshold}))`
      )
      .limit(MAX_ANALYSES_PAR_EXEC);

    if (queryErr) {
      throw new Error(`Erreur requête analyses bloquées: ${queryErr.message}`);
    }

    const stuckAnalyses = (stuck || []) as StuckAnalyse[];
    console.log(`[watchdog] 📊 ${stuckAnalyses.length} analyse(s) bloquée(s) détectée(s)`);

    // ── 4. Traiter chacune ───────────────────────────────────
    // ⚠ PAS de return anticipé si 0 analyse : le nettoyage des
    // comparaisons (section 4bis) doit s'exécuter dans tous les cas.
    let nettoyees = 0;
    let remboursees = 0;
    let erreurs = 0;

    if (stuckAnalyses.length === 0) {
      console.log('[watchdog] ✨ Aucune analyse bloquée');
    }

    for (const analyse of stuckAnalyses) {
      const ageMs = now - new Date(analyse.created_at).getTime();
      const ageMin = Math.floor(ageMs / 60000);
      const reason = `status=${analyse.status} depuis ${ageMin}min`;

      const result = await cleanupAnalyse(analyse, reason, ageMin, supabaseAdmin);
      if (result.ok) {
        nettoyees++;
        if (result.refunded) remboursees++;
      } else {
        erreurs++;
      }
    }

    // ── 4bis. Comparaisons bloquées ───────────────────────────
    // Une comparaison prend < 2min en temps normal. Si status='processing'
    // depuis > 5min, l'edge function comparer a crashé/timeout → on marque
    // failed pour que le frontend arrête le spinner et propose "Relancer".
    let comparaisonsNettoyees = 0;
    try {
      const comparaisonThreshold = new Date(now - SEUIL_COMPARAISON_MIN * 60 * 1000).toISOString();
      const { data: stuckComps, error: compQueryErr } = await supabaseAdmin
        .from('comparaisons')
        .select('id, user_id, analyse_ids, updated_at')
        .eq('status', 'processing')
        .lt('updated_at', comparaisonThreshold)
        .limit(MAX_ANALYSES_PAR_EXEC);

      if (compQueryErr) {
        console.error('[watchdog] Erreur requête comparaisons bloquées:', compQueryErr.message);
      } else if (stuckComps && stuckComps.length > 0) {
        console.log(`[watchdog] 📊 ${stuckComps.length} comparaison(s) bloquée(s) détectée(s)`);
        const { error: compUpdateErr } = await supabaseAdmin
          .from('comparaisons')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .in('id', stuckComps.map(c => c.id))
          .eq('status', 'processing'); // idempotent : ne touche que si toujours bloquée

        if (compUpdateErr) {
          console.error('[watchdog] Erreur update comparaisons:', compUpdateErr.message);
        } else {
          comparaisonsNettoyees = stuckComps.length;
          await insertSystemAlert(supabaseAdmin, {
            type: 'cleanup_stuck_comparaisons',
            severity: 'warning',
            title: `Watchdog — ${comparaisonsNettoyees} comparaison(s) bloquée(s) nettoyée(s)`,
            message: `Le watchdog a marqué ${comparaisonsNettoyees} comparaison(s) en échec (processing > ${SEUIL_COMPARAISON_MIN}min). Les clients concernés voient maintenant un bouton "Relancer". Investiguer la cause racine (timeout comparer ?).`,
            metadata: {
              comparaisons: stuckComps.map(c => ({ id: c.id, user_id: c.user_id, analyse_ids: c.analyse_ids })),
            },
          });
        }
      } else {
        console.log('[watchdog] ✨ Aucune comparaison bloquée');
      }
    } catch (compErr) {
      console.error('[watchdog] Exception nettoyage comparaisons:', compErr);
    }

    // ── 5. Bilan ──────────────────────────────────────────────
    console.log(`[watchdog] 🎉 Bilan : ${nettoyees} nettoyées, ${remboursees} remboursées, ${erreurs} erreurs, ${comparaisonsNettoyees} comparaison(s)`);

    // ── 6. Alerte système si quelque chose a été nettoyé ────
    // (signe qu'il y a un bug en amont qu'il faut investiguer)
    if (nettoyees > 0) {
      await insertSystemAlert(supabaseAdmin, {
        type: 'cleanup_stuck_analyses',
        severity: nettoyees >= 5 ? 'critical' : 'warning',
        title: `Watchdog — ${nettoyees} analyse(s) bloquée(s) nettoyée(s)`,
        message: `Le watchdog a détecté et nettoyé ${nettoyees} analyse(s) bloquée(s). ${remboursees} crédit(s) remboursé(s) automatiquement. ${erreurs > 0 ? `${erreurs} erreur(s).` : ''} Voir logs pour détails et investiguer la cause racine.`,
        metadata: {
          nettoyees,
          remboursees,
          erreurs,
          analyse_ids: stuckAnalyses.map(a => a.id),
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      detectees: stuckAnalyses.length,
      nettoyees,
      remboursees,
      erreurs,
      comparaisons_nettoyees: comparaisonsNettoyees,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[watchdog] ⛔ Erreur globale:', err);

    await insertSystemAlert(supabaseAdmin, {
      type: 'cleanup_stuck_failure',
      severity: 'critical',
      title: 'Watchdog — échec d\'exécution',
      message: `Le watchdog a échoué : ${String(err)}. Aucun nettoyage n'a eu lieu. Vérifier les logs.`,
      metadata: { error: String(err) },
    });

    return new Response(JSON.stringify({ error: 'watchdog_failed', detail: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});

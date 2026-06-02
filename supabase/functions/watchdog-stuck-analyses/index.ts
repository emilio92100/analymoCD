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
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SEUIL_PROCESSING_MIN = 60;      // 1h
const SEUIL_FILES_READY_MIN = 30;     // 30min
const SEUIL_QUEUED_MIN = 90;          // 1h30
const MAX_ANALYSES_PAR_EXEC = 50;

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
  title: string | null;
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
    const creditType = analyse.type;
    if (creditType !== 'document' && creditType !== 'complete') {
      console.log(`[watchdog] Pas de remboursement pour type=${creditType} (analyse ${analyse.id})`);
      return false;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, credits_document, credits_complete')
      .eq('id', analyse.user_id)
      .single();

    if (!profile) {
      console.error(`[watchdog] Profil introuvable pour user ${analyse.user_id}`);
      return false;
    }

    // Branche PRO
    if ((profile as Record<string, unknown>).role === 'pro') {
      const { error: rpcErr } = await supabaseAdmin.rpc('refund_pro_credit', {
        p_user_id: analyse.user_id,
        p_credit_type: creditType,
      });
      if (rpcErr) {
        console.error(`[watchdog] refund_pro_credit error pour ${analyse.id}:`, rpcErr.message);
        return false;
      }
      console.log(`[watchdog] ✅ Crédit pro ${creditType} remboursé pour ${analyse.id}`);
      return true;
    }

    // Branche PARTICULIER
    const col = creditType === 'document' ? 'credits_document' : 'credits_complete';
    const current = (profile as Record<string, number>)[col] || 0;

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ [col]: current + 1 })
      .eq('id', analyse.user_id);

    if (error) {
      console.error(`[watchdog] Erreur update profile pour ${analyse.id}:`, error.message);
      return false;
    }

    console.log(`[watchdog] ✅ Crédit ${creditType} remboursé pour ${analyse.id}`);
    return true;
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
    const titleAnalyse = analyse.title || 'votre analyse';
    const refundMsg = refunded
      ? ' Votre crédit a été remboursé automatiquement.'
      : '';
    
    await supabaseAdmin.from('user_notifications').insert({
      user_id: analyse.user_id,
      title: 'Analyse non aboutie',
      message: `Nous sommes désolés, votre analyse "${titleAnalyse}" n'a pas pu être finalisée à cause d'un incident technique.${refundMsg} Vous pouvez relancer une nouvelle analyse à tout moment.`,
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
  console.log(`[watchdog] 🧹 Nettoyage analyse ${analyse.id} — status=${analyse.status}, âge=${ageMinutes}min`);

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
    // On utilise created_at comme référence (updated_at peut ne pas exister)
    const { data: stuck, error: queryErr } = await supabaseAdmin
      .from('analyses')
      .select('id, user_id, type, status, title, created_at')
      .or(
        `and(status.eq.processing,created_at.lt.${processingThreshold}),` +
        `and(status.eq.files_ready,created_at.lt.${filesReadyThreshold}),` +
        `and(status.eq.queued,created_at.lt.${queuedThreshold})`
      )
      .limit(MAX_ANALYSES_PAR_EXEC);

    if (queryErr) {
      throw new Error(`Erreur requête analyses bloquées: ${queryErr.message}`);
    }

    const stuckAnalyses = (stuck || []) as StuckAnalyse[];
    console.log(`[watchdog] 📊 ${stuckAnalyses.length} analyse(s) bloquée(s) détectée(s)`);

    if (stuckAnalyses.length === 0) {
      console.log('[watchdog] ✨ Rien à nettoyer');
      return new Response(JSON.stringify({
        success: true,
        detectees: 0,
        nettoyees: 0,
        remboursees: 0,
        erreurs: 0,
      }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // ── 4. Traiter chacune ───────────────────────────────────
    let nettoyees = 0;
    let remboursees = 0;
    let erreurs = 0;

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

    // ── 5. Bilan ──────────────────────────────────────────────
    console.log(`[watchdog] 🎉 Bilan : ${nettoyees} nettoyées, ${remboursees} remboursées, ${erreurs} erreurs`);

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

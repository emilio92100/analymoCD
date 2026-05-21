// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — cleanup-files-api (cron quotidien à 3h Paris)
//
// Garbage collector nocturne qui nettoie l'API Files Anthropic.
// Liste tous les fichiers du compte et supprime ceux qui ont
// plus de 24h (orphelins laissés par les bugs de suppression
// dans analyser / analyser-retry / analyser-run).
//
// Sécurité : la fonction ne peut être appelée que par le cron
// pg_cron (vérifie le header x-cron-secret) — sinon n'importe
// qui pourrait déclencher des suppressions massives.
//
// Limite : 500 suppressions par exécution (sécurité au cas où).
// Si plus de 500 orphelins existent, le reste sera nettoyé la
// nuit suivante.
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_FILES_URL = 'https://api.anthropic.com/v1/files';
const AI_VERSION = '2023-06-01';
const FILES_BETA = 'files-api-2025-04-14';

const SEUIL_HEURES = 24; // Un fichier doit avoir + de 24h pour être supprimé
const MAX_SUPPRESSIONS_PAR_EXEC = 500; // Sécurité anti-flood

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SupabaseClient = ReturnType<typeof createClient>;

interface FileEntry {
  id: string;
  filename: string;
  size_bytes: number;
  created_at: string;
}

interface ListResponse {
  data: FileEntry[];
  has_more: boolean;
  last_id?: string;
}

// ══════════════════════════════════════════════════════════════
// HELPER — Insertion d'alerte système (réutilisé d'analyser-retry)
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
    console.error('[cleanup-files-api] insertSystemAlert error:', err);
  }
}

// ══════════════════════════════════════════════════════════════
// LISTING — Récupère tous les fichiers (pagination automatique)
// ══════════════════════════════════════════════════════════════

async function listAllFiles(apiKey: string): Promise<FileEntry[]> {
  const allFiles: FileEntry[] = [];
  let after_id: string | undefined = undefined;
  let page = 0;
  const MAX_PAGES = 100; // Sécurité anti-boucle infinie (= 2000 fichiers max scannés)

  while (page < MAX_PAGES) {
    page++;
    const url = after_id
      ? `${ANTHROPIC_FILES_URL}?after_id=${after_id}`
      : ANTHROPIC_FILES_URL;

    const res = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': AI_VERSION,
        'anthropic-beta': FILES_BETA,
      },
    });

    if (!res.ok) {
      throw new Error(`Anthropic API listing failed: HTTP ${res.status}`);
    }

    const data = await res.json() as ListResponse;
    if (!data.data || data.data.length === 0) break;

    allFiles.push(...data.data);

    if (!data.has_more || !data.last_id) break;
    after_id = data.last_id;
  }

  return allFiles;
}

// ══════════════════════════════════════════════════════════════
// SUPPRESSION — Supprime un fichier de l'API Files Anthropic
// ══════════════════════════════════════════════════════════════

async function deleteFile(fileId: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${ANTHROPIC_FILES_URL}/${fileId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': AI_VERSION,
        'anthropic-beta': FILES_BETA,
      },
    });
    return res.ok;
  } catch (err) {
    console.error(`[cleanup-files-api] Erreur réseau suppression ${fileId}:`, err);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL — appelé par pg_cron toutes les nuits à 3h
// ══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // ── 1. Vérification du secret cron ──────────────────────────
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.warn('[cleanup-files-api] ⛔ Appel non autorisé (secret invalide)');
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // ── 2. Vérification de la clé Anthropic ─────────────────────
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('[cleanup-files-api] ⛔ ANTHROPIC_API_KEY manquante');
    return new Response(JSON.stringify({ error: 'config_error' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // ── 3. Setup Supabase (pour alertes en cas d'erreur) ────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`[cleanup-files-api] 🟢 Démarrage — seuil: ${SEUIL_HEURES}h, max: ${MAX_SUPPRESSIONS_PAR_EXEC}`);

  try {
    // ── 4. Lister tous les fichiers ───────────────────────────
    const allFiles = await listAllFiles(apiKey);
    console.log(`[cleanup-files-api] 📊 ${allFiles.length} fichier(s) trouvé(s) sur l'API Files`);

    if (allFiles.length === 0) {
      console.log('[cleanup-files-api] ✨ Rien à nettoyer — API Files vide');
      return new Response(JSON.stringify({
        success: true,
        total: 0,
        supprimes: 0,
        ignores: 0,
        erreurs: 0,
      }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // ── 5. Trier : trop vieux vs récents ──────────────────────
    const now = Date.now();
    const seuilMs = SEUIL_HEURES * 60 * 60 * 1000;
    const aSupprimer: FileEntry[] = [];
    const aIgnorer: FileEntry[] = [];

    for (const file of allFiles) {
      const ageMs = now - new Date(file.created_at).getTime();
      const ageHeures = Math.floor(ageMs / (60 * 60 * 1000));

      if (ageMs > seuilMs) {
        aSupprimer.push(file);
        console.log(`[cleanup-files-api] 🗑️  À supprimer (${ageHeures}h) : ${file.filename}`);
      } else {
        aIgnorer.push(file);
        console.log(`[cleanup-files-api] ⏭️  Ignoré (${ageHeures}h < ${SEUIL_HEURES}h) : ${file.filename}`);
      }
    }

    console.log(`[cleanup-files-api] 📋 Bilan tri : ${aSupprimer.length} à supprimer, ${aIgnorer.length} à conserver`);

    // ── 6. Appliquer la limite anti-flood ─────────────────────
    let cibles = aSupprimer;
    let depasseLimite = false;
    if (aSupprimer.length > MAX_SUPPRESSIONS_PAR_EXEC) {
      cibles = aSupprimer.slice(0, MAX_SUPPRESSIONS_PAR_EXEC);
      depasseLimite = true;
      console.warn(`[cleanup-files-api] ⚠️  ${aSupprimer.length} fichiers à supprimer dépasse la limite — on en traite ${MAX_SUPPRESSIONS_PAR_EXEC}, le reste sera traité la nuit suivante`);
    }

    // ── 7. Suppression séquentielle (1 par 1) ─────────────────
    let supprimes = 0;
    let erreurs = 0;

    for (const file of cibles) {
      const ok = await deleteFile(file.id, apiKey);
      if (ok) {
        supprimes++;
        console.log(`[cleanup-files-api] ✅ ${supprimes}/${cibles.length} — Supprimé : ${file.filename}`);
      } else {
        erreurs++;
        console.error(`[cleanup-files-api] ❌ Erreur suppression : ${file.filename} (${file.id})`);
      }
    }

    // ── 8. Bilan final ────────────────────────────────────────
    console.log(`[cleanup-files-api] 🎉 Terminé : ${supprimes} supprimés / ${aIgnorer.length} ignorés / ${erreurs} erreurs`);

    // ── 9. Alerte système UNIQUEMENT si problème ──────────────
    if (erreurs > 0) {
      await insertSystemAlert(supabaseAdmin, {
        type: 'cleanup_error',
        severity: 'warning',
        title: `GC nocturne — ${erreurs} échec(s) de suppression`,
        message: `Le garbage collector a rencontré ${erreurs} erreur(s) sur ${cibles.length} suppression(s). Total : ${supprimes} fichiers nettoyés. Vérifier les logs.`,
        metadata: { supprimes, erreurs, ignores: aIgnorer.length, total: allFiles.length },
      });
    }

    if (depasseLimite) {
      await insertSystemAlert(supabaseAdmin, {
        type: 'cleanup_overflow',
        severity: 'info',
        title: `GC nocturne — ${aSupprimer.length} orphelins détectés (limite ${MAX_SUPPRESSIONS_PAR_EXEC})`,
        message: `Le garbage collector a détecté ${aSupprimer.length} orphelins mais n'en a traité que ${MAX_SUPPRESSIONS_PAR_EXEC} (limite par exécution). Le reste sera nettoyé les nuits suivantes.`,
        metadata: { detectes: aSupprimer.length, traites: cibles.length, restants: aSupprimer.length - cibles.length },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      total: allFiles.length,
      supprimes,
      ignores: aIgnorer.length,
      erreurs,
      depasse_limite: depasseLimite,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[cleanup-files-api] ⛔ Erreur globale:', err);

    // Alerte critique en cas d'échec total
    await insertSystemAlert(supabaseAdmin, {
      type: 'cleanup_failure',
      severity: 'critical',
      title: 'GC nocturne — échec complet',
      message: `Le garbage collector a échoué : ${String(err)}. Aucun fichier n'a été nettoyé cette nuit. Vérifier les logs et la connectivité Anthropic.`,
      metadata: { error: String(err) },
    });

    return new Response(JSON.stringify({ error: 'cleanup_failed', detail: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});

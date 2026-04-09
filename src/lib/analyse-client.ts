/* ══════════════════════════════════════════════════════════════
   ANALYSE CLIENT — Upload Storage + Appel Edge Function
   
   ARCHITECTURE :
   1. Les PDFs sont uploadés dans un bucket Storage privé Supabase
   2. L'Edge Function récupère les PDFs directement depuis Storage
      et les envoie à Claude en natif (comme dans le chat Claude.ai)
   3. Les fichiers sont supprimés du Storage dès l'analyse terminée
   
   AVANTAGES vs base64-dans-JSON :
   - Aucune limite de taille (vs 5.5 Mo avant)
   - Les PDFs arrivent à Claude sans transformation → même qualité
     que lorsqu'on colle les docs directement dans le chat
   - RGPD : suppression automatique après analyse
   ══════════════════════════════════════════════════════════════ */

import { supabase } from './supabase';

const EDGE_FUNCTION_URL = 'https://veszrayromldfgetqaxb.supabase.co/functions/v1/analyser';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk';
const STORAGE_BUCKET = 'analyse-temp';

export type AnalyseMode = 'complete' | 'document' | 'apercu_complete' | 'apercu_document';

export type AnalyseProgress = {
  step: 'extracting' | 'analysing' | 'reducing' | 'done' | 'error';
  current: number;
  total: number;
  percent: number;
  message: string;
};

export type AnalyseClientResult = {
  success: boolean;
  analyseId?: string;
  error?: 'rate_limit' | 'overload' | 'network' | 'unknown';
  errorMessage?: string;
};

export async function lancerAnalyseEdge(params: {
  files: File[];
  mode: AnalyseMode;
  analyseId: string;
  profil: 'rp' | 'invest';
  onProgress?: (p: AnalyseProgress) => void;
}): Promise<AnalyseClientResult> {
  const { files, mode, analyseId, profil, onProgress } = params;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'unknown', errorMessage: 'Session expirée' };

    onProgress?.({ step: 'extracting', current: 0, total: files.length, percent: 5, message: 'Préparation des documents…' });

    // ── Upload PDFs dans Storage ──────────────────────────────
    const storagePaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      onProgress?.({
        step: 'extracting',
        current: i + 1,
        total: files.length,
        percent: 5 + Math.floor((i / files.length) * 25),
        message: `Upload document ${i + 1}/${files.length}…`,
      });

      const safeName = files[i].name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${analyseId}/${i}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, files[i], { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        console.error('[Verimo] Erreur upload Storage:', uploadError);
        await nettoyerStorage(analyseId);
        return {
          success: false,
          error: 'unknown',
          errorMessage: `Impossible d'envoyer "${files[i].name}". Vérifiez votre connexion et réessayez.`,
        };
      }

      storagePaths.push(storagePath);
    }

    onProgress?.({ step: 'analysing', current: 0, total: files.length, percent: 32, message: 'Envoi au moteur d\'analyse…' });

    // ── Appel Edge Function avec chemins Storage ──────────────
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ analyseId, mode, profil, storagePaths, fileNames: files.map(f => f.name) }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Verimo] Erreur Edge Function HTTP', res.status, errText);
      await nettoyerStorage(analyseId);

      if (res.status === 429 || errText.includes('rate_limit')) {
        return { success: false, error: 'rate_limit', errorMessage: 'Notre moteur est momentanément surchargé. Votre crédit a été remboursé automatiquement. Réessayez dans 2 à 3 minutes.' };
      }
      if (res.status === 529 || res.status === 503) {
        return { success: false, error: 'overload', errorMessage: 'Notre moteur est temporairement indisponible. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.' };
      }
      return { success: false, error: 'unknown', errorMessage: 'Une erreur est survenue. Votre crédit a été remboursé automatiquement.' };
    }

    const data = await res.json();

    if (data.error) {
      await nettoyerStorage(analyseId);
      return {
        success: false,
        error: data.error === 'rate_limit' ? 'rate_limit' : 'unknown',
        errorMessage: data.message || 'Une erreur est survenue. Votre crédit a été remboursé automatiquement.',
      };
    }

    onProgress?.({ step: 'done', current: files.length, total: files.length, percent: 100, message: 'Rapport prêt !' });
    return { success: true, analyseId };

  } catch (err) {
    console.error('[Verimo] Erreur réseau:', err);
    try { await nettoyerStorage(analyseId); } catch { /* silencieux */ }
    return { success: false, error: 'network', errorMessage: 'Problème de connexion. Votre crédit a été remboursé automatiquement. Vérifiez votre connexion internet et réessayez.' };
  }
}

async function nettoyerStorage(analyseId: string): Promise<void> {
  try {
    const { data: fichiers } = await supabase.storage.from(STORAGE_BUCKET).list(analyseId);
    if (fichiers && fichiers.length > 0) {
      const paths = fichiers.map(f => `${analyseId}/${f.name}`);
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    }
  } catch (err) {
    console.warn('[Verimo] Nettoyage Storage échoué (non bloquant):', err);
  }
}

export async function pollAnalyseStatus(params: {
  analyseId: string;
  onProgress?: (p: AnalyseProgress) => void;
  timeoutMs?: number;
}): Promise<{ status: 'completed' | 'failed' | 'timeout' }> {
  const { analyseId, onProgress, timeoutMs = 180_000 } = params;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000));

    const { data } = await supabase
      .from('analyses')
      .select('status, progress_current, progress_total, progress_message')
      .eq('id', analyseId)
      .single();

    if (!data) continue;

    if (onProgress && data.progress_total) {
      const percent = data.progress_current
        ? Math.min(90, 30 + Math.floor((data.progress_current / data.progress_total) * 60))
        : 50;
      onProgress({ step: 'analysing', current: data.progress_current || 0, total: data.progress_total || 1, percent, message: data.progress_message || 'Analyse en cours…' });
    }

    if (data.status === 'completed') return { status: 'completed' };
    if (data.status === 'failed') return { status: 'failed' };
  }

  return { status: 'timeout' };
}

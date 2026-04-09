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

    // ── 1. Upload PDFs dans Storage ───────────────────────────
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
        return { success: false, error: 'unknown', errorMessage: `Impossible d'envoyer "${files[i].name}". Vérifiez votre connexion et réessayez.` };
      }

      storagePaths.push(storagePath);
    }

    onProgress?.({ step: 'analysing', current: 0, total: files.length, percent: 30, message: 'Lancement de l\'analyse…' });

    // ── 2. Déclencher l'Edge Function (fire & forget — pas d'await sur la réponse longue) ──
    // On utilise fetch avec un timeout court juste pour vérifier que la fonction démarre.
    // L'Edge Function travaille en arrière-plan, on poll Supabase pour le résultat.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10s max pour démarrer

    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ analyseId, mode, profil, storagePaths, fileNames: files.map(f => f.name) }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Si la fonction répond rapidement avec une erreur (ex: 400, 401, 500 immédiat)
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[Verimo] Erreur Edge Function HTTP', res.status, errText);
        if (res.status === 429 || errText.includes('rate_limit')) {
          return { success: false, error: 'rate_limit', errorMessage: 'Notre moteur est momentanément surchargé. Votre crédit a été remboursé automatiquement. Réessayez dans 2 à 3 minutes.' };
        }
        if (res.status === 529 || res.status === 503) {
          return { success: false, error: 'overload', errorMessage: 'Notre moteur est temporairement indisponible. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.' };
        }
        // Pour les autres erreurs HTTP, on continue quand même le polling
        // car Supabase peut couper la connexion même si la fonction tourne encore
        console.warn('[Verimo] HTTP error mais on poll quand même:', res.status);
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      // AbortError = timeout ou coupure réseau — l'Edge Function tourne probablement encore
      // On continue vers le polling
      console.warn('[Verimo] Fetch interrompu (timeout ou réseau), on poll Supabase:', fetchErr);
    }

    // ── 3. Polling jusqu'au résultat ──────────────────────────
    onProgress?.({ step: 'analysing', current: 1, total: files.length, percent: 40, message: 'Analyse en cours…' });

    const pollResult = await pollAnalyseStatus({
      analyseId,
      onProgress: (p) => onProgress?.(p),
      timeoutMs: 720_000, // 12 minutes max (Map-Reduce 8 docs ~8 min)
    });

    if (pollResult.status === 'completed') {
      onProgress?.({ step: 'done', current: files.length, total: files.length, percent: 100, message: 'Rapport prêt !' });
      return { success: true, analyseId };
    }

    if (pollResult.status === 'failed') {
      return { success: false, error: 'unknown', errorMessage: 'Une erreur est survenue lors de l\'analyse. Votre crédit a été remboursé automatiquement.' };
    }

    // timeout
    return { success: false, error: 'unknown', errorMessage: 'L\'analyse a pris trop de temps. Votre crédit a été remboursé automatiquement. Réessayez avec moins de documents.' };

  } catch (err) {
    console.error('[Verimo] Erreur inattendue:', err);
    return { success: false, error: 'network', errorMessage: 'Problème de connexion. Votre crédit a été remboursé automatiquement.' };
  }
}

export async function pollAnalyseStatus(params: {
  analyseId: string;
  onProgress?: (p: AnalyseProgress) => void;
  timeoutMs?: number;
}): Promise<{ status: 'completed' | 'failed' | 'timeout' }> {
  const { analyseId, onProgress, timeoutMs = 720_000 } = params;
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
        ? Math.min(90, 40 + Math.floor((data.progress_current / data.progress_total) * 50))
        : 55;
      onProgress({
        step: 'analysing',
        current: data.progress_current || 0,
        total: data.progress_total || 1,
        percent,
        message: data.progress_message || 'Analyse en cours…',
      });
    }

    if (data.status === 'completed') return { status: 'completed' };
    if (data.status === 'failed') return { status: 'failed' };
  }

  return { status: 'timeout' };
}

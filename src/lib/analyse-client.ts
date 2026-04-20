import { supabase } from './supabase';

const EDGE_FUNCTION_URL = 'https://veszrayromldfgetqaxb.supabase.co/functions/v1/analyser';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk';
const STORAGE_BUCKET = 'analyse-temp';

export type AnalyseMode = 'complete' | 'document' | 'apercu_complete' | 'apercu_document' | 'complement';
export type TypeBienDeclare = 'appartement' | 'maison' | 'maison_copro' | 'indetermine';

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
  typeBienDeclare?: TypeBienDeclare | null;
  onProgress?: (p: AnalyseProgress) => void;
}): Promise<AnalyseClientResult> {
  const { files, mode, analyseId, profil, typeBienDeclare, onProgress } = params;

  try {
    // Tenter getSession, puis getUser en fallback (mobile Safari peut perdre la session localStorage)
    let session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      // Forcer un refresh du token
      const { data: refreshData } = await supabase.auth.refreshSession();
      session = refreshData.session;
    }
    if (!session) {
      // Dernier recours : rediriger vers connexion
      if (typeof window !== 'undefined') window.location.href = '/connexion?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      return { success: false, error: 'unknown', errorMessage: 'Session expirée. Reconnectez-vous et réessayez.' };
    }

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

      // Sur mobile (iOS Files app, Google Drive), le fichier peut être un pointeur cloud
      // pas encore téléchargé localement → on force la lecture complète en mémoire d'abord
      let fileToUpload: File | Blob = files[i];
      try {
        const arrayBuffer = await files[i].arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          console.error('[Verimo] Fichier vide après lecture:', files[i].name);
          return { success: false, error: 'unknown', errorMessage: `Le fichier "${files[i].name}" semble vide ou inaccessible. Vérifiez qu'il est bien téléchargé sur votre appareil avant de l'uploader.` };
        }
        fileToUpload = new Blob([arrayBuffer], { type: 'application/pdf' });
      } catch (readErr) {
        console.error('[Verimo] Impossible de lire le fichier:', files[i].name, readErr);
        return { success: false, error: 'unknown', errorMessage: `Impossible de lire "${files[i].name}". Sur mobile, assurez-vous que le fichier est téléchargé localement (pas dans le cloud).` };
      }

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileToUpload, { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        console.error('[Verimo] Erreur upload Storage:', uploadError);
        return { success: false, error: 'unknown', errorMessage: `Impossible d'envoyer "${files[i].name}". Vérifiez votre connexion et réessayez.` };
      }

      storagePaths.push(storagePath);
    }

    onProgress?.({ step: 'analysing', current: 0, total: files.length, percent: 30, message: 'Lancement de l\'analyse…' });

    // ── 2. Déclencher l'Edge Function (fire & forget — pas d'await sur la réponse longue) ──
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
        body: JSON.stringify({
          analyseId,
          mode,
          profil,
          typeBienDeclare: typeBienDeclare || null,
          storagePaths,
          fileNames: files.map(f => f.name),
        }),
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
      console.warn('[Verimo] Fetch interrompu (timeout ou réseau), on poll Supabase:', fetchErr);
    }

    // ── 3. Polling jusqu'au résultat ──────────────────────────
    onProgress?.({ step: 'analysing', current: 1, total: files.length, percent: 40, message: 'Analyse en cours…' });

    const pollResult = await pollAnalyseStatus({
      analyseId,
      onProgress: (p) => onProgress?.(p),
      timeoutMs: 600_000, // 10 minutes max
    });

    if (pollResult.status === 'completed') {
      onProgress?.({ step: 'done', current: files.length, total: files.length, percent: 100, message: 'Rapport prêt !' });
      return { success: true, analyseId };
    }

    if (pollResult.status === 'failed') {
      const msg = pollResult.errorMessage || 'Une erreur est survenue lors de l\'analyse. Votre crédit a été remboursé automatiquement.';
      return { success: false, error: 'unknown', errorMessage: msg };
    }

    // timeout — l'analyse a duré trop longtemps
    return {
      success: false,
      error: 'unknown',
      errorMessage: files.length > 8
        ? `L'analyse de ${files.length} documents a pris trop de temps. Réessayez avec 8 documents maximum pour de meilleurs résultats. Votre crédit a été remboursé.`
        : 'L\'analyse a pris trop de temps. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.',
    };

  } catch (err) {
    console.error('[Verimo] Erreur inattendue:', err);
    return {
      success: false,
      error: 'network',
      errorMessage: 'Connexion interrompue pendant l\'analyse. Vérifiez votre connexion internet et réessayez. Votre crédit a été remboursé automatiquement.',
    };
  }
}

export async function pollAnalyseStatus(params: {
  analyseId: string;
  onProgress?: (p: AnalyseProgress) => void;
  timeoutMs?: number;
}): Promise<{ status: 'completed' | 'failed' | 'timeout'; errorMessage?: string }> {
  const { analyseId, onProgress, timeoutMs = 600_000 } = params;
  const start = Date.now();
  let lastMessage = '';
  let lastMessageTime = Date.now();

  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000));

    const { data } = await supabase
      .from('analyses')
      .select('status, progress_current, progress_total, progress_message')
      .eq('id', analyseId)
      .single();

    if (!data) continue;

    // Détecter stagnation : même message depuis >3min = Edge Function morte
    if (data.progress_message && data.progress_message !== lastMessage) {
      lastMessage = data.progress_message;
      lastMessageTime = Date.now();
    }
    const stagnationMs = Date.now() - lastMessageTime;
    // Ne jamais forcer failed si Claude est en train de répondre
    // Laisser 15 minutes pour les gros dossiers (analyser-run tourne en background)
    const stagnationLimit = 900_000; // 15 minutes
    if (stagnationMs > stagnationLimit && data.status !== 'completed') {
      const msg = 'L\'analyse a pris trop de temps. Votre crédit a été remboursé. Réessayez si le problème persiste.';
      await supabase.from('analyses').update({ status: 'failed', progress_message: msg }).eq('id', analyseId);
      return { status: 'failed', errorMessage: msg };
    }

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
    if (data.status === 'failed') return { status: 'failed', errorMessage: data.progress_message || undefined };
    // files_ready = fichiers uploadés, webhook en route → afficher progression spécifique
    if (data.status === 'files_ready') {
      onProgress?.({ step: 'analysing', current: data.progress_current || 0, total: data.progress_total || 1, percent: 60, message: 'Documents prêts — analyse en cours...' });
    }
  }

  return { status: 'timeout' };
}

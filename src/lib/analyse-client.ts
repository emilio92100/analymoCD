/* ══════════════════════════════════════════════════════════════
   ANALYSE CLIENT — Appel Edge Function + Polling
   Remplace les appels directs à l'API Anthropic depuis le frontend.
   La clé API reste côté serveur (Edge Function Supabase).
   ══════════════════════════════════════════════════════════════ */

import { supabase } from './supabase';

const EDGE_FUNCTION_URL = 'https://veszrayromldfgetqaxb.supabase.co/functions/v1/analyser';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk';

export type AnalyseMode = 'complete' | 'document' | 'apercu_complete' | 'apercu_document';

export type AnalyseProgress = {
  step: 'extracting' | 'analysing' | 'reducing' | 'done' | 'error';
  current: number;   // document en cours
  total: number;     // total documents
  percent: number;
  message: string;
};

export type AnalyseClientResult = {
  success: boolean;
  analyseId?: string;
  error?: 'rate_limit' | 'overload' | 'network' | 'unknown';
  errorMessage?: string;
};

/**
 * Lance une analyse via l'Edge Function Supabase.
 * Les fichiers sont convertis en base64 et envoyés au serveur.
 * La clé Anthropic ne transite jamais par le navigateur.
 */
export async function lancerAnalyseEdge(params: {
  files: File[];
  mode: AnalyseMode;
  analyseId: string;
  profil: 'rp' | 'invest';
  onProgress?: (p: AnalyseProgress) => void;
}): Promise<AnalyseClientResult> {
  const { files, mode, analyseId, profil, onProgress } = params;

  try {
    // Récupérer la session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'unknown', errorMessage: 'Session expirée' };

    // Notifier extraction en cours
    onProgress?.({
      step: 'extracting',
      current: 0,
      total: files.length,
      percent: 5,
      message: 'Préparation des documents…',
    });

    // Convertir les fichiers en base64
    const filesB64: { name: string; data: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      onProgress?.({
        step: 'extracting',
        current: i + 1,
        total: files.length,
        percent: 5 + Math.floor((i / files.length) * 20),
        message: `Lecture document ${i + 1}/${files.length}…`,
      });

      const b64 = await fileToBase64(files[i]);
      filesB64.push({ name: files[i].name, data: b64 });
    }

    // Vérifier la taille totale avant envoi (limite Supabase ~6 MB par requête)
    const totalSizeMB = filesB64.reduce((acc, f) => acc + f.data.length * 0.75 / 1024 / 1024, 0);
    if (totalSizeMB > 5.5) {
      return {
        success: false,
        error: 'unknown',
        errorMessage: `Vos documents totalisent ${totalSizeMB.toFixed(1)} Mo, ce qui dépasse la limite de traitement (5,5 Mo). Réduisez le nombre de fichiers ou utilisez des PDFs plus légers.`,
      };
    }

    onProgress?.({
      step: 'analysing',
      current: 0,
      total: files.length,
      percent: 28,
      message: 'Envoi au moteur d\'analyse…',
    });

    // Appel Edge Function
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
        files: filesB64,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();

      // Rate limit Anthropic
      if (res.status === 429 || errText.includes('rate_limit')) {
        return {
          success: false,
          error: 'rate_limit',
          errorMessage: 'Notre moteur est momentanément surchargé. Votre crédit a été remboursé automatiquement. Réessayez dans 2 à 3 minutes.',
        };
      }

      // Surcharge serveur
      if (res.status === 529 || res.status === 503) {
        return {
          success: false,
          error: 'overload',
          errorMessage: 'Notre moteur est temporairement indisponible. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.',
        };
      }

      return {
        success: false,
        error: 'unknown',
        errorMessage: 'Une erreur est survenue. Votre crédit a été remboursé automatiquement.',
      };
    }

    const data = await res.json();

    if (data.error) {
      return {
        success: false,
        error: data.error === 'rate_limit' ? 'rate_limit' : 'unknown',
        errorMessage: data.message || 'Une erreur est survenue. Votre crédit a été remboursé automatiquement.',
      };
    }

    onProgress?.({
      step: 'done',
      current: files.length,
      total: files.length,
      percent: 100,
      message: 'Rapport prêt !',
    });

    return { success: true, analyseId };

  } catch {
    return {
      success: false,
      error: 'network',
      errorMessage: 'Problème de connexion. Votre crédit a été remboursé automatiquement. Vérifiez votre connexion internet et réessayez.',
    };
  }
}

/**
 * Polling sur le statut d'une analyse en base Supabase.
 * Vérifie toutes les 3 secondes jusqu'à completed ou failed.
 */
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

    // Mettre à jour la progression si disponible
    if (onProgress && data.progress_total) {
      const percent = data.progress_current
        ? Math.min(90, 30 + Math.floor((data.progress_current / data.progress_total) * 60))
        : 50;

      onProgress({
        step: 'analysing',
        current: data.progress_current || 0,
        total: data.progress_total || 1,
        percent,
        message: data.progress_message || `Analyse en cours…`,
      });
    }

    if (data.status === 'completed') return { status: 'completed' };
    if (data.status === 'failed') return { status: 'failed' };
  }

  return { status: 'timeout' };
}

// ─── Helpers ─────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res((reader.result as string).split(',')[1]);
    reader.onerror = () => rej(new Error('Lecture impossible'));
    reader.readAsDataURL(file);
  });
}

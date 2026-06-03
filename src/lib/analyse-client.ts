import { supabase } from './supabase';

const EDGE_FUNCTION_URL = 'https://veszrayromldfgetqaxb.supabase.co/functions/v1/analyser';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk';
const STORAGE_BUCKET = 'analyse-temp';

export type AnalyseMode = 'complete' | 'document' | 'complement';
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
  // 🆕 v9 — Si l'analyse a été mise en queue suite à une surcharge
  queued?: boolean;
  queuedMessage?: string;
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

      // 🆕 v9 — Mise en queue suite à surcharge Anthropic
      console.log('[VERIMO-DEBUG] Réponse fetch initial — status:', res.status);
      if (res.status === 202) {
        try {
          const data = await res.json();
          console.log('[VERIMO-DEBUG] HTTP 202 reçu, body:', data);
          if (data.queued === true) {
            console.log('[VERIMO-DEBUG] ✅ Return queued depuis fetch initial');
            return {
              success: false,
              queued: true,
              queuedMessage: data.userMessage || '⏳ Votre dossier a bien été reçu. Notre service connaît un pic d\'activité — votre analyse sera prête sous quelques minutes. Vous pouvez fermer cette page en toute tranquillité, nous vous prévenons par email dès que c\'est terminé.',
              analyseId,
            };
          }
        } catch (e) {
          console.warn('[Verimo] Erreur parsing 202:', e);
        }
      }

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
      timeoutMs: 1_200_000, // 20 minutes max (MAP-REDUCE découpé peut être long sur gros dossiers)
    });

    if (pollResult.status === 'completed') {
      onProgress?.({ step: 'done', current: files.length, total: files.length, percent: 100, message: 'Rapport prêt !' });
      return { success: true, analyseId };
    }

    // 🆕 v9 — Si l'analyse a été mise en queue pendant le polling
    if (pollResult.status === 'queued') {
      console.log('[VERIMO-DEBUG] ✅ pollResult.status=queued — return queued au composant React');
      return {
        success: false,
        queued: true,
        queuedMessage: pollResult.errorMessage || '⏳ Votre dossier a bien été reçu. Notre service connaît un pic d\'activité — votre analyse sera prête sous quelques minutes. Vous pouvez fermer cette page en toute tranquillité, nous vous prévenons par email dès que c\'est terminé.',
        analyseId,
      };
    }

    if (pollResult.status === 'failed') {
      const msg = pollResult.errorMessage || 'Une erreur est survenue lors de l\'analyse. Votre crédit a été remboursé automatiquement.';
      return { success: false, error: 'unknown', errorMessage: msg };
    }

    // timeout — l'analyse a duré trop longtemps côté front, mais elle continue côté serveur
    // On affiche un message rassurant : la cloche s'allumera quand le rapport sera prêt.
    return {
      success: false,
      // 🆕 On considère ça comme un "queued" UX : pas d'erreur, juste prévenir que ça continue
      queued: true,
      queuedMessage: '⏳ Votre analyse prend plus de temps que prévu. Pas d\'inquiétude, elle continue en arrière-plan. Vous pouvez fermer cette page — nous vous prévenons dans votre cloche 🔔 dès qu\'elle est prête.',
      analyseId,
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
}): Promise<{ status: 'completed' | 'failed' | 'timeout' | 'queued'; errorMessage?: string }> {
  const { analyseId, onProgress, timeoutMs = 1_200_000 } = params;
  const start = Date.now();
  let lastMessage = '';
  let lastMessageTime = Date.now();
  let analysingStart: number | null = null; // moment où on entre en phase analyse IA

  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000));

    const { data } = await supabase
      .from('analyses')
      .select('status, progress_current, progress_total, progress_message')
      .eq('id', analyseId)
      .single();

    if (!data) {
      console.log('[VERIMO-DEBUG] Polling tick — data null/empty, on continue');
      continue;
    }

    console.log('[VERIMO-DEBUG] Polling tick — status reçu:', data.status, '— message:', data.progress_message);

    // ── Le statut en base est la SEULE source de vérité ──
    // Si le backend (edge function ou watchdog) a marqué l'analyse failed, on le
    // reflète. Le frontend ne DÉCIDE JAMAIS d'un échec lui-même : avec le MAP-REDUCE
    // découpé, une analyse peut rester longtemps en 'processing' tout en étant vivante
    // côté serveur. Marquer un faux 'failed' depuis le navigateur créait l'incohérence
    // "Non généré" alors que le rapport finissait par arriver.
    if (data.status === 'failed') {
      return { status: 'failed', errorMessage: data.progress_message || undefined };
    }

    // Suivi de la fraîcheur du message (UX uniquement, ne force plus aucun échec).
    if (data.progress_message && data.progress_message !== lastMessage) {
      lastMessage = data.progress_message;
      lastMessageTime = Date.now();
    }
    const stagnationMs = Date.now() - lastMessageTime;
    // Stagnation prolongée : on NE force PAS failed (le backend/watchdog s'en charge).
    // On bascule en mode "queued" rassurant : l'analyse continue en arrière-plan,
    // le client sera prévenu par la cloche + email.
    const stagnationLimit = 900_000; // 15 minutes
    if (stagnationMs > stagnationLimit && data.status !== 'completed') {
      return { status: 'queued' };
    }

    // ── Calcul du % de progression ──────────────────────────────
    // Phase 1 (50-60%) : files_ready, Claude va démarrer
    // Phase 2 (60-90%) : progression simulée sur le temps écoulé en analyse IA
    //   (car progress_current n'est pas mis à jour pendant l'appel Claude)
    // L'analyse IA prend typiquement 60 à 180s, on étale 60→90% sur 180s max.
    if (onProgress && data.progress_total) {
      // On considère qu'on est en phase analyse IA dès que status=files_ready ou progress_message change après upload
      const isAnalysingPhase = data.status === 'files_ready' || (data.progress_message && data.progress_message !== 'Upload des documents…');
      if (isAnalysingPhase && analysingStart === null) {
        analysingStart = Date.now();
      }

      let percent: number;
      if (data.progress_current && data.progress_current > 0) {
        // Cas normal : progress_current remonte (fin d'analyse)
        percent = Math.min(90, 40 + Math.floor((data.progress_current / data.progress_total) * 50));
      } else if (analysingStart) {
        // Cas analyse IA en cours : progression temporelle 60 → 90% étalée sur ~180s
        const elapsed = Date.now() - analysingStart;
        const ramp = Math.min(1, elapsed / 180_000); // 0 à 1 sur 3 minutes
        percent = Math.min(90, 60 + Math.floor(ramp * 30));
      } else {
        percent = 55;
      }

      onProgress({
        step: 'analysing',
        current: data.progress_current || 0,
        total: data.progress_total || 1,
        percent,
        // 🆕 Au-delà de 3 min sur la page de progression, on rassure le user :
        // l'analyse continue en arrière-plan, il peut fermer la page si besoin.
        message: (Date.now() - start > 180_000)
          ? 'Votre analyse prend un peu plus de temps que d\'habitude. Tout est en ordre — vous pouvez fermer cette page si vous voulez, nous vous prévenons dans votre cloche 🔔 et par e-mail dès qu\'elle est prête.'
          : (data.progress_message || 'Analyse en cours…'),
      });
    }

    if (data.status === 'completed') return { status: 'completed' };
    if (data.status === 'failed') return { status: 'failed', errorMessage: data.progress_message || undefined };
    // 🆕 v9 — Si l'analyse passe en queued pendant le polling, on retourne tout de suite
    if (data.status === 'queued') {
      console.log('[VERIMO-DEBUG] ✅ STATUS QUEUED DÉTECTÉ DANS POLLING — return queued');
      return { status: 'queued', errorMessage: data.progress_message || undefined };
    }
  }

  return { status: 'timeout' };
}

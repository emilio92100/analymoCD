// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser (v6 — 2 étapes + mode complement)
// Étape 1 : Upload PDFs vers Files API → stocke file_ids dans Supabase
// Répond immédiatement → appelle analyser-run
// Mode complement : lit le rapport existant + uploade les nouveaux docs
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

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  }
  return btoa(chunks.join(''));
}

async function updateProgress(db: SupabaseClient, analyseId: string, current: number, total: number, message: string) {
  await db.from('analyses').update({ progress_current: current, progress_total: total, progress_message: message }).eq('id', analyseId);
}

async function uploadToFilesAPI(fileName: string, base64Data: string, apiKey: string): Promise<string | null> {
  try {
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, fileName);
    const res = await fetch(ANTHROPIC_FILES_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': AI_VERSION, 'anthropic-beta': FILES_BETA },
      body: formData,
    });
    if (!res.ok) { console.error(`[analyser] Upload ${res.status} "${fileName}":`, await res.text()); return null; }
    const data = await res.json() as { id: string };
    console.log(`[analyser] Uploadé "${fileName}" → ${data.id}`);
    return data.id;
  } catch (err) {
    console.error(`[analyser] Erreur upload "${fileName}":`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) return new Response(JSON.stringify({ error: 'config_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const body = await req.json() as {
      analyseId: string; mode: string; profil: 'rp' | 'invest';
      storagePaths?: string[]; fileNames?: string[];
    };

    const { analyseId, mode, profil } = body;
    if (!analyseId || !mode) return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    console.log(`[analyser] Requête — id:${analyseId} mode:${mode} docs:${body.storagePaths?.length || 0}`);

    // ══════════════════════════════════════════════════════════
    // MODE COMPLEMENT — Vérifications supplémentaires
    // ══════════════════════════════════════════════════════════
    let existingReport: Record<string, unknown> | null = null;

    if (mode === 'complement') {
      // Vérifier que l'analyse existe et a un rapport
      const { data: analyse, error: fetchErr } = await supabaseAdmin
        .from('analyses')
        .select('result, regeneration_deadline, type')
        .eq('id', analyseId)
        .single();

      if (fetchErr || !analyse?.result) {
        return new Response(JSON.stringify({ error: 'no_existing_report' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }

      // Vérifier le délai de 7 jours
      if (analyse.regeneration_deadline) {
        const deadline = new Date(analyse.regeneration_deadline);
        if (Date.now() > deadline.getTime()) {
          return new Response(JSON.stringify({ error: 'deadline_expired' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
        }
      }

      // Vérifier la limite de 5 documents
      if (body.storagePaths && body.storagePaths.length > 5) {
        return new Response(JSON.stringify({ error: 'too_many_docs', max: 5 }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }

      existingReport = analyse.result as Record<string, unknown>;
      console.log(`[analyser] Mode complement — rapport existant trouvé`);
    }

    // Marquer en cours
    await supabaseAdmin.from('analyses').update({ status: 'processing', mode, profil }).eq('id', analyseId);

    // Télécharger depuis Storage + upload vers Files API
    const fileIds: Array<{ id: string; name: string }> = [];
    const documentsIgnores: string[] = [];

    if (body.storagePaths?.length) {
      const total = body.storagePaths.length;
      await updateProgress(supabaseAdmin, analyseId, 0, total, `Envoi de ${total} document(s) en cours...`);

      for (let i = 0; i < body.storagePaths.length; i++) {
        const fileName = body.fileNames?.[i] || body.storagePaths[i].split('/').pop() || `doc_${i + 1}.pdf`;
        await updateProgress(supabaseAdmin, analyseId, i, total, `Envoi ${i + 1}/${total} : ${fileName}...`);

        const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).download(body.storagePaths[i]);
        if (error || !data) { console.error(`[analyser] Download échoué: ${body.storagePaths[i]}`); documentsIgnores.push(fileName); continue; }

        const base64 = await blobToBase64(data);
        const fileId = await uploadToFilesAPI(fileName, base64, apiKey);

        if (!fileId) { documentsIgnores.push(fileName); continue; }
        fileIds.push({ id: fileId, name: fileName });
      }

      // Supprimer de Supabase Storage
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(body.storagePaths);
    }

    if (fileIds.length === 0) {
      await supabaseAdmin.from('analyses').update({
        status: 'failed',
        progress_message: 'Aucun document n\'a pu être traité. Vérifiez que vos fichiers sont des PDF valides non protégés.',
      }).eq('id', analyseId);
      return new Response(JSON.stringify({ error: 'no_files_uploaded' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // Stocker les file_ids + passer à "files_ready"
    await supabaseAdmin.from('analyses').update({
      status: 'files_ready',
      file_ids: fileIds,
      progress_current: fileIds.length,
      progress_total: fileIds.length,
      progress_message: mode === 'complement'
        ? `${fileIds.length} nouveau(x) document(s) prêts — mise à jour en cours...`
        : `${fileIds.length} document(s) prêts — analyse en cours...`,
    }).eq('id', analyseId);

    console.log(`[analyser] ${fileIds.length} fichiers uploadés → status=files_ready`);

    // Appel direct vers analyser-run
    const runUrl = `${supabaseUrl}/functions/v1/analyser-run`;
    const runPayload: Record<string, unknown> = { analyseId, fileIds, mode, profil };

    // En mode complement, on passe le rapport existant à analyser-run
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

    console.log(`[analyser] analyser-run déclenché pour ${analyseId} (mode: ${mode})`);

    return new Response(JSON.stringify({ success: true, analyseId, filesUploaded: fileIds.length }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[analyser] Erreur:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});

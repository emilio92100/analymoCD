// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser (v4 — Files API + Single-call)
// - Upload chaque PDF via Files API Anthropic → file_id
// - Single-call Claude avec tous les file_ids (requête légère)
// - Suppression immédiate après analyse (RGPD)
// - Gestion token limit + docs ignorés
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_FILES_URL = 'https://api.anthropic.com/v1/files';
const AI_MODEL = 'claude-sonnet-4-6';
const AI_VERSION = '2023-06-01';
const FILES_BETA = 'files-api-2025-04-14';
const STORAGE_BUCKET = 'analyse-temp';
const MAX_TOKENS_OUTPUT = 8192;
const WARN_TOTAL_MB = 150;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type FileInput = { name: string; data: string };
type SupabaseClient = ReturnType<typeof createClient>;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function parseJson<T>(raw: string): T | null {
  try {
    let clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) clean = clean.slice(start, end + 1);
    return JSON.parse(clean) as T;
  } catch (e) {
    console.error('[Verimo] parseJson error:', e, 'raw debut:', raw.slice(0, 100));
    return null;
  }
}

async function updateProgress(db: SupabaseClient, analyseId: string, current: number, total: number, message: string) {
  await db.from('analyses').update({ progress_current: current, progress_total: total, progress_message: message }).eq('id', analyseId);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  }
  return btoa(chunks.join(''));
}

async function uploadToFilesAPI(file: FileInput, apiKey: string): Promise<string | null> {
  try {
    const binaryStr = atob(file.data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, file.name);
    const res = await fetch(ANTHROPIC_FILES_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': AI_VERSION, 'anthropic-beta': FILES_BETA },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[Verimo] Files API upload ${res.status} "${file.name}":`, err);
      return null;
    }
    const data = await res.json() as { id: string };
    console.log(`[Verimo] Uploadé "${file.name}" → ${data.id}`);
    return data.id;
  } catch (err) {
    console.error(`[Verimo] Erreur upload "${file.name}":`, err);
    return null;
  }
}

async function deleteFromFilesAPI(fileId: string, apiKey: string): Promise<void> {
  try {
    await fetch(`${ANTHROPIC_FILES_URL}/${fileId}`, {
      method: 'DELETE',
      headers: { 'x-api-key': apiKey, 'anthropic-version': AI_VERSION, 'anthropic-beta': FILES_BETA },
    });
    console.log(`[Verimo] Supprimé: ${fileId}`);
  } catch { console.warn(`[Verimo] Echec suppression ${fileId}`); }
}

async function callAI(params: { system: string; userContent: unknown[]; maxTokens: number; apiKey: string }): Promise<{ text: string; error?: string }> {
  const { system, userContent, maxTokens, apiKey } = params;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': AI_VERSION, 'anthropic-beta': FILES_BETA },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: userContent }] }),
      });
      if (res.status === 429) { if (attempt < 3) { await sleep(Math.pow(2, attempt) * 5000); continue; } return { text: '', error: 'rate_limit' }; }
      if (res.status === 529 || res.status === 503) { if (attempt < 3) { await sleep(10000); continue; } return { text: '', error: 'overload' }; }
      if (res.status === 413) return { text: '', error: 'request_too_large' };
      if (!res.ok) { const e = await res.text(); console.error(`[Verimo] Anthropic ${res.status}:`, e); return { text: '', error: `api_error_${res.status}` }; }
      const d = await res.json();
      const text = d.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
      if (!text) return { text: '', error: 'empty_response' };
      return { text };
    } catch (err) { if (attempt < 3) { await sleep(2000); continue; } return { text: '', error: 'network_error' }; }
  }
  return { text: '', error: 'max_retries' };
}

function buildSystemPrompt(mode: string, profil: string): string {
  const p = profil === 'invest' ? 'investissement locatif' : 'residence principale';
  if (mode === 'apercu_complete' || mode === 'apercu_document') {
    return `Tu es le moteur d analyse de documents immobiliers de Verimo. Profil : ${p}. Tu n utilises jamais les mots Claude, Anthropic ou IA.
Reponds UNIQUEMENT en JSON strict : {"titre": "adresse ou Votre bien", "recommandation_courte": "2-3 phrases", "points_vigilance": ["max 3"]}`;
  }
  if (mode === 'document') {
    return `Tu es le moteur d analyse de documents immobiliers de Verimo. Profil : ${p}. Tu n utilises jamais les mots Claude, Anthropic ou IA.
Reponds UNIQUEMENT en JSON strict : {"titre": "nom du document", "resume": "3-4 phrases", "points_forts": [], "points_vigilance": [], "conclusion": "avis en 2-3 phrases. Ce rapport est etabli uniquement a partir des documents analyses et ne remplace pas l avis d un professionnel de l immobilier."}`;
  }
  return `Tu es le moteur d analyse de documents immobiliers de Verimo. Profil acheteur : ${p}.
Tu informes, tu n orientes jamais la decision finale. Tu n utilises jamais les mots Claude, Anthropic ou IA.
Si une information est absente, tu le signales clairement.

REGLES DE NOTATION /20 (profil ${p}) :
- Base : 12/20. Travaux urgents non anticipes : -3 a -4. Gros travaux evoques non votes : -2 a -3.
- Fonds travaux nul : -2. DPE F (RP) : -2 / DPE G (RP) : -3. DPE F (invest) : -4 / DPE G (invest) : -6.
- Procedures judiciaires : -2 a -4. Fonds travaux conforme legal : +0.5. DPE A : +1 / DPE B ou C : +0.5.

REGLES IMPORTANTES :
- finances.budget_total_copro = budget annuel TOTAL copropriete, PAS la quote-part du lot
- finances.charges_annuelles_lot = charges annuelles du lot (quote-part acheteur)
- diagnostics : perimetre OBLIGATOIRE = "lot_privatif" ou "parties_communes"
- procedures : message doit expliquer clairement en langage simple l origine et les implications
- documents_analyses : lister TOUS les documents avec leur type detecte
- En cas de contexte tres long, priorise : PV AG > DDT > diagnostics > appels charges > RCP articles 1-30

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres :
{"titre":"adresse complete","type_bien":"appartement|maison|maison_copro","annee_construction":null,"score":14.5,"score_niveau":"Bien sain","resume":"4-5 phrases","points_forts":[],"points_vigilance":[],"travaux":{"realises":[{"label":"desc","annee":"2021","montant_estime":35000,"justificatif":true}],"votes":[{"label":"desc","annee":"2027","montant_estime":4500,"charge_vendeur":false}],"evoques":[{"label":"desc","annee":null,"montant_estime":null,"precision":"contexte"}],"estimation_totale":null},"finances":{"budget_total_copro":null,"charges_annuelles_lot":null,"fonds_travaux":null,"fonds_travaux_statut":"non_mentionne|conforme|insuffisant|absent","impayes":null,"type_chauffage":null},"procedures":[{"label":"Type de procedure","type":"copro_vs_syndic|impayes|contentieux|autre","gravite":"faible|moderee|elevee","message":"Explication claire 2-3 phrases"}],"diagnostics_resume":"resume global","diagnostics":[{"type":"DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|AUTRE","label":"nom complet","perimetre":"lot_privatif|parties_communes","localisation":"localisation","resultat":"resultat","presence":"detectee|absence|non_realise","alerte":null}],"documents_analyses":[{"type":"PV_AG|REGLEMENT_COPRO|APPEL_CHARGES|DPE|DDT|DIAGNOSTIC|COMPROMIS|ETAT_DATE|TAXE_FONCIERE|CARNET_ENTRETIEN|AUTRE","annee":null,"nom":"nom fichier"}],"documents_manquants":[],"negociation":{"applicable":false,"elements":[]},"vie_copropriete":{"syndic":{"nom":null,"fin_mandat":null,"tensions_detectees":false,"tensions_detail":null},"participation_ag":[{"annee":"2024","copropietaires_presents_representes":"18/24","taux_tantiemes_pct":"72%","quorum_note":null}],"tendance_participation":"Non determinable","analyse_participation":"analyse","travaux_votes_non_realises":[],"appels_fonds_exceptionnels":[],"questions_diverses_notables":[]},"lot_achete":{"quote_part_tantiemes":null,"parties_privatives":[],"impayes_detectes":null,"fonds_travaux_alur":null,"travaux_votes_charge_vendeur":[],"restrictions_usage":[],"points_specifiques":[]},"categories":{"travaux":{"note":4,"note_max":5},"procedures":{"note":4,"note_max":4},"finances":{"note":3,"note_max":4},"diags_privatifs":{"note":2,"note_max":4},"diags_communs":{"note":1.5,"note_max":3}},"avis_verimo":"Avis structure en 2-3 paragraphes distincts. Ce rapport est etabli uniquement a partir des documents analyses et ne remplace pas l avis d un professionnel de l immobilier."}`;
}

async function runAnalyse(params: {
  files: FileInput[]; mode: string; profil: string;
  analyseId: string; apiKey: string; supabaseAdmin: SupabaseClient;
}): Promise<void> {
  const { files, mode, profil, analyseId, apiKey, supabaseAdmin } = params;
  const uploadedFileIds: string[] = [];

  try {
    console.log(`[Verimo] Debut — ${files.length} doc(s) | mode: ${mode} | modele: ${AI_MODEL}`);

    const totalMB = files.reduce((acc, f) => acc + (f.data.length * 3 / 4 / 1024 / 1024), 0);
    if (totalMB > WARN_TOTAL_MB) {
      console.warn(`[Verimo] Dossier volumineux: ~${Math.round(totalMB)}MB`);
    }

    // ── Upload chaque PDF vers Files API ─────────────────────
    const documentsIgnores: string[] = [];
    const userContent: unknown[] = [];

    for (let i = 0; i < files.length; i++) {
      await updateProgress(supabaseAdmin, analyseId, i, files.length, `Envoi document ${i + 1}/${files.length}...`);

      const fileId = await uploadToFilesAPI(files[i], apiKey);
      if (!fileId) {
        console.warn(`[Verimo] Doc ignoré: ${files[i].name}`);
        documentsIgnores.push(files[i].name);
        continue;
      }

      uploadedFileIds.push(fileId);
      userContent.push({ type: 'document', source: { type: 'file', file_id: fileId } });
      userContent.push({ type: 'text', text: `[Document ${i + 1}/${files.length} : ${files[i].name}]` });
    }

    if (userContent.length === 0) throw new Error('Aucun document uploadé');

    const nbDocs = uploadedFileIds.length;
    userContent.push({
      type: 'text',
      text: nbDocs === 1
        ? 'Analyse ce document en profondeur. Extrais TOUTES les informations. JSON COMPLET et valide, sans troncature.'
        : `Voici les ${nbDocs} documents du dossier. Analyse-les ensemble de facon exhaustive. JSON COMPLET et valide, sans troncature.`,
    });

    // ── Single-call Claude ───────────────────────────────────
    await updateProgress(supabaseAdmin, analyseId, files.length, files.length, 'Analyse approfondie en cours...');
    console.log(`[Verimo] Single-call — ${nbDocs} doc(s) via Files API`);

    let result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
    let report = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    if (!result.error && !report) {
      console.warn('[Verimo] JSON invalide — retry 3s');
      await sleep(3000);
      result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
      report = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    // ── Suppression immédiate RGPD ───────────────────────────
    console.log(`[Verimo] Suppression RGPD de ${uploadedFileIds.length} fichier(s)`);
    await Promise.all(uploadedFileIds.map(id => deleteFromFilesAPI(id, apiKey)));

    // ── Gestion erreurs ──────────────────────────────────────
    if (result.error || !report) {
      const msg = result.error === 'rate_limit' ? 'Service surchargé. Réessayez dans quelques minutes.'
        : result.error === 'overload' ? 'Service indisponible. Réessayez dans quelques minutes.'
        : !report ? 'Erreur de génération du rapport. Réessayez ou contactez le support.'
        : `Erreur inattendue (${result.error}). Contactez le support.`;
      console.error('[Verimo] Echec:', result.error || 'report null');
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: msg }).eq('id', analyseId);
      return;
    }

    if (documentsIgnores.length > 0) {
      report.documents_ignores = documentsIgnores;
      report.avertissement_docs = `${documentsIgnores.length} document(s) ignoré(s) : ${documentsIgnores.join(', ')}. Vérifiez qu'ils sont en PDF non protégé.`;
    }

    // ── Sauvegarde ───────────────────────────────────────────
    const isApercu = mode.startsWith('apercu');
    const updateData: Record<string, unknown> = {
      status: 'completed',
      progress_current: files.length,
      progress_total: files.length,
      progress_message: documentsIgnores.length > 0 ? `Rapport prêt — ${documentsIgnores.length} doc(s) ignoré(s)` : 'Rapport prêt !',
      title: (report.titre as string) || 'Analyse immobilière',
      score: (report.score as number) ?? null,
      avis_verimo: (report.avis_verimo as string) || null,
      profil,
    };

    if (isApercu) { updateData.apercu = report; updateData.is_preview = true; }
    else { updateData.result = report; updateData.paid = true; }

    const { error: updateError } = await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);
    if (updateError) {
      console.error('[Verimo] ERREUR UPDATE FINAL:', updateError.message);
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur sauvegarde. Contactez le support.' }).eq('id', analyseId);
    } else {
      console.log(`[Verimo] Analyse ${analyseId} terminée avec succès.`);
    }

  } catch (err) {
    console.error('[Verimo] Erreur background:', err);
    if (uploadedFileIds.length > 0) {
      console.log('[Verimo] Nettoyage RGPD après erreur...');
      await Promise.all(uploadedFileIds.map(id => deleteFromFilesAPI(id, apiKey)));
    }
    await supabaseAdmin.from('analyses').update({
      status: 'failed',
      progress_message: 'Erreur inattendue. Contactez le support si le problème persiste.',
    }).eq('id', analyseId);
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
      storagePaths?: string[]; fileNames?: string[]; files?: FileInput[];
    };

    const { analyseId, mode, profil } = body;
    if (!analyseId || !mode) return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    console.log(`[Verimo] Requête reçue — id:${analyseId} mode:${mode}`);

    let files: FileInput[] = [];
    if (body.storagePaths?.length) {
      console.log(`[Verimo] Download ${body.storagePaths.length} fichier(s) depuis Storage...`);
      for (let i = 0; i < body.storagePaths.length; i++) {
        const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).download(body.storagePaths[i]);
        if (error || !data) { console.error(`[Verimo] Echec download: ${body.storagePaths[i]}`); continue; }
        const base64 = await blobToBase64(data);
        const fileName = body.fileNames?.[i] || body.storagePaths[i].split('/').pop() || `doc_${i + 1}.pdf`;
        files.push({ name: fileName, data: base64 });
        console.log(`[Verimo] OK "${fileName}" — ${Math.round(base64.length / 1024)} ko`);
      }
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(body.storagePaths);
    } else if (body.files?.length) {
      files = body.files;
    }

    if (files.length === 0) return new Response(JSON.stringify({ error: 'no_files' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    await supabaseAdmin.from('analyses').update({ status: 'processing' }).eq('id', analyseId);
    await updateProgress(supabaseAdmin, analyseId, 0, files.length, `Préparation de ${files.length} document(s)...`);

    EdgeRuntime.waitUntil(runAnalyse({ files, mode, profil, analyseId, apiKey, supabaseAdmin }));

    console.log(`[Verimo] Background job lancé pour ${analyseId}`);
    return new Response(JSON.stringify({ success: true, analyseId, async: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[Verimo] Erreur handler:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});

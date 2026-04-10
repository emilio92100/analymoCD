// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser (v3 — EdgeRuntime.waitUntil)
// Répond immédiatement au frontend, traite en arrière-plan
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const AI_MODEL = 'claude-sonnet-4-5';
const AI_VERSION = '2023-06-01';
const STORAGE_BUCKET = 'analyse-temp';

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
    // Nettoyer les backticks et espaces
    let clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    // Trouver le premier { et le dernier } pour extraire le JSON
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      clean = clean.slice(start, end + 1);
    }
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

async function callAI(params: {
  system: string;
  userContent: unknown[];
  maxTokens: number;
  apiKey: string;
}): Promise<{ text: string; error?: string }> {
  const { system, userContent, maxTokens, apiKey } = params;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': AI_VERSION },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: userContent }] }),
      });
      if (res.status === 429) { if (attempt < 3) { await sleep(Math.pow(2, attempt) * 5000); continue; } return { text: '', error: 'rate_limit' }; }
      if (res.status === 529 || res.status === 503) { if (attempt < 3) { await sleep(10000); continue; } return { text: '', error: 'overload' }; }
      if (!res.ok) { const e = await res.text(); console.error(`[Verimo] Anthropic ${res.status}:`, e); return { text: '', error: `api_error_${res.status}` }; }
      const d = await res.json();
      const text = d.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
      if (!text) return { text: '', error: 'empty_response' };
      return { text };
    } catch (err) { if (attempt < 3) { await sleep(2000); continue; } return { text: '', error: 'network_error' }; }
  }
  return { text: '', error: 'max_retries' };
}



// ── Prompt MAP intelligent par type de document ──────────────
const PROMPT_MAP_INTELLIGENT = `Tu es le moteur d extraction de documents immobiliers de Verimo.
Tu lis un document immobilier et tu en extrais les informations cles de facon structuree.
Extrais TOUTES les informations disponibles, y compris les details en bas de page, annexes et mentions secondaires.

Detecte d abord le type : PV_AG | REGLEMENT_COPRO | APPEL_CHARGES | DPE | DIAGNOSTIC | DDT | COMPROMIS | ETAT_DATE | TAXE_FONCIERE | AUTRE

Selon le type detecte, extrais en priorite :
- PV_AG : participation (presents/representes/tantiemes), travaux votes avec montants et statut, appels fonds exceptionnels, honoraires syndic, questions diverses, resolutions refusees, tensions syndic
- REGLEMENT_COPRO : tantiemes du lot, restrictions usage, parties privatives du lot (cave, parking)
- APPEL_CHARGES : quote-part lot en tantiemes, charges courantes vs exceptionnelles, budget previsionnel vs realise, fonds travaux ALUR
- DPE : etiquette energie et GES, type chauffage, date diagnostic (ALERTE si avant 01/07/2021), conso kWh/m2/an, preconisations travaux
- TAXE_FONCIERE : montant annuel, annee, adresse
- DIAGNOSTIC : type, resultat, date, validite, travaux preconises
- COMPROMIS : conditions suspensives, date jouissance, repartition travaux vendeur/acheteur
- ETAT_DATE : impayes lot, provisions non soldees, quote-part fonds travaux ALUR

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres :
{
  "type_document": "PV_AG",
  "annee_document": "2024 ou null",
  "resume": "resume factuel en 3-5 phrases avec les chiffres cles",
  "points_positifs": ["point positif detecte"],
  "points_vigilance": ["point de vigilance detecte"],
  "travaux_votes": [{"description": "desc", "montant": 45000, "statut": "vote", "date_vote": "2024-01-15"}],
  "travaux_evoques": ["travaux mentionnes sans vote"],
  "appels_fonds_exceptionnels": [{"description": "desc", "montant_total": 80000, "date_vote": "2024"}],
  "procedures": ["procedures judiciaires"],
  "infos_financieres": "resume charges, fonds travaux, impayes avec chiffres precis",
  "diagnostics_detectes": [{"type": "DPE", "resultat": "Classe D", "date": "2023-06-15", "alerte": null}],
  "lot_info": {"tantiemes": "45/1000 ou null", "parties_privatives": [], "impayes": null, "fonds_travaux_alur": null},
  "syndic": {"nom": "nom ou null", "fin_mandat": "2026 ou null", "tensions": false},
  "participation_ag": {"taux": "72% ou null", "presents_representes": "732/1016 ou null"},
  "montants_cles": ["tout montant important avec contexte"],
  "alertes_critiques": ["alerte urgente si detectee"]
}`;

// ── Prompt REDUCE : rapport final ────────────────────────────
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

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres :
{"titre":"adresse ou Analyse complete","type_bien":"appartement","score":14.5,"score_niveau":"Bien sain","recommandation":"Acheter","resume":"4-5 phrases","points_forts":[],"points_vigilance":[],"travaux":{"votes":[],"evoques":[],"estimation_totale":null},"finances":{"charges_annuelles":null,"fonds_travaux":null,"fonds_travaux_statut":"non_mentionne","impayes":null},"procedures":[],"diagnostics_resume":"resume DPE et diagnostics","diagnostics":[],"documents_manquants":[],"negociation":{"applicable":false,"elements":[]},"risques_financiers":"estimation","vie_copropriete":{"syndic":{"nom":null,"fin_mandat":null,"tensions_detectees":false,"tensions_detail":null},"participation_ag":[],"tendance_participation":"Non determinable","analyse_participation":"analyse","travaux_votes_non_realises":[],"appels_fonds_exceptionnels":[],"questions_diverses_notables":[]},"lot_achete":{"quote_part_tantiemes":null,"parties_privatives":[],"impayes_detectes":null,"fonds_travaux_alur":null,"travaux_votes_charge_vendeur":[],"restrictions_usage":[],"points_specifiques":[]},"avis_verimo":"Avis final. Ce rapport est etabli uniquement a partir des documents analyses et ne remplace pas l avis d un professionnel de l immobilier."}`;
}

// ── Fonction principale d'analyse (tourne en background sans limite) ──
async function runAnalyse(params: {
  files: FileInput[];
  mode: string;
  profil: string;
  analyseId: string;
  apiKey: string;
  supabaseAdmin: SupabaseClient;
}): Promise<void> {
  const { files, mode, profil, analyseId, apiKey, supabaseAdmin } = params;

  try {
    const maxTokens = 8192;
    const estimatedPages = files.reduce((acc, f) => acc + Math.ceil(f.data.length / 50000), 0);
    // Single-call pour ≤9 docs ET ≤150 pages — PDFs envoyés directement comme dans le chat
    // Map-Reduce uniquement si vraiment trop volumineux
    const useMapReduce = files.length > 9 || estimatedPages > 150;
    console.log(`[Verimo] Strategie: ${useMapReduce ? 'Map-Reduce' : 'Single-call'} | ${files.length} docs | ~${estimatedPages} pages estimees`);

    let report: Record<string, unknown> | null = null;
    let aiError: string | undefined;
    let documentsIgnores: string[] = [];

    if (!useMapReduce) {
      const userContent: unknown[] = [];
      for (let i = 0; i < files.length; i++) {
        userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: files[i].data } });
        userContent.push({ type: 'text', text: `[Document ${i + 1}/${files.length} : ${files[i].name}]` });
      }
      userContent.push({ type: 'text', text: files.length === 1
        ? 'Analyse ce document en profondeur. Extrais TOUTES les informations. JSON COMPLET et valide, sans troncature.'
        : `Voici les ${files.length} documents du dossier. Analyse-les ensemble de facon exhaustive. JSON COMPLET et valide, sans troncature.`
      });
      await updateProgress(supabaseAdmin, analyseId, 1, files.length, 'Analyse approfondie en cours...');
      console.log(`[Verimo] Appel Claude single — ${files.length} doc(s)`);
      const result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens, apiKey });
      if (result.error === 'rate_limit' || result.error === 'overload') {
        console.warn('[Verimo] Rate limit single-call — bascule Map-Reduce apres 30s');
        await sleep(30000);
        // Ne pas setter aiError → le bloc Map-Reduce va prendre le relais
      } else {
        aiError = result.error;
        if (!aiError) {
          report = parseJson<Record<string, unknown>>(result.text);
          if (!report) {
            console.warn('[Verimo] JSON invalide single-call — retry');
            await sleep(3000);
            const retry = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens: 8192, apiKey });
            if (!retry.error) report = parseJson<Record<string, unknown>>(retry.text);
            else aiError = retry.error;
          }
        }
      }
    }

    // Map-Reduce : lancé si trop de docs, ou en fallback après rate_limit single-call
    if (!report && !aiError) {
      console.log(`[Verimo] Map-Reduce — ${files.length} docs en sequence`);
      const summaries: string[] = [];
      for (let i = 0; i < files.length; i++) {
        await updateProgress(supabaseAdmin, analyseId, i, files.length, `Lecture document ${i + 1}/${files.length}...`);
        console.log(`[Verimo] MAP ${i + 1}/${files.length}: ${files[i].name}`);
        const result = await callAI({
          system: PROMPT_MAP_INTELLIGENT,
          userContent: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: files[i].data } },
            { type: 'text', text: `Extrais TOUTES les informations de ce document sans rien omettre : ${files[i].name}` }
          ],
          maxTokens: 4000,
          apiKey,
        });
        if (result.error === 'rate_limit' || result.error === 'overload') { aiError = result.error; break; }
        if (result.error) {
          console.warn(`[Verimo] MAP ${i + 1} echec — doc ignore: ${files[i].name}`);
          documentsIgnores.push(files[i].name);
          summaries.push(`=== Document ${i + 1} : ${files[i].name} ===\n(Non lisible)`);
        } else {
          summaries.push(`=== Document ${i + 1} : ${files[i].name} ===\n${result.text}`);
        }
        if (i < files.length - 1) await sleep(1500);
      }

      if (!aiError && summaries.length > 0) {
        await updateProgress(supabaseAdmin, analyseId, files.length, files.length, 'Synthèse croisée en cours...');
        console.log(`[Verimo] REDUCE — synthese de ${summaries.length} extractions`);
        const reducePrompt = `Voici les extractions de ${files.length} documents immobiliers. Synthetise en croisant TOUTES les informations. JSON COMPLET et valide, sans troncature.\n\n${summaries.join('\n\n')}`;
        const result = await callAI({
          system: buildSystemPrompt(mode, profil),
          userContent: [{ type: 'text', text: reducePrompt }],
          maxTokens: 8192,
          apiKey,
        });
        aiError = result.error;
        if (!aiError) {
          console.log('[Verimo] REDUCE reponse brute (500 chars):', result.text.slice(0, 500));
          report = parseJson<Record<string, unknown>>(result.text);
          if (!report) {
            console.warn('[Verimo] JSON invalide REDUCE — retry');
            await sleep(5000);
            const retry = await callAI({
              system: buildSystemPrompt(mode, profil),
              userContent: [{ type: 'text', text: reducePrompt + '\n\nIMPORTANT: JSON valide et COMPLET obligatoire.' }],
              maxTokens: 8192,
              apiKey,
            });
            if (!retry.error) report = parseJson<Record<string, unknown>>(retry.text);
            if (!report) console.error('[Verimo] JSON invalide apres retry. Debut:', retry?.text?.slice(0, 300));
          }
        }
        // Injecter docs ignorés
        if (report && documentsIgnores.length > 0) {
          report.documents_ignores = documentsIgnores;
          report.avertissement_docs = `${documentsIgnores.length} document(s) non lisible(s) ignoré(s) : ${documentsIgnores.join(', ')}. Vérifiez qu'ils sont en PDF non protégé.`;
        }
      }
    }

    if (aiError || !report) {
      console.error('[Verimo] Echec analyse:', aiError || 'report null');
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: aiError || 'parse_error' }).eq('id', analyseId);
      return;
    }

    const isApercu = mode.startsWith('apercu');
    const updateData: Record<string, unknown> = {
      status: 'completed',
      progress_current: files.length,
      progress_total: files.length,
      progress_message: documentsIgnores.length > 0
        ? `Rapport prêt — ${documentsIgnores.length} doc(s) non lisible(s) ignoré(s)`
        : 'Rapport prêt !',
      title: (report.titre as string) || 'Analyse immobiliere',
      score: (report.score as number) ?? null,
      avis_verimo: (report.avis_verimo as string) || null,
      profil,
    };
    if (isApercu) { updateData.apercu = report; updateData.is_preview = true; }
    else { updateData.result = report; updateData.paid = true; }

    const { error: updateError } = await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);
    if (updateError) {
      console.error('[Verimo] ERREUR UPDATE FINAL:', updateError.message);
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur sauvegarde: ' + updateError.message }).eq('id', analyseId);
    } else {
      console.log(`[Verimo] Analyse ${analyseId} terminee avec succes.`);
    }
  } catch (err) {
    console.error('[Verimo] Erreur background:', err);
    await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur inattendue' }).eq('id', analyseId);
  }
}

// ── Handler HTTP : reçoit la requête, lance le background job, répond immédiatement ──
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

    console.log(`[Verimo] Reception requete — id:${analyseId} mode:${mode}`);

    // Télécharger les fichiers depuis Storage
    let files: FileInput[] = [];
    if (body.storagePaths?.length) {
      console.log(`[Verimo] Download de ${body.storagePaths.length} fichier(s)...`);
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

    // Marquer en cours
    await supabaseAdmin.from('analyses').update({ status: 'processing' }).eq('id', analyseId);
    await updateProgress(supabaseAdmin, analyseId, 0, files.length, `Analyse de ${files.length} document(s)...`);

    // Lancer le traitement en arrière-plan (sans limite de temps)
    EdgeRuntime.waitUntil(runAnalyse({ files, mode, profil, analyseId, apiKey, supabaseAdmin }));

    // Répondre immédiatement au frontend
    console.log(`[Verimo] Background job lance pour ${analyseId} — reponse immediate`);
    return new Response(JSON.stringify({ success: true, analyseId, async: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[Verimo] Erreur handler:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});

// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser-run (déclenchée par webhook Supabase)
// Étape 2 : Appel Claude avec file_ids → rapport → suppression RGPD
// Pas de limite HTTP → peut durer 10+ minutes
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_FILES_URL = 'https://api.anthropic.com/v1/files';
const AI_MODEL = 'claude-sonnet-4-6';
const AI_VERSION = '2023-06-01';
const FILES_BETA = 'files-api-2025-04-14';
const MAX_TOKENS_OUTPUT = 8192;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    console.error('[analyser-run] parseJson error:', e, 'raw:', raw.slice(0, 100));
    return null;
  }
}

async function deleteFromFilesAPI(fileId: string, apiKey: string): Promise<void> {
  try {
    await fetch(`${ANTHROPIC_FILES_URL}/${fileId}`, {
      method: 'DELETE',
      headers: { 'x-api-key': apiKey, 'anthropic-version': AI_VERSION, 'anthropic-beta': FILES_BETA },
    });
    console.log(`[analyser-run] Supprimé: ${fileId}`);
  } catch { console.warn(`[analyser-run] Echec suppression ${fileId}`); }
}

async function callAI(params: {
  system: string; userContent: unknown[]; maxTokens: number; apiKey: string;
}): Promise<{ text: string; error?: string }> {
  const { system, userContent, maxTokens, apiKey } = params;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': AI_VERSION,
          'anthropic-beta': FILES_BETA,
        },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: userContent }] }),
      });
      if (res.status === 429) { if (attempt < 3) { await sleep(Math.pow(2, attempt) * 5000); continue; } return { text: '', error: 'rate_limit' }; }
      if (res.status === 529 || res.status === 503) { if (attempt < 3) { await sleep(15000); continue; } return { text: '', error: 'overload' }; }
      if (!res.ok) { const e = await res.text(); console.error(`[analyser-run] Anthropic ${res.status}:`, e); return { text: '', error: `api_error_${res.status}` }; }
      const d = await res.json();
      const text = d.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
      if (!text) return { text: '', error: 'empty_response' };
      return { text };
    } catch (err) { if (attempt < 3) { await sleep(3000); continue; } return { text: '', error: 'network_error' }; }
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
{"titre":"adresse complete","type_bien":"appartement|maison|maison_copro","annee_construction":null,"score":14.5,"score_niveau":"Bien sain","resume":"4-5 phrases","points_forts":[],"points_vigilance":[],"travaux":{"realises":[{"label":"desc","annee":"2021","montant_estime":35000,"justificatif":true}],"votes":[{"label":"desc","annee":"2027","montant_estime":4500,"charge_vendeur":false}],"evoques":[{"label":"desc","annee":null,"montant_estime":null,"precision":"contexte"}],"estimation_totale":null},"finances":{"budget_total_copro":null,"charges_annuelles_lot":null,"fonds_travaux":null,"fonds_travaux_statut":"non_mentionne|conforme|insuffisant|absent","impayes":null,"type_chauffage":null},"procedures":[{"label":"Type","type":"copro_vs_syndic|impayes|contentieux|autre","gravite":"faible|moderee|elevee","message":"Explication claire 2-3 phrases"}],"diagnostics_resume":"resume global","diagnostics":[{"type":"DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|AUTRE","label":"nom complet","perimetre":"lot_privatif|parties_communes","localisation":"localisation","resultat":"resultat","presence":"detectee|absence|non_realise","alerte":null}],"documents_analyses":[{"type":"PV_AG|REGLEMENT_COPRO|APPEL_CHARGES|DPE|DDT|DIAGNOSTIC|COMPROMIS|ETAT_DATE|TAXE_FONCIERE|CARNET_ENTRETIEN|AUTRE","annee":null,"nom":"nom fichier"}],"documents_manquants":[],"negociation":{"applicable":false,"elements":[]},"vie_copropriete":{"syndic":{"nom":null,"fin_mandat":null,"tensions_detectees":false,"tensions_detail":null},"participation_ag":[{"annee":"2024","copropietaires_presents_representes":"18/24","taux_tantiemes_pct":"72%","quorum_note":null}],"tendance_participation":"Non determinable","analyse_participation":"analyse","travaux_votes_non_realises":[],"appels_fonds_exceptionnels":[],"questions_diverses_notables":[]},"lot_achete":{"quote_part_tantiemes":null,"parties_privatives":[],"impayes_detectes":null,"fonds_travaux_alur":null,"travaux_votes_charge_vendeur":[],"restrictions_usage":[],"points_specifiques":[]},"categories":{"travaux":{"note":4,"note_max":5},"procedures":{"note":4,"note_max":4},"finances":{"note":3,"note_max":4},"diags_privatifs":{"note":2,"note_max":4},"diags_communs":{"note":1.5,"note_max":3}},"avis_verimo":"Avis structure en 2-3 paragraphes. Ce rapport est etabli uniquement a partir des documents analyses et ne remplace pas l avis d un professionnel de l immobilier."}`;
}

async function runAnalyse(analyseId: string, supabaseAdmin: SupabaseClient, apiKey: string): Promise<void> {
  const fileIds: string[] = [];
  try {
    const { data: analyse, error } = await supabaseAdmin
      .from('analyses')
      .select('file_ids, mode, profil')
      .eq('id', analyseId)
      .single();

    if (error || !analyse) { console.error('[analyser-run] Analyse introuvable:', error); return; }

    const files = (analyse.file_ids as Array<{ id: string; name: string }>) || [];
    const mode = (analyse.mode as string) || 'complete';
    const profil = (analyse.profil as string) || 'rp';

    if (files.length === 0) {
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Aucun fichier trouvé.' }).eq('id', analyseId);
      return;
    }

    console.log(`[analyser-run] Analyse ${analyseId} — ${files.length} docs | mode:${mode}`);
    files.forEach(f => fileIds.push(f.id));

    // Construire contenu avec file_ids
    const userContent: unknown[] = [];
    for (let i = 0; i < files.length; i++) {
      userContent.push({ type: 'document', source: { type: 'file', file_id: files[i].id } });
      userContent.push({ type: 'text', text: `[Document ${i + 1}/${files.length} : ${files[i].name}]` });
    }
    userContent.push({
      type: 'text',
      text: files.length === 1
        ? 'Analyse ce document en profondeur. JSON COMPLET et valide, sans troncature.'
        : `Voici les ${files.length} documents du dossier. Analyse-les ensemble de facon exhaustive. JSON COMPLET et valide, sans troncature.`,
    });

    await supabaseAdmin.from('analyses').update({ progress_message: 'Analyse approfondie en cours...' }).eq('id', analyseId);
    console.log(`[analyser-run] Appel Claude — ${files.length} doc(s)`);

    let result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
    let report = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    if (!result.error && !report) {
      console.warn('[analyser-run] JSON invalide — retry 5s');
      await sleep(5000);
      result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
      report = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    // Suppression RGPD immédiate
    console.log(`[analyser-run] Suppression RGPD de ${fileIds.length} fichier(s)`);
    await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));

    if (result.error || !report) {
      const msg = result.error === 'rate_limit' ? 'Service surchargé. Réessayez dans quelques minutes.'
        : result.error === 'overload' ? 'Service indisponible. Réessayez dans quelques minutes.'
        : !report ? 'Erreur de génération. Réessayez ou contactez le support.'
        : `Erreur inattendue. Contactez le support.`;
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: msg }).eq('id', analyseId);
      return;
    }

    const isApercu = mode.startsWith('apercu');
    const updateData: Record<string, unknown> = {
      status: 'completed',
      progress_current: files.length,
      progress_total: files.length,
      progress_message: 'Rapport prêt !',
      file_ids: [],
      title: (report.titre as string) || 'Analyse immobilière',
      score: (report.score as number) ?? null,
      avis_verimo: (report.avis_verimo as string) || null,
    };
    if (isApercu) { updateData.apercu = report; updateData.is_preview = true; }
    else { updateData.result = report; updateData.paid = true; }

    const { error: updateError } = await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);
    if (updateError) {
      console.error('[analyser-run] ERREUR UPDATE:', updateError.message);
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur sauvegarde. Contactez le support.' }).eq('id', analyseId);
    } else {
      console.log(`[analyser-run] ${analyseId} terminée avec succès.`);
    }
  } catch (err) {
    console.error('[analyser-run] Erreur:', err);
    if (fileIds.length > 0) await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));
    await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur inattendue. Contactez le support.' }).eq('id', analyseId);
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
    const body = await req.json() as { record?: { id: string; status: string }; analyseId?: string };
    const analyseId = body.record?.id || body.analyseId;
    const status = body.record?.status || 'files_ready';

    if (!analyseId) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    if (status !== 'files_ready') return new Response(JSON.stringify({ skipped: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

    console.log(`[analyser-run] Webhook reçu — ${analyseId} status:${status}`);

    EdgeRuntime.waitUntil(runAnalyse(analyseId, supabaseAdmin, apiKey));

    return new Response(JSON.stringify({ success: true, analyseId }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[analyser-run] Erreur handler:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});

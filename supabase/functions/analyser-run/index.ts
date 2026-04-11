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
const MAX_TOKENS_OUTPUT = 64000;

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

Detecte le type de document parmi : DDT, PV_AG, APPEL_CHARGES, RCP, DTG_PPT, CARNET_ENTRETIEN, PRE_ETAT_DATE, ETAT_DATE, TAXE_FONCIERE, COMPROMIS, DIAGNOSTIC_PARTIES_COMMUNES, AUTRE.

Reponds UNIQUEMENT en JSON strict selon le type detecte :

Pour DDT : {"document_type":"DDT","titre":"...","resume":"3-4 phrases","diagnostiqueur":{"nom":null,"certification":null,"date":null},"dpe":{"classe":null,"kwh_m2":null,"ges_classe":null,"ges_kg_m2":null},"carrez":{"surface_totale":null,"surface_sol":null,"pieces":[{"piece":"...","surface":0}]},"diagnostics":[{"type":"...","label":"...","presence":"conforme|anomalie|non_detecte|non_applicable|informatif","detail":"...","alerte":null}],"travaux_preconises":[{"label":"...","priorite":"prioritaire|recommande","cout_min":null,"cout_max":null}],"gain_energetique":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour PV_AG : {"document_type":"PV_AG","titre":"...","resume":"...","date_ag":null,"syndic":null,"quorum":{"presents":null,"total":null,"tantiemes_pct":null},"budget_vote":{"annee":null,"montant":null,"fonds_travaux":null},"travaux_votes":[{"label":"...","montant":null,"echeance":null}],"travaux_evoques":[{"label":"...","precision":null}],"questions_diverses":[],"procedures":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour APPEL_CHARGES : {"document_type":"APPEL_CHARGES","titre":"...","resume":"...","periode":null,"lot":null,"syndic":null,"montant_trimestre":null,"montant_annuel":null,"montant_mensuel":null,"decomposition":[{"poste":"...","trimestre":null,"annuel":null}],"solde_precedent":null,"impayes":false,"echeance":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour RCP : {"document_type":"RCP","titre":"...","resume":"...","date_reglement":null,"modificatifs":[],"usage":"habitation|mixte|commercial","total_lots":null,"parties_communes":[],"regles_usage":[],"restrictions":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour DTG_PPT : {"document_type":"DTG_PPT","titre":"...","resume":"...","date":null,"cabinet":null,"etat_general":"bon|moyen|degrade","budget_total_10ans":null,"budget_urgent_3ans":null,"planning":[{"label":"...","horizon":"...","montant":null,"priorite":"urgent|prioritaire|planifie"}],"etat_elements":[{"element":"...","etat":"bon|a_surveiller|vieillissant|degrade"}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour CARNET_ENTRETIEN : {"document_type":"CARNET_ENTRETIEN","titre":"...","resume":"...","syndic":null,"date_maj":null,"contrats":[{"equipement":"...","prestataire":null,"echeance":null}],"travaux_realises":[{"annee":null,"label":"...","montant":null}],"diagnostics_mentionnes":[{"type":"...","date":null,"statut":null}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour PRE_ETAT_DATE : {"document_type":"PRE_ETAT_DATE","titre":"...","resume":"...","date":null,"lot":null,"syndic":null,"impayes_vendeur":0,"fonds_travaux_alur":null,"travaux_charge_vendeur":[{"label":"...","montant":null}],"procedures_contre_vendeur":[],"situation_copro":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour ETAT_DATE : {"document_type":"ETAT_DATE","titre":"...","resume":"...","date":null,"lot":null,"syndic":null,"solde_net":null,"solde_sens":"acheteur|vendeur","fonds_travaux_alur":null,"decomposition":[{"poste":"...","montant":null,"sens":"acheteur_recoit|vendeur_doit"}],"travaux_consignes":[{"label":"...","montant":null}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour TAXE_FONCIERE : {"document_type":"TAXE_FONCIERE","titre":"...","resume":"...","annee":null,"montant_total":null,"montant_mensuel":null,"evolution_pct":null,"montant_precedent":null,"valeur_locative":null,"decomposition":[{"collectivite":"...","taux":null,"montant":null}],"reference_cadastrale":null,"surface_cadastrale":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour COMPROMIS : {"document_type":"COMPROMIS","titre":"...","resume":"...","date_signature":null,"date_acte":null,"notaire_acheteur":null,"notaire_vendeur":null,"agence":null,"vendeur":null,"acheteur":null,"bien":{"adresse":null,"type":null,"surface_carrez":null,"lot_principal":null,"tantiemes":null,"annexes":[]},"prix_net_vendeur":null,"honoraires_agence":null,"honoraires_charge":"acheteur|vendeur","prix_total":null,"depot_garantie":null,"depot_sequestre":null,"financement":{"apport":null,"montant_pret":null,"etablissement":null},"conditions_suspensives":[{"label":"...","detail":null,"date_limite":null,"statut":"en_cours|purge|levee"}],"dates_cles":[{"label":"...","date":null,"important":true}],"clauses_particulieres":[],"servitudes":[],"situation_locative":null,"bien_libre_a":null,"mobilier_inclus":[],"taxe_fonciere_prorata":null,"clause_substitution":false,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour DIAGNOSTIC_PARTIES_COMMUNES : {"document_type":"DIAGNOSTIC_PARTIES_COMMUNES","titre":"...","resume":"...","type_diagnostic":"DTA|PLOMB|TERMITES|AUTRE","date":null,"cabinet":null,"certification":null,"resultat_global":"detecte|non_detecte|surveillance","action_requise":"retrait|surveillance|conservation|aucune","prochaine_visite":null,"zones_detectees":[{"localisation":"...","materiau":null,"liste":null,"etat":null,"action":null}],"zones_saines":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

Pour AUTRE : {"document_type":"AUTRE","titre":"...","resume":"...","infos_cles":[{"label":"...","valeur":"..."}],"contenu":[{"section":"...","detail":"..."}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}

REGLES : resume = 3-4 phrases. avis_verimo = 2-3 phrases + "Cette analyse porte sur un seul document. Pour une vision complete de votre futur bien, lancez une Analyse Complete." Ne jamais inventer des donnees absentes du document — mettre null si absent.`;\n  }
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
- lot_achete.parties_privatives : lister TOUS les elements privatifs du lot avec leur numero et tantièmes si mentionnes (appartement, cave, parking, cellier, grenier...). Ex : ["Appartement n19 - 120 tantiemes generaux", "Cave n45 - 51 tantiemes generaux", "Parking n3 - 30 tantiemes generaux"]. Ne pas se limiter au logement principal.
- lot_achete.quote_part_tantiemes : tantièmes TOTAUX du lot (somme de tous les elements privatifs).
- finances.charges_annuelles_lot : extraire depuis TOUT document mentionnant les charges du lot : appels de charges, appels de fonds, relevés de charges, décomptes. Un "appel de fonds" ou "appel de fonds provisionnel" est la MÊME chose qu'un "appel de charges" — extraire la quote-part du lot concerné.
- diagnostics plomb parties communes : NE PAS inclure si annee_construction > 1949. Le plomb parties communes ne concerne QUE les immeubles construits AVANT 1949. Si l immeuble est plus recent, ne pas mentionner ce diagnostic du tout.
- diagnostics amiante parties communes : NE PAS inclure si annee_construction > 1997. L amiante ne concerne QUE les immeubles construits AVANT 1997. Si l immeuble est plus recent, ne pas mentionner.
- diagnostics termites : NE JAMAIS mettre presence="absence" ou "non_realise" si le document ne mentionne simplement pas les termites. Mettre presence="non_realise" UNIQUEMENT si le document dit explicitement "non concerne" ou "non soumis". Si le carnet d entretien ou autre document dit que l immeuble n est pas dans une zone termites ou n est pas concerne, mettre presence="absence" SEULEMENT dans ce cas.
- negociation : applicable=true UNIQUEMENT si score < 14. EXCLURE absolument : DPE A/B/C/D (seuls F et G sont des leviers car imposent obligation de travaux ou interdiction de louer). INCLURE : travaux urgents chiffres / DPE F ou G uniquement / impayes vendeur / procedures judiciaires / travaux evoques sans vote depuis plusieurs AG. Si aucun element ne justifie une negociation, applicable=false et elements=[].

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres :
{"titre":"adresse complete","type_bien":"appartement|maison|maison_copro","annee_construction":null,"score":14.5,"score_niveau":"Bien sain","resume":"4-5 phrases","points_forts":[],"points_vigilance":[],"travaux":{"realises":[{"label":"desc","annee":"2021","montant_estime":35000,"justificatif":true}],"votes":[{"label":"desc","annee":"2027","montant_estime":4500,"charge_vendeur":false}],"evoques":[{"label":"desc","annee":null,"montant_estime":null,"precision":"contexte"}],"estimation_totale":null},"finances":{"budget_total_copro":null,"charges_annuelles_lot":null,"fonds_travaux":null,"fonds_travaux_statut":"non_mentionne|conforme|insuffisant|absent","impayes":null,"type_chauffage":null},"procedures":[{"label":"Type","type":"copro_vs_syndic|impayes|contentieux|autre","gravite":"faible|moderee|elevee","message":"Explication claire 2-3 phrases"}],"diagnostics_resume":"resume global","diagnostics":[{"type":"DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|AUTRE","label":"nom complet","perimetre":"lot_privatif|parties_communes","localisation":"localisation","resultat":"resultat","presence":"detectee|absence|non_realise","alerte":null}],"documents_analyses":[{"type":"PV_AG|REGLEMENT_COPRO|APPEL_CHARGES|DPE|DDT|DIAGNOSTIC|COMPROMIS|ETAT_DATE|TAXE_FONCIERE|CARNET_ENTRETIEN|AUTRE","annee":null,"nom":"nom fichier"}],"documents_manquants":[],"negociation":{"applicable":false,"elements":[]},"vie_copropriete":{"syndic":{"nom":null,"fin_mandat":null,"tensions_detectees":false,"tensions_detail":null},"participation_ag":[{"annee":"2024","copropietaires_presents_representes":"18/24","taux_tantiemes_pct":"72%","quorum_note":null}],"tendance_participation":"Non determinable","analyse_participation":"analyse","travaux_votes_non_realises":[],"appels_fonds_exceptionnels":[],"questions_diverses_notables":[]},"lot_achete":{"quote_part_tantiemes":null,"parties_privatives":[],"impayes_detectes":null,"fonds_travaux_alur":null,"travaux_votes_charge_vendeur":[],"restrictions_usage":[],"points_specifiques":[]},"categories":{"travaux":{"note":4,"note_max":5},"procedures":{"note":4,"note_max":4},"finances":{"note":3,"note_max":4},"diags_privatifs":{"note":2,"note_max":4},"diags_communs":{"note":1.5,"note_max":3}},"avis_verimo":"Avis structure en 2-3 paragraphes. Ce rapport est etabli uniquement a partir des documents analyses et ne remplace pas l avis d un professionnel de l immobilier."}`;
}

// Attend que le status soit files_ready puis lance l'analyse
async function waitAndRun(analyseId: string, supabaseAdmin: SupabaseClient, apiKey: string): Promise<void> {
  // Retry pendant 120s max pour détecter files_ready
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const { data } = await supabaseAdmin.from('analyses').select('status').eq('id', analyseId).single();
    const status = data?.status || '';
    console.log(`[analyser-run] Check ${i+1}/30 — status:${status}`);
    if (status === 'files_ready') {
      console.log(`[analyser-run] files_ready confirmé — lancement analyse`);
      await runAnalyse(analyseId, supabaseAdmin, apiKey);
      return;
    }
    if (status === 'completed' || status === 'failed') {
      console.log(`[analyser-run] Status final ${status} — abandon`);
      return;
    }
  }
  console.warn(`[analyser-run] Timeout 120s sans files_ready — abandon`);
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
    const body = await req.json();
    console.log('[analyser-run] Payload:', JSON.stringify(body).slice(0, 300));

    const analyseId = body?.analyseId;
    if (!analyseId) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const fileIds = body?.fileIds as Array<{ id: string; name: string }> || [];
    const mode = body?.mode as string || 'complete';
    const profil = body?.profil as string || 'rp';

    if (!fileIds.length) {
      console.error(`[analyser-run] Pas de fileIds dans le payload`);
      return new Response(JSON.stringify({ error: 'no_file_ids' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // S'assurer que mode et profil sont bien en base (analyser les a déjà mis mais on confirme)
    await supabaseAdmin.from('analyses').update({ status: 'files_ready', file_ids: fileIds, mode, profil }).eq('id', analyseId);

    console.log(`[analyser-run] Lancement — ${fileIds.length} docs | mode:${mode}`);
    EdgeRuntime.waitUntil(runAnalyse(analyseId, supabaseAdmin, apiKey));

    return new Response(JSON.stringify({ success: true, analyseId }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[analyser-run] Erreur handler:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});

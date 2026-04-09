// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser (v2 — simplifié et robuste)
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

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function parseJson<T>(raw: string): T | null {
  try {
    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(clean) as T;
  } catch { return null; }
}

async function updateProgress(
  db: ReturnType<typeof createClient>,
  analyseId: string,
  current: number,
  total: number,
  message: string
) {
  await db.from('analyses').update({ progress_current: current, progress_total: total, progress_message: message }).eq('id', analyseId);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
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
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': AI_VERSION,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: userContent }],
        }),
      });

      if (res.status === 429) {
        if (attempt < 3) { await sleep(Math.pow(2, attempt) * 1000); continue; }
        return { text: '', error: 'rate_limit' };
      }
      if (res.status === 529 || res.status === 503) {
        if (attempt < 3) { await sleep(3000); continue; }
        return { text: '', error: 'overload' };
      }
      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[Verimo] Anthropic error ${res.status}:`, errBody);
        return { text: '', error: `api_error_${res.status}` };
      }

      const d = await res.json();
      const text = d.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
      if (!text) {
        console.error('[Verimo] Reponse Anthropic vide:', JSON.stringify(d));
        return { text: '', error: 'empty_response' };
      }
      return { text };
    } catch (err) {
      console.error(`[Verimo] Attempt ${attempt} failed:`, err);
      if (attempt < 3) { await sleep(2000); continue; }
      return { text: '', error: 'network_error' };
    }
  }
  return { text: '', error: 'max_retries' };
}

function buildSystemPrompt(mode: string, profil: string): string {
  const profilLabel = profil === 'invest' ? 'investissement locatif' : 'residence principale';

  if (mode === 'apercu_complete' || mode === 'apercu_document') {
    return `Tu es le moteur d'analyse de documents immobiliers de Verimo.
Tu generes un apercu gratuit et succinct a partir des documents fournis.
Profil acheteur : ${profilLabel}.
Tu n'utilises jamais les mots "Claude", "Anthropic" ou "IA".

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres :
{
  "titre": "Adresse ou nom du bien si detectable, sinon Votre bien immobilier",
  "recommandation_courte": "2-3 phrases simples sur letat global du bien",
  "points_vigilance": ["point 1", "point 2", "point 3 maximum"]
}`;
  }

  if (mode === 'document') {
    return `Tu es le moteur d'analyse de documents immobiliers de Verimo.
Tu analyses un document immobilier pour un acheteur particulier.
Profil acheteur : ${profilLabel}.
Tu informes, tu n'orientes jamais la decision finale.
Tu te bases UNIQUEMENT sur ce qui est ecrit dans les documents fournis.
Tu n'utilises jamais les mots "Claude", "Anthropic" ou "IA".

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres :
{
  "titre": "Nom ou type du document analyse",
  "resume": "Resume clair en 3-4 phrases",
  "points_forts": ["point fort 1", "point fort 2"],
  "points_vigilance": ["vigilance 1", "vigilance 2"],
  "conclusion": "Avis Verimo en 2-3 phrases. Terminer par : Ce rapport est etabli uniquement a partir des documents analyses et ne remplace pas l avis d un professionnel de l immobilier."
}`;
  }

  return `Tu es le moteur d'analyse de documents immobiliers de Verimo.
Tu generes un rapport complet a partir de tous les documents d'un bien immobilier.
Profil acheteur : ${profilLabel}.
Tu informes, tu n'orientes jamais la decision finale.
Tu te bases UNIQUEMENT sur ce qui est ecrit dans les documents fournis.
Tu n'utilises jamais les mots "Claude", "Anthropic" ou "IA".
Si une information est absente, tu le signales clairement.

REGLES DIAGNOSTICS :
Pour chaque diagnostic detecte dans les documents (DPE, amiante, plomb, electricite, gaz, termites, etc.), extrais :
- type : DPE | AMIANTE | PLOMB | ELECTRICITE | GAZ | TERMITES | ERPT | AUTRE
- label : nom complet du diagnostic
- perimetre : "lot_privatif" ou "parties_communes" ou "immeuble"
- resultat : etiquette ou valeur principale (ex: "Classe D", "Absence", "Non conforme")
- details : informations complementaires (consommation, GES, observations)
- date_diagnostic : date au format YYYY-MM-DD ou null
- date_validite : date de validite ou null
- alerte : null si pas d'alerte, sinon description courte du probleme detecte
  ALERTE OBLIGATOIRE si DPE avant 01/07/2021 (invalide depuis 01/01/2025)
  ALERTE OBLIGATOIRE si presence amiante, plomb, ou installation non conforme
- travaux_preconises : liste de travaux recommandes avec cout estime si mentionne

REGLES DE NOTATION /20 (profil ${profilLabel}) :
- Base : 12/20
- Travaux urgents non anticipes : -3 a -4
- Gros travaux evoques non votes : -2 a -3
- Copro vs syndic : -2 a -4
- Fonds travaux nul : -2
- Ecart budget >30% : -3
- DPE F (RP) : -2 / DPE G (RP) : -3
- DPE F (invest) : -4 / DPE G (invest) : -6
- Procedures judiciaires : -2 a -4
- Fonds travaux conforme legal : +0.5
- Fonds travaux > minimum legal : +1
- DPE A : +1 / DPE B ou C : +0.5
- Travaux votes a charge vendeur : +0.5 a +1
- Garantie decennale sur travaux recents : +0.5 a +1
- Immeuble bien entretenu : +0.5

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres :
{
  "titre": "Adresse du bien si detectable, sinon Analyse complete",
  "type_bien": "appartement",
  "score": 14.5,
  "score_niveau": "Bien sain",
  "recommandation": "Acheter",
  "resume": "Resume global en 4-5 phrases",
  "points_forts": ["point fort 1"],
  "points_vigilance": ["vigilance 1"],
  "travaux": {
    "votes": [],
    "evoques": [],
    "estimation_totale": null
  },
  "finances": {
    "charges_annuelles": null,
    "fonds_travaux": null,
    "fonds_travaux_statut": "non_mentionne",
    "impayes": null
  },
  "procedures": [],
  "diagnostics_resume": "resume global DPE et diagnostics en 2-3 phrases",
  "diagnostics": [
    {
      "type": "DPE",
      "label": "Diagnostic de Performance Energetique",
      "perimetre": "lot_privatif",
      "resultat": "Etiquette D",
      "details": "Consommation 180 kWh/m2/an, GES classe D",
      "date_diagnostic": "2023-06-15",
      "date_validite": "2033-06-15",
      "alerte": null,
      "travaux_preconises": []
    }
  ],
  "documents_manquants": [],
  "negociation": {
    "applicable": false,
    "elements": []
  },
  "risques_financiers": "estimation des risques financiers",
  "vie_copropriete": {
    "syndic": {
      "nom": null,
      "fin_mandat": null,
      "tensions_detectees": false,
      "tensions_detail": null
    },
    "participation_ag": [],
    "tendance_participation": "Non determinable",
    "analyse_participation": "Analyse de la sante democratique",
    "travaux_votes_non_realises": [],
    "appels_fonds_exceptionnels": [],
    "questions_diverses_notables": []
  },
  "lot_achete": {
    "quote_part_tantiemes": null,
    "parties_privatives": [],
    "impayes_detectes": null,
    "fonds_travaux_alur": null,
    "travaux_votes_charge_vendeur": [],
    "restrictions_usage": [],
    "points_specifiques": []
  },
  "avis_verimo": "Avis final. Ce rapport est etabli uniquement a partir des documents analyses et ne remplace pas l avis d un professionnel de l immobilier."
}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) {
    console.error('[Verimo] ANTHROPIC_API_KEY manquante');
    return new Response(JSON.stringify({ error: 'config_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const body = await req.json() as {
      analyseId: string;
      mode: string;
      profil: 'rp' | 'invest';
      storagePaths?: string[];
      fileNames?: string[];
      files?: FileInput[];
    };

    const { analyseId, mode, profil } = body;
    if (!analyseId || !mode) {
      return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    console.log(`[Verimo] Analyse id:${analyseId} mode:${mode} profil:${profil}`);

    let files: FileInput[] = [];

    if (body.storagePaths?.length) {
      console.log(`[Verimo] Download de ${body.storagePaths.length} fichier(s) depuis Storage...`);

      for (let i = 0; i < body.storagePaths.length; i++) {
        const path = body.storagePaths[i];
        const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).download(path);

        if (error || !data) {
          console.error(`[Verimo] Echec download "${path}":`, error?.message);
          continue;
        }

        const base64 = await blobToBase64(data);
        const fileName = body.fileNames?.[i] || path.split('/').pop() || `document_${i + 1}.pdf`;
        files.push({ name: fileName, data: base64 });
        console.log(`[Verimo] OK "${fileName}" — ${Math.round(base64.length / 1024)} ko base64`);
      }

      const { error: deleteError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(body.storagePaths);
      if (deleteError) console.warn('[Verimo] Suppression Storage echouee:', deleteError.message);
      else console.log(`[Verimo] ${body.storagePaths.length} fichier(s) supprimes du Storage.`);

    } else if (body.files?.length) {
      files = body.files;
      console.log(`[Verimo] ${files.length} fichier(s) en base64 direct.`);
    }

    if (files.length === 0) {
      console.error('[Verimo] Aucun fichier disponible.');
      return new Response(JSON.stringify({ error: 'no_files', message: 'Aucun fichier disponible. Reessayez.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    await supabaseAdmin.from('analyses').update({ status: 'processing' }).eq('id', analyseId);
    await updateProgress(supabaseAdmin, analyseId, 0, files.length, `Analyse de ${files.length} document(s)...`);

    const maxTokens = mode === 'complete' ? 4000 : 1500;

    // ── Stratégie : Single call ou Map-Reduce selon nombre de pages estimées ──
    // L'API Anthropic limite à 100 pages PDF par appel.
    // On estime ~1 page pour 50ko base64. Si > 4 docs ou > 80 pages estimées → Map-Reduce
    const estimatedPages = files.reduce((acc, f) => acc + Math.ceil(f.data.length / 50000), 0);
    const useMapReduce = files.length > 4 || estimatedPages > 80;
    console.log(`[Verimo] Stratégie: ${useMapReduce ? 'Map-Reduce' : 'Single-call'} | ${files.length} docs | ~${estimatedPages} pages estimées`);

    let report: Record<string, unknown> | null = null;
    let aiError: string | undefined;

    if (!useMapReduce) {
      // ── Single call : tous les docs en un seul message ──
      const userContent: unknown[] = [];
      for (let i = 0; i < files.length; i++) {
        userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: files[i].data } });
        userContent.push({ type: 'text', text: `[Document ${i + 1}/${files.length} : ${files[i].name}]` });
      }
      userContent.push({ type: 'text', text: files.length === 1 ? 'Analyse ce document.' : `Voici les ${files.length} documents. Analyse-les ensemble en croisant les informations.` });

      await updateProgress(supabaseAdmin, analyseId, 1, files.length, 'Analyse en cours...');
      console.log(`[Verimo] Appel Claude single — ${files.length} doc(s)`);
      const result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens, apiKey });
      aiError = result.error;
      if (!aiError) report = parseJson<Record<string, unknown>>(result.text);

    } else {
      // ── Map-Reduce : analyser chaque doc puis synthétiser ──
      console.log(`[Verimo] Map-Reduce — ${files.length} docs en séquence`);

      // Prompt MAP intelligent par type de document
      const PROMPT_MAP_INTELLIGENT = `Tu es le moteur d extraction de documents immobiliers de Verimo.
Tu lis un document immobilier et tu en extrais les informations cles de facon structuree.
Extrais TOUTES les informations disponibles, y compris les details en bas de page, notes de bas de tableau, annexes et mentions secondaires.

Detecte d abord le type de document :
PV_AG | REGLEMENT_COPRO | APPEL_CHARGES | DPE | DIAGNOSTIC | DDT | COMPROMIS | ETAT_DATE | TAXE_FONCIERE | AUTRE

Selon le type detecte, extrais en priorite :
- PV_AG : participation (presents/representes/tantiemes), travaux votes avec montants et statut realisation, appels fonds exceptionnels, honoraires syndic, questions diverses, resolutions refusees, tensions syndic
- REGLEMENT_COPRO : tantiemes du lot, restrictions usage (location courte duree, animaux, activite pro), parties privatives du lot (cave, parking), clauses travaux
- APPEL_CHARGES : quote-part lot en tantiemes, charges courantes vs exceptionnelles, budget previsionnel vs realise, fonds travaux ALUR, imputes
- DPE : etiquette energie et GES, type chauffage (individuel/collectif), date diagnostic (ALERTE si avant 01/07/2021 car invalide depuis 01/01/2025), conso kWh/m2/an, preconisations travaux avec couts
- APPEL_CHARGES : montant total appel, repartition par poste, fonds travaux, quote-part lot
- TAXE_FONCIERE : montant annuel, annee, adresse du bien si presente
- DIAGNOSTIC : type, resultat (conforme/non conforme/presence/absence), date, validite, travaux preconises
- COMPROMIS : conditions suspensives, date jouissance, repartition travaux votes vendeur/acheteur
- ETAT_DATE : impayes lot, provisions non soldees, quote-part fonds travaux ALUR

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres :
{
  "type_document": "PV_AG",
  "annee_document": "2024 ou null",
  "resume": "resume factuel en 3-5 phrases avec les chiffres cles",
  "points_positifs": ["point positif detecte"],
  "points_vigilance": ["point de vigilance detecte"],
  "travaux_votes": [{"description": "desc", "montant": 45000, "statut": "vote | realise | en cours", "date_vote": "2024-01-15", "charge_vendeur": null}],
  "travaux_evoques": ["travaux mentionnes sans vote"],
  "appels_fonds_exceptionnels": [{"description": "desc", "montant_total": 80000, "date_vote": "2024"}],
  "procedures": ["procedures judiciaires ou contentieux"],
  "infos_financieres": "resume charges, fonds travaux, impayes, budget avec chiffres precis",
  "diagnostics_detectes": [{"type": "DPE", "resultat": "Classe D", "date": "2023-06-15", "alerte": null}],
  "lot_info": {"tantiemes": "45/1000 ou null", "parties_privatives": [], "impayes": null, "fonds_travaux_alur": null},
  "syndic": {"nom": "nom ou null", "fin_mandat": "2026 ou null", "tensions": false},
  "participation_ag": {"taux": "72% ou null", "presents_representes": "732/1016 ou null"},
  "montants_cles": ["tout montant important avec contexte"],
  "alertes_critiques": ["alerte urgente si detectee : DPE invalide, amiante, impaye important, etc."]
}`;

      const summaries: string[] = [];
      for (let i = 0; i < files.length; i++) {
        await updateProgress(supabaseAdmin, analyseId, i, files.length, `Lecture document ${i + 1}/${files.length}...`);
        console.log(`[Verimo] MAP ${i + 1}/${files.length}: ${files[i].name}`);
        const result = await callAI({
          system: PROMPT_MAP_INTELLIGENT,
          userContent: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: files[i].data } },
            { type: 'text', text: `Extrais TOUTES les informations cles de ce document immobilier, sans rien omettre : ${files[i].name}` }
          ],
          maxTokens: 2500, // plus de tokens pour capturer plus d infos
          apiKey,
        });
        if (result.error === 'rate_limit' || result.error === 'overload') { aiError = result.error; break; }
        summaries.push(`=== Document ${i + 1} : ${files[i].name} ===
${result.text || '(lecture echouee)'}`);
        if (i < files.length - 1) await sleep(1500); // espacer pour eviter rate limit
      }

      if (!aiError) {
        await updateProgress(supabaseAdmin, analyseId, files.length, files.length, 'Synthese croisee en cours...');
        console.log(`[Verimo] REDUCE — synthese de ${summaries.length} extractions`);
        const reduceContent = [{
          type: 'text',
          text: `Voici les extractions structurees de ${files.length} documents immobiliers. Synthetise-les en croisant les informations pour produire le rapport final complet et precis :

${summaries.join('

')}`
        }];
        const result = await callAI({ system: buildSystemPrompt(mode, profil), userContent: reduceContent, maxTokens, apiKey });
        aiError = result.error;
        if (!aiError) report = parseJson<Record<string, unknown>>(result.text);
      }
    }

    if (aiError) {
      console.error('[Verimo] Erreur Claude:', aiError);
      await supabaseAdmin.from('analyses').update({ status: 'failed' }).eq('id', analyseId);
      return new Response(JSON.stringify({
        error: aiError,
        message: aiError === 'rate_limit'
          ? 'Moteur surcharge. Votre credit a ete rembourse. Reessayez dans 2-3 minutes.'
          : 'Erreur lors de l analyse. Votre credit a ete rembourse.',
      }), { status: aiError === 'rate_limit' ? 429 : 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    if (!report) {
      console.error('[Verimo] JSON non parseable (report null).');
      await supabaseAdmin.from('analyses').update({ status: 'failed' }).eq('id', analyseId);
      return new Response(JSON.stringify({ error: 'parse_error', message: 'Erreur de traitement. Votre credit a ete rembourse.' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const isApercu = mode.startsWith('apercu');
    const updateData: Record<string, unknown> = {
      status: 'completed',
      progress_current: files.length,
      progress_total: files.length,
      progress_message: 'Rapport pret !',
      title: (report.titre as string) || 'Analyse immobiliere',
      score: (report.score as number) ?? null,
      avis_verimo: (report.avis_verimo as string) || null,
      profil,
    };

    if (isApercu) {
      updateData.apercu = report;
      updateData.is_preview = true;
    } else {
      updateData.result = report;
      updateData.paid = true;
    }

    console.log('[Verimo] updateData:', JSON.stringify(updateData).slice(0, 200));
    const { error: updateError } = await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);
    if (updateError) {
      console.error('[Verimo] ERREUR UPDATE FINAL:', updateError.message, updateError.code, updateError.details);
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur sauvegarde: ' + updateError.message }).eq('id', analyseId);
    } else {
      console.log(`[Verimo] Analyse ${analyseId} terminee avec succes.`);
    }

    return new Response(JSON.stringify({ success: true, analyseId }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[Verimo] Erreur inattendue:', err);
    return new Response(JSON.stringify({ error: 'server_error', message: 'Erreur inattendue.' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
});

// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser
// Map-Reduce sur les documents immobiliers
// Clé Anthropic stockée dans Supabase Secrets (jamais exposée)
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const AI_MODEL = 'claude-sonnet-4-6'; // Sonnet 4.6 — 1M tokens natif, même prix que Sonnet 4, meilleure précision
// Alias pour la lisibilité (même modèle partout — précision maximale sur les docs immo)
const AI_MODEL_REDUCE = AI_MODEL;
const AI_MODEL_MAP = AI_MODEL;
const AI_VERSION = '2023-06-01';

// ─── CORS ─────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Types ────────────────────────────────────────────────────
type FileInput = { name: string; data: string }; // base64

type DocSummary = {
  filename: string;
  detected_type: string;
  points_positifs: string[];
  points_vigilance: string[];
  travaux_votes: string[];
  travaux_evoques: string[];
  procedures: string[];
  infos_financieres: string;
  diagnostics: string[];
  raw_text_preview: string;
};

// ─── Helper : appel Anthropic avec retry ──────────────────────
async function callAI(params: {
  system: string;
  userContent: { type: string; source?: unknown; text?: string }[];
  maxTokens: number;
  apiKey: string;
  maxRetries?: number;
  model?: string; // optionnel — défaut Sonnet
}): Promise<{ text: string; error?: string }> {
  const { system, userContent, maxTokens, apiKey, maxRetries = 3, model = AI_MODEL_REDUCE } = params;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': AI_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          output_config: { effort: 'medium' },
          system,
          messages: [{ role: 'user', content: userContent }],
        }),
      });

      if (res.status === 429) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          await sleep(delay);
          continue;
        }
        return { text: '', error: 'rate_limit' };
      }

      if (res.status === 529 || res.status === 503) {
        if (attempt < maxRetries) {
          await sleep(3000);
          continue;
        }
        return { text: '', error: 'overload' };
      }

      if (!res.ok) return { text: '', error: `api_error_${res.status}` };

      const d = await res.json();
      const text = d.content?.find((b: { type: string }) => b.type === 'text')?.text || '';
      if (!text) return { text: '', error: 'empty_response' };
      return { text };
    } catch {
      if (attempt < maxRetries) { await sleep(2000); continue; }
      return { text: '', error: 'network_error' };
    }
  }
  return { text: '', error: 'max_retries' };
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function parseJson<T>(raw: string): T | null {
  try {
    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(clean) as T;
  } catch { return null; }
}

// ─── Prompt MAP : résumé structuré par document ───────────────
const PROMPT_MAP = `Tu es le moteur d'extraction de documents immobiliers de Verimo.
Tu lis un document immobilier et tu en extrais les informations clés de façon structurée.
Tu dois extraire TOUTES les informations disponibles, y compris les détails en bas de page, notes de bas de tableau, annexes et mentions secondaires.

Selon le type de document, porte une attention particulière à :
- PV_AG : participation (présents/représentés/tantièmes), travaux votés et leur statut de réalisation, appels de fonds exceptionnels votés (préciser si avant ou après compromis car charge vendeur si avant), honoraires syndic, questions diverses, résolutions refusées, tensions éventuelles sur le renouvellement du syndic
- REGLEMENT_COPRO : tantièmes du lot, restrictions d'usage (location courte durée, animaux, activité pro), parties privatives du lot (cave, parking si mentionnés), clauses travaux (fenêtres, balcons, compteurs — noter si classés parties privatives ou communes car inhabituel)
- DPE : date du diagnostic (ALERTE si antérieur au 01/07/2021 car invalide depuis le 01/01/2025), étiquette énergie et GES, type de chauffage (individuel ou collectif et impact sur les charges), préconisations de travaux avec coûts estimés
- APPEL_CHARGES : quote-part du lot en tantièmes, charges courantes vs exceptionnelles, budget prévisionnel vs réalisé, fonds travaux ALUR constitué
- COMPROMIS : conditions suspensives et délais, date de jouissance, répartition des travaux votés entre vendeur et acheteur (règle : travaux votés avant le compromis = charge vendeur même si appels non encore commencés), pénalités de rétractation
- ETAT_DATE : impayés du lot sur les dernières années, provisions non soldées, quote-part du fonds travaux ALUR correspondant au lot (cette somme revient à l'acheteur à l'acte authentique)
- DIAGNOSTIC : nature du diagnostic, résultats, préconisations de travaux avec urgence et coûts estimés

Détecte d'abord le type de document parmi :
- PV_AG (procès-verbal d'assemblée générale)
- REGLEMENT_COPRO (règlement de copropriété)
- APPEL_CHARGES (appel de charges / budget prévisionnel)
- DPE (diagnostic de performance énergétique)
- DIAGNOSTIC (diagnostic technique : électricité, gaz, amiante, plomb, etc.)
- DDT (dossier de diagnostic technique)
- COMPROMIS (compromis ou promesse de vente)
- ETAT_DATE (état daté)
- AUTRE (tout autre document)

Réponds UNIQUEMENT en JSON strict, sans texte avant ou après :
{
  "detected_type": "PV_AG",
  "annee_document": "2024 ou null si non détecté",
  "points_positifs": ["..."],
  "points_vigilance": ["..."],
  "travaux_votes": [
    {
      "description": "Ravalement façade",
      "montant": "45000€ ou null",
      "statut_realisation": "réalisé | en cours | non réalisé | non précisé",
      "annee_vote": "2021 ou null",
      "charge_vendeur": "true si voté avant le compromis (charge vendeur même si appels non commencés) — null si date compromis non détectable"
    }
  ],
  "travaux_evoques": ["travaux mentionnés sans vote ni budget"],
  "appels_fonds_exceptionnels": [
    {
      "description": "Remplacement ascenseur",
      "montant_total": "80000€ ou null",
      "montant_par_lot": "2000€ ou null",
      "date_vote": "2023 ou null",
      "charge_vendeur": "true si voté avant le compromis = charge vendeur — null si date compromis non détectable"
    }
  ],
  "procedures": ["procédures judiciaires ou contentieux"],
  "infos_financieres": "résumé des infos financières clés (charges, fonds travaux, impayés, budget)",
  "honoraires_syndic": "montant annuel des honoraires du syndic si mentionné, sinon null",
  "syndic": {
    "nom": "nom du syndic ou null",
    "fin_mandat": "date de fin de mandat si mentionnée ou null — préciser que le renouvellement est habituel sauf tension détectée",
    "tensions_changement": "true si des tensions ou demandes de changement de syndic sont détectées dans les PV, sinon false",
    "tensions_detail": "description des tensions détectées sur le syndic si présentes, sinon null"
  },
  "questions_diverses": ["points soulevés en questions diverses, même informels"],
  "lot_detecte": {
    "numero": "numéro du lot si détectable ou null",
    "parties_privatives": ["cave, parking, ou autres éléments privatifs du lot si mentionnés"],
    "impayes": "impayés de charges sur ce lot si mentionnés ou null",
    "points_specifiques": ["points concernant spécifiquement ce lot"]
  },
  "diagnostics": ["résumé des diagnostics si présents"],
  "ag_participation": {
    "copropietaires_presents": "nombre présents physiquement ou null",
    "copropietaires_representes": "nombre représentés par procuration ou null",
    "copropietaires_total": "nombre total dans la copropriété ou null",
    "tantiemes_presents": "tantièmes représentés à l'AG ou null",
    "tantiemes_total": "total des tantièmes de la copropriété ou null",
    "quorum_atteint": true,
    "quorum_note": "précision sur le quorum ex: 2ème convocation faute de quorum, ou null",
    "resolutions_refusees": ["résolutions rejetées avec raison si mentionnée"]
  }
}`;

// ─── Prompt REDUCE : rapport final ────────────────────────────
function buildPromptReduce(mode: string, profil: string): string {
  const profilLabel = profil === 'invest' ? 'investissement locatif' : 'résidence principale';

  if (mode === 'apercu_complete' || mode === 'apercu_document') {
    return `Tu es le moteur d'analyse de documents immobiliers de Verimo.
Tu génères un aperçu gratuit et succinct à partir des résumés de documents.
Profil acheteur : ${profilLabel}.

Réponds UNIQUEMENT en JSON strict :
{
  "titre": "Adresse ou nom du bien si détectable, sinon 'Votre bien immobilier'",
  "recommandation_courte": "2-3 phrases simples sur l'état global du bien",
  "points_vigilance": ["point 1", "point 2", "point 3 maximum"]
}`;
  }

  if (mode === 'document') {
    return `Tu es le moteur d'analyse de documents immobiliers de Verimo.
Tu analyses un document immobilier pour un acheteur particulier.
Profil acheteur : ${profilLabel}.
Tu informes, tu n'orientes jamais la décision finale.
Tu te bases UNIQUEMENT sur ce qui est écrit dans les documents fournis.
Tu n'utilises jamais les mots "Claude", "Anthropic" ou "IA" — tu es "le moteur d'analyse Verimo".

Réponds UNIQUEMENT en JSON strict :
{
  "titre": "Nom ou type du document analysé",
  "resume": "Résumé clair en 3-4 phrases",
  "points_forts": ["point fort 1", "point fort 2"],
  "points_vigilance": ["vigilance 1", "vigilance 2"],
  "conclusion": "Avis Verimo en 2-3 phrases. Terminer par : Ce rapport est établi uniquement à partir des documents analysés et ne remplace pas l'avis d'un professionnel de l'immobilier."
}`;
  }

  // mode === 'complete'
  return `Tu es le moteur d'analyse de documents immobiliers de Verimo.
Tu génères un rapport complet à partir des résumés structurés de tous les documents d'un bien.
Profil acheteur : ${profilLabel}.
Tu informes, tu n'orientes jamais la décision finale.
Tu te bases UNIQUEMENT sur ce qui est écrit dans les documents fournis.
Tu n'utilises jamais les mots "Claude", "Anthropic" ou "IA".
Si une information est absente, tu le signales clairement.

RÈGLES DE NOTATION /20 (profil ${profilLabel}) :
- Base : 12/20
- Travaux urgents non anticipés : -3 à -4
- Gros travaux évoqués non votés : -2 à -3
- Copro vs syndic : -2 à -4
- Fonds travaux nul : -2
- Écart budget >30% : -3
- DPE F (RP) : -2 / DPE G (RP) : -3
- DPE F (invest) : -4 / DPE G (invest) : -6
- Procédures judiciaires : -2 à -4
- Fonds travaux conforme légal : +0.5
- Fonds travaux > minimum légal : +1
- DPE A : +1 / DPE B ou C : +0.5
- Travaux votés à charge vendeur : +0.5 à +1
- Garantie décennale sur travaux récents : +0.5 à +1
- Immeuble bien entretenu : +0.5

Réponds UNIQUEMENT en JSON strict :
{
  "titre": "Adresse du bien si détectable, sinon 'Analyse complète'",
  "type_bien": "appartement | maison | maison_copro | indetermine",
  "score": 14.5,
  "score_niveau": "Bien sain",
  "recommandation": "Acheter | Négocier | Risqué",
  "resume": "Résumé global en 4-5 phrases",
  "points_forts": ["point fort 1", "point fort 2", "point fort 3"],
  "points_vigilance": ["vigilance 1", "vigilance 2", "vigilance 3"],
  "travaux": {
    "votes": ["travaux votés avec montants"],
    "evoques": ["travaux évoqués sans vote"],
    "estimation_totale": "fourchette estimée ou null"
  },
  "finances": {
    "charges_annuelles": "montant ou null",
    "fonds_travaux": "montant ou null",
    "fonds_travaux_statut": "conforme | insuffisant | absent | non_mentionne",
    "impayes": "montant ou null"
  },
  "procedures": [],
  "diagnostics_resume": "résumé DPE et diagnostics",
  "documents_manquants": ["document manquant 1"],
  "negociation": {
    "applicable": true,
    "elements": ["argument de négociation 1"]
  },
  "risques_financiers": "estimation des risques financiers en 1-2 phrases",
  "vie_copropriete": {
    "syndic": {
      "nom": "nom du syndic actuel ou null",
      "fin_mandat": "date de fin de mandat si mentionnée ou null",
      "note_mandat": "Le renouvellement du mandat est habituel en AG. Signaler uniquement si des tensions ou demandes de changement ont été détectées dans les PV analysés.",
      "tensions_detectees": "true si tensions sur le syndic détectées dans les PV, sinon false",
      "tensions_detail": "description des tensions si présentes, sinon null"
    },
    "participation_ag": [
      {
        "annee": "2023",
        "copropietaires_presents_representes": "ex: 28 sur 48",
        "tantiemes_representes": "ex: 620/1000",
        "taux_tantiemes_pct": "ex: 62%",
        "quorum_note": "ex: 2ème convocation ou null",
        "resolutions_refusees": ["ex: Vote travaux toiture refusé — quorum insuffisant"]
      }
    ],
    "tendance_participation": "En hausse | Stable | En baisse | Non déterminable",
    "analyse_participation": "2-3 phrases sur la santé démocratique de la copropriété",
    "travaux_votes_non_realises": ["travaux votés mais dont la réalisation n'est pas confirmée dans les PV suivants"],
    "appels_fonds_exceptionnels": ["appels de fonds hors budget ordinaire votés sur la période"],
    "questions_diverses_notables": ["points soulevés en questions diverses méritant attention"],
    "honoraires_syndic_evolution": "évolution des honoraires du syndic si détectable sur plusieurs années"
  },
  "lot_achete": {
    "quote_part_tantiemes": "quote-part du lot en tantièmes si détectable dans le RCP ou l'appel de charges, sinon null",
    "parties_privatives": ["cave, parking ou autres éléments privatifs identifiés pour ce lot"],
    "impayes_detectes": "impayés de charges sur ce lot si mentionnés dans les docs, sinon null",
    "fonds_travaux_alur": "quote-part du fonds travaux ALUR du lot mentionnée dans l'état daté — cette somme revient à l'acheteur à l'acte authentique, sinon null",
    "travaux_votes_charge_vendeur": ["travaux votés avant le compromis donc à charge du vendeur — à vérifier dans l'acte authentique"],
    "restrictions_usage": ["restrictions spécifiques au lot détectées dans le RCP : location courte durée, animaux, activité pro"],
    "points_specifiques": ["autres points concernant spécifiquement ce lot dans les documents"]
  },
  "avis_verimo": "Avis final en 2-3 phrases simples. Terminer par : Ce rapport est établi uniquement à partir des documents analysés et ne remplace pas l'avis d'un professionnel de l'immobilier."
}`;
}

// ─── Chargement des règles juridiques depuis Supabase ─────────
async function chargerReglementation(
  supabaseAdmin: ReturnType<typeof createClient>,
  categoriesDetectees: string[]
): Promise<string> {
  try {
    // Charger uniquement les règles des catégories pertinentes + règles globales
    const { data, error } = await supabaseAdmin
      .from('reglementation')
      .select('categorie, titre, contenu, date_entree_vigueur')
      .eq('actif', true)
      .or(`categorie.in.(${categoriesDetectees.join(',')}),categorie.eq.GENERAL`)
      .lte('date_entree_vigueur', new Date().toISOString().split('T')[0])
      .or('date_expiration.is.null,date_expiration.gte.' + new Date().toISOString().split('T')[0])
      .order('categorie')
      .order('date_entree_vigueur', { ascending: false });

    if (error || !data?.length) return '';

    const regles = data.map(r =>
      `[${r.categorie}] ${r.titre} (en vigueur depuis ${r.date_entree_vigueur}) :\n${r.contenu}`
    ).join('\n\n');

    return `\n\n━━━ RÉGLEMENTATION FRANÇAISE EN VIGUEUR (source Verimo, vérifiée ${new Date().toLocaleDateString('fr-FR')}) ━━━\n${regles}\n━━━ FIN RÉGLEMENTATION ━━━`;
  } catch {
    // En cas d'erreur de chargement, on continue sans les règles
    return '';
  }
}

// Mapping type de document détecté → catégorie de règlementation
function detecterCategories(summaries: DocSummary[]): string[] {
  const categories = new Set<string>();
  for (const s of summaries) {
    if (['PV_AG', 'REGLEMENT_COPRO', 'APPEL_CHARGES', 'ETAT_DATE'].includes(s.detected_type)) {
      categories.add('COPROPRIETE');
    }
    if (['DPE', 'DDT', 'DIAGNOSTIC'].includes(s.detected_type)) {
      categories.add('DPE');
      categories.add('DIAGNOSTICS');
    }
    if (['COMPROMIS'].includes(s.detected_type)) {
      categories.add('VENTE');
    }
  }
  // Toujours charger DPE et VENTE — présents dans quasi tous les dossiers
  categories.add('DPE');
  categories.add('VENTE');
  return Array.from(categories);
}
async function updateProgress(supabaseAdmin: ReturnType<typeof createClient>, analyseId: string, current: number, total: number, message: string) {
  await supabaseAdmin.from('analyses').update({
    progress_current: current,
    progress_total: total,
    progress_message: message,
  }).eq('id', analyseId);
}

// ─── Estimation tokens (approximation: 1 token ≈ 4 chars base64 / 3) ─────────
// Un PDF base64 : chaque char ≈ 0.75 byte. Claude compte ~1 token / 4 bytes de PDF.
// Estimation conservative : on compte 1 token pour 3 chars de base64.
function estimateTokens(files: FileInput[]): number {
  return files.reduce((acc, f) => acc + Math.ceil(f.data.length / 3), 0);
}

// Seuil en tokens : en dessous → "Smart Stuffing" (tout en un appel)
// Au dessus → Map-Reduce
// Seuil basé sur les benchmarks qualité Sonnet 4.6 :
// - Sous 300k : lecture fiable sur docs immobiliers structurés → Smart Stuffing
// - Au-delà : Map-Reduce pour préserver la précision
const TOKEN_THRESHOLD = 300_000;

// ─── Stratégie A : Smart Stuffing (tout en un seul appel) ─────────────────────
async function runSmartStuffing(params: {
  files: FileInput[];
  mode: string;
  profil: string;
  analyseId: string;
  apiKey: string;
  supabaseAdmin: ReturnType<typeof createClient>;
}): Promise<{ report: Record<string, unknown> | null; error?: string }> {
  const { files, mode, profil, analyseId, apiKey, supabaseAdmin } = params;

  await updateProgress(supabaseAdmin, analyseId, 0, files.length, `Lecture des ${files.length} document(s) en parallèle…`);

  // Construire le contenu multi-documents en un seul message
  const userContent: { type: string; source?: unknown; text?: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    userContent.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: files[i].data },
    });
    userContent.push({
      type: 'text',
      text: `[Document ${i + 1}/${files.length} : ${files[i].name}]`,
    });
  }

  userContent.push({
    type: 'text',
    text: `Voici les ${files.length} document(s) du dossier immobilier. Analyse-les ensemble pour produire un rapport complet et précis, en croisant les informations entre documents.`,
  });

  await updateProgress(supabaseAdmin, analyseId, 1, files.length, 'Analyse approfondie en cours — lecture croisée des documents…');

  // Charger la réglementation applicable (toujours à jour depuis Supabase)
  const categories = ['DPE', 'VENTE', 'COPROPRIETE', 'LOCATION', 'DIAGNOSTICS'];
  const regles = await chargerReglementation(supabaseAdmin, categories);

  const { text, error } = await callAI({
    system: buildPromptReduce(mode, profil) + regles,
    userContent,
    maxTokens: mode === 'complete' ? 4000 : 1500,
    apiKey,
  });

  if (error) return { report: null, error };

  const report = parseJson<Record<string, unknown>>(text);
  return { report };
}

// ─── Stratégie B : Map-Reduce (pour gros dossiers) ───────────────────────────
async function runMapReduce(params: {
  files: FileInput[];
  mode: string;
  profil: string;
  analyseId: string;
  apiKey: string;
  supabaseAdmin: ReturnType<typeof createClient>;
}): Promise<{ report: Record<string, unknown> | null; error?: string }> {
  const { files, mode, profil, analyseId, apiKey, supabaseAdmin } = params;

  // ── PHASE MAP — extraction parallèle avec délai intelligent ──────────────────
  // Délai basé sur le poids estimé de chaque fichier pour éviter les pics de rate limit.
  // En Tier 1 (30k ITPM) : on espace les gros fichiers de ~2s entre eux.
  // En Tier 2+ (450k ITPM) : les délais sont négligeables mais ne font pas de mal.
  await updateProgress(supabaseAdmin, analyseId, 0, files.length, `Extraction de ${files.length} document(s) en parallèle…`);

  // Calculer les délais de démarrage échelonnés selon le poids de chaque fichier
  // ~1 token ≈ 3 chars base64, Tier 1 = 30k tokens/min = 500 tokens/sec
  // Pour un fichier de 60k tokens on attend ~2s avant de lancer le suivant
  const delays: number[] = [0];
  for (let i = 1; i < files.length; i++) {
    const prevTokens = Math.ceil(files[i - 1].data.length / 3);
    // Délai = tokens du fichier précédent / 500 tokens/sec, avec un max de 3s
    const delayMs = Math.min(Math.ceil(prevTokens / 500), 3000);
    delays.push(delays[i - 1] + delayMs);
  }

  const mapResults = await Promise.all(
    files.map(async (file, i) => {
      if (delays[i] > 0) await sleep(delays[i]);

      const { text, error } = await callAI({
        system: PROMPT_MAP,
        userContent: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: file.data },
          },
          {
            type: 'text',
            text: `Extrais TOUTES les informations clés de ce document immobilier, sans rien omettre, même les mentions en bas de page ou les notes de bas de tableau : ${file.name}`,
          },
        ],
        maxTokens: 2500,
        apiKey,
        model: AI_MODEL_MAP,
      });

      return { file, text, error, index: i };
    })
  );

  // Vérifier les erreurs critiques
  const criticalError = mapResults.find(r => r.error === 'rate_limit' || r.error === 'overload');
  if (criticalError) return { report: null, error: criticalError.error };

  // Construire les résumés dans l'ordre original
  const summaries: DocSummary[] = mapResults.map(({ file, text }) => {
    const parsed = parseJson<DocSummary>(text);
    return parsed
      ? { ...parsed, filename: file.name, raw_text_preview: '' }
      : {
          filename: file.name,
          detected_type: 'AUTRE',
          points_positifs: [],
          points_vigilance: ['Document partiellement lisible — certaines informations ont pu être manquées'],
          travaux_votes: [],
          travaux_evoques: [],
          procedures: [],
          infos_financieres: '',
          diagnostics: [],
          raw_text_preview: '',
        };
  });

  await updateProgress(supabaseAdmin, analyseId, files.length, files.length, 'Extraction terminée, synthèse en cours…');

  // ── PHASE REDUCE ─────────────────────────────────────────────
  await updateProgress(supabaseAdmin, analyseId, files.length, files.length, 'Synthèse croisée des documents…');

  const summariesText = summaries.map((s, i) =>
    `=== Document ${i + 1} : ${s.filename} (${s.detected_type}) ===\n` +
    `Points positifs : ${s.points_positifs.join(' | ')}\n` +
    `Points de vigilance : ${s.points_vigilance.join(' | ')}\n` +
    `Travaux votés : ${s.travaux_votes.join(' | ')}\n` +
    `Travaux évoqués : ${s.travaux_evoques.join(' | ')}\n` +
    `Procédures : ${s.procedures.join(' | ')}\n` +
    `Infos financières : ${s.infos_financieres}\n` +
    `Diagnostics : ${s.diagnostics.join(' | ')}`
  ).join('\n\n');

  // Charger la réglementation selon les types de documents détectés
  const categories = detecterCategories(summaries);
  const regles = await chargerReglementation(supabaseAdmin, categories);

  const { text: reduceText, error: reduceError } = await callAI({
    system: buildPromptReduce(mode, profil) + regles,
    userContent: [{
      type: 'text',
      text: `Voici les résumés structurés extraits de ${files.length} document(s). Synthétise-les en croisant les informations pour produire un rapport complet et précis :\n\n${summariesText}`,
    }],
    maxTokens: mode === 'complete' ? 4000 : 1500,
    apiKey,
  });

  if (reduceError) return { report: null, error: reduceError };

  const report = parseJson<Record<string, unknown>>(reduceText);
  return { report };
}

// ─── Handler principal ────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY non configurée');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const { analyseId, mode, profil, files } = await req.json() as {
      analyseId: string;
      mode: string;
      profil: 'rp' | 'invest';
      files: FileInput[];
    };

    if (!analyseId || !mode || !files?.length) {
      return new Response(JSON.stringify({ error: 'missing_params' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    // Marquer comme processing
    await supabaseAdmin.from('analyses').update({ status: 'processing' }).eq('id', analyseId);
    await updateProgress(supabaseAdmin, analyseId, 0, files.length, 'Démarrage de l\'analyse…');

    // ── Choix de stratégie : Smart Stuffing ou Map-Reduce ────
    const estimatedTokens = estimateTokens(files);
    const useMapReduce = estimatedTokens > TOKEN_THRESHOLD || files.length > 6;

    console.log(`Stratégie : ${useMapReduce ? 'Map-Reduce' : 'Smart Stuffing'} | Tokens estimés : ~${estimatedTokens.toLocaleString()} | Fichiers : ${files.length}`);

    const { report: finalReport, error: strategyError } = useMapReduce
      ? await runMapReduce({ files, mode, profil, analyseId, apiKey, supabaseAdmin })
      : await runSmartStuffing({ files, mode, profil, analyseId, apiKey, supabaseAdmin });

    // ── Gestion d'erreur ─────────────────────────────────────
    if (strategyError || !finalReport) {
      await supabaseAdmin.from('analyses').update({ status: 'failed' }).eq('id', analyseId);

      const isRateLimit = strategyError === 'rate_limit';
      return new Response(JSON.stringify({
        error: strategyError || 'parse_error',
        message: isRateLimit
          ? 'Notre moteur est momentanément surchargé. Votre crédit a été remboursé automatiquement. Réessayez dans 2 à 3 minutes.'
          : 'Une erreur est survenue lors de l\'analyse. Votre crédit a été remboursé automatiquement.',
      }), {
        status: isRateLimit ? 429 : 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Sauvegarder en base ───────────────────────────────────
    const isApercu = mode.startsWith('apercu');
    const title = (finalReport.titre as string) || 'Analyse immobilière';
    const score = finalReport.score as number | null ?? null;
    const avisVerimo = (finalReport.avis_verimo as string) || null;

    const updateData: Record<string, unknown> = {
      status: 'completed',
      progress_current: files.length,
      progress_total: files.length,
      progress_message: 'Rapport prêt !',
      title,
      score,
      avis_verimo: avisVerimo,
      profil,
    };

    if (isApercu) {
      updateData.apercu = finalReport;
      updateData.is_preview = true;
    } else {
      updateData.result = finalReport;
      updateData.paid = true;
    }

    await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);

    return new Response(JSON.stringify({ success: true, analyseId }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Edge Function error:', err);
    return new Response(JSON.stringify({
      error: 'server_error',
      message: 'Une erreur inattendue est survenue.',
    }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});

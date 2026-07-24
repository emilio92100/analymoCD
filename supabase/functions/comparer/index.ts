// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — comparer (v4 — recommandé = Bien 1 partout)
// Reçoit 2-3 IDs d'analyses complètes
// Lit les rapports JSON depuis Supabase
// Appelle Claude pour générer un verdict comparatif personnalisé
// Stocke le verdict dans la table comparaisons
//
// v2 :
//   - Retry sur 503/529 (3 tentatives)
//   - Insertion alertes dans system_alerts (page admin)
//   - Distinction des erreurs (overload, rate_limit, auth, parse)
//   - Messages utilisateur clairs et en français
//
// v3 :
//   - ORDRE CANONIQUE : les analyseIds sont TOUJOURS triés avant
//     génération. Le verdict ("Bien 1", "Bien 2", bien_recommande_idx)
//     correspond donc toujours à l'ordre trié — le même que la clé de
//     cache et que l'affichage frontend. Fini le désalignement quand on
//     rouvre depuis l'historique.
//   - Marqueur verdict._ordre_trie = true. Les verdicts en cache SANS
//     ce marqueur (générés avec l'ordre de clic, potentiellement
//     désalignés) sont ignorés et régénérés automatiquement.
//   - ANTI-DOUBLON : si une ligne est en status='processing' depuis
//     moins de 150s, on refuse le relancement (HTTP 409) au lieu de
//     lancer un 2e appel Claude en parallèle. Si le processing est
//     "stale" (>150s, fonction probablement morte), on autorise la
//     régénération.
//   - Sleep overload réduit à 8s pour tenir dans le budget 2 min.
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const AI_MODEL = 'claude-sonnet-4-6';
const AI_VERSION = '2023-06-01';
const MAX_TOKENS = 4000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SupabaseClient = ReturnType<typeof createClient>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ══════════════════════════════════════════════════════════════
// INSERTION D'UNE ALERTE SYSTÈME POUR L'ADMIN
// ══════════════════════════════════════════════════════════════
async function insertSystemAlert(
  supabaseAdmin: SupabaseClient,
  params: {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('system_alerts').insert({
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      analyse_id: null,
      user_id: params.userId || null,
      metadata: params.metadata || {},
    });
    if (error) {
      console.error('[comparer] Erreur insertion alerte:', error.message);
    } else {
      console.log(`[comparer] 🔔 Alerte système: ${params.type} — ${params.title}`);
    }
  } catch (err) {
    console.error('[comparer] Erreur insertion alerte:', err);
  }
}

function buildComparePrompt(): string {
  return `Tu es l'analyste comparatif de Verimo, un outil d'aide à la décision pour les acheteurs immobiliers.

RÔLE ET TON :
- Tu es objectif, factuel et bienveillant.
- Tu NE RECOMMANDES JAMAIS d'acheter ou de ne pas acheter un bien.
- Tu NE DIS JAMAIS "n'achetez pas", "ce bien est à éviter", "fuyez" ou toute formulation directive négative.
- Tu présentes les forces et faiblesses de chaque bien de manière équilibrée.
- Tu utilises des formulations nuancées : "présente un profil plus équilibré", "nécessite une attention particulière", "offre une meilleure visibilité financière".
- Tu laisses TOUJOURS la décision finale à l'acheteur.
- Tu ne mentionnes jamais Claude, Anthropic ou IA.

STRUCTURE DE TA RÉPONSE (JSON strict) :
{
  "bien_recommande_idx": 0,
  "titre_verdict": "phrase courte résumant la comparaison — ex: Le Bien 1 présente un profil globalement plus équilibré",
  "ecarts_cles": {
    "score": { "bien_1": 14, "bien_2": 13.5, "bien_3": null, "delta_label": "0,5 pt d'écart" },
    "cout_annee_1": { "bien_1": 2361, "bien_2": 3209, "bien_3": null, "delta_label": "848 € d'écart sur l'année 1" },
    "dpe": { "bien_1": "E", "bien_2": "E", "bien_3": null, "delta_label": "Même classe" }
  },
  "lecture_verimo": "4-6 phrases denses. LA section d'analyse du rapport (fusion de la lecture comparée et de l'analyse croisée). Structure imposée : (1) le constat décisif — les 2-3 écarts concrets qui font pencher la balance, classés par impact financier réel pour l'acheteur ; (2) les corrélations inter-thèmes que les chiffres séparés ne montrent pas (ex : DPE + fonds travaux, impayés + dette fournisseurs + travaux non votés) ; (3) ce que chaque bien coûte de manière CERTAINE vs ce qu'il expose comme risque NON CHIFFRÉ. Factuel strict.",
  "profils": [
    {
      "bien_idx": 0,
      "profil": "2-3 mots décrivant le profil global (ex: 'Gestion sereine', 'Vigilance financière', 'Profil équilibré')",
      "forces": [
        { "titre": "Titre court 3-5 mots", "detail": "Phrase de détail explicative 15-25 mots", "impact": "majeur|modere|mineur" }
      ],
      "points_faibles": [
        { "titre": "Titre court 3-5 mots", "detail": "Phrase de détail explicative 15-25 mots", "impact": "majeur|modere|mineur" }
      ]
    }
  ],
  "points_a_approfondir": [
    { "bien": "Bien 1|Bien 2|Bien 3|Les 2|Les 3", "action": "Action concrète à mener avant signature, 15-25 mots" }
  ],
  "alerte_documents": "Si un bien a été analysé avec significativement moins de documents que l'autre, le signaler ici. Sinon null."
}

RÈGLES DE REMPLISSAGE :
- profils[] doit contenir EXACTEMENT N objets où N = nombre de biens comparés (2 ou 3).
- profils[i].bien_idx doit correspondre à l index du bien dans l ordre reçu (0 pour Bien 1, 1 pour Bien 2, 2 pour Bien 3).
- Chaque bien doit avoir AU MOINS 2 forces et AU MOINS 1 point faible (même le bien recommandé a des points faibles — symétrie de traitement).
- 3-4 forces et 2-3 points faibles par bien est une bonne moyenne.
- forces + points_faibles DOIVENT être factuels et mesurables (chiffres, dates, statuts précis). Pas de généralités.
- impact = "majeur" si ça change la décision (ex: procédure lourde, travaux > 20 000 €), "modere" si ça mérite attention (ex: DPE E, tensions AG), "mineur" si c est un point de contexte.
- points_a_approfondir : 3-5 items concrets. Chaque item cible un bien précis (champ "bien"). Exemples d actions : "Réclamer le pré-état daté", "Demander le détail des travaux votés", "Vérifier le dernier PV d AG".
- ecarts_cles.bien_X null si le bien n existe pas (cas 2 biens : bien_3 = null partout).
- ecarts_cles.cout_annee_1 : somme de (charges annuelles + fonds ALUR signature + fonds roulement signature + cotisations fonds travaux année 1 + taxe foncière annuelle si disponible dans finances.taxe_fonciere_annuelle). Si pré-état daté manquant, estimer sur charges annuelles seules et le signaler dans le commentaire.
- ecarts_cles.delta_label : formulation "X d écart" adaptée au type (points, euros, lettres).

RÈGLES POUR lecture_verimo :
- C'est LA section à forte valeur ajoutée du rapport : elle doit HIÉRARCHISER, pas énumérer. Classer les écarts par impact financier réel pour l'acheteur : coûts certains (charges annuelles, fonds à rembourser à la signature, quote-part de travaux votés) > engagements très probables (travaux évoqués chiffrés par devis, obligations légales) > risques non chiffrés (procédures, absence de documents, travaux évoqués sans montant).
- DPE : tu PEUX mentionner les obligations réglementaires FACTUELLES attachées à une classe (interdiction progressive de location des passoires thermiques F et G, audit énergétique obligatoire à la vente pour F et G) — ce sont des faits de loi, pas des projections. Tu peux relever qu'un DPE E/F/G combiné à un fonds travaux insuffisant ou à des travaux énergétiques non votés constitue un cumul de signaux sur la même problématique.
- INTERDIT : projection chiffrée inventée ("cela pourrait coûter X €" sans devis présent dans les documents), estimation de perte ou de prise de valeur, pronostic de votes futurs en AG, calcul de rendement locatif.
- AUTORISÉ : additionner des montants présents dans les documents, relier DPE + fonds travaux, relier procédure + impayés + dette fournisseurs, pointer un effet cumulatif factuel.
- Si les deux biens sont réellement très proches sur les axes mesurables : le dire clairement plutôt que de forcer un écart artificiel, et indiquer que la décision se jouera sur les critères non documentaires (emplacement, agencement, prix).

RÈGLE ANTI-REDONDANCE (s'applique à l'ENSEMBLE du JSON) :
- Chaque fait chiffré précis (un montant, un pourcentage, une classe DPE, une date) ne doit être DÉVELOPPÉ que dans UNE SEULE section du verdict. Répartition stricte : lecture_verimo hiérarchise et relie les faits déterminants ; profils[] détaille les forces/faiblesses propres à chaque bien ; alerte_documents ne parle QUE des documents ; points_a_approfondir ne contient QUE des actions à mener.
- Une même idée d'analyse ne doit JAMAIS apparaître deux fois sous deux formulations différentes dans le verdict.
- alerte_documents : STRICTEMENT limité à l'asymétrie documentaire (quels documents manquent, pour quel bien, quelles années/périodes, et en une phrase pourquoi cela limite la comparaison). AUCUNE reprise des montants financiers, du DPE ou des travaux déjà traités ailleurs.

RÈGLE TAXE FONCIÈRE DANS COMPARER :
- Si l un des biens a finances.taxe_fonciere_annuelle renseignée et l autre non, signaler l asymétrie dans alerte_documents ou dans points_a_approfondir (ex: "Demander le dernier avis de taxe foncière du Bien 2 pour une comparaison complète").
- Si la taxe foncière est renseignée pour les 2 biens, elle DOIT être incluse dans cout_annee_1.
- Si les 2 biens ont chauffage ou eau chaude individuels (finances.chauffage_individuel ou finances.eau_chaude_individuelle = true), l ajouter dans points_a_approfondir : "Obtenir du vendeur les consommations annuelles de chauffage/eau chaude individuels — non incluses dans les charges".

RÈGLES CRITIQUES :
- Les travaux VOTÉS avant la vente sont à la charge du vendeur — ne les compte PAS comme un risque pour l'acheteur.
- Les travaux ÉVOQUÉS non votés sont un vrai risque — l'acheteur paiera si ces travaux sont votés après la signature.
- Le fonds ALUR et le fonds de roulement sont à REMBOURSER AU VENDEUR à la signature, en sus du prix — c'est un coût réel pour l'acheteur.
- DPE D = bonne performance, NE PAS le signaler négativement. Seuls E, F, G sont des points d'attention.

RÈGLE DE SÉLECTION DU BIEN RECOMMANDÉ (bien_recommande_idx) :
1. PAR DÉFAUT : le bien recommandé est celui qui a le MEILLEUR SCORE /20. Cette règle s'applique dans 90% des cas.
2. EXCEPTION POSSIBLE : tu peux recommander un bien avec un score INFÉRIEUR UNIQUEMENT si le bien avec le meilleur score présente au moins l'UN de ces facteurs bloquants :
   * Travaux évoqués ou votés à la charge de l'acheteur > 20 000 EUR
   * Procédure judiciaire grave en cours (contentieux copro, administration provisoire)
   * DPE F ou G (passoire thermique) alors que l'autre bien est A-D
   * Impayés de copropriété globaux > 15% du budget annuel
   * Cumul d'au moins DEUX signaux financiers majeurs convergents (impayés > 15% du budget, dette fournisseurs significative, fonds travaux insuffisant) COMBINÉ à des travaux lourds non votés estimés > 50 000 EUR dans les documents
   * Asymétrie documentaire MAJEURE : le bien au meilleur score a été analysé avec < 3 documents, l'autre avec beaucoup plus
3. SI TU FAIS UNE EXCEPTION : tu DOIS impérativement mentionner explicitement dans titre_verdict ET dans lecture_verimo POURQUOI tu ne recommandes pas le meilleur score.
4. SI AUCUN FACTEUR BLOQUANT : tu dois OBLIGATOIREMENT recommander le bien avec le meilleur score, même si l'écart est faible.

COHÉRENCE DU TEXTE NARRATIF :
- titre_verdict et lecture_verimo doivent TOUJOURS désigner le bien indiqué par bien_recommande_idx. Jamais de contradiction entre l'index numérique et le texte.
- Utilise "Bien 1", "Bien 2", "Bien 3" dans le texte pour correspondre aux labels de l'interface (l'ordre des biens dans les données = l'ordre affiché à l'écran).
- RÈGLE TITRE_VERDICT : NE JAMAIS utiliser "malgré" suivi d'un écart de score quand le bien recommandé A le meilleur score. "Malgré un écart de 2 points" sous-entend que le bien recommandé aurait une note inférieure, ce qui est trompeur. Formulations correctes : "Le Bien 1 se distingue avec un score supérieur de 2 points" ou "Le Bien 1 présente un profil globalement plus équilibré, avec 2 points d'avance". Réserver "malgré" UNIQUEMENT au cas d'exception où le bien recommandé a un score INFÉRIEUR au meilleur score.

- Réponds UNIQUEMENT en JSON strict, sans texte avant ou après.`;
}

// ══════════════════════════════════════════════════════════════
// v4 — RENUMÉROTATION : le bien recommandé devient TOUJOURS le Bien 1
// Si Claude recommande un autre bien que le premier (exception facteur
// bloquant), on permute tout le verdict : textes "Bien X", index des
// profils, valeurs des écarts clés. L'ordre d'affichage final (ids) est
// retourné pour que le frontend affiche exactement dans cet ordre.
// ══════════════════════════════════════════════════════════════
// deno-lint-ignore no-explicit-any
function remapVerdictRecommandeEnPremier(verdict: any, orderedIds: string[]): { verdict: any; ordreAffichage: string[] } {
  const n = orderedIds.length;
  let r = typeof verdict.bien_recommande_idx === 'number' ? verdict.bien_recommande_idx : 0;
  if (r < 0 || r >= n) r = 0;
  if (r === 0) {
    verdict.bien_recommande_idx = 0;
    return { verdict, ordreAffichage: orderedIds };
  }

  // perm[i] = ancien index du bien affiché en position i (recommandé en premier)
  const perm = [r, ...Array.from({ length: n }, (_, i) => i).filter(i => i !== r)];
  const newIdxOf = (old: number) => perm.indexOf(old);

  // 1) Textes : permuter les mentions "Bien X" / "bien X" partout dans le
  //    verdict (titre, comparatif, analyse croisée, delta_labels, actions…).
  //    Placeholders pour éviter les collisions pendant la permutation.
  let s = JSON.stringify(verdict);
  for (let old = 0; old < n; old++) {
    s = s.split(`Bien ${old + 1}`).join(`§B_${newIdxOf(old) + 1}§`);
    s = s.split(`bien ${old + 1}`).join(`§b_${newIdxOf(old) + 1}§`);
  }
  for (let i = 1; i <= n; i++) {
    s = s.split(`§B_${i}§`).join(`Bien ${i}`);
    s = s.split(`§b_${i}§`).join(`bien ${i}`);
  }
  // deno-lint-ignore no-explicit-any
  let v: any;
  try { v = JSON.parse(s); } catch { v = verdict; }

  // 2) Structures numériques
  v.bien_recommande_idx = 0;
  if (Array.isArray(v.profils)) {
    // deno-lint-ignore no-explicit-any
    v.profils.forEach((p: any) => {
      if (typeof p.bien_idx === 'number' && p.bien_idx >= 0 && p.bien_idx < n) p.bien_idx = newIdxOf(p.bien_idx);
    });
    // deno-lint-ignore no-explicit-any
    v.profils.sort((a: any, b: any) => ((a.bien_idx ?? 0) as number) - ((b.bien_idx ?? 0) as number));
  }
  // deno-lint-ignore no-explicit-any
  const remapEcart = (e: any) => {
    if (!e || typeof e !== 'object') return;
    const oldVals = [e.bien_1 ?? null, e.bien_2 ?? null, e.bien_3 ?? null];
    for (let i = 0; i < 3; i++) e[`bien_${i + 1}`] = i < n ? oldVals[perm[i]] : null;
  };
  if (v.ecarts_cles) {
    remapEcart(v.ecarts_cles.score);
    remapEcart(v.ecarts_cles.cout_annee_1);
    remapEcart(v.ecarts_cles.dpe);
  }

  return { verdict: v, ordreAffichage: perm.map(i => orderedIds[i]) };
}

// ══════════════════════════════════════════════════════════════
// APPEL CLAUDE AVEC RETRY SUR 503/529/429
// ══════════════════════════════════════════════════════════════
type ClaudeError = 'overload' | 'rate_limit' | 'auth' | 'api_error' | 'network';
type ClaudeResult = { text: string; error?: undefined } | { text?: undefined; error: ClaudeError; status?: number };

async function callClaude(systemPrompt: string, userMessage: string, apiKey: string): Promise<ClaudeResult> {
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
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text || '';
        if (!text) return { error: 'api_error' };
        return { text };
      }

      const errBody = await res.text();
      console.error(`[comparer] Anthropic ${res.status} (tentative ${attempt}):`, errBody);

      if (res.status === 503 || res.status === 529) {
        if (attempt < 3) { await sleep(8000); continue; }
        return { error: 'overload', status: res.status };
      }
      if (res.status === 429) {
        if (attempt < 3) { await sleep(Math.pow(2, attempt) * 5000); continue; }
        return { error: 'rate_limit', status: res.status };
      }
      if (res.status === 401 || res.status === 403) {
        return { error: 'auth', status: res.status };
      }
      return { error: 'api_error', status: res.status };

    } catch (err) {
      console.error(`[comparer] Erreur réseau (tentative ${attempt}):`, err);
      if (attempt < 3) { await sleep(3000); continue; }
      return { error: 'network' };
    }
  }
  return { error: 'api_error' };
}

// ══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) return new Response(JSON.stringify({ error: 'config_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  let userIdForCatch: string | undefined;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    userIdForCatch = user.id;

    const body = await req.json() as { analyseIds: string[] };
    // ─── v3 : ORDRE CANONIQUE ───────────────────────────────────
    // On trie TOUJOURS les IDs. "Bien 1" = premier ID trié, partout :
    // dans le prompt, dans le verdict, dans la clé de cache, et dans
    // l'affichage frontend (qui trie aussi les ids de l'URL).
    const analyseIds = Array.isArray(body.analyseIds) ? [...body.analyseIds].sort() : [];

    if (!analyseIds || analyseIds.length < 2 || analyseIds.length > 3) {
      return new Response(JSON.stringify({
        error: 'invalid_params',
        userMessage: 'La comparaison nécessite 2 ou 3 analyses.',
      }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const { data: analyses, error: fetchError } = await supabaseAdmin
      .from('analyses')
      .select('id, title, result, score, user_id')
      .in('id', analyseIds)
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (fetchError || !analyses || analyses.length < 2) {
      return new Response(JSON.stringify({
        error: 'analyses_not_found',
        userMessage: 'Une ou plusieurs analyses sont introuvables ou ne sont pas terminées.',
      }), { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const analysesFound = analyseIds
      .map(id => analyses.find(a => a.id === id))
      .filter((a): a is NonNullable<typeof a> => a !== undefined);

    if (analysesFound.length !== analyseIds.length) {
      return new Response(JSON.stringify({
        error: 'analyses_not_found',
        userMessage: 'Une ou plusieurs analyses sont introuvables.',
      }), { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // ─── v4 : ORDRE DE GÉNÉRATION = meilleur score d'abord ──────
    // "Bien 1" envoyé à Claude = meilleur score (tie-break: id) → dans ~90%
    // des cas le bien recommandé sera déjà le Bien 1. Si Claude fait une
    // exception (facteur bloquant), on renumérote après coup (voir
    // remapVerdictRecommandeEnPremier) pour que le recommandé soit TOUJOURS
    // le Bien 1 à l'affichage.
    const analysesOrdered = [...analysesFound].sort((a, b) => {
      const scoreDiff = ((b.score as number) ?? 0) - ((a.score as number) ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return String(a.id).localeCompare(String(b.id));
    });

    const sortedIds = analyseIds.join(','); // déjà triés (ordre canonique v3)
    const { data: existing } = await supabaseAdmin
      .from('comparaisons')
      .select('verdict, status, updated_at')
      .eq('user_id', user.id)
      .eq('analyse_ids', sortedIds)
      .maybeSingle();

    // Cache : on ne sert que les verdicts v4 (champ ordre_affichage présent :
    // recommandé = Bien 1, ordre d'affichage stocké). Les verdicts plus
    // anciens sont régénérés silencieusement à la première réouverture.
    //
    // 🔧 FIX : le verdict peut revenir de la BDD sous forme de STRING JSON
    // (comportement déjà observé côté frontend). Sans ce parse, le check
    // échouait toujours → un appel Claude complet était relancé à CHAQUE
    // ouverture du rapport.
    let existingVerdict = existing?.verdict as Record<string, unknown> | string | null;
    if (typeof existingVerdict === 'string') {
      try { existingVerdict = JSON.parse(existingVerdict) as Record<string, unknown>; }
      catch { existingVerdict = null; }
    }
    if (existingVerdict && Array.isArray(existingVerdict.ordre_affichage)) {
      return new Response(JSON.stringify({ success: true, verdict: existingVerdict, cached: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ─── v3 : ANTI-DOUBLON ──────────────────────────────────────
    // Si cette comparaison est déjà en cours depuis moins de 150s,
    // on refuse le relancement : le 1er appel finira et remplira le
    // verdict. Le frontend affiche l'attente et re-tente plus tard.
    // Au-delà de 150s, le processing est considéré mort (crash/timeout)
    // → on autorise la régénération.
    const SEUIL_PROCESSING_MS = 150 * 1000;
    if (
      existing?.status === 'processing' &&
      existing.updated_at &&
      Date.now() - new Date(existing.updated_at as string).getTime() < SEUIL_PROCESSING_MS
    ) {
      return new Response(JSON.stringify({
        error: 'in_progress',
        userMessage: 'Cette comparaison est déjà en cours de génération. Elle apparaîtra automatiquement dans quelques instants.',
      }), { status: 409, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // ─── Marqueur "en cours" : on crée (ou réactive) la ligne AVANT l'appel long
    // à Claude. Ainsi, si l'utilisateur quitte l'onglet, le frontend peut retrouver
    // la comparaison en cours via son statut en base (comme une analyse classique).
    // Le verdict reste null tant que le traitement n'est pas fini.
    await supabaseAdmin.from('comparaisons').upsert({
      user_id: user.id,
      analyse_ids: sortedIds,
      status: 'processing',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,analyse_ids' });

    const userContent = analysesOrdered.map((a, i) => {
      const result = a.result as Record<string, unknown>;
      const compact = {
        titre: result.titre,
        score: result.score,
        score_niveau: result.score_niveau,
        type_bien: result.type_bien,
        resume: result.resume,
        points_forts: result.points_forts,
        points_vigilance: result.points_vigilance,
        categories: result.categories,
        travaux: result.travaux,
        finances: result.finances,
        procedures: result.procedures,
        diagnostics_resume: result.diagnostics_resume,
        documents_analyses: result.documents_analyses,
        pre_etat_date: result.pre_etat_date,
        lot_achete: result.lot_achete,
        negociation: result.negociation,
        avis_verimo: result.avis_verimo,
      };
      return `=== BIEN ${i + 1} : ${result.titre || a.title} ===\n${JSON.stringify(compact, null, 0)}`;
    }).join('\n\n');

    const result = await callClaude(
      buildComparePrompt(),
      `Compare ces ${analysesOrdered.length} biens et génère le verdict comparatif en JSON.\n\n${userContent}`,
      apiKey,
    );

    if ('error' in result && result.error) {
      let alertType: string;
      let alertSeverity: 'warning' | 'critical';
      let alertTitle: string;
      let userMessage: string;

      switch (result.error) {
        case 'auth':
          alertType = 'api_billing';
          alertSeverity = 'critical';
          alertTitle = 'Comparaison — clé API Anthropic / quota';
          userMessage = 'Notre service rencontre un problème technique. Notre équipe est informée. Veuillez réessayer plus tard.';
          break;
        case 'overload':
          alertType = 'overload';
          alertSeverity = 'warning';
          alertTitle = 'Comparaison — surcharge serveur';
          userMessage = 'Notre service est temporairement indisponible. Veuillez réessayer dans quelques minutes.';
          break;
        case 'rate_limit':
          alertType = 'rate_limit';
          alertSeverity = 'warning';
          alertTitle = 'Comparaison — rate limit';
          userMessage = 'Notre service est momentanément surchargé. Veuillez réessayer dans 2 à 3 minutes.';
          break;
        case 'network':
          alertType = 'api_error';
          alertSeverity = 'warning';
          alertTitle = 'Comparaison — erreur réseau';
          userMessage = 'Une erreur réseau est survenue. Veuillez vérifier votre connexion et réessayer.';
          break;
        default:
          alertType = 'api_error';
          alertSeverity = 'warning';
          alertTitle = 'Comparaison — erreur serveur';
          userMessage = 'Notre service rencontre une perturbation temporaire. Veuillez réessayer dans quelques minutes.';
      }

      await insertSystemAlert(supabaseAdmin, {
        type: alertType,
        severity: alertSeverity,
        title: alertTitle,
        message: userMessage,
        userId: user.id,
        metadata: { stage: 'compare_call', error: result.error, status: result.status, analyseIds },
      });

      // La comparaison a échoué : on marque la ligne pour que le frontend
      // arrête le spinner et affiche l'erreur au lieu de tourner indéfiniment.
      await supabaseAdmin.from('comparaisons')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('user_id', user.id).eq('analyse_ids', sortedIds);

      return new Response(JSON.stringify({
        error: result.error,
        userMessage,
      }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    let verdict;
    try {
      let clean = result.text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) clean = clean.slice(start, end + 1);
      verdict = JSON.parse(clean);
    } catch (parseErr) {
      console.error('[comparer] JSON parse error:', parseErr, 'raw:', result.text.slice(0, 200));
      await insertSystemAlert(supabaseAdmin, {
        type: 'analysis_failed',
        severity: 'warning',
        title: 'Comparaison — réponse invalide',
        message: 'La réponse du moteur de comparaison n\'a pas pu être interprétée.',
        userId: user.id,
        metadata: { stage: 'parse', rawSnippet: result.text.slice(0, 200), analyseIds },
      });
      await supabaseAdmin.from('comparaisons')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('user_id', user.id).eq('analyse_ids', sortedIds);
      return new Response(JSON.stringify({
        error: 'parse_error',
        userMessage: 'Une erreur est survenue lors de la génération de la comparaison. Veuillez réessayer.',
      }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // v4 : le recommandé devient TOUJOURS le Bien 1 (renumérotation si
    // nécessaire), et l'ordre d'affichage (ids) est stocké dans le verdict
    // pour que le frontend affiche toutes les sections dans le même ordre.
    const remap = remapVerdictRecommandeEnPremier(verdict, analysesOrdered.map(a => String(a.id)));
    verdict = remap.verdict;
    verdict._ordre_trie = true;
    verdict.ordre_affichage = remap.ordreAffichage;

    const { error: upsertError } = await supabaseAdmin.from('comparaisons').upsert({
      user_id: user.id,
      analyse_ids: sortedIds,
      verdict,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,analyse_ids' });

    if (upsertError) {
      console.error('[comparer] UPSERT ERROR:', JSON.stringify(upsertError));
      await insertSystemAlert(supabaseAdmin, {
        type: 'save_error',
        severity: 'warning',
        title: 'Comparaison — sauvegarde échouée',
        message: 'Le verdict de comparaison a été généré mais n\'a pas pu être sauvegardé en base. Le client a quand même reçu la réponse.',
        userId: user.id,
        metadata: { stage: 'upsert', error: upsertError.message, analyseIds },
      });
      return new Response(JSON.stringify({ success: true, verdict, cached: false }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    console.log('[comparer] Upsert OK pour user', user.id, 'ids', sortedIds);

    return new Response(JSON.stringify({ success: true, verdict, cached: false }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[comparer] Erreur globale:', err);
    if (userIdForCatch) {
      await insertSystemAlert(supabaseAdmin, {
        type: 'unexpected_error',
        severity: 'critical',
        title: 'Comparaison — erreur inattendue',
        message: 'Une erreur inattendue est survenue lors de la comparaison.',
        userId: userIdForCatch,
        metadata: { stage: 'global_catch', error: String(err) },
      });
    }
    return new Response(JSON.stringify({
      error: 'server_error',
      userMessage: 'Une erreur inattendue est survenue. Veuillez réessayer ou contacter le support.',
    }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});

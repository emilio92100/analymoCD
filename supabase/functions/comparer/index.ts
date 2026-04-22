// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — comparer
// Reçoit 2-3 IDs d'analyses complètes
// Lit les rapports JSON depuis Supabase
// Appelle Claude pour générer un verdict comparatif personnalisé
// Stocke le verdict dans la table comparaisons
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
  "comparatif": "2-3 phrases (3-4 si 3 biens) comparant directement les biens. Factuel, nuancé.",
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
- comparatif : 2-3 phrases qui comparent directement les biens (ex: "Le Bien 1 se distingue par X, tandis que le Bien 2 présente Y. L écart principal porte sur Z.")
- points_a_approfondir : 3-5 items concrets. Chaque item cible un bien précis (champ "bien"). Exemples d actions : "Réclamer le pré-état daté", "Demander le détail des travaux votés", "Vérifier le dernier PV d AG".
- ecarts_cles.bien_X null si le bien n existe pas (cas 2 biens : bien_3 = null partout).
- ecarts_cles.cout_annee_1 : somme de (charges annuelles + fonds ALUR signature + fonds roulement signature + cotisations fonds travaux année 1 + taxe foncière annuelle si disponible dans finances.taxe_fonciere_annuelle). Si pré-état daté manquant, estimer sur charges annuelles seules et le signaler dans le commentaire.
- ecarts_cles.delta_label : formulation "X d écart" adaptée au type (points, euros, lettres).

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
   * Asymétrie documentaire MAJEURE : le bien au meilleur score a été analysé avec < 3 documents, l'autre avec beaucoup plus
3. SI TU FAIS UNE EXCEPTION : tu DOIS impérativement mentionner explicitement dans titre_verdict ET dans comparatif POURQUOI tu ne recommandes pas le meilleur score.
4. SI AUCUN FACTEUR BLOQUANT : tu dois OBLIGATOIREMENT recommander le bien avec le meilleur score, même si l'écart est faible.

COHÉRENCE DU TEXTE NARRATIF :
- titre_verdict et comparatif doivent TOUJOURS désigner le bien indiqué par bien_recommande_idx. Jamais de contradiction entre l'index numérique et le texte.
- Utilise "Bien 1", "Bien 2", "Bien 3" dans le texte pour correspondre aux labels de l'interface (l'ordre des biens dans les données = l'ordre affiché à l'écran).

- Réponds UNIQUEMENT en JSON strict, sans texte avant ou après.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) return new Response(JSON.stringify({ error: 'config_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Vérifier l'auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const body = await req.json() as { analyseIds: string[] };
    const { analyseIds } = body;

    if (!analyseIds || analyseIds.length < 2 || analyseIds.length > 3) {
      return new Response(JSON.stringify({ error: 'invalid_params', message: '2 ou 3 analyses requises' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // Vérifier que les analyses appartiennent à l'utilisateur et sont complètes
    const { data: analyses, error: fetchError } = await supabaseAdmin
      .from('analyses')
      .select('id, title, result, score, user_id')
      .in('id', analyseIds)
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (fetchError || !analyses || analyses.length < 2) {
      return new Response(JSON.stringify({ error: 'analyses_not_found' }), { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // IMPORTANT : Supabase .in() ne préserve pas l'ordre d'analyseIds.
    // On réordonne les analyses dans l'ordre exact demandé par le frontend
    // pour que "Bien 1" dans le verdict corresponde bien au premier bien affiché côté UI.
    const analysesOrdered = analyseIds
      .map(id => analyses.find(a => a.id === id))
      .filter((a): a is NonNullable<typeof a> => a !== undefined);

    if (analysesOrdered.length !== analyseIds.length) {
      return new Response(JSON.stringify({ error: 'analyses_not_found' }), { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // Vérifier si un verdict existe déjà pour cette combinaison
    const sortedIds = [...analyseIds].sort().join(',');
    const { data: existing } = await supabaseAdmin
      .from('comparaisons')
      .select('verdict')
      .eq('user_id', user.id)
      .eq('analyse_ids', sortedIds)
      .maybeSingle();

    if (existing?.verdict) {
      return new Response(JSON.stringify({ success: true, verdict: existing.verdict, cached: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Construire le message pour Claude dans l'ordre demandé par le frontend
    const userContent = analysesOrdered.map((a, i) => {
      const result = a.result as Record<string, unknown>;
      // Extraire les données pertinentes pour la comparaison (pas tout le JSON)
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

    // Appel Claude
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
        system: buildComparePrompt(),
        messages: [{ role: 'user', content: `Compare ces ${analysesOrdered.length} biens et génère le verdict comparatif en JSON.\n\n${userContent}` }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[comparer] Anthropic error:', res.status, errText);
      return new Response(JSON.stringify({ error: 'ai_error', status: res.status }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const aiResponse = await res.json();
    const text = aiResponse.content?.find((b: { type: string }) => b.type === 'text')?.text || '';

    // Parser le JSON
    let verdict;
    try {
      let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) clean = clean.slice(start, end + 1);
      verdict = JSON.parse(clean);
    } catch (parseErr) {
      console.error('[comparer] JSON parse error:', parseErr, 'raw:', text.slice(0, 200));
      return new Response(JSON.stringify({ error: 'parse_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // Stocker le verdict
    const { error: upsertError } = await supabaseAdmin.from('comparaisons').upsert({
      user_id: user.id,
      analyse_ids: sortedIds,
      verdict,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,analyse_ids' });

    if (upsertError) {
      console.error('[comparer] UPSERT ERROR:', JSON.stringify(upsertError));
      return new Response(JSON.stringify({
        success: true,
        verdict,
        cached: false,
        debug_upsert_error: upsertError,
      }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    console.log('[comparer] Upsert OK pour user', user.id, 'ids', sortedIds);

    return new Response(JSON.stringify({ success: true, verdict, cached: false }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[comparer] Erreur:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});

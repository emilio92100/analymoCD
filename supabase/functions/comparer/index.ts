// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — comparer (session 8)
// Reçoit 2-3 IDs d'analyses complètes
// Lit les rapports JSON depuis Supabase
// Appelle Claude pour générer un verdict comparatif personnalisé
// Stocke le verdict dans la table comparaisons
//
// Nouveau schéma verdict (session 8) :
// - profils[] : profil + forces + points_faibles par bien (structuré titre+detail)
// - ecarts_cles : 3 métriques chiffrées pour comparaison visuelle
// - comparatif : 2-3 phrases sur la vraie différence entre biens
// - points_a_approfondir[] : actions concrètes par bien (ou "les 2")
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
- Tu orientes avec subtilité : "à anticiper", "à surveiller", "nécessite une vérification", "permet une meilleure visibilité", plutôt que des impératifs directs.
- Tu présentes les forces et faiblesses de chaque bien de manière équilibrée et SYMÉTRIQUE (forces ET points faibles pour CHAQUE bien).
- Tu laisses TOUJOURS la décision finale à l'acheteur.
- Tu ne mentionnes jamais Claude, Anthropic ou IA.

STRUCTURE DE TA RÉPONSE (JSON strict) :
{
  "bien_recommande_idx": 0,
  "titre_verdict": "1 phrase courte et nuancée résumant la comparaison — ex: Le Bien 1 offre un profil plus équilibré malgré une performance énergétique à surveiller",
  "ecarts_cles": {
    "score": { "bien_1": 14.5, "bien_2": 11.5, "bien_3": null, "delta_label": "3 pts d'écart" },
    "cout_annee_1": { "bien_1": 1501, "bien_2": 1608, "bien_3": null, "delta_label": "107 € d'écart" },
    "dpe": { "bien_1": "E", "bien_2": "D", "bien_3": null, "delta_label": "1 classe d'écart" }
  },
  "profils": [
    {
      "bien_idx": 0,
      "profil": "1 ligne factuelle sur le bien — type, surface, copro. Ex: T4 de 79 m² avec cave et box, copropriété de 330 lots",
      "forces": [
        { "titre": "2-3 mots clés", "detail": "phrase courte de contexte, sans impératif", "impact": "majeur|modere|mineur" }
      ],
      "points_faibles": [
        { "titre": "2-3 mots clés", "detail": "phrase courte nuancée — jamais d'impératif direct, privilégier 'à anticiper', 'à vérifier'", "impact": "majeur|modere|mineur" }
      ]
    }
  ],
  "comparatif": "2-3 phrases MAXIMUM sur la VRAIE différence entre les biens. Ce que l'un a que l'autre n'a pas, où se situe le risque principal de chacun. PAS une redite des profils.",
  "points_a_approfondir": [
    { "bien": "Bien 1|Bien 2|Bien 3|Les 2|Les 3", "action": "1 phrase d'action concrète — 'demander au syndic...', 'obtenir un devis...', 'consulter un expert...'" }
  ],
  "alerte_documents": "Si un bien a été analysé avec significativement moins de documents que l'autre, le signaler ici. Sinon null."
}

RÈGLES POUR LES CHAMPS :

1. "ecarts_cles"
- Toujours 3 métriques : score, cout_annee_1, dpe.
- Pour "score" et "cout_annee_1" : renvoyer des NOMBRES (pas de string avec €).
- Pour "dpe" : renvoyer la lettre "A" à "G", ou null si absent.
- "delta_label" : texte court genre "3 pts d'écart", "107 € d'écart", "1 classe d'écart", "même classe".
- Si bien_3 absent : mettre null dans bien_3.

2. "profils[]"
- UN objet par bien, dans l'ordre des biens reçus (bien_idx 0, 1, éventuellement 2).
- "profil" : 1 ligne factuelle maximum (pas un paragraphe).
- "forces" : 2 à 4 items. SYMÉTRIE : chaque bien doit en avoir.
- "points_faibles" : 2 à 4 items. SYMÉTRIE : chaque bien doit en avoir, même le bien recommandé.
- Chaque item : titre (2-3 mots accrocheurs) + detail (1 phrase de contexte) + impact ("majeur", "modere" ou "mineur").
- "majeur" : impact significatif sur la valeur, la sécurité, le coût (DPE F/G, fonds travaux très insuffisant, anomalies gaz/élec, lot complet rare).
- "modere" : à surveiller, budget à prévoir (travaux évoqués, DPE E, participation AG faible).
- "mineur" : bon à savoir (absence termites, fonds ALUR présent).

3. "comparatif"
- DOIT être la valeur ajoutée du verdict : ce que l'acheteur ne voit pas dans chaque rapport individuel.
- Focus sur la DIFFÉRENCE, pas la description.
- 2-3 phrases MAXIMUM.

4. "points_a_approfondir"
- 3 à 5 items.
- Actions concrètes : documents à demander, devis à obtenir, expert à consulter.
- Couvrir les 2 (ou 3) biens, pas uniquement le recommandé.
- Peut inclure une action "Les 2" (ou "Les 3") commune aux biens.

RÈGLES CRITIQUES MÉTIER :
- Les travaux VOTÉS avant la vente sont à la charge du vendeur — ne les compte PAS comme un risque pour l'acheteur.
- Les travaux ÉVOQUÉS non votés sont un vrai risque.
- Le fonds ALUR et le fonds de roulement sont à REMBOURSER AU VENDEUR à la signature — coût réel pour l'acheteur mais pas un risque financier de la copro.
- DPE D = bonne performance, NE PAS le signaler négativement. Seuls E, F, G sont des points d'attention.
- Fiche synthétique copro > 12 mois : données financières à actualiser, privilégier pré-état daté récent.

TON ET NUANCE :
- Jamais d'impératif : "à anticiper" plutôt que "il faut prévoir", "nécessite une vérification" plutôt que "vérifiez".
- Verimo oriente, ne dicte pas. L'acheteur décide.
- Rester factuel : chiffres, dates, classes DPE, pourcentages. Les détails techniques rassurent.

Réponds UNIQUEMENT en JSON strict, sans texte avant ou après.`;
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

    // Préserver l'ordre demandé par le client (important pour l'UI Bien 1 / Bien 2 / Bien 3)
    const orderedAnalyses = analyseIds
      .map(id => analyses.find(a => a.id === id))
      .filter((a): a is NonNullable<typeof a> => !!a);

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

    // Construire le message pour Claude — ordre client respecté
    const userContent = orderedAnalyses.map((a, i) => {
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
        diagnostics: result.diagnostics,
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
        messages: [{ role: 'user', content: `Compare ces ${orderedAnalyses.length} biens et génère le verdict comparatif en JSON strict.\n\n${userContent}` }],
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

    // Stocker le verdict (plus de debug_upsert_error — bug DB résolu en session 7)
    const { error: upsertError } = await supabaseAdmin.from('comparaisons').upsert({
      user_id: user.id,
      analyse_ids: sortedIds,
      verdict,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,analyse_ids' });

    if (upsertError) {
      console.error('[comparer] UPSERT ERROR:', JSON.stringify(upsertError));
      // On renvoie quand même le verdict à l'utilisateur, mais on log l'erreur
      return new Response(JSON.stringify({ success: true, verdict, cached: false }), {
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

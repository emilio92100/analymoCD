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
  "synthese": "Paragraphe de 3-5 phrases comparant les biens de manière factuelle et nuancée. Mentionne les adresses. Compare les points forts et faiblesses de chaque bien. Reste mesuré.",
  "forces_bien_recommande": ["3 forces factuelles du bien recommandé"],
  "points_attention": ["2-4 points d'attention sur le bien recommandé ou les autres biens — travaux évoqués, DPE, procédures, écart financier"],
  "conseil": "Paragraphe de 2-3 phrases de conseil mesuré. Ne dis pas quoi acheter. Suggère les prochaines étapes : vérifier tel point, demander tel document, consulter un professionnel pour tel aspect. Toujours terminer par rappeler que l'analyse est basée uniquement sur les documents fournis.",
  "alerte_documents": "Si un bien a été analysé avec significativement moins de documents que l'autre, le signaler ici. Sinon null."
}

RÈGLES CRITIQUES :
- Les travaux VOTÉS avant la vente sont à la charge du vendeur — ne les compte PAS comme un risque pour l'acheteur.
- Les travaux ÉVOQUÉS non votés sont un vrai risque — l'acheteur paiera si ces travaux sont votés après la signature.
- Le fonds ALUR et le fonds de roulement sont à REMBOURSER AU VENDEUR à la signature, en sus du prix — c'est un coût réel pour l'acheteur.
- DPE D = bonne performance, NE PAS le signaler négativement. Seuls E, F, G sont des points d'attention.
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

    // Construire le message pour Claude
    const userContent = analyses.map((a, i) => {
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
        messages: [{ role: 'user', content: `Compare ces ${analyses.length} biens et génère le verdict comparatif en JSON.\n\n${userContent}` }],
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

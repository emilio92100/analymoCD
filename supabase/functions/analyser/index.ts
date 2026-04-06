// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser
// Map-Reduce sur les documents immobiliers
// Clé Anthropic stockée dans Supabase Secrets (jamais exposée)
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const AI_MODEL = 'claude-sonnet-4-20250514';
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
}): Promise<{ text: string; error?: string }> {
  const { system, userContent, maxTokens, apiKey, maxRetries = 3 } = params;

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
          model: AI_MODEL,
          max_tokens: maxTokens,
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
  "points_positifs": ["..."],
  "points_vigilance": ["..."],
  "travaux_votes": ["travaux votés avec montants si disponibles"],
  "travaux_evoques": ["travaux mentionnés sans vote ni budget"],
  "procedures": ["procédures judiciaires ou contentieux"],
  "infos_financieres": "résumé des infos financières clés (charges, fonds travaux, impayés, budget)",
  "diagnostics": ["résumé des diagnostics si présents"],
  "annee_document": "2024 ou null si non détecté"
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
  "avis_verimo": "Avis final en 2-3 phrases simples. Terminer par : Ce rapport est établi uniquement à partir des documents analysés et ne remplace pas l'avis d'un professionnel de l'immobilier."
}`;
}

// ─── Mise à jour progression en base ──────────────────────────
async function updateProgress(supabaseAdmin: ReturnType<typeof createClient>, analyseId: string, current: number, total: number, message: string) {
  await supabaseAdmin.from('analyses').update({
    progress_current: current,
    progress_total: total,
    progress_message: message,
  }).eq('id', analyseId);
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

    // ── PHASE MAP : analyser chaque document ─────────────────
    const summaries: DocSummary[] = [];
    let mapError: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await updateProgress(supabaseAdmin, analyseId, i, files.length, `Analyse document ${i + 1}/${files.length} — ${file.name}`);

      // Délai entre documents pour éviter le rate limit
      if (i > 0) await sleep(800);

      const { text, error } = await callAI({
        system: PROMPT_MAP,
        userContent: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: file.data },
          },
          {
            type: 'text',
            text: `Extrais les informations clés de ce document immobilier : ${file.name}`,
          },
        ],
        maxTokens: 2000,
        apiKey,
      });

      if (error === 'rate_limit' || error === 'overload') {
        mapError = error;
        break;
      }

      const parsed = parseJson<DocSummary>(text);
      if (parsed) {
        summaries.push({ ...parsed, filename: file.name, raw_text_preview: '' });
      } else {
        // Si parsing échoue, on continue avec un résumé minimal
        summaries.push({
          filename: file.name,
          detected_type: 'AUTRE',
          points_positifs: [],
          points_vigilance: ['Document partiellement lisible'],
          travaux_votes: [],
          travaux_evoques: [],
          procedures: [],
          infos_financieres: '',
          diagnostics: [],
          raw_text_preview: '',
        });
      }
    }

    // Si rate limit pendant le MAP → rembourser et signaler
    if (mapError) {
      await supabaseAdmin.from('analyses').update({ status: 'failed' }).eq('id', analyseId);
      return new Response(JSON.stringify({
        error: mapError,
        message: mapError === 'rate_limit'
          ? 'Notre moteur est momentanément surchargé. Votre crédit a été remboursé automatiquement. Réessayez dans 2 à 3 minutes.'
          : 'Notre moteur est temporairement indisponible. Votre crédit a été remboursé automatiquement.',
      }), { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // ── PHASE REDUCE : synthèse finale ───────────────────────
    await updateProgress(supabaseAdmin, analyseId, files.length, files.length, 'Génération du rapport final…');

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

    const { text: reduceText, error: reduceError } = await callAI({
      system: buildPromptReduce(mode, profil),
      userContent: [{
        type: 'text',
        text: `Voici les résumés structurés des ${files.length} document(s) à analyser :\n\n${summariesText}`,
      }],
      maxTokens: mode === 'complete' ? 4000 : 1500,
      apiKey,
    });

    if (reduceError) {
      await supabaseAdmin.from('analyses').update({ status: 'failed' }).eq('id', analyseId);
      return new Response(JSON.stringify({
        error: reduceError,
        message: 'Une erreur est survenue lors de la synthèse. Votre crédit a été remboursé automatiquement.',
      }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const finalReport = parseJson<Record<string, unknown>>(reduceText);
    if (!finalReport) {
      await supabaseAdmin.from('analyses').update({ status: 'failed' }).eq('id', analyseId);
      return new Response(JSON.stringify({
        error: 'parse_error',
        message: 'Erreur de génération du rapport. Votre crédit a été remboursé automatiquement.',
      }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
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

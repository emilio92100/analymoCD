/* ══════════════════════════════════════════════════════════════
   AI PROVIDER — Couche d'abstraction IA
   Verimo utilise Claude Sonnet via Anthropic API.
   Pour changer de modèle : modifier uniquement ce fichier.
   ══════════════════════════════════════════════════════════════ */

export const AI_MODEL = 'claude-sonnet-4-20250514';
export const AI_API_URL = 'https://api.anthropic.com/v1/messages';
export const AI_API_VERSION = '2023-06-01';

export type AIMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AIResponse = {
  text: string;
  error?: string;
};

/**
 * Appelle l'API Anthropic avec retry automatique si rate limit (429).
 * maxRetries : nombre de tentatives max (défaut 3)
 * Délai exponentiel : 2s, 4s, 8s entre les tentatives
 */
export async function callAI(params: {
  system: string;
  messages: AIMessage[];
  maxTokens: number;
  apiKey: string;
  maxRetries?: number;
}): Promise<AIResponse> {
  const { system, messages, maxTokens, apiKey, maxRetries = 3 } = params;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': AI_API_VERSION,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: maxTokens,
          system,
          messages,
        }),
      });

      // Rate limit — on attend et on réessaie
      if (res.status === 429) {
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        return { text: '', error: 'rate_limit' };
      }

      // Erreur serveur Anthropic
      if (res.status === 529) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        return { text: '', error: 'overload' };
      }

      if (!res.ok) {
        return { text: '', error: `api_error_${res.status}` };
      }

      const data = await res.json();
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text || '';

      if (!text) return { text: '', error: 'empty_response' };

      return { text };
    } catch {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return { text: '', error: 'network_error' };
    }
  }

  return { text: '', error: 'max_retries_exceeded' };
}

/**
 * Parse une réponse JSON de l'IA de façon sécurisée.
 * Retire les balises markdown si présentes.
 */
export function parseAIJson<T>(raw: string): { data: T | null; error?: string } {
  try {
    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const data = JSON.parse(clean) as T;
    return { data };
  } catch {
    return { data: null, error: 'json_parse_error' };
  }
}

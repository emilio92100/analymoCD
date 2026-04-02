/* ══════════════════════════════════════════
   ANALYSES — Fonctions Supabase
   Lecture et sauvegarde des analyses
══════════════════════════════════════════ */
import { supabase } from './supabase';

export type AnalyseDB = {
  id: string;
  user_id: string;
  type: 'document' | 'complete' | 'pack2' | 'pack3';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  title: string;
  address: string | null;
  result: Record<string, unknown> | null;
  apercu: Record<string, unknown> | null;     // résultat aperçu gratuit
  is_preview: boolean;                        // true = aperçu gratuit non payé
  paid: boolean;                              // true = paiement confirmé
  document_names: string[] | null;            // noms des fichiers analysés
  regeneration_deadline: string | null;       // date limite 7 jours pour compléter
  created_at: string;
};

/* ─── Lire toutes les analyses de l'utilisateur ── */
export async function fetchAnalyses(): Promise<AnalyseDB[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetchAnalyses:', error.message);
    return [];
  }
  return data || [];
}

/* ─── Lire une analyse par id ──────────────────── */
export async function fetchAnalyseById(id: string): Promise<AnalyseDB | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erreur fetchAnalyseById:', error.message);
    return null;
  }
  return data;
}

/* ─── Créer une analyse normale (avant l'IA) ──── */
export async function createAnalyse(
  type: AnalyseDB['type'],
  title: string,
  documentNames?: string[]
): Promise<AnalyseDB | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      type,
      status: 'processing',
      title,
      is_preview: false,
      paid: true,
      document_names: documentNames || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur createAnalyse:', error.message);
    return null;
  }
  return data;
}

/* ─── Créer un aperçu gratuit ─────────────────── */
export async function createApercu(
  type: AnalyseDB['type'],
  title: string,
  documentNames: string[]
): Promise<AnalyseDB | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      type,
      status: 'processing',
      title,
      is_preview: true,
      paid: false,
      document_names: documentNames,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur createApercu:', error.message);
    return null;
  }
  return data;
}

/* ─── Sauvegarder le résultat de l'aperçu ──────── */
export async function updateApercuResult(
  id: string,
  apercu: Record<string, unknown>,
  title: string,
  address: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('analyses')
    .update({
      status: 'completed',
      apercu,
      title,
      address,
    })
    .eq('id', id);

  if (error) {
    console.error('Erreur updateApercuResult:', error.message);
    return false;
  }
  return true;
}

/* ─── Mettre à jour une analyse avec le résultat IA (rapport complet) */
export async function updateAnalyseResult(
  id: string,
  result: Record<string, unknown>,
  title: string,
  address: string | null,
  documentNames?: string[]
): Promise<boolean> {
  // Calculer la deadline 7 jours pour la régénération
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);

  const updateData: Record<string, unknown> = {
    status: 'completed',
    result,
    title,
    address,
    is_preview: false,
    paid: true,
    regeneration_deadline: deadline.toISOString(),
  };
  if (documentNames) updateData.document_names = documentNames;

  const { error } = await supabase
    .from('analyses')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Erreur updateAnalyseResult:', error.message);
    return false;
  }
  return true;
}

/* ─── Débloquer un aperçu après paiement ─────── */
export async function debloquerapercu(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('analyses')
    .update({ paid: true })
    .eq('id', id);

  if (error) {
    console.error('Erreur debloquerApercu:', error.message);
    return false;
  }
  return true;
}

/* ─── Marquer l'aperçu gratuit comme utilisé ──── */
export async function markFreePreviewUsed(): Promise<void> {
  // Immédiat : localStorage pour éviter le flash UI
  localStorage.setItem('verimo_free_preview_used', 'true');
  // Persistant : Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('profiles')
    .update({ free_preview_used: true })
    .eq('id', user.id);
}

/* ─── Vérifier si l'aperçu gratuit a été utilisé (instantané via localStorage) */
export function checkFreePreviewUsedSync(): boolean {
  return localStorage.getItem('verimo_free_preview_used') === 'true';
}

/* ─── Synchroniser localStorage depuis Supabase (au login) */
export async function syncFreePreviewUsed(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase
    .from('profiles')
    .select('free_preview_used')
    .eq('id', user.id)
    .single();
  if (data?.free_preview_used) {
    localStorage.setItem('verimo_free_preview_used', 'true');
  } else {
    localStorage.removeItem('verimo_free_preview_used');
  }
}

/* ─── Vérifier si l'aperçu gratuit a été utilisé (async Supabase) */
export async function checkFreePreviewUsed(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return true;
  const { data } = await supabase
    .from('profiles')
    .select('free_preview_used')
    .eq('id', user.id)
    .single();
  return data?.free_preview_used ?? false;
}

/* ─── Marquer une analyse en erreur ───────────── */
export async function markAnalyseFailed(id: string): Promise<void> {
  await supabase
    .from('analyses')
    .update({ status: 'failed' })
    .eq('id', id);
}

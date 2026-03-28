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
  title: string;        // nom du doc (simple) ou adresse (complète)
  address: string | null;
  result: Record<string, unknown> | null;
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

/* ─── Créer une analyse (avant l'IA) ──────────── */
export async function createAnalyse(
  type: AnalyseDB['type'],
  title: string
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
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur createAnalyse:', error.message);
    return null;
  }
  return data;
}

/* ─── Mettre à jour une analyse avec le résultat IA */
export async function updateAnalyseResult(
  id: string,
  result: Record<string, unknown>,
  title: string,
  address: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('analyses')
    .update({
      status: 'completed',
      result,
      title,
      address,
    })
    .eq('id', id);

  if (error) {
    console.error('Erreur updateAnalyseResult:', error.message);
    return false;
  }
  return true;
}

/* ─── Marquer une analyse en erreur ───────────── */
export async function markAnalyseFailed(id: string): Promise<void> {
  await supabase
    .from('analyses')
    .update({ status: 'failed' })
    .eq('id', id);
}

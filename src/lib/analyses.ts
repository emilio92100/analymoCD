/* ══════════════════════════════════════════
   ANALYSES — Fonctions Supabase
   Lecture et sauvegarde des analyses
   Session 4 — Ajout type_bien_declare
══════════════════════════════════════════ */
import { supabase } from './supabase';

export type TypeBien = 'appartement' | 'maison' | 'maison_copro' | 'indetermine';

export type AnalyseDB = {
  id: string;
  user_id: string;
  type: 'document' | 'complete' | 'pack2' | 'pack3';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  title: string;
  address: string | null;
  score: number | null;
  score_couleur: string | null;
  profil: 'rp' | 'invest' | null;
  type_bien: 'appartement' | 'maison' | 'maison_copro' | 'indetermine' | null;
  type_bien_declare: TypeBien | null;
  result: Record<string, unknown> | null;
  apercu: Record<string, unknown> | null;
  is_preview: boolean;
  paid: boolean;
  document_names: string[] | null;
  regeneration_deadline: string | null;
  avis_verimo: string | null;
  share_token: string | null;
  complement_date: string | null;
  complement_doc_names: string[] | null;
  folder_id: string | null;
  created_at: string;
};

/* ─── Générer ou récupérer le token de partage ── */
export async function getOrCreateShareToken(id: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('analyses')
    .select('share_token')
    .eq('id', id)
    .single();

  if (existing?.share_token) return existing.share_token;

  const token = Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 24);

  const { error } = await supabase
    .from('analyses')
    .update({ share_token: token })
    .eq('id', id);

  if (error) return null;
  return token;
}

/* ─── Lire un rapport via share_token (sans auth) ── */
export async function fetchAnalyseByShareToken(token: string): Promise<AnalyseDB | null> {
  // D'abord chercher dans report_shares (envois pro → client)
  const { data: share } = await supabase
    .from('report_shares')
    .select('analysis_id')
    .eq('share_token', token)
    .maybeSingle();

  if (share?.analysis_id) {
    // Marquer comme ouvert si pas encore fait
    await supabase
      .from('report_shares')
      .update({ opened_at: new Date().toISOString() })
      .eq('share_token', token)
      .is('opened_at', null);

    const { data: analysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', share.analysis_id)
      .single();
    return analysis || null;
  }

  // Fallback : chercher dans analyses.share_token (ancien système)
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('share_token', token)
    .single();

  if (error) return null;
  return data;
}

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

/* ─── Créer une analyse normale (avant traitement) ── */
export async function createAnalyse(
  type: AnalyseDB['type'],
  title: string,
  profil: 'rp' | 'invest',
  documentNames?: string[],
  typeBienDeclare?: TypeBien | null,
  folderId?: string | null,
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
      profil,
      is_preview: false,
      paid: true,
      document_names: documentNames || [],
      type_bien_declare: typeBienDeclare || null,
      folder_id: folderId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur createAnalyse:', error.message);
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

/* ─── Mettre à jour une analyse avec le résultat complet ── */
export async function updateAnalyseResult(
  id: string,
  result: Record<string, unknown>,
  title: string,
  address: string | null,
  documentNames?: string[]
): Promise<boolean> {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);

  const score = typeof result.score === 'number' ? result.score : null;
  const score_couleur = typeof result.score_couleur === 'string' ? result.score_couleur : null;
  const type_bien = typeof result.type_bien === 'string' ? result.type_bien : null;
  const avis_verimo = typeof result.avis_verimo === 'string' ? result.avis_verimo : null;

  const updateData: Record<string, unknown> = {
    status: 'completed',
    result,
    title,
    address,
    score,
    score_couleur,
    type_bien,
    avis_verimo,
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
export async function debloquerApercu(id: string): Promise<boolean> {
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

/* ─── Marquer une analyse en erreur ───────────── */
export async function markAnalyseFailed(id: string): Promise<void> {
  await supabase
    .from('analyses')
    .update({ status: 'failed' })
    .eq('id', id);
}

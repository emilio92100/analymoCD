import { useState, useEffect, useCallback } from 'react';
import { fetchAnalyses, type AnalyseDB } from '../lib/analyses';

export type AnalyseType = 'document' | 'complete';
export type AnalyseStatus = 'completed' | 'processing' | 'error' | 'pending' | 'files_ready' | 'queued' | 'failed';

export type Analyse = {
  id: string;
  type: AnalyseType;
  status: AnalyseStatus;
  nom_document?: string;
  adresse_bien?: string;
  score?: number;
  recommandation?: string;
  recommandationColor?: string;
  date: string;
  price: string;
  is_preview?: boolean;
  document_names?: string[];
  regeneration_deadline?: string;
  result?: unknown;
  folder_id?: string | null;
  folder_name?: string | null;
  progress_message?: string;
};

// ──────────────────────────────────────────────────────────────
// Titre d'affichage d'une analyse (particulier ET pro).
// Source de vérité unique pour ne JAMAIS afficher le nom du fichier
// uploadé à la place d'un titre d'analyse complète.
//   • document simple        → nom du document
//   • complète + adresse      → l'adresse réelle (rapport généré)
//   • complète + pas d'adresse + en échec  → "Analyse complète"
//   • complète + pas d'adresse + en cours  → "Analyse complète en cours…"
// Accepte aussi bien le type Analyse (particulier) que ProAnalysis (pro).
// ──────────────────────────────────────────────────────────────
export function titreAnalyse(a: {
  type?: string;
  status?: string;
  address?: string | null;
  title?: string | null;
  adresse_bien?: string | null;
  nom_document?: string | null;
}): string {
  const isComplete = a.type !== 'document';
  if (!isComplete) {
    return a.nom_document || a.title || 'Document sans nom';
  }
  const adresse = a.adresse_bien || a.address || undefined;
  if (adresse) return adresse;
  const enEchec = a.status === 'error' || a.status === 'failed';
  return enEchec ? 'Analyse complète' : 'Analyse complète en cours…';
}

export function useAnalyses() {
  const [analyses, setAnalyses] = useState<Analyse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
      setLoading(true);
      const data = await fetchAnalyses();
      const mapped: Analyse[] = data.map((a: AnalyseDB) => {
        const result = a.result as Record<string, unknown> | null;
        const score = result?.score as number | undefined;
        const reco = result?.recommandation as string | undefined;
        const recoColor = reco === 'Acheter' ? '#16a34a'
          : reco === 'Négocier' ? '#d97706'
          : reco === 'Bien à éviter' ? '#dc2626'
          : '#7c3aed';
        return {
          id: a.id,
          type: (a.type === 'pack2' || a.type === 'pack3' ? 'complete' : a.type) as 'document' | 'complete',
          status: (a.status === 'completed' ? 'completed'
            : a.status === 'failed' ? 'error'
            : 'processing') as 'completed' | 'processing' | 'error',
          nom_document: a.type === 'document' ? a.title : undefined,
          // ⚠️ NE PAS retomber sur a.title (= nom du 1er fichier) : pour une analyse
          // complète sans adresse encore extraite, on laisse adresse_bien vide et c'est
          // titreAnalyse() qui décide du libellé selon le statut (en cours / échec).
          adresse_bien: a.type !== 'document' ? (a.address || undefined) : undefined,
          score,
          recommandation: reco,
          recommandationColor: reco ? recoColor : undefined,
          date: new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          price: a.type === 'document' ? '4,90€'
            : a.type === 'complete' ? '19,90€'
            : a.type === 'pack2' ? '29,90€'
            : '39,90€',
          is_preview: a.is_preview ?? false,
          document_names: a.document_names || [],
          regeneration_deadline: a.regeneration_deadline || undefined,
          result: a.result,
          folder_id: a.folder_id || null,
          progress_message: a.progress_message || undefined,
        };
      });
      setAnalyses(mapped);
      setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { analyses, loading, refetch: load };
}

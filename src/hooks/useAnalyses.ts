import { useState, useEffect, useCallback } from 'react';
import { fetchAnalyses, type AnalyseDB } from '../lib/analyses';

export type AnalyseType = 'document' | 'complete';
export type AnalyseStatus = 'completed' | 'processing' | 'error';

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
};

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
          adresse_bien: a.type !== 'document' ? (a.address || a.title) : undefined,
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
        };
      });
      setAnalyses(mapped);
      setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { analyses, loading, refetch: load };
}

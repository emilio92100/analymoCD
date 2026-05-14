import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type Credits = {
  document: number;
  complete: number;
};

export function useCredits() {
  const [credits, setCredits] = useState<Credits>({ document: 0, complete: 0 });
  const [loadingCredits, setLoadingCredits] = useState(true);

  const fetchCredits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('credits_document, credits_complete')
      .eq('id', user.id)
      .single();
    if (data) {
      setCredits({
        document: data.credits_document || 0,
        complete: data.credits_complete || 0,
      });
    }
    setLoadingCredits(false);
  }, []);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  // 🆕 Déduction atomique via fonction SQL (anti race condition multi-onglets)
  const deductCredit = async (type: 'document' | 'complete') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Appel RPC atomique : la fonction SQL fait SELECT + UPDATE en une transaction,
    // avec condition stricte "credits > 0". Retourne true si débité, false sinon.
    const { data, error } = await supabase.rpc('consume_particulier_credit', {
      p_user_id: user.id,
      p_credit_type: type,
    });

    if (error) {
      console.error('[Verimo] consume_particulier_credit error:', error.message);
      return false;
    }

    if (data === true) {
      // Mise à jour du state local pour refléter le changement BDD
      setCredits(prev => ({ ...prev, [type]: Math.max(0, (type === 'document' ? prev.document : prev.complete) - 1) }));
      return true;
    }

    return false;
  };

  return { credits, loadingCredits, fetchCredits, deductCredit };
}

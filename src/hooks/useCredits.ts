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

  useEffect(() => {
    fetchCredits();
    // Bus d'événement : toute consommation/remboursement ailleurs rafraîchit ce compteur (nav en direct, sans refresh)
    const handler = () => { fetchCredits(); };
    window.addEventListener('verimo:credits-changed', handler);
    return () => window.removeEventListener('verimo:credits-changed', handler);
  }, [fetchCredits]);

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
      // Notifie les autres compteurs (nav à gauche) pour qu'ils se rafraîchissent en direct
      window.dispatchEvent(new Event('verimo:credits-changed'));
      return true;
    }

    return false;
  };

  return { credits, loadingCredits, fetchCredits, deductCredit };
}

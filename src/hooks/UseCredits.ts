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

  const deductCredit = async (type: 'document' | 'complete') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const field = type === 'document' ? 'credits_document' : 'credits_complete';
    const current = type === 'document' ? credits.document : credits.complete;
    if (current <= 0) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: current - 1 })
      .eq('id', user.id);
    if (error) return false;
    setCredits(prev => ({ ...prev, [type]: current - 1 }));
    return true;
  };

  return { credits, loadingCredits, fetchCredits, deductCredit };
}

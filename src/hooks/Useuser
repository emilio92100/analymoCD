import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useUser() {
  const [name, setName] = useState<string>(() => localStorage.getItem('verimo_user_name') || '');
  const [email, setEmail] = useState<string>(() => localStorage.getItem('verimo_user_email') || '');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const n = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur';
        const e = user.email || '';
        setName(n);
        setEmail(e);
        localStorage.setItem('verimo_user_name', n);
        localStorage.setItem('verimo_user_email', e);
      }
    });
  }, []);

  return { name, email };
}

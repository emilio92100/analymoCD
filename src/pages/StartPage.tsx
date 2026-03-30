import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/* ══════════════════════════════════════════
   START PAGE — Redirection intelligente
   Connecté → /dashboard/nouvelle-analyse
   Non connecté → /inscription
══════════════════════════════════════════ */
export default function StartPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard/nouvelle-analyse', { replace: true });
      } else {
        navigate('/inscription', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7f9', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }}/>
        <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Redirection…</p>
      </div>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

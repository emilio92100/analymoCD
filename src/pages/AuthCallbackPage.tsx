import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Status = 'loading' | 'success' | 'error';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Animation barre de progression
    const interval = setInterval(() => {
setProgress(p => p < 90 ? p + 5 : p);
}, 300);

    supabase.auth.getSession().then(({ data }) => {
      clearInterval(interval);
      if (data.session) {
        setProgress(100);
setTimeout(() => setStatus('success'), 400);
      } else {
        setStatus('error');
      }
    });

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>

        <img src="/logo.png" alt="Analymo" style={{ height: 44, marginBottom: 48 }} />

        {status === 'loading' && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 12px 40px rgba(42,125,156,0.25)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 12 }}>Confirmation en cours…</h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Votre adresse email est en train d'être vérifiée, merci de patienter.</p>
            <div style={{ height: 8, borderRadius: 99, background: 'rgba(42,125,156,0.12)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--brand-teal), var(--brand-navy))', width: `${progress}%`, transition: 'width 0.2s ease' }} />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 12px 40px rgba(34,197,94,0.3)', animation: 'popIn 0.4s ease' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 12 }}>Email confirmé ! ✅</h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Votre compte est activé avec succès !</p> <a href="/connexion" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', textDecoration: 'none', boxShadow: '0 6px 24px rgba(42,125,156,0.3)' }}>   Se connecter → </a>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 12px 40px rgba(239,68,68,0.3)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 12 }}>Lien expiré ou invalide</h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Le lien de confirmation a expiré (valable 24h) ou est invalide.</p>
            <a href="/inscription" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', textDecoration: 'none', boxShadow: '0 6px 24px rgba(42,125,156,0.3)' }}>
              🔄 Se réinscrire
            </a>
          </>
        )}

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { syncFreePreviewUsed } from '../lib/analyses';

async function cacheUserInfo(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const n = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur';
    localStorage.setItem('verimo_user_name', n);
    localStorage.setItem('verimo_user_email', user.email || '');
  }
}

type Status = 'loading' | 'success' | 'error' | 'already_confirmed';

const STEPS = [
  'Vérification de votre lien…',
  'Validation de votre adresse email…',
  'Activation de votre compte…',
  'Préparation de votre espace…',
];

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(p => { if (p >= 95) { clearInterval(progressInterval); return p; } return p + 1.5; });
    }, 90);
    const stepInterval = setInterval(() => {
      setStepIndex(i => (i + 1) % STEPS.length);
    }, 1500);

    const handleCallback = async () => {
      const minWait = new Promise(r => setTimeout(r, 3000));
      let sessionOk = false;

      // 1. Session déjà établie (Google PKCE flow)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        sessionOk = true;
      }

      // 2. token_hash dans les query params (confirmation email)
      if (!sessionOk) {
        const searchParams = new URLSearchParams(window.location.search);
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        if (tokenHash) {
          // Essayer signup d'abord, puis email
          const types: Array<'signup' | 'email'> = ['signup', 'email'];
          for (const t of types) {
            const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: t });
            if (!error) { sessionOk = true; break; }
          }
          // Si verifyOtp a réussi, recréer la session
          if (sessionOk) {
            const { data } = await supabase.auth.getSession();
            if (!data.session) sessionOk = false;
          }
        }
        // Compatibilité ancien format avec type dans l'URL
        if (!sessionOk && tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'signup' | 'email' });
          if (!error) sessionOk = true;
        }
      }

      // 3. Token dans le hash (flow implicite)
      if (!sessionOk) {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.replace('#', ''));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (!error) sessionOk = true;
          }
        }
      }

      // 4. Code dans les query params (PKCE)
      if (!sessionOk) {
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) sessionOk = true;
        }
      }

      // 5. Dernière vérification session
      if (!sessionOk) {
        const { data } = await supabase.auth.getSession();
        if (data.session) sessionOk = true;
      }

      await minWait;
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setProgress(100);

      if (sessionOk) {
        await syncFreePreviewUsed();
        await cacheUserInfo();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const n = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || '';
          setUserName(n);
        }
        setTimeout(() => setStatus('success'), 600);
      } else {
        setTimeout(() => setStatus('already_confirmed'), 600);
      }
    };

    handleCallback();
    return () => { clearInterval(progressInterval); clearInterval(stepInterval); };
  }, [navigate]);

  // Afficher le bouton après 6 secondes (pas de redirection automatique)
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => setShowButton(true), 6000);
      return () => clearTimeout(t);
    }
  }, [status]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)', padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' as const }}>

        <img src="/logo.png" alt="Verimo" style={{ height: 44, objectFit: 'contain', display: 'block', margin: '0 auto 48px' }} />

        {status === 'loading' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 36px' }}>
              <svg width="100" height="100" style={{ position: 'absolute', top: 0, left: 0 }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(42,125,156,0.12)" strokeWidth="6" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#grad)" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.3s ease', transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }} />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2a7d9c" />
                    <stop offset="100%" stopColor="#0f2d3d" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2a7d9c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.02em' }}>Vérification en cours</h1>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 8, minHeight: 24 }}>{STEPS[stepIndex]}</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 36 }}>Merci de patienter quelques instants…</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', opacity: stepIndex % 3 === i ? 1 : 0.25, transition: 'opacity 0.3s ease' }} />
              ))}
            </div>
          </div>
        )}

        {status === 'success' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 16px 48px rgba(34,197,94,0.35)', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 100, padding: '4px 16px', display: 'inline-block', marginBottom: 20 }}>
              ✓ Email confirmé avec succès
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.02em' }}>
              {userName ? `Bienvenue, ${userName} ! 🎉` : 'Bienvenue sur Verimo ! 🎉'}
            </h1>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 36 }}>
              Votre compte est activé. Vous pouvez maintenant accéder à votre espace et lancer votre première analyse immobilière.
            </p>
            {showButton ? (
              <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #2a7d9c 0%, #0f2d3d 100%)', textDecoration: 'none', boxShadow: '0 8px 28px rgba(42,125,156,0.35)', animation: 'fadeInUp 0.5s ease' }}>
                Accéder à mon tableau de bord →
              </a>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}
          </div>
        )}

        {status === 'already_confirmed' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 36px', boxShadow: '0 16px 48px rgba(34,197,94,0.35)', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.02em' }}>Compte activé ! ✅</h1>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 36 }}>Votre adresse email a été confirmée. Connectez-vous pour accéder à votre espace Verimo.</p>
            <a href="/connexion" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #2a7d9c 0%, #0f2d3d 100%)', textDecoration: 'none', boxShadow: '0 8px 28px rgba(42,125,156,0.35)' }}>
              Se connecter →
            </a>
          </div>
        )}

        {status === 'error' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 36px', boxShadow: '0 16px 48px rgba(239,68,68,0.3)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.02em' }}>Lien expiré</h1>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 36 }}>Votre lien d'activation a expiré (valable 24h). Veuillez vous réinscrire pour en recevoir un nouveau.</p>
            <a href="/inscription" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #2a7d9c 0%, #0f2d3d 100%)', textDecoration: 'none', boxShadow: '0 8px 28px rgba(42,125,156,0.35)' }}>
              🔄 Se réinscrire
            </a>
          </div>
        )}

      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.95)} }
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

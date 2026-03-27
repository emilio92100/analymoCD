import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false); return; }
    navigate('/dashboard');
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)' }}>
      <div className="auth-panel" style={{ flex: 1, background: 'linear-gradient(160deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Link to="/"><img src="/logo.png" alt="Analymo" style={{ height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: 48 }} /></Link>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>Vos analyses immobilières vous attendent.</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 48 }}>Connectez-vous pour accéder à votre tableau de bord.</p>
        {['Accédez à toutes vos analyses passées', 'Comparez plusieurs biens côte à côte', 'Téléchargez vos rapports PDF'].map(b => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={12} color="#fff" /></div>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>{b}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="auth-mobile-logo" style={{ display: 'none', marginBottom: 24 }}>
            <Link to="/"><img src="/logo.png" alt="Analymo" style={{ height: 36, objectFit: 'contain' }} /></Link>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 8 }}>Connexion</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Pas encore de compte ? <Link to="/inscription" style={{ color: 'var(--brand-teal)', fontWeight: 600, textDecoration: 'none' }}>Créer un compte</Link></p>
          <button onClick={handleGoogle} style={{ width: '100%', padding: '13px 20px', borderRadius: 12, border: '1.5px solid rgba(42,125,156,0.2)', background: '#fff', fontSize: 15, fontWeight: 600, color: 'var(--brand-navy)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Continuer avec Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(42,125,156,0.12)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(42,125,156,0.12)' }} />
          </div>
          {error && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><AlertCircle size={16} color="#dc2626" /><span style={{ fontSize: 14, color: '#dc2626' }}>{error}</span></div>}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required style={{ width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)' }}>Mot de passe</label>
                <a href="/mot-de-passe-oublie" style={{ fontSize: 13, color: 'var(--brand-teal)', textDecoration: 'none' }}>Mot de passe oublié ?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '13px 42px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', background: loading ? 'rgba(42,125,156,0.5)' : 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 24px rgba(42,125,156,0.3)' }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@media (max-width: 767px) { .auth-panel { display: none !important; } .auth-mobile-logo { display: block !important; } }`}</style>
    </div>
  );
}

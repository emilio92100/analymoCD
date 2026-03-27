import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase détecte automatiquement le token dans l'URL
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError('Une erreur est survenue. Réessayez.'); setLoading(false); return; }
    setSuccess(true);
    setTimeout(() => navigate('/connexion'), 3000);
  };

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <img src="/logo.png" alt="Analymo" style={{ height: 56, display: 'block', margin: '0 auto 40px' }} />
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 16px 48px rgba(34,197,94,0.3)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 12 }}>Mot de passe mis à jour !</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Votre mot de passe a été modifié avec succès.</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Redirection vers la connexion dans quelques secondes…</p>
      </div>
    </div>
  );

  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <img src="/logo.png" alt="Analymo" style={{ height: 56, display: 'block', margin: '0 auto 40px' }} />
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 16px 48px rgba(239,68,68,0.3)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 12 }}>Lien invalide ou expiré</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>Ce lien de réinitialisation est invalide ou a expiré. Faites une nouvelle demande.</p>
        <a href="/mot-de-passe-oublie" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', textDecoration: 'none', boxShadow: '0 6px 24px rgba(42,125,156,0.3)' }}>
          Nouvelle demande
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)' }}>
      <div className="auth-panel" style={{ flex: 1, background: 'linear-gradient(160deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px' }}>
        <a href="/"><img src="/logo.png" alt="Analymo" style={{ height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: 48 }} /></a>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Choisissez un mot de passe sécurisé.</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>Votre nouveau mot de passe doit contenir au moins 8 caractères. Choisissez quelque chose de mémorable mais difficile à deviner.</p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="auth-mobile-logo" style={{ display: 'none', marginBottom: 24 }}>
            <a href="/"><img src="/logo.png" alt="Analymo" style={{ height: 36 }} /></a>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 8 }}>Nouveau mot de passe</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Choisissez un mot de passe sécurisé pour votre compte.</p>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <AlertCircle size={16} color="#dc2626" />
              <span style={{ fontSize: 14, color: '#dc2626' }}>{error}</span>
            </div>
          )}
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 caractères" required minLength={8} style={{ width: '100%', padding: '13px 42px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répétez votre mot de passe" required minLength={8} style={{ width: '100%', padding: '13px 42px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', background: loading ? 'rgba(42,125,156,0.5)' : 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 24px rgba(42,125,156,0.3)', marginTop: 8 }}>
              {loading ? 'Mise à jour...' : 'Mettre à jour mon mot de passe'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@media (max-width: 767px) { .auth-panel { display: none !important; } .auth-mobile-logo { display: block !important; } }`}</style>
    </div>
  );
}

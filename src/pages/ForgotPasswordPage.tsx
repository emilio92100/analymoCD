import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) { setError('Une erreur est survenue. Vérifiez votre email.'); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  };

  if (sent) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <img src="/logo.png" alt="Analymo" style={{ height: 56, display: 'block', margin: '0 auto 40px' }} />
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 16px 48px rgba(42,125,156,0.35)' }}>
          <Mail size={40} color="#fff" />
        </div>
<h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 12 }}>Vérifiez votre boîte mail</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Si un compte existe avec l'adresse</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-teal)', marginBottom: 8 }}>{email}</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 36 }}>vous recevrez un lien de réinitialisation dans quelques minutes. Vérifiez aussi vos spams. Si vous ne recevez rien, aucun compte n'est associé à cet email.</p>
        <Link to="/connexion" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', textDecoration: 'none', boxShadow: '0 6px 24px rgba(42,125,156,0.3)' }}>
          Retour à la connexion
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)' }}>
      <div className="auth-panel" style={{ flex: 1, background: 'linear-gradient(160deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px' }}>
        <Link to="/"><img src="/logo.png" alt="Analymo" style={{ height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: 48 }} /></Link>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Pas de panique, ça arrive à tout le monde.</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>Entrez votre email et nous vous enverrons un lien pour créer un nouveau mot de passe en quelques secondes.</p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="auth-mobile-logo" style={{ display: 'none', marginBottom: 24 }}>
            <Link to="/"><img src="/logo.png" alt="Analymo" style={{ height: 36 }} /></Link>
          </div>
          <Link to="/connexion" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 32 }}>
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 8 }}>Mot de passe oublié</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Entrez votre email pour recevoir un lien de réinitialisation.</p>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <AlertCircle size={16} color="#dc2626" />
              <span style={{ fontSize: 14, color: '#dc2626' }}>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required style={{ width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', background: loading ? 'rgba(42,125,156,0.5)' : 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 24px rgba(42,125,156,0.3)' }}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@media (max-width: 767px) { .auth-panel { display: none !important; } .auth-mobile-logo { display: block !important; } }`}</style>
    </div>
  );
}

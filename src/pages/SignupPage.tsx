import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SignupPage() {
  
  const [step, setStep] = useState<'form'|'verify'>('form');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
    if (error) { setError('Une erreur est survenue. Réessayez.'); setLoading(false); return; }
    if (data?.user?.identities?.length === 0) { setError('Un compte existe déjà avec cet email. Connectez-vous ou réinitialisez votre mot de passe.'); setLoading(false); return; }
    setStep('verify');
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } });
  };

  if (step === 'verify') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 40px rgba(42,125,156,0.3)' }}><Mail size={32} color="#fff" /></div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 16 }}>Vérifiez votre email</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Un lien de confirmation a été envoyé à</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-teal)', marginBottom: 32 }}>{email}</p>
        {error && <p style={{ fontSize: 14, color: 'var(--brand-teal)', fontWeight: 600, marginBottom: 16 }}>{error}</p>} <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>   <a href="/connexion" style={{ display: 'block', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', textDecoration: 'none', boxShadow: '0 6px 24px rgba(42,125,156,0.3)' }}>     ✅ J'ai validé, me connecter   </a>   <button onClick={async () => { await supabase.auth.resend({ type: 'signup', email }); setError('✅ Email renvoyé ! Vérifiez aussi vos spams.'); }} style={{ padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: 'var(--brand-teal)', background: '#fff', border: '1.5px solid rgba(42,125,156,0.3)', cursor: 'pointer' }}>     📧 Je n'ai rien reçu, renvoyer le mail   </button> </div> <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Mauvais email ? <button onClick={() => { setStep('form'); setLoading(false); }} style={{ background: 'none', border: 'none', color: 'var(--brand-teal)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Modifier l'email</button></p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)' }}>
      <div className="auth-panel" style={{ flex: 1, background: 'linear-gradient(160deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px' }}>
        <Link to="/"><img src="/logo.png" alt="Analymo" style={{ height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: 48 }} /></Link>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Votre premier achat immobilier mérite la meilleure analyse.</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 48 }}>Créez votre compte en 30 secondes et analysez vos premiers documents dès aujourd'hui.</p>
        {[['⚡','Résultats en moins de 2 minutes'],['🔒','Données chiffrées et sécurisées'],['📄','Rapports PDF téléchargeables'],['💬','Support client réactif']].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}><span style={{ fontSize: 20 }}>{icon}</span><span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>{text}</span></div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="auth-mobile-logo" style={{ display: 'none', marginBottom: 24 }}><Link to="/"><img src="/logo.png" alt="Analymo" style={{ height: 36 }} /></Link></div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 8 }}>Créer un compte</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Déjà un compte ? <Link to="/connexion" style={{ color: 'var(--brand-teal)', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link></p>
          <button onClick={handleGoogle} style={{ width: '100%', padding: '13px 20px', borderRadius: 12, border: '1.5px solid rgba(42,125,156,0.2)', background: '#fff', fontSize: 15, fontWeight: 600, color: 'var(--brand-navy)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Continuer avec Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(42,125,156,0.12)' }} /><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ou</span><div style={{ flex: 1, height: 1, background: 'rgba(42,125,156,0.12)' }} />
          </div>
          {error && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><AlertCircle size={16} color="#dc2626" /><span style={{ fontSize: 14, color: '#dc2626' }}>{error}</span></div>}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[{label:'Nom complet',type:'text',value:name,set:setName,icon:<User size={16} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}} />,ph:'Jean Dupont'},{label:'Email',type:'email',value:email,set:setEmail,icon:<Mail size={16} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}} />,ph:'vous@exemple.com'}].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>{f.label}</label>
                <div style={{ position: 'relative' }}>{f.icon}<input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} required style={{ width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 caractères" required minLength={8} style={{ width: '100%', padding: '13px 42px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', background: loading ? 'rgba(42,125,156,0.5)' : 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 24px rgba(42,125,156,0.3)' }}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@media (max-width: 767px) { .auth-panel { display: none !important; } .auth-mobile-logo { display: block !important; } }`}</style>
    </div>
  );
}

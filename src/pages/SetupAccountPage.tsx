import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

export default function SetupAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<{ email: string; profile_id: string; profiles?: { full_name?: string; pro_recommended_plan?: string } } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useSEO({ title: 'Activer votre compte — Verimo Pro', description: 'Définissez votre mot de passe pour accéder à votre espace Verimo Pro.' });

  useEffect(() => {
    if (!token) { setError('Lien invalide.'); setLoading(false); return; }

    const checkToken = async () => {
      // On utilise un appel direct car l'user n'est pas encore connecté
      // On passe par la RPC publique
      const { data, error: fetchErr } = await supabase
        .from('pro_invitations')
        .select('*, profiles(full_name, pro_recommended_plan)')
        .eq('token', token)
        .is('accepted_at', null)
        .maybeSingle();

      if (fetchErr || !data) {
        setError('Ce lien est invalide ou a déjà été utilisé.');
        setLoading(false);
        return;
      }

      setInvitation(data);
      setLoading(false);
    };

    checkToken();
  }, [token]);

  const handleSubmit = async () => {
    if (!password || password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ action: 'setup_pro_account', token, password }),
      });

      const data = await res.json();
      if (data.error) { setError(data.error); setSubmitting(false); return; }

      // Connexion réussie, stocker la session
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      setSuccess(true);
      // Rediriger vers le dashboard pro après 2s
      setTimeout(() => { navigate('/dashboard'); }, 2000);
    } catch (e) {
      setError('Une erreur est survenue. Réessayez.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2a7d9c', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 440, width: '100%', padding: '0 20px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 36, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Lien expiré ou invalide</h1>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>{error}</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Contactez votre interlocuteur Verimo pour recevoir un nouveau lien.</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 440, width: '100%', padding: '0 20px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 36, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Compte activé !</h1>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>Redirection vers votre espace pro...</p>
          </div>
        </div>
      </div>
    );
  }

  const prenom = invitation?.profiles?.full_name?.split(' ')[0] || '';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, width: '100%', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#0f2d3d' }}>verimo</span>
            <span style={{ background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.05em' }}>PRO</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            {prenom ? `Bienvenue ${prenom} !` : 'Bienvenue !'}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Définissez votre mot de passe pour accéder à votre espace.</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>

          {/* Email (read-only) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
            <div style={{ padding: '11px 14px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #edf2f7', fontSize: 14, color: '#64748b' }}>
              {invitation?.email}
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mot de passe</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#2a7d9c'}
              onBlur={e => e.target.style.borderColor = '#edf2f7'}
            />
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirmer le mot de passe</label>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre mot de passe"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#2a7d9c'}
              onBlur={e => e.target.style.borderColor = '#edf2f7'}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!password || !confirmPassword || submitting}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: (!password || !confirmPassword) ? '#cbd5e1' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)',
              color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: "'DM Sans', system-ui, sans-serif",
              opacity: submitting ? 0.7 : 1, transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Activation en cours...' : 'Activer mon compte'}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 24 }}>
          Verimo — Vos documents décryptés, votre décision éclairée.
        </p>
      </div>
    </div>
  );
}

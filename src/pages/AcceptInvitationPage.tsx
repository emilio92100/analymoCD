import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

const FN_URL = 'https://veszrayromldfgetqaxb.supabase.co/functions/v1/accept-agence-invitation';

interface InvitationInfo {
  email: string;
  agence_name: string;
  inviter_name: string;
  expires_at: string;
  existing_account: boolean;
  existing_full_name: string | null;
}

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useSEO({
    title: 'Rejoindre une agence — Verimo',
    description: 'Acceptez votre invitation et rejoignez votre équipe sur Verimo.'
  });

  /* ── Vérification du token au chargement ─────────────── */
  useEffect(() => {
    if (!token) {
      setError('Lien invalide.');
      setLoading(false);
      return;
    }

    const checkToken = async () => {
      try {
        const res = await fetch(FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ action: 'verify', token }),
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.error || 'Lien invalide.');
          setLoading(false);
          return;
        }

        setInvitation({
          email: data.email,
          agence_name: data.agence_name,
          inviter_name: data.inviter_name,
          expires_at: data.expires_at,
          existing_account: data.existing_account,
          existing_full_name: data.existing_full_name,
        });

        // Pré-remplir le nom si compte existant
        if (data.existing_full_name) {
          setFullName(data.existing_full_name);
        }

        setLoading(false);
      } catch {
        setError('Erreur de connexion. Réessayez.');
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  /* ── Soumission ──────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!fullName || fullName.trim().length < 2) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'accept',
          token,
          full_name: fullName.trim(),
          password
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Une erreur est survenue.');
        setSubmitting(false);
        return;
      }

      // Connecter automatiquement l'utilisateur
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      });

      if (signInErr) {
        // Si le sign-in échoue (rare), on redirige vers la page de connexion
        setSuccess(true);
        setTimeout(() => navigate('/connexion'), 2500);
        return;
      }

      setSuccess(true);
      // Redirection vers le dashboard avec un flag d'onboarding
      setTimeout(() => {
        navigate('/dashboard?welcome=agence');
      }, 2500);
    } catch {
      setError('Une erreur est survenue. Réessayez.');
      setSubmitting(false);
    }
  };

  /* ── États de chargement ─────────────────────────────── */
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
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Invitation invalide</h1>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>{error}</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              Demandez à votre responsable d'agence de vous renvoyer une invitation depuis son espace Verimo.
            </p>
            <a href="https://verimo.fr"
              style={{ display: 'inline-block', padding: '11px 24px', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              Retour sur verimo.fr
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 480, width: '100%', padding: '0 20px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Bienvenue dans l'équipe !</h1>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 6 }}>
              Vous avez rejoint <strong style={{ color: '#2a7d9c' }}>{invitation?.agence_name}</strong>.
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Redirection vers votre espace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  const firstName = invitation.inviter_name?.split(' ')[0] || 'votre responsable';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", padding: '40px 0' }}>
      <div style={{ maxWidth: 480, width: '100%', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="Verimo" style={{ height: 70, width: 'auto', display: 'block', margin: '0 auto 14px' }} />
          <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '5px 20px', borderRadius: 100, letterSpacing: '0.1em', marginBottom: 18 }}>
            INVITATION ÉQUIPE
          </div>
          <h1 style={{ fontSize: 23, fontWeight: 800, color: '#0f172a', marginBottom: 8, lineHeight: 1.3 }}>
            Vous rejoignez
          </h1>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#2a7d9c', margin: '0 0 10px' }}>
            {invitation.agence_name}
          </p>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Invitation envoyée par <strong style={{ color: '#374151' }}>{firstName}</strong>
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>

          {/* Bloc info compte existant */}
          {invitation.existing_account && (
            <div style={{ padding: '14px 16px', borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 22 }}>
              <p style={{ fontSize: 13, color: '#1e40af', margin: 0, lineHeight: 1.5 }}>
                <strong>ℹ️ Compte existant détecté</strong><br/>
                Vous avez déjà un compte Verimo avec cet email. En acceptant, vous le rattacherez à l'agence. Votre mot de passe actuel reste valide.
              </p>
            </div>
          )}

          {/* Email (read-only) */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
            <div style={{ padding: '11px 14px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #edf2f7', fontSize: 14, color: '#64748b' }}>
              {invitation.email}
            </div>
          </div>

          {/* Nom complet */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nom complet</label>
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Prénom Nom"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#2a7d9c'}
              onBlur={e => e.target.style.borderColor = '#edf2f7'}
            />
          </div>

          {/* Mot de passe (uniquement si nouveau compte) */}
          {!invitation.existing_account ? (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mot de passe</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#2a7d9c'}
                  onBlur={e => e.target.style.borderColor = '#edf2f7'}
                />
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirmer le mot de passe</label>
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#2a7d9c'}
                  onBlur={e => e.target.style.borderColor = '#edf2f7'}
                />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mot de passe actuel</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Votre mot de passe actuel"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#2a7d9c'}
                onBlur={e => e.target.style.borderColor = '#edf2f7'}
              />
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>
                Saisissez votre mot de passe Verimo actuel pour confirmer.
              </p>
            </div>
          )}

          {/* Bloc ce que je pourrai faire */}
          <div style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f0f7fb 100%)', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid rgba(42,125,156,0.1)' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>
              Ce que vous pourrez faire
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
              <li>Consulter les dossiers de l'équipe</li>
              <li>Créer vos propres analyses</li>
              <li>Envoyer les rapports aux clients</li>
            </ul>
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
            disabled={submitting || !fullName || !password || (!invitation.existing_account && !confirmPassword)}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              cursor: submitting ? 'wait' : 'pointer',
              background: (!fullName || !password || (!invitation.existing_account && !confirmPassword))
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)',
              color: '#fff', fontSize: 15, fontWeight: 800,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              opacity: submitting ? 0.7 : 1, transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Création en cours...' : 'Rejoindre l\'agence →'}
          </button>

          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: '14px 0 0', lineHeight: 1.5 }}>
            En cliquant, vous acceptez les <a href="/cgu" style={{ color: '#2a7d9c', textDecoration: 'none' }}>CGU</a> et la <a href="/confidentialite" style={{ color: '#2a7d9c', textDecoration: 'none' }}>politique de confidentialité</a> de Verimo.
          </p>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 24 }}>
          Verimo — Vos documents décryptés, votre décision éclairée.
        </p>
      </div>
    </div>
  );
}

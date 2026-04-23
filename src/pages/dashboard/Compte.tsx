import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCredits } from '../../hooks/useCredits';
import DashboardLoader from '../../components/DashboardLoader';

export default function Compte() {
  const [user, setUser] = useState({ name: '', email: '' });
  const [saved, setSaved] = useState(false);
  const [pwdSection, setPwdSection] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [payments, setPayments] = useState<{ id: string; description: string; amount: number; source: string; created_at: string }[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [provider, setProvider] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [analysesCount, setAnalysesCount] = useState(0);
  const { credits, loadingCredits } = useCredits();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({ name: u.user_metadata?.full_name || '', email: u.email || '' });
        const prov = u.app_metadata?.provider || '';
        setProvider(prov === 'google' ? 'Google' : 'Email / Mot de passe');
        if (u.created_at) setCreatedAt(new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
      }
    });
    loadPayments();
    loadAnalysesCount();
  }, []);

  const loadAnalysesCount = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { count } = await supabase.from('analyses').select('*', { count: 'exact', head: true }).eq('user_id', u.id).eq('status', 'completed');
    setAnalysesCount(count || 0);
  };

  const loadPayments = async () => {
    setPaymentsLoading(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { setPaymentsLoading(false); return; }
    const { data } = await supabase
      .from('payments')
      .select('id, description, amount, credit_type, promo_code, created_at')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setPayments(data.map(p => ({
        id: p.id,
        description: p.description || 'Achat',
        amount: p.amount,
        source: p.promo_code && p.amount === 0 ? 'Code promo' : 'Paiement sécurisé Stripe',
        created_at: new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      })));
    }
    setPaymentsLoading(false);
  };

  const save = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    await supabase.auth.updateUser({ data: { full_name: user.name } });
    if (u) await supabase.from('profiles').update({ full_name: user.name }).eq('id', u.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const changePwd = async () => {
    setPwdError(''); setPwdMsg('');
    if (pwd.next !== pwd.confirm) { setPwdError('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.next.length < 8) { setPwdError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) { setPwdError('Erreur : ' + error.message); }
    else { setPwdMsg('Mot de passe modifié avec succès !'); setPwd({ current: '', next: '', confirm: '' }); setTimeout(() => { setPwdMsg(''); setPwdSection(false); }, 3000); }
  };

  if (loadingCredits || paymentsLoading) return <DashboardLoader message="Chargement de votre compte…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      

      {/* Résumé rapide — 2 colonnes sur mobile, 3 sur desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#2a7d9c', letterSpacing: '-0.02em' }}>{credits.complete}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginTop: 4 }}>Crédits complets</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.02em' }}>{credits.document}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginTop: 4 }}>Crédits simples</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', gridColumn: 'span 2' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', letterSpacing: '-0.02em' }}>{analysesCount}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginTop: 4 }}>Analyses réalisées</div>
        </div>
      </div>

      {/* Infos compte */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' as const, marginBottom: 16 }}>
          {provider && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 3 }}>Connexion</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{provider}</div>
            </div>
          )}
          {createdAt && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 3 }}>Membre depuis</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{createdAt}</div>
            </div>
          )}
        </div>
        <Link to="/dashboard/tarifs" style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const, boxSizing: 'border-box' as const }}>
          + Recharger des crédits
        </Link>
      </div>

      {/* Informations personnelles */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 18, paddingBottom: 13, borderBottom: '1px solid #f0f5f9' }}>Informations personnelles</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {[
            { l: 'Nom complet', v: user.name, set: (v: string) => setUser({ ...user, name: v }), ph: 'Jean Dupont', disabled: false },
            { l: 'Email', v: user.email, set: (_: string) => { }, ph: '', disabled: true },
          ].map(f => (
            <div key={f.l}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 7 }}>{f.l}</label>
              <input value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph} disabled={f.disabled}
                style={{ width: '100%', padding: '11px 13px', borderRadius: 9, border: '1.5px solid #edf2f7', fontSize: 14, background: f.disabled ? '#f8fafc' : '#fff', color: f.disabled ? '#94a3b8' : '#0f172a', outline: 'none', boxSizing: 'border-box' as const }} />
              {f.disabled && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>L'adresse email ne peut pas être modifiée.</p>}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button onClick={save} style={{ padding: '10px 22px', borderRadius: 9, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
            {saved && <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>✓ Enregistré</span>}
          </div>
        </div>
      </div>

      {/* Mot de passe */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pwdSection ? 18 : 0, paddingBottom: pwdSection ? 13 : 0, borderBottom: pwdSection ? '1px solid #f0f5f9' : 'none' }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Mot de passe</h2>
          <button onClick={() => { setPwdSection(!pwdSection); setPwdError(''); setPwdMsg(''); }}
            style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', background: 'none', border: 'none', cursor: 'pointer' }}>
            {pwdSection ? 'Annuler' : 'Modifier'}
          </button>
        </div>
        {!pwdSection && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>••••••••••••</p>}
        {pwdSection && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { l: 'Nouveau mot de passe', k: 'next' as const, v: pwd.next },
              { l: 'Confirmer le mot de passe', k: 'confirm' as const, v: pwd.confirm },
            ].map(f => (
              <div key={f.k}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 7 }}>{f.l}</label>
                <input type="password" value={f.v} onChange={e => setPwd({ ...pwd, [f.k]: e.target.value })}
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 9, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
            ))}
            {pwdError && <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠ {pwdError}</p>}
            {pwdMsg && <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✓ {pwdMsg}</p>}
            <button onClick={changePwd} style={{ alignSelf: 'flex-start', padding: '10px 22px', borderRadius: 9, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Mettre à jour
            </button>
          </div>
        )}
      </div>

      {/* Historique des achats */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 18, paddingBottom: 13, borderBottom: '1px solid #f0f5f9' }}>Historique des achats</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paymentsLoading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 13 }}>
              Aucun achat pour le moment.
            </div>
          ) : payments.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{p.description}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>{p.created_at}</span>
                  <span>·</span>
                  <span style={{ fontWeight: 600, color: p.source === 'Code promo' ? '#7c3aed' : '#2a7d9c' }}>{p.source}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  {p.amount === 0 ? 'Gratuit' : `${p.amount.toFixed(2).replace('.', ',')}€`}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 6 }}>Confirmé</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone danger */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #fecaca', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>Zone de danger</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>La suppression de votre compte est irréversible. Toutes vos analyses seront perdues.</p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)}
            style={{ padding: '10px 22px', borderRadius: 9, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Supprimer mon compte
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Êtes-vous sûr ? Cette action est irréversible.</span>
            <button onClick={async () => {
              try {
                const { error } = await supabase.rpc('delete_current_user');
                if (error) {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) {
                    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                      },
                    });
                    if (!res.ok) { alert('Erreur lors de la suppression. Contactez le support à hello@verimo.fr'); return; }
                  }
                }
                localStorage.removeItem('verimo_user_name');
                localStorage.removeItem('verimo_user_email');
                await supabase.auth.signOut();
                window.location.href = '/';
              } catch {
                alert('Erreur lors de la suppression. Contactez le support à hello@verimo.fr');
              }
            }}
              style={{ padding: '10px 18px', borderRadius: 9, background: '#dc2626', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Confirmer la suppression
            </button>
            <button onClick={() => setDeleteConfirm(false)}
              style={{ padding: '10px 18px', borderRadius: 9, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

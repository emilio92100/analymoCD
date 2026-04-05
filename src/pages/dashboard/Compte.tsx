import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Compte() {
  const [user, setUser] = useState({ name: '', email: '' });
  const [saved, setSaved] = useState(false);
  const [pwdSection, setPwdSection] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ name: u.user_metadata?.full_name || '', email: u.email || '' });
    });
  }, []);

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

  const mockAchats = [
    { date: '24 mars 2026', label: 'Analyse Complète', montant: '19,90€', statut: 'Payé' },
    { date: '19 mars 2026', label: 'Analyse Document', montant: '4,90€', statut: 'Payé' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em' }}>Mon compte</h1>

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
          {mockAchats.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{a.montant}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 6 }}>{a.statut}</span>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>Les factures détaillées seront disponibles après connexion de Stripe.</p>
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

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, FileText, LifeBuoy, Inbox, Trash2, CheckCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Notif = {
  id: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
  analysis_id: string | null;
  link?: string | null;
};

/** Regroupe par période. Le libellé porte l'information, il ne décore pas. */
function grouper(notifs: Notif[]): Array<{ label: string; items: Notif[] }> {
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  const hier = new Date(auj); hier.setDate(hier.getDate() - 1);
  const semaine = new Date(auj); semaine.setDate(semaine.getDate() - 7);
  const mois = new Date(auj); mois.setDate(mois.getDate() - 30);

  const buckets: Record<string, Notif[]> = {};
  const ordre: string[] = [];
  const pousser = (label: string, n: Notif) => {
    if (!buckets[label]) { buckets[label] = []; ordre.push(label); }
    buckets[label].push(n);
  };

  for (const n of notifs) {
    const d = new Date(n.created_at);
    if (d >= auj) pousser("Aujourd'hui", n);
    else if (d >= hier) pousser('Hier', n);
    else if (d >= semaine) pousser('7 derniers jours', n);
    else if (d >= mois) pousser('30 derniers jours', n);
    else pousser('Plus ancien', n);
  }
  return ordre.map(label => ({ label, items: buckets[label] }));
}

const fmtHeure = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Trois natures, trois traitements — la couleur encode la provenance. */
function apparence(n: Notif) {
  if (n.link) return { Icon: LifeBuoy, couleur: '#c2410c', fond: '#fff7ed', bordure: '#fed7aa', nature: 'Support' };
  if (n.analysis_id) return { Icon: FileText, couleur: '#15803d', fond: '#f0fdf4', bordure: '#bbf7d0', nature: 'Rapport' };
  return { Icon: Bell, couleur: '#2a7d9c', fond: '#f0f7fb', bordure: '#c7dde8', nature: 'Information' };
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonLuesInitial, setNonLuesInitial] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      const liste = (data || []) as Notif[];
      setNotifs(liste);
      setNonLuesInitial(liste.filter(n => !n.read).length);
      setLoading(false);
      // Ouvrir cette page vaut lecture : on solde le compteur de la cloche.
      await supabase.from('user_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    })();
  }, []);

  const ouvrir = (n: Notif) => {
    if (n.link) { window.location.href = n.link; return; }
    if (n.analysis_id) { window.location.href = `/rapport?id=${n.analysis_id}`; }
  };

  const supprimer = async (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    await supabase.from('user_notifications').delete().eq('id', id);
  };

  const groupes = grouper(notifs);

  return (
    // Pas de titre ici : la barre du haut affiche déjà « Notifications ».
    // Pas de centrage non plus — le contenu s'aligne sur la barre latérale.
    <div style={{ maxWidth: 900 }}>

      {/* Bandeau de contexte : il compte, il ne décore pas. */}
      {!loading && notifs.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26,
          padding: '16px 20px', borderRadius: 14,
          background: 'linear-gradient(135deg, #0f2d3d, #1c4f66)',
          boxShadow: '0 4px 14px rgba(15,45,61,0.18)',
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={20} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>
              {nonLuesInitial > 0
                ? `${nonLuesInitial} nouvelle${nonLuesInitial > 1 ? 's' : ''} notification${nonLuesInitial > 1 ? 's' : ''}`
                : 'Vous êtes à jour'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3 }}>
              {notifs.length} au total · rapports, mises à jour de dossier et messages de notre équipe
            </div>
          </div>
          {nonLuesInitial > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }}>
              <CheckCheck size={14} style={{ color: '#7dd3a0' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Marquées comme lues</span>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '56px 20px', fontSize: 13.5, color: '#94a3b8' }}>Chargement…</div>
      ) : notifs.length === 0 ? (
        <div style={{ padding: '64px 32px', background: '#fff', borderRadius: 16, border: '1px solid #edf2f7' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Inbox size={26} style={{ color: '#2a7d9c' }} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 7 }}>Rien à signaler pour le moment</div>
          <div style={{ fontSize: 13.5, color: '#64748b', maxWidth: 420, lineHeight: 1.65 }}>
            Vous serez prévenu ici dès qu'un rapport sera prêt, qu'un dossier sera mis à jour,
            ou que notre équipe vous écrira.
          </div>
        </div>
      ) : (
        groupes.map((g, gi) => (
          <div key={g.label} style={{ marginBottom: 30 }}>

            {/* Séparateur de période : texte plein, filet, compteur. Lisible. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f2d3d', letterSpacing: '-0.1px', flexShrink: 0 }}>
                {g.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', background: '#f0f7fb', padding: '3px 9px', borderRadius: 100, flexShrink: 0 }}>
                {g.items.length}
              </span>
              <span style={{ flex: 1, height: 1, background: '#e8eef3' }} />
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8eef3', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,45,61,0.04)' }}>
              {g.items.map((n, i) => {
                const { Icon, couleur, fond, bordure, nature } = apparence(n);
                const cliquable = !!n.link || !!n.analysis_id;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min((gi * 3 + i) * 0.025, 0.28) }}
                    onClick={() => cliquable && ouvrir(n)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 15, padding: '17px 20px',
                      borderBottom: i < g.items.length - 1 ? '1px solid #f2f6f9' : 'none',
                      cursor: cliquable ? 'pointer' : 'default',
                      borderLeft: n.read ? '3px solid transparent' : `3px solid ${couleur}`,
                      background: '#fff', transition: 'background 0.12s',
                    }}
                    onMouseOver={e => { if (cliquable) (e.currentTarget as HTMLElement).style.background = '#fafcfd'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}>

                    <div style={{ width: 40, height: 40, borderRadius: 12, background: fond, border: `1px solid ${bordure}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} style={{ color: couleur }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.1px' }}>{n.title}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: couleur, background: fond, border: `1px solid ${bordure}`, padding: '2px 7px', borderRadius: 5, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                          {nature}
                        </span>
                      </div>
                      {n.message && (
                        <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{n.message}</div>
                      )}
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 7, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{fmtHeure(n.created_at)}</span>
                        {cliquable && (
                          <span style={{ color: couleur, fontWeight: 700 }}>Ouvrir →</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={e => { e.stopPropagation(); supprimer(n.id); }}
                      title="Supprimer cette notification"
                      style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #eef3f7', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.borderColor = '#fecaca'; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#eef3f7'; }}>
                      <Trash2 size={14} style={{ color: '#cbd5e1' }} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {notifs.length >= 200 && (
        <div style={{ fontSize: 12, color: '#94a3b8', paddingLeft: 2 }}>
          Seules les 200 dernières notifications sont conservées.
        </div>
      )}
    </div>
  );
}

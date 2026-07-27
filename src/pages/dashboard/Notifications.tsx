import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, FileText, LifeBuoy, Inbox, Trash2 } from 'lucide-react';
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

/** Regroupe par jour pour aérer la lecture d'un long historique. */
function grouper(notifs: Notif[]): Array<{ label: string; items: Notif[] }> {
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  const hier = new Date(auj); hier.setDate(hier.getDate() - 1);
  const semaine = new Date(auj); semaine.setDate(semaine.getDate() - 7);

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
    else if (d >= semaine) pousser('Cette semaine', n);
    else pousser('Plus ancien', n);
  }
  return ordre.map(label => ({ label, items: buckets[label] }));
}

function heure(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);
    setNotifs((data || []) as Notif[]);
    setLoading(false);
  };

  useEffect(() => {
    charger();
    // Ouvrir cette page vaut lecture : on solde le compteur de la cloche.
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('user_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ouvrir = (n: Notif) => {
    if (n.link) { window.location.href = n.link; return; }
    if (n.analysis_id) { window.location.href = `/rapport?id=${n.analysis_id}`; return; }
  };

  const supprimer = async (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    await supabase.from('user_notifications').delete().eq('id', id);
  };

  const icone = (n: Notif) => {
    if (n.link) return { Icon: LifeBuoy, couleur: '#d97706', fond: '#fef3c7' };
    if (n.analysis_id) return { Icon: FileText, couleur: '#16a34a', fond: '#f0fdf4' };
    return { Icon: Bell, couleur: '#2a7d9c', fond: '#f0f7fb' };
  };

  const groupes = grouper(notifs);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
          Notifications
        </h1>
        <p style={{ fontSize: 13.5, color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.55 }}>
          L'historique de tout ce que Verimo vous a signalé — rapports terminés, mises à jour de dossier, messages de notre équipe.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '56px 20px', textAlign: 'center', fontSize: 13.5, color: '#94a3b8' }}>
          Chargement…
        </div>
      ) : notifs.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #edf2f7' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Inbox size={26} style={{ color: '#cbd5e1' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Aucune notification</div>
          <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
            Vous serez prévenu ici dès qu'un rapport sera prêt ou qu'un message vous sera adressé.
          </div>
        </div>
      ) : (
        groupes.map((g, gi) => (
          <div key={g.label} style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 }}>
              {g.label}
            </div>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', overflow: 'hidden' }}>
              {g.items.map((n, i) => {
                const { Icon, couleur, fond } = icone(n);
                const cliquable = !!n.link || !!n.analysis_id;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min((gi * 4 + i) * 0.02, 0.3) }}
                    onClick={() => cliquable && ouvrir(n)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px',
                      borderBottom: i < g.items.length - 1 ? '1px solid #f5f8fa' : 'none',
                      cursor: cliquable ? 'pointer' : 'default',
                      background: n.read ? '#fff' : '#fbfdff',
                      transition: 'background 0.12s',
                    }}
                    onMouseOver={e => { if (cliquable) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = n.read ? '#fff' : '#fbfdff'; }}>

                    <div style={{ width: 38, height: 38, borderRadius: 11, background: fond, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={17} style={{ color: couleur }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: n.read ? 600 : 800, color: '#0f172a' }}>{n.title}</span>
                        {!n.read && (
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2a7d9c', flexShrink: 0 }} />
                        )}
                      </div>
                      {n.message && (
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 1.6 }}>{n.message}</div>
                      )}
                      <div style={{ fontSize: 11.5, color: '#b4c2d0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{heure(n.created_at)}</span>
                        {cliquable && <span style={{ color: '#2a7d9c', fontWeight: 700 }}>→ Ouvrir</span>}
                      </div>
                    </div>

                    <button
                      onClick={e => { e.stopPropagation(); supprimer(n.id); }}
                      title="Supprimer cette notification"
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #f1f5f9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={13} style={{ color: '#cbd5e1' }} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {notifs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#b4c2d0', marginTop: 4, paddingLeft: 2 }}>
          <CheckCircle size={13} />
          <span>Les 200 dernières notifications sont conservées.</span>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, Users, FileText, Mail, BarChart2,
  Search, X, Check, AlertTriangle, Shield, CreditCard,
  Trash2, RefreshCw, Eye, EyeOff, TrendingUp, ArrowRight,
  LogOut, Send, UserPlus, CheckCircle, Download, Tag,
  Bell, ChevronLeft, Plus, Copy,
} from 'lucide-react';

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type AdminUser = {
  id: string; email: string; created_at: string;
  full_name?: string; role: string; suspended?: boolean;
  credits_document?: number; credits_complete?: number;
  email_verified?: boolean; provider?: string;
};
type AdminAnalyse = {
  id: string; user_id: string; type: string; status: string;
  adresse_bien?: string; title?: string; score?: number; created_at: string;
};
type ContactMessage = {
  id: string; name: string; email: string; subject?: string;
  message: string; created_at: string; read: boolean;
};
type PromoCode = {
  id: string; code: string; type: 'credits' | 'percent' | 'fixed';
  value: number; credit_type?: string; expires_at?: string;
  max_uses?: number; uses_count: number; restricted_email?: string;
  active: boolean; created_at: string;
};
type ActionLog = {
  id: string; admin_email: string; action: string;
  target?: string; created_at: string;
};
type ConfirmAction = {
  title: string; message: string; confirmLabel: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => Promise<void>;
};

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const fmtDateTime = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const getScoreColor = (s: number) => s >= 14 ? '#16a34a' : s >= 10 ? '#d97706' : '#dc2626';
const getScoreBg = (s: number) => s >= 14 ? '#f0fdf4' : s >= 10 ? '#fffbeb' : '#fef2f2';
const PLAN_PRICES: Record<string, number> = { document: 4.90, complete: 19.90, pack2: 29.90, pack3: 39.90 };
const PLAN_LABELS: Record<string, string> = { document: 'Simple', complete: 'Complète', pack2: 'Pack 2', pack3: 'Pack 3' };
const PLAN_COLORS: Record<string, string> = { document: '#64748b', complete: '#2a7d9c', pack2: '#7c3aed', pack3: '#f0a500' };

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/* ══════════════════════════════════════════
   COMPOSANTS UI
══════════════════════════════════════════ */
function KpiCard({ label, value, sub, color, icon, delay = 0 }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
    </motion.div>
  );
}

function Badge({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color, background: bg, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap' as const }}>{children}</span>;
}

function Modal({ title, onClose, children, width = 500 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: width, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{title}</h3>
          <button onClick={onClose} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, cursor: 'pointer', color: '#94a3b8', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function ConfirmModal({ action, onClose }: { action: ConfirmAction; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const c = { danger: { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626' }, warning: { bg: '#fffbeb', border: '#fde68a', icon: '#f0a500' }, info: { bg: '#f0f7fb', border: '#bae3f5', icon: '#2a7d9c' } }[action.variant];
  return (
    <Modal title={action.title} onClose={onClose}>
      <div style={{ padding: '14px 16px', borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', gap: 12, marginBottom: 22 }}>
        <AlertTriangle size={18} style={{ color: c.icon, flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0 }}>{action.message}</p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
        <button onClick={async () => { setLoading(true); await action.onConfirm(); setLoading(false); onClose(); }} disabled={loading}
          style={{ flex: 1, padding: '10px', borderRadius: 10, background: c.bg, border: `1.5px solid ${c.border}`, color: c.icon, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'En cours...' : action.confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      <input {...props} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, color: '#0f172a', fontFamily: 'inherit', background: '#f8fafc', transition: 'border-color 0.15s' }}
        onFocus={e => e.target.style.borderColor = '#2a7d9c'} onBlur={e => e.target.style.borderColor = '#edf2f7'} />
    </div>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      <select {...props} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, color: '#0f172a', fontFamily: 'inherit', background: '#f8fafc' }}>
        {children}
      </select>
    </div>
  );
}

function ActionBtn({ icon, label, color = '#64748b', bg = '#f8fafc', border = '#edf2f7', onClick }: { icon: React.ReactNode; label: string; color?: string; bg?: string; border?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: bg, border: `1px solid ${border}`, cursor: 'pointer', fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap' as const, transition: 'all 0.15s' }}>
      {icon} {label}
    </button>
  );
}

/* ══════════════════════════════════════════
   ADMIN PAGE ROOT
══════════════════════════════════════════ */
type TabId = 'dashboard' | 'users' | 'analyses' | 'messages' | 'stats' | 'promos' | 'logs' | 'banner';

export default function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [toast, setToast] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 3000);
  }, []);

  const logAction = useCallback(async (action: string, target?: string) => {
    try { await supabase.from('admin_logs').insert({ admin_email: adminEmail, action, target }); } catch { /* silencieux */ }
  }, [adminEmail]);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/connexion'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { navigate('/dashboard'); return; }
      setAdminEmail(user.email || '');
      setIsAdmin(true);
      setLoading(false);
      // Unread messages count
      const { count } = await supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('read', false);
      setUnreadCount(count || 0);
    };
    check();
  }, [navigate]);

  // Créer table admin_logs si elle n'existe pas (silencieux)
  useEffect(() => {
    if (!isAdmin) return;
    const init = async () => { try { await supabase.rpc('create_admin_logs_if_not_exists'); } catch { /* silencieux */ } };
    init();
  }, [isAdmin]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7f9' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #2a7d9c', borderTopColor: 'transparent' }} />
    </div>
  );
  if (!isAdmin) return null;

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'stats', label: 'Statistiques', icon: BarChart2 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'analyses', label: 'Analyses', icon: FileText },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadCount },
    { id: 'promos', label: 'Codes promo', icon: Tag },
    { id: 'banner', label: 'Bannière', icon: Bell },
    { id: 'logs', label: 'Historique', icon: Bell },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f9', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Styles responsive mobile */}
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { display: none !important; }
          .admin-tabs-mobile { display: flex !important; }
          .admin-main { padding: 14px 12px 90px !important; }
          .admin-topbar-label { display: none !important; }

          /* KPI grid : 2 colonnes sur mobile */
          .admin-kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }

          /* Actions rapides + CA : stack vertical */
          .admin-overview-grid { grid-template-columns: 1fr !important; }

          /* Fiche user détail : stack vertical */
          .admin-detail-grid { grid-template-columns: 1fr !important; }

          /* Liste users : cards au lieu de table */
          .admin-users-header { display: none !important; }
          .admin-user-row { 
            grid-template-columns: 1fr !important;
            padding: 14px !important;
            gap: 10px !important;
          }
          .admin-user-meta { display: none !important; }
          .admin-user-actions { flex-wrap: wrap !important; }

          /* Analyses table : scroll horizontal */
          .admin-table-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }

          /* Messages : stack vertical */
          .admin-messages-grid { grid-template-columns: 1fr !important; }

          /* Promos table : scroll horizontal */
          .admin-promo-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }

          /* Stats : stack vertical */
          .admin-stats-grid { grid-template-columns: 1fr !important; }
          .admin-stats-kpi { grid-template-columns: 1fr 1fr !important; }

          /* Filtres tabs : scroll horizontal */
          .admin-filter-tabs { overflow-x: auto !important; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
        }

        /* Nav mobile pills fixée en bas */
        .admin-tabs-mobile {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 90;
          background: #fff;
          border-top: 1px solid #edf2f7;
          padding: 8px 10px;
          overflow-x: auto;
          gap: 6px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
        }
        .admin-tabs-mobile::-webkit-scrollbar { display: none; }

        .admin-tab-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 14px;
          border-radius: 100px;
          border: 1.5px solid #edf2f7;
          background: #f8fafc;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .admin-tab-pill.active {
          background: linear-gradient(135deg, #2a7d9c, #0f2d3d);
          color: #fff;
          border-color: transparent;
        }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#0f2d3d', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' as const }}>
            <CheckCircle size={14} color="#22c55e" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{confirm && <ConfirmModal action={confirm} onClose={() => setConfirm(null)} />}</AnimatePresence>

      {/* Topbar */}
      <div style={{ background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(15,45,61,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(42,125,156,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={17} color="#7dd3f0" />
          </div>
          <div className="admin-topbar-title">
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>VERIMO ADMIN</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{adminEmail}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            ←<span className="admin-topbar-title" style={{ display: 'inline' }}> Dashboard</span>
          </button>
          <button onClick={() => { supabase.auth.signOut(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <LogOut size={13} /><span className="admin-topbar-title" style={{ display: 'inline' }}> Déco</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar — cachée sur mobile */}
        <aside className="admin-sidebar" style={{ width: 220, background: '#fff', borderRight: '1px solid #edf2f7', padding: '20px 12px', flexShrink: 0, position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, border: 'none', background: active ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : 'transparent', color: active ? '#fff' : '#64748b', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', position: 'relative' as const }}>
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  {tab.badge ? <span style={{ background: '#f0a500', color: '#fff', borderRadius: 100, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const }}>{tab.badge}</span> : null}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Navigation mobile en pills — visible uniquement sur mobile */}
        <div className="admin-tabs-mobile" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90, background: '#fff', borderTop: '1px solid #edf2f7', padding: '8px 12px', overflowX: 'auto', gap: 6 }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`admin-tab-pill${active ? ' active' : ''}`}>
                <Icon size={13} />
                {tab.label.split(' ')[0]}
                {tab.badge ? <span style={{ background: '#f0a500', color: '#fff', borderRadius: 100, fontSize: 9, fontWeight: 800, padding: '1px 5px' }}>{tab.badge}</span> : null}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <main className="admin-main" style={{ flex: 1, padding: '28px 24px', overflowY: 'auto', paddingBottom: 80 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {activeTab === 'dashboard' && <DashboardTab onNavigate={setActiveTab} />}
              {activeTab === 'stats' && <StatsTab />}
              {activeTab === 'users' && <UsersTab onConfirm={setConfirm} showToast={showToast} logAction={logAction} />}
              {activeTab === 'analyses' && <AnalysesTab />}
              {activeTab === 'messages' && <MessagesTab onConfirm={setConfirm} showToast={showToast} onReadChange={setUnreadCount} />}
              {activeTab === 'promos' && <PromosTab onConfirm={setConfirm} showToast={showToast} logAction={logAction} />}
              {activeTab === 'banner' && <BannerTab showToast={showToast} logAction={logAction} />}
              {activeTab === 'logs' && <LogsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   BANNER TAB
══════════════════════════════════════════ */
function BannerTab({ showToast, logAction }: { showToast: (m: string) => void; logAction: (a: string, t?: string) => Promise<void> }) {
  const [banner, setBanner] = useState<{ id: string; message: string; type: string; active: boolean } | null>(null);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'success'>('info');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('banners').select('*').eq('active', true).order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        setBanner(data[0]);
        setMessage(data[0].message);
        setType(data[0].type);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!message.trim()) return;
    setSaving(true);
    if (banner) {
      await supabase.from('banners').update({ message, type, updated_at: new Date().toISOString() }).eq('id', banner.id);
      setBanner({ ...banner, message, type });
      await logAction('Bannière modifiée', message.substring(0, 50));
      showToast('Bannière mise à jour !');
    } else {
      const { data } = await supabase.from('banners').insert({ message, type, active: true }).select().single();
      if (data) setBanner(data);
      await logAction('Bannière créée', message.substring(0, 50));
      showToast('Bannière créée et activée !');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!banner) return;
    await supabase.from('banners').delete().eq('id', banner.id);
    setBanner(null);
    setMessage('');
    await logAction('Bannière supprimée');
    showToast('Bannière supprimée — plus visible sur le dashboard');
  };

  const COLORS: Record<string, { bg: string; border: string; color: string; label: string }> = {
    info:    { bg: '#f0f7fb', border: '#bae3f5', color: '#2a7d9c', label: 'ℹ️ Information' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', label: '⚠️ Avertissement' },
    success: { bg: '#f0fdf4', border: '#86efac', color: '#16a34a', label: '✅ Succès' },
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Bannière dashboard</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Affichez un message sur le dashboard de tous vos utilisateurs connectés.</p>
      </div>

      {/* Aperçu */}
      {message.trim() && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.08em' }}>APERÇU</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, background: COLORS[type].bg, border: `1.5px solid ${COLORS[type].border}` }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{type === 'info' ? 'ℹ️' : type === 'warning' ? '⚠️' : '✅'}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: COLORS[type].color }}>{message}</span>
            <X size={16} style={{ color: COLORS[type].color, opacity: 0.5, flexShrink: 0 }} />
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 18 }}>

        {/* Type */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Type de bannière</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['info', 'warning', 'success'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${type === t ? COLORS[t].border : '#edf2f7'}`, background: type === t ? COLORS[t].bg : '#f8fafc', color: type === t ? COLORS[t].color : '#64748b', fontSize: 12, fontWeight: type === t ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                {COLORS[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ex : Verimo est en maintenance ce soir de 22h à 23h. Merci de votre compréhension."
            rows={3}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, resize: 'vertical', fontFamily: 'inherit', color: '#0f172a', background: '#f8fafc' }}
          />
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={saving || !message.trim()}
            style={{ flex: 1, padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving || !message.trim() ? 'not-allowed' : 'pointer', opacity: saving || !message.trim() ? 0.6 : 1 }}>
            {saving ? 'Enregistrement...' : banner ? '💾 Mettre à jour' : '🚀 Publier la bannière'}
          </button>
          {banner && (
            <button onClick={handleDelete}
              style={{ padding: '12px 18px', borderRadius: 11, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              🗑️ Supprimer
            </button>
          )}
        </div>

        {banner && (
          <div style={{ fontSize: 12, color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontWeight: 600 }}>
            ✓ Bannière active — visible sur le dashboard de tous les utilisateurs
          </div>
        )}
      </div>
    </div>
  );
}
function DashboardTab({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const [kpis, setKpis] = useState({ users: 0, analyses: 0, messages: 0, ca: 0 });

  useEffect(() => {
    const load = async () => {
      const [{ count: u }, { count: a }, { count: m }, { data: anal }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('analyses').select('*', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('read', false),
        supabase.from('analyses').select('type').eq('status', 'completed'),
      ]);
      const ca = (anal || []).reduce((s, a) => s + (PLAN_PRICES[a.type] || 0), 0);
      setKpis({ users: u || 0, analyses: a || 0, messages: m || 0, ca });
    };
    load();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Vue d'ensemble</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Résumé de l'activité Verimo en temps réel</p>
      </div>
      <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Utilisateurs" value={kpis.users} color="#2a7d9c" icon={<Users size={16} color="#2a7d9c" />} delay={0} />
        <KpiCard label="Analyses" value={kpis.analyses} color="#7c3aed" icon={<FileText size={16} color="#7c3aed" />} delay={0.05} />
        <KpiCard label="Messages non lus" value={kpis.messages} color="#f0a500" icon={<Mail size={16} color="#f0a500" />} delay={0.1} />
        <KpiCard label="CA estimé" value={`${kpis.ca.toFixed(0)}€`} sub="Analyses complétées" color="#16a34a" icon={<TrendingUp size={16} color="#16a34a" />} delay={0.15} />
      </div>
      <div className="admin-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Actions rapides</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {([
              { label: 'Gérer les utilisateurs', icon: Users, color: '#2a7d9c', tab: 'users' },
              { label: 'Voir les messages', icon: Mail, color: '#f0a500', tab: 'messages' },
              { label: 'Voir les analyses', icon: FileText, color: '#7c3aed', tab: 'analyses' },
              { label: 'Codes promo', icon: Tag, color: '#16a34a', tab: 'promos' },
              { label: 'Statistiques', icon: BarChart2, color: '#2a7d9c', tab: 'stats' },
            ] as const).map((a, i) => (
              <button key={i} onClick={() => onNavigate(a.tab as TabId)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}
                onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.color}08`; el.style.borderColor = `${a.color}30`; }}
                onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f8fafc'; el.style.borderColor = '#edf2f7'; }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${a.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <a.icon size={15} style={{ color: a.color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{a.label}</span>
                <ArrowRight size={13} style={{ color: '#cbd5e1' }} />
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>CA Total Estimé</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{kpis.ca.toFixed(0)}€</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Basé sur les analyses complétées</div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 24 }}>
            {[{ l: 'Users', v: kpis.users }, { l: 'Analyses', v: kpis.analyses }, { l: 'Messages', v: kpis.messages }].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STATS TAB
══════════════════════════════════════════ */
type Period = '7j' | '30j' | '3m' | '12m' | 'custom';

function StatsTab() {
  const [period, setPeriod] = useState<Period>('30j');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [stats, setStats] = useState({ newUsers: 0, totalUsers: 0, totalAnalyses: 0, completedAnalyses: 0, ca: 0, ticketMoyen: 0, byType: {} as Record<string, number> });
  const [weeklyData, setWeeklyData] = useState<{ week: string; ca: number; users: number }[]>([]);

  const getRange = useCallback(() => {
    const now = new Date(); const end = now.toISOString(); let start = new Date(now);
    if (period === '7j') start.setDate(now.getDate() - 7);
    else if (period === '30j') start.setDate(now.getDate() - 30);
    else if (period === '3m') start.setMonth(now.getMonth() - 3);
    else if (period === '12m') start.setFullYear(now.getFullYear() - 1);
    else return { start: customStart, end: customEnd + 'T23:59:59' };
    return { start: start.toISOString(), end };
  }, [period, customStart, customEnd]);

  useEffect(() => {
    const load = async () => {
      const { start, end } = getRange();
      if (!start || !end) return;
      const [{ count: newUsers }, { count: totalUsers }, { data: analyses }, { count: totalAnalyses }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('analyses').select('type,status,created_at').gte('created_at', start).lte('created_at', end),
        supabase.from('analyses').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
      ]);
      const completed = (analyses || []).filter(a => a.status === 'completed');
      const ca = completed.reduce((s, a) => s + (PLAN_PRICES[a.type] || 0), 0);
      const byType = (analyses || []).reduce((acc, a) => ({ ...acc, [a.type]: (acc[a.type] || 0) + 1 }), {} as Record<string, number>);
      setStats({ newUsers: newUsers || 0, totalUsers: totalUsers || 0, totalAnalyses: totalAnalyses || 0, completedAnalyses: completed.length, ca, ticketMoyen: completed.length ? ca / completed.length : 0, byType });

      // Weekly chart data (last 8 weeks)
      const weeks: { week: string; ca: number; users: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const wEnd = new Date(); wEnd.setDate(wEnd.getDate() - i * 7);
        const wStart = new Date(wEnd); wStart.setDate(wEnd.getDate() - 7);
        const label = wStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const weekAnal = (analyses || []).filter(a => { const d = new Date(a.created_at); return d >= wStart && d < wEnd && a.status === 'completed'; });
        const weekCa = weekAnal.reduce((s, a) => s + (PLAN_PRICES[a.type] || 0), 0);
        weeks.push({ week: label, ca: weekCa, users: 0 });
      }
      setWeeklyData(weeks);
    };
    load();
  }, [getRange]);

  const maxCa = Math.max(...weeklyData.map(w => w.ca), 1);
  const periods: { id: Period; label: string }[] = [{ id: '7j', label: '7 jours' }, { id: '30j', label: '30 jours' }, { id: '3m', label: '3 mois' }, { id: '12m', label: '12 mois' }, { id: 'custom', label: 'Personnalisé' }];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Statistiques</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Performance sur la période sélectionnée</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${period === p.id ? '#2a7d9c' : '#edf2f7'}`, background: period === p.id ? '#f0f7fb' : '#fff', color: period === p.id ? '#2a7d9c' : '#64748b', fontSize: 13, fontWeight: period === p.id ? 700 : 500, cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, fontFamily: 'inherit' }} />
            <span style={{ color: '#94a3b8' }}>→</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, fontFamily: 'inherit' }} />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Nouveaux inscrits" value={stats.newUsers} sub={`/ ${stats.totalUsers} total`} color="#2a7d9c" icon={<Users size={16} color="#2a7d9c" />} />
        <KpiCard label="Analyses lancées" value={stats.totalAnalyses} sub={`${stats.completedAnalyses} complétées`} color="#7c3aed" icon={<FileText size={16} color="#7c3aed" />} />
        <KpiCard label="CA période" value={`${stats.ca.toFixed(0)}€`} color="#16a34a" icon={<TrendingUp size={16} color="#16a34a" />} />
        <KpiCard label="Ticket moyen" value={`${stats.ticketMoyen.toFixed(2)}€`} color="#f0a500" icon={<CreditCard size={16} color="#f0a500" />} />
      </div>

      {/* Graphique CA semaine par semaine */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>CA par semaine (8 dernières semaines)</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {weeklyData.map((w, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c' }}>{w.ca > 0 ? `${w.ca.toFixed(0)}€` : ''}</div>
              <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((w.ca / maxCa) * 80, w.ca > 0 ? 4 : 0)}px` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '100%', background: w.ca > 0 ? 'linear-gradient(to top,#2a7d9c,#7dd3f0)' : '#f1f5f9', borderRadius: '6px 6px 0 0', minHeight: 4 }} />
              <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' as const }}>{w.week}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Répartition par plan */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Répartition par plan</div>
        {Object.entries(PLAN_LABELS).map(([type, label]) => {
          const count = stats.byType[type] || 0;
          const pct = stats.totalAnalyses ? Math.round((count / stats.totalAnalyses) * 100) : 0;
          const revenue = count * (PLAN_PRICES[type] || 0);
          return (
            <div key={type} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: PLAN_COLORS[type] }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: PLAN_COLORS[type] }}>{count} analyse{count > 1 ? 's' : ''}</span>
                  <span style={{ color: '#94a3b8' }}>{pct}%</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{revenue.toFixed(0)}€</span>
                </div>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', background: PLAN_COLORS[type], borderRadius: 99 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   USERS TAB
══════════════════════════════════════════ */
function UsersTab({ onConfirm, showToast, logAction }: { onConfirm: (a: ConfirmAction) => void; showToast: (m: string) => void; logAction: (a: string, t?: string) => Promise<void> }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'invite' | 'credits' | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userAnalyses, setUserAnalyses] = useState<AdminAnalyse[]>([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', credits_doc: 0, credits_complete: 0 });
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const [filterTab, setFilterTab] = useState<'all' | 'verified' | 'unverified'>('all');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openDetail = async (user: AdminUser) => {
    setDetailUser(user);
    const { data } = await supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setUserAnalyses(data || []);
  };

  const filtered = users
    .filter(u => {
      const matchSearch = u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase());
      const matchTab = filterTab === 'all' ? true : filterTab === 'verified' ? u.email_verified === true : u.email_verified === false;
      return matchSearch && matchTab;
    })
    .sort((a, b) => {
      // Vérifiés en premier dans l'onglet "Tous"
      if (filterTab === 'all') {
        if (a.email_verified && !b.email_verified) return -1;
        if (!a.email_verified && b.email_verified) return 1;
      }
      return 0;
    });

  const callEdgeFunction = async (action: string, payload: Record<string, string>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  };

  const handleCreate = async () => {
    setSending(true);
    try {
      const result = await callEdgeFunction('create', { email: form.email, password: form.password, full_name: form.name });
      // Forcer la création du profil si le trigger ne l'a pas fait
      if (result.user?.id) {
        await supabase.from('profiles').upsert({
          id: result.user.id,
          email: form.email,
          full_name: form.name || null,
          role: 'user',
        }, { onConflict: 'id', ignoreDuplicates: true });
      }
      await logAction('Compte créé', form.email);
      setFeedback('✓ Compte créé !');
      setTimeout(async () => { setModal(null); setFeedback(''); await loadUsers(); }, 1200);
      showToast(`Compte ${form.email} créé`);
    } catch (e) {
      setFeedback('Erreur : ' + (e as Error).message);
    }
    setSending(false);
  };

  const handleInvite = async () => {
    setSending(true);
    try {
      await callEdgeFunction('invite', { email: form.email });
      await logAction('Invitation envoyée', form.email);
      setFeedback('✓ Invitation envoyée !');
      setTimeout(() => { setModal(null); setFeedback(''); }, 1500);
      showToast(`Invitation envoyée à ${form.email}`);
    } catch (e) {
      setFeedback('Erreur : ' + (e as Error).message);
    }
    setSending(false);
  };

  const handleSetCredits = async () => {
    if (!selectedUser) return;
    setSending(true);

    const { error } = await supabase.from('profiles')
      .update({
        credits_document: form.credits_doc,
        credits_complete: form.credits_complete,
      })
      .eq('id', selectedUser.id);
    if (error) { showToast('Erreur : ' + error.message); setSending(false); return; }
    await logAction('Crédits modifiés', `${selectedUser.email} → doc:${form.credits_doc} ana:${form.credits_complete}`);
    setSending(false);
    setModal(null);
    if (detailUser?.id === selectedUser.id) {
      setDetailUser(u => u ? { ...u, credits_document: form.credits_doc, credits_complete: form.credits_complete } : u);
    }
    await loadUsers();
    showToast(`Crédits mis à jour pour ${selectedUser.email}`);
  };

  const doExport = () => {
    exportCSV(users.map(u => ({ email: u.email, nom: u.full_name || '', role: u.role, inscrit: fmtDate(u.created_at), credits_doc: u.credits_document || 0, credits_ana: u.credits_complete || 0 })), 'verimo-utilisateurs.csv');
    showToast('Export CSV téléchargé');
  };

  if (detailUser) {
    return (
      <div>
        <button onClick={() => setDetailUser(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2a7d9c' }}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <div className="admin-detail-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', height: 'fit-content' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 auto 16px' }}>
              {(detailUser.full_name || detailUser.email).charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'center' as const, marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{detailUser.full_name || '—'}</div>
              <div style={{ fontSize: 13, color: '#2a7d9c' }}>{detailUser.email}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Inscrit le {fmtDate(detailUser.created_at)}</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' as const }}>
                {detailUser.role === 'admin' && <Badge color="#7c3aed" bg="#f5f3ff">admin</Badge>}
                {detailUser.suspended && <Badge color="#dc2626" bg="#fef2f2">suspendu</Badge>}
                {detailUser.email_verified === true
                  ? <Badge color="#16a34a" bg="#f0fdf4">✓ {detailUser.provider === 'google' ? 'via Google' : 'via Email'}</Badge>
                  : <Badge color="#f0a500" bg="#fffbeb">⚠ non vérifié</Badge>
                }
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {[{ l: 'Crédits Simple', v: detailUser.credits_document || 0, c: '#2a7d9c' }, { l: 'Crédits Complet', v: detailUser.credits_complete || 0, c: '#7c3aed' }, { l: 'Analyses', v: userAnalyses.length, c: '#16a34a' }].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{s.l}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: s.c }}>{s.v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginTop: 16 }}>
              <button onClick={() => { setSelectedUser(detailUser); setForm(f => ({ ...f, credits_doc: detailUser.credits_document || 0, credits_complete: detailUser.credits_complete || 0 })); setModal('credits'); }}
                style={{ padding: '10px', borderRadius: 10, background: '#f0f7fb', border: '1.5px solid #bae3f5', color: '#2a7d9c', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CreditCard size={14} /> Modifier les crédits
              </button>
              <button onClick={() => onConfirm({ title: 'Réinitialiser le mot de passe', message: `Un email de réinitialisation sera envoyé à ${detailUser.email}.`, confirmLabel: "Envoyer l'email", variant: 'info', onConfirm: async () => { await supabase.auth.resetPasswordForEmail(detailUser.email, { redirectTo: 'https://verimo.fr/auth/reset-password' }); showToast(`Email envoyé`); } })}
                style={{ padding: '10px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <RefreshCw size={14} /> Reset mot de passe
              </button>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              Analyses ({userAnalyses.length})
            </div>
            {userAnalyses.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucune analyse</div>
            ) : userAnalyses.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 22px', borderBottom: i < userAnalyses.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.adresse_bien || a.title || 'Sans titre'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(a.created_at)} · {PLAN_LABELS[a.type] || a.type}</div>
                </div>
                {a.score != null && <span style={{ fontSize: 13, fontWeight: 900, color: getScoreColor(a.score), background: getScoreBg(a.score), padding: '3px 9px', borderRadius: 8 }}>{a.score}/20</span>}
                {a.status === 'completed' ? <Badge color="#16a34a" bg="#f0fdf4">✓</Badge> : a.status === 'processing' ? <Badge color="#2a7d9c" bg="#f0f7fb">⟳</Badge> : <Badge color="#dc2626" bg="#fef2f2">✗</Badge>}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {modal === 'credits' && selectedUser && (
            <Modal title={`Crédits — ${selectedUser.email}`} onClose={() => setModal(null)}>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                <Input label="Crédits Analyse Simple" type="number" value={form.credits_doc} onChange={e => setForm(f => ({ ...f, credits_doc: parseInt(e.target.value) || 0 }))} />
                <Input label="Crédits Analyse Complète" type="number" value={form.credits_complete} onChange={e => setForm(f => ({ ...f, credits_complete: parseInt(e.target.value) || 0 }))} />
                <button onClick={handleSetCredits} style={{ padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  <Check size={15} /> Enregistrer
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Utilisateurs</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{users.length} comptes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={doExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => { setForm(f => ({ ...f, email: '', name: '' })); setFeedback(''); setModal('invite'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Send size={14} /> Inviter
          </button>
          <button onClick={() => { setForm(f => ({ ...f, email: '', password: '', name: '' })); setFeedback(''); setModal('create'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <UserPlus size={14} /> Créer
          </button>
        </div>
      </div>

      {/* Onglets filtre */}
      <div className="admin-filter-tabs" style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {([
          { id: 'all', label: `Tous (${users.length})` },
          { id: 'verified', label: `✓ Vérifiés (${users.filter(u => u.email_verified === true).length})` },
          { id: 'unverified', label: `⚠ Non vérifiés (${users.filter(u => u.email_verified === false).length})` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setFilterTab(t.id)}
            style={{ padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${filterTab === t.id ? '#2a7d9c' : '#edf2f7'}`, background: filterTab === t.id ? '#f0f7fb' : '#fff', color: filterTab === t.id ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filterTab === t.id ? 700 : 500, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="admin-users-header" style={{ display: 'grid', gridTemplateColumns: '1fr 100px 60px 60px 1fr', borderBottom: '1.5px solid #edf2f7', padding: '10px 18px', background: '#f8fafc' }}>
          {['Utilisateur', 'Inscrit', 'Doc', 'Ana.', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>{h}</div>
          ))}
        </div>
        {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
          : filtered.map((user, i) => (
            <div key={user.id} className="admin-user-row" style={{ display: 'grid', gridTemplateColumns: '1fr 100px 60px 60px 1fr', padding: '12px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center' }}>
              <button onClick={() => openDetail(user)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, padding: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', textDecoration: 'underline', textDecorationColor: '#bae3f5' }}>{user.full_name || user.email}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{user.email}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                  {user.role === 'admin' && <Badge color="#7c3aed" bg="#f5f3ff">admin</Badge>}
                  {user.suspended && <Badge color="#dc2626" bg="#fef2f2">suspendu</Badge>}
                  {user.email_verified === true
                    ? <Badge color="#16a34a" bg="#f0fdf4">✓ {user.provider === 'google' ? 'via Google' : 'via Email'}</Badge>
                    : <Badge color="#f0a500" bg="#fffbeb">⚠ non vérifié</Badge>
                  }
                </div>
              </button>
              <div className="admin-user-meta" style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(user.created_at)}</div>
              <div className="admin-user-meta" style={{ fontSize: 14, fontWeight: 800, color: '#2a7d9c' }}>{user.credits_document || 0}</div>
              <div className="admin-user-meta" style={{ fontSize: 14, fontWeight: 800, color: '#2a7d9c' }}>{user.credits_complete || 0}</div>
              <div className="admin-user-actions" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                <ActionBtn icon={<Eye size={11} />} label="Détail" color="#2a7d9c" bg="#f0f7fb" border="#bae3f5" onClick={() => openDetail(user)} />
                <ActionBtn icon={<CreditCard size={11} />} label="Crédits" color="#7c3aed" bg="#f5f3ff" border="#ddd6fe"
                  onClick={() => { setSelectedUser(user); setForm(f => ({ ...f, credits_doc: user.credits_document || 0, credits_complete: user.credits_complete || 0 })); setModal('credits'); }} />
                <ActionBtn icon={<RefreshCw size={11} />} label="Reset" color="#64748b" bg="#f8fafc" border="#edf2f7"
                  onClick={() => onConfirm({ title: 'Reset mot de passe', message: `Email de réinitialisation → ${user.email}`, confirmLabel: "Envoyer", variant: 'info', onConfirm: async () => { await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: 'https://verimo.fr/auth/reset-password' }); await logAction('Reset mdp', user.email); showToast(`Email envoyé à ${user.email}`); } })} />
                <ActionBtn icon={user.suspended ? <Eye size={11} /> : <EyeOff size={11} />} label={user.suspended ? 'Réactiver' : 'Suspendre'}
                  color={user.suspended ? '#16a34a' : '#f0a500'} bg={user.suspended ? '#f0fdf4' : '#fffbeb'} border={user.suspended ? '#d1fae5' : '#fde68a'}
                  onClick={() => onConfirm({ title: user.suspended ? 'Réactiver' : 'Suspendre', message: `${user.suspended ? 'Réactiver' : 'Suspendre'} le compte de ${user.email} ?`, confirmLabel: user.suspended ? 'Réactiver' : 'Suspendre', variant: user.suspended ? 'info' : 'warning', onConfirm: async () => { await supabase.from('profiles').update({ suspended: !user.suspended }).eq('id', user.id); await logAction(user.suspended ? 'Réactivation' : 'Suspension', user.email); loadUsers(); showToast(`Compte ${user.suspended ? 'réactivé' : 'suspendu'}`); } })} />
                <ActionBtn icon={<Trash2 size={11} />} label="Supprimer" color="#dc2626" bg="#fef2f2" border="#fecaca"
                  onClick={() => onConfirm({ title: 'Supprimer le compte', message: `Supprimer définitivement ${user.email} ? Action irréversible.`, confirmLabel: 'Supprimer', variant: 'danger', onConfirm: async () => { await callEdgeFunction('delete', { user_id: user.id }); await logAction('Suppression compte', user.email); loadUsers(); showToast('Compte supprimé'); } })} />
              </div>
            </div>
          ))}
      </div>

      <AnimatePresence>
        {modal === 'create' && (
          <Modal title="Créer un compte" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <Input label="Nom" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jean Dupont" />
              <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <Input label="Mot de passe temporaire" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              {feedback && <div style={{ fontSize: 13, color: feedback.includes('Erreur') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{feedback}</div>}
              <button onClick={handleCreate} disabled={!form.email || !form.password || sending}
                style={{ padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </Modal>
        )}
        {modal === 'invite' && (
          <Modal title="Inviter par email" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: 0, padding: '12px', background: '#f8fafc', borderRadius: 10 }}>Le client reçoit un lien pour créer son mot de passe.</p>
              <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              {feedback && <div style={{ fontSize: 13, color: feedback.includes('Erreur') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{feedback}</div>}
              <button onClick={handleInvite} disabled={!form.email || sending}
                style={{ padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Envoi...' : "Envoyer l'invitation"}
              </button>
            </div>
          </Modal>
        )}
        {modal === 'credits' && selectedUser && (
          <Modal title={`Crédits — ${selectedUser.email}`} onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <div style={{ padding: '12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', fontSize: 13, color: '#64748b' }}>
                Actuellement : <strong>{selectedUser.credits_document || 0}</strong> simple · <strong>{selectedUser.credits_complete || 0}</strong> complet
              </div>
              <Input label="Crédits Simple (4,90€)" type="number" value={form.credits_doc} onChange={e => setForm(f => ({ ...f, credits_doc: parseInt(e.target.value) || 0 }))} />
              <Input label="Crédits Complet (19,90€+)" type="number" value={form.credits_complete} onChange={e => setForm(f => ({ ...f, credits_complete: parseInt(e.target.value) || 0 }))} />
              <button onClick={handleSetCredits} disabled={sending}
                style={{ padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   ANALYSES TAB
══════════════════════════════════════════ */
function AnalysesTab() {
  const [analyses, setAnalyses] = useState<AdminAnalyse[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('analyses').select('*').order('created_at', { ascending: false }).limit(200);
      setAnalyses(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = analyses.filter(a => {
    const matchFilter = filter === 'all' || a.status === filter;
    const matchSearch = !search || (a.adresse_bien || a.title || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const doExport = () => {
    exportCSV(filtered.map(a => ({ adresse: a.adresse_bien || a.title || '', type: PLAN_LABELS[a.type] || a.type, score: a.score ?? '', statut: a.status, date: fmtDate(a.created_at) })), 'verimo-analyses.csv');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Analyses</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{analyses.length} analyses · {analyses.filter(a => a.status === 'completed').length} complétées</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={doExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Download size={14} /> CSV
          </button>
          {(['all', 'completed', 'processing', 'error'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${filter === f ? '#2a7d9c' : '#edf2f7'}`, background: filter === f ? '#f0f7fb' : '#fff', color: filter === f ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: 'pointer' }}>
              {f === 'all' ? 'Toutes' : f === 'completed' ? 'Complétées' : f === 'processing' ? 'En cours' : 'Erreurs'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par adresse..."
          style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 100px 90px', borderBottom: '1.5px solid #edf2f7', padding: '10px 18px', background: '#f8fafc' }}>
          {['Adresse / Titre', 'Type', 'Score', 'Statut', 'Date'].map(h => <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>{h}</div>)}
        </div>
        {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
          : filtered.map((a, i) => (
            <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 100px 90px', padding: '12px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.adresse_bien || a.title || 'Sans titre'}</div>
              <Badge color="#64748b" bg="#f8fafc">{PLAN_LABELS[a.type] || a.type}</Badge>
              <div>{a.score != null ? <span style={{ fontSize: 13, fontWeight: 900, color: getScoreColor(a.score), background: getScoreBg(a.score), padding: '3px 9px', borderRadius: 8 }}>{a.score}/20</span> : <span style={{ color: '#e2e8f0' }}>—</span>}</div>
              <div>{a.status === 'completed' ? <Badge color="#16a34a" bg="#f0fdf4">✓ Complétée</Badge> : a.status === 'processing' ? <Badge color="#2a7d9c" bg="#f0f7fb">⟳ En cours</Badge> : <Badge color="#dc2626" bg="#fef2f2">✗ Erreur</Badge>}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{fmtDate(a.created_at)}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MESSAGES TAB
══════════════════════════════════════════ */
function MessagesTab({ onConfirm, showToast, onReadChange }: { onConfirm: (a: ConfirmAction) => void; showToast: (m: string) => void; onReadChange: (n: number) => void }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    setMessages(data || []);
    const unread = (data || []).filter(m => !m.read).length;
    onReadChange(unread);
    setLoading(false);
  }, [onReadChange]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const markRead = async (msg: ContactMessage) => {
    await supabase.from('contact_messages').update({ read: true }).eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    setSelected({ ...msg, read: true });
    const unread = messages.filter(m => !m.read && m.id !== msg.id).length;
    onReadChange(unread);
  };

  const markAllRead = async () => {
    await supabase.from('contact_messages').update({ read: true }).eq('read', false);
    setMessages(prev => prev.map(m => ({ ...m, read: true })));
    onReadChange(0);
    showToast('Tous les messages marqués comme lus');
  };

  const filtered = filter === 'unread' ? messages.filter(m => !m.read) : messages;
  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Messages</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{unreadCount} non lu{unreadCount > 1 ? 's' : ''} · {messages.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #d1fae5', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <CheckCircle size={13} /> Tout marquer lu
            </button>
          )}
          {(['unread', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${filter === f ? '#2a7d9c' : '#edf2f7'}`, background: filter === f ? '#f0f7fb' : '#fff', color: filter === f ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: 'pointer' }}>
              {f === 'unread' ? `Non lus (${unreadCount})` : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-messages-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
            : filtered.length === 0 ? (
              <div style={{ padding: '52px 32px', textAlign: 'center' as const, color: '#94a3b8' }}>
                <Mail size={36} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun message {filter === 'unread' ? 'non lu' : ''}</div>
              </div>
            ) : filtered.map((msg, i) => (
              <div key={msg.id} onClick={() => { setSelected(msg); if (!msg.read) markRead(msg); }}
                style={{ padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: selected?.id === msg.id ? '#f0f7fb' : msg.read ? '#fff' : '#fffef0', transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!msg.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f0a500', flexShrink: 0 }} />}
                    <span style={{ fontSize: 13, fontWeight: msg.read ? 600 : 800, color: '#0f172a' }}>{msg.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(msg.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#2a7d9c' }}>{msg.email}</div>
                {msg.subject && <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{msg.subject}</div>}
                <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{msg.message}</div>
              </div>
            ))}
        </div>

        {selected && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{selected.name}</div>
                <a href={`mailto:${selected.email}`} style={{ fontSize: 13, color: '#2a7d9c', textDecoration: 'none', fontWeight: 600 }}>{selected.email}</a>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, cursor: 'pointer', color: '#94a3b8', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>
            {selected.subject && <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14, padding: '9px 12px', background: '#f8fafc', borderRadius: 9 }}>Sujet : {selected.subject}</div>}
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' as const }}>{selected.message}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 20 }}>{fmtDateTime(selected.created_at)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Votre message Verimo'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <Send size={13} /> Répondre
              </a>
              <button onClick={() => onConfirm({ title: 'Supprimer le message', message: `Supprimer le message de ${selected.name} ?`, confirmLabel: 'Supprimer', variant: 'danger', onConfirm: async () => { await supabase.from('contact_messages').delete().eq('id', selected.id); setSelected(null); loadMessages(); showToast('Message supprimé'); } })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Trash2 size={13} /> Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PROMOS TAB
══════════════════════════════════════════ */
function PromosTab({ onConfirm, showToast, logAction }: { onConfirm: (a: ConfirmAction) => void; showToast: (m: string) => void; logAction: (a: string, t?: string) => Promise<void> }) {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [form, setForm] = useState({
    code: generateCode(), type: 'credits' as 'credits' | 'percent' | 'fixed',
    value: 1, credit_type: 'complete', expires_at: '', max_uses: '', restricted_email: '',
  });

  const loadPromos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    setPromos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPromos(); }, [loadPromos]);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
    showToast(`Code ${code} copié !`);
  };

  const handleCreate = async () => {
    const payload: Record<string, unknown> = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.value,
      credit_type: form.type === 'credits' ? form.credit_type : null,
      expires_at: form.expires_at || null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      restricted_email: form.restricted_email || null,
    };
    const { error } = await supabase.from('promo_codes').insert(payload);
    if (error) { showToast('Erreur : ' + error.message); return; }
    await logAction('Code promo créé', form.code);
    setModal(false);
    setForm(f => ({ ...f, code: generateCode() }));
    loadPromos();
    showToast(`Code ${form.code} créé !`);
  };

  const toggleActive = async (promo: PromoCode) => {
    await supabase.from('promo_codes').update({ active: !promo.active }).eq('id', promo.id);
    await logAction(`Code ${promo.active ? 'désactivé' : 'activé'}`, promo.code);
    loadPromos();
    showToast(`Code ${promo.code} ${promo.active ? 'désactivé' : 'activé'}`);
  };

  const typeLabel = (type: string, value: number, creditType?: string) => {
    if (type === 'credits') return `${value} crédit${value > 1 ? 's' : ''} ${creditType === 'complete' ? 'complet' : creditType === 'document' ? 'simple' : 'mixte'}`;
    if (type === 'percent') return `-${value}%`;
    return `-${value}€`;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Codes promo</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{promos.length} code{promos.length > 1 ? 's' : ''} créé{promos.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setForm(f => ({ ...f, code: generateCode() })); setModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={15} /> Créer un code
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px 100px 100px 90px 80px', borderBottom: '1.5px solid #edf2f7', padding: '10px 18px', background: '#f8fafc' }}>
          {['Code', 'Avantage', 'Utilisations', 'Expiration', 'Email limité', 'Statut', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>{h}</div>
          ))}
        </div>
        {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
          : promos.length === 0 ? (
            <div style={{ padding: '52px', textAlign: 'center' as const, color: '#94a3b8' }}>
              <Tag size={36} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun code promo créé</div>
            </div>
          ) : promos.map((promo, i) => (
            <div key={promo.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px 100px 100px 90px 80px', padding: '13px 18px', borderBottom: i < promos.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center', opacity: promo.active ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{promo.code}</span>
                <button onClick={() => copyCode(promo.code, promo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === promo.id ? '#16a34a' : '#94a3b8', padding: 2 }}>
                  {copiedId === promo.id ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c' }}>{typeLabel(promo.type, promo.value, promo.credit_type)}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{promo.uses_count}{promo.max_uses ? `/${promo.max_uses}` : ''}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{promo.expires_at ? fmtDate(promo.expires_at) : '—'}</div>
              <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{promo.restricted_email || '—'}</div>
              <div>{promo.active ? <Badge color="#16a34a" bg="#f0fdf4">Actif</Badge> : <Badge color="#94a3b8" bg="#f8fafc">Inactif</Badge>}</div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => toggleActive(promo)} title={promo.active ? 'Désactiver' : 'Activer'}
                  style={{ padding: '5px 8px', borderRadius: 7, background: promo.active ? '#fffbeb' : '#f0fdf4', border: `1px solid ${promo.active ? '#fde68a' : '#d1fae5'}`, cursor: 'pointer' }}>
                  {promo.active ? <EyeOff size={12} color="#f0a500" /> : <Eye size={12} color="#16a34a" />}
                </button>
                <button onClick={() => onConfirm({ title: 'Supprimer le code', message: `Supprimer le code ${promo.code} définitivement ?`, confirmLabel: 'Supprimer', variant: 'danger', onConfirm: async () => { await supabase.from('promo_codes').delete().eq('id', promo.id); await logAction('Code supprimé', promo.code); loadPromos(); showToast('Code supprimé'); } })}
                  style={{ padding: '5px 8px', borderRadius: 7, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer' }}>
                  <Trash2 size={12} color="#dc2626" />
                </button>
              </div>
            </div>
          ))}
      </div>

      <AnimatePresence>
        {modal && (
          <Modal title="Créer un code promo" onClose={() => setModal(false)} width={560}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

              {/* Code */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Code promo</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 15, fontWeight: 800, letterSpacing: '0.1em', fontFamily: 'monospace', outline: 'none', background: '#f8fafc', color: '#0f172a' }} />
                  <button onClick={() => setForm(f => ({ ...f, code: generateCode() }))}
                    style={{ padding: '10px 14px', borderRadius: 10, background: '#f4f7f9', border: '1.5px solid #edf2f7', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    ↻ Générer
                  </button>
                </div>
              </div>

              {/* Type d'avantage */}
              <Select label="Type d'avantage" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'credits' | 'percent' | 'fixed' }))}>
                <option value="credits">Crédits gratuits</option>
                <option value="percent">Réduction en %</option>
                <option value="fixed">Réduction en €</option>
              </Select>

              {/* Valeur */}
              {form.type === 'credits' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Nombre de crédits" type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: parseInt(e.target.value) || 1 }))} min={1} />
                  <Select label="Type de crédit" value={form.credit_type} onChange={e => setForm(f => ({ ...f, credit_type: e.target.value }))}>
                    <option value="complete">Analyse Complète</option>
                    <option value="document">Analyse Simple</option>
                    <option value="both">Les deux</option>
                  </Select>
                </div>
              ) : (
                <Input label={form.type === 'percent' ? 'Réduction (%)' : 'Réduction (€)'} type="number" value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))} min={0} />
              )}

              {/* Restrictions */}
              <div style={{ padding: '14px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Restrictions (optionnel)</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  <Input label="Date d'expiration" type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                  <Input label="Nombre d'utilisations max" type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Illimité si vide" />
                  <Input label="Limiter à un email spécifique" type="email" value={form.restricted_email} onChange={e => setForm(f => ({ ...f, restricted_email: e.target.value }))} placeholder="Laisser vide pour tout le monde" />
                </div>
              </div>

              {/* Récapitulatif */}
              <div style={{ padding: '12px 16px', borderRadius: 11, background: '#f0f7fb', border: '1px solid #bae3f5', fontSize: 13, color: '#1a5e78', fontWeight: 600 }}>
                Code <strong style={{ fontFamily: 'monospace' }}>{form.code}</strong> → {typeLabel(form.type, form.value, form.credit_type)}
                {form.expires_at && ` · expire le ${fmtDate(form.expires_at)}`}
                {form.max_uses && ` · max ${form.max_uses} utilisations`}
                {form.restricted_email && ` · limité à ${form.restricted_email}`}
              </div>

              <button onClick={handleCreate}
                style={{ padding: '13px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Créer le code promo
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   LOGS TAB
══════════════════════════════════════════ */
function LogsTab() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100);
      setLogs(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const actionIcon = (action: string) => {
    if (action.includes('Suppression') || action.includes('supprimé')) return { bg: '#fef2f2', color: '#dc2626', icon: <Trash2 size={12} /> };
    if (action.includes('Suspension')) return { bg: '#fffbeb', color: '#f0a500', icon: <EyeOff size={12} /> };
    if (action.includes('Réactivation')) return { bg: '#f0fdf4', color: '#16a34a', icon: <Eye size={12} /> };
    if (action.includes('Crédit')) return { bg: '#f0f7fb', color: '#2a7d9c', icon: <CreditCard size={12} /> };
    if (action.includes('Code')) return { bg: '#f5f3ff', color: '#7c3aed', icon: <Tag size={12} /> };
    return { bg: '#f8fafc', color: '#64748b', icon: <Bell size={12} /> };
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Historique des actions</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>100 dernières actions administrateur</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
          : logs.length === 0 ? (
            <div style={{ padding: '52px', textAlign: 'center' as const, color: '#94a3b8' }}>
              <Bell size={36} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune action enregistrée</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Les actions apparaîtront ici dès que vous agirez sur des comptes ou des codes.</div>
            </div>
          ) : logs.map((log, i) => {
            const { bg, color, icon } = actionIcon(log.action);
            return (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: i < logs.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{log.action}</div>
                  {log.target && <div style={{ fontSize: 12, color: '#64748b' }}>{log.target}</div>}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' as const }}>{fmtDateTime(log.created_at)}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

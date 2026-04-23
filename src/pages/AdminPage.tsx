import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, Users, FileText, Mail, BarChart2,
  Search, X, Check, AlertTriangle, Shield, CreditCard,
  Trash2, RefreshCw, Eye, EyeOff, ArrowRight,
  LogOut, Send, UserPlus, CheckCircle, Download, Tag,
  Bell, ChevronLeft, Plus, Copy, Briefcase, Euro, ExternalLink,
  Clock, User,
} from 'lucide-react';

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type AdminUser = {
  id: string; email: string; created_at: string;
  full_name?: string; role: string; suspended?: boolean;
  credits_document?: number; credits_complete?: number;
  email_verified?: boolean; provider?: string;
  last_sign_in_at?: string;
};
type AdminAnalyse = {
  id: string; user_id: string; type: string; status: string;
  adresse_bien?: string; address?: string; title?: string; score?: number; created_at: string;
  document_urls?: string[]; paid?: boolean; stripe_payment_id?: string;
  completed_at?: string;
};
type AdminPayment = {
  id: string; user_id: string; amount: number; currency: string;
  description?: string; stripe_session_id?: string; stripe_payment_id?: string;
  promo_code?: string; credits_added?: number; credit_type?: string;
  status: string; created_at: string; retractation_waiver_at?: string;
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
const fmtRelative = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'à l\'instant';
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`;
  const days = Math.floor(sec / 86400);
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? 's' : ''}`;
};
const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
const stripeUrl = (id?: string) => {
  if (!id) return null;
  // Les payment_intent commencent par pi_, les sessions par cs_
  if (id.startsWith('cs_')) return `https://dashboard.stripe.com/payments?query=${id}`;
  return `https://dashboard.stripe.com/payments/${id}`;
};
const getScoreColor = (s: number) => s >= 14 ? '#16a34a' : s >= 10 ? '#d97706' : '#dc2626';
const getScoreBg = (s: number) => s >= 14 ? '#f0fdf4' : s >= 10 ? '#fffbeb' : '#fef2f2';
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
type TabId = 'dashboard' | 'users' | 'analyses' | 'payments' | 'messages' | 'demandes_pro' | 'stats' | 'promos' | 'logs' | 'banner';

export default function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [toast, setToast] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [proUnreadCount, setProUnreadCount] = useState(0);
  // Routing inter-onglets : permet d'ouvrir la fiche d'un user depuis une analyse, etc.
  const [focusUserId, setFocusUserId] = useState<string | null>(null);
  const [focusAnalysisId, setFocusAnalysisId] = useState<string | null>(null);
  // Recherche globale
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

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
      // Unread pro demands count
      const { count: proCount } = await supabase.from('contact_pro').select('*', { count: 'exact', head: true }).eq('read', false);
      setProUnreadCount(proCount || 0);
    };
    check();
  }, [navigate]);

  // Créer table admin_logs si elle n'existe pas (silencieux)
  useEffect(() => {
    if (!isAdmin) return;
    const init = async () => { try { await supabase.rpc('create_admin_logs_if_not_exists'); } catch { /* silencieux */ } };
    init();
  }, [isAdmin]);

  // Raccourci clavier Cmd+K / Ctrl+K pour ouvrir la recherche globale
  useEffect(() => {
    if (!isAdmin) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
        setGlobalSearch('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAdmin, globalSearchOpen]);

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
    { id: 'payments', label: 'Paiements', icon: Euro },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadCount },
    { id: 'demandes_pro', label: 'Demandes Pro', icon: Briefcase, badge: proUnreadCount },
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
      <div style={{ background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(15,45,61,0.3)', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(42,125,156,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={17} color="#7dd3f0" />
          </div>
          <div className="admin-topbar-title">
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>VERIMO ADMIN</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{adminEmail}</div>
          </div>
        </div>

        {/* Recherche globale — desktop */}
        <button
          className="admin-global-search"
          onClick={() => setGlobalSearchOpen(true)}
          style={{ flex: 1, maxWidth: 440, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}>
          <Search size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Rechercher un client, une analyse, un paiement…</span>
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>⌘K</span>
        </button>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
              {activeTab === 'users' && <UsersTab onConfirm={setConfirm} showToast={showToast} logAction={logAction} focusUserId={focusUserId} onFocusUserHandled={() => setFocusUserId(null)} />}
              {activeTab === 'analyses' && <AnalysesTab onOpenUser={(id) => { setFocusUserId(id); setActiveTab('users'); }} focusAnalysisId={focusAnalysisId} onFocusAnalysisHandled={() => setFocusAnalysisId(null)} />}
              {activeTab === 'payments' && <PaymentsTab onOpenUser={(id) => { setFocusUserId(id); setActiveTab('users'); }} showToast={showToast} />}
              {activeTab === 'messages' && <MessagesTab onConfirm={setConfirm} showToast={showToast} onReadChange={setUnreadCount} />}
              {activeTab === 'demandes_pro' && <DemandesProTab onConfirm={setConfirm} showToast={showToast} onReadChange={setProUnreadCount} />}
              {activeTab === 'promos' && <PromosTab onConfirm={setConfirm} showToast={showToast} logAction={logAction} />}
              {activeTab === 'banner' && <BannerTab showToast={showToast} logAction={logAction} />}
              {activeTab === 'logs' && <LogsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Search Modal */}
      <AnimatePresence>
        {globalSearchOpen && (
          <GlobalSearchModal
            query={globalSearch}
            setQuery={setGlobalSearch}
            onClose={() => { setGlobalSearchOpen(false); setGlobalSearch(''); }}
            onNavigate={(tab, resourceId, resourceType) => {
              if (resourceType === 'analysis' && resourceId) {
                setFocusAnalysisId(resourceId);
              } else if (resourceId) {
                setFocusUserId(resourceId);
              }
              setActiveTab(tab);
              setGlobalSearchOpen(false);
              setGlobalSearch('');
            }}
          />
        )}
      </AnimatePresence>
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
  const [data, setData] = useState({
    caMonth: 0,
    caMonthPrev: 0,
    newClientsMonth: 0,
    analysesThisMonth: 0,
    analysesByType: { document: 0, complete: 0, pack2: 0, pack3: 0 },
    caByCategory: { document: { count: 0, total: 0 }, complete: { count: 0, total: 0 }, pack2: { count: 0, total: 0 }, pack3: { count: 0, total: 0 } },
    ticketMoyen: 0,
    messagesUnread: 0,
    proUnread: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      const [
        { data: paymentsMonth },
        { data: paymentsPrevMonth },
        { count: newClients },
        { data: analysesMonth },
        { count: msgUnread },
        { count: proUnreadCount },
      ] = await Promise.all([
        supabase.from('payments').select('amount,description').eq('status', 'completed').gt('amount', 0).gte('created_at', startOfMonth),
        supabase.from('payments').select('amount').eq('status', 'completed').gt('amount', 0).gte('created_at', startOfPrevMonth).lte('created_at', endOfPrevMonth),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        supabase.from('analyses').select('type').gte('created_at', startOfMonth),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('read', false),
        supabase.from('contact_pro').select('*', { count: 'exact', head: true }).eq('read', false),
      ]);

      const monthPayments = paymentsMonth || [];
      const caMonth = monthPayments.reduce((s, p) => s + (p.amount || 0), 0);
      const caMonthPrev = (paymentsPrevMonth || []).reduce((s, p) => s + (p.amount || 0), 0);
      const ticketMoyen = monthPayments.length > 0 ? caMonth / monthPayments.length : 0;

      // CA par catégorie basé sur la description des paiements
      const caByCategory = { document: { count: 0, total: 0 }, complete: { count: 0, total: 0 }, pack2: { count: 0, total: 0 }, pack3: { count: 0, total: 0 } };
      monthPayments.forEach(p => {
        const desc = (p.description || '').toLowerCase();
        const amt = p.amount || 0;
        if (desc.includes('pack 3')) { caByCategory.pack3.count++; caByCategory.pack3.total += amt; }
        else if (desc.includes('pack 2')) { caByCategory.pack2.count++; caByCategory.pack2.total += amt; }
        else if (desc.includes('complète')) { caByCategory.complete.count++; caByCategory.complete.total += amt; }
        else if (desc.includes('document') || desc.includes('simple')) { caByCategory.document.count++; caByCategory.document.total += amt; }
      });

      const analysesByType = { document: 0, complete: 0, pack2: 0, pack3: 0 };
      (analysesMonth || []).forEach(a => {
        if (a.type in analysesByType) analysesByType[a.type as keyof typeof analysesByType]++;
      });

      setData({
        caMonth,
        caMonthPrev,
        newClientsMonth: newClients || 0,
        analysesThisMonth: (analysesMonth || []).length,
        analysesByType,
        caByCategory,
        ticketMoyen,
        messagesUnread: msgUnread || 0,
        proUnread: proUnreadCount || 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const diff = data.caMonth - data.caMonthPrev;
  const diffLabel = data.caMonthPrev === 0 && data.caMonth > 0
    ? `Premier mois de CA · +${data.caMonth.toFixed(2).replace('.', ',')}€ vs mois dernier (0€)`
    : data.caMonthPrev === 0
      ? 'Pas de CA ce mois ni le mois dernier'
      : diff >= 0
        ? `↑ +${diff.toFixed(2).replace('.', ',')}€ vs mois dernier (${data.caMonthPrev.toFixed(2).replace('.', ',')}€)`
        : `↓ ${diff.toFixed(2).replace('.', ',')}€ vs mois dernier (${data.caMonthPrev.toFixed(2).replace('.', ',')}€)`;

  const currentMonthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const toTraiter = data.messagesUnread + data.proUnread;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Vue d'ensemble</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Activité de ce mois-ci ({currentMonthLabel})</p>
      </div>

      {/* BLOC HERO — CA du mois */}
      <div style={{ background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', borderRadius: 18, padding: '28px 30px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
              CA de {currentMonthLabel}
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{data.caMonth.toFixed(2).replace('.', ',')}€</div>
            <div style={{ fontSize: 13, color: diff >= 0 ? '#7dd3f0' : '#fca5a5', marginTop: 10, fontWeight: 600 }}>
              {diffLabel}
            </div>
          </div>
          <button onClick={() => onNavigate('stats')}
            style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            Voir les statistiques <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* BLOC "CE MOIS-CI" — 3 cartes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginBottom: 16 }}>
        {/* Nouveaux clients */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Nouveaux clients</div>
            <UserPlus size={16} style={{ color: '#2a7d9c' }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{data.newClientsMonth}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Inscrits ce mois</div>
        </div>

        {/* Analyses avec détail par type */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', padding: '20px 22px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Analyses lancées par les utilisateurs</div>
            <FileText size={16} style={{ color: '#7c3aed' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{data.analysesThisMonth}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>ce mois (payantes + gratuites)</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { label: 'Simple', value: data.analysesByType.document, color: '#64748b' },
              { label: 'Complète', value: data.analysesByType.complete, color: '#2a7d9c' },
            ].map((t, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>{t.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: t.value > 0 ? t.color : '#cbd5e1' }}>{t.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket moyen */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Ticket moyen</div>
            <CreditCard size={16} style={{ color: '#f0a500' }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{data.ticketMoyen.toFixed(2).replace('.', ',')}€</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Par paiement ce mois</div>
        </div>
      </div>

      {/* BLOC CA PAR CATÉGORIE */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>💰 CA par catégorie ce mois</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Détail des ventes Stripe par produit</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 14 }}>
          {[
            { key: 'document' as const, label: 'Analyse Simple', color: '#64748b', bg: '#f8fafc' },
            { key: 'complete' as const, label: 'Analyse Complète', color: '#2a7d9c', bg: '#f0f7fb' },
            { key: 'pack2' as const, label: 'Pack 2 Biens', color: '#7c3aed', bg: '#f5f3ff' },
            { key: 'pack3' as const, label: 'Pack 3 Biens', color: '#f0a500', bg: '#fffbeb' },
          ].map(t => {
            const d = data.caByCategory[t.key];
            return (
              <div key={t.key} style={{ padding: '14px 16px', borderRadius: 10, background: d.count > 0 ? t.bg : '#fafbfc', border: `1px solid ${d.count > 0 ? t.color + '30' : '#edf2f7'}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: d.count > 0 ? t.color : '#cbd5e1', lineHeight: 1 }}>{d.total.toFixed(2).replace('.', ',')}€</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{d.count} vente{d.count > 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOC "À LIRE" */}
      <div style={{ background: toTraiter > 0 ? '#fffbeb' : '#fff', borderRadius: 14, border: toTraiter > 0 ? '1.5px solid #fde68a' : '1.5px solid #edf2f7', padding: '18px 22px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: toTraiter > 0 ? '#fef3c7' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={18} style={{ color: toTraiter > 0 ? '#d97706' : '#16a34a' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: toTraiter > 0 ? '#78350f' : '#0f172a' }}>
              {toTraiter > 0 ? `${toTraiter} élément${toTraiter > 1 ? 's' : ''} à lire` : 'Tout est à jour ✓'}
            </div>
            <div style={{ fontSize: 12, color: toTraiter > 0 ? '#92400e' : '#94a3b8', marginTop: 2 }}>
              {data.messagesUnread} message{data.messagesUnread > 1 ? 's' : ''} non lu{data.messagesUnread > 1 ? 's' : ''} · {data.proUnread} demande{data.proUnread > 1 ? 's' : ''} pro non lue{data.proUnread > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {toTraiter > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {data.messagesUnread > 0 && (
              <button onClick={() => onNavigate('messages')}
                style={{ padding: '8px 14px', borderRadius: 9, background: '#fff', border: '1px solid #fde68a', color: '#d97706', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Mail size={12} /> Messages
              </button>
            )}
            {data.proUnread > 0 && (
              <button onClick={() => onNavigate('demandes_pro')}
                style={{ padding: '8px 14px', borderRadius: 9, background: '#fff', border: '1px solid #fde68a', color: '#d97706', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Briefcase size={12} /> Pro
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Actions rapides</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {([
            { label: 'Gérer les utilisateurs', icon: Users, color: '#2a7d9c', tab: 'users' },
            { label: 'Journal des paiements', icon: Euro, color: '#16a34a', tab: 'payments' },
            { label: 'Voir les analyses', icon: FileText, color: '#7c3aed', tab: 'analyses' },
            { label: 'Statistiques', icon: BarChart2, color: '#2a7d9c', tab: 'stats' },
            { label: 'Codes promo', icon: Tag, color: '#16a34a', tab: 'promos' },
            { label: 'Bannière', icon: Bell, color: '#0f2d3d', tab: 'banner' },
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

      {loading && <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 12, marginTop: 16 }}>Chargement...</div>}
    </div>
  );
}

/* ══════════════════════════════════════════
   STATS TAB
══════════════════════════════════════════ */
type StatsPeriod = '7j' | '30j' | '3m' | '12m' | 'all' | 'custom';

function StatsTab() {
  const [period, setPeriod] = useState<StatsPeriod>('30j');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [stats, setStats] = useState({
    ca: 0,
    ticketMoyen: 0,
    paymentsCount: 0,
    newUsers: 0,
    analysesTotal: 0,
    analysesByType: { document: 0, complete: 0, pack2: 0, pack3: 0 },
    freeAnalysesByType: { document: 0, complete: 0, pack2: 0, pack3: 0 },
    creditsOffered: { document: 0, complete: 0 },
  });
  const [weeklyData, setWeeklyData] = useState<{ week: string; ca: number; users: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const getRange = useCallback(() => {
    const now = new Date();
    const end = now.toISOString();
    if (period === 'all') return { start: '2020-01-01T00:00:00Z', end };
    const start = new Date(now);
    if (period === '7j') start.setDate(now.getDate() - 7);
    else if (period === '30j') start.setDate(now.getDate() - 30);
    else if (period === '3m') start.setMonth(now.getMonth() - 3);
    else if (period === '12m') start.setFullYear(now.getFullYear() - 1);
    else return { start: customStart, end: customEnd + 'T23:59:59' };
    return { start: start.toISOString(), end };
  }, [period, customStart, customEnd]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { start, end } = getRange();
      if (!start || !end) { setLoading(false); return; }

      const [
        { data: paymentsData },
        { count: newUsers },
        { data: analyses },
        { data: freePaymentsData },
      ] = await Promise.all([
        supabase.from('payments').select('amount').eq('status', 'completed').gt('amount', 0).gte('created_at', start).lte('created_at', end),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
        supabase.from('analyses').select('type,paid,stripe_payment_id,created_at').gte('created_at', start).lte('created_at', end),
        supabase.from('payments').select('credits_added,credit_type').eq('status', 'completed').eq('amount', 0).gte('created_at', start).lte('created_at', end),
      ]);

      const payments = paymentsData || [];
      const ca = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const paymentsCount = payments.length;
      const ticketMoyen = paymentsCount > 0 ? ca / paymentsCount : 0;

      // Analyses par type
      const analysesByType = { document: 0, complete: 0, pack2: 0, pack3: 0 };
      const freeAnalysesByType = { document: 0, complete: 0, pack2: 0, pack3: 0 };
      (analyses || []).forEach(a => {
        if (a.type in analysesByType) {
          analysesByType[a.type as keyof typeof analysesByType]++;
          // Analyse gratuite = pas liée à un paiement Stripe réel
          if (!a.stripe_payment_id) {
            freeAnalysesByType[a.type as keyof typeof freeAnalysesByType]++;
          }
        }
      });

      // Crédits offerts
      const creditsOffered = { document: 0, complete: 0 };
      (freePaymentsData || []).forEach(p => {
        if (p.credit_type === 'document') creditsOffered.document += (p.credits_added || 0);
        else if (p.credit_type === 'complete') creditsOffered.complete += (p.credits_added || 0);
      });

      setStats({
        ca,
        ticketMoyen,
        paymentsCount,
        newUsers: newUsers || 0,
        analysesTotal: (analyses || []).length,
        analysesByType,
        freeAnalysesByType,
        creditsOffered,
      });

      // Graphiques 8 dernières semaines (toujours)
      const weeks: { week: string; ca: number; users: number }[] = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - 6);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (i * 7));
        weekEnd.setHours(23, 59, 59, 999);

        const [{ data: wPayments }, { count: wUsers }] = await Promise.all([
          supabase.from('payments').select('amount').eq('status', 'completed').gt('amount', 0).gte('created_at', weekStart.toISOString()).lte('created_at', weekEnd.toISOString()),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()).lte('created_at', weekEnd.toISOString()),
        ]);
        const wCa = (wPayments || []).reduce((s, p) => s + (p.amount || 0), 0);
        const label = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
        weeks.push({ week: label, ca: wCa, users: wUsers || 0 });
      }
      setWeeklyData(weeks);
      setLoading(false);
    };
    load();
  }, [getRange]);

  const maxCa = Math.max(...weeklyData.map(w => w.ca), 1);
  const maxU = Math.max(...weeklyData.map(w => w.users), 1);
  const periods: { id: StatsPeriod; label: string }[] = [
    { id: '7j', label: '7 jours' },
    { id: '30j', label: '30 jours' },
    { id: '3m', label: '3 mois' },
    { id: '12m', label: '12 mois' },
    { id: 'all', label: 'Depuis le début' },
    { id: 'custom', label: 'Personnalisé' },
  ];

  const periodLabel = period === 'all' ? 'depuis le début' :
    period === '7j' ? 'sur les 7 derniers jours' :
    period === '30j' ? 'sur les 30 derniers jours' :
    period === '3m' ? 'sur les 3 derniers mois' :
    period === '12m' ? 'sur les 12 derniers mois' :
    'sur la période personnalisée';

  const typesMeta = [
    { key: 'document' as const, label: 'Simple', color: '#64748b' },
    { key: 'complete' as const, label: 'Complète', color: '#2a7d9c' },
  ];

  // CA par catégorie : re-calcul depuis les infos en base
  const [caByCategory, setCaByCategory] = useState({
    document: { count: 0, total: 0 },
    complete: { count: 0, total: 0 },
    pack2: { count: 0, total: 0 },
    pack3: { count: 0, total: 0 },
  });

  useEffect(() => {
    const loadCa = async () => {
      const { start, end } = getRange();
      if (!start || !end) return;
      const { data: payments } = await supabase
        .from('payments')
        .select('amount,description')
        .eq('status', 'completed')
        .gt('amount', 0)
        .gte('created_at', start)
        .lte('created_at', end);

      const cat = { document: { count: 0, total: 0 }, complete: { count: 0, total: 0 }, pack2: { count: 0, total: 0 }, pack3: { count: 0, total: 0 } };
      (payments || []).forEach(p => {
        const desc = (p.description || '').toLowerCase();
        const amt = p.amount || 0;
        if (desc.includes('pack 3')) { cat.pack3.count++; cat.pack3.total += amt; }
        else if (desc.includes('pack 2')) { cat.pack2.count++; cat.pack2.total += amt; }
        else if (desc.includes('complète')) { cat.complete.count++; cat.complete.total += amt; }
        else if (desc.includes('document') || desc.includes('simple')) { cat.document.count++; cat.document.total += amt; }
      });
      setCaByCategory(cat);
    };
    loadCa();
  }, [getRange]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Statistiques</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Analyse de l'activité {periodLabel}</p>
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

      {/* BLOC 1 — CA et argent */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>💰 Chiffre d'affaires {periodLabel}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div style={{ padding: '16px', borderRadius: 12, background: 'linear-gradient(135deg,#16a34a,#14532d)', color: '#fff' }}>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, letterSpacing: '0.1em', marginBottom: 4 }}>CA ENCAISSÉ</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{stats.ca.toFixed(2).replace('.', ',')}€</div>
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>{stats.paymentsCount} paiement{stats.paymentsCount > 1 ? 's' : ''} Stripe</div>
          </div>
          <div style={{ padding: '16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 4 }}>TICKET MOYEN</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{stats.ticketMoyen.toFixed(2).replace('.', ',')}€</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Par paiement payant</div>
          </div>
        </div>
      </div>

      {/* BLOC 2 — Clients et analyses */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>👥 Nouveaux clients et analyses lancées {periodLabel}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {/* Nouveaux clients */}
          <div style={{ padding: '16px', borderRadius: 12, background: '#f0f7fb', border: '1px solid #bae3f5' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.1em', marginBottom: 4 }}>NOUVEAUX CLIENTS</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0f2d3d' }}>{stats.newUsers}</div>
            <div style={{ fontSize: 11, color: '#2a7d9c', marginTop: 4 }}>Inscrits {periodLabel}</div>
          </div>
          {/* Analyses totales */}
          <div style={{ padding: '16px', borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe', gridColumn: 'span 2' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.1em', marginBottom: 4 }}>ANALYSES LANCÉES PAR LES UTILISATEURS</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0f2d3d' }}>{stats.analysesTotal}</div>
              <div style={{ fontSize: 11, color: '#7c3aed' }}>Payantes et gratuites confondues</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {typesMeta.map(t => {
                const total = stats.analysesByType[t.key];
                const free = stats.freeAnalysesByType[t.key];
                return (
                  <div key={t.key} style={{ padding: '10px 14px', borderRadius: 8, background: '#fff' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>{t.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: total > 0 ? t.color : '#cbd5e1' }}>{total}</div>
                    {free > 0 && <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 2 }}>dont {free} gratuit{free > 1 ? 's' : ''}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BLOC CA PAR CATÉGORIE */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>💰 CA par catégorie {periodLabel}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Détail des ventes Stripe par produit</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { key: 'document' as const, label: 'Analyse Simple', color: '#64748b', bg: '#f8fafc' },
            { key: 'complete' as const, label: 'Analyse Complète', color: '#2a7d9c', bg: '#f0f7fb' },
            { key: 'pack2' as const, label: 'Pack 2 Biens', color: '#7c3aed', bg: '#f5f3ff' },
            { key: 'pack3' as const, label: 'Pack 3 Biens', color: '#f0a500', bg: '#fffbeb' },
          ].map(t => {
            const d = caByCategory[t.key];
            return (
              <div key={t.key} style={{ padding: '14px 16px', borderRadius: 10, background: d.count > 0 ? t.bg : '#fafbfc', border: `1px solid ${d.count > 0 ? t.color + '30' : '#edf2f7'}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: d.count > 0 ? t.color : '#cbd5e1', lineHeight: 1 }}>{d.total.toFixed(2).replace('.', ',')}€</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{d.count} vente{d.count > 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOC 3 — Crédits offerts */}
      {(stats.creditsOffered.document > 0 || stats.creditsOffered.complete > 0) && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>🎁 Crédits offerts {periodLabel}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Distribués via codes promo (acquisition)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>ANALYSE SIMPLE</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#64748b', marginTop: 4 }}>{stats.creditsOffered.document}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>crédit{stats.creditsOffered.document > 1 ? 's' : ''} offert{stats.creditsOffered.document > 1 ? 's' : ''}</div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>ANALYSE COMPLÈTE</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#2a7d9c', marginTop: 4 }}>{stats.creditsOffered.complete}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>crédit{stats.creditsOffered.complete > 1 ? 's' : ''} offert{stats.creditsOffered.complete > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* Graphique CA 8 dernières semaines */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>📈 CA par semaine</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Évolution des paiements Stripe sur les 8 dernières semaines</div>
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

      {/* Graphique inscriptions 8 dernières semaines */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>👤 Inscriptions par semaine</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Nouveaux comptes créés sur les 8 dernières semaines</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {weeklyData.map((w, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed' }}>{w.users > 0 ? w.users : ''}</div>
              <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((w.users / maxU) * 80, w.users > 0 ? 4 : 0)}px` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '100%', background: w.users > 0 ? 'linear-gradient(to top,#7c3aed,#c4b5fd)' : '#f1f5f9', borderRadius: '6px 6px 0 0', minHeight: 4 }} />
              <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' as const }}>{w.week}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>
            Total : {weeklyData.reduce((s, w) => s + w.users, 0)} inscrits sur 8 semaines
          </span>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 12, marginTop: 16 }}>Chargement...</div>}
    </div>
  );
}
/* ══════════════════════════════════════════
   USERS TAB
══════════════════════════════════════════ */
function UsersTab({ onConfirm, showToast, logAction, focusUserId, onFocusUserHandled }: {
  onConfirm: (a: ConfirmAction) => void;
  showToast: (m: string) => void;
  logAction: (a: string, t?: string) => Promise<void>;
  focusUserId?: string | null;
  onFocusUserHandled?: () => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'invite' | 'credits' | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userAnalyses, setUserAnalyses] = useState<AdminAnalyse[]>([]);
  const [userPayments, setUserPayments] = useState<AdminPayment[]>([]);
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

  const openDetail = useCallback(async (user: AdminUser) => {
    setDetailUser(user);
    const [{ data: analyses }, { data: payments }] = await Promise.all([
      supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setUserAnalyses(analyses || []);
    setUserPayments(payments || []);
  }, []);

  // Si focusUserId est passé (venant d'une analyse ou d'un paiement), ouvrir direct la fiche
  useEffect(() => {
    if (!focusUserId || users.length === 0) return;
    const user = users.find(u => u.id === focusUserId);
    if (user) {
      openDetail(user);
      onFocusUserHandled?.();
    }
  }, [focusUserId, users, openDetail, onFocusUserHandled]);

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
    const totalSpent = userPayments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
    const totalPaidPayments = userPayments.filter(p => p.status === 'completed' && p.amount > 0).length;

    return (
      <div>
        <button onClick={() => { setDetailUser(null); setUserPayments([]); setUserAnalyses([]); }} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2a7d9c' }}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <div className="admin-detail-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          {/* Colonne gauche : profil client */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', height: 'fit-content' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 auto 16px' }}>
              {(detailUser.full_name || detailUser.email).charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'center' as const, marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{detailUser.full_name || '—'}</div>
              <button onClick={() => { navigator.clipboard.writeText(detailUser.email); showToast('Email copié'); }}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#2a7d9c', cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationColor: '#bae3f5' }}>
                {detailUser.email}
              </button>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                Inscrit le {fmtDateTime(detailUser.created_at)}
              </div>
              {detailUser.last_sign_in_at && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Clock size={10} /> Dernière connexion : {fmtRelative(detailUser.last_sign_in_at)}
                </div>
              )}
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
              {[
                { l: 'Crédits Simple', v: detailUser.credits_document || 0, c: '#2a7d9c' },
                { l: 'Crédits Complet', v: detailUser.credits_complete || 0, c: '#7c3aed' },
                { l: 'Analyses', v: userAnalyses.length, c: '#16a34a' },
                { l: 'Total dépensé', v: `${totalSpent.toFixed(2)}€`, c: '#f0a500' },
              ].map((s, i) => (
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
              <button onClick={() => onConfirm({ title: detailUser.suspended ? 'Réactiver' : 'Suspendre', message: `${detailUser.suspended ? 'Réactiver' : 'Suspendre'} le compte de ${detailUser.email} ?`, confirmLabel: detailUser.suspended ? 'Réactiver' : 'Suspendre', variant: detailUser.suspended ? 'info' : 'warning', onConfirm: async () => { await supabase.from('profiles').update({ suspended: !detailUser.suspended }).eq('id', detailUser.id); await logAction(detailUser.suspended ? 'Réactivation' : 'Suspension', detailUser.email); await loadUsers(); setDetailUser(u => u ? { ...u, suspended: !u.suspended } : u); showToast(`Compte ${detailUser.suspended ? 'réactivé' : 'suspendu'}`); } })}
                style={{ padding: '10px', borderRadius: 10, background: detailUser.suspended ? '#f0fdf4' : '#fffbeb', border: `1.5px solid ${detailUser.suspended ? '#86efac' : '#fde68a'}`, color: detailUser.suspended ? '#16a34a' : '#d97706', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {detailUser.suspended ? <><Eye size={14} /> Réactiver</> : <><EyeOff size={14} /> Suspendre</>}
              </button>
              <button onClick={() => onConfirm({ title: 'Supprimer le compte', message: `Supprimer définitivement ${detailUser.email} ? Action irréversible. Toutes les analyses seront également perdues.`, confirmLabel: 'Supprimer définitivement', variant: 'danger', onConfirm: async () => { await callEdgeFunction('delete', { user_id: detailUser.id }); await logAction('Suppression compte', detailUser.email); await loadUsers(); setDetailUser(null); setUserPayments([]); setUserAnalyses([]); showToast('Compte supprimé'); } })}
                style={{ padding: '10px', borderRadius: 10, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Trash2 size={14} /> Supprimer le compte
              </button>
            </div>
          </div>

          {/* Colonne droite : sections historiques */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            {/* Historique des paiements */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Euro size={16} style={{ color: '#16a34a' }} />
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Historique des paiements</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{userPayments.length}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                  {totalSpent.toFixed(2)}€ · {totalPaidPayments} paiement{totalPaidPayments > 1 ? 's' : ''}
                </div>
              </div>
              {userPayments.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucun paiement</div>
              ) : userPayments.map((p, i) => {
                const days = daysSince(p.created_at);
                const eligible = days < 14 && p.amount > 0;
                return (
                  <div key={p.id} style={{ padding: '14px 22px', borderBottom: i < userPayments.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: p.amount === 0 ? '#f5f3ff' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.amount === 0 ? <Tag size={15} style={{ color: '#7c3aed' }} /> : <Euro size={15} style={{ color: '#16a34a' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {p.amount === 0 ? 'Crédits offerts' : `${p.amount.toFixed(2)}€`}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDateTime(p.created_at)}</div>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                          {p.description || 'Paiement'}
                          {p.promo_code && <span style={{ color: '#7c3aed', fontWeight: 700, marginLeft: 6 }}>· Code {p.promo_code}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 8 }}>
                          {p.retractation_waiver_at && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '3px 7px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <CheckCircle size={9} /> Consentement le {fmtDateTime(p.retractation_waiver_at)}
                            </span>
                          )}
                          {eligible && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '3px 7px', borderRadius: 6 }}>
                              ⚠ Éligible remboursement ({14 - days}j restants)
                            </span>
                          )}
                          {(p.stripe_session_id || p.stripe_payment_id) && (
                            <a href={stripeUrl(p.stripe_payment_id || p.stripe_session_id) || '#'} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 10, fontWeight: 700, color: '#64748b', background: '#f8fafc', border: '1px solid #edf2f7', padding: '3px 7px', borderRadius: 6, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <ExternalLink size={9} /> Stripe
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Historique des analyses */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} style={{ color: '#7c3aed' }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Analyses</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{userAnalyses.length}</span>
              </div>
              {userAnalyses.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucune analyse</div>
              ) : userAnalyses.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 22px', borderBottom: i < userAnalyses.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.address || a.adresse_bien || a.title || 'Sans titre'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDateTime(a.created_at)} · {PLAN_LABELS[a.type] || a.type}</div>
                  </div>
                  {a.score != null && <span style={{ fontSize: 13, fontWeight: 900, color: getScoreColor(a.score), background: getScoreBg(a.score), padding: '3px 9px', borderRadius: 8 }}>{a.score}/20</span>}
                  {a.status === 'completed' ? <Badge color="#16a34a" bg="#f0fdf4">✓</Badge> : (a.status === 'processing' || a.status === 'pending') ? <Badge color="#2a7d9c" bg="#f0f7fb">⟳</Badge> : <Badge color="#dc2626" bg="#fef2f2">✗</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {modal === 'credits' && selectedUser && (
            <Modal title={`Crédits — ${selectedUser.email}`} onClose={() => setModal(null)}>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                <Input label="Crédits Analyse Simple" type="number" value={form.credits_doc} onChange={e => setForm(f => ({ ...f, credits_doc: parseInt(e.target.value) || 0 }))} />
                <Input label="Crédits Analyse Complète" type="number" value={form.credits_complete} onChange={e => setForm(f => ({ ...f, credits_complete: parseInt(e.target.value) || 0 }))} />
                <button onClick={handleSetCredits} style={{ padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
type AnalysisWithUser = AdminAnalyse & { userEmail?: string; userName?: string };

function AnalysesTab({ onOpenUser, focusAnalysisId, onFocusAnalysisHandled }: {
  onOpenUser: (userId: string) => void;
  focusAnalysisId?: string | null;
  onFocusAnalysisHandled?: () => void;
}) {
  const [analyses, setAnalyses] = useState<AnalysisWithUser[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AnalysisWithUser | null>(null);

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    // Jointure manuelle : on charge les analyses + les profils associés
    const { data: rawAnalyses } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!rawAnalyses || rawAnalyses.length === 0) {
      setAnalyses([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(rawAnalyses.map(a => a.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const enriched: AnalysisWithUser[] = rawAnalyses.map(a => ({
      ...a,
      userEmail: profileMap.get(a.user_id)?.email,
      userName: profileMap.get(a.user_id)?.full_name,
    }));

    setAnalyses(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { loadAnalyses(); }, [loadAnalyses]);

  // Si focusAnalysisId est passé (venant de la recherche globale), ouvrir direct la fiche
  useEffect(() => {
    if (!focusAnalysisId || analyses.length === 0) return;
    const analysis = analyses.find(a => a.id === focusAnalysisId);
    if (analysis) {
      setDetail(analysis);
      onFocusAnalysisHandled?.();
    }
  }, [focusAnalysisId, analyses, onFocusAnalysisHandled]);

  const filtered = analyses.filter(a => {
    // Filtre statut : 'error' dans l'ancien code = 'failed' en vrai
    const matchFilter = filter === 'all' || (filter === 'failed' ? (a.status === 'failed' || a.status === 'error') : a.status === filter);
    const q = search.toLowerCase().trim();
    const matchSearch = !q
      || (a.address || a.adresse_bien || '').toLowerCase().includes(q)
      || (a.title || '').toLowerCase().includes(q)
      || (a.userEmail || '').toLowerCase().includes(q)
      || (a.userName || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const doExport = () => {
    exportCSV(filtered.map(a => ({
      adresse: a.address || a.adresse_bien || a.title || '',
      client: a.userEmail || '',
      type: PLAN_LABELS[a.type] || a.type,
      score: a.score ?? '',
      statut: a.status,
      date: fmtDateTime(a.created_at),
    })), 'verimo-analyses.csv');
  };

  const counts = {
    all: analyses.length,
    completed: analyses.filter(a => a.status === 'completed').length,
    processing: analyses.filter(a => a.status === 'processing' || a.status === 'pending').length,
    failed: analyses.filter(a => a.status === 'failed' || a.status === 'error').length,
  };

  // VUE DÉTAIL D'UNE ANALYSE
  if (detail) {
    return <AnalysisDetailView analysis={detail} onBack={() => setDetail(null)} onOpenUser={onOpenUser} onReload={loadAnalyses} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Analyses</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{analyses.length} analyses · cliquez une ligne pour voir le détail</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={doExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Filtres en tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' as const }}>
        {([
          { id: 'all', label: 'Toutes', count: counts.all, color: '#64748b' },
          { id: 'completed', label: '✓ Complétées', count: counts.completed, color: '#16a34a' },
          { id: 'processing', label: '⟳ En cours', count: counts.processing, color: '#2a7d9c' },
          { id: 'failed', label: '✗ Échouées', count: counts.failed, color: '#dc2626' },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${filter === f.id ? f.color : '#edf2f7'}`, background: filter === f.id ? `${f.color}12` : '#fff', color: filter === f.id ? f.color : '#64748b', fontSize: 12, fontWeight: filter === f.id ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {f.label} <span style={{ padding: '1px 6px', borderRadius: 6, background: filter === f.id ? f.color : '#f1f5f9', color: filter === f.id ? '#fff' : '#94a3b8', fontSize: 11, fontWeight: 700 }}>{f.count}</span>
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par adresse, email ou nom client…"
          style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 90px 75px 110px 100px', borderBottom: '1.5px solid #edf2f7', padding: '10px 18px', background: '#f8fafc' }}>
          {['Adresse / Titre', 'Client', 'Type', 'Score', 'Statut', 'Date'].map(h => <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>{h}</div>)}
        </div>
        {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
          : filtered.length === 0 ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucune analyse ne correspond à votre recherche</div>
          : filtered.map((a, i) => (
            <button key={a.id} onClick={() => setDetail(a)}
              style={{ width: '100%', display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 90px 75px 110px 100px', padding: '12px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center', border: 'none', borderRadius: 0, cursor: 'pointer', textAlign: 'left' as const, transition: 'background 0.15s', fontFamily: 'inherit' }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f0f7fb'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.address || a.adresse_bien || a.title || 'Sans titre'}</div>
              <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {a.userEmail || <span style={{ color: '#e2e8f0', fontStyle: 'italic' as const }}>Client supprimé</span>}
              </div>
              <Badge color={PLAN_COLORS[a.type] || '#64748b'} bg={`${PLAN_COLORS[a.type] || '#64748b'}12`}>{PLAN_LABELS[a.type] || a.type}</Badge>
              <div>{a.score != null ? <span style={{ fontSize: 13, fontWeight: 900, color: getScoreColor(a.score), background: getScoreBg(a.score), padding: '3px 9px', borderRadius: 8 }}>{a.score}/20</span> : <span style={{ color: '#e2e8f0' }}>—</span>}</div>
              <div>{a.status === 'completed' ? <Badge color="#16a34a" bg="#f0fdf4">✓ Complétée</Badge> : (a.status === 'processing' || a.status === 'pending') ? <Badge color="#2a7d9c" bg="#f0f7fb">⟳ En cours</Badge> : <Badge color="#dc2626" bg="#fef2f2">✗ Échouée</Badge>}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{fmtDate(a.created_at)}</div>
            </button>
          ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ANALYSIS DETAIL VIEW
══════════════════════════════════════════ */
function AnalysisDetailView({ analysis, onBack, onOpenUser, onReload }: {
  analysis: AnalysisWithUser;
  onBack: () => void;
  onOpenUser: (userId: string) => void;
  onReload: () => void;
}) {
  const [linkedPayment, setLinkedPayment] = useState<AdminPayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Tenter de retrouver le paiement lié via stripe_payment_id ou via le plus récent paiement du user avant cette analyse
      if (analysis.stripe_payment_id) {
        const { data } = await supabase.from('payments')
          .select('*')
          .eq('stripe_payment_id', analysis.stripe_payment_id)
          .single();
        if (data) { setLinkedPayment(data); setLoading(false); return; }
      }
      // Sinon on cherche le paiement correspondant dans les 24h avant la création de l'analyse
      const { data: recent } = await supabase.from('payments')
        .select('*')
        .eq('user_id', analysis.user_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);
      const match = (recent || []).find(p => {
        const diff = new Date(analysis.created_at).getTime() - new Date(p.created_at).getTime();
        return diff >= 0 && diff < 86400000; // dans les 24h
      });
      setLinkedPayment(match || null);
      setLoading(false);
    };
    load();
  }, [analysis]);

  const duration = analysis.completed_at
    ? Math.round((new Date(analysis.completed_at).getTime() - new Date(analysis.created_at).getTime()) / 1000)
    : null;

  // Déterminer l'origine de l'analyse
  let origineLabel = '';
  let origineColor = '#64748b';
  let origineBg = '#f8fafc';
  if (linkedPayment) {
    if (linkedPayment.amount === 0 && linkedPayment.promo_code) {
      origineLabel = `🎁 Code promo gratuit "${linkedPayment.promo_code}"`;
      origineColor = '#7c3aed';
      origineBg = '#f5f3ff';
    } else if (linkedPayment.promo_code) {
      origineLabel = `💳 Paiement ${linkedPayment.amount.toFixed(2)}€ · Code "${linkedPayment.promo_code}"`;
      origineColor = '#16a34a';
      origineBg = '#f0fdf4';
    } else {
      origineLabel = `💳 Paiement Stripe ${linkedPayment.amount.toFixed(2)}€`;
      origineColor = '#16a34a';
      origineBg = '#f0fdf4';
    }
  } else if (analysis.paid === false || (!analysis.stripe_payment_id && analysis.type !== 'document')) {
    origineLabel = '✨ Aperçu gratuit / Analyse offerte';
    origineColor = '#f0a500';
    origineBg = '#fffbeb';
  } else {
    origineLabel = '❓ Origine non identifiée';
  }

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2a7d9c' }}>
        <ChevronLeft size={16} /> Retour aux analyses
      </button>

      <div className="admin-detail-grid" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* Colonne gauche : client + statut */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          {/* Bloc Client */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 14 }}>CLIENT</div>
            {analysis.userEmail ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {(analysis.userName || analysis.userEmail).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{analysis.userName || '—'}</div>
                    <div style={{ fontSize: 12, color: '#2a7d9c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{analysis.userEmail}</div>
                  </div>
                </div>
                <button onClick={() => onOpenUser(analysis.user_id)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#f0f7fb', border: '1.5px solid #bae3f5', color: '#2a7d9c', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <User size={14} /> Voir la fiche complète
                </button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' as const, padding: '12px', background: '#f8fafc', borderRadius: 10 }}>
                Client introuvable — compte supprimé
              </div>
            )}
          </div>

          {/* Bloc Statut */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 14 }}>STATUT</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>État</span>
                {analysis.status === 'completed' ? <Badge color="#16a34a" bg="#f0fdf4">✓ Complétée</Badge>
                  : (analysis.status === 'processing' || analysis.status === 'pending') ? <Badge color="#2a7d9c" bg="#f0f7fb">⟳ En cours</Badge>
                  : <Badge color="#dc2626" bg="#fef2f2">✗ Échouée</Badge>}
              </div>
              {analysis.score != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Score</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: getScoreColor(analysis.score), background: getScoreBg(analysis.score), padding: '3px 10px', borderRadius: 8 }}>{analysis.score}/20</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Type</span>
                <Badge color={PLAN_COLORS[analysis.type] || '#64748b'} bg={`${PLAN_COLORS[analysis.type] || '#64748b'}12`}>{PLAN_LABELS[analysis.type] || analysis.type}</Badge>
              </div>
              {duration !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Durée traitement</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{duration}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 14 }}>ACTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {analysis.status === 'completed' && (
                <a href={`/dashboard/rapport?id=${analysis.id}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Eye size={14} /> Voir le rapport
                </a>
              )}
              {linkedPayment?.stripe_session_id && (
                <a href={`https://dashboard.stripe.com/payments?query=${linkedPayment.stripe_session_id}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ExternalLink size={14} /> Ouvrir dans Stripe
                </a>
              )}
              <button onClick={onReload}
                style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <RefreshCw size={14} /> Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite : infos analyse */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
          {/* Titre et adresse */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${PLAN_COLORS[analysis.type] || '#64748b'}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={22} style={{ color: PLAN_COLORS[analysis.type] || '#64748b' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 4 }}>ANALYSE</div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{analysis.address || analysis.adresse_bien || analysis.title || 'Sans titre'}</h2>
                {(analysis.address || analysis.adresse_bien) && analysis.title && analysis.title !== (analysis.address || analysis.adresse_bien) && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{analysis.title}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>CRÉÉE LE</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtDateTime(analysis.created_at)}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{fmtRelative(analysis.created_at)}</div>
              </div>
              {analysis.completed_at && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>COMPLÉTÉE LE</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtDateTime(analysis.completed_at)}</div>
                </div>
              )}
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 4 }}>ID ANALYSE</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{analysis.id}</div>
              </div>
            </div>
          </div>

          {/* Origine */}
          <div style={{ background: origineBg, borderRadius: 14, border: `1.5px solid ${origineColor}30`, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: origineColor, letterSpacing: '0.08em', marginBottom: 8 }}>ORIGINE DE L'ANALYSE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: origineColor }}>{loading ? 'Chargement...' : origineLabel}</div>
            {linkedPayment?.retractation_waiver_at && (
              <div style={{ fontSize: 11, color: origineColor, opacity: 0.8, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={11} /> Consentement rétractation : {fmtDateTime(linkedPayment.retractation_waiver_at)}
              </div>
            )}
          </div>

          {/* Documents fournis */}
          {analysis.document_urls && analysis.document_urls.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 14 }}>
                DOCUMENTS FOURNIS ({analysis.document_urls.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                {analysis.document_urls.map((url, i) => {
                  const fileName = typeof url === 'string' ? url.split('/').pop() || `Document ${i + 1}` : `Document ${i + 1}`;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                      <FileText size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{fileName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
        {/* Header desktop uniquement */}
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px 100px 100px 90px 80px', borderBottom: '1.5px solid #edf2f7', padding: '10px 18px', background: '#f8fafc' }} className="promo-header-desktop">
          {['Code', 'Avantage', 'Utilisations', 'Expiration', 'Email limité', 'Statut', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>{h}</div>
          ))}
        </div>
        <style>{`
          @media (max-width: 768px) { .promo-header-desktop { display: none !important; } }
        `}</style>
        {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
          : promos.length === 0 ? (
            <div style={{ padding: '52px', textAlign: 'center' as const, color: '#94a3b8' }}>
              <Tag size={36} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun code promo créé</div>
            </div>
          ) : promos.map((promo, i) => (
            <div key={promo.id} style={{ borderBottom: i < promos.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', opacity: promo.active ? 1 : 0.5 }}>
              {/* Vue desktop */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px 100px 100px 90px 80px', padding: '13px 18px', alignItems: 'center' }} className="promo-row-desktop">
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

              {/* Vue mobile — carte */}
              <div style={{ padding: '14px 16px' }} className="promo-row-mobile">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{promo.code}</span>
                    <button onClick={() => copyCode(promo.code, promo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === promo.id ? '#16a34a' : '#94a3b8', padding: 2 }}>
                      {copiedId === promo.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    {promo.active ? <Badge color="#16a34a" bg="#f0fdf4">Actif</Badge> : <Badge color="#94a3b8" bg="#f8fafc">Inactif</Badge>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleActive(promo)}
                      style={{ padding: '8px 12px', borderRadius: 8, background: promo.active ? '#fffbeb' : '#f0fdf4', border: `1px solid ${promo.active ? '#fde68a' : '#d1fae5'}`, cursor: 'pointer' }}>
                      {promo.active ? <EyeOff size={14} color="#f0a500" /> : <Eye size={14} color="#16a34a" />}
                    </button>
                    <button onClick={() => onConfirm({ title: 'Supprimer le code', message: `Supprimer le code ${promo.code} définitivement ?`, confirmLabel: 'Supprimer', variant: 'danger', onConfirm: async () => { await supabase.from('promo_codes').delete().eq('id', promo.id); await logAction('Code supprimé', promo.code); loadPromos(); showToast('Code supprimé'); } })}
                      style={{ padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer' }}>
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', marginBottom: 4 }}>{typeLabel(promo.type, promo.value, promo.credit_type)}</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Utilisations : {promo.uses_count}{promo.max_uses ? `/${promo.max_uses}` : ''}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Expire : {promo.expires_at ? fmtDate(promo.expires_at) : '—'}</span>
                  {promo.restricted_email && <span style={{ fontSize: 12, color: '#64748b' }}>Email : {promo.restricted_email}</span>}
                </div>
              </div>
            </div>
          ))}
        <style>{`
          .promo-row-desktop { display: grid; }
          .promo-row-mobile { display: none; }
          @media (max-width: 768px) {
            .promo-row-desktop { display: none !important; }
            .promo-row-mobile { display: block !important; }
          }
        `}</style>
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
                  <Input label="Nombre de crédits" type="number" value={form.value} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, value: v === '' ? 0 : Math.max(1, parseInt(v) || 1) })); }} min={1} />
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

/* ══════════════════════════════════════════
   DEMANDES PRO TAB
══════════════════════════════════════════ */
type ContactPro = {
  id: string; profile_type: string; nom: string; prenom: string; email: string;
  telephone?: string; ville?: string; volume?: string; message?: string;
  profile_data: Record<string, unknown>; rgpd_consent: boolean; read: boolean;
  notes_admin?: string; created_at: string;
};

const proTypeBadge: Record<string, { label: string; color: string; bg: string; border: string }> = {
  agent: { label: '🏢 Agent', color: '#2a7d9c', bg: '#f0f7fb', border: '#d0e8f0' },
  investisseur: { label: '📈 Investisseur', color: '#7c3aed', bg: '#f5f3ff', border: '#e0d6ff' },
  notaire: { label: '⚖️ Notaire', color: '#0f2d3d', bg: '#f4f7f9', border: '#d8e2e8' },
  autre: { label: '💼 Autre', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

function DemandesProTab({ onConfirm, showToast, onReadChange }: { onConfirm: (a: ConfirmAction) => void; showToast: (m: string) => void; onReadChange: (n: number) => void }) {
  const [demandes, setDemandes] = useState<ContactPro[]>([]);
  const [selected, setSelected] = useState<ContactPro | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const loadDemandes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('contact_pro').select('*').order('created_at', { ascending: false });
    setDemandes(data || []);
    const unread = (data || []).filter((d: ContactPro) => !d.read).length;
    onReadChange(unread);
    setLoading(false);
  }, [onReadChange]);

  useEffect(() => { loadDemandes(); }, [loadDemandes]);

  // Temps réel
  useEffect(() => {
    const channel = supabase.channel('contact_pro_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_pro' }, () => {
        loadDemandes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadDemandes]);

  const deleteDemande = (d: ContactPro) => {
    onConfirm({
      title: 'Supprimer la demande',
      message: `Supprimer la demande de ${d.prenom} ${d.nom} (${proTypeBadge[d.profile_type]?.label || d.profile_type}) ?`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
      onConfirm: async () => {
        await supabase.from('contact_pro').delete().eq('id', d.id);
        if (selected?.id === d.id) setSelected(null);
        loadDemandes();
        showToast('Demande supprimée');
      },
    });
  };

  const markRead = async (d: ContactPro) => {
    if (!d.read) {
      await supabase.from('contact_pro').update({ read: true }).eq('id', d.id);
      setDemandes(prev => prev.map(x => x.id === d.id ? { ...x, read: true } : x));
      const newUnread = demandes.filter(x => !x.read && x.id !== d.id).length;
      onReadChange(newUnread);
    }
    setSelected({ ...d, read: true });
  };

  const filtered = filterType === 'all' ? demandes : demandes.filter(d => d.profile_type === filterType);
  const unreadCount = demandes.filter(d => !d.read).length;

  const renderProfileData = (d: ContactPro) => {
    const pd = d.profile_data || {};
    const entries = Object.entries(pd).filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0));
    if (entries.length === 0) return null;
    const labelMap: Record<string, string> = {
      nomAgence: 'Agence', adresseAgence: 'Adresse agence', reseau: 'Réseau', tailleAgence: 'Taille agence',
      transactionsParMois: 'Transactions/mois', rsac: 'RSAC/Carte T', dejaAnalyse: 'Service analyse existant', interets: 'Intérêts',
      nomSociete: 'Société', statut: 'Statut', siret: 'SIRET', acquisitionsParAn: 'Acquisitions/an',
      typeBien: 'Type de biens', strategie: 'Stratégie', avecCourtier: 'Avec courtier/agent',
      nomEtude: 'Étude', adresseEtude: 'Adresse étude', fonction: 'Fonction', tailleEtude: 'Taille étude',
      dejaOutils: 'Outils existants', profession: 'Profession', nomStructure: 'Structure',
    };
    return (
      <div style={{ marginTop: 16, padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #edf2f7' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Infos spécifiques</div>
        {entries.map(([key, val]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid #f1f5f9', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, minWidth: 120, flexShrink: 0 }}>{labelMap[key] || key}</span>
            <span style={{ fontSize: 12, color: '#0f172a', textAlign: 'right' as const }}>{Array.isArray(val) ? (val as string[]).join(', ') : String(val)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Demandes Pro</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} · {demandes.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {[{ id: 'all', label: 'Tous' }, { id: 'agent', label: '🏢 Agents' }, { id: 'investisseur', label: '📈 Invest.' }, { id: 'notaire', label: '⚖️ Notaires' }, { id: 'autre', label: '💼 Autres' }].map(f => (
            <button key={f.id} onClick={() => setFilterType(f.id)}
              style={{ padding: '7px 12px', borderRadius: 10, border: `1.5px solid ${filterType === f.id ? '#2a7d9c' : '#edf2f7'}`, background: filterType === f.id ? '#f0f7fb' : '#fff', color: filterType === f.id ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filterType === f.id ? 700 : 500, cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-messages-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
            : filtered.length === 0 ? (
              <div style={{ padding: '52px 32px', textAlign: 'center' as const, color: '#94a3b8' }}>
                <Briefcase size={36} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune demande pro</div>
              </div>
            ) : filtered.map((d, i) => {
              const badge = proTypeBadge[d.profile_type] || proTypeBadge.autre;
              return (
                <div key={d.id} onClick={() => markRead(d)}
                  style={{ padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: selected?.id === d.id ? '#f0f7fb' : d.read ? '#fff' : '#fffef0', transition: 'background 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!d.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f0a500', flexShrink: 0 }} />}
                      <span style={{ fontSize: 14, fontWeight: d.read ? 600 : 800, color: '#0f172a' }}>{d.prenom} {d.nom}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(d.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: '2px 8px', borderRadius: 6 }}>{badge.label}</span>
                    <span style={{ fontSize: 12, color: '#2a7d9c' }}>{d.email}</span>
                  </div>
                  {d.volume && <div style={{ fontSize: 12, color: '#94a3b8' }}>{d.volume}</div>}
                </div>
              );
            })}
        </div>

        {selected && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: 24, height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{selected.prenom} {selected.nom}</div>
                <a href={`mailto:${selected.email}`} style={{ fontSize: 13, color: '#2a7d9c', textDecoration: 'none', fontWeight: 600 }}>{selected.email}</a>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, cursor: 'pointer', color: '#94a3b8', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>
            {(() => { const b = proTypeBadge[selected.profile_type] || proTypeBadge.autre; return (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: b.bg, border: `1px solid ${b.border}`, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{b.label}</span>
              </div>
            ); })()}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 16 }}>
              {selected.telephone && (<div><div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Téléphone</div><div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{selected.telephone}</div></div>)}
              {selected.ville && (<div><div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Ville / Région</div><div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{selected.ville}</div></div>)}
              {selected.volume && (<div><div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Volume estimé</div><div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{selected.volume}</div></div>)}
            </div>
            {renderProfileData(selected)}
            {selected.message && (
              <div style={{ marginTop: 16, padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Message</div>
                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }}>{selected.message}</div>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 16, marginBottom: 20 }}>Reçu le {fmtDateTime(selected.created_at)}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              <a href={`mailto:${selected.email}?subject=Verimo Pro — Votre demande`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <Send size={13} /> Répondre
              </a>
              {selected.telephone && (
                <a href={`tel:${selected.telephone}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f0fdf4', border: '1px solid #d1fae5', color: '#16a34a', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Appeler
                </a>
              )}
              <button onClick={() => deleteDemande(selected)}
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
   PAYMENTS TAB
══════════════════════════════════════════ */
type PaymentWithUser = AdminPayment & { userEmail?: string; userName?: string };

function PaymentsTab({ onOpenUser, showToast }: { onOpenUser: (userId: string) => void; showToast: (m: string) => void }) {
  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'free' | 'refundable'>('all');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'all' | '7j' | '30j' | '90j'>('all');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const { data: rawPayments } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!rawPayments || rawPayments.length === 0) {
      setPayments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(rawPayments.map(p => p.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const enriched: PaymentWithUser[] = rawPayments.map(p => ({
      ...p,
      userEmail: profileMap.get(p.user_id)?.email,
      userName: profileMap.get(p.user_id)?.full_name,
    }));

    setPayments(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  // Filtrage
  const filtered = payments.filter(p => {
    // Période
    if (period !== 'all') {
      const days = daysSince(p.created_at);
      const limit = period === '7j' ? 7 : period === '30j' ? 30 : 90;
      if (days > limit) return false;
    }
    // Type paiement
    if (filter === 'paid' && p.amount === 0) return false;
    if (filter === 'free' && p.amount > 0) return false;
    if (filter === 'refundable') {
      const days = daysSince(p.created_at);
      if (days >= 14 || p.amount === 0) return false;
    }
    // Recherche
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (p.userEmail || '').toLowerCase().includes(q)
      || (p.userName || '').toLowerCase().includes(q)
      || (p.description || '').toLowerCase().includes(q)
      || (p.promo_code || '').toLowerCase().includes(q)
      || (p.stripe_session_id || '').toLowerCase().includes(q);
  });

  const doExport = () => {
    exportCSV(filtered.map(p => ({
      date: fmtDateTime(p.created_at),
      client: p.userEmail || '',
      montant: p.amount,
      description: p.description || '',
      code_promo: p.promo_code || '',
      credits: p.credits_added || 0,
      type_credit: p.credit_type || '',
      stripe_id: p.stripe_session_id || p.stripe_payment_id || '',
      consentement: p.retractation_waiver_at ? fmtDateTime(p.retractation_waiver_at) : '',
      statut: p.status,
    })), `verimo-paiements-${period}.csv`);
    showToast('Export CSV téléchargé');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Journal des paiements</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Historique détaillé de toutes les transactions Stripe et crédits offerts</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={doExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Filtres période */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' as const }}>
        {([
          { id: 'all', label: 'Tout' },
          { id: '7j', label: '7 jours' },
          { id: '30j', label: '30 jours' },
          { id: '90j', label: '90 jours' },
        ] as const).map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            style={{ padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${period === p.id ? '#2a7d9c' : '#edf2f7'}`, background: period === p.id ? '#f0f7fb' : '#fff', color: period === p.id ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: period === p.id ? 700 : 500, cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Filtres type */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' as const }}>
        {([
          { id: 'all', label: 'Tous les paiements', color: '#64748b' },
          { id: 'paid', label: '💳 Payants', color: '#16a34a' },
          { id: 'free', label: '🎁 Gratuits', color: '#7c3aed' },
          { id: 'refundable', label: '⏱ Remboursables (< 14j)', color: '#d97706' },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${filter === f.id ? f.color : '#edf2f7'}`, background: filter === f.id ? `${f.color}12` : '#fff', color: filter === f.id ? f.color : '#64748b', fontSize: 12, fontWeight: filter === f.id ? 700 : 500, cursor: 'pointer' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par email, code promo, ID Stripe…"
          style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit' }} />
      </div>

      {/* Liste */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
          : filtered.length === 0 ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucun paiement ne correspond à vos filtres</div>
          : filtered.map((p, i) => {
            const days = daysSince(p.created_at);
            const eligible = days < 14 && p.amount > 0;
            return (
              <div key={p.id} style={{ padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: p.amount === 0 ? '#f5f3ff' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.amount === 0 ? <Tag size={16} style={{ color: '#7c3aed' }} /> : <Euro size={16} style={{ color: '#16a34a' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: p.amount === 0 ? '#7c3aed' : '#16a34a' }}>
                          {p.amount === 0 ? 'Gratuit' : `${p.amount.toFixed(2)}€`}
                        </span>
                        {p.userEmail ? (
                          <button onClick={() => onOpenUser(p.user_id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, color: '#2a7d9c', fontWeight: 700, textDecoration: 'underline', textDecorationColor: '#bae3f5' }}>
                            {p.userEmail}
                          </button>
                        ) : (
                          <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' as const }}>Client supprimé</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{fmtDateTime(p.created_at)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 6 }}>
                      {p.description || 'Paiement'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {p.promo_code && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '3px 7px', borderRadius: 6 }}>
                          🎁 {p.promo_code}
                        </span>
                      )}
                      {p.credits_added && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c', background: '#f0f7fb', padding: '3px 7px', borderRadius: 6 }}>
                          +{p.credits_added} crédit{p.credits_added > 1 ? 's' : ''} {p.credit_type === 'document' ? 'simple' : 'complet'}
                        </span>
                      )}
                      {p.retractation_waiver_at && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '3px 7px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CheckCircle size={9} /> Consentement tracé
                        </span>
                      )}
                      {eligible && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '3px 7px', borderRadius: 6 }}>
                          ⚠ Éligible remboursement ({14 - days}j)
                        </span>
                      )}
                      {(p.stripe_session_id || p.stripe_payment_id) && (
                        <a href={stripeUrl(p.stripe_payment_id || p.stripe_session_id) || '#'} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 10, fontWeight: 700, color: '#64748b', background: '#f8fafc', border: '1px solid #edf2f7', padding: '3px 7px', borderRadius: 6, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <ExternalLink size={9} /> Stripe
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   GLOBAL SEARCH MODAL
══════════════════════════════════════════ */
type SearchResult = {
  type: 'user' | 'analysis' | 'payment';
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  userId?: string;
};

function GlobalSearchModal({ query, setQuery, onClose, onNavigate }: {
  query: string;
  setQuery: (q: string) => void;
  onClose: () => void;
  onNavigate: (tab: TabId, resourceId?: string, resourceType?: 'user' | 'analysis' | 'payment') => void;
}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setSearching(true);
      try {
        // Recherche utilisateurs (email et nom)
        const { data: users } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
          .limit(5);

        // Recherche analyses (adresse et titre)
        const { data: analyses } = await supabase
          .from('analyses')
          .select('id, user_id, address, title, type, created_at, status')
          .or(`address.ilike.%${q}%,title.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        // Recherche paiements (code promo, stripe_id, description)
        const { data: payments } = await supabase
          .from('payments')
          .select('id, user_id, amount, description, promo_code, stripe_session_id, created_at')
          .or(`description.ilike.%${q}%,promo_code.ilike.%${q}%,stripe_session_id.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        const combined: SearchResult[] = [
          ...(users || []).map((u): SearchResult => ({
            type: 'user',
            id: u.id,
            title: u.full_name || u.email,
            subtitle: u.email,
            userId: u.id,
          })),
          ...(analyses || []).map((a): SearchResult => ({
            type: 'analysis',
            id: a.id,
            title: (a as { address?: string; adresse_bien?: string; title?: string }).address || (a as { adresse_bien?: string }).adresse_bien || a.title || 'Sans titre',
            subtitle: `${PLAN_LABELS[a.type] || a.type} · ${a.status === 'completed' ? 'Complétée' : a.status === 'failed' ? 'Échouée' : 'En cours'}`,
            meta: fmtDate(a.created_at),
            userId: a.user_id,
          })),
          ...(payments || []).map((p): SearchResult => ({
            type: 'payment',
            id: p.id,
            title: `${p.amount > 0 ? p.amount.toFixed(2) + '€' : 'Gratuit'} — ${p.description || 'Paiement'}`,
            subtitle: p.promo_code ? `Code ${p.promo_code}` : (p.stripe_session_id || '—'),
            meta: fmtDate(p.created_at),
            userId: p.user_id,
          })),
        ];

        setResults(combined);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const byType = {
    user: results.filter(r => r.type === 'user'),
    analysis: results.filter(r => r.type === 'analysis'),
    payment: results.filter(r => r.type === 'payment'),
  };

  const handleSelect = (r: SearchResult) => {
    if (r.type === 'user' && r.userId) {
      onNavigate('users', r.userId, 'user');
    } else if (r.type === 'analysis') {
      onNavigate('analyses', r.id, 'analysis');
    } else if (r.type === 'payment' && r.userId) {
      onNavigate('users', r.userId, 'user');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 90 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 620, boxShadow: '0 30px 80px rgba(0,0,0,0.35)', overflow: 'hidden' }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <Search size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un client, une analyse, un paiement…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', color: '#0f172a', background: 'transparent' }}
          />
          {searching && <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#2a7d9c', animation: 'spin 0.8s linear infinite' }} />}
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>ESC</button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
          {query.trim().length < 2 ? (
            <div style={{ padding: '50px 22px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>
              Tapez au moins 2 caractères pour rechercher
            </div>
          ) : results.length === 0 && !searching ? (
            <div style={{ padding: '50px 22px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>
              Aucun résultat pour "{query}"
            </div>
          ) : (
            <>
              {byType.user.length > 0 && (
                <div>
                  <div style={{ padding: '12px 22px 6px', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                    Utilisateurs ({byType.user.length})
                  </div>
                  {byType.user.map(r => (
                    <button key={r.id} onClick={() => handleSelect(r)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' as const, transition: 'background 0.12s' }}
                      onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f0f7fb'}
                      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>
                        {r.title.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.subtitle}</div>
                      </div>
                      <ArrowRight size={13} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}

              {byType.analysis.length > 0 && (
                <div style={{ borderTop: byType.user.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ padding: '12px 22px 6px', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                    Analyses ({byType.analysis.length})
                  </div>
                  {byType.analysis.map(r => (
                    <button key={r.id} onClick={() => handleSelect(r)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' as const, transition: 'background 0.12s' }}
                      onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f5f3ff'}
                      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={14} style={{ color: '#7c3aed' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{r.subtitle}</div>
                      </div>
                      {r.meta && <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{r.meta}</div>}
                    </button>
                  ))}
                </div>
              )}

              {byType.payment.length > 0 && (
                <div style={{ borderTop: (byType.user.length > 0 || byType.analysis.length > 0) ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ padding: '12px 22px 6px', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                    Paiements ({byType.payment.length})
                  </div>
                  {byType.payment.map(r => (
                    <button key={r.id} onClick={() => handleSelect(r)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' as const, transition: 'background 0.12s' }}
                      onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f0fdf4'}
                      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Euro size={14} style={{ color: '#16a34a' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{r.subtitle}</div>
                      </div>
                      {r.meta && <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{r.meta}</div>}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 22px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
          <span>Cliquez un résultat pour l'ouvrir</span>
          <span>Raccourci : <kbd style={{ padding: '1px 6px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, fontFamily: 'monospace', fontSize: 10, fontWeight: 700 }}>⌘K</kbd></span>
        </div>
      </motion.div>
    </motion.div>
  );
}

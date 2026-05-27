import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, Users, FileText, Mail, BarChart2,
  Search, X, Check, AlertTriangle, Shield, CreditCard,
  Trash2, RefreshCw, Eye, EyeOff, ArrowRight,
  LogOut, Send, UserPlus, CheckCircle, Download, Tag,
  Bell, ChevronLeft, ChevronRight, Plus, Copy, Briefcase, Euro, ExternalLink,
  Clock, User, Building2, LifeBuoy, Lightbulb, MessageSquare, ChevronDown, Pencil, Phone,
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
  completed_at?: string; progress_message?: string;
};
type AdminPayment = {
  id: string; user_id: string; amount: number; currency?: string;
  description?: string; stripe_session_id?: string; stripe_payment_id?: string;
  promo_code?: string; credits_added?: number; credit_type?: string;
  status: string; created_at: string; retractation_waiver_at?: string;
  _source?: string;
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
        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Annuler</button>
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
type TabId = 'dashboard' | 'users' | 'analyses' | 'payments' | 'messages' | 'demandes_pro' | 'stats' | 'promos' | 'logs' | 'banner' | 'alerts' | 'clients' | 'support' | 'suggestions' | 'callbacks';

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
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [suggestionsUnreadCount, setSuggestionsUnreadCount] = useState(0);
  const [callbacksPendingCount, setCallbacksPendingCount] = useState(0);
  // Routing inter-onglets : permet d'ouvrir la fiche d'un user depuis une analyse, etc.
  const [focusUserId, setFocusUserId] = useState<string | null>(null);
  const [focusProClientId, setFocusProClientId] = useState<string | null>(null);
  const [focusAnalysisId, setFocusAnalysisId] = useState<string | null>(null);
  // Recherche globale
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [createProFromDemande, setCreateProFromDemande] = useState<Record<string, unknown> | null>(null);

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

      // 🆕 Lire l'URL param ?tab=xxx pour ouvrir un onglet direct (ex: depuis email de notif)
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as TabId | null;
      const validTabs: TabId[] = ['dashboard', 'users', 'analyses', 'payments', 'messages', 'demandes_pro', 'stats', 'promos', 'logs', 'banner', 'alerts', 'clients', 'support', 'suggestions', 'callbacks'];
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }

      // Unread messages count
      const { count } = await supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('read', false);
      setUnreadCount(count || 0);
      // Unread pro demands count
      const { count: proCount } = await supabase.from('contact_pro').select('*', { count: 'exact', head: true }).eq('read', false);
      setProUnreadCount(proCount || 0);
      // Unread support tickets
      const { count: supportCount } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('unread_by_admin', true);
      setSupportUnreadCount(supportCount || 0);
      // Unread suggestions
      const { count: suggestCount } = await supabase.from('pro_suggestions').select('*', { count: 'exact', head: true }).eq('acknowledged', false);
      setSuggestionsUnreadCount(suggestCount || 0);
      // 🆕 Callbacks pending
      const { count: callbackCount } = await supabase.from('callback_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      setCallbacksPendingCount(callbackCount || 0);
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
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'stats', label: 'Analyse / CA', icon: BarChart2 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'analyses', label: 'Analyses', icon: FileText },
    { id: 'payments', label: 'Relevé des transactions', icon: Euro },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadCount },
    { id: 'demandes_pro', label: 'Demandes Pro', icon: Briefcase, badge: proUnreadCount },
    { id: 'clients', label: 'Clients Pro', icon: Building2 },
    { id: 'promos', label: 'Codes promo', icon: Tag },
    { id: 'alerts', label: 'Alertes système', icon: AlertTriangle },
    { id: 'support', label: 'Besoin d\'aide', icon: LifeBuoy, badge: supportUnreadCount },
    { id: 'suggestions', label: 'Suggestions', icon: Lightbulb, badge: suggestionsUnreadCount },
    { id: 'callbacks', label: 'Rappels Pro', icon: Phone, badge: callbacksPendingCount },
    { id: 'banner', label: 'Bannière', icon: Bell },
    { id: 'logs', label: 'Historique', icon: Clock },
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

        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-fade-in { animation: adminFadeIn 0.2s ease-out; }
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
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            ←<span className="admin-topbar-title" style={{ display: 'inline' }}> Dashboard</span>
          </button>
          <button onClick={() => { supabase.auth.signOut(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            <LogOut size={13} /><span className="admin-topbar-title" style={{ display: 'inline' }}> Déco</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar — cachée sur mobile */}
        <aside className="admin-sidebar" style={{ width: 240, background: '#fff', borderRight: '1px solid #edf2f7', padding: '16px 12px', flexShrink: 0, position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
            {/* ─── ACTIVITÉ ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 4px' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={10} style={{ color: '#2a7d9c' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em' }}>ACTIVITÉ</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            <div style={{ borderLeft: '2px solid #2a7d9c', marginLeft: 8, paddingLeft: 12, marginBottom: 10, display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
              {tabs.filter(t => ['dashboard', 'stats', 'payments'].includes(t.id)).map(tab => {
                const Icon = tab.icon; const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? '#d0e8f0' : 'transparent', color: active ? '#0c447c' : '#334155', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', position: 'relative' as const, width: '100%' }}>
                    <Icon size={14} style={{ flexShrink: 0, color: active ? '#2a7d9c' : '#94a3b8' }} />
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {tab.badge ? <span style={{ background: '#f0a500', color: '#fff', borderRadius: 100, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const }}>{tab.badge}</span> : null}
                  </button>
                );
              })}
            </div>

            {/* ─── UTILISATEURS ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 4px' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={10} style={{ color: '#7c3aed' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em' }}>UTILISATEURS</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            <div style={{ borderLeft: '2px solid #7c3aed', marginLeft: 8, paddingLeft: 12, marginBottom: 10, display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
              {tabs.filter(t => ['users', 'clients', 'demandes_pro', 'callbacks'].includes(t.id)).map(tab => {
                const Icon = tab.icon; const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? '#ddd6fe' : 'transparent', color: active ? '#3C3489' : '#334155', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', position: 'relative' as const, width: '100%' }}>
                    <Icon size={14} style={{ flexShrink: 0, color: active ? '#7c3aed' : '#94a3b8' }} />
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {tab.badge ? <span style={{ background: '#f0a500', color: '#fff', borderRadius: 100, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const }}>{tab.badge}</span> : null}
                  </button>
                );
              })}
            </div>

            {/* ─── CONTENU ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 4px' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={10} style={{ color: '#16a34a' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', letterSpacing: '0.08em' }}>CONTENU</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            <div style={{ borderLeft: '2px solid #16a34a', marginLeft: 8, paddingLeft: 12, marginBottom: 10, display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
              {tabs.filter(t => ['analyses'].includes(t.id)).map(tab => {
                const Icon = tab.icon; const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? '#bbf7d0' : 'transparent', color: active ? '#166534' : '#334155', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', position: 'relative' as const, width: '100%' }}>
                    <Icon size={14} style={{ flexShrink: 0, color: active ? '#16a34a' : '#94a3b8' }} />
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {tab.badge ? <span style={{ background: '#f0a500', color: '#fff', borderRadius: 100, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const }}>{tab.badge}</span> : null}
                  </button>
                );
              })}
            </div>

            {/* ─── OUTILS ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 4px' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag size={10} style={{ color: '#d97706' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: '0.08em' }}>OUTILS</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            <div style={{ borderLeft: '2px solid #d97706', marginLeft: 8, paddingLeft: 12, marginBottom: 10, display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
              {tabs.filter(t => ['promos', 'banner'].includes(t.id)).map(tab => {
                const Icon = tab.icon; const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? '#fde68a' : 'transparent', color: active ? '#92400e' : '#334155', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', position: 'relative' as const, width: '100%' }}>
                    <Icon size={14} style={{ flexShrink: 0, color: active ? '#d97706' : '#94a3b8' }} />
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {tab.badge ? <span style={{ background: '#f0a500', color: '#fff', borderRadius: 100, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const }}>{tab.badge}</span> : null}
                  </button>
                );
              })}
            </div>

            {/* ─── SUPPORT ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 4px' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={10} style={{ color: '#f59e0b' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.08em' }}>SUPPORT</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            <div style={{ borderLeft: '2px solid #f59e0b', marginLeft: 8, paddingLeft: 12, marginBottom: 10, display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
              {tabs.filter(t => ['support', 'messages', 'suggestions'].includes(t.id)).map(tab => {
                const Icon = tab.icon; const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? '#fcd34d' : 'transparent', color: active ? '#854F0B' : '#334155', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', position: 'relative' as const, width: '100%' }}>
                    <Icon size={14} style={{ flexShrink: 0, color: active ? '#f59e0b' : '#94a3b8' }} />
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {tab.badge ? <span style={{ background: '#f0a500', color: '#fff', borderRadius: 100, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const }}>{tab.badge}</span> : null}
                  </button>
                );
              })}
            </div>

            {/* ─── SYSTÈME ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 4px' }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={10} style={{ color: '#64748b' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em' }}>SYSTÈME</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            <div style={{ borderLeft: '2px solid #94a3b8', marginLeft: 8, paddingLeft: 12, display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
              {tabs.filter(t => ['alerts', 'logs'].includes(t.id)).map(tab => {
                const Icon = tab.icon; const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? '#cbd5e1' : 'transparent', color: active ? '#334155' : '#334155', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', position: 'relative' as const, width: '100%' }}>
                    <Icon size={14} style={{ flexShrink: 0, color: active ? '#64748b' : '#94a3b8' }} />
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {tab.badge ? <span style={{ background: '#f0a500', color: '#fff', borderRadius: 100, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const }}>{tab.badge}</span> : null}
                  </button>
                );
              })}
            </div>
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
              {activeTab === 'users' && <UsersTab onConfirm={setConfirm} showToast={showToast} logAction={logAction} focusUserId={focusUserId} onFocusUserHandled={() => setFocusUserId(null)} onOpenAnalysis={(id) => { setFocusAnalysisId(id); setActiveTab('analyses'); }} onOpenProClient={(userId) => { setFocusProClientId(userId); setActiveTab('clients'); }} />}
              {activeTab === 'analyses' && <AnalysesTab onOpenUser={(id) => { setFocusUserId(id); setActiveTab('users'); }} focusAnalysisId={focusAnalysisId} onFocusAnalysisHandled={() => setFocusAnalysisId(null)} />}
              {activeTab === 'payments' && <PaymentsTab onOpenUser={(id) => { setFocusUserId(id); setActiveTab('users'); }} showToast={showToast} />}
              {activeTab === 'messages' && <MessagesTab onConfirm={setConfirm} showToast={showToast} onReadChange={setUnreadCount} onGoToUser={(userId) => { setFocusUserId(userId); setActiveTab('users'); }} onGoToProClient={(userId) => { setFocusProClientId(userId); setActiveTab('clients'); }} />}
              {activeTab === 'demandes_pro' && <DemandesProTab onConfirm={setConfirm} showToast={showToast} onReadChange={setProUnreadCount} onCreatePro={(d) => { setCreateProFromDemande(d); setActiveTab('clients'); }} />}
              {activeTab === 'clients' && <ClientsProTab showToast={showToast} logAction={logAction} prefillDemande={createProFromDemande} onPrefillHandled={() => setCreateProFromDemande(null)} focusClientId={focusProClientId} onFocusClientHandled={() => setFocusProClientId(null)} />}
              {activeTab === 'promos' && <PromosTab onConfirm={setConfirm} showToast={showToast} logAction={logAction} />}
              {activeTab === 'alerts' && <SystemAlertsTab showToast={showToast} />}
              {activeTab === 'support' && <AdminSupportTab showToast={showToast} onUnreadChange={setSupportUnreadCount} onGoToUser={(userId) => { setFocusUserId(userId); setActiveTab('users'); }} />}
              {activeTab === 'suggestions' && <AdminSuggestionsTab onGoToUser={(userId) => { setFocusUserId(userId); setActiveTab('users'); }} showToast={showToast} onUnreadChange={setSuggestionsUnreadCount} />}
              {activeTab === 'callbacks' && <AdminCallbacksTab showToast={showToast} onPendingChange={setCallbacksPendingCount} onGoToUser={(userId) => { setFocusUserId(userId); setActiveTab('users'); }} onGoToProClient={(userId) => { setFocusProClientId(userId); setActiveTab('clients'); }} />}
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
/* ═══ ALERTES SYSTÈME ══════════════════════════════════════════════ */
function SystemAlertsTab({ showToast }: { showToast: (msg: string) => void }) {
  type Alert = {
    id: string; created_at: string; type: string; severity: string;
    title: string; message: string; analyse_id: string | null;
    user_id: string | null; resolved: boolean; resolved_at: string | null;
    metadata: Record<string, unknown>;
    user_email?: string | null; user_name?: string | null;
  };

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved');
  const [activeCategory, setActiveCategory] = useState<'all' | 'stripe' | 'analyse' | 'cleanup' | 'autre'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('system_alerts').select('*').order('created_at', { ascending: false }).limit(200);
    if (filter === 'unresolved') query = query.eq('resolved', false);
    if (filter === 'critical') query = query.eq('severity', 'critical').eq('resolved', false);
    const { data } = await query;
    const alertsRaw = data || [];

    const userIds = Array.from(new Set(alertsRaw.map(a => a.user_id).filter(Boolean) as string[]));
    let profilesMap: Record<string, { email: string | null; full_name: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      profilesMap = (profilesData || []).reduce((acc, p: any) => {
        acc[p.id] = { email: p.email, full_name: p.full_name };
        return acc;
      }, {} as Record<string, { email: string | null; full_name: string | null }>);
    }

    setAlerts(alertsRaw.map(a => ({
      ...a,
      user_email: a.user_id ? profilesMap[a.user_id]?.email || null : null,
      user_name: a.user_id ? profilesMap[a.user_id]?.full_name || null : null,
    })));
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resolveAlert = async (id: string) => {
    await supabase.from('system_alerts').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
    showToast('Alerte marquée comme résolue');
    fetchAlerts();
  };

  const resolveAll = async () => {
    await supabase.from('system_alerts').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('resolved', false);
    showToast('Toutes les alertes ont été résolues');
    fetchAlerts();
  };

  const resolveGroup = async (alertIds: string[]) => {
    await supabase.from('system_alerts').update({ resolved: true, resolved_at: new Date().toISOString() }).in('id', alertIds);
    showToast(`${alertIds.length} alerte${alertIds.length > 1 ? 's' : ''} marquée${alertIds.length > 1 ? 's' : ''} comme résolue${alertIds.length > 1 ? 's' : ''}`);
    fetchAlerts();
  };

  // ─── Catégorisation par source ───
  const getCategory = (alert: Alert): 'stripe' | 'analyse' | 'cleanup' | 'autre' => {
    const title = (alert.title || '').toLowerCase();
    const eventType = (alert.metadata?.eventType as string || '').toLowerCase();
    if (title.includes('stripe') || title.includes('webhook') || title.includes('paiement') || title.includes('abonnement') || title.includes('remboursement') || title.includes('upgrade') || eventType.includes('invoice') || eventType.includes('subscription') || eventType.includes('charge') || eventType.includes('checkout')) {
      return 'stripe';
    }
    if (title.includes('analyse') || title.includes('comparaison') || alert.type === 'analysis_failed' || alert.type === 'no_files' || alert.type === 'overload' || alert.type === 'api_billing' || alert.type === 'rate_limit' || alert.type === 'api_error') {
      return 'analyse';
    }
    if (alert.type === 'cleanup_error' || alert.type === 'cleanup_overflow' || alert.type === 'cleanup_failure') {
      return 'cleanup';
    }
    return 'autre';
  };

  // ─── Dictionnaire d'explications (Option C : on enrichit au fil du temps) ───
  const getExplanation = (alert: Alert): { cause: string; impact: string; action: string } | null => {
    const errorMsg = String(alert.metadata?.error || '').toLowerCase();
    const stage = String(alert.metadata?.stage || '').toLowerCase();
    const eventType = String(alert.metadata?.eventType || '').toLowerCase();

    // Erreur date NULL (le bug qu'on a fixé avec getValidPeriods)
    if (errorMsg.includes('null value') && (errorMsg.includes('current_period_end') || errorMsg.includes('current_period_start'))) {
      return {
        cause: 'Stripe a envoyé un event sans timestamps de période (current_period_end null).',
        impact: 'L\'abonnement n\'a pas pu être mis à jour en base de données.',
        action: 'Normalement corrigé via le helper getValidPeriods qui refetch la subscription fraîche. Si l\'erreur revient, vérifier que la version récente du webhook est bien déployée.',
      };
    }

    // Suppression user → contrainte FK
    if (errorMsg.includes('foreign key') || errorMsg.includes('violates foreign')) {
      return {
        cause: 'Le client a été supprimé entre l\'envoi de l\'event par Stripe et son traitement.',
        impact: 'L\'event est ignoré silencieusement. Aucune donnée n\'est corrompue.',
        action: 'Aucune action nécessaire — c\'est un cas normal après suppression d\'un compte. Marquer comme résolu.',
      };
    }

    // Subscription introuvable
    if (errorMsg.includes('subscription not found') || errorMsg.includes('no subscription')) {
      return {
        cause: 'Stripe a envoyé un event sur une subscription qui n\'existe plus dans la BDD.',
        impact: 'L\'event est ignoré. Le client a probablement été supprimé ou la sub a été migrée.',
        action: 'Vérifier dans Stripe Dashboard que la subscription existe encore. Si non, marquer comme résolu.',
      };
    }

    // Event invoice.paid ignoré (le bug qu'on a fixé)
    if (eventType === 'invoice.paid' && stage === 'handler' && errorMsg.includes('ignored')) {
      return {
        cause: 'L\'event invoice.paid n\'était pas géré dans le switch case du webhook.',
        impact: 'Les paiements n\'étaient pas enregistrés dans la table payments.',
        action: 'Corrigé en ajoutant le case invoice.paid. Vérifier que le webhook a bien été redéployé.',
      };
    }

    // JWT expiré
    if (errorMsg.includes('jwt expired') || errorMsg.includes('invalid token')) {
      return {
        cause: 'Le token d\'authentification utilisateur a expiré ou n\'est plus valide.',
        impact: 'L\'action n\'a pas pu être exécutée. Le client a sans doute reçu un message d\'erreur.',
        action: 'Demander au client de se reconnecter. Si l\'erreur revient régulièrement, vérifier la durée de vie des sessions Supabase.',
      };
    }

    // Erreur Claude / Anthropic
    if (errorMsg.includes('anthropic') || errorMsg.includes('claude') || errorMsg.includes('overloaded_error')) {
      return {
        cause: 'L\'API Claude est surchargée ou a renvoyé une erreur.',
        impact: 'L\'analyse a échoué. Si configuré, un crédit a été remboursé automatiquement.',
        action: 'Le système retente automatiquement. Si l\'erreur persiste sur plusieurs analyses, vérifier le statut d\'Anthropic (status.anthropic.com).',
      };
    }

    // Solde API insuffisant
    if (alert.type === 'api_billing' || errorMsg.includes('insufficient credits') || errorMsg.includes('billing')) {
      return {
        cause: 'Le solde de l\'API Anthropic est insuffisant pour exécuter l\'analyse.',
        impact: 'Bloquant — toutes les analyses échoueront jusqu\'à rechargement.',
        action: 'Recharger le compte Anthropic dans la console (console.anthropic.com → Billing).',
      };
    }

    // Rate limit
    if (alert.type === 'rate_limit' || errorMsg.includes('rate limit') || errorMsg.includes('429')) {
      return {
        cause: 'Trop de requêtes envoyées en peu de temps à l\'API.',
        impact: 'Certaines analyses ont été temporairement bloquées et retentées.',
        action: 'Si fréquent, augmenter les limites de rate dans la console Anthropic ou répartir la charge.',
      };
    }

    // Aucun fichier
    if (alert.type === 'no_files') {
      return {
        cause: 'L\'utilisateur a lancé une analyse sans fournir de fichiers.',
        impact: 'L\'analyse n\'a pas pu démarrer.',
        action: 'Cas normal côté utilisateur. Marquer comme résolu.',
      };
    }

    // Erreur sauvegarde
    if (alert.type === 'save_error' && errorMsg.includes('insert')) {
      return {
        cause: 'Une opération d\'insertion en BDD a échoué (probablement un conflit ou une contrainte).',
        impact: 'Données potentiellement non enregistrées. Vérifier l\'impact selon le contexte.',
        action: 'Examiner le détail technique ci-dessous pour identifier le champ en cause.',
      };
    }

    return null;
  };

  // ─── Regroupement par signature ───
  const filteredAlerts = activeCategory === 'all' ? alerts : alerts.filter(a => getCategory(a) === activeCategory);

  const groups = (() => {
    const map = new Map<string, { key: string; title: string; type: string; severity: string; category: string; alerts: Alert[] }>();
    filteredAlerts.forEach(a => {
      const key = `${a.type}::${a.title}`;
      if (!map.has(key)) {
        map.set(key, { key, title: a.title, type: a.type, severity: a.severity, category: getCategory(a), alerts: [] });
      }
      map.get(key)!.alerts.push(a);
    });
    return Array.from(map.values()).sort((a, b) => {
      const aLast = new Date(a.alerts[0].created_at).getTime();
      const bLast = new Date(b.alerts[0].created_at).getTime();
      return bLast - aLast;
    });
  })();

  // Compteurs par catégorie (sur les alertes filtrées par statut, avant filtre catégorie)
  const counts = {
    all: alerts.length,
    stripe: alerts.filter(a => getCategory(a) === 'stripe').length,
    analyse: alerts.filter(a => getCategory(a) === 'analyse').length,
    cleanup: alerts.filter(a => getCategory(a) === 'cleanup').length,
    autre: alerts.filter(a => getCategory(a) === 'autre').length,
  };

  const severityConfig: Record<string, { bg: string; border: string; icon: string; color: string; barColor: string }> = {
    critical: { bg: '#fef2f2', border: '#fecaca', icon: '🔴', color: '#dc2626', barColor: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '🟡', color: '#d97706', barColor: '#f59e0b' },
    info: { bg: '#eff6ff', border: '#bfdbfe', icon: '🔵', color: '#2563eb', barColor: '#3b82f6' },
  };

  const typeLabels: Record<string, string> = {
    api_billing: 'Solde API',
    rate_limit: 'Rate limit',
    overload: 'Surcharge serveur',
    api_error: 'Erreur API',
    analysis_failed: 'Échec analyse',
    save_error: 'Erreur sauvegarde',
    unexpected_error: 'Erreur inattendue',
    no_files: 'Fichiers manquants',
    refund: 'Remboursement',
  };

  const categoryConfig = {
    all: { label: 'Toutes', icon: '📋', color: '#0f2d3d', bg: '#fff' },
    stripe: { label: 'Stripe', icon: '💳', color: '#6366f1', bg: '#eef2ff' },
    analyse: { label: 'Analyse', icon: '🤖', color: '#16a34a', bg: '#f0fdf4' },
    cleanup: { label: 'Cleanup', icon: '🧹', color: '#0891b2', bg: '#ecfeff' },
    autre: { label: 'Autre', icon: '🔧', color: '#64748b', bg: '#f1f5f9' },
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleAlertDetail = (id: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Alertes système</h2>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Erreurs API, remboursements automatiques, problèmes techniques</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['unresolved', 'critical', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: filter === f ? '1.5px solid #2a7d9c' : '1px solid #e2e8f0', background: filter === f ? '#f0f7fb' : '#fff', color: filter === f ? '#2a7d9c' : '#64748b' }}>
              {f === 'unresolved' ? 'Non résolues' : f === 'critical' ? '🔴 Critiques' : 'Toutes'}
            </button>
          ))}
          {alerts.some(a => !a.resolved) && (
            <button onClick={resolveAll}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d' }}>
              ✓ Tout résoudre
            </button>
          )}
        </div>
      </div>

      {/* Onglets catégories */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' as const, padding: 5, background: '#f8fafc', borderRadius: 12, border: '1px solid #edf2f7' }}>
        {(['all', 'stripe', 'analyse', 'cleanup', 'autre'] as const).map(cat => {
          const c = categoryConfig[cat];
          const count = counts[cat];
          const active = activeCategory === cat;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{
                flex: 1, minWidth: 140, padding: '10px 14px', borderRadius: 9,
                background: active ? c.bg : 'transparent',
                border: `1.5px solid ${active ? c.color : 'transparent'}`,
                color: active ? c.color : '#64748b',
                fontSize: 13, fontWeight: active ? 800 : 600, cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: active ? `0 1px 3px ${c.color}20` : 'none',
              }}>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span>{c.label}</span>
              <span style={{
                padding: '1px 8px', borderRadius: 100, fontSize: 11, fontWeight: 800,
                background: active ? c.color : '#e2e8f0',
                color: active ? '#fff' : '#64748b',
                minWidth: 20, textAlign: 'center' as const,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ textAlign: 'center' as const, padding: 40, color: '#94a3b8' }}>Chargement...</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center' as const, padding: 60, background: '#fff', borderRadius: 14, border: '1px solid #edf2f7' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Aucune alerte {filter === 'unresolved' ? 'en attente' : filter === 'critical' ? 'critique' : ''}
            {activeCategory !== 'all' && ` dans "${categoryConfig[activeCategory].label}"`}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Tout fonctionne normalement</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          {groups.map(group => {
            const sev = severityConfig[group.severity] || severityConfig.info;
            const cat = categoryConfig[group.category as 'stripe' | 'analyse' | 'cleanup' | 'autre'] || categoryConfig.autre;
            const isExpanded = expandedGroups.has(group.key);
            const occurrenceCount = group.alerts.length;
            const lastOccurrence = group.alerts[0];
            const firstOccurrence = group.alerts[group.alerts.length - 1];
            const unresolvedInGroup = group.alerts.filter(a => !a.resolved).map(a => a.id);

            // Clients impactés uniques
            const clients = Array.from(new Set(group.alerts.map(a => a.user_email || (a.metadata?.customerInfo as string) || null).filter(Boolean)));

            return (
              <div key={group.key} style={{
                background: '#fff', borderRadius: 14,
                border: `1.5px solid ${isExpanded ? sev.barColor + '40' : '#edf2f7'}`,
                overflow: 'hidden' as const, transition: 'all 0.2s',
                boxShadow: isExpanded ? `0 4px 12px ${sev.barColor}15` : 'none',
              }}>
                {/* En-tête du groupe (cliquable) */}
                <div onClick={() => toggleGroup(group.key)}
                  style={{
                    padding: '14px 18px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 14, transition: 'background 0.15s',
                    background: isExpanded ? sev.bg + '40' : '#fff',
                  }}
                  onMouseOver={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = '#fafbfc'; }}
                  onMouseOut={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = '#fff'; }}>
                  {/* Barre colorée à gauche */}
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: sev.barColor, flexShrink: 0 }} />

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{group.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: cat.bg, color: cat.color, border: `1px solid ${cat.color}25` }}>
                        {cat.icon} {cat.label}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#64748b' }}>
                        {typeLabels[group.type] || group.type}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 100,
                        background: sev.barColor, color: '#fff',
                      }}>{occurrenceCount} occurrence{occurrenceCount > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#94a3b8', flexWrap: 'wrap' as const }}>
                      <span>Dernière : <strong style={{ color: '#475569' }}>{fmtDate(lastOccurrence.created_at)}</strong></span>
                      {occurrenceCount > 1 && (
                        <span>Première : {fmtDate(firstOccurrence.created_at)}</span>
                      )}
                      {clients.length > 0 && (
                        <span>👤 {clients.length} client{clients.length > 1 ? 's' : ''} impacté{clients.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {unresolvedInGroup.length > 0 && (
                      <button onClick={e => { e.stopPropagation(); resolveGroup(unresolvedInGroup); }}
                        style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d', whiteSpace: 'nowrap' as const }}>
                        ✓ Résoudre {unresolvedInGroup.length > 1 ? `(${unresolvedInGroup.length})` : ''}
                      </button>
                    )}
                    <span style={{ fontSize: 18, color: '#94a3b8', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>›</span>
                  </div>
                </div>

                {/* Détail du groupe (déplié) */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #edf2f7', background: '#fafbfc' }}>
                    {group.alerts.map((alert, idx) => {
                      const isDetailOpen = expandedAlerts.has(alert.id);
                      const explanation = getExplanation(alert);
                      const errorMsg = alert.metadata?.error as string | undefined;
                      const eventType = alert.metadata?.eventType as string | undefined;
                      const eventId = alert.metadata?.eventId as string | undefined;
                      const stage = alert.metadata?.stage as string | undefined;

                      return (
                        <div key={alert.id} style={{
                          padding: '14px 18px', paddingLeft: 32,
                          borderBottom: idx < group.alerts.length - 1 ? '1px solid #edf2f7' : 'none',
                          opacity: alert.resolved ? 0.55 : 1,
                          transition: 'opacity 0.2s',
                        }}>
                          {/* Ligne principale */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' as const }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                                  {fmtDate(alert.created_at)}
                                </span>
                                {alert.resolved && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d', background: '#f0fdf4', padding: '2px 8px', borderRadius: 100, border: '1px solid #bbf7d0' }}>
                                    ✓ Résolu
                                  </span>
                                )}
                              </div>
                              {alert.message && (
                                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 6 }}>{alert.message}</p>
                              )}
                              {(alert.user_name || alert.user_email) ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#0f2d3d', background: '#f0f7fb', border: '1px solid #bae3f5', padding: '3px 9px', borderRadius: 6, marginRight: 6 }}>
                                  👤 {alert.user_name || 'Sans nom'}
                                  {alert.user_email && <span style={{ color: '#64748b', fontWeight: 500 }}>· {alert.user_email}</span>}
                                </div>
                              ) : alert.metadata?.customerInfo ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#78350f', background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 9px', borderRadius: 6, marginRight: 6 }}>
                                  👤 {String(alert.metadata.customerInfo)}
                                  <span style={{ color: '#a16207', fontWeight: 500 }}>· (non rattaché)</span>
                                </div>
                              ) : null}
                            </div>

                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <button onClick={() => toggleAlertDetail(alert.id)}
                                style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', whiteSpace: 'nowrap' as const }}>
                                {isDetailOpen ? '− Masquer' : '+ Détails'}
                              </button>
                              {!alert.resolved && (
                                <button onClick={() => resolveAlert(alert.id)}
                                  style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d', whiteSpace: 'nowrap' as const }}>
                                  ✓ Résoudre
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Bloc détails (déplié) */}
                          {isDetailOpen && (
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                              {/* Explication humaine */}
                              {explanation && (
                                <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0f7fb', border: '1.5px solid #bae3f5' }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0c4a6e', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                                    💡 Explication
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, fontSize: 12.5, lineHeight: 1.5 }}>
                                    <div><strong style={{ color: '#0f2d3d' }}>Cause :</strong> <span style={{ color: '#475569' }}>{explanation.cause}</span></div>
                                    <div><strong style={{ color: '#0f2d3d' }}>Impact :</strong> <span style={{ color: '#475569' }}>{explanation.impact}</span></div>
                                    <div><strong style={{ color: '#0f2d3d' }}>Action recommandée :</strong> <span style={{ color: '#475569' }}>{explanation.action}</span></div>
                                  </div>
                                </div>
                              )}

                              {/* Détail technique */}
                              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#0f172a', border: '1.5px solid #1e293b' }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                                  🔧 Détail technique
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, fontSize: 11.5, fontFamily: 'monospace', color: '#e2e8f0' }}>
                                  {stage && <div><span style={{ color: '#94a3b8' }}>stage :</span> <span style={{ color: '#7dd3fc' }}>{stage}</span></div>}
                                  {eventType && <div><span style={{ color: '#94a3b8' }}>event_type :</span> <span style={{ color: '#7dd3fc' }}>{eventType}</span></div>}
                                  {eventId && <div><span style={{ color: '#94a3b8' }}>event_id :</span> <span style={{ color: '#7dd3fc' }}>{eventId}</span></div>}
                                  {errorMsg && (
                                    <div style={{ marginTop: 6, padding: '8px 10px', background: '#1e293b', borderRadius: 6, color: '#fda4af', wordBreak: 'break-all' as const }}>
                                      <span style={{ color: '#94a3b8', fontWeight: 700 }}>error :</span> {errorMsg}
                                    </div>
                                  )}
                                  {alert.analyse_id && <div style={{ marginTop: 4 }}><span style={{ color: '#94a3b8' }}>analyse_id :</span> <span style={{ color: '#7dd3fc' }}>{alert.analyse_id}</span></div>}
                                  {alert.metadata && Object.keys(alert.metadata).filter(k => !['stage', 'eventType', 'eventId', 'error'].includes(k)).length > 0 && (
                                    <details style={{ marginTop: 8 }}>
                                      <summary style={{ cursor: 'pointer', color: '#94a3b8', fontWeight: 700 }}>Voir toutes les metadata ({Object.keys(alert.metadata).length} champs)</summary>
                                      <pre style={{ marginTop: 6, padding: 8, background: '#1e293b', borderRadius: 6, fontSize: 10.5, overflow: 'auto' as const, color: '#cbd5e1' }}>
{JSON.stringify(alert.metadata, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════
   ADMIN — SUPPORT TICKETS
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   ADMIN — SUPPORT TICKETS (Inbox split by user)
══════════════════════════════════════════ */
function AdminSupportTab({ showToast, onUnreadChange, onGoToUser }: { showToast: (m: string) => void; onUnreadChange: (n: number) => void; onGoToUser?: (userId: string) => void }) {
  type AdminTicket = { id: string; user_id: string; subject: string; status: 'open' | 'resolved'; created_at: string; updated_at: string; resolved_at: string | null; unread_by_admin: boolean; user_email?: string; user_name?: string; user_role?: string };
  type AdminMessage = { id: string; ticket_id: string; sender_type: 'user' | 'admin'; sender_name?: string | null; message: string; created_at: string };
  type UserGroup = { user_id: string; user_name: string; user_email: string; user_role: string; tickets: AdminTicket[]; lastActivity: string; unreadCount: number; lastPreview: string };

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [reply, setReply] = useState('');
  const [replyName, setReplyName] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'archived'>('open');
  const [search, setSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});

  const loadTickets = useCallback(async () => {
    const { data } = await supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
    if (!data) { setLoading(false); return; }
    const userIds = [...new Set(data.map((t: Record<string, unknown>) => t.user_id as string))];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, role, email').in('id', userIds);
    const enriched = data.map((t: Record<string, unknown>) => {
      const profile = profiles?.find((p: Record<string, unknown>) => p.id === t.user_id);
      return { ...t, user_email: (profile as Record<string, unknown>)?.email || '?', user_name: (profile as Record<string, unknown>)?.full_name || '?', user_role: (profile as Record<string, unknown>)?.role || 'particulier' } as AdminTicket;
    });
    setTickets(enriched);
    onUnreadChange(enriched.filter((t: AdminTicket) => t.unread_by_admin).length);

    // Load last message preview for each ticket
    const previews: Record<string, string> = {};
    for (const t of enriched) {
      const { data: msgs } = await supabase.from('support_messages').select('message, sender_type').eq('ticket_id', t.id).order('created_at', { ascending: false }).limit(1);
      if (msgs && msgs.length > 0) previews[t.id] = ((msgs[0] as Record<string, unknown>).message as string || '').slice(0, 60);
    }
    setLastMessages(previews);
    setLoading(false);
  }, [onUnreadChange]);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => { const i = setInterval(loadTickets, 15000); return () => clearInterval(i); }, [loadTickets]);

  const loadMessages = useCallback(async (ticketId: string) => {
    const { data } = await supabase.from('support_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessages((data || []) as AdminMessage[]);
    await supabase.from('support_tickets').update({ unread_by_admin: false }).eq('id', ticketId);
    loadTickets();
  }, [loadTickets]);

  useEffect(() => { if (selectedTicketId) loadMessages(selectedTicketId); }, [selectedTicketId, loadMessages]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicketId) return;
    setSending(true);
    await supabase.from('support_messages').insert({ ticket_id: selectedTicketId, sender_type: 'admin', message: reply.trim(), sender_name: replyName.trim() || 'Verimo' });
    await supabase.from('support_tickets').update({ unread_by_user: true, unread_by_admin: false }).eq('id', selectedTicketId);
    setReply('');
    await loadMessages(selectedTicketId);
    setSending(false);
    showToast('Réponse envoyée');
  };

  const handleResolve = async (ticketId: string) => {
    await supabase.from('support_tickets').update({ status: 'resolved', resolved_at: new Date().toISOString(), unread_by_user: true }).eq('id', ticketId);
    await supabase.from('support_messages').insert({ ticket_id: ticketId, sender_type: 'admin', message: '✅ Ce ticket a été marqué comme résolu. Si vous avez d\'autres questions, n\'hésitez pas à ouvrir un nouveau ticket.', sender_name: replyName.trim() || 'Verimo' });
    if (selectedTicketId === ticketId) await loadMessages(ticketId);
    await loadTickets();
    showToast('Ticket résolu — synchronisé côté client');
  };

  const handleDelete = async (ticketId: string) => {
    await supabase.from('support_messages').delete().eq('ticket_id', ticketId);
    await supabase.from('support_tickets').delete().eq('id', ticketId);
    if (selectedTicketId === ticketId) { setSelectedTicketId(null); setMessages([]); }
    setShowDeleteConfirm(null);
    await loadTickets();
    showToast('Ticket supprimé définitivement');
  };

  const handleArchive = async (ticketId: string) => {
    await supabase.from('support_tickets').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', ticketId);
    if (selectedTicketId === ticketId) { setSelectedTicketId(null); setMessages([]); }
    await loadTickets();
    showToast('Ticket archivé');
  };

  const fmtRelative = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return 'à l\'instant';
    if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };
  const fmtFull = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Group tickets by user
  const userGroups: UserGroup[] = useMemo(() => {
    const grouped: Record<string, UserGroup> = {};
    tickets.forEach((t: AdminTicket) => {
      if (!grouped[t.user_id]) {
        grouped[t.user_id] = { user_id: t.user_id, user_name: t.user_name || '?', user_email: t.user_email || '?', user_role: t.user_role || 'particulier', tickets: [], lastActivity: t.updated_at, unreadCount: 0, lastPreview: '' };
      }
      grouped[t.user_id].tickets.push(t);
      if (t.unread_by_admin) grouped[t.user_id].unreadCount++;
      if (new Date(t.updated_at) > new Date(grouped[t.user_id].lastActivity)) {
        grouped[t.user_id].lastActivity = t.updated_at;
      }
    });
    // Set last preview from the most recent ticket
    Object.values(grouped).forEach(g => {
      const mostRecent = g.tickets[0];
      if (mostRecent) g.lastPreview = lastMessages[mostRecent.id] || mostRecent.subject;
    });
    return Object.values(grouped).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [tickets, lastMessages]);

  // Filter
  const filteredGroups = userGroups.filter(g => {
    if (filter === 'open') return g.tickets.some((t: AdminTicket) => t.status === 'open');
    if (filter === 'resolved') return g.tickets.every((t: AdminTicket) => t.status === 'resolved');
    return true;
  }).filter(g => {
    if (!search) return true;
    const s = search.toLowerCase();
    return g.user_name.toLowerCase().includes(s) || g.user_email.toLowerCase().includes(s);
  });

  const selectedUser = userGroups.find(g => g.user_id === selectedUserId);
  const selectedTicket = selectedUser?.tickets.find((t: AdminTicket) => t.id === selectedTicketId);
  const unreadTotal = tickets.filter((t: AdminTicket) => t.unread_by_admin).length;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 110px)', borderRadius: 16, overflow: 'hidden', border: '1px solid #edf2f7', background: '#fff' }}>
      {/* ─── LEFT PANEL : Users ─── */}
      <div style={{ width: 300, borderRight: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#fff' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', flex: 1 }}>Support</span>
          {unreadTotal > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 10 }}>{unreadTotal} non lu{unreadTotal > 1 ? 's' : ''}</span>}
        </div>
        <div style={{ display: 'flex', gap: 1, padding: '6px 8px', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
          {([['open', 'En cours'], ['resolved', 'Résolus'], ['all', 'Tous']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ flex: 1, textAlign: 'center', padding: '5px 0', fontSize: 11, fontWeight: 700, color: filter === id ? '#0f172a' : '#94a3b8', borderRadius: 6, cursor: 'pointer', background: filter === id ? '#fff' : 'transparent', border: filter === id ? '1px solid #edf2f7' : 'none', boxShadow: filter === id ? '0 1px 3px rgba(0,0,0,0.04)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ padding: '6px 8px', borderBottom: '1px solid #edf2f7' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client…" style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #edf2f7', fontSize: 12, background: '#f8fafc', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredGroups.length === 0 && <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Aucun client.</div>}
          {filteredGroups.map(g => {
            const isSelected = g.user_id === selectedUserId;
            const hasUnread = g.unreadCount > 0;
            return (
              <button key={g.user_id} onClick={() => { setSelectedUserId(g.user_id); const firstOpen = g.tickets.find((t: AdminTicket) => t.status === 'open') || g.tickets[0]; if (firstOpen) setSelectedTicketId(firstOpen.id); }}
                style={{ display: 'flex', gap: 10, padding: '12px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', width: '100%', textAlign: 'left', background: isSelected ? '#f0f7fb' : hasUnread ? 'rgba(42,125,156,0.03)' : '#fff', borderLeft: isSelected ? '3px solid #2a7d9c' : '3px solid transparent', border: 'none', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#f1f5f9', borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: isSelected ? '#2a7d9c' : 'transparent', transition: 'background 0.15s', fontFamily: 'inherit', position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {(g.user_name.charAt(0) || '?').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: hasUnread ? 800 : 600, color: '#0f172a' }}>{g.user_name}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 5, background: g.user_role === 'pro' ? '#f0fdf4' : '#f0f7fb', color: g.user_role === 'pro' ? '#16a34a' : '#2a7d9c' }}>{g.user_role === 'pro' ? 'PRO' : 'PART.'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: hasUnread ? '#0f172a' : '#94a3b8', fontWeight: hasUnread ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{g.lastPreview}</div>
                  <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 1 }}>{g.tickets.length} ticket{g.tickets.length > 1 ? 's' : ''}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{fmtRelative(g.lastActivity)}</span>
                  {hasUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c' }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── RIGHT PANEL : Conversation ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
        {!selectedUser ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94a3b8' }}>
            <MessageSquare size={32} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: 14 }}>Sélectionnez un client pour voir la conversation</span>
          </motion.div>
        ) : (
          <motion.div key={selectedUserId + '-' + selectedTicketId} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(selectedUser.user_name.charAt(0) || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedUser.user_name}
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 5, background: selectedUser.user_role === 'pro' ? '#f0fdf4' : '#f0f7fb', color: selectedUser.user_role === 'pro' ? '#16a34a' : '#2a7d9c' }}>{selectedUser.user_role === 'pro' ? 'PRO' : 'PART.'}</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>{selectedUser.user_email}</span>
                  {onGoToUser && <>
                    <span>·</span>
                    <button onClick={() => onGoToUser(selectedUser.user_id)} style={{ fontSize: 11, color: '#2a7d9c', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                      → Voir la fiche client
                    </button>
                  </>}
                </div>
              </div>
              {/* Ticket selector */}
              {selectedUser.tickets.length > 1 && (
                <select value={selectedTicketId || ''} onChange={e => setSelectedTicketId(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #edf2f7', fontSize: 11, fontWeight: 600, color: '#0f172a', background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {selectedUser.tickets.map((t: AdminTicket) => (
                    <option key={t.id} value={t.id}>{t.subject} {t.status === 'open' ? '● ' : '✓ '}{fmtRelative(t.updated_at)}</option>
                  ))}
                </select>
              )}
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {selectedTicket?.status === 'open' && (
                  <button onClick={() => handleResolve(selectedTicket.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: '#fff', border: '1px solid #bbf7d0', color: '#16a34a', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                    <CheckCircle size={12} /> Résoudre
                  </button>
                )}
                <button onClick={() => selectedTicketId && handleArchive(selectedTicketId)}
                  style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }} title="Archiver">
                  📦
                </button>
                <button onClick={() => selectedTicketId && setShowDeleteConfirm(selectedTicketId)}
                  style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }} title="Supprimer">
                  ✕
                </button>
              </div>
            </div>

            {/* Ticket info bar */}
            {selectedTicket && (
              <div style={{ padding: '6px 16px', background: '#f8fafc', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexShrink: 0 }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedTicket.subject}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: selectedTicket.status === 'open' ? '#fffbeb' : '#f0fdf4', color: selectedTicket.status === 'open' ? '#d97706' : '#16a34a' }}>
                  {selectedTicket.status === 'open' ? '● En cours' : '✓ Résolu'}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>Ouvert le {fmtFull(selectedTicket.created_at)}</span>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, padding: 16, minHeight: 0, background: '#f8fafc' }}>
              {messages.map((m: AdminMessage) => {
                const isAdmin = m.sender_type === 'admin';
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 8, maxWidth: '80%', alignSelf: isAdmin ? 'flex-end' : 'flex-start', flexDirection: isAdmin ? 'row-reverse' : 'row' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2, background: isAdmin ? '#0f2d3d' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: isAdmin ? '1.5px solid #1a4a60' : 'none' }}>
                      {isAdmin ? (m.sender_name || 'V').charAt(0).toUpperCase() : (selectedUser.user_name.charAt(0) || '?').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ padding: '10px 14px', borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: isAdmin ? 'linear-gradient(135deg, #0f2d3d, #1a4a60)' : '#fff', color: isAdmin ? '#fff' : '#0f172a', border: isAdmin ? 'none' : '1px solid #edf2f7', fontSize: 13, lineHeight: 1.6, boxShadow: isAdmin ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontWeight: 600 }}>{isAdmin ? (m.sender_name || 'Verimo') : selectedUser.user_name}</span>
                        <span>·</span>
                        <span>{fmtFull(m.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {selectedTicket?.status === 'resolved' && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 16px', borderRadius: 100 }}>✓ Ticket résolu</span>
                </div>
              )}
            </div>

            {/* Reply bar */}
            {selectedTicket?.status === 'open' && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #edf2f7', alignItems: 'center', flexShrink: 0 }}>
                <input value={replyName} onChange={e => setReplyName(e.target.value)} placeholder="Prénom"
                  style={{ width: 80, padding: '9px 10px', borderRadius: 20, border: '1px solid #edf2f7', fontSize: 11, background: '#f8fafc', outline: 'none', fontFamily: 'inherit', color: '#64748b' }} />
                <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Votre réponse…"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  style={{ flex: 1, padding: '9px 16px', borderRadius: 20, border: '1px solid #edf2f7', fontSize: 13, background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={handleReply} disabled={sending || !reply.trim()}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: !reply.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: !reply.trim() ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                  <Send size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,45,61,0.5)', padding: 20, backdropFilter: 'blur(3px)' }}
            onClick={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, padding: '32px 28px', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #fecaca' }}>
                <Trash2 size={24} style={{ color: '#dc2626' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Supprimer ce ticket ?</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
                Cette action est irréversible. Le ticket et tous ses messages seront définitivement supprimés.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setShowDeleteConfirm(null)}
                  style={{ padding: '10px 20px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
                  Annuler
                </button>
                <button onClick={() => handleDelete(showDeleteConfirm)}
                  style={{ padding: '10px 20px', borderRadius: 10, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN — SUGGESTIONS
══════════════════════════════════════════ */
function AdminSuggestionsTab({ onGoToUser, showToast, onUnreadChange }: { onGoToUser?: (userId: string) => void; showToast: (m: string) => void; onUnreadChange?: (n: number) => void }) {
  type Suggestion = { id: string; user_id: string; message: string; category: string | null; created_at: string; acknowledged: boolean; archived: boolean; user_email?: string; user_name?: string };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'acknowledged' | 'archived'>('pending');

  const loadSuggestions = useCallback(async () => {
    const { data } = await supabase.from('pro_suggestions').select('*').order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }
    const userIds = [...new Set(data.map((s: Record<string, unknown>) => s.user_id as string))];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
    const enriched = data.map((s: Record<string, unknown>) => {
      const profile = profiles?.find((p: Record<string, unknown>) => p.id === s.user_id);
      return { ...s, user_email: (profile as Record<string, unknown>)?.email || '?', user_name: (profile as Record<string, unknown>)?.full_name || '?', archived: !!(s as Record<string, unknown>).archived } as Suggestion;
    });
    setSuggestions(enriched);
    if (onUnreadChange) onUnreadChange(enriched.filter((s: Suggestion) => !s.acknowledged && !s.archived).length);
    setLoading(false);
  }, [onUnreadChange]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  const handleAcknowledge = async (s: Suggestion) => {
    await supabase.from('pro_suggestions').update({ acknowledged: true }).eq('id', s.id);
    await supabase.from('user_notifications').insert({
      user_id: s.user_id,
      title: 'Suggestion prise en compte',
      message: 'Votre suggestion a bien été lue et prise en compte par notre équipe. Merci pour votre retour, il nous aide à améliorer Verimo !',
    });
    showToast('Pris en compte — notification envoyée');
    loadSuggestions();
  };

  const handleArchive = async (s: Suggestion) => {
    await supabase.from('pro_suggestions').update({ archived: true }).eq('id', s.id);
    showToast('Suggestion archivée');
    loadSuggestions();
  };

  const handleDelete = async (s: Suggestion) => {
    await supabase.from('pro_suggestions').delete().eq('id', s.id);
    showToast('Suggestion supprimée');
    loadSuggestions();
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const filtered = filter === 'pending' ? suggestions.filter(s => !s.acknowledged && !s.archived) : filter === 'acknowledged' ? suggestions.filter(s => s.acknowledged && !s.archived) : suggestions.filter(s => s.archived);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'pending' as const, label: 'En attente', count: suggestions.filter(s => !s.acknowledged && !s.archived).length },
          { id: 'acknowledged' as const, label: 'Prises en compte', count: suggestions.filter(s => s.acknowledged && !s.archived).length },
          { id: 'archived' as const, label: 'Archivées', count: suggestions.filter(s => s.archived).length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: filter === f.id ? '1.5px solid #d97706' : '1px solid #edf2f7', background: filter === f.id ? '#fffbeb' : '#fff', color: filter === f.id ? '#92400e' : '#64748b' }}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune suggestion.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((s: Suggestion) => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 14, border: (s.acknowledged || s.archived) ? '1px solid #edf2f7' : '1.5px solid #f59e0b', padding: '18px 20px', opacity: s.archived ? 0.5 : s.acknowledged ? 0.7 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Lightbulb size={15} style={{ color: '#d97706' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.user_name}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{s.user_email}</span>
                </div>
                {s.category && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#fef3c7', color: '#92400e' }}>{s.category}</span>}
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(s.created_at)}</span>
              </div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{s.message}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {onGoToUser && (
                  <button onClick={() => onGoToUser(s.user_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: '#f0f7fb', border: '1px solid #d0e8f0', color: '#2a7d9c', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    <User size={11} /> Fiche client
                  </button>
                )}
                {!s.acknowledged && !s.archived && (
                  <button onClick={() => handleAcknowledge(s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                    <CheckCircle size={12} /> Pris en compte
                  </button>
                )}
                {s.acknowledged && !s.archived && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={12} /> Pris en compte
                  </span>
                )}
                {!s.archived && (
                  <button onClick={() => handleArchive(s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    <ArrowRight size={11} /> Archiver
                  </button>
                )}
                <button onClick={() => handleDelete(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 600, marginLeft: 'auto' }}>
                  <Trash2 size={11} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 🆕 ADMIN CALLBACKS TAB — Page de gestion des demandes de rappel pro
// ════════════════════════════════════════════════════════════════════
type CallbackRequest = {
  id: string;
  user_id: string;
  phone: string;
  preferred_slots: string[];
  message: string | null;
  context: string;
  status: 'pending' | 'called' | 'converted' | 'declined';
  created_at: string;
  handled_at: string | null;
  handled_by: string | null;
  admin_notes: string | null;
};

type CallbackWithProfile = CallbackRequest & {
  profile?: {
    id: string;
    email: string | null;
    full_name: string | null;
    pro_company_name: string | null;
    pro_profile_type: string | null;
    pro_status: string | null;
    role: string | null;
  } | null;
};

const SLOT_LABELS_ADMIN: Record<string, string> = {
  matinee: 'Matinée',
  dejeuner: 'Déjeuner',
  apres_midi: 'Après-midi',
  soiree: 'Soirée',
};

const CONTEXT_LABELS_ADMIN: Record<string, string> = {
  demo_expired: 'Démo épuisée',
  abonnement_agence: 'Forfait agence',
  other: 'Autre',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#854F0B', bg: '#fef3c7' },
  called: { label: 'Rappelé', color: '#1e40af', bg: '#dbeafe' },
  converted: { label: 'Converti ✓', color: '#166534', bg: '#dcfce7' },
  declined: { label: 'Pas intéressé', color: '#64748b', bg: '#f1f5f9' },
};

function AdminCallbacksTab({ showToast, onPendingChange, onGoToUser, onGoToProClient }: {
  showToast: (m: string) => void;
  onPendingChange?: (n: number) => void;
  onGoToUser?: (userId: string) => void;
  onGoToProClient?: (userId: string) => void;
}) {
  const [callbacks, setCallbacks] = useState<CallbackWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'called' | 'converted' | 'declined' | 'all'>('pending');
  const [selected, setSelected] = useState<CallbackWithProfile | null>(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchCallbacks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('callback_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Hydrater avec les profils
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      let profilesById: Record<string, CallbackWithProfile['profile']> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, pro_company_name, pro_profile_type, pro_status, role')
          .in('id', userIds);
        if (profiles) {
          profilesById = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, CallbackWithProfile['profile']>);
        }
      }

      const enriched: CallbackWithProfile[] = (data || []).map(c => ({
        ...c,
        profile: profilesById[c.user_id] || null,
      }));
      setCallbacks(enriched);
      const pending = enriched.filter(c => c.status === 'pending').length;
      onPendingChange?.(pending);
    } catch (err) {
      console.error('[AdminCallbacksTab] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [onPendingChange]);

  useEffect(() => { fetchCallbacks(); }, [fetchCallbacks]);

  const filtered = filter === 'all' ? callbacks : callbacks.filter(c => c.status === filter);

  const updateStatus = async (cb: CallbackWithProfile, newStatus: CallbackRequest['status']) => {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('callback_requests')
        .update({
          status: newStatus,
          handled_at: newStatus !== 'pending' ? new Date().toISOString() : null,
          handled_by: newStatus !== 'pending' ? user?.id : null,
          admin_notes: notes || cb.admin_notes,
        })
        .eq('id', cb.id);
      if (error) throw error;
      showToast(`Statut mis à jour : ${STATUS_LABELS[newStatus].label}`);
      await fetchCallbacks();
      setSelected(null);
      setNotes('');
    } catch (err) {
      console.error('[AdminCallbacksTab] update error:', err);
      showToast('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (isYesterday) return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Rappels Pro</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            {callbacks.filter(c => c.status === 'pending').length} en attente · {callbacks.length} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {[
            { id: 'pending', label: 'En attente', count: callbacks.filter(c => c.status === 'pending').length },
            { id: 'called', label: 'Rappelés', count: callbacks.filter(c => c.status === 'called').length },
            { id: 'converted', label: 'Convertis ✓', count: callbacks.filter(c => c.status === 'converted').length },
            { id: 'declined', label: 'Pas intéressés', count: callbacks.filter(c => c.status === 'declined').length },
            { id: 'all', label: 'Tous', count: callbacks.length },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as typeof filter)}
              style={{ padding: '7px 12px', borderRadius: 10, border: `1.5px solid ${filter === f.id ? '#2a7d9c' : '#edf2f7'}`, background: filter === f.id ? '#f0f7fb' : '#fff', color: filter === f.id ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filter === f.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
              {f.label} {f.count > 0 ? `(${f.count})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* Liste */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' as const, color: '#94a3b8' }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '52px 32px', textAlign: 'center' as const, color: '#94a3b8' }}>
              <Phone size={36} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun rappel {filter !== 'all' ? `dans "${filter}"` : ''}</div>
            </div>
          ) : filtered.map((cb, i) => {
            const status = STATUS_LABELS[cb.status];
            const userLabel = cb.profile?.pro_company_name || cb.profile?.full_name || cb.profile?.email || 'Inconnu';
            return (
              <div key={cb.id} onClick={() => { setSelected(cb); setNotes(cb.admin_notes || ''); }}
                style={{ padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: selected?.id === cb.id ? '#f0f7fb' : '#fff', transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>{userLabel}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, color: status.color, background: status.bg, flexShrink: 0, letterSpacing: '0.04em' }}>
                      {status.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{fmtDate(cb.created_at)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Phone size={11} style={{ color: '#2a7d9c' }} />
                  <a href={`tel:${cb.phone}`} onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: '#2a7d9c', fontWeight: 700, textDecoration: 'none' }}>{cb.phone}</a>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>·</span>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>
                    {(cb.preferred_slots || []).map(s => SLOT_LABELS_ADMIN[s] || s).join(', ') || 'Pas de préférence'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Contexte : <strong style={{ color: '#64748b' }}>{CONTEXT_LABELS_ADMIN[cb.context] || cb.context}</strong>
                  {cb.profile?.pro_profile_type && <> · Type : <strong style={{ color: '#64748b' }}>{cb.profile.pro_profile_type}</strong></>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Détail */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px 24px', maxHeight: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Détails du rappel</h3>
              <button onClick={() => { setSelected(null); setNotes(''); }} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="#64748b" />
              </button>
            </div>

            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.06em' }}>PRO</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                {selected.profile?.pro_company_name || selected.profile?.full_name || 'Inconnu'}
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 8 }}>{selected.profile?.email}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                {selected.profile?.pro_profile_type && (
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', letterSpacing: '0.04em' }}>{selected.profile.pro_profile_type.toUpperCase()}</span>
                )}
                {selected.profile?.pro_status && (
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, color: '#0f2d3d', background: '#e8f4f8', letterSpacing: '0.04em' }}>{selected.profile.pro_status.toUpperCase()}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {onGoToUser && (
                  <button onClick={() => onGoToUser(selected.user_id)} style={{ fontSize: 11.5, fontWeight: 600, color: '#2a7d9c', background: '#f0f7fb', border: '1px solid #d0e8f0', padding: '5px 10px', borderRadius: 7, cursor: 'pointer' }}>
                    Voir l'utilisateur →
                  </button>
                )}
                {onGoToProClient && selected.profile?.role === 'pro' && (
                  <button onClick={() => onGoToProClient(selected.user_id)} style={{ fontSize: 11.5, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #e9d5ff', padding: '5px 10px', borderRadius: 7, cursor: 'pointer' }}>
                    Voir fiche Pro →
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.06em' }}>TÉLÉPHONE</div>
              <a href={`tel:${selected.phone}`} style={{ fontSize: 18, fontWeight: 800, color: '#2a7d9c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Phone size={16} /> {selected.phone}
              </a>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.06em' }}>CRÉNEAUX PRÉFÉRÉS</div>
              <div style={{ fontSize: 13, color: '#0f172a' }}>
                {(selected.preferred_slots || []).length === 0 ? <em style={{ color: '#94a3b8' }}>Aucune préférence</em> :
                  (selected.preferred_slots || []).map(s => SLOT_LABELS_ADMIN[s] || s).join(', ')}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.06em' }}>CONTEXTE</div>
              <div style={{ fontSize: 13, color: '#0f172a' }}>{CONTEXT_LABELS_ADMIN[selected.context] || selected.context}</div>
            </div>

            {selected.message && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.06em' }}>MESSAGE DU PRO</div>
                <div style={{ padding: '12px 14px', background: '#f0f7fb', borderRadius: 10, fontSize: 13, color: '#0f172a', lineHeight: 1.55, borderLeft: '3px solid #2a7d9c' }}>{selected.message}</div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.06em' }}>NOTES INTERNES</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex : Agence de 5 agents à Paris, intéressé par forfait sur mesure, à recontacter mardi."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const, lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {selected.status === 'pending' && (
                <button disabled={updating} onClick={() => updateStatus(selected, 'called')} style={{ padding: '9px 14px', borderRadius: 9, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  📞 Marquer rappelé
                </button>
              )}
              {(selected.status === 'pending' || selected.status === 'called') && (
                <>
                  <button disabled={updating} onClick={() => updateStatus(selected, 'converted')} style={{ padding: '9px 14px', borderRadius: 9, background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                    ✓ Converti
                  </button>
                  <button disabled={updating} onClick={() => updateStatus(selected, 'declined')} style={{ padding: '9px 14px', borderRadius: 9, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                    Pas intéressé
                  </button>
                </>
              )}
              {selected.status !== 'pending' && (
                <button disabled={updating} onClick={() => updateStatus(selected, 'pending')} style={{ padding: '9px 14px', borderRadius: 9, background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  ↺ Repasser en attente
                </button>
              )}
            </div>

            {selected.handled_at && (
              <div style={{ marginTop: 14, fontSize: 11, color: '#94a3b8' }}>
                Traité le {new Date(selected.handled_at).toLocaleString('fr-FR')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BannerTab({ showToast, logAction }: { showToast: (m: string) => void; logAction: (a: string, t?: string) => Promise<void> }) {
  type BannerAudience = 'all' | 'pro' | 'particulier' | 'specific';
  type Banner = {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    audience: BannerAudience;
    target_user_id: string | null;
    target_user_label?: string | null; // hydraté côté front (nom/email du user ciblé)
    active: boolean;
    created_at: string;
  };

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Form state (création OU édition) ─────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'success'>('info');
  const [audience, setAudience] = useState<BannerAudience>('all');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetUserLabel, setTargetUserLabel] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<Array<{ id: string; email: string; full_name: string | null; role: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const COLORS: Record<'info' | 'warning' | 'success', { bg: string; border: string; color: string; label: string }> = {
    info: { bg: '#f0f7fb', border: '#bae3f5', color: '#2a7d9c', label: 'ℹ️ Information' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', label: '⚠️ Avertissement' },
    success: { bg: '#f0fdf4', border: '#86efac', color: '#16a34a', label: '✅ Succès' },
  };

  const AUDIENCE_LABEL: Record<BannerAudience, { label: string; icon: string; color: string }> = {
    all: { label: 'Tous les utilisateurs', icon: '👥', color: '#0f2d3d' },
    pro: { label: 'Clients Pro uniquement', icon: '💼', color: '#7c3aed' },
    particulier: { label: 'Particuliers uniquement', icon: '👤', color: '#0891b2' },
    specific: { label: 'Client spécifique', icon: '🎯', color: '#d97706' },
  };

  // ── Charger la liste des bannières actives ───────────────
  const loadBanners = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!data) {
      setBanners([]);
      setLoading(false);
      return;
    }

    // Hydrater les target_user_label pour les bannières 'specific'
    const targetIds = data.filter(b => b.audience === 'specific' && b.target_user_id).map(b => b.target_user_id);
    let usersMap: Record<string, { email: string; full_name: string | null }> = {};
    if (targetIds.length > 0) {
      const { data: users } = await supabase.from('profiles').select('id, email, full_name').in('id', targetIds);
      if (users) {
        usersMap = Object.fromEntries(users.map(u => [u.id, { email: u.email, full_name: u.full_name }]));
      }
    }

    setBanners(data.map(b => ({
      ...b,
      target_user_label: b.target_user_id && usersMap[b.target_user_id]
        ? (usersMap[b.target_user_id].full_name || usersMap[b.target_user_id].email)
        : null,
    })));
    setLoading(false);
  };

  useEffect(() => { loadBanners(); }, []);

  // ── Recherche utilisateur pour ciblage 'specific' ─────────
  useEffect(() => {
    if (audience !== 'specific' || userSearch.trim().length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const term = `%${userSearch.trim()}%`;
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .or(`email.ilike.${term},full_name.ilike.${term}`)
        .limit(8);
      setUserResults(data || []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearch, audience]);

  // ── Reset form ────────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setMessage('');
    setType('info');
    setAudience('all');
    setTargetUserId(null);
    setTargetUserLabel('');
    setUserSearch('');
    setUserResults([]);
  };

  // ── Démarrer édition d'une bannière existante ─────────────
  const startEdit = (b: Banner) => {
    setEditingId(b.id);
    setMessage(b.message);
    setType(b.type);
    setAudience(b.audience);
    setTargetUserId(b.target_user_id);
    setTargetUserLabel(b.target_user_label || '');
    setUserSearch('');
    setUserResults([]);
    // Scroll vers le formulaire
    setTimeout(() => document.getElementById('banner-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ── Save (create or update) ───────────────────────────────
  const handleSave = async () => {
    if (!message.trim()) return;
    if (audience === 'specific' && !targetUserId) {
      showToast('Sélectionnez un client pour le ciblage spécifique');
      return;
    }
    setSaving(true);

    const payload = {
      message: message.trim(),
      type,
      audience,
      target_user_id: audience === 'specific' ? targetUserId : null,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      await supabase.from('banners').update(payload).eq('id', editingId);
      await logAction('Bannière modifiée', message.substring(0, 50));
      showToast('Bannière mise à jour !');
    } else {
      await supabase.from('banners').insert({ ...payload, active: true });
      await logAction('Bannière créée', `${audience} — ${message.substring(0, 40)}`);
      showToast('Bannière créée et activée !');
    }

    resetForm();
    await loadBanners();
    setSaving(false);
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (b: Banner) => {
    if (!confirm(`Supprimer cette bannière ?\n\n"${b.message.substring(0, 80)}"`)) return;
    await supabase.from('banners').delete().eq('id', b.id);
    await logAction('Bannière supprimée', b.message.substring(0, 50));
    showToast('Bannière supprimée — disparaît au prochain rafraîchissement client');
    // Si on était en train d'éditer celle-là, reset le form
    if (editingId === b.id) resetForm();
    await loadBanners();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: 760 }}>
      {/* ═══════ HEADER ═══════ */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Bannières dashboard</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Affichez des messages sur le dashboard de vos utilisateurs. Vous pouvez cibler tout le monde, les pros, les particuliers ou un client spécifique.</p>
      </div>

      {/* ═══════ LISTE DES BANNIÈRES ACTIVES ═══════ */}
      {banners.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10, letterSpacing: '0.08em' }}>
            BANNIÈRES ACTIVES ({banners.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {banners.map(b => {
              const aud = AUDIENCE_LABEL[b.audience];
              const col = COLORS[b.type];
              return (
                <div key={b.id} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #edf2f7', padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Icône de type */}
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: col.bg, border: `1px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                    {b.type === 'info' ? 'ℹ️' : b.type === 'warning' ? '⚠️' : '✅'}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: aud.color, background: '#f8fafc', border: '1px solid #edf2f7', padding: '3px 9px', borderRadius: 100 }}>
                        {aud.icon} {aud.label}
                        {b.audience === 'specific' && b.target_user_label && ` · ${b.target_user_label}`}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(b.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 500, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {b.message}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => startEdit(b)}
                      title="Modifier"
                      style={{ width: 34, height: 34, borderRadius: 8, background: '#f0f7fb', border: '1px solid #bae3f5', color: '#2a7d9c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(b)}
                      title="Supprimer"
                      style={{ width: 34, height: 34, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ APERÇU ═══════ */}
      {message.trim() && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.08em' }}>APERÇU</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, background: COLORS[type].bg, borderLeft: `4px solid ${COLORS[type].color}`, border: `1.5px solid ${COLORS[type].border}` }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{type === 'info' ? 'ℹ️' : type === 'warning' ? '⚠️' : '✅'}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: COLORS[type].color }}>{message}</span>
            <X size={16} style={{ color: COLORS[type].color, opacity: 0.5, flexShrink: 0 }} />
          </div>
        </div>
      )}

      {/* ═══════ FORMULAIRE ═══════ */}
      <div id="banner-form" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {editingId ? '✏️ Modifier la bannière' : '✨ Nouvelle bannière'}
          </h3>
          {editingId && (
            <button onClick={resetForm}
              style={{ fontSize: 12, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Annuler l&apos;édition
            </button>
          )}
        </div>

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

        {/* Audience */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Qui doit voir cette bannière ?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {(['all', 'pro', 'particulier', 'specific'] as const).map(a => {
              const info = AUDIENCE_LABEL[a];
              const selected = audience === a;
              return (
                <button key={a} onClick={() => { setAudience(a); if (a !== 'specific') { setTargetUserId(null); setTargetUserLabel(''); setUserSearch(''); } }}
                  style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${selected ? info.color : '#edf2f7'}`, background: selected ? '#f8fafc' : '#fff', color: selected ? info.color : '#64748b', fontSize: 12.5, fontWeight: selected ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{info.icon}</span>
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recherche client (uniquement si audience = 'specific') */}
        {audience === 'specific' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
              {targetUserId ? 'Client ciblé' : 'Rechercher un client (email ou nom)'}
            </label>

            {targetUserId ? (
              // Client sélectionné
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#fef3c7', border: '1.5px solid #fbbf24' }}>
                <span style={{ fontSize: 16 }}>🎯</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: '#92400e' }}>{targetUserLabel}</span>
                <button onClick={() => { setTargetUserId(null); setTargetUserLabel(''); setUserSearch(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#92400e', cursor: 'pointer', padding: 4, fontSize: 16 }}>
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Ex : alex@gmail.com ou Alexandre Rogelet"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#0f172a', background: '#f8fafc' }}
                />
                {userSearch.trim().length >= 2 && (
                  <div style={{ marginTop: 8, background: '#fff', border: '1.5px solid #edf2f7', borderRadius: 10, maxHeight: 240, overflowY: 'auto' as const }}>
                    {searching ? (
                      <div style={{ padding: 16, fontSize: 13, color: '#94a3b8', textAlign: 'center' as const }}>Recherche…</div>
                    ) : userResults.length === 0 ? (
                      <div style={{ padding: 16, fontSize: 13, color: '#94a3b8', textAlign: 'center' as const }}>Aucun résultat</div>
                    ) : (
                      userResults.map(u => (
                        <button key={u.id}
                          onClick={() => { setTargetUserId(u.id); setTargetUserLabel(u.full_name || u.email); setUserSearch(''); setUserResults([]); }}
                          style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' as const }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: u.role === 'pro' ? '#7c3aed' : '#0891b2', background: u.role === 'pro' ? '#f3e8ff' : '#cffafe', padding: '2px 7px', borderRadius: 100, flexShrink: 0 }}>
                            {u.role === 'pro' ? 'PRO' : 'PART.'}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                              {u.full_name || '(sans nom)'}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                              {u.email}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Message */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ex : Verimo est en maintenance ce soir de 22h à 23h. Merci de votre compréhension."
            rows={3}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, resize: 'vertical' as const, fontFamily: 'inherit', color: '#0f172a', background: '#f8fafc' }}
          />
        </div>

        {/* Bouton */}
        <button onClick={handleSave} disabled={saving || !message.trim() || (audience === 'specific' && !targetUserId)}
          style={{ padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving || !message.trim() || (audience === 'specific' && !targetUserId) ? 'not-allowed' : 'pointer', opacity: saving || !message.trim() || (audience === 'specific' && !targetUserId) ? 0.6 : 1 }}>
          {saving ? 'Enregistrement…' : editingId ? '💾 Mettre à jour' : '🚀 Publier la bannière'}
        </button>
      </div>
    </div>
  );
}
function DashboardTab({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const [data, setData] = useState({
    caMonth: 0,
    caMonthPrev: 0,
    caProMonth: 0,
    caProMonthHt: 0,
    caProMonthPrev: 0,
    newClientsMonth: 0,
    newProMonth: 0,
    activeProCount: 0,
    analysesThisMonth: 0,
    analysesByType: { document: 0, complete: 0, pack2: 0, pack3: 0 },
    caByCategory: { document: { count: 0, total: 0 }, complete: { count: 0, total: 0 }, pack2: { count: 0, total: 0 }, pack3: { count: 0, total: 0 } },
    caProByCategory: { abo_decouverte: { count: 0, total: 0 }, abo_starter: { count: 0, total: 0 }, abo_power: { count: 0, total: 0 }, unit_complete: { count: 0, total: 0 }, unit_simple: { count: 0, total: 0 } },
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
        { count: newProMonth },
        { count: activeProCount },
      ] = await Promise.all([
        // ─── CA V2 : on lit UNIQUEMENT payments, avec customer_type + amount_ht + status refunded ───
        supabase.from('payments')
          .select('amount,amount_ht,description,customer_type,status,refunded_amount')
          .in('status', ['completed', 'partially_refunded'])
          .gt('amount', 0)
          .gte('created_at', startOfMonth),
        supabase.from('payments')
          .select('amount,amount_ht,customer_type,status,refunded_amount')
          .in('status', ['completed', 'partially_refunded'])
          .gt('amount', 0)
          .gte('created_at', startOfPrevMonth)
          .lte('created_at', endOfPrevMonth),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('email_verified', true).gte('created_at', startOfMonth),
        supabase.from('analyses').select('type').gte('created_at', startOfMonth),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('read', false),
        supabase.from('contact_pro').select('*', { count: 'exact', head: true }).eq('read', false),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pro').gte('created_at', startOfMonth),
        supabase.from('pro_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      // Helper : montant TTC net (déduit le refunded_amount sur les remboursements partiels)
      const netTtc = (p: any) => (p.amount || 0) - (p.refunded_amount || 0);
      // Helper : montant HT net
      const netHt = (p: any) => {
        const ht = p.amount_ht ?? p.amount ?? 0;
        // Pour partiellement remboursé, on calcule la part HT remboursée au prorata
        if (p.status === 'partially_refunded' && p.amount > 0 && p.refunded_amount) {
          const ratio = (p.amount - p.refunded_amount) / p.amount;
          return ht * ratio;
        }
        return ht;
      };

      const monthPayments = paymentsMonth || [];
      const prevPayments = paymentsPrevMonth || [];

      // ─── CA Particuliers (TTC = HT, pas de TVA) ───
      const partPayments = monthPayments.filter(p => p.customer_type === 'particulier');
      const caMonth = partPayments.reduce((s, p) => s + netTtc(p), 0);
      const caMonthPrev = prevPayments
        .filter(p => p.customer_type === 'particulier')
        .reduce((s, p) => s + netTtc(p), 0);

      // Ticket moyen sur particuliers ce mois
      const ticketMoyen = partPayments.length > 0 ? caMonth / partPayments.length : 0;

      // ─── CA Pro (TTC + HT) ───
      const proPayments = monthPayments.filter(p => p.customer_type === 'pro');
      const caProMonth = proPayments.reduce((s, p) => s + netTtc(p), 0);
      const caProMonthHt = proPayments.reduce((s, p) => s + netHt(p), 0);
      const caProMonthPrev = prevPayments
        .filter(p => p.customer_type === 'pro')
        .reduce((s, p) => s + netTtc(p), 0);

      // ─── CA Pro par catégorie (basé sur description) ───
      const caProByCategory = { abo_decouverte: { count: 0, total: 0 }, abo_starter: { count: 0, total: 0 }, abo_power: { count: 0, total: 0 }, unit_complete: { count: 0, total: 0 }, unit_simple: { count: 0, total: 0 } };
      proPayments.forEach((p: any) => {
        const desc = (p.description || '').toLowerCase();
        const amt = netTtc(p);
        // Pour les abonnements, on regarde le plan en début de description
        // ("Abonnement Starter (upgrade depuis Découverte)" → Starter, pas Découverte)
        const isAbo = desc.startsWith('abonnement');
        if (isAbo && (desc.startsWith('abonnement starter') || desc.includes('abonnement starter'))) {
          caProByCategory.abo_starter.count++;
          caProByCategory.abo_starter.total += amt;
        } else if (isAbo && (desc.startsWith('abonnement power') || desc.includes('abonnement power'))) {
          caProByCategory.abo_power.count++;
          caProByCategory.abo_power.total += amt;
        } else if (isAbo && (desc.startsWith('abonnement découverte') || desc.startsWith('abonnement decouverte') || desc.includes('abonnement découverte') || desc.includes('abonnement decouverte'))) {
          caProByCategory.abo_decouverte.count++;
          caProByCategory.abo_decouverte.total += amt;
        } else if (desc.includes('achat unitaire') && desc.includes('complète')) {
          caProByCategory.unit_complete.count++;
          caProByCategory.unit_complete.total += amt;
        } else if (desc.includes('achat unitaire') && (desc.includes('simple') || desc.includes('document'))) {
          caProByCategory.unit_simple.count++;
          caProByCategory.unit_simple.total += amt;
        }
      });

      // ─── CA particuliers par catégorie (basé sur description) ───
      const caByCategory = { document: { count: 0, total: 0 }, complete: { count: 0, total: 0 }, pack2: { count: 0, total: 0 }, pack3: { count: 0, total: 0 } };
      partPayments.forEach(p => {
        const desc = (p.description || '').toLowerCase();
        const amt = netTtc(p);
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
        caProMonth,
        caProMonthHt,
        caProMonthPrev,
        newClientsMonth: newClients || 0,
        newProMonth: newProMonth || 0,
        activeProCount: activeProCount || 0,
        analysesThisMonth: (analysesMonth || []).length,
        analysesByType,
        caByCategory,
        caProByCategory,
        ticketMoyen,
        messagesUnread: msgUnread || 0,
        proUnread: proUnreadCount || 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const totalCaMonth = data.caMonth + data.caProMonth;
  const totalCaPrev = data.caMonthPrev + data.caProMonthPrev;
  const diff = totalCaMonth - totalCaPrev;
  const diffLabel = totalCaPrev === 0 && totalCaMonth > 0
    ? `Premier mois de CA · +${totalCaMonth.toFixed(2).replace('.', ',')}€ vs mois dernier (0€)`
    : totalCaPrev === 0
      ? 'Pas de CA ce mois ni le mois dernier'
      : diff >= 0
        ? `↑ +${diff.toFixed(2).replace('.', ',')}€ vs mois dernier (${totalCaPrev.toFixed(2).replace('.', ',')}€)`
        : `↓ ${diff.toFixed(2).replace('.', ',')}€ vs mois dernier (${totalCaPrev.toFixed(2).replace('.', ',')}€)`;

  const currentMonthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const toTraiter = data.messagesUnread + data.proUnread;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Tableau de bord</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Activité de ce mois-ci ({currentMonthLabel})</p>
      </div>

      {/* BLOC HERO — CA du mois */}
      <div style={{ background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', borderRadius: 18, padding: '28px 30px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
              CA de {currentMonthLabel}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{totalCaMonth.toFixed(2).replace('.', ',')}€</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>TTC</div>
            </div>
            <div style={{ fontSize: 13, color: diff >= 0 ? '#7dd3f0' : '#fca5a5', marginTop: 10, fontWeight: 600 }}>
              {diffLabel}
            </div>
            {(data.caMonth > 0 || data.caProMonth > 0) && (
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' as const }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Particuliers : <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{data.caMonth.toFixed(2).replace('.', ',')}€ TTC</span></div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  Pro : <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{data.caProMonthHt.toFixed(2).replace('.', ',')}€ HT</span>
                  {data.caProMonth > 0 && (
                    <span style={{ marginLeft: 4, color: 'rgba(255,255,255,0.55)' }}>({data.caProMonth.toFixed(2).replace('.', ',')}€ TTC)</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => onNavigate('stats')}
            style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            Voir les statistiques <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* BLOC "CE MOIS-CI" — KPIs compacts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #edf2f7', padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Nouveaux clients</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{data.newClientsMonth}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Vérifiés{data.newProMonth > 0 ? ` · ${data.newProMonth} pro` : ''}</div>
        </div>
        <div style={{ background: '#0f2d3d', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Nb de pro abonnés</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{data.activeProCount}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Abonnements en cours</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #edf2f7', padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Analyses lancées</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{data.analysesThisMonth}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 10, color: '#64748b' }}>Simple: {data.analysesByType.document}</span>
            <span style={{ fontSize: 10, color: '#2a7d9c' }}>Complète: {data.analysesByType.complete}</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #edf2f7', padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Ticket moyen</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{data.ticketMoyen.toFixed(2).replace('.', ',')}€</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>TTC</div>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Par paiement ce mois</div>
        </div>
      </div>

      {/* BLOC CA PAR CATÉGORIE */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>💰 CA par catégorie ce mois</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, marginBottom: 14 }}>Détail des ventes par produit</div>

        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #f0f7fb, #ecfdf5)', border: '1.5px solid #d0e8f0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.05em' }}>👤 PARTICULIERS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { key: 'document' as const, label: 'Analyse Simple', color: '#64748b', bg: '#f8fafc' },
            { key: 'complete' as const, label: 'Analyse Complète', color: '#2a7d9c', bg: '#f0f7fb' },
            { key: 'pack2' as const, label: 'Pack 2 Biens', color: '#7c3aed', bg: '#f5f3ff' },
            { key: 'pack3' as const, label: 'Pack 3 Biens', color: '#f0a500', bg: '#fffbeb' },
          ].map(t => {
            const d = data.caByCategory[t.key];
            const hasData = d.count > 0;
            return (
              <div key={t.key} style={{ padding: '14px 16px', borderRadius: 12, background: hasData ? t.bg : '#fff', border: `1.5px solid ${hasData ? t.color + '40' : '#edf2f7'}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: hasData ? t.color : '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>{t.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: hasData ? t.color : '#94a3b8', lineHeight: 1 }}>{d.total.toFixed(2).replace('.', ',')}€</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: hasData ? t.color : '#94a3b8' }}>TTC</div>
                </div>
                <div style={{ fontSize: 12, color: hasData ? '#64748b' : '#94a3b8', marginTop: 6, fontWeight: 600 }}>{d.count} vente{d.count > 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #0f2d3d, #1a4a60)', border: '1.5px solid #0f2d3d', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>🏢 PRO</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {[
            { key: 'abo_decouverte' as const, label: 'Abo Découverte', color: '#0f2d3d', bg: '#f0f7fb' },
            { key: 'abo_starter' as const, label: 'Abo Starter', color: '#2a7d9c', bg: '#f0f7fb' },
            { key: 'abo_power' as const, label: 'Abo Power', color: '#16a34a', bg: '#f0fdf4' },
            { key: 'unit_complete' as const, label: 'Unitaire Complète', color: '#7c3aed', bg: '#f5f3ff' },
            { key: 'unit_simple' as const, label: 'Unitaire Simple', color: '#64748b', bg: '#f8fafc' },
          ].map(t => {
            const d = data.caProByCategory[t.key];
            // Pour les pro, calculer le HT (TTC / 1.20) car d.total est en TTC
            const totalHt = d.total / 1.20;
            const hasData = d.count > 0;
            return (
              <div key={t.key} style={{ padding: '14px 16px', borderRadius: 12, background: hasData ? t.bg : '#fff', border: `1.5px solid ${hasData ? t.color + '40' : '#edf2f7'}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: hasData ? t.color : '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>{t.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: hasData ? t.color : '#94a3b8', lineHeight: 1 }}>{totalHt.toFixed(2).replace('.', ',')}€</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: hasData ? t.color : '#94a3b8' }}>HT</div>
                </div>
                {hasData && (
                  <div style={{ fontSize: 12, color: t.color, opacity: 0.8, marginTop: 3, fontWeight: 600 }}>({d.total.toFixed(2).replace('.', ',')}€ TTC)</div>
                )}
                <div style={{ fontSize: 12, color: hasData ? '#64748b' : '#94a3b8', marginTop: 6, fontWeight: 600 }}>{d.count} vente{d.count > 1 ? 's' : ''}</div>
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
            { label: 'Relevé des transactions', icon: Euro, color: '#16a34a', tab: 'payments' },
            { label: 'Voir les analyses', icon: FileText, color: '#7c3aed', tab: 'analyses' },
            { label: 'Analyse / CA', icon: BarChart2, color: '#2a7d9c', tab: 'stats' },
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
   ANALYSE / CA TAB
══════════════════════════════════════════ */
type StatsPeriod = '7j' | '30j' | '3m' | '12m' | 'all' | 'custom';
type StatsSource = 'all' | 'particulier' | 'pro';

function StatsTab() {
  const [period, setPeriod] = useState<StatsPeriod>('30j');
  const [source, setSource] = useState<StatsSource>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [stats, setStats] = useState({
    caParticulier: 0, caPro: 0, caProHt: 0, caProSubs: 0, caProUnits: 0,
    paymentsCountPart: 0, paymentsCountPro: 0,
    newUsersVerified: 0, newProUsers: 0,
    analysesTotal: 0,
    analysesPart: 0,
    analysesPro: 0,
    analysesByType: { document: 0, complete: 0, pack2: 0, pack3: 0 },
    analysesByTypePart: { document: 0, complete: 0, pack2: 0, pack3: 0 },
    analysesByTypePro: { document: 0, complete: 0, pack2: 0, pack3: 0 },
    freeAnalysesByType: { document: 0, complete: 0, pack2: 0, pack3: 0 },
    creditsOffered: { document: 0, complete: 0 },
    caPartCateg: { document: { count: 0, total: 0 }, complete: { count: 0, total: 0 }, pack2: { count: 0, total: 0 }, pack3: { count: 0, total: 0 } },
    caProCateg: { abo_decouverte: { count: 0, total: 0 }, abo_starter: { count: 0, total: 0 }, abo_power: { count: 0, total: 0 }, unit_complete: { count: 0, total: 0 }, unit_simple: { count: 0, total: 0 } },
    activeProCount: 0,
    // Prev period for comparisons
    prevCaPart: 0, prevCaPro: 0, prevNewUsers: 0, prevNewPro: 0, prevAnalyses: 0, prevActiveProCount: 0,
  });
  const [weeklyData, setWeeklyData] = useState<{ week: string; caPart: number; caPro: number; users: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const getRange = useCallback(() => {
    const now = new Date();
    const end = now.toISOString();
    if (period === 'all') return { start: '2020-01-01T00:00:00Z', end, prevStart: '', prevEnd: '' };
    const start = new Date(now);
    if (period === '7j') start.setDate(now.getDate() - 7);
    else if (period === '30j') start.setDate(now.getDate() - 30);
    else if (period === '3m') start.setMonth(now.getMonth() - 3);
    else if (period === '12m') start.setFullYear(now.getFullYear() - 1);
    else {
      const cs = new Date(customStart);
      const ce = new Date(customEnd + 'T23:59:59');
      const dur = ce.getTime() - cs.getTime();
      const ps = new Date(cs.getTime() - dur);
      return { start: customStart, end: customEnd + 'T23:59:59', prevStart: ps.toISOString(), prevEnd: cs.toISOString() };
    }
    const dur = new Date(end).getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - dur);
    return { start: start.toISOString(), end, prevStart: prevStart.toISOString(), prevEnd: start.toISOString() };
  }, [period, customStart, customEnd]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { start, end, prevStart, prevEnd } = getRange();
      if (!start || !end) { setLoading(false); return; }

      const [
        { data: paymentsData },
        { count: newUsersVerified },
        { count: newProUsers },
        { data: analyses },
        { data: freePaymentsData },
        { count: activeProCount },
      ] = await Promise.all([
        // ─── CA V2 : on lit UNIQUEMENT payments avec customer_type, amount_ht, status remboursés ───
        supabase.from('payments')
          .select('amount,amount_ht,description,customer_type,status,refunded_amount')
          .in('status', ['completed', 'partially_refunded'])
          .gt('amount', 0)
          .gte('created_at', start).lte('created_at', end),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('email_verified', true).gte('created_at', start).lte('created_at', end),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pro').gte('created_at', start).lte('created_at', end),
        supabase.from('analyses').select('type,paid,stripe_payment_id,created_at,user_id,profiles!inner(role)').gte('created_at', start).lte('created_at', end),
        supabase.from('payments').select('credits_added,credit_type').eq('status', 'completed').eq('amount', 0).gte('created_at', start).lte('created_at', end),
        supabase.from('pro_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      // Helpers V2 : montants nets après remboursement partiel
      const netTtc = (p: any) => (p.amount || 0) - (p.refunded_amount || 0);
      const netHt = (p: any) => {
        const ht = p.amount_ht ?? p.amount ?? 0;
        if (p.status === 'partially_refunded' && p.amount > 0 && p.refunded_amount) {
          const ratio = (p.amount - p.refunded_amount) / p.amount;
          return ht * ratio;
        }
        return ht;
      };

      // Prev period (if not "all") — même logique unifiée
      let prevCaPart = 0, prevCaPro = 0, prevNewUsers = 0, prevNewPro = 0, prevAnalyses = 0;
      if (prevStart && prevEnd && period !== 'all') {
        const [{ data: pp }, { count: pu }, { count: ppr }, { count: pa }] = await Promise.all([
          supabase.from('payments')
            .select('amount,refunded_amount,customer_type,status')
            .in('status', ['completed', 'partially_refunded'])
            .gt('amount', 0)
            .gte('created_at', prevStart).lte('created_at', prevEnd),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('email_verified', true).gte('created_at', prevStart).lte('created_at', prevEnd),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pro').gte('created_at', prevStart).lte('created_at', prevEnd),
          supabase.from('analyses').select('*', { count: 'exact', head: true }).gte('created_at', prevStart).lte('created_at', prevEnd),
        ]);
        prevCaPart = (pp || []).filter((p: any) => p.customer_type === 'particulier').reduce((s: number, p: any) => s + netTtc(p), 0);
        prevCaPro = (pp || []).filter((p: any) => p.customer_type === 'pro').reduce((s: number, p: any) => s + netTtc(p), 0);
        prevNewUsers = pu || 0;
        prevNewPro = ppr || 0;
        prevAnalyses = pa || 0;
      }

      const payments = paymentsData || [];
      const partPayments = payments.filter((p: any) => p.customer_type === 'particulier');
      const proPayments = payments.filter((p: any) => p.customer_type === 'pro');

      // ─── CA Particuliers (TTC = HT, pas de TVA) ───
      const caParticulier = partPayments.reduce((s, p: any) => s + netTtc(p), 0);
      const paymentsCountPart = partPayments.length;

      // ─── CA Pro (TTC + HT séparés) ───
      const caPro = proPayments.reduce((s, p: any) => s + netTtc(p), 0);
      const caProHt = proPayments.reduce((s, p: any) => s + netHt(p), 0);
      const paymentsCountPro = proPayments.length;
      // Split abos / unitaires (pour l'affichage actuel qui demande caProSubs/caProUnits)
      const caProSubs = proPayments
        .filter((p: any) => /^abonnement/i.test(p.description || ''))
        .reduce((s, p: any) => s + netTtc(p), 0);
      const caProUnits = proPayments
        .filter((p: any) => /^achat unitaire/i.test(p.description || ''))
        .reduce((s, p: any) => s + netTtc(p), 0);

      // Analyses par type — split pro / particulier selon le rôle du user
      const analysesByType = { document: 0, complete: 0, pack2: 0, pack3: 0 };
      const analysesByTypePart = { document: 0, complete: 0, pack2: 0, pack3: 0 };
      const analysesByTypePro = { document: 0, complete: 0, pack2: 0, pack3: 0 };
      const freeAnalysesByType = { document: 0, complete: 0, pack2: 0, pack3: 0 };
      let analysesPart = 0;
      let analysesPro = 0;
      (analyses || []).forEach((a: any) => {
        if (a.type in analysesByType) {
          analysesByType[a.type as keyof typeof analysesByType]++;
          if (!a.stripe_payment_id) freeAnalysesByType[a.type as keyof typeof freeAnalysesByType]++;
          const userRole = a.profiles?.role || 'user';
          if (userRole === 'pro') {
            analysesPro++;
            analysesByTypePro[a.type as keyof typeof analysesByTypePro]++;
          } else {
            analysesPart++;
            analysesByTypePart[a.type as keyof typeof analysesByTypePart]++;
          }
        }
      });

      const creditsOffered = { document: 0, complete: 0 };
      (freePaymentsData || []).forEach(p => {
        if (p.credit_type === 'document') creditsOffered.document += (p.credits_added || 0);
        else if (p.credit_type === 'complete') creditsOffered.complete += (p.credits_added || 0);
      });

      // CA par catégorie particulier (basé sur description)
      const caPartCateg = { document: { count: 0, total: 0 }, complete: { count: 0, total: 0 }, pack2: { count: 0, total: 0 }, pack3: { count: 0, total: 0 } };
      partPayments.forEach((p: any) => {
        const desc = (p.description || '').toLowerCase();
        const amt = netTtc(p);
        if (desc.includes('pack 3')) { caPartCateg.pack3.count++; caPartCateg.pack3.total += amt; }
        else if (desc.includes('pack 2')) { caPartCateg.pack2.count++; caPartCateg.pack2.total += amt; }
        else if (desc.includes('complète')) { caPartCateg.complete.count++; caPartCateg.complete.total += amt; }
        else { caPartCateg.document.count++; caPartCateg.document.total += amt; }
      });

      // CA par catégorie pro (basé sur description)
      const caProCateg = { abo_decouverte: { count: 0, total: 0 }, abo_starter: { count: 0, total: 0 }, abo_power: { count: 0, total: 0 }, unit_complete: { count: 0, total: 0 }, unit_simple: { count: 0, total: 0 } };
      proPayments.forEach((p: any) => {
        const desc = (p.description || '').toLowerCase();
        const amt = netTtc(p);
        // Pour les abonnements, on regarde le plan en début de description
        // ("Abonnement Starter (upgrade depuis Découverte)" → Starter, pas Découverte)
        const isAbo = desc.startsWith('abonnement');
        if (isAbo && (desc.startsWith('abonnement starter') || desc.includes('abonnement starter'))) {
          caProCateg.abo_starter.count++;
          caProCateg.abo_starter.total += amt;
        } else if (isAbo && (desc.startsWith('abonnement power') || desc.includes('abonnement power'))) {
          caProCateg.abo_power.count++;
          caProCateg.abo_power.total += amt;
        } else if (isAbo && (desc.startsWith('abonnement découverte') || desc.startsWith('abonnement decouverte') || desc.includes('abonnement découverte') || desc.includes('abonnement decouverte'))) {
          caProCateg.abo_decouverte.count++;
          caProCateg.abo_decouverte.total += amt;
        } else if (desc.includes('achat unitaire') && desc.includes('complète')) {
          caProCateg.unit_complete.count++;
          caProCateg.unit_complete.total += amt;
        } else if (desc.includes('achat unitaire') && (desc.includes('simple') || desc.includes('document'))) {
          caProCateg.unit_simple.count++;
          caProCateg.unit_simple.total += amt;
        }
      });

      setStats({ caParticulier, caPro, caProHt, caProSubs, caProUnits, paymentsCountPart, paymentsCountPro, newUsersVerified: newUsersVerified || 0, newProUsers: newProUsers || 0, analysesTotal: (analyses || []).length, analysesPart, analysesPro, analysesByType, analysesByTypePart, analysesByTypePro, freeAnalysesByType, creditsOffered, caPartCateg, caProCateg, activeProCount: activeProCount || 0, prevCaPart, prevCaPro, prevNewUsers, prevNewPro, prevAnalyses, prevActiveProCount: 0 });

      // Graphiques 8 dernières semaines — basés sur payments uniquement
      const weeks: { week: string; caPart: number; caPro: number; users: number }[] = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - (i * 7) - 6); weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - (i * 7)); weekEnd.setHours(23, 59, 59, 999);
        const ws = weekStart.toISOString(); const we = weekEnd.toISOString();

        const [{ data: wPay }, { count: wUsers }] = await Promise.all([
          supabase.from('payments')
            .select('amount,refunded_amount,customer_type,status')
            .in('status', ['completed', 'partially_refunded'])
            .gt('amount', 0)
            .gte('created_at', ws).lte('created_at', we),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('email_verified', true).gte('created_at', ws).lte('created_at', we),
        ]);
        const wCaPart = (wPay || []).filter((p: any) => p.customer_type === 'particulier').reduce((s: number, p: any) => s + netTtc(p), 0);
        const wCaPro = (wPay || []).filter((p: any) => p.customer_type === 'pro').reduce((s: number, p: any) => s + netTtc(p), 0);
        const label = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
        weeks.push({ week: label, caPart: wCaPart, caPro: wCaPro, users: wUsers || 0 });
      }
      setWeeklyData(weeks);
      setLoading(false);
    };
    load();
  }, [getRange]);

  // Computed
  const totalCa = source === 'particulier' ? stats.caParticulier : source === 'pro' ? stats.caPro : stats.caParticulier + stats.caPro;
  const totalPayments = source === 'particulier' ? stats.paymentsCountPart : source === 'pro' ? stats.paymentsCountPro : stats.paymentsCountPart + stats.paymentsCountPro;
  const ticketMoyen = totalPayments > 0 ? totalCa / totalPayments : 0;
  const maxCa = Math.max(...weeklyData.map(w => {
    if (source === 'particulier') return w.caPart;
    if (source === 'pro') return w.caPro;
    return w.caPart + w.caPro;
  }), 1);
  const maxU = Math.max(...weeklyData.map(w => w.users), 1);

  const periods: { id: StatsPeriod; label: string }[] = [
    { id: '7j', label: '7 jours' }, { id: '30j', label: '30 jours' }, { id: '3m', label: '3 mois' },
    { id: '12m', label: '12 mois' }, { id: 'all', label: 'Depuis le début' }, { id: 'custom', label: 'Personnalisé' },
  ];
  const periodLabel = period === 'all' ? 'depuis le début' : period === '7j' ? 'sur les 7 derniers jours' : period === '30j' ? 'sur les 30 derniers jours' : period === '3m' ? 'sur les 3 derniers mois' : period === '12m' ? 'sur les 12 derniers mois' : 'sur la période personnalisée';


  // Evolution helper
  const evo = (curr: number, prev: number) => {
    if (period === 'all' || prev === 0) return null;
    const diff = curr - prev;
    const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0;
    return { diff, pct, up: diff >= 0 };
  };

  const caEvo = evo(totalCa, source === 'particulier' ? stats.prevCaPart : source === 'pro' ? stats.prevCaPro : stats.prevCaPart + stats.prevCaPro);
  const usersEvo = evo(stats.newUsersVerified, stats.prevNewUsers);
  const analysesEvo = evo(stats.analysesTotal, stats.prevAnalyses);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Analyse / CA</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Analyse de l'activité {periodLabel}</p>
      </div>

      {/* Filtres période */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${period === p.id ? '#2a7d9c' : '#edf2f7'}`, background: period === p.id ? '#f0f7fb' : '#fff', color: period === p.id ? '#2a7d9c' : '#64748b', fontSize: 13, fontWeight: period === p.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
            {p.label}
          </button>
        ))}
        {period === 'custom' && (<>
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, fontFamily: 'inherit' }} />
          <span style={{ color: '#94a3b8' }}>→</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, fontFamily: 'inherit' }} />
        </>)}
      </div>

      {/* Filtre source */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {([{ id: 'all', label: 'Tout' }, { id: 'particulier', label: 'Particuliers' }, { id: 'pro', label: 'Pro' }] as const).map(s => (
          <button key={s.id} onClick={() => setSource(s.id)}
            style={{ padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${source === s.id ? '#0f2d3d' : '#edf2f7'}`, background: source === s.id ? '#0f2d3d' : '#fff', color: source === s.id ? '#fff' : '#64748b', fontSize: 12, fontWeight: source === s.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* BLOC 1 — CA + KPIs compacts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div style={{ padding: '20px 22px', borderRadius: 14, background: 'linear-gradient(135deg,#16a34a,#14532d)', color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.95, letterSpacing: '0.1em', marginBottom: 8 }}>CA {source === 'all' ? 'TOTAL' : source === 'pro' ? 'PRO' : 'PARTICULIERS'}</div>
          {source === 'pro' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{stats.caProHt.toFixed(2).replace('.', ',')}€</div>
                <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.95 }}>HT</div>
              </div>
              {stats.caPro > 0 && (
                <div style={{ fontSize: 14, marginTop: 6, fontWeight: 600, color: '#bbf7d0' }}>({stats.caPro.toFixed(2).replace('.', ',')}€ TTC)</div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{totalCa.toFixed(2).replace('.', ',')}€</div>
              <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.95 }}>TTC</div>
            </div>
          )}
          {caEvo && <div style={{ fontSize: 12, marginTop: 6, color: caEvo.up ? '#bbf7d0' : '#fca5a5', fontWeight: 600 }}>{caEvo.up ? '↑' : '↓'} {caEvo.pct > 0 ? '+' : ''}{caEvo.pct}% vs période préc.</div>}
          {source === 'all' && (
            <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 12, flexWrap: 'wrap' as const }}>
              <span style={{ opacity: 0.95 }}>Part. : <strong style={{ fontWeight: 800 }}>{stats.caParticulier.toFixed(2).replace('.', ',')}€ TTC</strong></span>
              <span style={{ opacity: 0.95 }}>
                Pro : <strong style={{ fontWeight: 800 }}>{stats.caProHt.toFixed(2).replace('.', ',')}€ HT</strong>
                {stats.caPro > 0 && <span style={{ opacity: 0.9, marginLeft: 5, color: '#bbf7d0', fontWeight: 600 }}>({stats.caPro.toFixed(2).replace('.', ',')}€ TTC)</span>}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: '14px', borderRadius: 12, background: '#fff', border: '1.5px solid #edf2f7' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 4 }}>TICKET MOYEN</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{ticketMoyen.toFixed(2).replace('.', ',')}€</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>TTC</div>
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: 12, background: '#0f2d3d' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', marginBottom: 4 }}>NB PRO ABONNÉS</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{stats.activeProCount}</div>
          </div>
          <div style={{ padding: '14px', borderRadius: 12, background: '#fff', border: '1.5px solid #edf2f7' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 4 }}>{totalPayments} TRANSACTION{totalPayments > 1 ? 'S' : ''}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>sur la période</div>
          </div>
          <div style={{ padding: '14px', borderRadius: 12, background: '#fff', border: '1.5px solid #edf2f7' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', marginBottom: 4 }}>🎁 OFFERTS</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#64748b' }}>{stats.creditsOffered.document}S</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#2a7d9c' }}>{stats.creditsOffered.complete}C</span>
            </div>
          </div>
        </div>
      </div>

      {/* BLOC 2 — KPIs contextuels selon filtre */}
      <div style={{ display: 'grid', gridTemplateColumns: source === 'all' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {(source === 'all' || source === 'particulier') && (
          <div style={{ padding: '16px', borderRadius: 12, background: '#fff', border: '1.5px solid #edf2f7' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 6 }}>NOUVEAUX INSCRITS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f2d3d' }}>{stats.newUsersVerified}</div>
            {usersEvo && <div style={{ fontSize: 10, color: usersEvo.up ? '#16a34a' : '#dc2626', marginTop: 2, fontWeight: 600 }}>{usersEvo.up ? '↑' : '↓'} {usersEvo.diff > 0 ? '+' : ''}{usersEvo.diff} vs préc.</div>}
            {source === 'all' && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>dont {stats.newProUsers} pro</div>}
          </div>
        )}
        {(source === 'all' || source === 'pro') && (
          <div style={{ padding: '16px', borderRadius: 12, background: '#fff', border: '1.5px solid #edf2f7' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0f2d3d', letterSpacing: '0.08em', marginBottom: 6 }}>NOUVEAUX ABONNÉS PRO</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f2d3d' }}>{stats.newProUsers}</div>
            {evo(stats.newProUsers, stats.prevNewPro) && <div style={{ fontSize: 10, color: evo(stats.newProUsers, stats.prevNewPro)!.up ? '#16a34a' : '#dc2626', marginTop: 2, fontWeight: 600 }}>{evo(stats.newProUsers, stats.prevNewPro)!.up ? '↑' : '↓'} {evo(stats.newProUsers, stats.prevNewPro)!.diff > 0 ? '+' : ''}{evo(stats.newProUsers, stats.prevNewPro)!.diff} vs préc.</div>}
          </div>
        )}
        <div style={{ padding: '16px', borderRadius: 12, background: '#fff', border: '1.5px solid #edf2f7' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', marginBottom: 6 }}>ANALYSES LANCÉES</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f2d3d' }}>{source === 'particulier' ? stats.analysesPart : source === 'pro' ? stats.analysesPro : stats.analysesTotal}</div>
          {analysesEvo && source === 'all' && <div style={{ fontSize: 10, color: analysesEvo.up ? '#16a34a' : '#dc2626', marginTop: 2, fontWeight: 600 }}>{analysesEvo.up ? '↑' : '↓'} {analysesEvo.diff > 0 ? '+' : ''}{analysesEvo.diff} vs préc.</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#64748b' }}>Simple: {source === 'particulier' ? stats.analysesByTypePart.document : source === 'pro' ? stats.analysesByTypePro.document : stats.analysesByType.document}</span>
            <span style={{ fontSize: 10, color: '#2a7d9c' }}>Complète: {source === 'particulier' ? stats.analysesByTypePart.complete : source === 'pro' ? stats.analysesByTypePro.complete : stats.analysesByType.complete}</span>
          </div>
        </div>
      </div>

      {/* BLOC CA PAR CATÉGORIE */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>💰 CA par catégorie {periodLabel}</div>

        {(source === 'all' || source === 'particulier') && (<>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #f0f7fb, #ecfdf5)', border: '1.5px solid #d0e8f0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.05em' }}>👤 PARTICULIERS</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: source === 'all' ? 24 : 0 }}>
            {([
              { key: 'document' as const, label: 'Simple', color: '#64748b', bg: '#f8fafc' },
              { key: 'complete' as const, label: 'Complète', color: '#2a7d9c', bg: '#f0f7fb' },
              { key: 'pack2' as const, label: 'Pack 2', color: '#7c3aed', bg: '#f5f3ff' },
              { key: 'pack3' as const, label: 'Pack 3', color: '#f0a500', bg: '#fffbeb' },
            ]).map(t => {
              const d = stats.caPartCateg[t.key];
              const hasData = d.count > 0;
              return (
                <div key={t.key} style={{ padding: '14px 16px', borderRadius: 12, background: hasData ? t.bg : '#fff', border: `1.5px solid ${hasData ? t.color + '40' : '#edf2f7'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: hasData ? t.color : '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>{t.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: hasData ? t.color : '#94a3b8', lineHeight: 1 }}>{d.total.toFixed(2).replace('.', ',')}€</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: hasData ? t.color : '#94a3b8' }}>TTC</div>
                  </div>
                  <div style={{ fontSize: 12, color: hasData ? '#64748b' : '#94a3b8', marginTop: 6, fontWeight: 600 }}>{d.count} vente{d.count > 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </>)}

        {(source === 'all' || source === 'pro') && (<>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #0f2d3d, #1a4a60)', border: '1.5px solid #0f2d3d', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>🏢 PRO</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {([
              { key: 'abo_decouverte' as const, label: 'Abo Découverte', color: '#0f2d3d', bg: '#f0f7fb' },
              { key: 'abo_starter' as const, label: 'Abo Starter', color: '#2a7d9c', bg: '#f0f7fb' },
              { key: 'abo_power' as const, label: 'Abo Power', color: '#16a34a', bg: '#f0fdf4' },
              { key: 'unit_complete' as const, label: 'Unit. Complète', color: '#7c3aed', bg: '#f5f3ff' },
              { key: 'unit_simple' as const, label: 'Unit. Simple', color: '#64748b', bg: '#f8fafc' },
            ]).map(t => {
              const d = stats.caProCateg[t.key];
              const totalHt = d.total / 1.20;
              const hasData = d.count > 0;
              return (
                <div key={t.key} style={{ padding: '14px 16px', borderRadius: 12, background: hasData ? t.bg : '#fff', border: `1.5px solid ${hasData ? t.color + '40' : '#edf2f7'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: hasData ? t.color : '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>{t.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: hasData ? t.color : '#94a3b8', lineHeight: 1 }}>{totalHt.toFixed(2).replace('.', ',')}€</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: hasData ? t.color : '#94a3b8' }}>HT</div>
                  </div>
                  {hasData && (
                    <div style={{ fontSize: 12, color: t.color, opacity: 0.8, marginTop: 3, fontWeight: 600 }}>({d.total.toFixed(2).replace('.', ',')}€ TTC)</div>
                  )}
                  <div style={{ fontSize: 12, color: hasData ? '#64748b' : '#94a3b8', marginTop: 6, fontWeight: 600 }}>{d.count} vente{d.count > 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </>)}
      </div>

      {/* Graphique CA par semaine — barres empilées */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>📈 CA par semaine</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>8 dernières semaines</div>
          </div>
          {source === 'all' && (
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(135deg,#2a7d9c,#7dd3f0)' }} /> Particuliers</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(135deg,#0f2d3d,#1a5068)' }} /> Pro</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
          {weeklyData.map((w, i) => {
            const wTotal = source === 'particulier' ? w.caPart : source === 'pro' ? w.caPro : w.caPart + w.caPro;
            const partH = source !== 'pro' ? Math.max((w.caPart / maxCa) * 100, w.caPart > 0 ? 4 : 0) : 0;
            const proH = source !== 'particulier' ? Math.max((w.caPro / maxCa) * 100, w.caPro > 0 ? 4 : 0) : 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#0f172a' }}>{wTotal > 0 ? `${wTotal.toFixed(2).replace('.', ',')}€` : ''}</div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'stretch' }}>
                  {source !== 'pro' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: `${partH}px` }}
                      transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: w.caPart > 0 ? 'linear-gradient(to top,#2a7d9c,#7dd3f0)' : '#f1f5f9', borderRadius: source === 'all' ? '0 0 0 0' : '6px 6px 0 0', minHeight: w.caPart > 0 ? 2 : 0 }} />
                  )}
                  {source !== 'particulier' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: `${proH}px` }}
                      transition={{ duration: 0.5, delay: i * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: w.caPro > 0 ? 'linear-gradient(to top,#0f2d3d,#1a5068)' : 'transparent', borderRadius: source === 'all' ? '6px 6px 0 0' : '6px 6px 0 0', minHeight: w.caPro > 0 ? 2 : 0 }} />
                  )}
                </div>
                <div style={{ fontSize: 9, color: '#94a3b8' }}>{w.week}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Graphique inscriptions — masqué si filtre Pro */}
      {source !== 'pro' && (
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>👤 Inscriptions vérifiées par semaine</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>8 dernières semaines (comptes vérifiés uniquement)</div>
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
      </div>
      )}

      {loading && <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 12, marginTop: 16 }}>Chargement...</div>}
    </div>
  );
}
/* ══════════════════════════════════════════
   CLIENT SUPPORT SECTION
   Composant réutilisable affiché sur la fiche
   d'un user (particulier) ou d'un client pro.
   Affiche tickets ouverts (dépliés) + résolus (repliés)
   avec conversation inline + réponse + résolution.
   Polling 12s pour synchro temps réel.
══════════════════════════════════════════ */
function ClientSupportSection({ userId, isPro = false, showToast }: { userId: string; isPro?: boolean; showToast: (m: string) => void }) {
  type Ticket = { id: string; subject: string; status: 'open' | 'resolved'; created_at: string; updated_at: string; resolved_at: string | null; unread_by_admin: boolean };
  type Msg = { id: string; ticket_id: string; sender_type: 'user' | 'admin'; sender_name?: string | null; message: string; created_at: string };

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messagesByTicket, setMessagesByTicket] = useState<Record<string, Msg[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reply, setReply] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [resolvedShown, setResolvedShown] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('id, subject, status, created_at, updated_at, resolved_at, unread_by_admin')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    const list = (data || []) as Ticket[];
    setTickets(list);

    // Ouvre automatiquement tous les tickets "open" la première fois
    setExpanded(prev => {
      if (prev.size > 0) return prev;
      const next = new Set<string>();
      list.filter(t => t.status === 'open').forEach(t => next.add(t.id));
      return next;
    });

    setLoading(false);
  }, [userId]);

  const loadMessages = useCallback(async (ticketId: string, markRead = false) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessagesByTicket(prev => ({ ...prev, [ticketId]: (data || []) as Msg[] }));
    if (markRead) {
      await supabase.from('support_tickets').update({ unread_by_admin: false }).eq('id', ticketId);
    }
  }, []);

  // Chargement initial + polling 12s pour les tickets ouverts visibles
  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => {
    const i = setInterval(() => {
      loadTickets();
      expanded.forEach(tid => {
        const t = tickets.find(x => x.id === tid);
        if (t && t.status === 'open') loadMessages(tid);
      });
    }, 12000);
    return () => clearInterval(i);
  }, [loadTickets, loadMessages, expanded, tickets]);

  const toggleExpand = async (ticketId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
    if (!messagesByTicket[ticketId]) {
      await loadMessages(ticketId, true);
    } else {
      // Marquer comme lu si jamais
      const t = tickets.find(x => x.id === ticketId);
      if (t?.unread_by_admin) {
        await supabase.from('support_tickets').update({ unread_by_admin: false }).eq('id', ticketId);
        loadTickets();
      }
    }
  };

  const handleReply = async (ticketId: string) => {
    const txt = (reply[ticketId] || '').trim();
    if (!txt) return;
    setSending(ticketId);
    await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      sender_type: 'admin',
      message: txt,
      sender_name: 'Verimo',
    });
    await supabase.from('support_tickets').update({ unread_by_user: true, unread_by_admin: false, updated_at: new Date().toISOString() }).eq('id', ticketId);
    setReply(prev => ({ ...prev, [ticketId]: '' }));
    await loadMessages(ticketId);
    await loadTickets();
    setSending(null);
    showToast('Réponse envoyée');
  };

  const handleResolve = async (ticketId: string) => {
    await supabase.from('support_tickets').update({ status: 'resolved', resolved_at: new Date().toISOString(), unread_by_user: true }).eq('id', ticketId);
    await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      sender_type: 'admin',
      message: '✅ Ce ticket a été marqué comme résolu. Si vous avez d\'autres questions, n\'hésitez pas à ouvrir un nouveau ticket.',
      sender_name: 'Verimo',
    });
    await loadMessages(ticketId);
    await loadTickets();
    showToast('Ticket résolu');
  };

  const handleReopen = async (ticketId: string) => {
    await supabase.from('support_tickets').update({ status: 'open', resolved_at: null, unread_by_admin: false }).eq('id', ticketId);
    await loadTickets();
    showToast('Ticket rouvert');
  };

  const openTickets = tickets.filter(t => t.status === 'open');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');

  const renderTicket = (t: Ticket, isResolved: boolean) => {
    const isExpanded = expanded.has(t.id);
    const msgs = messagesByTicket[t.id] || [];
    const accentColor = isResolved ? '#16a34a' : '#2a7d9c';
    const accentBg = isResolved ? '#f0fdf4' : '#f0f7fb';
    return (
      <div key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
        {/* Ligne ticket */}
        <button onClick={() => toggleExpand(t.id)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px', border: 'none', background: t.unread_by_admin ? '#fffbeb' : 'transparent', cursor: 'pointer', textAlign: 'left' as const, fontFamily: 'inherit', transition: 'background 0.15s' }}
          onMouseOver={e => { if (!t.unread_by_admin) (e.currentTarget as HTMLElement).style.background = '#fafbfc'; }}
          onMouseOut={e => { if (!t.unread_by_admin) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isResolved ? <CheckCircle size={13} style={{ color: accentColor }} /> : <MessageSquare size={13} style={{ color: accentColor }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              {t.subject}
              {t.unread_by_admin && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {isResolved && t.resolved_at ? `Résolu ${fmtDate(t.resolved_at)}` : `Ouvert ${fmtRelative(t.created_at)}`} · MAJ {fmtRelative(t.updated_at)}
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: accentBg, color: accentColor }}>
            {isResolved ? 'Résolu' : 'En cours'}
          </span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} style={{ color: '#94a3b8' }} />
          </motion.div>
        </button>

        {/* Conversation */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 22px 18px', background: '#fafbfc', borderTop: '1px solid #f1f5f9' }}>
                {/* Messages */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, maxHeight: 360, overflowY: 'auto' as const, marginBottom: isResolved ? 0 : 12, padding: '4px 2px' }}>
                  {msgs.length === 0 ? (
                    <div style={{ padding: '14px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 12 }}>Chargement…</div>
                  ) : msgs.map(m => {
                    const isAdmin = m.sender_type === 'admin';
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '78%',
                          padding: '8px 12px',
                          borderRadius: 12,
                          background: isAdmin ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#fff',
                          border: isAdmin ? 'none' : '1px solid #edf2f7',
                          color: isAdmin ? '#fff' : '#0f172a',
                          fontSize: 13,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap' as const,
                          wordBreak: 'break-word' as const,
                        }}>
                          {m.message}
                          <div style={{ fontSize: 10, opacity: 0.75, marginTop: 4, fontWeight: 500 }}>
                            {isAdmin ? (m.sender_name || 'Verimo') : 'Client'} · {fmtRelative(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Zone de réponse ou actions */}
                {!isResolved ? (
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <textarea
                        value={reply[t.id] || ''}
                        onChange={e => setReply(prev => ({ ...prev, [t.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleReply(t.id);
                          }
                        }}
                        placeholder="Tapez votre réponse… (⌘+Entrée pour envoyer)"
                        rows={2}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const, lineHeight: 1.5 }}
                      />
                      <button
                        onClick={() => handleReply(t.id)}
                        disabled={!reply[t.id]?.trim() || sending === t.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: !reply[t.id]?.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)',
                          color: '#fff',
                          border: 'none',
                          cursor: !reply[t.id]?.trim() ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          opacity: sending === t.id ? 0.6 : 1,
                          fontFamily: 'inherit',
                        }}>
                        <Send size={13} />
                        {sending === t.id ? 'Envoi…' : 'Envoyer'}
                      </button>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <button onClick={() => handleResolve(t.id)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                        <CheckCircle size={12} /> Marquer résolu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <button onClick={() => handleReopen(t.id)}
                      style={{ padding: '6px 12px', borderRadius: 8, background: '#f0f7fb', border: '1px solid #bae3f5', color: '#2a7d9c', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                      <RefreshCw size={12} /> Rouvrir le ticket
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
        <LifeBuoy size={16} style={{ color: '#d97706' }} />
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Tickets support</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: '#f0f7fb', padding: '2px 8px', borderRadius: 6 }}>
          {openTickets.length} ouvert{openTickets.length > 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 6 }}>
          {resolvedTickets.length} résolu{resolvedTickets.length > 1 ? 's' : ''}
        </span>
        {isPro && <span style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c', background: '#f0f7fb', padding: '2px 7px', borderRadius: 6, marginLeft: 'auto' }}>PRO</span>}
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
      ) : tickets.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucun ticket pour ce client</div>
      ) : (
        <>
          {/* TICKETS OUVERTS */}
          {openTickets.length > 0 && (
            <div>
              <div style={{ padding: '8px 22px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                En cours
              </div>
              {openTickets.map(t => renderTicket(t, false))}
            </div>
          )}

          {/* TICKETS RÉSOLUS — repliés par défaut */}
          {resolvedTickets.length > 0 && (
            <div>
              <button onClick={() => setResolvedShown(s => !s)}
                style={{ width: '100%', padding: '10px 22px', background: '#f8fafc', border: 'none', borderTop: openTickets.length > 0 ? 'none' : '1px solid #f1f5f9', borderBottom: resolvedShown ? '1px solid #f1f5f9' : 'none', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
                <span>Historique ({resolvedTickets.length})</span>
                <motion.div animate={{ rotate: resolvedShown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={12} style={{ color: '#94a3b8' }} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {resolvedShown && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    {resolvedTickets.map(t => renderTicket(t, true))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   USERS TAB
══════════════════════════════════════════ */
function UsersTab({ onConfirm, showToast, logAction, focusUserId, onFocusUserHandled, onOpenAnalysis, onOpenProClient }: {
  onConfirm: (a: ConfirmAction) => void;
  showToast: (m: string) => void;
  logAction: (a: string, t?: string) => Promise<void>;
  focusUserId?: string | null;
  onFocusUserHandled?: () => void;
  onOpenAnalysis?: (analysisId: string) => void;
  onOpenProClient?: (userId: string) => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'invite' | 'credits' | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [proCreditsBalance, setProCreditsBalance] = useState<{ total_complete: number; total_document: number } | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userAnalyses, setUserAnalyses] = useState<AdminAnalyse[]>([]);
  const [userPayments, setUserPayments] = useState<AdminPayment[]>([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', credits_doc: 0, credits_complete: 0, credit_type: 'complete' as 'complete' | 'simple', credit_quantity: 1, credit_reason: '' });
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const [filterTab, setFilterTab] = useState<'all' | 'verified' | 'unverified' | 'pro'>('all');

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
    // Si user pro, rediriger vers l'onglet Clients Pro
    if (user.role === 'pro' && onOpenProClient) {
      onOpenProClient(user.id);
      return;
    }
    setDetailUser(user);
    setProCreditsBalance(null);
    const [{ data: analyses }, { data: payments }, { data: grants }] = await Promise.all([
      supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('credit_grants').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setUserAnalyses(analyses || []);

    // Fusionner payments + credit_grants dans un seul historique
    const grantPayments = (grants || []).map((g: Record<string, unknown>) => ({
      id: `grant-${g.id}`,
      user_id: user.id,
      amount: 0,
      status: 'completed',
      description: `+${g.quantity} crédit${(g.quantity as number) > 1 ? 's' : ''} ${g.credit_type === 'complete' ? 'Complète' : 'Simple'} offert${(g.quantity as number) > 1 ? 's' : ''} — ${g.reason || 'Aucune raison'}`,
      credits_added: g.quantity,
      credit_type: g.credit_type,
      promo_code: null,
      stripe_session_id: null,
      stripe_payment_id: null,
      retractation_waiver_at: null,
      created_at: g.created_at,
      _source: 'admin_grant',
    }));
    const allPayments = [...(payments || []), ...grantPayments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setUserPayments(allPayments as AdminPayment[]);

    // Pour les pros, charger le vrai solde de crédits
    if (user.role === 'pro') {
      const { data: credits } = await supabase.rpc('get_pro_credits_balance', { p_user_id: user.id });
      if (credits && credits.length > 0) setProCreditsBalance(credits[0]);
    }
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
      const matchTab = filterTab === 'all' ? true : filterTab === 'verified' ? u.email_verified === true : filterTab === 'unverified' ? u.email_verified === false : filterTab === 'pro' ? u.role === 'pro' : true;
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

  const handleAddCredits = async () => {
    if (!selectedUser) return;
    if (!form.credit_reason.trim()) {
      showToast('La raison est obligatoire');
      return;
    }
    if (form.credit_quantity < 1) {
      showToast('Quantité invalide');
      return;
    }
    setSending(true);

    // On récupère l'admin actuel pour granted_by
    const { data: { user: currentAdmin } } = await supabase.auth.getUser();

    // INSERT dans credit_grants → le trigger Postgres répercute automatiquement :
    //   - Si user pro → crée pro_unit_purchases (visible sidebar/NouvelleAnalyse)
    //   - Si user particulier → met à jour profiles.credits_*
    const { error } = await supabase.from('credit_grants').insert({
      user_id: selectedUser.id,
      granted_by: currentAdmin?.id || null,
      credit_type: form.credit_type === 'simple' ? 'document' : form.credit_type, // BDD attend 'document' ou 'complete'
      quantity: form.credit_quantity,
      reason: form.credit_reason.trim(),
    });

    if (error) {
      showToast('Erreur : ' + error.message);
      setSending(false);
      return;
    }

    await logAction(
      'Crédits offerts',
      `${selectedUser.email} → +${form.credit_quantity} ${form.credit_type === 'complete' ? 'complète' : 'simple'} · ${form.credit_reason.trim()}`
    );
    setSending(false);
    setModal(null);

    // Reset le form pour la prochaine fois
    setForm(f => ({ ...f, credit_type: 'complete', credit_quantity: 1, credit_reason: '' }));

    // Refresh des données
    await loadUsers();
    if (detailUser?.id === selectedUser.id) {
      // Recharger les crédits affichés depuis la BDD
      const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', selectedUser.id).single();
      if (refreshed) setDetailUser(u => u ? { ...u, ...refreshed } : u);
      // Rafraîchir aussi les crédits pro si c'est un pro
      if (selectedUser.role === 'pro') {
        const { data: credits } = await supabase.rpc('get_pro_credits_balance', { p_user_id: selectedUser.id });
        if (credits && credits.length > 0) setProCreditsBalance(credits[0]);
      }
    }
    showToast(`+${form.credit_quantity} crédit${form.credit_quantity > 1 ? 's' : ''} ${form.credit_type === 'complete' ? 'Complète' : 'Simple'} ajouté${form.credit_quantity > 1 ? 's' : ''} à ${selectedUser.email}`);
  };

  const doExport = () => {
    exportCSV(users.map(u => ({ email: u.email, nom: u.full_name || '', role: u.role, inscrit: fmtDate(u.created_at), credits_doc: u.credits_document || 0, credits_ana: u.credits_complete || 0 })), 'verimo-utilisateurs.csv');
    showToast('Export CSV téléchargé');
  };

  if (detailUser) {
    // Helper : montant TTC net (déduit refunded_amount)
    const netTtcUser = (p: any) => (p.amount || 0) - (p.refunded_amount || 0);
    // Total dépensé : completed full + partially_refunded au prorata net
    const totalSpent = userPayments
      .filter((p: any) => p.status === 'completed' || p.status === 'partially_refunded')
      .reduce((s, p: any) => s + netTtcUser(p), 0);
    const totalPaidPayments = userPayments.filter((p: any) => (p.status === 'completed' || p.status === 'partially_refunded') && p.amount > 0).length;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
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
                {detailUser.role === 'pro' && <Badge color="#2a7d9c" bg="#f0f7fb">⚡ pro</Badge>}
                {detailUser.suspended && <Badge color="#dc2626" bg="#fef2f2">suspendu</Badge>}
                {detailUser.email_verified === true
                  ? <Badge color="#16a34a" bg="#f0fdf4">✓ {detailUser.provider === 'google' ? 'via Google' : 'via Email'}</Badge>
                  : <Badge color="#f0a500" bg="#fffbeb">⚠ non vérifié</Badge>
                }
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {(() => {
                const failedCount = userAnalyses.filter(a => a.status === 'failed').length;
                const stats = [
                  { l: 'Crédits simples restants', v: detailUser.role === 'pro' ? (proCreditsBalance?.total_document ?? '…') : (detailUser.credits_document || 0), c: '#2a7d9c', sub: null as string | null },
                  { l: 'Crédits complets restants', v: detailUser.role === 'pro' ? (proCreditsBalance?.total_complete ?? '…') : (detailUser.credits_complete || 0), c: '#7c3aed', sub: null as string | null },
                  { l: 'Analyses réalisées', v: userAnalyses.length, c: '#16a34a', sub: failedCount > 0 ? `dont ${failedCount} en erreur` : null },
                  { l: 'Total dépensé', v: `${totalSpent.toFixed(2)}€ TTC`, c: '#f0a500', sub: null as string | null },
                ];
                return stats.map((s, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{s.l}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: s.c }}>{s.v}</span>
                    </div>
                    {s.sub && (
                      <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, marginTop: 4 }}>{s.sub}</div>
                    )}
                  </div>
                ));
              })()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginTop: 16 }}>
              <button onClick={() => { setSelectedUser(detailUser); setForm(f => ({ ...f, credit_type: 'complete', credit_quantity: 1, credit_reason: '' })); setModal('credits'); }}
                style={{ padding: '10px', borderRadius: 10, background: '#f0f7fb', border: '1.5px solid #bae3f5', color: '#2a7d9c', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={14} /> Ajouter des crédits
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
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14, minWidth: 0 }}>
            {/* Historique des paiements */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Euro size={16} style={{ color: '#16a34a' }} />
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Historique des paiements</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{userPayments.length}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                  {totalSpent.toFixed(2)}€ TTC · {totalPaidPayments} paiement{totalPaidPayments > 1 ? 's' : ''}
                </div>
              </div>
              {userPayments.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucun paiement</div>
              ) : userPayments.map((p, i) => {
                const days = daysSince(p.created_at);
                const isRefunded = (p as any).status === 'refunded';
                const isPartialRefund = (p as any).status === 'partially_refunded';
                const refundedAmt = (p as any).refunded_amount || 0;
                // Pros n'ont pas de droit de rétractation légal sur contrats à distance B2B
                const eligible = p._source !== 'pro' && days < 14 && p.amount > 0 && !isRefunded && !isPartialRefund;
                return (
                  <div key={p.id} style={{ padding: '14px 22px', borderBottom: i < userPayments.length - 1 ? '1px solid #f8fafc' : 'none', opacity: isRefunded ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: p.amount === 0 ? '#f5f3ff' : isRefunded ? '#fef2f2' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.amount === 0 ? <Tag size={15} style={{ color: '#7c3aed' }} /> : <Euro size={15} style={{ color: isRefunded ? '#dc2626' : '#16a34a' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isRefunded ? '#94a3b8' : '#0f172a', textDecoration: isRefunded ? 'line-through' : 'none', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            {p.amount === 0 ? 'Crédits offerts' : (
                              <>
                                <span>{p.amount.toFixed(2)}€</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>TTC</span>
                              </>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDateTime(p.created_at)}</div>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                          {p.description || 'Paiement'}
                          {p.promo_code && <span style={{ color: '#7c3aed', fontWeight: 700, marginLeft: 6 }}>· Code {p.promo_code}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 8 }}>
                          {isRefunded && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 7px', borderRadius: 6 }}>
                              REMBOURSÉ
                            </span>
                          )}
                          {isPartialRefund && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '3px 7px', borderRadius: 6 }}>
                              REMBOURSÉ {refundedAmt.toFixed(2)}€/{p.amount.toFixed(2)}€
                            </span>
                          )}
                          {p._source === 'admin_grant' && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '3px 7px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                              🎁 Offert par Admin
                            </span>
                          )}
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
              ) : userAnalyses.map((a, i) => {
                const isFailed = a.status === 'failed';
                const isCompleted = a.status === 'completed';
                const isInProgress = a.status === 'processing' || a.status === 'pending' || a.status === 'files_ready' || a.status === 'queued';
                return (
                  <div key={a.id} onClick={() => onOpenAnalysis?.(a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 22px', borderBottom: i < userAnalyses.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.address || a.adresse_bien || a.title || 'Sans titre'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDateTime(a.created_at)} · {PLAN_LABELS[a.type] || a.type}</div>
                    </div>
                    {a.score != null && <span style={{ fontSize: 13, fontWeight: 900, color: getScoreColor(a.score), background: getScoreBg(a.score), padding: '3px 9px', borderRadius: 8 }}>{a.score}/20</span>}
                    {isCompleted && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' as const }}>
                        ✓ Généré
                      </span>
                    )}
                    {isInProgress && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#f0f7fb', color: '#2a7d9c', border: '1px solid #bae3f5', whiteSpace: 'nowrap' as const }}>
                        ⏳ En cours
                      </span>
                    )}
                    {isFailed && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', whiteSpace: 'nowrap' as const }}>
                        ✕ Non généré
                        {a.progress_message && (
                          <span
                            onClick={(e) => { e.stopPropagation(); alert(a.progress_message); }}
                            title={a.progress_message}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', fontSize: 10, fontWeight: 800, cursor: 'help', marginLeft: 2 }}>
                            i
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Historique des tickets support — composant interactif avec conversation inline */}
            <ClientSupportSection userId={detailUser.id} isPro={false} showToast={showToast} />
          </div>
        </div>

        <AnimatePresence>
          {modal === 'credits' && selectedUser && (
            <Modal title={`Ajouter des crédits — ${selectedUser.email}`} onClose={() => setModal(null)}>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>

                {/* Bandeau d'info */}
                <div style={{ padding: '11px 14px', borderRadius: 10, background: '#f0f7fb', border: '1px solid #bae3f5', fontSize: 12, color: '#0f2d3d', lineHeight: 1.5 }}>
                  Les crédits offerts seront automatiquement utilisables par {selectedUser.role === 'pro' ? 'le pro depuis son dashboard et la page Nouvelle analyse' : 'le particulier sur son compte'}. La raison sera visible dans son historique.
                </div>

                {/* Type de crédit */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                    Type de crédit <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(['complete', 'simple'] as const).map(t => {
                      const isSelected = form.credit_type === t;
                      const config = t === 'complete'
                        ? { label: 'Complète', desc: 'Tous documents · score /20', bg: '#0f2d3d', color: '#fff' }
                        : { label: 'Simple', desc: '1 document · analyse ciblée', bg: '#f0f7fb', color: '#2a7d9c' };
                      return (
                        <button key={t} type="button" onClick={() => setForm(f => ({ ...f, credit_type: t }))}
                          style={{
                            padding: '12px 14px', borderRadius: 10,
                            background: isSelected ? config.bg : '#fff',
                            border: `1.5px solid ${isSelected ? config.bg : '#edf2f7'}`,
                            cursor: 'pointer', textAlign: 'left' as const,
                            transition: 'all 0.15s',
                          }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? config.color : '#0f172a', marginBottom: 2 }}>
                            {isSelected && '✓ '}{config.label}
                          </div>
                          <div style={{ fontSize: 11, color: isSelected ? (t === 'complete' ? 'rgba(255,255,255,0.7)' : config.color) : '#94a3b8' }}>
                            {config.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantité */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                    Quantité <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button type="button" onClick={() => setForm(f => ({ ...f, credit_quantity: Math.max(1, f.credit_quantity - 1) }))}
                      style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', border: '1.5px solid #edf2f7', color: '#475569', fontSize: 18, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>−</button>
                    <input type="number" min={1} max={100} value={form.credit_quantity}
                      onChange={e => setForm(f => ({ ...f, credit_quantity: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) }))}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 9, border: '1.5px solid #edf2f7', fontSize: 14, fontWeight: 700, color: '#0f172a', outline: 'none', textAlign: 'center' as const, background: '#fff' }} />
                    <button type="button" onClick={() => setForm(f => ({ ...f, credit_quantity: Math.min(100, f.credit_quantity + 1) }))}
                      style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', border: '1.5px solid #edf2f7', color: '#475569', fontSize: 18, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>+</button>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' as const }}>
                    Max 100 crédits par ajout
                  </div>
                </div>

                {/* Raison */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                    Raison de l'ajout <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    value={form.credit_reason}
                    onChange={e => setForm(f => ({ ...f, credit_reason: e.target.value }))}
                    placeholder="Ex: Compensation bug analyse&#10;Geste commercial&#10;Test interne&#10;Crédit promotionnel"
                    rows={3}
                    maxLength={500}
                    style={{ width: '100%', padding: '10px 13px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit', color: '#0f172a', resize: 'vertical' as const, minHeight: 70 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' as const }}>Visible par le client dans son historique</span>
                    <span style={{ color: form.credit_reason.length > 450 ? '#dc2626' : '#cbd5e1' }}>{form.credit_reason.length}/500</span>
                  </div>
                </div>

                {/* Bouton */}
                <button onClick={handleAddCredits} disabled={sending || !form.credit_reason.trim() || form.credit_quantity < 1}
                  style={{
                    padding: '12px', borderRadius: 11,
                    background: sending || !form.credit_reason.trim() || form.credit_quantity < 1
                      ? '#cbd5e1'
                      : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)',
                    border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: sending || !form.credit_reason.trim() || form.credit_quantity < 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}>
                  {sending ? 'Ajout en cours…' : <><Plus size={15} /> Ajouter {form.credit_quantity} crédit{form.credit_quantity > 1 ? 's' : ''} {form.credit_type === 'complete' ? 'Complète' : 'Simple'}</>}
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </motion.div>
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
          <button onClick={doExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => { setForm(f => ({ ...f, email: '', name: '' })); setFeedback(''); setModal('invite'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Send size={14} /> Inviter
          </button>
          <button onClick={() => { setForm(f => ({ ...f, email: '', password: '', name: '' })); setFeedback(''); setModal('create'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
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
          { id: 'pro', label: `🏢 Pro (${users.filter(u => u.role === 'pro').length})` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setFilterTab(t.id)}
            style={{ padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${filterTab === t.id ? '#2a7d9c' : '#edf2f7'}`, background: filterTab === t.id ? '#f0f7fb' : '#fff', color: filterTab === t.id ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filterTab === t.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
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
                  {user.role === 'pro' && <Badge color="#2a7d9c" bg="#f0f7fb">⚡ pro</Badge>}
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
          <Modal title={`Ajouter des crédits — ${selectedUser.email}`} onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>

              {/* Bandeau d'info */}
              <div style={{ padding: '11px 14px', borderRadius: 10, background: '#f0f7fb', border: '1px solid #bae3f5', fontSize: 12, color: '#0f2d3d', lineHeight: 1.5 }}>
                Les crédits offerts seront automatiquement utilisables par {selectedUser.role === 'pro' ? 'le pro depuis son dashboard et la page Nouvelle analyse' : 'le particulier sur son compte'}. La raison sera visible dans son historique.
              </div>

              {/* Type de crédit */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                  Type de crédit <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['complete', 'simple'] as const).map(t => {
                    const isSelected = form.credit_type === t;
                    const config = t === 'complete'
                      ? { label: 'Complète', desc: 'Tous documents · score /20', bg: '#0f2d3d', color: '#fff' }
                      : { label: 'Simple', desc: '1 document · analyse ciblée', bg: '#f0f7fb', color: '#2a7d9c' };
                    return (
                      <button key={t} type="button" onClick={() => setForm(f => ({ ...f, credit_type: t }))}
                        style={{
                          padding: '12px 14px', borderRadius: 10,
                          background: isSelected ? config.bg : '#fff',
                          border: `1.5px solid ${isSelected ? config.bg : '#edf2f7'}`,
                          cursor: 'pointer', textAlign: 'left' as const,
                          transition: 'all 0.15s',
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? config.color : '#0f172a', marginBottom: 2 }}>
                          {isSelected && '✓ '}{config.label}
                        </div>
                        <div style={{ fontSize: 11, color: isSelected ? (t === 'complete' ? 'rgba(255,255,255,0.7)' : config.color) : '#94a3b8' }}>
                          {config.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantité */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                  Quantité <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" onClick={() => setForm(f => ({ ...f, credit_quantity: Math.max(1, f.credit_quantity - 1) }))}
                    style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', border: '1.5px solid #edf2f7', color: '#475569', fontSize: 18, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>−</button>
                  <input type="number" min={1} max={100} value={form.credit_quantity}
                    onChange={e => setForm(f => ({ ...f, credit_quantity: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) }))}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 9, border: '1.5px solid #edf2f7', fontSize: 14, fontWeight: 700, color: '#0f172a', outline: 'none', textAlign: 'center' as const, background: '#fff' }} />
                  <button type="button" onClick={() => setForm(f => ({ ...f, credit_quantity: Math.min(100, f.credit_quantity + 1) }))}
                    style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', border: '1.5px solid #edf2f7', color: '#475569', fontSize: 18, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>+</button>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' as const }}>
                  Max 100 crédits par ajout
                </div>
              </div>

              {/* Raison */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                  Raison de l'ajout <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  value={form.credit_reason}
                  onChange={e => setForm(f => ({ ...f, credit_reason: e.target.value }))}
                  placeholder="Ex: Compensation bug analyse&#10;Geste commercial&#10;Test interne&#10;Crédit promotionnel"
                  rows={3}
                  maxLength={500}
                  style={{ width: '100%', padding: '10px 13px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit', color: '#0f172a', resize: 'vertical' as const, minHeight: 70 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
                  <span style={{ color: '#94a3b8', fontStyle: 'italic' as const }}>Visible par le client dans son historique</span>
                  <span style={{ color: form.credit_reason.length > 450 ? '#dc2626' : '#cbd5e1' }}>{form.credit_reason.length}/500</span>
                </div>
              </div>

              {/* Bouton */}
              <button onClick={handleAddCredits} disabled={sending || !form.credit_reason.trim() || form.credit_quantity < 1}
                style={{
                  padding: '12px', borderRadius: 11,
                  background: sending || !form.credit_reason.trim() || form.credit_quantity < 1
                    ? '#cbd5e1'
                    : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: sending || !form.credit_reason.trim() || form.credit_quantity < 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                {sending ? 'Ajout en cours…' : <><Plus size={15} /> Ajouter {form.credit_quantity} crédit{form.credit_quantity > 1 ? 's' : ''} {form.credit_type === 'complete' ? 'Complète' : 'Simple'}</>}
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
type AnalysisWithUser = AdminAnalyse & { userEmail?: string; userName?: string; userRole?: string };

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
      .select('id, email, full_name, role')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const enriched: AnalysisWithUser[] = rawAnalyses.map(a => ({
      ...a,
      userEmail: profileMap.get(a.user_id)?.email,
      userName: profileMap.get(a.user_id)?.full_name,
      userRole: profileMap.get(a.user_id)?.role,
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
    // Filtre statut : 'error' dans l'ancien code = 'failed' en vrai, et 'processing' inclut aussi 'queued' et 'pending'
    const matchFilter = filter === 'all'
      || (filter === 'failed' ? (a.status === 'failed' || a.status === 'error')
      : filter === 'processing' ? (a.status === 'processing' || a.status === 'pending' || a.status === 'queued')
      : a.status === filter);
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
    processing: analyses.filter(a => a.status === 'processing' || a.status === 'pending' || a.status === 'queued').length,
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
          <button onClick={doExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Filtres en tabs — animés */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' as const }}>
        {([
          { id: 'all', label: 'Toutes', count: counts.all, color: '#64748b' },
          { id: 'completed', label: '✓ Complétées', count: counts.completed, color: '#16a34a' },
          { id: 'processing', label: '⟳ En cours', count: counts.processing, color: '#2a7d9c' },
          { id: 'failed', label: '✗ Échouées', count: counts.failed, color: '#dc2626' },
        ] as const).map(f => {
          const active = filter === f.id;
          return (
            <motion.button
              key={f.id}
              onClick={() => setFilter(f.id)}
              whileTap={{ scale: 0.95 }}
              animate={{
                borderColor: active ? f.color : '#edf2f7',
                backgroundColor: active ? `${f.color}12` : '#ffffff',
                color: active ? f.color : '#64748b',
              }}
              transition={{ duration: 0.18 }}
              style={{ padding: '8px 14px', borderRadius: 10, borderWidth: 1.5, borderStyle: 'solid', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
              {f.label}
              <motion.span
                key={`${f.id}-${f.count}`}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18 }}
                style={{ padding: '1px 6px', borderRadius: 6, background: active ? f.color : '#f1f5f9', color: active ? '#fff' : '#94a3b8', fontSize: 11, fontWeight: 700 }}>
                {f.count}
              </motion.span>
            </motion.button>
          );
        })}
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
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}>
            {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
              : filtered.length === 0 ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucune analyse ne correspond à votre recherche</div>
              : filtered.map((a, i) => {
                const isFailed = a.status === 'failed' || a.status === 'error';
                return (
                <button key={a.id} onClick={() => setDetail(a)}
                  style={{ width: '100%', display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 90px 75px 110px 100px', padding: isFailed && a.progress_message ? '12px 18px 8px' : '12px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'start', border: 'none', borderRadius: 0, cursor: 'pointer', textAlign: 'left' as const, transition: 'background 0.15s', fontFamily: 'inherit' }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f0f7fb'}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, paddingTop: 4 }}>{a.address || a.adresse_bien || a.title || 'Sans titre'}</div>
                  <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, paddingTop: 5 }}>
                    {a.userEmail || <span style={{ color: '#e2e8f0', fontStyle: 'italic' as const }}>Client supprimé</span>}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <Badge color={PLAN_COLORS[a.type] || '#64748b'} bg={`${PLAN_COLORS[a.type] || '#64748b'}12`}>{PLAN_LABELS[a.type] || a.type}</Badge>
                  </div>
                  <div style={{ paddingTop: 2 }}>{a.score != null ? <span style={{ fontSize: 13, fontWeight: 900, color: getScoreColor(a.score), background: getScoreBg(a.score), padding: '3px 9px', borderRadius: 8 }}>{a.score}/20</span> : <span style={{ color: '#e2e8f0' }}>—</span>}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                    {
                      a.status === 'completed' ? <Badge color="#16a34a" bg="#f0fdf4">✓ Complétée</Badge>
                      : a.status === 'queued' ? <Badge color="#d97706" bg="#fffbeb">⏳ En queue</Badge>
                      : (a.status === 'processing' || a.status === 'pending') ? <Badge color="#2a7d9c" bg="#f0f7fb">⟳ En cours</Badge>
                      : <Badge color="#dc2626" bg="#fef2f2">✗ Échouée</Badge>
                    }
                    {isFailed && a.progress_message && (
                      <div
                        title={a.progress_message}
                        style={{
                          fontSize: 10.5,
                          color: '#b91c1c',
                          lineHeight: 1.35,
                          maxWidth: 240,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          fontStyle: 'italic' as const,
                          paddingLeft: 2,
                        }}>
                        {a.progress_message}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', paddingTop: 4 }}>{fmtDate(a.created_at)}</div>
                </button>
                );
              })}
          </motion.div>
        </AnimatePresence>
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
    origineLabel = '✨ Analyse non payée';
    origineColor = '#f0a500';
    origineBg = '#fffbeb';
  } else if (analysis.userRole === 'pro' || (!analysis.stripe_payment_id && !analysis.paid)) {
    origineLabel = '📊 Crédit abonnement Pro';
    origineColor = '#0f2d3d';
    origineBg = '#f0f7fb';
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
                  : analysis.status === 'queued' ? <Badge color="#d97706" bg="#fffbeb">⏳ En queue</Badge>
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
function MessagesTab({ onConfirm, showToast, onReadChange, onGoToUser, onGoToProClient }: { onConfirm: (a: ConfirmAction) => void; showToast: (m: string) => void; onReadChange: (n: number) => void; onGoToUser?: (userId: string) => void; onGoToProClient?: (userId: string) => void }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  // Filtres : 'all' (tous), 'general' (contact site), 'pro_modif' (demande modif pro), 'resolved' (lus)
  const [filter, setFilter] = useState<'all' | 'general' | 'pro_modif' | 'resolved'>('all');
  const [loading, setLoading] = useState(true);
  // Map email -> { id, role } pour pouvoir naviguer vers la fiche client au clic
  const [profilesByEmail, setProfilesByEmail] = useState<Map<string, { id: string; role: string }>>(new Map());

  // ─── Détecte le type d'un message à partir de son contenu ───
  // Une demande de modif pro commence par "[PRO — ..." dans le body.
  const detectType = (msg: ContactMessage): 'general' | 'pro_modif' => {
    if (msg.message && msg.message.trim().startsWith('[PRO —')) return 'pro_modif';
    if (msg.subject && msg.subject.toLowerCase().includes('identité professionnelle')) return 'pro_modif';
    return 'general';
  };

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    const msgs = data || [];
    setMessages(msgs);
    const unread = msgs.filter(m => !m.read).length;
    onReadChange(unread);

    // Récupère les profils correspondants aux emails des messages (pour navigation vers fiche)
    const emails = Array.from(new Set(msgs.map(m => (m.email || '').toLowerCase().trim()).filter(Boolean)));
    if (emails.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, email, role').in('email', emails);
      const map = new Map<string, { id: string; role: string }>();
      (profiles || []).forEach(p => { if (p.email) map.set(p.email.toLowerCase(), { id: p.id, role: p.role || 'particulier' }); });
      setProfilesByEmail(map);
    }

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

  // Compteurs par catégorie (calculés une fois pour les pills de filtres)
  const counts = useMemo(() => {
    const c = { all: 0, general: 0, pro_modif: 0, resolved: 0 };
    messages.forEach(m => {
      const t = detectType(m);
      if (m.read) c.resolved++;
      else {
        c.all++;
        if (t === 'general') c.general++;
        else c.pro_modif++;
      }
    });
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Application du filtre actif
  const filtered = useMemo(() => {
    return messages.filter(m => {
      const t = detectType(m);
      if (filter === 'all') return !m.read;
      if (filter === 'resolved') return m.read;
      if (filter === 'general') return !m.read && t === 'general';
      if (filter === 'pro_modif') return !m.read && t === 'pro_modif';
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, filter]);

  // Initiales pour avatar (2 lettres max)
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Couleur d'avatar dérivée du nom (stable, sympa)
  const getAvatarColor = (name: string) => {
    const colors = [
      { from: '#dbeafe', to: '#bfdbfe', text: '#1e40af' },
      { from: '#fef3c7', to: '#fde68a', text: '#a16207' },
      { from: '#ede9fe', to: '#ddd6fe', text: '#6b21a8' },
      { from: '#d1fae5', to: '#a7f3d0', text: '#047857' },
      { from: '#fce7f3', to: '#fbcfe8', text: '#9f1239' },
      { from: '#cffafe', to: '#a5f3fc', text: '#0e7490' },
      { from: '#ffedd5', to: '#fed7aa', text: '#c2410c' },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
  };

  // Aperçu du message sans le préfixe [PRO — ...] pour la liste
  const cleanPreview = (msg: ContactMessage) => {
    let text = msg.message || '';
    // Si demande pro, on saute la partie [PRO ...] jusqu'au "--- Modifications demandées ---"
    const modifIdx = text.indexOf('--- Modifications demandées ---');
    if (modifIdx >= 0) text = text.substring(modifIdx + '--- Modifications demandées ---'.length).trim();
    return text.replace(/\n+/g, ' ').slice(0, 120);
  };

  // Navigation vers fiche client (si l'email du message correspond à un compte)
  const linkedProfile = selected ? profilesByEmail.get((selected.email || '').toLowerCase().trim()) : null;
  const goToClient = () => {
    if (!linkedProfile) return;
    if (linkedProfile.role === 'pro' && onGoToProClient) onGoToProClient(linkedProfile.id);
    else if (onGoToUser) onGoToUser(linkedProfile.id);
  };

  // Définition des pills de filtre (avec labels et compteurs)
  const filterPills: { key: typeof filter; label: string; count: number; color: string }[] = [
    { key: 'all',        label: 'Tous (non lus)',      count: counts.all,        color: '#2a7d9c' },
    { key: 'general',    label: 'Contact général',     count: counts.general,    color: '#1e40af' },
    { key: 'pro_modif',  label: 'Demandes modif pro',  count: counts.pro_modif,  color: '#a16207' },
    { key: 'resolved',   label: 'Résolus',             count: counts.resolved,   color: '#047857' },
  ];

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Messages</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{counts.all} non lu{counts.all > 1 ? 's' : ''} · {messages.length} au total</p>
        </div>
        {counts.all > 0 && (
          <button onClick={markAllRead}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #d1fae5', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <CheckCircle size={13} /> Tout marquer lu
          </button>
        )}
      </div>

      {/* Pills de filtre */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
        {filterPills.map(p => {
          const active = filter === p.key;
          return (
            <button key={p.key} onClick={() => setFilter(p.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 100,
                border: active ? `1.5px solid ${p.color}` : '1.5px solid #edf2f7',
                background: active ? `${p.color}12` : '#fff',
                color: active ? p.color : '#64748b',
                fontSize: 12.5, fontWeight: active ? 700 : 600, cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {p.label}
              <span style={{ fontSize: 11, fontWeight: 800, color: active ? p.color : '#94a3b8', background: active ? '#fff' : '#f1f5f9', padding: '1px 8px', borderRadius: 100, minWidth: 18, textAlign: 'center' as const }}>{p.count}</span>
            </button>
          );
        })}
      </div>

      {/* Grille principale : liste + détail */}
      <div className="admin-messages-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
            : filtered.length === 0 ? (
              <div style={{ padding: '52px 32px', textAlign: 'center' as const, color: '#94a3b8' }}>
                <Mail size={36} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {filter === 'resolved' ? 'Aucun message résolu' : filter === 'pro_modif' ? 'Aucune demande de modif pro' : filter === 'general' ? 'Aucun message de contact général' : 'Aucun message non lu'}
                </div>
              </div>
            ) : filtered.map((msg, i) => {
              const type = detectType(msg);
              const avatar = getAvatarColor(msg.name || '?');
              const isLinked = profilesByEmail.has((msg.email || '').toLowerCase().trim());
              return (
                <div key={msg.id} onClick={() => { setSelected(msg); if (!msg.read) markRead(msg); }}
                  style={{ padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: selected?.id === msg.id ? '#f0f7fb' : msg.read ? '#fff' : '#fffef0', transition: 'background 0.15s', display: 'flex', gap: 12, alignItems: 'flex-start' }}>

                  {/* Avatar avec initiales */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${avatar.from}, ${avatar.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' as const }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: avatar.text }}>{getInitials(msg.name || '?')}</span>
                    {!msg.read && <div style={{ position: 'absolute' as const, top: -3, right: -3, width: 11, height: 11, borderRadius: '50%', background: '#f0a500', border: '2px solid #fff' }} />}
                  </div>

                  {/* Corps */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3, gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: msg.read ? 600 : 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{msg.name}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{fmtDate(msg.created_at)}</span>
                    </div>
                    {/* Badge de type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' as const }}>
                      {type === 'pro_modif' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, background: '#fef3c7', color: '#a16207', fontSize: 10, fontWeight: 700, letterSpacing: '0.02em' }}>
                          <Pencil size={9} /> Demande modif pro
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, background: '#dbeafe', color: '#1e40af', fontSize: 10, fontWeight: 700, letterSpacing: '0.02em' }}>
                          <Mail size={9} /> Contact général
                        </span>
                      )}
                      {isLinked && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 100, background: '#d1fae5', color: '#047857', fontSize: 10, fontWeight: 700 }}>
                          <CheckCircle size={9} /> Compte lié
                        </span>
                      )}
                    </div>
                    {/* Aperçu */}
                    <div style={{ fontSize: 11.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: 2 }}>{msg.email}</div>
                    <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, lineHeight: 1.4 }}>{cleanPreview(msg)}</div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Panneau de détail */}
        {selected && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', height: 'fit-content' }}>

            {/* En-tête détail */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
                {(() => {
                  const av = getAvatarColor(selected.name || '?');
                  return (
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${av.from}, ${av.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: av.text }}>{getInitials(selected.name || '?')}</span>
                    </div>
                  );
                })()}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{selected.name}</div>
                  <a href={`mailto:${selected.email}`} style={{ fontSize: 13, color: '#2a7d9c', textDecoration: 'none', fontWeight: 600 }}>{selected.email}</a>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, cursor: 'pointer', color: '#94a3b8', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={15} /></button>
            </div>

            {/* Badge type */}
            <div style={{ marginBottom: 14 }}>
              {detectType(selected) === 'pro_modif' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: '#fef3c7', color: '#a16207', fontSize: 11, fontWeight: 700 }}>
                  <Pencil size={11} /> Demande de modification pro
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 700 }}>
                  <Mail size={11} /> Contact général
                </span>
              )}
            </div>

            {/* Sujet */}
            {selected.subject && <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14, padding: '9px 12px', background: '#f8fafc', borderRadius: 9 }}>Sujet : {selected.subject}</div>}

            {/* Corps du message */}
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' as const }}>{selected.message}</div>

            {/* Date */}
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 20 }}>{fmtDateTime(selected.created_at)}</div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Votre message Verimo'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <Send size={13} /> Répondre
              </a>
              {linkedProfile && (
                <button onClick={goToClient}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#fff', border: '1.5px solid #c7dde8', color: '#2a7d9c', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0f7fb'; el.style.borderColor = '#2a7d9c'; }}
                  onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#c7dde8'; }}>
                  <User size={13} /> Voir la fiche {linkedProfile.role === 'pro' ? 'pro' : 'client'}
                </button>
              )}
              <button onClick={() => onConfirm({ title: 'Supprimer le message', message: `Supprimer le message de ${selected.name} ?`, confirmLabel: 'Supprimer', variant: 'danger', onConfirm: async () => { await supabase.from('contact_messages').delete().eq('id', selected.id); setSelected(null); loadMessages(); showToast('Message supprimé'); } })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
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
    audience: 'all' as 'all' | 'pro' | 'particulier',
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
      audience: form.audience,
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
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
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
                    style={{ padding: '5px 8px', borderRadius: 7, background: promo.active ? '#fffbeb' : '#f0fdf4', border: `1px solid ${promo.active ? '#fde68a' : '#d1fae5'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {promo.active ? <EyeOff size={12} color="#f0a500" /> : <Eye size={12} color="#16a34a" />}
                  </button>
                  <button onClick={() => onConfirm({ title: 'Supprimer le code', message: `Supprimer le code ${promo.code} définitivement ?`, confirmLabel: 'Supprimer', variant: 'danger', onConfirm: async () => { await supabase.from('promo_codes').delete().eq('id', promo.id); await logAction('Code supprimé', promo.code); loadPromos(); showToast('Code supprimé'); } })}
                    style={{ padding: '5px 8px', borderRadius: 7, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.2s' }}>
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
                      style={{ padding: '8px 12px', borderRadius: 8, background: promo.active ? '#fffbeb' : '#f0fdf4', border: `1px solid ${promo.active ? '#fde68a' : '#d1fae5'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {promo.active ? <EyeOff size={14} color="#f0a500" /> : <Eye size={14} color="#16a34a" />}
                    </button>
                    <button onClick={() => onConfirm({ title: 'Supprimer le code', message: `Supprimer le code ${promo.code} définitivement ?`, confirmLabel: 'Supprimer', variant: 'danger', onConfirm: async () => { await supabase.from('promo_codes').delete().eq('id', promo.id); await logAction('Code supprimé', promo.code); loadPromos(); showToast('Code supprimé'); } })}
                      style={{ padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.2s' }}>
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

              {/* Audience */}
              <div style={{ padding: '14px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Qui peut utiliser ce code ?</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {([
                    { value: 'all',         icon: '👥', label: 'Tous',          color: '#0f2d3d' },
                    { value: 'pro',         icon: '💼', label: 'Pros',          color: '#7c3aed' },
                    { value: 'particulier', icon: '👤', label: 'Particuliers',  color: '#0891b2' },
                  ] as const).map(a => {
                    const selected = form.audience === a.value;
                    return (
                      <button key={a.value}
                        onClick={() => setForm(f => ({ ...f, audience: a.value }))}
                        style={{ padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${selected ? a.color : '#edf2f7'}`, background: selected ? '#fff' : '#f8fafc', color: selected ? a.color : '#64748b', fontSize: 12.5, fontWeight: selected ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{a.icon}</span>
                        <span>{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                {form.audience !== 'all' && ` · ${form.audience === 'pro' ? '💼 Pros seulement' : '👤 Particuliers seulement'}`}
                {form.expires_at && ` · expire le ${fmtDate(form.expires_at)}`}
                {form.max_uses && ` · max ${form.max_uses} utilisations`}
                {form.restricted_email && ` · limité à ${form.restricted_email}`}
              </div>

              <button onClick={handleCreate}
                style={{ padding: '13px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
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
  notes_admin?: string; created_at: string; converted_profile_id?: string; converted_at?: string;
};

const proTypeBadge: Record<string, { label: string; color: string; bg: string; border: string }> = {
  agent: { label: '🏢 Agent', color: '#2a7d9c', bg: '#f0f7fb', border: '#d0e8f0' },
  investisseur: { label: '📈 Investisseur', color: '#7c3aed', bg: '#f5f3ff', border: '#e0d6ff' },
  notaire: { label: '⚖️ Notaire', color: '#0f2d3d', bg: '#f4f7f9', border: '#d8e2e8' },
  autre: { label: '💼 Autre', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

function DemandesProTab({ onConfirm, showToast, onReadChange, onCreatePro }: { onConfirm: (a: ConfirmAction) => void; showToast: (m: string) => void; onReadChange: (n: number) => void; onCreatePro?: (d: Record<string, unknown>) => void }) {
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
              style={{ padding: '7px 12px', borderRadius: 10, border: `1.5px solid ${filterType === f.id ? '#2a7d9c' : '#edf2f7'}`, background: filterType === f.id ? '#f0f7fb' : '#fff', color: filterType === f.id ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filterType === f.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Trash2 size={13} /> Supprimer
              </button>
              {onCreatePro && !selected.converted_profile_id && (
                <button onClick={() => onCreatePro({ ...selected, contact_pro_id: selected.id })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: '#0f2d3d', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <UserPlus size={13} /> Créer compte pro
                </button>
              )}
              {selected.converted_profile_id && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 11, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 13, fontWeight: 700 }}>
                  <CheckCircle size={13} /> Compte créé
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CLIENTS PRO TAB
══════════════════════════════════════════ */
type ProClient = {
  id: string; full_name?: string; email?: string; telephone?: string; role: string;
  pro_profile_type?: string; pro_company_name?: string; pro_ville?: string; pro_network?: string;
  pro_siret?: string; pro_company_address?: string; pro_postal_code?: string;
  pro_notes_admin?: string; pro_created_at?: string; pro_recommended_plan?: string;
  pro_onboarding_done?: boolean; credits_document?: number; credits_complete?: number;
  cgv_pro_accepted_at?: string | null; cgv_pro_version?: string | null;
  pro_status?: string | null;
  pro_agence_subscription_unlocked?: boolean; // 🏛 TRUE si l'admin a envoyé la proposition agence
  pro_agence_proposition_sent_at?: string | null; // 🏛 Date d'envoi de la proposition
  suspended?: boolean; created_at: string;
};
type ProInvitation = { id: string; profile_id: string; email: string; token: string; sent_at?: string; accepted_at?: string; created_at: string };

function ClientsProTab({ showToast, logAction, prefillDemande, onPrefillHandled, focusClientId, onFocusClientHandled }: {
  showToast: (m: string) => void; logAction: (a: string, t?: string) => Promise<void>;
  prefillDemande: Record<string, unknown> | null; onPrefillHandled: () => void;
  focusClientId?: string | null; onFocusClientHandled?: () => void;
}) {
  const [clients, setClients] = useState<ProClient[]>([]);
  const [proSubscriptions, setProSubscriptions] = useState<Map<string, string>>(new Map());
  const [proCancelScheduled, setProCancelScheduled] = useState<Set<string>>(new Set());
  const [proCanceled, setProCanceled] = useState<Set<string>>(new Set());
  const [proActivated, setProActivated] = useState<Set<string>>(new Set());
  const [proFilter, setProFilter] = useState<'all' | 'demo' | 'active' | 'cancel_scheduled' | 'activated' | 'inactive' | 'canceled'>('all');
  const [filterByType, setFilterByType] = useState<string>('all'); // 🆕 Filtre par type de profil (agent/investisseur/notaire/autre)
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  // 🆕 State pour le modal d'invitation démo
  const [showDemoInvite, setShowDemoInvite] = useState(false);
  const [demoForm, setDemoForm] = useState({
    full_name: '',
    email: '',
    telephone: '',
    pro_profile_type: 'agent',
    pro_company_name: '',
    pro_network: '',
    pro_siret: '',
    pro_company_address: '',
    pro_postal_code: '',
    pro_ville: '',
    pro_notes_admin: '',
    custom_message: '',
  });
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [demoError, setDemoError] = useState('');
  const [demoSending, setDemoSending] = useState(false);
  const [selected, setSelected] = useState<ProClient | null>(null);
  const [invitations, setInvitations] = useState<ProInvitation[]>([]);
  const [clientAnalyses, setClientAnalyses] = useState<{ id: string; title: string; address?: string; status: string; score?: number; created_at: string }[]>([]);
  const [clientShares, setClientShares] = useState<{ id: string; recipient_name: string; recipient_email: string; sent_at: string; opened_at?: string }[]>([]);
  // 🆕 Type + state pour callbacks
  type ClientCallback = { id: string; phone: string; preferred_slots: string[]; message: string | null; context: string; status: 'pending' | 'called' | 'converted' | 'declined'; created_at: string; handled_at: string | null; admin_notes: string | null };
  const [clientCallbacks, setClientCallbacks] = useState<ClientCallback[]>([]);
  const [clientSubscription, setClientSubscription] = useState<{ plan: string; status: string; current_period_end?: string; cancel_at_period_end?: boolean; canceled_at?: string; cancellation_reason?: string; credits_complete_total: number; credits_complete_used: number; credits_simple_total: number; credits_simple_used: number; scheduled_plan_change?: string | null; scheduled_change_date?: string | null } | null>(null);
  const [proClientCredits, setProClientCredits] = useState<{ total_complete: number; total_document: number } | null>(null);
  const [clientInvoices, setClientInvoices] = useState<{ id: string; date: string; description: string; amount: string; pdf_url: string | null; type: string; status?: string; status_label?: string; status_variant?: 'success' | 'pending' | 'failed' | 'void' | 'refunded'; refunded_amount?: string | null; failure_reason?: string | null; attempt_count?: number }[]>([]);
  const [clientInvoicesLoading, setClientInvoicesLoading] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [notifyProOnSave, setNotifyProOnSave] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editTelephone, setEditTelephone] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editNetwork, setEditNetwork] = useState('');
  const [editSiret, setEditSiret] = useState('');
  const [editVille, setEditVille] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editCompanyAddress, setEditCompanyAddress] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [analysesExpanded, setAnalysesExpanded] = useState(false);
  const [envoisExpanded, setEnvoisExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // Form state
  const [form, setForm] = useState({
    full_name: '', email: '', telephone: '',
    pro_profile_type: 'agent', pro_company_name: '', pro_company_address: '',
    pro_postal_code: '', pro_siret: '', pro_ville: '', pro_network: '',
    pro_notes_admin: '', pro_recommended_plan: '' as string,
    credits_document: '0', credits_complete: '0',
    contact_pro_id: '' as string,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadClients = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: subs }, { data: invs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'pro').order('pro_created_at', { ascending: false }),
      // On charge active, past_due ET canceled pour pouvoir filtrer par statut résiliation
      // - active + cancel_at_period_end=true → résiliation programmée
      // - canceled → résilié définitivement
      supabase.from('pro_subscriptions').select('user_id, status, cancel_at_period_end').in('status', ['active', 'past_due', 'canceled']),
      // Invitations acceptées = pro qui a cliqué sur le lien et défini son mot de passe
      supabase.from('pro_invitations').select('profile_id, accepted_at').not('accepted_at', 'is', null),
    ]);
    setClients((data || []) as ProClient[]);
    const subMap = new Map<string, string>();
    const cancelScheduled = new Set<string>();
    const canceled = new Set<string>();
    (subs || []).forEach((s: any) => {
      if (s.status === 'canceled') {
        canceled.add(s.user_id);
      } else {
        // active ou past_due → considéré comme abonné
        subMap.set(s.user_id, s.status);
        if (s.cancel_at_period_end) cancelScheduled.add(s.user_id);
      }
    });
    setProSubscriptions(subMap);
    setProCancelScheduled(cancelScheduled);
    setProCanceled(canceled);
    const activatedSet = new Set<string>();
    (invs || []).forEach((inv: any) => activatedSet.add(inv.profile_id));
    setProActivated(activatedSet);
    setLoading(false);
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  // Prefill from demande pro
  useEffect(() => {
    if (prefillDemande) {
      const d = prefillDemande as Record<string, string>;
      const pd = (prefillDemande.profile_data || {}) as Record<string, string>;
      setForm({
        full_name: `${d.prenom || ''} ${d.nom || ''}`.trim(),
        email: d.email || '',
        telephone: d.telephone || '',
        pro_profile_type: d.profile_type || 'agent',
        pro_company_name: pd.nomAgence || pd.nomSociete || pd.nomEtude || pd.nomStructure || pd.nomSocieteMarchand || '',
        pro_company_address: pd.adresseAgence || pd.adresseEtude || '',
        pro_postal_code: pd.codePostal || '',
        pro_siret: pd.siret || pd.rsac || pd.siretMarchand || '',
        pro_ville: d.ville || pd.zoneGeographique || '',
        pro_network: pd.reseau || '',
        pro_notes_admin: d.message ? `Demande originale : ${d.message}` : '',
        pro_recommended_plan: '',
        credits_document: '0',
        credits_complete: '0',
        contact_pro_id: d.contact_pro_id || d.id || '',
      });
      setShowCreate(true);
      onPrefillHandled();
    }
  }, [prefillDemande, onPrefillHandled]);

  const loadClientDetail = async (client: ProClient) => {
    setSelected(client);
    setEditingIdentity(false);
    setEditCompanyName(client.pro_company_name || '');
    setEditNetwork(client.pro_network || '');
    setEditSiret(client.pro_siret || '');
    setEditVille(client.pro_ville || '');
    setEditPostalCode((client as any).pro_postal_code || '');
    setEditCompanyAddress(client.pro_company_address || '');
    // Invitations
    const { data: inv } = await supabase.from('pro_invitations').select('*').eq('profile_id', client.id).order('created_at', { ascending: false });
    setInvitations((inv || []) as ProInvitation[]);
    // Analyses
    const { data: anal } = await supabase.from('analyses').select('id, title, address, status, created_at, result').eq('user_id', client.id).order('created_at', { ascending: false }).limit(20);
    setClientAnalyses((anal || []).map((a: Record<string, unknown>) => ({
      id: a.id as string, title: a.title as string, address: a.address as string | undefined,
      status: a.status as string, created_at: a.created_at as string,
      score: (a.result && typeof a.result === 'object' && 'score' in (a.result as Record<string, unknown>)) ? (a.result as Record<string, number>).score : undefined,
    })));
    // Shares
    const { data: sh } = await supabase.from('report_shares').select('id, recipient_name, recipient_email, sent_at, opened_at').eq('sender_id', client.id).order('sent_at', { ascending: false }).limit(20);
    setClientShares((sh || []) as typeof clientShares);
    // 🆕 Callbacks du client
    const { data: cbs } = await supabase
      .from('callback_requests')
      .select('id, phone, preferred_slots, message, context, status, created_at, handled_at, admin_notes')
      .eq('user_id', client.id)
      .order('created_at', { ascending: false });
    setClientCallbacks((cbs || []) as ClientCallback[]);
    // Subscription
    const { data: sub } = await supabase.from('pro_subscriptions').select('*').eq('user_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    setClientSubscription(sub as typeof clientSubscription);
    // Crédits pro (agrège abo + unitaires + offerts)
    const { data: credits } = await supabase.rpc('get_pro_credits_balance', { p_user_id: client.id });
    if (credits && credits.length > 0) setProClientCredits(credits[0]);
    else setProClientCredits(null);

    // Factures du client via edge function
    setClientInvoicesLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ mode: 'list_invoices', target_user_id: client.id }),
        });
        const data = await res.json();
        if (data.invoices) setClientInvoices(data.invoices.filter((inv: any) => inv.type === 'subscription' || inv.type === 'unit'));
        else setClientInvoices([]);
      }
    } catch { setClientInvoices([]); }
    setClientInvoicesLoading(false);
  };

  // Auto-open client from external navigation (e.g. from Users tab)
  useEffect(() => {
    if (!focusClientId || clients.length === 0) return;
    const client = clients.find(c => c.id === focusClientId);
    if (client) {
      loadClientDetail(client);
      onFocusClientHandled?.();
    }
  }, [focusClientId, clients]);

  const handleCreate = async () => {
    if (!form.email || !form.full_name) { setCreateError('Nom et email obligatoires.'); return; }
    setCreating(true); setCreateError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Si type=agence : force le plan recommandé à 'agence' et vide les crédits offerts
      const formToSend = form.pro_profile_type === 'agence'
        ? { ...form, pro_recommended_plan: 'agence', credits_document: '0', credits_complete: '0' }
        : form;

      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ action: 'create_pro', ...formToSend }),
      });
      const data = await res.json();
      if (data.error) { setCreateError(data.error); setCreating(false); return; }
      await logAction('Compte pro créé', form.email);

      // 🏛 Si type=agence : enchaîner avec l'envoi automatique de la proposition agence
      if (form.pro_profile_type === 'agence' && data.user?.id) {
        try {
          const resAgence = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
            body: JSON.stringify({ action: 'unlock_agence_subscription', profile_id: data.user.id }),
          });
          const dataAgence = await resAgence.json();
          if (dataAgence.error) {
            showToast(`Compte créé mais ⚠️ proposition agence non envoyée : ${dataAgence.error}`);
          } else if (dataAgence.mail_sent === false) {
            showToast(`Compte créé mais ⚠️ mail proposition non envoyé : ${dataAgence.mail_error || 'erreur Mailjet'}`);
          } else {
            showToast(`🏛 Compte agence créé et proposition envoyée à ${form.email}`);
            await logAction('Proposition agence envoyée (auto à la création)', form.email);
          }
        } catch (e) {
          showToast(`Compte créé mais ⚠️ erreur envoi proposition : ${String(e)}`);
        }
      } else {
        showToast(`Compte pro ${form.email} créé`);
      }

      setShowCreate(false);
      setForm({ full_name: '', email: '', telephone: '', pro_profile_type: 'agent', pro_company_name: '', pro_company_address: '', pro_postal_code: '', pro_siret: '', pro_ville: '', pro_network: '', pro_notes_admin: '', pro_recommended_plan: '', credits_document: '0', credits_complete: '0', contact_pro_id: '' });
      loadClients();
    } catch (e) { setCreateError(String(e)); }
    setCreating(false);
  };

  // 🆕 Envoi de l'invitation démo avec PDF en pièce jointe
  const handleDemoInvite = async () => {
    if (!demoForm.email || !demoForm.full_name) {
      setDemoError('Email et nom complet obligatoires.');
      return;
    }
    if (!demoForm.email.includes('@')) {
      setDemoError('Email invalide.');
      return;
    }
    setDemoSending(true); setDemoError('');
    try {
      // Convertir le PDF en base64 si fourni
      let attachment: { filename: string; contentType: string; base64Content: string } | undefined;
      if (demoFile) {
        if (demoFile.size > 12 * 1024 * 1024) {
          setDemoError('Le fichier dépasse 12 Mo.');
          setDemoSending(false);
          return;
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Extraire la partie base64 après "data:application/pdf;base64,"
            const base64Part = result.split(',')[1] || '';
            resolve(base64Part);
          };
          reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
          reader.readAsDataURL(demoFile);
        });
        attachment = {
          filename: demoFile.name,
          contentType: demoFile.type || 'application/pdf',
          base64Content: base64,
        };
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({
          action: 'create_pro_demo',
          email: demoForm.email,
          full_name: demoForm.full_name,
          telephone: demoForm.telephone || null,
          pro_profile_type: demoForm.pro_profile_type || 'autre',
          pro_company_name: demoForm.pro_company_name || null,
          pro_network: demoForm.pro_network || null,
          pro_siret: demoForm.pro_siret || null,
          pro_company_address: demoForm.pro_company_address || null,
          pro_postal_code: demoForm.pro_postal_code || null,
          pro_ville: demoForm.pro_ville || null,
          pro_notes_admin: demoForm.pro_notes_admin || null,
          custom_message: demoForm.custom_message || null,
          attachment,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setDemoError(data.error);
        setDemoSending(false);
        return;
      }
      await logAction('Compte démo créé + mail envoyé', demoForm.email);
      showToast(`Invitation démo envoyée à ${demoForm.email}${data.attachment_sent ? ' avec PJ' : ''}`);
      setShowDemoInvite(false);
      setDemoForm({ full_name: '', email: '', telephone: '', pro_profile_type: 'agent', pro_company_name: '', pro_network: '', pro_siret: '', pro_company_address: '', pro_postal_code: '', pro_ville: '', pro_notes_admin: '', custom_message: '' });
      setDemoFile(null);
      loadClients();
    } catch (e) { setDemoError(String(e)); }
    setDemoSending(false);
  };

  // 🆕 Activer un compte démo (sortie de démo + ajout crédits) — sera utilisé en session 2 (bouton "Activer le compte")
  const handleActivateDemo = async (profileId: string, addDoc: number, addComplete: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({
          action: 'activate_pro_demo',
          profile_id: profileId,
          credits_document_add: addDoc,
          credits_complete_add: addComplete,
        }),
      });
      const data = await res.json();
      if (data.error) { showToast('Erreur : ' + data.error); return; }
      await logAction('Compte démo activé', `${profileId} (+${addDoc} simple, +${addComplete} complète)`);
      showToast('Compte activé — sorti du mode démo');
      loadClients();
      if (selected) loadClientDetail(selected);
    } catch (e) { showToast('Erreur : ' + String(e)); }
  };

  // 🆕 State pour le modal "Activer le compte"
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateForm, setActivateForm] = useState({ credits_simple: '0', credits_complete: '0' });
  const [activating, setActivating] = useState(false);

  // 🆕 Dropdown pour modifier le type de profil depuis la fiche
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [updatingType, setUpdatingType] = useState(false);

  const updateProfileType = async (newType: string) => {
    if (!selected) return;
    setUpdatingType(true);
    try {
      const { error } = await supabase.from('profiles').update({ pro_profile_type: newType }).eq('id', selected.id);
      if (error) { showToast('Erreur : ' + error.message); setUpdatingType(false); return; }
      setSelected(prev => prev ? { ...prev, pro_profile_type: newType } : null);
      await logAction(`Type de profil modifié : ${selected.full_name} → ${newType}`);
      showToast('Type de profil mis à jour');
      setTypeDropdownOpen(false);
      loadClients();
    } catch (e) {
      showToast('Erreur : ' + String(e));
    }
    setUpdatingType(false);
  };

  // 🏛 ─── State + handlers pour la proposition agence ──────────────
  const [agenceActionLoading, setAgenceActionLoading] = useState(false);
  const [showConfirmUnlockAgence, setShowConfirmUnlockAgence] = useState(false);
  const [showConfirmCancelAgence, setShowConfirmCancelAgence] = useState(false);

  // Envoyer la proposition agence : débloque la souscription Stripe + envoie le mail HTML
  const handleUnlockAgenceProposal = async (isResend = false) => {
    if (!selected) return;
    setAgenceActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ action: 'unlock_agence_subscription', profile_id: selected.id }),
      });
      const data = await res.json();
      if (data.error) {
        showToast('Erreur : ' + data.error);
      } else {
        if (data.mail_sent === false) {
          showToast('Souscription débloquée mais ⚠️ mail non envoyé : ' + (data.mail_error || 'erreur Mailjet'));
        } else {
          showToast(isResend ? `🔄 Proposition renvoyée à ${data.sent_to}` : `🏛 Proposition agence envoyée à ${data.sent_to}`);
        }
        await logAction(isResend ? 'Proposition agence renvoyée' : 'Proposition agence envoyée', selected.email || '');
        loadClients();
        if (selected) loadClientDetail(selected);
      }
    } catch (e) { showToast('Erreur : ' + String(e)); }
    setAgenceActionLoading(false);
    setShowConfirmUnlockAgence(false);
  };

  // Annuler la proposition agence : remet le flag à false (suppression silencieuse, sans mail)
  const handleCancelAgenceProposal = async () => {
    if (!selected) return;
    setAgenceActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ action: 'cancel_agence_proposition', profile_id: selected.id }),
      });
      const data = await res.json();
      if (data.error) {
        showToast('Erreur : ' + data.error);
      } else {
        showToast('🚫 Proposition agence annulée');
        await logAction('Proposition agence annulée', selected.email || '');
        loadClients();
        if (selected) loadClientDetail(selected);
      }
    } catch (e) { showToast('Erreur : ' + String(e)); }
    setAgenceActionLoading(false);
    setShowConfirmCancelAgence(false);
  };
  // ─── Fin handlers agence ─────────────────────────────────────────

  const sendInvitation = async (profileId: string, isResend = false) => {
    setSendingInvite(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ action: isResend ? 'resend_pro_invitation' : 'send_pro_invitation', profile_id: profileId }),
      });
      const data = await res.json();
      if (data.error) { showToast('Erreur : ' + data.error); } else {
        showToast(`Mail envoyé à ${data.sent_to}`);
        await logAction(isResend ? 'Mail connexion renvoyé' : 'Mail connexion envoyé', data.sent_to);
        if (selected) loadClientDetail(selected);
      }
    } catch { showToast('Erreur envoi mail'); }
    setSendingInvite(false);
  };

  const proTypeBadges: Record<string, { label: string; color: string; bg: string }> = {
    agent: { label: '🏠 Agent solo', color: '#2a7d9c', bg: '#f0f7fb' },
    agence: { label: '🏛 Agence', color: '#b45309', bg: '#fef3c7' },
    investisseur: { label: '📈 Investisseur', color: '#7c3aed', bg: '#f5f3ff' },
    marchand: { label: '🔑 Marchand', color: '#d97706', bg: '#fffbeb' },
    notaire: { label: '⚖️ Notaire', color: '#0f2d3d', bg: '#f4f7f9' },
    autre: { label: '💼 Autre', color: '#64748b', bg: '#f8fafc' },
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, background: '#f8fafc', fontFamily: 'inherit' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Clients Pro</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{clients.length} client{clients.length > 1 ? 's' : ''} pro</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
          <button onClick={() => {
            setDemoForm({ full_name: '', email: '', telephone: '', pro_profile_type: 'agent', pro_company_name: '', pro_network: '', pro_siret: '', pro_company_address: '', pro_postal_code: '', pro_ville: '', pro_notes_admin: '', custom_message: '' });
            setDemoFile(null);
            setDemoError('');
            setShowDemoInvite(true);
          }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
            🎁 Inviter en démo
          </button>
          <button onClick={() => { setForm({ full_name: '', email: '', telephone: '', pro_profile_type: 'agent', pro_company_name: '', pro_company_address: '', pro_postal_code: '', pro_siret: '', pro_ville: '', pro_network: '', pro_notes_admin: '', pro_recommended_plan: '', credits_document: '0', credits_complete: '0', contact_pro_id: '' }); setCreateError(''); setShowCreate(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <UserPlus size={14} /> Créer un client pro
          </button>
        </div>
      </div>

      {/* Liste des clients */}
      {selected ? (
        /* ── Fiche client détaillée ── */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
          <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 16, padding: 0 }}>
            <ChevronLeft size={14} /> Retour à la liste
          </button>

          {/* Header fiche */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  {/* 🆕 Badge type cliquable avec dropdown pour modifier */}
                  {(() => {
                    const currentType = selected.pro_profile_type || 'autre';
                    const b = proTypeBadges[currentType] || proTypeBadges.autre;
                    return (
                      <div style={{ position: 'relative' as const }}>
                        <button
                          onClick={() => setTypeDropdownOpen(v => !v)}
                          disabled={updatingType}
                          style={{
                            fontSize: 12, fontWeight: 700, color: b.color, background: b.bg,
                            padding: '4px 12px 4px 10px', borderRadius: 8, border: 'none',
                            cursor: updatingType ? 'wait' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            transition: 'all 0.15s',
                          }}
                          title="Cliquez pour modifier le type de profil"
                          onMouseEnter={e => { if (!updatingType) e.currentTarget.style.filter = 'brightness(0.95)'; }}
                          onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                        >
                          {b.label}
                          <ChevronDown size={11} style={{ opacity: 0.6 }} />
                        </button>
                        <AnimatePresence>
                          {typeDropdownOpen && (
                            <>
                              {/* Overlay pour fermer en cliquant ailleurs */}
                              <div onClick={() => setTypeDropdownOpen(false)} style={{ position: 'fixed' as const, inset: 0, zIndex: 998 }} />
                              <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                style={{ position: 'absolute' as const, top: 'calc(100% + 6px)', left: 0, zIndex: 999, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', padding: 4, minWidth: 180 }}
                              >
                                {(['agent', 'agence', 'investisseur', 'notaire', 'autre'] as const).map(t => {
                                  const opt = proTypeBadges[t];
                                  const isCurrent = currentType === t;
                                  return (
                                    <button
                                      key={t}
                                      onClick={() => updateProfileType(t)}
                                      disabled={updatingType || isCurrent}
                                      style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                                        padding: '8px 12px', borderRadius: 7, border: 'none',
                                        background: isCurrent ? opt.bg : 'transparent',
                                        color: opt.color, fontSize: 12.5, fontWeight: isCurrent ? 700 : 600,
                                        cursor: isCurrent ? 'default' : 'pointer', textAlign: 'left' as const, transition: 'background 0.12s',
                                      }}
                                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = opt.bg; }}
                                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      <span>{opt.label}</span>
                                      {isCurrent && <CheckCircle size={12} style={{ color: opt.color }} />}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()}
                  {selected.suspended && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 6 }}>Suspendu</span>}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{selected.full_name}</h2>
                <p style={{ fontSize: 13, color: '#2a7d9c', margin: 0 }}>{selected.email}</p>
                {selected.telephone && <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{selected.telephone}</p>}
                {selected.pro_company_name && <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '6px 0 0' }}>{selected.pro_company_name}{selected.pro_network ? ` · ${selected.pro_network}` : ''}</p>}
                {selected.pro_ville && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{selected.pro_ville}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                {invitations.some(inv => inv.accepted_at) ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 12, fontWeight: 700 }}>
                    <CheckCircle size={12} /> Compte activé
                  </span>
                ) : (
                  <button onClick={() => sendInvitation(selected.id, invitations.some(inv => inv.sent_at))} disabled={sendingInvite}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: sendingInvite ? 0.7 : 1 }}>
                    <Send size={12} /> {sendingInvite ? 'Envoi...' : invitations.some(inv => inv.sent_at) ? 'Renvoyer le mail' : 'Envoyer mail de connexion'}
                  </button>
                )}
                {/* 🆕 Bouton Activer le compte (visible uniquement pour les comptes démo) */}
                {selected.pro_status === 'demo' && (
                  <button onClick={() => { setActivateForm({ credits_simple: '0', credits_complete: '0' }); setShowActivateModal(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <CheckCircle size={12} /> Activer le compte
                  </button>
                )}
                <button onClick={() => setShowDeleteConfirm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Trash2 size={12} /> Supprimer
                </button>
                <button onClick={() => { setShowResetPwd(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  🔑 Reset MDP
                </button>
                <button onClick={() => { setNewEmail(selected.email || ''); setShowUpdateEmail(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#f0f7fb', border: '1px solid #c7dde8', color: '#2a7d9c', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  ✉️ Modifier email
                </button>
              </div>
            </div>

            {/* 🏛 BLOC AGENCE — visible uniquement pour les comptes pro_profile_type === 'agence' */}
            {selected.pro_profile_type === 'agence' && !clientSubscription && (
              <div style={{
                marginTop: 14,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid #fcd34d',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4 }}>
                      🏛 Compte Agence
                    </div>
                    {!selected.pro_agence_subscription_unlocked ? (
                      <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
                        Cliquez sur "Envoyer la proposition agence" pour débloquer la souscription Stripe et envoyer le mail de proposition tarifaire (149,90 € HT/mois).
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
                        ✅ Proposition envoyée{selected.pro_agence_proposition_sent_at ? ` le ${new Date(selected.pro_agence_proposition_sent_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}.
                        En attente de souscription par l'agence.
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                    {!selected.pro_agence_subscription_unlocked ? (
                      <button
                        onClick={() => setShowConfirmUnlockAgence(true)}
                        disabled={agenceActionLoading}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '10px 18px', borderRadius: 10,
                          background: 'linear-gradient(135deg, #0e3a4a, #2a7d9c)',
                          border: 'none', color: '#fff',
                          fontSize: 12.5, fontWeight: 800,
                          cursor: agenceActionLoading ? 'wait' : 'pointer',
                          opacity: agenceActionLoading ? 0.6 : 1,
                          boxShadow: '0 4px 12px rgba(14,58,74,0.2)',
                          transition: 'all 0.2s',
                        }}
                      >
                        🏛 Envoyer la proposition agence
                      </button>
                    ) : (
                      <>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '10px 16px', borderRadius: 10,
                          background: '#d1fae5', border: '1px solid #86efac',
                          color: '#166534', fontSize: 12, fontWeight: 700,
                        }}>
                          ✅ Proposition envoyée
                        </div>
                        <button
                          onClick={() => handleUnlockAgenceProposal(true)}
                          disabled={agenceActionLoading}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '8px 12px', borderRadius: 8,
                            background: '#fff', border: '1px solid #cbd5e1',
                            color: '#475569', fontSize: 11.5, fontWeight: 600,
                            cursor: agenceActionLoading ? 'wait' : 'pointer',
                            opacity: agenceActionLoading ? 0.6 : 1,
                          }}
                          title="Renvoyer le mail de proposition"
                        >
                          🔄 Renvoyer
                        </button>
                        <button
                          onClick={() => setShowConfirmCancelAgence(true)}
                          disabled={agenceActionLoading}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '8px 12px', borderRadius: 8,
                            background: '#fff', border: '1px solid #fecaca',
                            color: '#dc2626', fontSize: 11.5, fontWeight: 600,
                            cursor: agenceActionLoading ? 'wait' : 'pointer',
                            opacity: agenceActionLoading ? 0.6 : 1,
                          }}
                          title="Retirer la proposition (suppression silencieuse, pas de mail)"
                        >
                          🚫 Annuler
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stats rapides */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', textAlign: 'center' as const }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{proClientCredits?.total_complete ?? (selected.credits_complete || 0)}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Complètes restants</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', textAlign: 'center' as const }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{proClientCredits?.total_document ?? (selected.credits_document || 0)}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Simples restants</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', textAlign: 'center' as const }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{clientAnalyses.length}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Analyses effectuées</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', textAlign: 'center' as const }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{clientShares.length}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Rapports envoyés</div>
              </div>
            </div>

            {/* Abonnement */}
            <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: clientSubscription ? '#f0f7fb' : '#f8fafc', border: `1px solid ${clientSubscription ? '#d0e8f0' : '#edf2f7'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Abonnement</div>
              {clientSubscription ? (
                <div>
                  {(() => {
                    const PLAN_LABEL: Record<string, string> = { decouverte: 'Découverte', starter: 'Starter', power: 'Power' };
                    const scheduledPlan = clientSubscription.scheduled_plan_change;
                    const scheduledDate = clientSubscription.scheduled_change_date;
                    const hasSchedule = !!scheduledPlan && clientSubscription.status !== 'canceled' && !clientSubscription.cancel_at_period_end;
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2d3d' }}>Plan {PLAN_LABEL[clientSubscription.plan] || clientSubscription.plan}</span>
                          {clientSubscription.status === 'canceled' ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 100, border: '1px solid #fecaca' }}>Résilié</span>
                          ) : clientSubscription.cancel_at_period_end ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#ea580c', background: '#fff7ed', padding: '2px 8px', borderRadius: 100, border: '1px solid #fed7aa' }}>Résiliation en cours</span>
                          ) : hasSchedule ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: 100, border: '1px solid #ddd6fe' }}>
                              Bascule programmée vers {PLAN_LABEL[scheduledPlan!] || scheduledPlan}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 100, border: '1px solid #bbf7d0' }}>Actif</span>
                          )}
                        </div>
                        {clientSubscription.status !== 'canceled' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                            <div style={{ color: '#64748b' }}>Complètes : <strong style={{ color: '#0f172a' }}>{clientSubscription.credits_complete_used}/{clientSubscription.credits_complete_total}</strong> utilisées</div>
                            <div style={{ color: '#64748b' }}>Simples : <strong style={{ color: '#0f172a' }}>{clientSubscription.credits_simple_used}/{clientSubscription.credits_simple_total}</strong> utilisées</div>
                          </div>
                        )}
                        {clientSubscription.cancel_at_period_end && clientSubscription.current_period_end && (
                          <div style={{ fontSize: 11, color: '#ea580c', marginTop: 6, fontWeight: 600 }}>⚠️ Actif jusqu'au {fmtDate(clientSubscription.current_period_end)}</div>
                        )}
                        {clientSubscription.status === 'canceled' && clientSubscription.canceled_at && (
                          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6, fontWeight: 600 }}>Résilié le {fmtDate(clientSubscription.canceled_at)}</div>
                        )}
                        {hasSchedule && scheduledDate && (
                          <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 6, fontWeight: 600 }}>
                            🔄 Bascule effective le {fmtDate(scheduledDate)}
                          </div>
                        )}
                        {!hasSchedule && !clientSubscription.cancel_at_period_end && clientSubscription.status !== 'canceled' && clientSubscription.current_period_end && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Renouvellement le {fmtDate(clientSubscription.current_period_end)}</div>
                        )}
                        {clientSubscription.cancellation_reason && (
                          <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#991b1b' }}>
                            <span style={{ fontWeight: 700 }}>Raison :</span> {clientSubscription.cancellation_reason}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Aucun abonnement actif</div>
              )}

              {/* Notes admin — intégrées au bloc abonnement */}
              <div style={{ marginTop: 10, borderTop: `1px solid ${clientSubscription ? '#d0e8f0' : '#edf2f7'}`, paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>Note interne</div>
                <textarea value={selected.pro_notes_admin || ''} onChange={async (e) => {
                  const val = e.target.value;
                  setSelected(prev => prev ? { ...prev, pro_notes_admin: val } : null);
                  await supabase.from('profiles').update({ pro_notes_admin: val }).eq('id', selected.id);
                }} rows={2} placeholder="Notes internes sur ce client..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d0e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
            </div>

            {/* Invitations */}
            {invitations.length > 0 && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: invitations[0].accepted_at ? '#f0fdf4' : '#fffbeb', border: `1px solid ${invitations[0].accepted_at ? '#bbf7d0' : '#fde68a'}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: invitations[0].accepted_at ? '#16a34a' : '#d97706' }}>
                  {invitations[0].accepted_at
                    ? `✅ Compte activé le ${fmtDateTime(invitations[0].accepted_at)}`
                    : invitations[0].sent_at
                      ? `📧 Mail envoyé le ${fmtDateTime(invitations[0].sent_at)} — en attente d'activation`
                      : '⏳ Invitation créée, mail non encore envoyé'}
                </div>
              </div>
            )}
          </div>

          {/* 🆕 Bloc Demandes de rappel */}
          {clientCallbacks.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={15} style={{ color: '#2a7d9c' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>Demandes de rappel ({clientCallbacks.length})</h3>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>
                    {clientCallbacks.filter(c => c.status === 'pending').length} en attente
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {clientCallbacks.map((cb) => {
                  const status = { pending: { label: 'En attente', color: '#854F0B', bg: '#fef3c7' }, called: { label: 'Rappelé', color: '#1e40af', bg: '#dbeafe' }, converted: { label: 'Converti ✓', color: '#166534', bg: '#dcfce7' }, declined: { label: 'Pas intéressé', color: '#64748b', bg: '#f1f5f9' } }[cb.status];
                  const slotsTxt = (cb.preferred_slots || []).map(s => ({ matinee: 'Matinée', dejeuner: 'Déjeuner', apres_midi: 'Après-midi', soiree: 'Soirée' } as Record<string, string>)[s] || s).join(', ');
                  const ctxTxt = ({ demo_expired: 'Démo épuisée', abonnement_agence: 'Forfait agence', other: 'Autre' } as Record<string, string>)[cb.context] || cb.context;
                  return (
                    <div key={cb.id} style={{ padding: 12, borderRadius: 10, border: '1px solid #f1f5f9', background: '#fafbfc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' as const }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <a href={`tel:${cb.phone}`} style={{ fontSize: 14, fontWeight: 700, color: '#2a7d9c', textDecoration: 'none' }}>📞 {cb.phone}</a>
                          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: status.color, background: status.bg, letterSpacing: '0.04em' }}>{status.label}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(cb.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: cb.message ? 6 : 0 }}>
                        Contexte : <strong style={{ color: '#374151' }}>{ctxTxt}</strong>{slotsTxt && <> · Créneaux : <strong style={{ color: '#374151' }}>{slotsTxt}</strong></>}
                      </div>
                      {cb.message && (
                        <div style={{ marginTop: 6, padding: '8px 10px', background: '#fff', borderRadius: 7, fontSize: 12, color: '#0f172a', lineHeight: 1.5, borderLeft: '2px solid #2a7d9c' }}>
                          {cb.message}
                        </div>
                      )}
                      {cb.admin_notes && (
                        <div style={{ marginTop: 6, padding: '6px 10px', background: '#f5f3ff', borderRadius: 7, fontSize: 11.5, color: '#5b21b6', lineHeight: 1.5 }}>
                          <strong>Note interne :</strong> {cb.admin_notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CGV Pro — Trace du consentement */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            border: '1.5px solid #edf2f7',
            padding: '14px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap' as const,
          }}>
            {selected.cgv_pro_accepted_at ? (
              <>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CheckCircle size={18} color="#16a34a" />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>
                    CGV Pro acceptées
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    Version <span style={{ color: '#16a34a' }}>{selected.cgv_pro_version || '—'}</span>
                    {' · '}
                    <span style={{ color: '#475569', fontWeight: 500 }}>{fmtDateTime(selected.cgv_pro_accepted_at)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#fffbeb', border: '1px solid #fde68a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AlertTriangle size={18} color="#d97706" />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>
                    CGV Pro non acceptées
                  </div>
                  <div style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                    Le client devra accepter les CGV avant son prochain paiement.
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tickets support — composant interactif */}
          <div style={{ marginBottom: 16 }}>
            <ClientSupportSection userId={selected.id} isPro={true} showToast={showToast} />
          </div>

          {/* Informations personnelles */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={15} style={{ color: '#2a7d9c' }} /> Informations personnelles
              </h3>
              {!editingPersonal ? (
                <button onClick={() => { setEditFullName(selected.full_name || ''); setEditTelephone(selected.telephone || ''); setEditingPersonal(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, background: '#f0f7fb', border: '1px solid #c7dde8', color: '#2a7d9c', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  ✏️ Modifier
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditingPersonal(false)}
                    style={{ padding: '6px 14px', borderRadius: 8, background: '#fff', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    Annuler
                  </button>
                  <button onClick={async () => {
                    const updates: Record<string, string | null> = {
                      full_name: editFullName.trim() || null,
                      telephone: editTelephone.trim() || null,
                    };
                    const { error } = await supabase.from('profiles').update(updates).eq('id', selected.id);
                    if (error) { showToast('Erreur: ' + error.message); return; }
                    const changes: string[] = [];
                    if (editFullName !== (selected.full_name || '')) changes.push(`Nom: "${selected.full_name || '—'}" → "${editFullName || '—'}"`);
                    if (editTelephone !== (selected.telephone || '')) changes.push(`Téléphone: "${selected.telephone || '—'}" → "${editTelephone || '—'}"`);
                    if (changes.length > 0) logAction(`Infos personnelles modifiées pour ${selected.full_name}: ${changes.join(', ')}`);
                    setSelected({ ...selected, ...updates });
                    setEditingPersonal(false);
                    showToast('Informations personnelles mises à jour');
                  }}
                    style={{ padding: '6px 14px', borderRadius: 8, background: '#2a7d9c', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    ✅ Enregistrer
                  </button>
                </div>
              )}
            </div>
            {editingPersonal ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>Nom complet</label>
                  <input value={editFullName} onChange={e => setEditFullName(e.target.value)} placeholder="Prénom Nom"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>Téléphone mobile</label>
                  <input value={editTelephone} onChange={e => setEditTelephone(e.target.value)} placeholder="06 12 34 56 78"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>Email</label>
                  <input value={selected.email || ''} disabled
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8fafc', color: '#94a3b8' }} />
                  <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, display: 'block' }}>Utilisez le bouton "Modifier email" pour changer l&apos;adresse</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Nom complet', value: selected.full_name },
                  { label: 'Téléphone mobile', value: selected.telephone },
                  { label: 'Email', value: selected.email },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: f.value ? '#0f172a' : '#cbd5e1' }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Identité professionnelle */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={15} style={{ color: '#2a7d9c' }} /> Identité professionnelle
              </h3>
              {!editingIdentity ? (
                <button onClick={() => setEditingIdentity(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, background: '#f0f7fb', border: '1px solid #c7dde8', color: '#2a7d9c', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  ✏️ Modifier
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditingIdentity(false)}
                    style={{ padding: '6px 14px', borderRadius: 8, background: '#fff', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    Annuler
                  </button>
                  <button onClick={async () => {
                    const updates: Record<string, string | null> = {
                      pro_company_name: editCompanyName.trim() || null,
                      pro_network: editNetwork.trim() || null,
                      pro_siret: editSiret.trim() || null,
                      pro_ville: editVille.trim() || null,
                      pro_postal_code: editPostalCode.trim() || null,
                      pro_company_address: editCompanyAddress.trim() || null,
                    };
                    const { error } = await supabase.from('profiles').update(updates).eq('id', selected.id);
                    if (error) { showToast('Erreur: ' + error.message); return; }
                    // Log changes
                    const changes: string[] = [];
                    if (editCompanyName !== (selected.pro_company_name || '')) changes.push(`Raison sociale: "${selected.pro_company_name || '—'}" → "${editCompanyName || '—'}"`);
                    if (editNetwork !== (selected.pro_network || '')) changes.push(`Réseau: "${selected.pro_network || '—'}" → "${editNetwork || '—'}"`);
                    if (editSiret !== (selected.pro_siret || '')) changes.push(`SIRET: "${selected.pro_siret || '—'}" → "${editSiret || '—'}"`);
                    if (editVille !== (selected.pro_ville || '')) changes.push(`Ville: "${selected.pro_ville || '—'}" → "${editVille || '—'}"`);
                    if (editPostalCode !== ((selected as any).pro_postal_code || '')) changes.push(`Code postal: "${(selected as any).pro_postal_code || '—'}" → "${editPostalCode || '—'}"`);
                    if (editCompanyAddress !== (selected.pro_company_address || '')) changes.push(`Adresse: "${selected.pro_company_address || '—'}" → "${editCompanyAddress || '—'}"`);
                    if (changes.length > 0) logAction(`Identité pro modifiée pour ${selected.full_name}: ${changes.join(', ')}`);
                    // Notifier le pro si demandé
                    if (notifyProOnSave) {
                      await supabase.from('user_notifications').insert({
                        user_id: selected.id,
                        title: 'Informations professionnelles mises à jour',
                        message: 'Suite à votre demande et après vérifications, vos informations professionnelles ont été mises à jour ✓',
                      });
                      showToast('Identité mise à jour — notification envoyée');
                    } else {
                      showToast('Identité mise à jour');
                    }
                    setSelected({ ...selected, ...updates });
                    setEditingIdentity(false);
                    setNotifyProOnSave(false);
                  }}
                    style={{ padding: '6px 14px', borderRadius: 8, background: '#2a7d9c', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    ✅ Enregistrer
                  </button>
                </div>
              )}
            </div>
            {editingIdentity ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>Raison sociale</label>
                  <input value={editCompanyName} onChange={e => setEditCompanyName(e.target.value)} placeholder="Agence Dupont SARL"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>Réseau</label>
                  <input value={editNetwork} onChange={e => setEditNetwork(e.target.value)} placeholder="IAD, Safti, Indépendant..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>SIRET</label>
                  <input value={editSiret} onChange={e => setEditSiret(e.target.value)} placeholder="123 456 789 00012"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>Adresse postale</label>
                  <input value={editCompanyAddress} onChange={e => setEditCompanyAddress(e.target.value)} placeholder="12 rue de la République"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>Code postal</label>
                  <input value={editPostalCode} onChange={e => setEditPostalCode(e.target.value)} placeholder="75001"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>Ville</label>
                  <input value={editVille} onChange={e => setEditVille(e.target.value)} placeholder="Paris"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <label style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', marginTop: 4 }}>
                  <input type="checkbox" checked={notifyProOnSave} onChange={e => setNotifyProOnSave(e.target.checked)}
                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#2a7d9c' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                    🔔 Notifier le pro de la mise à jour
                  </span>
                </label>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Raison sociale', value: selected.pro_company_name },
                  { label: 'Réseau', value: selected.pro_network },
                  { label: 'SIRET', value: selected.pro_siret, span: true },
                  { label: 'Adresse postale', value: selected.pro_company_address, span: true },
                  { label: 'Code postal', value: (selected as any).pro_postal_code },
                  { label: 'Ville', value: selected.pro_ville },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', ...(f.span ? { gridColumn: 'span 2' } : {}) }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: f.value ? '#0f172a' : '#cbd5e1' }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analyses du client */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', marginBottom: 16 }}>
            <button onClick={() => setAnalysesExpanded(!analysesExpanded)}
              style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, flex: 1 }}>Historique des analyses</h3>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 100 }}>{clientAnalyses.length}</span>
              <ChevronDown size={14} style={{ color: '#94a3b8', transform: analysesExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {analysesExpanded && (
              <div style={{ padding: '0 20px 20px' }}>
                {clientAnalyses.length === 0 ? <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' as const, padding: 16 }}>Aucune analyse.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {clientAnalyses.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#f8fafc' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.address || a.title}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(a.created_at)} · {a.status}</div>
                        </div>
                        {a.score != null && <span style={{ fontSize: 14, fontWeight: 800, color: a.score >= 14 ? '#16a34a' : a.score >= 10 ? '#d97706' : '#dc2626' }}>{a.score}/20</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Envois clients */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', marginBottom: 16 }}>
            <button onClick={() => setEnvoisExpanded(!envoisExpanded)}
              style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, flex: 1 }}>Envois aux clients</h3>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 100 }}>{clientShares.length}</span>
              <ChevronDown size={14} style={{ color: '#94a3b8', transform: envoisExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {envoisExpanded && (
              <div style={{ padding: '0 20px 20px' }}>
                {clientShares.length === 0 ? <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' as const, padding: 16 }}>Aucun envoi.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {clientShares.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#f8fafc' }}>
                        <Send size={13} style={{ color: '#2a7d9c', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.recipient_name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.recipient_email}</div>
                        </div>
                        <div style={{ textAlign: 'right' as const }}>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(s.sent_at)}</div>
                          {s.opened_at ? <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Ouvert</span> : <span style={{ fontSize: 10, color: '#94a3b8' }}>En attente</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Historique financier du client */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Euro size={15} style={{ color: '#16a34a' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Historique financier</h3>
              {clientInvoices.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 6px', borderRadius: 100 }}>{clientInvoices.length}</span>}
            </div>

            {/* CA total + compteurs (ne compte que les paiements réussis) */}
            {!clientInvoicesLoading && clientInvoices.length > 0 && (() => {
              // Le CA total ne compte QUE les paiements réussis (status === 'paid' ou pas de status = grants/legacy considéré OK)
              // Les remboursés (status_variant === 'refunded') sont exclus
              const successfulInvoices = clientInvoices.filter(inv => (!inv.status || inv.status === 'paid') && inv.status_variant !== 'refunded');
              const failedInvoices = clientInvoices.filter(inv => inv.status_variant === 'failed');
              const totalCA = successfulInvoices.reduce((sum, inv) => {
                const amount = parseFloat(inv.amount.replace(/[^0-9.,]/g, '').replace(',', '.'));
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0);
              const totalCAHt = totalCA / 1.20;
              const aboCount = successfulInvoices.filter(inv => inv.type === 'subscription').length;
              const unitCount = successfulInvoices.filter(inv => inv.type === 'unit').length;
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                    <div style={{ padding: '16px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #bbf7d0', textAlign: 'center' as const }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>{totalCAHt.toFixed(2).replace('.', ',')}€</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>HT</div>
                      </div>
                      {totalCA > 0 && (
                        <div style={{ fontSize: 13, color: '#15803d', fontWeight: 600, marginTop: 4 }}>({totalCA.toFixed(2).replace('.', ',')}€ TTC)</div>
                      )}
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 6 }}>CA total encaissé</div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 12, background: '#f0f7fb', border: '1px solid #d0e8f0', textAlign: 'center' as const }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#2a7d9c' }}>{aboCount}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Paiements abo</div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', textAlign: 'center' as const }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{unitCount}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Paiements unitaires</div>
                    </div>
                  </div>
                  {/* Bandeau d'alerte si paiements échoués */}
                  {failedInvoices.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 14, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                        {failedInvoices.length} paiement{failedInvoices.length > 1 ? 's' : ''} en échec — voir détails ci-dessous
                      </span>
                    </div>
                  )}
                </>
              );
            })()}

            {clientInvoicesLoading ? (
              <div style={{ textAlign: 'center' as const, padding: 20, color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
            ) : clientInvoices.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' as const, padding: 16 }}>Aucun paiement enregistré.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {clientInvoices.map(inv => {
                  // Couleurs selon variant
                  const variantStyles: Record<string, { bg: string; border: string; amountColor: string; badgeBg: string; badgeColor: string }> = {
                    success: { bg: '#f8fafc', border: 'transparent', amountColor: '#16a34a', badgeBg: '#dcfce7', badgeColor: '#15803d' },
                    pending: { bg: '#fffbeb', border: '#fde68a', amountColor: '#ca8a04', badgeBg: '#fef3c7', badgeColor: '#92400e' },
                    failed: { bg: '#fef2f2', border: '#fecaca', amountColor: '#dc2626', badgeBg: '#fee2e2', badgeColor: '#991b1b' },
                    void: { bg: '#f8fafc', border: '#e2e8f0', amountColor: '#94a3b8', badgeBg: '#f1f5f9', badgeColor: '#64748b' },
                    refunded: { bg: '#fef2f2', border: '#fecaca', amountColor: '#94a3b8', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
                  };
                  const variant = inv.status_variant || 'success';
                  const styles = variantStyles[variant] || variantStyles.success;
                  const showBadge = (inv.status && inv.status !== 'paid') || variant === 'refunded';

                  return (
                    <div key={inv.id} style={{ padding: '10px 12px', borderRadius: 10, background: styles.bg, border: styles.border !== 'transparent' ? `1px solid ${styles.border}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{inv.description}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span>{inv.date}</span>
                            <span>·</span>
                            <span style={{ fontWeight: 700, color: inv.type === 'subscription' ? '#2a7d9c' : '#16a34a' }}>{inv.type === 'subscription' ? 'Abo' : 'Unitaire'}</span>
                            {showBadge && (
                              <>
                                <span>·</span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 100, background: styles.badgeBg, color: styles.badgeColor }}>
                                  {inv.status_label}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: styles.amountColor, flexShrink: 0, textDecoration: variant === 'void' ? 'line-through' : 'none' }}>{inv.amount}</span>
                        {inv.pdf_url && (
                          <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 7, background: '#f0f7fb', color: '#2a7d9c', textDecoration: 'none', fontSize: 11, fontWeight: 700, border: '1px solid #d0e8f0', flexShrink: 0 }}>
                            <Download size={11} /> PDF
                          </a>
                        )}
                      </div>
                      {/* Motif d'échec si applicable */}
                      {inv.failure_reason && (
                        <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #fecaca', fontSize: 11.5, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                          <span><strong>Motif :</strong> {inv.failure_reason}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* Modal de confirmation suppression */}
          {showDeleteConfirm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <AlertTriangle size={24} style={{ color: '#dc2626' }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Supprimer ce compte pro ?</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                    Cette action est <strong style={{ color: '#dc2626' }}>irréversible</strong>. Toutes les données seront supprimées :
                    analyses, dossiers, rapports envoyés, abonnement, factures, invitations.
                  </p>
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{selected.full_name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{selected.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowDeleteConfirm(false)}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 14, fontWeight: 700, color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Annuler
                  </button>
                  <button onClick={async () => {
                    setDeleting(true);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/admin-user-management`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
                        body: JSON.stringify({ action: 'delete', user_id: selected.id }),
                      });
                      const data = await res.json();
                      if (data.error) { showToast('Erreur: ' + data.error); setDeleting(false); return; }
                      await logAction(`Compte pro supprimé : ${selected.full_name} (${selected.email})`);
                      showToast('Compte supprimé');
                      setShowDeleteConfirm(false);
                      setSelected(null);
                      loadClients();
                    } catch (e: any) {
                      showToast('Erreur: ' + e.message);
                    }
                    setDeleting(false);
                  }} disabled={deleting}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#dc2626', fontSize: 14, fontWeight: 700, color: '#fff', cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
                    {deleting ? 'Suppression...' : '🗑️ Supprimer définitivement'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal reset mot de passe */}
          {showResetPwd && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>🔑 Réinitialiser le mot de passe</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>Un email de réinitialisation sera envoyé à <strong>{selected.email}</strong>. Le client pourra choisir son nouveau mot de passe.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowResetPwd(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 13, fontWeight: 700, color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>Annuler</button>
                  <button onClick={async () => {
                    const { error } = await supabase.auth.resetPasswordForEmail(selected.email!, { redirectTo: 'https://verimo.fr/auth/reset-password' });
                    if (error) { showToast('Erreur: ' + error.message); return; }
                    await logAction(`Email de reset mdp envoyé à ${selected.full_name} (${selected.email})`);
                    showToast('Email de réinitialisation envoyé');
                    setShowResetPwd(false);
                  }}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#2a7d9c', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>📧 Envoyer l'email</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal modifier email */}
          {showUpdateEmail && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>✉️ Modifier l'email</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>{selected.full_name} — email actuel : {selected.email}</p>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Nouvel email"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }} />
                <p style={{ fontSize: 11, color: '#d97706', margin: '0 0 16px' }}>⚠️ L'email sera modifié immédiatement dans le système. Le client devra utiliser ce nouvel email pour se connecter.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowUpdateEmail(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 13, fontWeight: 700, color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>Annuler</button>
                  <button onClick={async () => {
                    if (!newEmail.includes('@')) { showToast('Email invalide'); return; }
                    const { data: { session } } = await supabase.auth.getSession();
                    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/admin-user-management`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
                      body: JSON.stringify({ action: 'update_email', user_id: selected.id, new_email: newEmail }),
                    });
                    const data = await res.json();
                    if (data.error) { showToast('Erreur: ' + data.error); return; }
                    await logAction(`Email modifié pour ${selected.full_name}: ${selected.email} → ${newEmail}`);
                    setSelected({ ...selected, email: newEmail });
                    showToast('Email modifié');
                    setShowUpdateEmail(false);
                  }}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#2a7d9c', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>Modifier</button>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 Modal Activer le compte (sortie de démo) */}
          {showActivateModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={20} style={{ color: '#16a34a' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Activer le compte</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Sortie du mode démo</p>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Le compte de <strong style={{ color: '#0f172a' }}>{selected.full_name || selected.email}</strong> va passer de <strong>démo</strong> à <strong>actif</strong>. Les bandeaux démo disparaîtront côté client.
                </p>

                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, marginBottom: 16, border: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                    <strong style={{ color: '#0f172a' }}>Crédits à offrir (optionnel)</strong> — utile si le pro n'a pas d'abonnement Stripe et que vous voulez lui donner des crédits "geste commercial".
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, letterSpacing: '0.04em' }}>ANALYSE SIMPLE</label>
                      <input type="number" min={0} value={activateForm.credits_simple} onChange={e => setActivateForm(f => ({ ...f, credits_simple: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, letterSpacing: '0.04em' }}>ANALYSE COMPLÈTE</label>
                      <input type="number" min={0} value={activateForm.credits_complete} onChange={e => setActivateForm(f => ({ ...f, credits_complete: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowActivateModal(false)} disabled={activating}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 13, fontWeight: 700, color: '#64748b', cursor: activating ? 'wait' : 'pointer' }}>
                    Annuler
                  </button>
                  <button onClick={async () => {
                    setActivating(true);
                    const addDoc = parseInt(activateForm.credits_simple) || 0;
                    const addComp = parseInt(activateForm.credits_complete) || 0;
                    await handleActivateDemo(selected.id, addDoc, addComp);
                    setActivating(false);
                    setShowActivateModal(false);
                  }} disabled={activating}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: activating ? '#94a3b8' : '#16a34a', fontSize: 13, fontWeight: 700, color: '#fff', cursor: activating ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}>
                    {activating ? 'Activation...' : '✓ Activer le compte'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🏛 Modal Confirmation — Envoyer la proposition agence */}
          {showConfirmUnlockAgence && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    🏛
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Envoyer la proposition agence</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Verimo Pro · Agence — 149,90 € HT/mois</p>
                  </div>
                </div>

                <div style={{ padding: 14, background: '#fef9e7', borderRadius: 10, marginBottom: 16, border: '1px solid #fde68a' }}>
                  <p style={{ fontSize: 13, color: '#78350f', margin: '0 0 8px', lineHeight: 1.5, fontWeight: 600 }}>
                    Vous êtes sur le point de :
                  </p>
                  <ul style={{ fontSize: 12.5, color: '#78350f', margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                    <li>Débloquer la souscription Stripe agence pour ce compte</li>
                    <li>Envoyer un mail HTML à <strong>{selected.email}</strong></li>
                    <li>Permettre à l'agence de souscrire au plan 149,90 € HT/mois</li>
                  </ul>
                </div>

                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Le mail contient le récap des chiffres (15 complètes + 30 simples, 3 agents, sans engagement) et un bouton "Activer ma formule →" vers son dashboard.
                </p>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowConfirmUnlockAgence(false)}
                    disabled={agenceActionLoading}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: agenceActionLoading ? 'wait' : 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleUnlockAgenceProposal(false)}
                    disabled={agenceActionLoading}
                    style={{ flex: 1.5, padding: '11px', borderRadius: 10, border: 'none', background: agenceActionLoading ? '#94a3b8' : 'linear-gradient(135deg, #0e3a4a, #2a7d9c)', fontSize: 13, fontWeight: 800, color: '#fff', cursor: agenceActionLoading ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(14,58,74,0.25)' }}
                  >
                    {agenceActionLoading ? 'Envoi...' : '🏛 Envoyer la proposition'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🚫 Modal Confirmation — Annuler la proposition agence */}
          {showConfirmCancelAgence && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    🚫
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Annuler la proposition</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Suppression silencieuse — pas de mail envoyé</p>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.6 }}>
                  La souscription agence sera re-bloquée pour <strong style={{ color: '#0f172a' }}>{selected.full_name || selected.email}</strong>. L'agence ne pourra plus voir le bouton de souscription Stripe.
                </p>

                <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5, fontStyle: 'italic' as const }}>
                  Aucun mail d'annulation ne sera envoyé. Si vous souhaitez l'informer, contactez-la directement.
                </p>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowConfirmCancelAgence(false)}
                    disabled={agenceActionLoading}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: agenceActionLoading ? 'wait' : 'pointer' }}
                  >
                    Garder
                  </button>
                  <button
                    onClick={handleCancelAgenceProposal}
                    disabled={agenceActionLoading}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: agenceActionLoading ? '#94a3b8' : '#dc2626', fontSize: 13, fontWeight: 700, color: '#fff', cursor: agenceActionLoading ? 'wait' : 'pointer' }}
                  >
                    {agenceActionLoading ? 'Annulation...' : '🚫 Annuler la proposition'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        /* ── Liste ── */
        <div>
          {/* ─── Bloc filtres : Statut (ligne 1) + Type de profil (ligne 2) ─── */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '12px 14px', marginBottom: 14, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {/* Ligne 1 : Statut */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Statut</span>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {([
                  { id: 'all', label: 'Tous' },
                  { id: 'demo', label: '🎁 Compte démo' },
                  { id: 'active', label: '🟢 Abonnement en cours' },
                  { id: 'cancel_scheduled', label: '🟡 Résiliation programmée' },
                  { id: 'activated', label: '✓ Compte activé' },
                  { id: 'inactive', label: 'Inscrits non activés' },
                  { id: 'canceled', label: '🔴 Résilié' },
                ] as const).map(f => {
                  const count = f.id === 'active'
                    ? clients.filter(c => proSubscriptions.has(c.id)).length
                    : f.id === 'demo'
                    ? clients.filter(c => c.pro_status === 'demo').length
                    : f.id === 'cancel_scheduled'
                    ? clients.filter(c => proCancelScheduled.has(c.id)).length
                    : f.id === 'activated'
                    ? clients.filter(c => proActivated.has(c.id)).length
                    : f.id === 'inactive'
                    ? clients.filter(c => !proActivated.has(c.id)).length
                    : f.id === 'canceled'
                    ? clients.filter(c => proCanceled.has(c.id) && !proSubscriptions.has(c.id)).length
                    : clients.length;
                  const isActive = proFilter === f.id;
                  return (
                    <button key={f.id} onClick={() => setProFilter(f.id)}
                      style={{
                        padding: '7px 14px', borderRadius: 10,
                        border: `1.5px solid ${isActive ? '#0f2d3d' : '#edf2f7'}`,
                        background: isActive ? '#0f2d3d' : '#fff',
                        color: isActive ? '#fff' : '#64748b',
                        fontSize: 12, fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                        boxShadow: isActive ? '0 4px 12px rgba(15,45,61,0.15)' : 'none',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = '#edf2f7'; e.currentTarget.style.background = '#fff'; } }}
                    >
                      {f.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ligne 2 : Type de profil */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Type de profil</span>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                {filterByType !== 'all' && (
                  <button onClick={() => setFilterByType('all')} style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Réinitialiser
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {([
                  { id: 'all', label: 'Tous' },
                  { id: 'agent', label: '🏠 Agent solo' },
                  { id: 'agence', label: '🏛 Agence' },
                  { id: 'investisseur', label: '📈 Investisseur' },
                  { id: 'notaire', label: '⚖️ Notaire' },
                  { id: 'autre', label: '💼 Autre' },
                ] as const).map(t => {
                  const count = t.id === 'all'
                    ? clients.length
                    : clients.filter(c => (c.pro_profile_type || 'autre') === t.id).length;
                  const isActive = filterByType === t.id;
                  return (
                    <button key={t.id} onClick={() => setFilterByType(t.id)}
                      style={{
                        padding: '7px 14px', borderRadius: 10,
                        border: `1.5px solid ${isActive ? '#7c3aed' : '#edf2f7'}`,
                        background: isActive ? '#7c3aed' : '#fff',
                        color: isActive ? '#fff' : '#64748b',
                        fontSize: 12, fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                        boxShadow: isActive ? '0 4px 12px rgba(124,58,237,0.2)' : 'none',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = '#edf2f7'; e.currentTarget.style.background = '#fff'; } }}
                    >
                      {t.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
            {loading ? <div style={{ padding: 40, textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
              : clients.length === 0 ? (
                <div style={{ padding: '52px 32px', textAlign: 'center' as const }}>
                  <Building2 size={36} style={{ color: '#e2e8f0', margin: '0 auto 14px', display: 'block' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Aucun client pro</div>
                  <p style={{ fontSize: 13, color: '#cbd5e1', marginTop: 6 }}>Créez votre premier client pro avec le bouton ci-dessus.</p>
                </div>
              ) : (() => {
                const baseFiltered = proFilter === 'active' ? clients.filter(c => proSubscriptions.has(c.id))
                  : proFilter === 'demo' ? clients.filter(c => c.pro_status === 'demo')
                  : proFilter === 'cancel_scheduled' ? clients.filter(c => proCancelScheduled.has(c.id))
                  : proFilter === 'activated' ? clients.filter(c => proActivated.has(c.id))
                  : proFilter === 'inactive' ? clients.filter(c => !proActivated.has(c.id))
                  : proFilter === 'canceled' ? clients.filter(c => proCanceled.has(c.id) && !proSubscriptions.has(c.id))
                  : clients;
                // 🆕 Application cumulative du filtre par type de profil
                const filtered = filterByType === 'all'
                  ? baseFiltered
                  : baseFiltered.filter(c => (c.pro_profile_type || 'autre') === filterByType);
                return filtered.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucun client dans cette catégorie.</div>
                ) : filtered.map((c, i) => {
                  const b = proTypeBadges[c.pro_profile_type || 'autre'] || proTypeBadges.autre;
                  const isSubscribed = proSubscriptions.has(c.id);
                  const isActivated = proActivated.has(c.id);
                  const isCancelScheduled = proCancelScheduled.has(c.id);
                  const isCanceled = proCanceled.has(c.id) && !isSubscribed;
                  return (
                    <div key={c.id} onClick={() => loadClientDetail(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#fafcfd'}
                      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {(c.full_name?.charAt(0) || 'P').toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.full_name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.email}{c.pro_company_name ? ` · ${c.pro_company_name}` : ''}</div>
                      </div>
                      {/* Badges status */}
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 9px', borderRadius: 100, border: '1px solid #e2e8f0' }}>Inscrit</span>
                        {isActivated && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', padding: '3px 9px', borderRadius: 100, border: '1px solid #bfdbfe' }}>Compte activé</span>
                        )}
                        {isSubscribed && !isCancelScheduled && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '3px 9px', borderRadius: 100, border: '1px solid #bbf7d0' }}>Abonné</span>
                        )}
                        {isCancelScheduled && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#ca8a04', background: '#fef3c7', padding: '3px 9px', borderRadius: 100, border: '1px solid #fde68a' }}>Résiliation programmée</span>
                        )}
                        {isCanceled && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '3px 9px', borderRadius: 100, border: '1px solid #fecaca' }}>Résilié</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: b.color, background: b.bg, padding: '3px 10px', borderRadius: 8, flexShrink: 0 }}>{b.label}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{c.pro_created_at ? fmtDate(c.pro_created_at) : fmtDate(c.created_at)}</span>
                      <ChevronRight size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                    </div>
                  );
                });
              })()}
          </div>
        </div>
      )}

      {/* Modal création */}
      <AnimatePresence>
        {/* 🆕 MODAL INVITATION DÉMO */}
        {showDemoInvite && (
          <Modal title="🎁 Inviter en démo" onClose={() => !demoSending && setShowDemoInvite(false)} width={620}>
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#fef9e7,#fef3c7)', border: '1px solid #fde68a', marginBottom: 18, fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
              <strong>📣 Le prospect recevra :</strong> 1 analyse simple + 1 analyse complète offertes pour tester Verimo Pro.
              Il pourra créer son compte via le lien, puis convertir vers un plan payant plus tard.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Nom complet *</label>
                <input value={demoForm.full_name} onChange={e => setDemoForm(f => ({ ...f, full_name: e.target.value }))} style={inputStyle} placeholder="Jean Dupont" />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input value={demoForm.email} onChange={e => setDemoForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="jean@agence.fr" type="email" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input value={demoForm.telephone} onChange={e => setDemoForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} placeholder="06 12 34 56 78" type="tel" />
              </div>
              <div>
                <label style={labelStyle}>Type de profil</label>
                <select value={demoForm.pro_profile_type} onChange={e => setDemoForm(f => ({ ...f, pro_profile_type: e.target.value }))} style={inputStyle as React.CSSProperties}>
                  <option value="agent">🏠 Agent solo / Mandataire indépendant</option>
                  <option value="agence">🏛 Agence</option>
                  <option value="investisseur">📈 Investisseur</option>
                  <option value="notaire">⚖️ Notaire</option>
                  <option value="autre">💼 Autre</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Raison sociale</label>
                <input value={demoForm.pro_company_name} onChange={e => setDemoForm(f => ({ ...f, pro_company_name: e.target.value }))} style={inputStyle} placeholder="Agence Dupont SARL" />
              </div>
              <div>
                <label style={labelStyle}>Réseau</label>
                <input value={demoForm.pro_network} onChange={e => setDemoForm(f => ({ ...f, pro_network: e.target.value }))} style={inputStyle} placeholder="IAD, Safti, Indépendant..." />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>SIRET</label>
              <input value={demoForm.pro_siret} onChange={e => setDemoForm(f => ({ ...f, pro_siret: e.target.value }))} style={inputStyle} placeholder="123 456 789 00012" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Adresse</label>
              <input value={demoForm.pro_company_address} onChange={e => setDemoForm(f => ({ ...f, pro_company_address: e.target.value }))} style={inputStyle} placeholder="12 rue de la République" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Code postal</label>
                <input value={demoForm.pro_postal_code} onChange={e => setDemoForm(f => ({ ...f, pro_postal_code: e.target.value }))} style={inputStyle} placeholder="75001" />
              </div>
              <div>
                <label style={labelStyle}>Ville</label>
                <input value={demoForm.pro_ville} onChange={e => setDemoForm(f => ({ ...f, pro_ville: e.target.value }))} style={inputStyle} placeholder="Paris" />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Notes internes (visible uniquement par l'admin)</label>
              <textarea value={demoForm.pro_notes_admin} onChange={e => setDemoForm(f => ({ ...f, pro_notes_admin: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }} placeholder="Rencontré au RDV du 15/01, agence de 4 agents à Boulogne, intéressé par forfait agence..." />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                ✉️ Message du mail
                <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>— éditez ou utilisez un modèle rapide</span>
              </label>

              {/* Boutons de modèles rapides */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' as const }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!demoForm.full_name.trim()) {
                      setDemoError('Renseignez d\'abord le nom complet pour personnaliser le message.');
                      return;
                    }
                    const p = demoForm.full_name.split(' ')[0];
                    const tpl = `Bonjour ${p},\n\nSuite à notre rendez-vous de présentation de Verimo, nous sommes ravis de vous offrir un accès découverte à notre service.\n\nVous pourrez tester gratuitement avec 1 analyse simple et 1 analyse complète offertes — de quoi vous faire votre propre idée sur l'apport concret pour vos clients acheteurs.\n\nEn pièce jointe, notre plaquette qui récapitule l'offre et les cas d'usage qui pourront vous aider au quotidien.\n\nÀ très vite,\nL'équipe Verimo`;
                    setDemoForm(f => ({ ...f, custom_message: tpl }));
                    setDemoError('');
                  }}
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#f0f7fb', border: '1px solid #d0e8f0', color: '#2a7d9c', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  📅 Suite à un RDV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!demoForm.full_name.trim()) {
                      setDemoError('Renseignez d\'abord le nom complet pour personnaliser le message.');
                      return;
                    }
                    const p = demoForm.full_name.split(' ')[0];
                    const tpl = `Bonjour ${p},\n\nSuite à notre échange, nous vous proposons de tester Verimo Pro en conditions réelles.\n\nVous bénéficiez de 1 analyse simple et 1 analyse complète offertes — l'occasion idéale de constater concrètement ce que vos clients vont voir et comment notre rapport peut accélérer vos signatures.\n\nLa plaquette en pièce jointe résume notre offre et vous donne des idées d'utilisation au quotidien.\n\nN'hésitez pas si vous avez la moindre question.\n\nL'équipe Verimo`;
                    setDemoForm(f => ({ ...f, custom_message: tpl }));
                    setDemoError('');
                  }}
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#f0f7fb', border: '1px solid #d0e8f0', color: '#2a7d9c', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  💬 Suite à un échange
                </button>
                <button
                  type="button"
                  onClick={() => setDemoForm(f => ({ ...f, custom_message: '' }))}
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  🔄 Texte par défaut
                </button>
              </div>

              <textarea
                value={demoForm.custom_message}
                onChange={e => setDemoForm(f => ({ ...f, custom_message: e.target.value }))}
                style={{ ...inputStyle, minHeight: 170, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.6 }}
                placeholder={demoForm.full_name.trim()
                  ? `Bonjour ${demoForm.full_name.split(' ')[0]},\n\nLaissez vide pour utiliser le message par défaut, ou cliquez sur un modèle rapide ci-dessus pour pré-remplir.`
                  : `Renseignez d'abord le nom complet en haut, puis cliquez sur un modèle rapide.\n\nVous pouvez aussi rédiger votre propre message ici (le prénom sera ajouté automatiquement en début).`
                }
              />

              {/* Aperçu visuel du contenu du mail (structure) */}
              <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px dashed #cbd5e1', fontSize: 11.5, color: '#64748b', lineHeight: 1.6 }}>
                <strong style={{ color: '#475569' }}>📧 Le mail contiendra automatiquement :</strong> logo Verimo · titre "Bienvenue sur Verimo Pro" · {demoFile ? <strong style={{ color: '#16a34a' }}>encart pièce jointe</strong> : 'votre message'} · récapitulatif des 2 crédits offerts · bouton "Activer mon compte" · footer Verimo.
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                📎 Pièce jointe (PDF — plaquette de présentation)
                <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>— optionnel, max 12 Mo</span>
              </label>
              {!demoFile ? (
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '20px 16px', borderRadius: 10, border: '2px dashed #cbd5e1', background: '#f8fafc',
                  cursor: 'pointer', fontSize: 13, color: '#64748b', fontWeight: 600, transition: 'all 0.15s',
                }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; (e.currentTarget as HTMLElement).style.background = '#f0f7fb'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'; (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                >
                  📎 Cliquez pour ajouter un PDF
                  <input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 12 * 1024 * 1024) { setDemoError('Le fichier dépasse 12 Mo.'); return; }
                      setDemoFile(f);
                      setDemoError('');
                    }
                  }} />
                </label>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#14532d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>📎 {demoFile.name}</div>
                    <div style={{ fontSize: 11.5, color: '#166534' }}>{(demoFile.size / 1024).toFixed(0)} Ko</div>
                  </div>
                  <button onClick={() => setDemoFile(null)} style={{ padding: '4px 10px', borderRadius: 6, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Retirer</button>
                </div>
              )}
            </div>

            {demoError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, marginBottom: 14 }}>
                {demoError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => !demoSending && setShowDemoInvite(false)} disabled={demoSending}
                style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: demoSending ? 'not-allowed' : 'pointer', opacity: demoSending ? 0.5 : 1 }}>
                Annuler
              </button>
              <button onClick={handleDemoInvite} disabled={demoSending || !demoForm.full_name || !demoForm.email}
                style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: (demoSending || !demoForm.full_name || !demoForm.email) ? 'not-allowed' : 'pointer', opacity: (demoSending || !demoForm.full_name || !demoForm.email) ? 0.5 : 1, boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                {demoSending ? 'Envoi en cours…' : '🎁 Envoyer l\'invitation'}
              </button>
            </div>
          </Modal>
        )}

        {showCreate && (
          <Modal title="Créer un client pro" onClose={() => setShowCreate(false)} width={640}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Nom complet *</label><input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inputStyle} placeholder="Jean Dupont" /></div>
              <div><label style={labelStyle}>Email *</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="jean@agence.fr" type="email" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Téléphone</label><input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} placeholder="06 12 34 56 78" /></div>
              <div>
                <label style={labelStyle}>Profil métier</label>
                <select value={form.pro_profile_type} onChange={e => setForm(f => ({ ...f, pro_profile_type: e.target.value }))} style={inputStyle}>
                  <option value="agent">Agent solo / Mandataire indépendant</option>
                  <option value="agence">Agence</option>
                  <option value="investisseur">Investisseur</option>
                  <option value="marchand">Marchand de bien</option>
                  <option value="notaire">Notaire</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Raison sociale</label><input value={form.pro_company_name} onChange={e => setForm(f => ({ ...f, pro_company_name: e.target.value }))} style={inputStyle} placeholder="Agence Dupont SARL" /></div>
              <div><label style={labelStyle}>Réseau</label><input value={form.pro_network} onChange={e => setForm(f => ({ ...f, pro_network: e.target.value }))} style={inputStyle} placeholder="IAD, Safti, Indépendant..." /></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>SIRET</label>
              <input value={form.pro_siret} onChange={e => setForm(f => ({ ...f, pro_siret: e.target.value }))} style={inputStyle} placeholder="123 456 789 00012" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Adresse postale</label>
              <input value={form.pro_company_address} onChange={e => setForm(f => ({ ...f, pro_company_address: e.target.value }))} style={inputStyle} placeholder="12 rue de la République" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Code postal</label><input value={form.pro_postal_code} onChange={e => setForm(f => ({ ...f, pro_postal_code: e.target.value }))} style={inputStyle} placeholder="75001" /></div>
              <div><label style={labelStyle}>Ville</label><input value={form.pro_ville} onChange={e => setForm(f => ({ ...f, pro_ville: e.target.value }))} style={inputStyle} placeholder="Paris" /></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Plan recommandé</label>
              {form.pro_profile_type === 'agence' ? (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  border: '1px solid #fcd34d',
                  color: '#78350f',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  🏛 Agence — 149,90 € HT/mois
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#92400e', marginLeft: 'auto' }}>
                    (auto-sélectionné pour profil Agence)
                  </span>
                </div>
              ) : (
                <select value={form.pro_recommended_plan} onChange={e => setForm(f => ({ ...f, pro_recommended_plan: e.target.value }))} style={inputStyle}>
                  <option value="">Aucun (le pro choisira)</option>
                  <option value="decouverte">Découverte — 19,90€ HT/mois</option>
                  <option value="starter">Starter — 49,90€ HT/mois</option>
                  <option value="power">Power — 89,90€ HT/mois</option>
                </select>
              )}
            </div>
            {/* Crédits offerts : masqués pour le profil Agence (pas de geste commercial sur ce plan, la souscription gère les crédits) */}
            {form.pro_profile_type !== 'agence' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={labelStyle}>Crédits simples offerts</label><input type="number" value={form.credits_document} onChange={e => setForm(f => ({ ...f, credits_document: e.target.value }))} style={inputStyle} min="0" /></div>
                <div><label style={labelStyle}>Crédits complètes offerts</label><input type="number" value={form.credits_complete} onChange={e => setForm(f => ({ ...f, credits_complete: e.target.value }))} style={inputStyle} min="0" /></div>
              </div>
            )}
            {form.pro_profile_type === 'agence' && (
              <div style={{
                marginBottom: 14,
                padding: '11px 14px',
                borderRadius: 10,
                background: '#f0f7fb',
                border: '1px solid #c7dde8',
                fontSize: 12.5,
                color: '#2a7d9c',
                lineHeight: 1.6,
              }}>
                ℹ️ <strong>Profil Agence détecté.</strong> À la création, la souscription Stripe sera automatiquement débloquée
                et un mail de proposition (149,90 € HT/mois — 15 complètes + 30 simples — 3 agents) sera envoyé au compte.
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Notes admin</label>
              <textarea value={form.pro_notes_admin} onChange={e => setForm(f => ({ ...f, pro_notes_admin: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Notes internes..." />
            </div>
            {createError && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 12, fontSize: 13, color: '#dc2626' }}>{createError}</div>}
            <button onClick={handleCreate} disabled={creating || !form.email || !form.full_name}
              style={{ width: '100%', padding: '13px', borderRadius: 12, background: (!form.email || !form.full_name) ? '#cbd5e1' : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: creating ? 0.7 : 1 }}>
              {creating
                ? 'Création en cours...'
                : (form.pro_profile_type === 'agence' ? '🏛 Créer le compte et envoyer la proposition' : 'Créer le client pro')}
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAYMENTS TAB
══════════════════════════════════════════ */
type PaymentWithUser = AdminPayment & { userEmail?: string; userName?: string; _orphan?: boolean };

function PaymentsTab({ onOpenUser, showToast }: { onOpenUser: (userId: string) => void; showToast: (m: string) => void }) {
  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'free' | 'refundable'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'particulier' | 'pro'>('all');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'all' | '7j' | '30j' | '90j'>('all');

  const loadPayments = useCallback(async () => {
    setLoading(true);

    // ─── CA V2 : on lit UNIQUEMENT payments (pro + particulier confondus) ───
    const { data: rawPayments } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(700);

    // Collect all user IDs
    const allUserIds = new Set<string>();
    (rawPayments || []).forEach(p => p.user_id && allUserIds.add(p.user_id));

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', [...allUserIds]);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Enrich payments avec _source dérivé de customer_type
    // Fallback sur customer_email/name si le user a été supprimé (user_id NULL ou pas trouvé dans profiles)
    const all: PaymentWithUser[] = (rawPayments || []).map(p => {
      const profile = p.user_id ? profileMap.get(p.user_id) : null;
      const isOrphan = !profile;
      return {
        ...p,
        userEmail: profile?.email || (p as any).customer_email || undefined,
        userName: profile?.full_name || (p as any).customer_name || undefined,
        _source: p.customer_type === 'pro' ? 'pro' : 'particulier',
        _orphan: isOrphan,
      } as PaymentWithUser;
    });

    setPayments(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  // Filtrage
  const filtered = payments.filter(p => {
    // Source
    if (sourceFilter === 'particulier' && p._source === 'pro') return false;
    if (sourceFilter === 'pro' && p._source !== 'pro') return false;
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
      // Les pros n'ont pas de droit de rétractation légal — exclus du filtre Remboursables
      if (p._source === 'pro' || days >= 14 || p.amount === 0) return false;
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
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Relevé des transactions</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Historique détaillé — Particuliers et Pro</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={doExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
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
            style={{ padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${period === p.id ? '#2a7d9c' : '#edf2f7'}`, background: period === p.id ? '#f0f7fb' : '#fff', color: period === p.id ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: period === p.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Filtre source */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' as const }}>
        {([
          { id: 'all', label: 'Tout' },
          { id: 'particulier', label: 'Particuliers' },
          { id: 'pro', label: 'Pro' },
        ] as const).map(s => (
          <button key={s.id} onClick={() => setSourceFilter(s.id)}
            style={{ padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${sourceFilter === s.id ? '#0f2d3d' : '#edf2f7'}`, background: sourceFilter === s.id ? '#0f2d3d' : '#fff', color: sourceFilter === s.id ? '#fff' : '#64748b', fontSize: 12, fontWeight: sourceFilter === s.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
            {s.label}
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
            style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${filter === f.id ? f.color : '#edf2f7'}`, background: filter === f.id ? `${f.color}12` : '#fff', color: filter === f.id ? f.color : '#64748b', fontSize: 12, fontWeight: filter === f.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
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
            // Les pros n'ont pas de droit de rétractation légal sur les contrats à distance B2B
            // → badge "Éligible remboursement" affiché uniquement pour les particuliers
            const eligible = p._source !== 'pro' && days < 14 && p.amount > 0 && p.status === 'completed';
            const isRefunded = p.status === 'refunded';
            const isPartialRefund = p.status === 'partially_refunded';
            const refundedAmt = (p as any).refunded_amount || 0;
            return (
              <div key={p.id} style={{ padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', opacity: isRefunded ? 0.65 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: p.amount === 0 ? '#f5f3ff' : isRefunded ? '#fef2f2' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.amount === 0 ? <Tag size={16} style={{ color: '#7c3aed' }} /> : <Euro size={16} style={{ color: isRefunded ? '#dc2626' : '#16a34a' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                        {p.amount === 0 ? (
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#7c3aed' }}>Gratuit</span>
                        ) : p._source === 'pro' ? (
                          <span style={{ display: 'flex', alignItems: 'baseline', gap: 4, color: isRefunded ? '#94a3b8' : '#16a34a', textDecoration: isRefunded ? 'line-through' : 'none' }}>
                            <span style={{ fontSize: 15, fontWeight: 900 }}>{((p as any).amount_ht || p.amount / 1.20).toFixed(2)}€</span>
                            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>HT</span>
                            <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, marginLeft: 2 }}>({p.amount.toFixed(2)}€ TTC)</span>
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'baseline', gap: 4, color: isRefunded ? '#94a3b8' : '#16a34a', textDecoration: isRefunded ? 'line-through' : 'none' }}>
                            <span style={{ fontSize: 15, fontWeight: 900 }}>{p.amount.toFixed(2)}€</span>
                            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>TTC</span>
                          </span>
                        )}
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                          background: p._source === 'pro' ? '#0f2d3d' : '#f0f7fb',
                          color: p._source === 'pro' ? '#fff' : '#2a7d9c' }}>
                          {p._source === 'pro' ? 'PRO' : 'PART.'}
                        </span>
                        {isRefunded && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: '#fef2f2', color: '#dc2626' }}>
                            REMBOURSÉ
                          </span>
                        )}
                        {isPartialRefund && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: '#fffbeb', color: '#d97706' }}>
                            REMBOURSÉ {refundedAmt.toFixed(2)}€/{p.amount.toFixed(2)}€
                          </span>
                        )}
                        {p.userEmail ? (
                          p._orphan ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' as const, textDecoration: 'line-through' }}>
                                {p.userEmail}
                              </span>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: '#fef2f2', color: '#dc2626' }}>
                                COMPTE SUPPRIMÉ
                              </span>
                            </span>
                          ) : (
                            <button onClick={() => onOpenUser(p.user_id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, color: '#2a7d9c', fontWeight: 700, textDecoration: 'underline', textDecorationColor: '#bae3f5' }}>
                              {p.userEmail}
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' as const }}>Client inconnu</span>
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
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>ESC</button>
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

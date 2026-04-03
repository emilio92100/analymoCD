import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, Users, FileText, Mail, BarChart2,
  Search, X, Check, AlertTriangle, Shield, CreditCard,
  Trash2, RefreshCw, Eye, EyeOff, TrendingUp, ArrowRight,
  LogOut, Send, UserPlus, CheckCircle,
} from 'lucide-react';

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  role: string;
  suspended?: boolean;
  credits_document?: number;
  credits_complete?: number;
};

type AdminAnalyse = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  adresse_bien?: string;
  title?: string;
  score?: number;
  created_at: string;
};

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  created_at: string;
  read: boolean;
};

type ConfirmAction = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => Promise<void>;
};

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function getScoreColor(s: number) {
  if (s >= 14) return '#16a34a';
  if (s >= 10) return '#d97706';
  return '#dc2626';
}
function getScoreBg(s: number) {
  if (s >= 14) return '#f0fdf4';
  if (s >= 10) return '#fffbeb';
  return '#fef2f2';
}

const PLAN_PRICES: Record<string, number> = {
  document: 4.90, complete: 19.90, pack2: 29.90, pack3: 39.90,
};
const PLAN_LABELS: Record<string, string> = {
  document: 'Simple', complete: 'Complète', pack2: 'Pack 2', pack3: 'Pack 3',
};

/* ══════════════════════════════════════════
   COMPOSANTS UI
══════════════════════════════════════════ */
function KpiCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
    </motion.div>
  );
}

function Badge({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color, background: bg, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap' as const }}>
      {children}
    </span>
  );
}

/* ── Modal générique ── */
function Modal({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: width, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{title}</h3>
          <button onClick={onClose} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, cursor: 'pointer', color: '#94a3b8', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/* ── Modal de confirmation ── */
function ConfirmModal({ action, onClose }: { action: ConfirmAction; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const colors = {
    danger: { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', btn: '#dc2626', btnBg: '#fef2f2', btnBorder: '#fecaca' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '#f0a500', btn: '#f0a500', btnBg: '#fffbeb', btnBorder: '#fde68a' },
    info: { bg: '#f0f7fb', border: '#bae3f5', icon: '#2a7d9c', btn: '#2a7d9c', btnBg: '#f0f7fb', btnBorder: '#bae3f5' },
  }[action.variant];

  return (
    <Modal title={action.title} onClose={onClose}>
      <div style={{ padding: '14px 16px', borderRadius: 12, background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', gap: 12, marginBottom: 22 }}>
        <AlertTriangle size={18} style={{ color: colors.icon, flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0 }}>{action.message}</p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Annuler
        </button>
        <button onClick={async () => { setLoading(true); await action.onConfirm(); setLoading(false); onClose(); }}
          disabled={loading}
          style={{ flex: 1, padding: '10px', borderRadius: 10, background: colors.btnBg, border: `1.5px solid ${colors.btnBorder}`, color: colors.btn, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
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
        onFocus={e => e.target.style.borderColor = '#2a7d9c'}
        onBlur={e => e.target.style.borderColor = '#edf2f7'} />
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
   ADMIN PAGE
══════════════════════════════════════════ */
export default function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analyses' | 'messages' | 'stats'>('dashboard');
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/connexion'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { navigate('/dashboard'); return; }
      setIsAdmin(true);
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7f9' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #2a7d9c', borderTopColor: 'transparent' }} />
    </div>
  );
  if (!isAdmin) return null;

  const tabs = [
    { id: 'dashboard', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'stats', label: 'Statistiques', icon: BarChart2 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'analyses', label: 'Analyses', icon: FileText },
    { id: 'messages', label: 'Messages', icon: Mail },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f9', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#0f2d3d', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={14} color="#22c55e" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirm && <ConfirmModal action={confirm} onClose={() => setConfirm(null)} />}
      </AnimatePresence>

      {/* Topbar */}
      <div style={{ background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(15,45,61,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(42,125,156,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={17} color="#7dd3f0" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>VERIMO ADMIN</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Espace d'administration</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            ← Dashboard client
          </button>
          <button onClick={() => { supabase.auth.signOut(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>

        {/* Sidebar */}
        <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #edf2f7', padding: '20px 12px', flexShrink: 0, position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, border: 'none', background: active ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : 'transparent', color: active ? '#fff' : '#64748b', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}>
                  <Icon size={16} style={{ flexShrink: 0 }} /> {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px 24px', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {activeTab === 'dashboard' && <DashboardTab onNavigate={setActiveTab} />}
              {activeTab === 'stats' && <StatsTab />}
              {activeTab === 'users' && <UsersTab onConfirm={setConfirm} showToast={showToast} />}
              {activeTab === 'analyses' && <AnalysesTab />}
              {activeTab === 'messages' && <MessagesTab onConfirm={setConfirm} showToast={showToast} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   DASHBOARD TAB
══════════════════════════════════════════ */
function DashboardTab({ onNavigate }: { onNavigate: (tab: 'users' | 'analyses' | 'messages' | 'stats') => void }) {
  const [kpis, setKpis] = useState({ users: 0, analyses: 0, messages: 0, ca: 0 });

  useEffect(() => {
    const load = async () => {
      const [{ count: users }, { count: analyses }, { count: messages }, { data: anal }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('analyses').select('*', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('read', false),
        supabase.from('analyses').select('type').eq('status', 'completed'),
      ]);
      const ca = (anal || []).reduce((sum, a) => sum + (PLAN_PRICES[a.type] || 0), 0);
      setKpis({ users: users || 0, analyses: analyses || 0, messages: messages || 0, ca });
    };
    load();
  }, []);

  const quickActions = [
    { label: 'Gérer les utilisateurs', icon: Users, color: '#2a7d9c', tab: 'users' as const },
    { label: 'Voir les messages', icon: Mail, color: '#f0a500', tab: 'messages' as const },
    { label: 'Voir les analyses', icon: FileText, color: '#7c3aed', tab: 'analyses' as const },
    { label: 'Statistiques', icon: BarChart2, color: '#16a34a', tab: 'stats' as const },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Vue d'ensemble</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Résumé de l'activité Verimo en temps réel</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Utilisateurs" value={kpis.users} sub="Comptes inscrits" color="#2a7d9c" icon={<Users size={16} color="#2a7d9c" />} />
        <KpiCard label="Analyses" value={kpis.analyses} sub="Total lancées" color="#7c3aed" icon={<FileText size={16} color="#7c3aed" />} />
        <KpiCard label="Messages non lus" value={kpis.messages} sub="Formulaire de contact" color="#f0a500" icon={<Mail size={16} color="#f0a500" />} />
        <KpiCard label="CA estimé" value={`${kpis.ca.toFixed(0)}€`} sub="Analyses complétées" color="#16a34a" icon={<TrendingUp size={16} color="#16a34a" />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Actions rapides</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => onNavigate(a.tab)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1.5px solid #edf2f7', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' as const }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = `${a.color}08`; (e.currentTarget as HTMLElement).style.borderColor = `${a.color}30`; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; (e.currentTarget as HTMLElement).style.borderColor = '#edf2f7'; }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <a.icon size={16} style={{ color: a.color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{a.label}</span>
                <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 10 }}>CA Total Estimé</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{kpis.ca.toFixed(0)}€</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Basé sur {kpis.analyses} analyses</div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            {[{ l: 'Utilisateurs', v: kpis.users }, { l: 'Analyses', v: kpis.analyses }, { l: 'Messages', v: kpis.messages }].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.l}</div>
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

  const getRange = useCallback(() => {
    const now = new Date();
    const end = now.toISOString();
    let start = new Date(now);
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
        supabase.from('analyses').select('type,status').gte('created_at', start).lte('created_at', end),
        supabase.from('analyses').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
      ]);
      const completed = (analyses || []).filter(a => a.status === 'completed');
      const ca = completed.reduce((s, a) => s + (PLAN_PRICES[a.type] || 0), 0);
      const byType = (analyses || []).reduce((acc, a) => ({ ...acc, [a.type]: (acc[a.type] || 0) + 1 }), {} as Record<string, number>);
      setStats({ newUsers: newUsers || 0, totalUsers: totalUsers || 0, totalAnalyses: totalAnalyses || 0, completedAnalyses: completed.length, ca, ticketMoyen: completed.length ? ca / completed.length : 0, byType });
    };
    load();
  }, [getRange]);

  const planColors: Record<string, string> = { document: '#64748b', complete: '#2a7d9c', pack2: '#7c3aed', pack3: '#f0a500' };
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
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }} />
            <span style={{ color: '#94a3b8' }}>→</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }} />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Nouveaux inscrits" value={stats.newUsers} sub={`/ ${stats.totalUsers} total`} color="#2a7d9c" icon={<Users size={16} color="#2a7d9c" />} />
        <KpiCard label="Analyses lancées" value={stats.totalAnalyses} sub={`${stats.completedAnalyses} complétées`} color="#7c3aed" icon={<FileText size={16} color="#7c3aed" />} />
        <KpiCard label="CA période" value={`${stats.ca.toFixed(0)}€`} sub="Analyses payées" color="#16a34a" icon={<TrendingUp size={16} color="#16a34a" />} />
        <KpiCard label="Ticket moyen" value={`${stats.ticketMoyen.toFixed(2)}€`} sub="Par analyse" color="#f0a500" icon={<CreditCard size={16} color="#f0a500" />} />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Répartition par plan</div>
        {Object.entries(PLAN_LABELS).map(([type, label]) => {
          const count = stats.byType[type] || 0;
          const pct = stats.totalAnalyses ? Math.round((count / stats.totalAnalyses) * 100) : 0;
          const revenue = count * (PLAN_PRICES[type] || 0);
          return (
            <div key={type} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: planColors[type] }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: planColors[type] }}>{count} analyse{count > 1 ? 's' : ''}</span>
                  <span style={{ color: '#94a3b8' }}>{pct}%</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{revenue.toFixed(0)}€</span>
                </div>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', background: planColors[type], borderRadius: 99 }} />
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
function UsersTab({ onConfirm, showToast }: { onConfirm: (a: ConfirmAction) => void; showToast: (m: string) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'invite' | 'credits' | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', credits_doc: 0, credits_complete: 0 });
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateUser = async () => {
    setSending(true);
    const { error } = await supabase.auth.admin.createUser({ email: form.email, password: form.password, user_metadata: { full_name: form.name }, email_confirm: true });
    setSending(false);
    if (error) { setFeedback('Erreur : ' + error.message); return; }
    setFeedback('✓ Compte créé !');
    setTimeout(() => { setModal(null); setFeedback(''); loadUsers(); }, 1200);
    showToast(`Compte ${form.email} créé avec succès`);
  };

  const handleInvite = async () => {
    setSending(true);
    const { error } = await supabase.auth.admin.inviteUserByEmail(form.email);
    setSending(false);
    if (error) { setFeedback('Erreur : ' + error.message); return; }
    setFeedback('✓ Invitation envoyée !');
    setTimeout(() => { setModal(null); setFeedback(''); }, 1500);
    showToast(`Invitation envoyée à ${form.email}`);
  };

  const handleSetCredits = async () => {
    if (!selectedUser) return;
    setSending(true);
    await supabase.from('profiles').update({ credits_document: form.credits_doc, credits_complete: form.credits_complete }).eq('id', selectedUser.id);
    setSending(false);
    setModal(null);
    loadUsers();
    showToast(`Crédits mis à jour pour ${selectedUser.email}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Utilisateurs</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{users.length} compte{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setForm(f => ({ ...f, email: '', name: '' })); setFeedback(''); setModal('invite'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Send size={14} /> Inviter
          </button>
          <button onClick={() => { setForm(f => ({ ...f, email: '', password: '', name: '' })); setFeedback(''); setModal('create'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <UserPlus size={14} /> Créer un compte
          </button>
        </div>
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par email ou nom..."
          style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit' }} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 70px 1fr', borderBottom: '1.5px solid #edf2f7', padding: '10px 18px', background: '#f8fafc' }}>
          {['Utilisateur', 'Inscrit le', 'Doc', 'Ana.', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Aucun utilisateur trouvé</div>
        ) : filtered.map((user, i) => (
          <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 70px 1fr', padding: '13px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{user.full_name || '—'}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{user.email}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                {user.role === 'admin' && <Badge color="#7c3aed" bg="#f5f3ff">admin</Badge>}
                {user.suspended && <Badge color="#dc2626" bg="#fef2f2">suspendu</Badge>}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(user.created_at)}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#2a7d9c' }}>{user.credits_document || 0}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#2a7d9c' }}>{user.credits_complete || 0}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <ActionBtn icon={<CreditCard size={11} />} label="Crédits" color="#2a7d9c" bg="#f0f7fb" border="#bae3f5"
                onClick={() => { setSelectedUser(user); setForm(f => ({ ...f, credits_doc: user.credits_document || 0, credits_complete: user.credits_complete || 0 })); setModal('credits'); }} />
              <ActionBtn icon={<RefreshCw size={11} />} label="Reset mdp" color="#64748b" bg="#f8fafc" border="#edf2f7"
                onClick={() => onConfirm({
                  title: 'Réinitialiser le mot de passe',
                  message: `Un email de réinitialisation sera envoyé à ${user.email}. L'utilisateur devra créer un nouveau mot de passe.`,
                  confirmLabel: 'Envoyer l\'email',
                  variant: 'info',
                  onConfirm: async () => { await supabase.auth.resetPasswordForEmail(user.email); showToast(`Email envoyé à ${user.email}`); },
                })} />
              <ActionBtn
                icon={user.suspended ? <Eye size={11} /> : <EyeOff size={11} />}
                label={user.suspended ? 'Réactiver' : 'Suspendre'}
                color={user.suspended ? '#16a34a' : '#f0a500'}
                bg={user.suspended ? '#f0fdf4' : '#fffbeb'}
                border={user.suspended ? '#d1fae5' : '#fde68a'}
                onClick={() => onConfirm({
                  title: user.suspended ? 'Réactiver le compte' : 'Suspendre le compte',
                  message: user.suspended
                    ? `Réactiver le compte de ${user.email} ? L'utilisateur pourra à nouveau se connecter.`
                    : `Suspendre le compte de ${user.email} ? L'utilisateur ne pourra plus se connecter.`,
                  confirmLabel: user.suspended ? 'Réactiver' : 'Suspendre',
                  variant: user.suspended ? 'info' : 'warning',
                  onConfirm: async () => { await supabase.from('profiles').update({ suspended: !user.suspended }).eq('id', user.id); loadUsers(); showToast(`Compte ${user.suspended ? 'réactivé' : 'suspendu'}`); },
                })} />
              <ActionBtn icon={<Trash2 size={11} />} label="Supprimer" color="#dc2626" bg="#fef2f2" border="#fecaca"
                onClick={() => onConfirm({
                  title: 'Supprimer le compte',
                  message: `Supprimer définitivement le compte de ${user.email} ? Toutes ses données et analyses seront perdues. Cette action est irréversible.`,
                  confirmLabel: 'Supprimer définitivement',
                  variant: 'danger',
                  onConfirm: async () => { await supabase.auth.admin.deleteUser(user.id); loadUsers(); showToast(`Compte supprimé`); },
                })} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'create' && (
          <Modal title="Créer un compte client" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <Input label="Nom complet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jean Dupont" />
              <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@email.com" />
              <Input label="Mot de passe temporaire" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 caractères" />
              {feedback && <div style={{ fontSize: 13, color: feedback.includes('Erreur') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{feedback}</div>}
              <button onClick={handleCreateUser} disabled={!form.email || !form.password || sending}
                style={{ padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: sending ? 0.7 : 1 }}>
                <UserPlus size={15} /> {sending ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </Modal>
        )}
        {modal === 'invite' && (
          <Modal title="Inviter par email" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: 0, padding: '12px 14px', background: '#f8fafc', borderRadius: 10 }}>
                Le client reçoit un email avec un lien pour créer son mot de passe. Son compte est activé dès qu'il clique.
              </p>
              <Input label="Email du client" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@email.com" />
              {feedback && <div style={{ fontSize: 13, color: feedback.includes('Erreur') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{feedback}</div>}
              <button onClick={handleInvite} disabled={!form.email || sending}
                style={{ padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: sending ? 0.7 : 1 }}>
                <Send size={15} /> {sending ? 'Envoi...' : "Envoyer l'invitation"}
              </button>
            </div>
          </Modal>
        )}
        {modal === 'credits' && selectedUser && (
          <Modal title={`Crédits — ${selectedUser.email}`} onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <div style={{ padding: '12px 16px', borderRadius: 11, background: '#f8fafc', border: '1px solid #edf2f7', fontSize: 13, color: '#64748b' }}>
                Actuellement : <strong style={{ color: '#0f172a' }}>{selectedUser.credits_document || 0}</strong> simple · <strong style={{ color: '#0f172a' }}>{selectedUser.credits_complete || 0}</strong> complet
              </div>
              <Input label="Crédits Analyse Simple (4,90€)" type="number" value={form.credits_doc} onChange={e => setForm(f => ({ ...f, credits_doc: parseInt(e.target.value) || 0 }))} />
              <Input label="Crédits Analyse Complète (19,90€+)" type="number" value={form.credits_complete} onChange={e => setForm(f => ({ ...f, credits_complete: parseInt(e.target.value) || 0 }))} />
              <button onClick={handleSetCredits} disabled={sending}
                style={{ padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Check size={15} /> {sending ? 'Enregistrement...' : 'Enregistrer les crédits'}
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

  const filtered = filter === 'all' ? analyses : analyses.filter(a => a.status === filter);
  const completed = analyses.filter(a => a.status === 'completed').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Analyses</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{analyses.length} analyses · {completed} complétées</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'completed', 'processing', 'error'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${filter === f ? '#2a7d9c' : '#edf2f7'}`, background: filter === f ? '#f0f7fb' : '#fff', color: filter === f ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: 'pointer' }}>
              {f === 'all' ? 'Toutes' : f === 'completed' ? 'Complétées' : f === 'processing' ? 'En cours' : 'Erreurs'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 100px 90px', borderBottom: '1.5px solid #edf2f7', padding: '10px 18px', background: '#f8fafc' }}>
          {['Adresse / Titre', 'Type', 'Score', 'Statut', 'Date'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Aucune analyse</div>
        ) : filtered.map((a, i) => (
          <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 100px 90px', padding: '12px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {a.adresse_bien || a.title || 'Sans titre'}
            </div>
            <div><Badge color="#64748b" bg="#f8fafc">{PLAN_LABELS[a.type] || a.type}</Badge></div>
            <div>
              {a.score != null
                ? <span style={{ fontSize: 13, fontWeight: 900, color: getScoreColor(a.score), background: getScoreBg(a.score), padding: '3px 9px', borderRadius: 8 }}>{a.score}/20</span>
                : <span style={{ color: '#e2e8f0', fontSize: 13 }}>—</span>}
            </div>
            <div>
              {a.status === 'completed' ? <Badge color="#16a34a" bg="#f0fdf4">✓ Complétée</Badge>
                : a.status === 'processing' ? <Badge color="#2a7d9c" bg="#f0f7fb">⟳ En cours</Badge>
                : <Badge color="#dc2626" bg="#fef2f2">✗ Erreur</Badge>}
            </div>
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
function MessagesTab({ onConfirm, showToast }: { onConfirm: (a: ConfirmAction) => void; showToast: (m: string) => void }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    setMessages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const markRead = async (msg: ContactMessage) => {
    await supabase.from('contact_messages').update({ read: true }).eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    setSelected({ ...msg, read: true });
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
        <div style={{ display: 'flex', gap: 6 }}>
          {(['unread', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${filter === f ? '#2a7d9c' : '#edf2f7'}`, background: filter === f ? '#f0f7fb' : '#fff', color: filter === f ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: 'pointer' }}>
              {f === 'unread' ? `Non lus (${unreadCount})` : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8' }}>Chargement...</div>
          ) : filtered.length === 0 ? (
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
              <div style={{ fontSize: 12, color: '#2a7d9c', marginBottom: 2 }}>{msg.email}</div>
              {msg.subject && <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{msg.subject}</div>}
              <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{msg.message}</div>
            </div>
          ))}
        </div>

        {selected && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{selected.name}</div>
                <a href={`mailto:${selected.email}`} style={{ fontSize: 13, color: '#2a7d9c', textDecoration: 'none', fontWeight: 600 }}>{selected.email}</a>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, cursor: 'pointer', color: '#94a3b8', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>
            {selected.subject && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14, padding: '9px 12px', background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7' }}>
                Sujet : {selected.subject}
              </div>
            )}
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' as const }}>{selected.message}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 20 }}>{fmtDateTime(selected.created_at)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Votre message Verimo'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <Send size={13} /> Répondre
              </a>
              <button onClick={() => onConfirm({
                title: 'Supprimer le message',
                message: `Supprimer le message de ${selected.name} (${selected.email}) ? Cette action est irréversible.`,
                confirmLabel: 'Supprimer',
                variant: 'danger',
                onConfirm: async () => {
                  await supabase.from('contact_messages').delete().eq('id', selected.id);
                  setSelected(null);
                  loadMessages();
                  showToast('Message supprimé');
                },
              })}
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

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, Users, FileText, Mail, BarChart2,
  Search, X, Check, AlertTriangle,
  Shield, CreditCard, Trash2, RefreshCw, Eye, EyeOff,
  TrendingUp, ArrowRight, LogOut, Send, UserPlus,
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
  analyses_count?: number;
};

type AdminAnalyse = {
  id: string;
  user_id: string;
  user_email?: string;
  type: string;
  status: string;
  adresse_bien?: string;
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

type Period = '7j' | '30j' | '3m' | '12m' | 'custom';

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function scoreColor(s: number) {
  if (s >= 17) return '#15803d';
  if (s >= 14) return '#16a34a';
  if (s >= 10) return '#d97706';
  if (s >= 7) return '#ea580c';
  return '#dc2626';
}
function scoreBg(s: number) {
  if (s >= 14) return '#f0fdf4';
  if (s >= 10) return '#fffbeb';
  return '#fef2f2';
}

const PLAN_PRICES: Record<string, number> = {
  document: 4.90, complete: 19.90, pack2: 29.90, pack3: 39.90,
};

/* ══════════════════════════════════════════
   COMPOSANTS UI
══════════════════════════════════════════ */
function Stat({ label, value, sub, color = '#2a7d9c', icon }: { label: string; value: string | number; sub?: string; color?: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Badge({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color, background: bg, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      <input {...props} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f172a', fontFamily: 'inherit', background: '#f8fafc' }} />
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'danger' | 'ghost' | 'outline'; size?: 'sm' | 'md'; disabled?: boolean }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', border: 'none' },
    danger: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
    ghost: { background: 'transparent', color: '#64748b', border: 'none' },
    outline: { background: '#f8fafc', color: '#0f172a', border: '1.5px solid #edf2f7' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: size === 'sm' ? '6px 12px' : '10px 18px', borderRadius: 10, fontSize: size === 'sm' ? 12 : 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap', ...styles[variant] }}>
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════
   PAGE ADMIN
══════════════════════════════════════════ */
export default function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analyses' | 'messages' | 'stats'>('dashboard');

  /* ── Vérification admin ── */
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/connexion'); return; }

      // Essai 1 : lecture via profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Debug log pour identifier le problème
      console.log('Admin check — user:', user.email, '| profile:', profile, '| error:', error);

      if (profile?.role === 'admin') {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Si erreur RLS ou profil sans role, redirige dashboard
      navigate('/dashboard');
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
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'stats', label: 'Statistiques', icon: BarChart2 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'analyses', label: 'Analyses', icon: FileText },
    { id: 'messages', label: 'Messages', icon: Mail },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f9', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Topbar */}
      <div style={{ background: '#0f2d3d', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(42,125,156,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={16} color="#2a7d9c" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>VERIMO ADMIN</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Espace d'administration</div>
          </div>
        </div>
        <button onClick={() => { supabase.auth.signOut(); navigate('/'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <LogOut size={13} /> Déconnexion
        </button>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>

        {/* Sidebar */}
        <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #edf2f7', padding: '20px 12px', flexShrink: 0, position: 'sticky', top: 58, height: 'calc(100vh - 58px)', overflowY: 'auto' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 11, border: 'none', background: active ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : 'transparent', color: active ? '#fff' : '#64748b', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <Icon size={16} style={{ flexShrink: 0 }} /> {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px 24px', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'stats' && <StatsTab />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'analyses' && <AnalysesTab />}
              {activeTab === 'messages' && <MessagesTab />}
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
function DashboardTab() {
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Vue d'ensemble</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Résumé de l'activité Verimo</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        <Stat label="Utilisateurs" value={kpis.users} sub="Comptes inscrits" color="#2a7d9c" icon={<Users size={16} color="#2a7d9c" />} />
        <Stat label="Analyses" value={kpis.analyses} sub="Total lancées" color="#7c3aed" icon={<FileText size={16} color="#7c3aed" />} />
        <Stat label="Messages non lus" value={kpis.messages} sub="Formulaire de contact" color="#f0a500" icon={<Mail size={16} color="#f0a500" />} />
        <Stat label="CA estimé" value={`${kpis.ca.toFixed(0)}€`} sub="Analyses complétées" color="#16a34a" icon={<TrendingUp size={16} color="#16a34a" />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Actions rapides</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Créer un utilisateur', icon: UserPlus, color: '#2a7d9c' },
              { label: 'Voir les messages', icon: Mail, color: '#f0a500' },
              { label: 'Voir les analyses', icon: FileText, color: '#7c3aed' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 11, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer' }}>
                <a.icon size={15} style={{ color: a.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{a.label}</span>
                <ArrowRight size={13} style={{ color: '#cbd5e1', marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Chiffre d'affaires estimé</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{kpis.ca.toFixed(0)}€</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Basé sur les analyses complétées</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STATS TAB
══════════════════════════════════════════ */
function StatsTab() {
  const [period, setPeriod] = useState<Period>('30j');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [stats, setStats] = useState({
    newUsers: 0, totalUsers: 0,
    totalAnalyses: 0, completedAnalyses: 0,
    ca: 0, ticketMoyen: 0,
    byType: {} as Record<string, number>,
  });

  const getDateRange = useCallback(() => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);
    if (period === '7j') start.setDate(now.getDate() - 7);
    else if (period === '30j') start.setDate(now.getDate() - 30);
    else if (period === '3m') start.setMonth(now.getMonth() - 3);
    else if (period === '12m') start.setFullYear(now.getFullYear() - 1);
    else if (period === 'custom') {
      return { start: customStart, end: customEnd + 'T23:59:59' };
    }
    return { start: start.toISOString(), end: end.toISOString() };
  }, [period, customStart, customEnd]);

  useEffect(() => {
    const load = async () => {
      const { start, end } = getDateRange();
      if (!start || !end) return;

      const [{ count: newUsers }, { count: totalUsers }, { data: analyses }, { count: totalAnalyses }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('analyses').select('type, status').gte('created_at', start).lte('created_at', end),
        supabase.from('analyses').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
      ]);

      const completed = (analyses || []).filter(a => a.status === 'completed');
      const ca = completed.reduce((sum, a) => sum + (PLAN_PRICES[a.type] || 0), 0);
      const byType = (analyses || []).reduce((acc, a) => ({ ...acc, [a.type]: (acc[a.type] || 0) + 1 }), {} as Record<string, number>);

      setStats({
        newUsers: newUsers || 0,
        totalUsers: totalUsers || 0,
        totalAnalyses: totalAnalyses || 0,
        completedAnalyses: completed.length,
        ca,
        ticketMoyen: completed.length ? ca / completed.length : 0,
        byType,
      });
    };
    load();
  }, [getDateRange]);

  const periods: { id: Period; label: string }[] = [
    { id: '7j', label: '7 jours' },
    { id: '30j', label: '30 jours' },
    { id: '3m', label: '3 mois' },
    { id: '12m', label: '12 mois' },
    { id: 'custom', label: 'Personnalisé' },
  ];

  const planLabels: Record<string, string> = { document: 'Simple 4,90€', complete: 'Complète 19,90€', pack2: 'Pack 2 biens', pack3: 'Pack 3 biens' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Statistiques</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Performance sur la période sélectionnée</p>
      </div>

      {/* Sélecteur période */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
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
            <span style={{ color: '#94a3b8', fontSize: 13 }}>→</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }} />
          </>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <Stat label="Nouveaux inscrits" value={stats.newUsers} sub={`/ ${stats.totalUsers} total`} color="#2a7d9c" icon={<Users size={16} color="#2a7d9c" />} />
        <Stat label="Analyses lancées" value={stats.totalAnalyses} sub={`${stats.completedAnalyses} complétées`} color="#7c3aed" icon={<FileText size={16} color="#7c3aed" />} />
        <Stat label="CA période" value={`${stats.ca.toFixed(0)}€`} sub="Analyses payées complétées" color="#16a34a" icon={<TrendingUp size={16} color="#16a34a" />} />
        <Stat label="Ticket moyen" value={`${stats.ticketMoyen.toFixed(2)}€`} sub="Par analyse complétée" color="#f0a500" icon={<CreditCard size={16} color="#f0a500" />} />
      </div>

      {/* Répartition par plan */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Répartition par plan</div>
        {Object.keys(planLabels).map(type => {
          const count = stats.byType[type] || 0;
          const total = stats.totalAnalyses || 1;
          const pct = Math.round((count / total) * 100);
          const colors: Record<string, string> = { document: '#64748b', complete: '#2a7d9c', pack2: '#7c3aed', pack3: '#f0a500' };
          return (
            <div key={type} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{planLabels[type]}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors[type] }}>{count} ({pct}%)</span>
              </div>
              <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', background: colors[type], borderRadius: 99 }} />
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
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'invite' | 'credits' | 'delete' | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', credits_doc: 0, credits_complete: 0 });
  const [feedback, setFeedback] = useState('');

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
    const { error } = await supabase.auth.admin.createUser({
      email: form.email, password: form.password,
      user_metadata: { full_name: form.name },
      email_confirm: true,
    });
    if (error) { setFeedback('Erreur : ' + error.message); return; }
    setFeedback('Compte créé avec succès !');
    setTimeout(() => { setModal(null); setFeedback(''); loadUsers(); }, 1500);
  };

  const handleInviteUser = async () => {
    const { error } = await supabase.auth.admin.inviteUserByEmail(form.email);
    if (error) { setFeedback('Erreur : ' + error.message); return; }
    setFeedback('Invitation envoyée !');
    setTimeout(() => { setModal(null); setFeedback(''); }, 1500);
  };

  const handleSetCredits = async () => {
    if (!selectedUser) return;
    const { error } = await supabase.from('profiles').update({
      credits_document: form.credits_doc,
      credits_complete: form.credits_complete,
    }).eq('id', selectedUser.id);
    if (error) { setFeedback('Erreur : ' + error.message); return; }
    setFeedback('Crédits mis à jour !');
    setTimeout(() => { setModal(null); setFeedback(''); loadUsers(); }, 1200);
  };

  const handleSuspend = async (user: AdminUser) => {
    await supabase.from('profiles').update({ suspended: !user.suspended }).eq('id', user.id);
    loadUsers();
  };

  const handleResetPassword = async (user: AdminUser) => {
    await supabase.auth.resetPasswordForEmail(user.email);
    alert(`Email de réinitialisation envoyé à ${user.email}`);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    await supabase.auth.admin.deleteUser(selectedUser.id);
    setModal(null);
    loadUsers();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Utilisateurs</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{users.length} compte{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => setModal('invite')} variant="outline"><Send size={14} /> Inviter</Btn>
          <Btn onClick={() => setModal('create')}><UserPlus size={14} /> Créer un compte</Btn>
        </div>
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par email ou nom..."
          style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' }} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 80px 180px', borderBottom: '1px solid #f1f5f9', padding: '10px 16px' }}>
          {['Utilisateur', 'Inscrit le', 'Crédits doc', 'Crédits ana.', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun utilisateur trouvé</div>
        ) : filtered.map((user, i) => (
          <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 80px 180px', padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user.full_name || '—'}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{user.email}</div>
              {user.role === 'admin' && <Badge color="#7c3aed" bg="#f5f3ff">admin</Badge>}
              {user.suspended && <Badge color="#dc2626" bg="#fef2f2">suspendu</Badge>}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(user.created_at)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c' }}>{user.credits_document || 0}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c' }}>{user.credits_complete || 0}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button title="Gérer les crédits" onClick={() => { setSelectedUser(user); setForm(f => ({ ...f, credits_doc: user.credits_document || 0, credits_complete: user.credits_complete || 0 })); setModal('credits'); }}
                style={{ padding: '5px 8px', borderRadius: 7, background: '#f0f7fb', border: '1px solid #bae3f5', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#2a7d9c' }}>
                <CreditCard size={12} />
              </button>
              <button title="Réinitialiser le mot de passe" onClick={() => handleResetPassword(user)}
                style={{ padding: '5px 8px', borderRadius: 7, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer' }}>
                <RefreshCw size={12} color="#64748b" />
              </button>
              <button title={user.suspended ? 'Réactiver' : 'Suspendre'} onClick={() => handleSuspend(user)}
                style={{ padding: '5px 8px', borderRadius: 7, background: user.suspended ? '#f0fdf4' : '#fffbeb', border: `1px solid ${user.suspended ? '#d1fae5' : '#fde68a'}`, cursor: 'pointer' }}>
                {user.suspended ? <Eye size={12} color="#16a34a" /> : <EyeOff size={12} color="#f0a500" />}
              </button>
              <button title="Supprimer" onClick={() => { setSelectedUser(user); setModal('delete'); }}
                style={{ padding: '5px 8px', borderRadius: 7, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer' }}>
                <Trash2 size={12} color="#dc2626" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'create' && (
          <Modal title="Créer un compte client" onClose={() => { setModal(null); setFeedback(''); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Nom complet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jean Dupont" />
              <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@email.com" />
              <Input label="Mot de passe temporaire" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 caractères" />
              {feedback && <div style={{ fontSize: 13, color: feedback.includes('Erreur') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{feedback}</div>}
              <Btn onClick={handleCreateUser} disabled={!form.email || !form.password}><UserPlus size={14} /> Créer le compte</Btn>
            </div>
          </Modal>
        )}
        {modal === 'invite' && (
          <Modal title="Inviter par email" onClose={() => { setModal(null); setFeedback(''); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>Le client recevra un email avec un lien pour créer son mot de passe.</p>
              <Input label="Email du client" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@email.com" />
              {feedback && <div style={{ fontSize: 13, color: feedback.includes('Erreur') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{feedback}</div>}
              <Btn onClick={handleInviteUser} disabled={!form.email}><Send size={14} /> Envoyer l'invitation</Btn>
            </div>
          </Modal>
        )}
        {modal === 'credits' && selectedUser && (
          <Modal title={`Crédits — ${selectedUser.email}`} onClose={() => { setModal(null); setFeedback(''); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '12px 16px', borderRadius: 11, background: '#f8fafc', border: '1px solid #edf2f7', fontSize: 13, color: '#64748b' }}>
                Actuellement : <strong style={{ color: '#0f172a' }}>{selectedUser.credits_document || 0}</strong> crédit(s) simple · <strong style={{ color: '#0f172a' }}>{selectedUser.credits_complete || 0}</strong> crédit(s) complet
              </div>
              <Input label="Crédits Analyse Simple" type="number" value={form.credits_doc} onChange={e => setForm(f => ({ ...f, credits_doc: parseInt(e.target.value) || 0 }))} />
              <Input label="Crédits Analyse Complète" type="number" value={form.credits_complete} onChange={e => setForm(f => ({ ...f, credits_complete: parseInt(e.target.value) || 0 }))} />
              {feedback && <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{feedback}</div>}
              <Btn onClick={handleSetCredits}><Check size={14} /> Enregistrer</Btn>
            </div>
          </Modal>
        )}
        {modal === 'delete' && selectedUser && (
          <Modal title="Supprimer le compte" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px', borderRadius: 11, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', gap: 10 }}>
                <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Action irréversible</div>
                  <div style={{ fontSize: 13, color: '#7f1d1d' }}>Supprimer <strong>{selectedUser.email}</strong> et toutes ses données ?</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={() => setModal(null)} variant="outline">Annuler</Btn>
                <Btn onClick={handleDelete} variant="danger"><Trash2 size={14} /> Supprimer définitivement</Btn>
              </div>
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
      const { data } = await supabase.from('analyses').select('*').order('created_at', { ascending: false }).limit(100);
      setAnalyses(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = filter === 'all' ? analyses : analyses.filter(a => a.status === filter);

  const statusBadge = (status: string) => {
    if (status === 'completed') return <Badge color="#16a34a" bg="#f0fdf4">✓ Complétée</Badge>;
    if (status === 'processing') return <Badge color="#2a7d9c" bg="#f0f7fb">⟳ En cours</Badge>;
    return <Badge color="#dc2626" bg="#fef2f2">✗ Erreur</Badge>;
  };

  const typeBadge = (type: string) => {
    const labels: Record<string, string> = { document: 'Simple', complete: 'Complète', pack2: 'Pack 2', pack3: 'Pack 3' };
    return <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{labels[type] || type}</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Analyses</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{analyses.length} analyses au total</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'completed', 'processing', 'error'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${filter === f ? '#2a7d9c' : '#edf2f7'}`, background: filter === f ? '#f0f7fb' : '#fff', color: filter === f ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: 'pointer' }}>
              {f === 'all' ? 'Toutes' : f === 'completed' ? 'Complétées' : f === 'processing' ? 'En cours' : 'Erreurs'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 90px 110px', borderBottom: '1px solid #f1f5f9', padding: '10px 16px' }}>
          {['Adresse / Titre', 'Type', 'Score', 'Statut', 'Date'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune analyse</div>
        ) : filtered.map((a, i) => (
          <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 90px 110px', padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.adresse_bien || 'Sans adresse'}
            </div>
            <div>{typeBadge(a.type)}</div>
            <div>
              {a.score != null
                ? <span style={{ fontSize: 13, fontWeight: 900, color: scoreColor(a.score), background: scoreBg(a.score), padding: '3px 9px', borderRadius: 8 }}>{a.score}/20</span>
                : <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
              }
            </div>
            <div>{statusBadge(a.status)}</div>
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
function MessagesTab() {
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

  const deleteMsg = async (id: string) => {
    await supabase.from('contact_messages').delete().eq('id', id);
    setSelected(null);
    loadMessages();
  };

  const filtered = filter === 'unread' ? messages.filter(m => !m.read) : messages;
  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Messages</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{unreadCount} non lu{unreadCount > 1 ? 's' : ''} · {messages.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['unread', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${filter === f ? '#2a7d9c' : '#edf2f7'}`, background: filter === f ? '#f0f7fb' : '#fff', color: filter === f ? '#2a7d9c' : '#64748b', fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: 'pointer' }}>
              {f === 'unread' ? `Non lus (${unreadCount})` : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* Liste */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              <Mail size={32} style={{ color: '#e2e8f0', margin: '0 auto 12px', display: 'block' }} />
              Aucun message {filter === 'unread' ? 'non lu' : ''}
            </div>
          ) : filtered.map((msg, i) => (
            <div key={msg.id} onClick={() => { setSelected(msg); if (!msg.read) markRead(msg); }}
              style={{ padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: selected?.id === msg.id ? '#f0f7fb' : msg.read ? '#fff' : '#fffbeb', transition: 'background 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!msg.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f0a500', flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, fontWeight: msg.read ? 600 : 800, color: '#0f172a' }}>{msg.name}</span>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(msg.created_at)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>{msg.email}</div>
              {msg.subject && <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{msg.subject}</div>}
              <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</div>
            </div>
          ))}
        </div>

        {/* Détail message */}
        {selected && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>{selected.name}</div>
                <a href={`mailto:${selected.email}`} style={{ fontSize: 13, color: '#2a7d9c', textDecoration: 'none' }}>{selected.email}</a>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            {selected.subject && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 9 }}>
                Sujet : {selected.subject}
              </div>
            )}
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, marginBottom: 20, whiteSpace: 'pre-wrap' }}>{selected.message}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 20 }}>{fmtDateTime(selected.created_at)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Votre message'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <Send size={13} /> Répondre
              </a>
              <button onClick={() => deleteMsg(selected.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Trash2 size={13} /> Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

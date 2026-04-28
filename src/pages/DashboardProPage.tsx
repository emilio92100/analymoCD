import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, Plus, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, CreditCard, BookOpen,
  Send, Eye, Search, Clock,
  CheckCircle, Upload, Mail,
  ChevronRight, ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Réutiliser les vues existantes
import NouvelleAnalyse from './dashboard/NouvelleAnalyse';
import Compare from './dashboard/Compare';
import Support from './dashboard/Support';
import Aide from './dashboard/Aide';

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type ProProfile = {
  id: string;
  full_name?: string;
  email?: string;
  role: string;
  telephone?: string;
  pro_profile_type?: string;
  pro_company_name?: string;
  pro_company_address?: string;
  pro_siret?: string;
  pro_ville?: string;
  pro_network?: string;
  pro_logo_url?: string;
  pro_contact_email?: string;
  pro_contact_phone?: string;
  pro_recommended_plan?: string;
  pro_onboarding_done?: boolean;
  credits_document?: number;
  credits_complete?: number;
};

type ProSubscription = {
  id: string;
  plan: string;
  status: string;
  credits_complete_total: number;
  credits_complete_used: number;
  credits_simple_total: number;
  credits_simple_used: number;
  current_period_start?: string;
  current_period_end?: string;
};

type ProAnalysis = {
  id: string;
  type: string;
  status: string;
  title: string;
  address?: string;
  created_at: string;
  result?: Record<string, unknown>;
};

type ReportShare = {
  id: string;
  analysis_id: string;
  recipient_name: string;
  recipient_firstname?: string;
  recipient_email: string;
  sent_at: string;
  opened_at?: string;
};

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const getScore = (r: Record<string, unknown> | undefined) => r && typeof r === 'object' && 'score' in r ? (r as { score: number }).score : null;
const getScoreColor = (s: number) => s >= 17 ? '#16a34a' : s >= 14 ? '#2a7d9c' : s >= 10 ? '#d97706' : s >= 7 ? '#ea580c' : '#dc2626';
const getDPE = (r: Record<string, unknown> | undefined): string | null => {
  if (!r || typeof r !== 'object') return null;
  const cats = r.categories as Record<string, unknown> | undefined;
  if (!cats) return null;
  const dp = cats.diags_privatifs as Record<string, unknown> | undefined;
  if (!dp) return null;
  const details = dp.details as Array<{ label: string; message: string }> | undefined;
  if (!details) return null;
  for (const d of details) {
    const m = d.message?.match(/classe\s+([A-G])/i) || d.label?.match(/DPE\s+([A-G])/i);
    if (m) return m[1].toUpperCase();
  }
  return null;
};

const DPE_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: '#f0fdf4', color: '#16a34a' }, B: { bg: '#f0fdf4', color: '#22c55e' },
  C: { bg: '#fefce8', color: '#a3e635' }, D: { bg: '#fefce8', color: '#d97706' },
  E: { bg: '#fff7ed', color: '#ea580c' }, F: { bg: '#fef2f2', color: '#dc2626' },
  G: { bg: '#fef2f2', color: '#991b1b' },
};

/* ══════════════════════════════════════════
   NAV
══════════════════════════════════════════ */
const proNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/dashboard/dossiers', icon: FolderOpen, label: 'Mes dossiers' },
  { to: '/dashboard/compare', icon: GitCompare, label: 'Comparer' },
  { to: '/dashboard/abonnement', icon: CreditCard, label: 'Mon abonnement' },
  { to: '/dashboard/compte', icon: User, label: 'Mon compte' },
  { to: '/dashboard/aide', icon: BookOpen, label: 'Aide & Méthode' },
  { to: '/dashboard/support', icon: LifeBuoy, label: 'Support' },
];

/* ══════════════════════════════════════════
   SIDEBAR PRO
══════════════════════════════════════════ */
function SidebarPro({ subscription, onClose }: { subscription: ProSubscription | null; onClose?: () => void }) {
  const location = useLocation();

  const BG = '#0a1f2d';
  const ACCENT = '#7dd3fc';
  const TEXT = 'rgba(255,255,255,0.75)';
  const TEXT_ACTIVE = '#ffffff';
  const MUTED = 'rgba(255,255,255,0.25)';

  const creditsComplete = subscription ? (subscription.credits_complete_total - subscription.credits_complete_used) : 0;
  const creditsSimple = subscription ? (subscription.credits_simple_total - subscription.credits_simple_used) : 0;

  return (
    <aside style={{ width: 260, minHeight: '100vh', height: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Logo + PRO badge */}
      <div style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <Link to="/" onClick={onClose} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>verimo</span>
          <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #38bdf8)`, color: '#0a1f2d', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 100, letterSpacing: '0.08em' }}>ACCÈS PRO</span>
        </Link>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}><X size={18} /></button>}
      </div>

      {/* CTA Nouvelle analyse */}
      <div style={{ padding: '14px 14px 8px' }}>
        <Link to="/dashboard/nouvelle-analyse" onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, background: '#2a7d9c', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}>
          <Plus size={15} strokeWidth={2.5} /> Nouvelle analyse
        </Link>
      </div>

      {/* Crédits restants */}
      <div style={{ margin: '0 14px 6px', padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', marginBottom: 7 }}>CRÉDITS RESTANTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ label: 'Complète', value: creditsComplete }, { label: 'Simple', value: creditsSimple }].map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{c.label}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: c.value > 0 ? ACCENT : 'rgba(255,255,255,0.2)' }}>{c.value}</span>
            </div>
          ))}
        </div>
        {subscription ? (
          <div style={{ marginTop: 7, fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            Plan {subscription.plan === 'starter' ? 'Starter' : 'Power'} · Renouvellement {subscription.current_period_end ? fmtDate(subscription.current_period_end) : '—'}
          </div>
        ) : (
          <Link to="/dashboard/abonnement" onClick={onClose} style={{ display: 'block', marginTop: 7, fontSize: 11, fontWeight: 700, color: ACCENT, textDecoration: 'none', textAlign: 'center' }}>
            Choisir un abonnement
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.12em', padding: '10px 10px 5px', textTransform: 'uppercase' }}>Menu</p>
        {proNavItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.to || (item.to === '/dashboard/dossiers' && location.pathname.startsWith('/dashboard/dossier'));
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', textDecoration: 'none',
                fontSize: 13, fontWeight: active ? 700 : 500, color: active ? TEXT_ACTIVE : TEXT,
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'all 0.15s',
                borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent', borderRadius: 0,
              }}>
              <Icon size={16} style={{ color: active ? ACCENT : TEXT, flexShrink: 0 }} />{item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/* ══════════════════════════════════════════
   TOPBAR PRO
══════════════════════════════════════════ */
function TopbarPro({ onMenuClick, title, proProfile }: { onMenuClick: () => void; title: string; proProfile: ProProfile | null }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const name = proProfile?.full_name?.split(' ')[0] || 'Pro';
  const email = proProfile?.email || '';
  const company = proProfile?.pro_company_name || '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => { localStorage.clear(); supabase.auth.signOut(); window.location.replace('/'); };

  return (
    <header style={{ height: 68, background: '#fff', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, position: 'sticky', top: 0, zIndex: 40, flexShrink: 0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f2d3d', padding: 4, display: 'none' }}><Menu size={20} /></button>
      <p className="topbar-title" style={{ flex: 1, fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</p>

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px 6px 6px', borderRadius: 10, background: dropdownOpen ? '#f0f7fb' : '#f8fafc', border: `1px solid ${dropdownOpen ? '#c7dde8' : '#edf2f7'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>
            {(name.charAt(0) || 'P').toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }} className="topbar-cta">{name}</span>
            {company && <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }} className="topbar-cta">{company}</span>}
          </div>
          <ChevronDown size={13} style={{ color: '#94a3b8' }} />
        </button>
        {dropdownOpen && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', boxShadow: '0 16px 48px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f5f9' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{proProfile?.full_name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{email}</div>
              {company && <div style={{ fontSize: 11, color: '#2a7d9c', marginTop: 2 }}>{company}</div>}
            </div>
            <button onClick={() => { navigate('/dashboard/compte'); setDropdownOpen(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0f172a', textAlign: 'left' as const }}>
              <User size={15} style={{ color: '#2a7d9c' }} /> Mon profil
            </button>
            <button onClick={handleLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', borderTop: '1px solid #f0f5f9', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#ef4444', textAlign: 'left' as const }}>
              <LogOut size={15} /> Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════
   SCORE RING (mini)
══════════════════════════════════════════ */
function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const color = getScoreColor(score);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 20) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2edf3" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" fontSize={size * 0.3} fontWeight={700} fill={color} dominantBaseline="middle">{score}</text>
    </svg>
  );
}

/* ══════════════════════════════════════════
   HOME VIEW PRO
══════════════════════════════════════════ */
function HomeViewPro({ proProfile, subscription, analyses, shares }: { proProfile: ProProfile; subscription: ProSubscription | null; analyses: ProAnalysis[]; shares: ReportShare[] }) {
  const prenom = proProfile.full_name?.split(' ')[0] || 'Pro';
  const completedAnalyses = analyses.filter(a => a.status === 'completed');
  const thisMonth = analyses.filter(a => { const d = new Date(a.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const creditsLeft = subscription ? (subscription.credits_complete_total - subscription.credits_complete_used) + (subscription.credits_simple_total - subscription.credits_simple_used) : (proProfile.credits_document || 0) + (proProfile.credits_complete || 0);
  const totalShares = shares.length;

  const stats = [
    { label: 'Dossiers analysés', value: completedAnalyses.length, icon: FolderOpen, color: '#2a7d9c' },
    { label: 'Ce mois', value: thisMonth.length, icon: Clock, color: '#7c3aed' },
    { label: 'Crédits restants', value: creditsLeft, icon: CreditCard, color: '#16a34a' },
    { label: 'Rapports envoyés', value: totalShares, icon: Send, color: '#d97706' },
  ];

  const lastAnalyses = completedAnalyses.slice(0, 3);
  const lastShares = shares.slice(0, 3);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Bonjour {prenom}</h1>
        {proProfile.pro_company_name && <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{proProfile.pro_company_name}</p>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #edf2f7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pas d'abonnement ? */}
      {!subscription && (
        <div style={{ background: 'linear-gradient(135deg, #0a1f2d, #1a4a5e)', borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Activez votre abonnement</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>Choisissez le plan Starter ou Power pour commencer à analyser.</p>
          </div>
          <Link to="/dashboard/abonnement" style={{ padding: '11px 24px', borderRadius: 10, background: '#fff', color: '#0f2d3d', textDecoration: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
            Voir les offres <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
          </Link>
        </div>
      )}

      {/* Derniers dossiers */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Derniers dossiers</h3>
          <Link to="/dashboard/dossiers" style={{ fontSize: 12, fontWeight: 600, color: '#2a7d9c', textDecoration: 'none' }}>Voir tout →</Link>
        </div>
        {lastAnalyses.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 20 }}>Aucun dossier analysé pour le moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lastAnalyses.map(a => {
              const score = getScore(a.result as Record<string, unknown>);
              const shareCount = shares.filter(s => s.analysis_id === a.id).length;
              return (
                <Link key={a.id} to={`/dashboard/dossier/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', textDecoration: 'none', transition: 'all 0.15s' }}>
                  {score !== null && <ScoreRing score={score} size={38} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.address || a.title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(a.created_at)}</div>
                  </div>
                  {shareCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#2a7d9c', background: '#f0f7fb', padding: '2px 8px', borderRadius: 100 }}>Envoyé {shareCount}×</span>}
                  <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Derniers envois */}
      {lastShares.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 22px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Derniers envois</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lastShares.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#f8fafc' }}>
                <Send size={14} style={{ color: '#2a7d9c', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.recipient_firstname} {s.recipient_name}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{s.recipient_email}</span>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(s.sent_at)}</span>
                {s.opened_at ? (
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 100 }}>Ouvert</span>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: 100, border: '1px solid #e2e8f0' }}>En attente</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MES DOSSIERS (VUE PORTEFEUILLE)
══════════════════════════════════════════ */
function MesDossiersPro({ analyses, shares, onSendReport }: { analyses: ProAnalysis[]; shares: ReportShare[]; onSendReport: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [filterType, setFilterType] = useState<'all' | 'complete' | 'document'>('all');
  const navigate = useNavigate();

  const completed = analyses.filter(a => a.status === 'completed');
  const filtered = completed.filter(a => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (a.address || '').toLowerCase().includes(q) || (a.title || '').toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'score') {
      const sa = getScore(a.result as Record<string, unknown>) || 0;
      const sb = getScore(b.result as Record<string, unknown>) || 0;
      return sb - sa;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 20, flexWrap: 'wrap' as const, gap: 12 }}>
        <Link to="/dashboard/nouvelle-analyse" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          <Plus size={14} /> Nouvelle analyse
        </Link>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une adresse..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value as 'all' | 'complete' | 'document')}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="all">Toutes</option>
          <option value="complete">Complètes</option>
          <option value="document">Simples</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'score')}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="date">Plus récentes</option>
          <option value="score">Meilleur score</option>
        </select>
      </div>

      {/* Liste */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <FolderOpen size={32} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Aucun dossier trouvé.</p>
          </div>
        ) : (
          filtered.map((a, i) => {
            const score = getScore(a.result as Record<string, unknown>);
            const dpe = getDPE(a.result as Record<string, unknown>);
            const shareCount = shares.filter(s => s.analysis_id === a.id).length;
            const dpeStyle = dpe ? DPE_COLORS[dpe] : null;

            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                onClick={() => navigate(`/dashboard/dossier/${a.id}`)}
                onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#fafcfd'}
                onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                {/* Score */}
                {score !== null ? <ScoreRing score={score} size={42} /> : <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>—</div>}

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.address || a.title}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {a.type === 'complete' ? 'Complète' : 'Simple'} · {fmtDate(a.created_at)}
                  </div>
                </div>

                {/* DPE */}
                {dpe && dpeStyle && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: dpeStyle.color, background: dpeStyle.bg, padding: '3px 10px', borderRadius: 8 }}>DPE {dpe}</span>
                )}

                {/* Envois */}
                {shareCount > 0 ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2a7d9c', background: '#f0f7fb', padding: '3px 10px', borderRadius: 100 }}>{shareCount} envoi{shareCount > 1 ? 's' : ''}</span>
                ) : (
                  <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); onSendReport(a.id); }} title="Envoyer au client"
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f7fb', border: '1px solid #d0e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={13} style={{ color: '#2a7d9c' }} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); window.open(`/rapport?id=${a.id}`, '_blank'); }} title="Voir le rapport"
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={13} style={{ color: '#64748b' }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MODAL ENVOI RAPPORT
══════════════════════════════════════════ */
function SendReportModal({ analysisId, analysis, proProfile, onClose, onSent }: {
  analysisId: string; analysis: ProAnalysis | undefined; proProfile: ProProfile; onClose: () => void; onSent: () => void;
}) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientFirstname, setRecipientFirstname] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const address = analysis?.address || analysis?.title || 'Bien immobilier';
  const senderName = proProfile.full_name || '';
  const senderCompany = proProfile.pro_company_name || '';

  // Pré-remplir le message
  useEffect(() => {
    const defaultMsg = `Bonjour,

Veuillez trouver ci-dessous le rapport d'analyse du bien situé ${address}.

Ce rapport détaille l'état du bien, les finances de la copropriété, les diagnostics et les éventuels points de vigilance.

N'hésitez pas à me contacter pour en discuter.

Cordialement,
${senderName}${senderCompany ? '\n' + senderCompany : ''}`;
    setMessage(defaultMsg);
  }, [address, senderName, senderCompany]);

  const handleSend = async () => {
    if (!recipientName || !recipientEmail) { setError('Le nom et l\'email du client sont obligatoires.'); return; }
    setError('');
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: 'send_report',
          analysis_id: analysisId,
          recipient_name: recipientName,
          recipient_firstname: recipientFirstname,
          recipient_email: recipientEmail,
          message: message.replace('[Prénom]', recipientFirstname || recipientName),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSending(false); return; }
      onSent();
      onClose();
    } catch {
      setError('Erreur lors de l\'envoi.');
    }
    setSending(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Envoyer le rapport</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>{address}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, cursor: 'pointer', color: '#94a3b8', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div className="compte-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Nom du client *</label>
            <input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Dupont"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Prénom</label>
            <input value={recipientFirstname} onChange={e => setRecipientFirstname(e.target.value)} placeholder="Jean"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Email du client *</label>
          <input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="jean.dupont@gmail.com" type="email"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit' }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={8}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
        </div>

        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f0f7fb', border: '1px solid #d0e8f0', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#2a7d9c', margin: 0, lineHeight: 1.6 }}>
            Le client recevra un email avec un lien sécurisé vers le rapport. Le lien ne nécessite pas de compte Verimo. Si le client répond au mail, sa réponse arrivera directement sur votre boîte mail.
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSend} disabled={!recipientName || !recipientEmail || sending}
            style={{ flex: 1, padding: '11px', borderRadius: 11, background: (!recipientName || !recipientEmail) ? '#cbd5e1' : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {sending ? 'Envoi...' : <><Send size={14} /> Envoyer</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MON ABONNEMENT
══════════════════════════════════════════ */
function MonAbonnement({ subscription }: { subscription: ProSubscription | null }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const plans = [
    { id: 'decouverte', name: 'Découverte', price: '19,90', completes: 1, simples: 3, popular: false, tagline: 'Pour découvrir Verimo Pro' },
    { id: 'starter', name: 'Starter', price: '49,90', completes: 5, simples: 15, popular: true, tagline: 'Pour un usage régulier' },
    { id: 'power', name: 'Power', price: '89,90', completes: 10, simples: 30, popular: false, tagline: 'Pour un usage soutenu' },
  ];

  const isSubscribed = subscription?.status === 'active';

  // Détecter le retour de Stripe Checkout (?checkout=success ou ?checkout=cancel)
  useEffect(() => {
    const url = new URL(window.location.href);
    const checkout = url.searchParams.get('checkout');
    if (checkout === 'success') {
      setErrorMsg('');
      // Nettoyer l'URL
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
      // Petit reload pour récupérer la subscription mise à jour
      setTimeout(() => window.location.reload(), 500);
    } else if (checkout === 'cancel') {
      setErrorMsg('Paiement annulé. Vous pouvez réessayer quand vous voulez.');
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  async function handleSubscribe(planId: string) {
    setLoading(`subscribe:${planId}`);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Vous devez être connecté');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ mode: 'subscribe', plan: planId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création du checkout');

      if (data.upgraded) {
        // Cas upgrade direct (sans Checkout) → on rafraîchit
        window.location.reload();
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Une erreur est survenue');
      setLoading(null);
    }
  }

  async function handleBuyUnit(unitType: 'complete' | 'document', quantity: number = 1) {
    setLoading(`unit:${unitType}`);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Vous devez être connecté');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ mode: 'buy_unit', unit_type: unitType, quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'subscription_required') {
          setErrorMsg(data.message || 'Les tarifs unitaires sont réservés aux abonnés.');
        } else {
          throw new Error(data.error || 'Erreur lors de l\'achat');
        }
        setLoading(null);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Une erreur est survenue');
      setLoading(null);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Choisissez le plan adapté à votre activité.</p>

      {/* Message d'erreur global */}
      {errorMsg && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* Crédits restants si abonné */}
      {isSubscribed && (
        <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 14, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>Crédits restants ce mois</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                {Math.max(0, (subscription?.credits_complete_total || 0) - (subscription?.credits_complete_used || 0))}
              </span>
              <span style={{ fontSize: 13, color: '#64748b', marginLeft: 6 }}>/ {subscription?.credits_complete_total || 0} complètes</span>
            </div>
            <div>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                {Math.max(0, (subscription?.credits_simple_total || 0) - (subscription?.credits_simple_used || 0))}
              </span>
              <span style={{ fontSize: 13, color: '#64748b', marginLeft: 6 }}>/ {subscription?.credits_simple_total || 0} simples</span>
            </div>
          </div>
          {subscription?.current_period_end && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>Renouvellement le {fmtDate(subscription.current_period_end)}</div>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {plans.map(plan => {
          const isActive = subscription?.plan === plan.id && subscription?.status === 'active';
          const btnLoading = loading === `subscribe:${plan.id}`;
          return (
            <div key={plan.id} style={{
              borderRadius: 18, padding: 22, position: 'relative',
              background: '#fff', border: isActive ? '2px solid #2a7d9c' : plan.popular ? '2px solid #7dd3fc' : '1.5px solid #edf2f7',
              boxShadow: plan.popular ? '0 8px 32px rgba(42,125,156,0.1)' : 'none',
            }}>
              {plan.popular && !isActive && (
                <span style={{ position: 'absolute', top: -10, right: 16, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 100 }}>Recommandé</span>
              )}
              {isActive && (
                <span style={{ position: 'absolute', top: -10, right: 16, background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 100 }}>Actif</span>
              )}

              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{plan.name}</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 14px 0', minHeight: 16 }}>{plan.tagline}</p>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#0f172a' }}>{plan.price}€</span>
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>HT / mois</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#374151' }}><strong>{plan.completes}</strong> analyse{plan.completes > 1 ? 's' : ''} complète{plan.completes > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#374151' }}><strong>{plan.simples}</strong> analyse{plan.simples > 1 ? 's' : ''} simple{plan.simples > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#374151' }}>Dashboard pro + branding</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#374151' }}>Envoi de rapports clients</span>
                </div>
              </div>

              {isActive ? (
                <div style={{ padding: '11px', borderRadius: 11, background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: '#16a34a' }}>
                  Plan actif
                </div>
              ) : (
                <button
                  disabled={btnLoading}
                  onClick={() => handleSubscribe(plan.id)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 11, border: 'none',
                    cursor: btnLoading ? 'wait' : 'pointer',
                    background: plan.popular ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : '#0f172a',
                    color: '#fff', fontSize: 13.5, fontWeight: 700, opacity: btnLoading ? 0.6 : 1,
                  }}>
                  {btnLoading ? 'Redirection…' : (subscription ? 'Changer pour ce plan' : 'Choisir ce plan')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Achats unitaires */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 22px', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Acheter à l'unité</h3>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          {isSubscribed
            ? 'Achats supplémentaires en complément de votre abonnement.'
            : 'Tarifs préférentiels réservés aux abonnés Verimo Pro.'}
        </p>
        {!isSubscribed && (
          <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 12.5, color: '#92400e' }}>
            ⚠️ Pour acheter à ces tarifs, vous devez souscrire un abonnement Verimo Pro (ci-dessus).
          </div>
        )}
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Analyse complète */}
          <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', textAlign: 'center', opacity: isSubscribed ? 1 : 0.7 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>9,90€ <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>HT</span></div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 10 }}>Analyse complète</div>
            <button
              disabled={!isSubscribed || loading === 'unit:complete'}
              onClick={() => handleBuyUnit('complete', 1)}
              title={!isSubscribed ? 'Abonnement requis' : ''}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: isSubscribed ? '#0f172a' : '#cbd5e1',
                color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
                cursor: isSubscribed ? (loading === 'unit:complete' ? 'wait' : 'pointer') : 'not-allowed',
                opacity: loading === 'unit:complete' ? 0.6 : 1,
              }}>
              {loading === 'unit:complete' ? 'Redirection…' : 'Acheter'}
            </button>
          </div>
          {/* Analyse simple */}
          <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', textAlign: 'center', opacity: isSubscribed ? 1 : 0.7 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>2,90€ <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>HT</span></div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 10 }}>Analyse simple</div>
            <button
              disabled={!isSubscribed || loading === 'unit:document'}
              onClick={() => handleBuyUnit('document', 1)}
              title={!isSubscribed ? 'Abonnement requis' : ''}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: isSubscribed ? '#0f172a' : '#cbd5e1',
                color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
                cursor: isSubscribed ? (loading === 'unit:document' ? 'wait' : 'pointer') : 'not-allowed',
                opacity: loading === 'unit:document' ? 0.6 : 1,
              }}>
              {loading === 'unit:document' ? 'Redirection…' : 'Acheter'}
            </button>
          </div>
        </div>
      </div>

      {/* Agences */}
      <div style={{ background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', borderRadius: 16, padding: '20px 22px', border: '1px solid #d0e8f0', textAlign: 'center' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f2d3d', marginBottom: 6 }}>Volumes importants ou besoins spécifiques ?</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Agences, cabinets, équipes : contactez-nous pour une offre sur mesure.</p>
        <Link to="/contact-pro" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: '#0f2d3d', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          Nous contacter <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MON COMPTE PRO
══════════════════════════════════════════ */
function ComptePro({ proProfile, onUpdate }: { proProfile: ProProfile; onUpdate: () => void }) {
  const isLocked = proProfile.pro_onboarding_done === true;
  const [form, setForm] = useState({
    full_name: proProfile.full_name || '',
    telephone: proProfile.telephone || '',
    pro_company_name: proProfile.pro_company_name || '',
    pro_company_address: proProfile.pro_company_address || '',
    pro_siret: proProfile.pro_siret || '',
    pro_ville: proProfile.pro_ville || '',
    pro_network: proProfile.pro_network || '',
    pro_contact_email: proProfile.pro_contact_email || '',
    pro_contact_phone: proProfile.pro_contact_phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showModifRequest, setShowModifRequest] = useState(false);
  const [modifMessage, setModifMessage] = useState('');
  const [modifSending, setModifSending] = useState(false);
  const [modifSent, setModifSent] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(proProfile.pro_logo_url || null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    // Si pas encore verrouillé, demander confirmation
    if (!isLocked && !showLockConfirm) {
      setShowLockConfirm(true);
      return;
    }

    setSaving(true);
    let logoUrl = proProfile.pro_logo_url;

    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `${proProfile.id}/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('pro-logos').upload(path, logoFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('pro-logos').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }
    }

    const updateData: Record<string, unknown> = {
      full_name: form.full_name,
      telephone: form.telephone,
      pro_contact_email: form.pro_contact_email,
      pro_contact_phone: form.pro_contact_phone,
      pro_logo_url: logoUrl,
    };

    // Si pas encore verrouillé, sauvegarder aussi les champs pro et verrouiller
    if (!isLocked) {
      updateData.pro_company_name = form.pro_company_name;
      updateData.pro_company_address = form.pro_company_address;
      updateData.pro_siret = form.pro_siret;
      updateData.pro_ville = form.pro_ville;
      updateData.pro_network = form.pro_network;
      updateData.pro_onboarding_done = true;
    }

    const { error } = await supabase.from('profiles').update(updateData).eq('id', proProfile.id);

    setSaving(false);
    setShowLockConfirm(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onUpdate();
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, background: '#f8fafc', fontFamily: 'inherit' };
  const lockedInputStyle = { ...inputStyle, background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' as const };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Informations personnelles (toujours modifiable) */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 24px', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Informations personnelles</h3>
        <div className="compte-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nom complet</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Identité professionnelle */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Mon identité professionnelle</h3>
          {isLocked && <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '3px 10px', borderRadius: 100 }}>🔒 Verrouillé</span>}
        </div>
        {isLocked && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              Ces informations ne sont plus modifiables directement.
            </p>
            <button onClick={() => { setModifMessage(''); setModifSent(false); setShowModifRequest(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#2a7d9c', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
              Demander une modification
            </button>
          </div>
        )}
        {!isLocked && (
          <p style={{ fontSize: 12, color: '#d97706', marginBottom: 16, background: '#fffbeb', padding: '8px 12px', borderRadius: 8, border: '1px solid #fde68a' }}>
            Vérifiez bien ces informations avant d'enregistrer. Une fois validées, elles ne seront plus modifiables.
          </p>
        )}

        {/* Logo (toujours modifiable) */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'contain', background: '#f8fafc', border: '1px solid #edf2f7' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 12, background: '#f8fafc', border: '1.5px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={20} style={{ color: '#cbd5e1' }} />
              </div>
            )}
            <div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                <Upload size={13} /> Choisir un fichier
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>PNG ou JPG, max 2 Mo. Affiché sur les rapports envoyés.</p>
            </div>
          </div>
        </div>

        <div className="compte-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Nom commercial</label>
            <input value={form.pro_company_name} onChange={e => !isLocked && setForm(f => ({ ...f, pro_company_name: e.target.value }))} placeholder="Dupont Immobilier" style={isLocked ? lockedInputStyle : inputStyle} readOnly={isLocked} />
          </div>
          <div>
            <label style={labelStyle}>Réseau</label>
            <input value={form.pro_network} onChange={e => !isLocked && setForm(f => ({ ...f, pro_network: e.target.value }))} placeholder="IAD, Safti, Indépendant..." style={isLocked ? lockedInputStyle : inputStyle} readOnly={isLocked} />
          </div>
        </div>
        <div className="compte-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>SIRET</label>
            <input value={form.pro_siret} onChange={e => !isLocked && setForm(f => ({ ...f, pro_siret: e.target.value }))} style={isLocked ? lockedInputStyle : inputStyle} readOnly={isLocked} />
          </div>
          <div>
            <label style={labelStyle}>Ville / Zone d'activité</label>
            <input value={form.pro_ville} onChange={e => !isLocked && setForm(f => ({ ...f, pro_ville: e.target.value }))} style={isLocked ? lockedInputStyle : inputStyle} readOnly={isLocked} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Adresse professionnelle</label>
          <input value={form.pro_company_address} onChange={e => !isLocked && setForm(f => ({ ...f, pro_company_address: e.target.value }))} style={isLocked ? lockedInputStyle : inputStyle} readOnly={isLocked} />
        </div>
      </div>

      {/* Coordonnées client (toujours modifiable) */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 24px', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Coordonnées visibles par vos clients</h3>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Ces informations apparaissent sur les rapports envoyés. Si le client répond au mail, sa réponse arrivera sur l'email de contact ci-dessous.</p>
        <div className="compte-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Email de contact</label>
            <input value={form.pro_contact_email} onChange={e => setForm(f => ({ ...f, pro_contact_email: e.target.value }))} placeholder={proProfile.email || ''} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Téléphone de contact</label>
            <input value={form.pro_contact_phone} onChange={e => setForm(f => ({ ...f, pro_contact_phone: e.target.value }))} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Confirmation de verrouillage */}
      {showLockConfirm && (
        <div style={{ background: '#fffbeb', borderRadius: 14, border: '1.5px solid #fde68a', padding: '18px 20px', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Confirmez vos informations professionnelles</p>
          <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6, marginBottom: 14 }}>
            Une fois enregistrées, les informations suivantes ne seront plus modifiables sans passer par le support : nom commercial, réseau, SIRET, ville et adresse professionnelle.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowLockConfirm(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#fff', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Modifier</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#d97706', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Enregistrement...' : 'Confirmer et verrouiller'}
            </button>
          </div>
        </div>
      )}

      {/* Modal demande de modification */}
      {showModifRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Demander une modification</h3>
              <button onClick={() => setShowModifRequest(false)} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, cursor: 'pointer', color: '#94a3b8', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            {modifSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Demande envoyée</h4>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>Notre équipe reviendra vers vous sous 24 heures.</p>
                <button onClick={() => setShowModifRequest(false)} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: '#0f172a', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0f7fb', border: '1px solid #d0e8f0', marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: '#2a7d9c', margin: 0, lineHeight: 1.6 }}>
                    Pour des raisons de sécurité, toute modification de votre identité professionnelle est vérifiée par notre équipe avant validation. Décrivez les changements souhaités ci-dessous.
                  </p>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Objet</label>
                  <input value="Demande de modification — Identité professionnelle" readOnly
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, background: '#f1f5f9', color: '#94a3b8', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Décrivez les modifications souhaitées</label>
                  <textarea value={modifMessage} onChange={e => setModifMessage(e.target.value)} rows={4}
                    placeholder="Ex : Je souhaite modifier mon nom commercial de 'RT Conseils' à 'RT Immobilier Conseils' suite à un changement de raison sociale..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowModifRequest(false)} style={{ flex: 1, padding: '11px', borderRadius: 11, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                  <button onClick={async () => {
                    if (!modifMessage.trim()) return;
                    setModifSending(true);
                    await supabase.from('contact_messages').insert({
                      name: proProfile.full_name || 'Client Pro',
                      email: proProfile.email || '',
                      subject: 'Demande de modification — Identité professionnelle',
                      message: `[PRO — ${proProfile.pro_company_name || ''}]\n\nClient : ${proProfile.full_name} (${proProfile.email})\nTél : ${proProfile.telephone || 'non renseigné'}\nProfil : ${proProfile.pro_profile_type || ''}\n\n--- Modifications demandées ---\n${modifMessage}`,
                      read: false,
                    });
                    setModifSending(false);
                    setModifSent(true);
                  }} disabled={!modifMessage.trim() || modifSending}
                    style={{ flex: 1, padding: '11px', borderRadius: 11, background: !modifMessage.trim() ? '#cbd5e1' : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: modifSending ? 0.7 : 1 }}>
                    {modifSending ? 'Envoi...' : 'Soumettre la demande'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Save */}
      {!showLockConfirm && (
        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 800, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {saving ? 'Enregistrement...' : saved ? '✓ Enregistré !' : isLocked ? 'Enregistrer les modifications' : 'Vérifier et enregistrer'}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   DOSSIER DETAIL
══════════════════════════════════════════ */
function DossierDetail({ analysisId, analyses, shares, onSendReport, onBack }: {
  analysisId: string; analyses: ProAnalysis[]; shares: ReportShare[]; onSendReport: (id: string) => void; onBack: () => void;
}) {
  const analysis = analyses.find(a => a.id === analysisId);
  const dossierShares = shares.filter(s => s.analysis_id === analysisId);

  if (!analysis) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Dossier introuvable.</div>;

  const score = getScore(analysis.result as Record<string, unknown>);
  const dpe = getDPE(analysis.result as Record<string, unknown>);
  const result = analysis.result as Record<string, unknown> | undefined;
  const scoreNiveau = result?.score_niveau as string | undefined;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 16, padding: 0 }}>
        ← Retour aux dossiers
      </button>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {score !== null && <ScoreRing score={score} size={64} />}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{analysis.address || analysis.title}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
              {scoreNiveau && <span style={{ fontSize: 12, fontWeight: 600, color: '#2a7d9c', background: '#f0f7fb', padding: '2px 10px', borderRadius: 100 }}>{scoreNiveau}</span>}
              {dpe && <span style={{ fontSize: 12, fontWeight: 700, color: DPE_COLORS[dpe]?.color, background: DPE_COLORS[dpe]?.bg, padding: '2px 10px', borderRadius: 8 }}>DPE {dpe}</span>}
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{analysis.type === 'complete' ? 'Complète' : 'Simple'} · {fmtDate(analysis.created_at)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => onSendReport(analysis.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Send size={14} /> Envoyer au client
          </button>
          <a href={`/rapport?id=${analysis.id}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#374151', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            <Eye size={14} /> Voir le rapport complet
          </a>
        </div>
      </div>

      {/* Historique envois */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 24px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Historique des envois</h3>
        {dossierShares.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 16 }}>Aucun envoi pour ce dossier.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dossierShares.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <Mail size={14} style={{ color: '#2a7d9c', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.recipient_firstname} {s.recipient_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.recipient_email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(s.sent_at)}</div>
                  {s.opened_at ? (
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a' }}>Ouvert le {fmtDate(s.opened_at)}</span>
                  ) : (
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>En attente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   DASHBOARD PRO — EXPORT
══════════════════════════════════════════ */
export default function DashboardProPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [proProfile, setProProfile] = useState<ProProfile | null>(null);
  const [subscription, setSubscription] = useState<ProSubscription | null>(null);
  const [analyses, setAnalyses] = useState<ProAnalysis[]>([]);
  const [shares, setShares] = useState<ReportShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendReportId, setSendReportId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/connexion'); return; }

    // Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || profile.role !== 'pro') { navigate('/dashboard'); return; }
    setProProfile({ ...profile, email: user.email } as ProProfile);

    // Subscription
    const { data: sub } = await supabase.from('pro_subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle();
    setSubscription(sub as ProSubscription | null);

    // Analyses
    const { data: anal } = await supabase.from('analyses').select('id, type, status, title, address, created_at, result').eq('user_id', user.id).order('created_at', { ascending: false });
    setAnalyses((anal || []) as ProAnalysis[]);

    // Shares
    const { data: sh } = await supabase.from('report_shares').select('*').eq('sender_id', user.id).order('sent_at', { ascending: false });
    setShares((sh || []) as ReportShare[]);

    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2a7d9c', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Chargement de votre espace pro…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!proProfile) return null;

  // Routing
  const path = location.pathname;
  const dossierMatch = path.match(/^\/dashboard\/dossier\/(.+)$/);
  const title = dossierMatch ? 'Détail du dossier'
    : proNavItems.find(i => i.to === path)?.label || 'Mon espace pro';

  const renderContent = () => {
    if (dossierMatch) {
      return <DossierDetail analysisId={dossierMatch[1]} analyses={analyses} shares={shares} onSendReport={setSendReportId} onBack={() => navigate('/dashboard/dossiers')} />;
    }
    if (path === '/dashboard/dossiers') return <MesDossiersPro analyses={analyses} shares={shares} onSendReport={setSendReportId} />;
    if (path === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse />;
    if (path === '/dashboard/compare') return <Compare />;
    if (path === '/dashboard/abonnement') return <MonAbonnement subscription={subscription} />;
    if (path === '/dashboard/compte') return <ComptePro proProfile={proProfile} onUpdate={loadData} />;
    if (path === '/dashboard/aide') return <Aide />;
    if (path === '/dashboard/support') return <Support />;
    return <HomeViewPro proProfile={proProfile} subscription={subscription} analyses={analyses} shares={shares} />;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Sidebar desktop */}
      <div className="desktop-sidebar" style={{ width: 260, flexShrink: 0 }}>
        <div style={{ position: 'fixed', top: 0, left: 0, width: 260, height: '100vh', zIndex: 50, overflowY: 'auto' }}>
          <SidebarPro subscription={subscription} />
        </div>
      </div>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
            <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.45)' }} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260 }}>
              <SidebarPro subscription={subscription} onClose={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopbarPro onMenuClick={() => setMobileOpen(true)} title={title} proProfile={proProfile} />
        <main className="dashboard-main" style={{ flex: 1, padding: '28px 24px', overflowX: 'hidden' }}>
          {renderContent()}
        </main>
      </div>

      {/* Modal envoi rapport */}
      <AnimatePresence>
        {sendReportId && (
          <SendReportModal
            analysisId={sendReportId}
            analysis={analyses.find(a => a.id === sendReportId)}
            proProfile={proProfile}
            onClose={() => setSendReportId(null)}
            onSent={() => { setToast('Rapport envoyé !'); loadData(); setTimeout(() => setToast(''), 3000); }}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: 'fixed', bottom: 24, right: 24, background: '#0f2d3d', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .topbar-cta { display: none !important; }
          header { padding: 0 14px !important; height: 62px !important; gap: 10px !important; }
          .mobile-menu-btn svg { width: 24px !important; height: 24px !important; }
          .topbar-title { font-size: 15px !important; font-weight: 800 !important; }
          .dashboard-main { padding: 16px 12px !important; }
          .dashboard-main > div,
          .dashboard-main > section {
            max-width: 100% !important;
            width: 100% !important;
          }
          .compte-grid { grid-template-columns: 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

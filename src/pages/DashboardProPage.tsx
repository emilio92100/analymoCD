import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, Plus, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, CreditCard, BookOpen,
  Send, Search, Clock, Bell,
  CheckCircle, Upload, Mail,
  ChevronRight, ArrowRight,
  MapPin, Trash2, AlertTriangle, FileText, Pencil,
  UserPlus, UserCheck, Folder,
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

type ProCredits = {
  abo_complete_remaining: number;
  abo_document_remaining: number;
  unit_complete_remaining: number;
  unit_document_remaining: number;
  total_complete: number;
  total_document: number;
};

type ProAnalysis = {
  id: string;
  type: string;
  status: string;
  title: string;
  address?: string;
  created_at: string;
  result?: Record<string, unknown>;
  folder_id?: string | null;
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

type ProFolder = {
  id: string;
  user_id: string;
  name: string;
  property_address?: string | null;
  property_postal_code?: string | null;
  property_city?: string | null;
  internal_note?: string | null;
  created_at: string;
  updated_at: string;
  // Stats chargées séparément
  analyses_count?: number;
  sellers_count?: number;
  buyers_count?: number;
  last_analysis_date?: string | null;
};

type ProFolderSeller = {
  id: string;
  folder_id: string;
  civility?: string | null;
  first_name?: string | null;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  created_at: string;
};

type BuyerStatus = 'candidat' | 'serieux' | 'compromis' | 'abandonne';

type ProFolderBuyer = {
  id: string;
  folder_id: string;
  civility?: string | null;
  first_name?: string | null;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  status: BuyerStatus;
  note?: string | null;
  created_at: string;
};

const BUYER_STATUS_CONFIG: Record<BuyerStatus, { label: string; bg: string; color: string; border: string }> = {
  candidat: { label: 'Candidat', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  serieux: { label: 'Sérieux', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  compromis: { label: 'Compromis signé', bg: '#dcfce7', color: '#166534', border: '#86efac' },
  abandonne: { label: 'Abandonné', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const getScore = (r: Record<string, unknown> | undefined) => r && typeof r === 'object' && 'score' in r ? (r as { score: number }).score : null;
const getScoreColor = (s: number) => s >= 17 ? '#16a34a' : s >= 14 ? '#2a7d9c' : s >= 10 ? '#d97706' : s >= 7 ? '#ea580c' : '#dc2626';

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
function SidebarPro({ subscription, proCredits, onClose }: { subscription: ProSubscription | null; proCredits: ProCredits | null; onClose?: () => void }) {
  const location = useLocation();

  const BG = '#0a1f2d';
  const ACCENT = '#7dd3fc';
  const TEXT = 'rgba(255,255,255,0.75)';
  const TEXT_ACTIVE = '#ffffff';
  const MUTED = 'rgba(255,255,255,0.25)';

  const creditsComplete = proCredits?.total_complete ?? 0;
  const creditsSimple = proCredits?.total_document ?? 0;

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
            Plan {subscription.plan === 'decouverte' ? 'Découverte' : subscription.plan === 'starter' ? 'Starter' : subscription.plan === 'power' ? 'Power' : subscription.plan} · Renouvellement {subscription.current_period_end ? fmtDate(subscription.current_period_end) : '—'}
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
function TopbarPro({ onMenuClick, title, proProfile, unreadCount, notifications, onMarkAllRead, onClickNotification }: {
  onMenuClick: () => void; title: string; proProfile: ProProfile | null;
  unreadCount?: number; notifications?: { id: string; analysisId: string; title: string; createdAt: string; read: boolean }[];
  onMarkAllRead?: () => void; onClickNotification?: (analysisId: string) => void;
}) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const name = proProfile?.full_name?.split(' ')[0] || 'Pro';
  const email = proProfile?.email || '';
  const company = proProfile?.pro_company_name || '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    if (dropdownOpen || bellOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, bellOpen]);

  const handleLogout = () => { localStorage.clear(); supabase.auth.signOut(); window.location.replace('/'); };

  return (
    <header style={{ height: 68, background: '#fff', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, position: 'sticky', top: 0, zIndex: 40, flexShrink: 0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f2d3d', padding: 4, display: 'none' }}><Menu size={20} /></button>
      <p className="topbar-title" style={{ flex: 1, fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</p>

      {/* Cloche notifications */}
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button onClick={() => { setBellOpen(!bellOpen); if (!bellOpen && onMarkAllRead) onMarkAllRead(); }}
          style={{ width: 36, height: 36, borderRadius: 9, background: bellOpen ? '#f0f7fb' : '#f8fafc', border: `1px solid ${bellOpen ? '#c7dde8' : '#edf2f7'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', position: 'relative', transition: 'all 0.15s' }}>
          <Bell size={16} />
          {(unreadCount || 0) > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 100,
              background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              border: '2px solid #fff',
            }}>{unreadCount}</span>
          )}
        </button>
        {bellOpen && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', boxShadow: '0 16px 48px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Notifications</span>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {(!notifications || notifications.length === 0) ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <Bell size={20} style={{ color: '#e2e8f0', marginBottom: 8 }} />
                  <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0 }}>Aucune notification</p>
                </div>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <button key={n.id}
                    onClick={() => { setBellOpen(false); if (onClickNotification) onClickNotification(n.analysisId); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: n.read ? '#fff' : '#f0f7fb', border: 'none', borderBottom: '1px solid #f0f5f9',
                      cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.1s',
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = n.read ? '#fff' : '#f0f7fb'; }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={15} style={{ color: '#16a34a' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: n.read ? 500 : 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        Rapport prêt
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{n.title}</div>
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{fmtDate(n.createdAt)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

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
function HomeViewPro({ proProfile, subscription, proCredits, analyses, shares }: { proProfile: ProProfile; subscription: ProSubscription | null; proCredits: ProCredits | null; analyses: ProAnalysis[]; shares: ReportShare[] }) {
  const prenom = proProfile.full_name?.split(' ')[0] || 'Pro';
  const completedAnalyses = analyses.filter(a => a.status === 'completed');
  const thisMonth = analyses.filter(a => { const d = new Date(a.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const creditsLeft = (proCredits?.total_complete ?? 0) + (proCredits?.total_document ?? 0);
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

      {/* Pas d'abonnement ? Bandeau remonté en haut */}
      {!subscription && (
        <div style={{ background: 'linear-gradient(135deg, #0a1f2d, #1a4a5e)', borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Activez votre abonnement</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>Choisissez Découverte, Starter ou Power pour commencer à analyser vos dossiers.</p>
          </div>
          <Link to="/dashboard/abonnement" style={{ padding: '11px 24px', borderRadius: 10, background: '#fff', color: '#0f2d3d', textDecoration: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
            Voir les offres <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
          </Link>
        </div>
      )}

      {/* Abonné mais plus de crédits ? Bandeau invitation upgrade ou achat unitaire */}
      {subscription && creditsLeft === 0 && (
        <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: 16, padding: '18px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const, border: '1px solid #fcd34d' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>Vos crédits du mois sont épuisés</h3>
            <p style={{ fontSize: 12.5, color: '#92400e', margin: 0 }}>Passez à un plan supérieur ou achetez à l'unité au tarif abonné.</p>
          </div>
          <Link to="/dashboard/abonnement" style={{ padding: '10px 20px', borderRadius: 10, background: '#92400e', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
            Gérer <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
          </Link>
        </div>
      )}

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
function MesDossiersPro() {
  const [folders, setFolders] = useState<ProFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<ProFolder | null>(null);
  const navigate = useNavigate();

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Charge les dossiers
      const { data: foldersData, error } = await supabase
        .from('pro_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement dossiers:', error);
        setLoading(false);
        return;
      }

      // Charge les stats pour chaque dossier (analyses, vendeurs, acheteurs)
      // On fait 3 count en parallèle par dossier (RLS s'applique côté user, donc pas de souci de droits)
      const foldersWithStats = await Promise.all((foldersData || []).map(async (f) => {
        try {
          const [analysesRes, sellersRes, buyersRes] = await Promise.all([
            supabase.from('analyses').select('id', { count: 'exact', head: true }).eq('folder_id', f.id),
            supabase.from('pro_folder_sellers').select('id', { count: 'exact', head: true }).eq('folder_id', f.id),
            supabase.from('pro_folder_buyers').select('id', { count: 'exact', head: true }).eq('folder_id', f.id),
          ]);
          return {
            ...f,
            analyses_count: analysesRes.count || 0,
            sellers_count: sellersRes.count || 0,
            buyers_count: buyersRes.count || 0,
          };
        } catch {
          return { ...f, analyses_count: 0, sellers_count: 0, buyers_count: 0 };
        }
      }));

      setFolders(foldersWithStats);
    } catch (e) {
      console.error('Erreur:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFolders(); }, [loadFolders]);

  const filtered = folders.filter(f => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.property_address || '').toLowerCase().includes(q) ||
      (f.property_city || '').toLowerCase().includes(q)
    );
  });

  async function handleDelete(folder: ProFolder) {
    try {
      const { error } = await supabase.from('pro_folders').delete().eq('id', folder.id);
      if (error) throw error;
      setFolderToDelete(null);
      await loadFolders();
    } catch (e: any) {
      alert('Erreur lors de la suppression : ' + (e.message || 'inconnue'));
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header avec bouton Créer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' as const, gap: 12 }}>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          {folders.length === 0 ? 'Organisez vos analyses par dossier (un dossier = un bien).' : `${folders.length} dossier${folders.length > 1 ? 's' : ''}`}
        </p>
        <button onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <Plus size={14} /> Créer un dossier
        </button>
      </div>

      {/* Search */}
      {folders.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un dossier..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' }} />
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #edf2f7' }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Chargement…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #edf2f7' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Folder size={28} style={{ color: '#2a7d9c' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            {search ? 'Aucun dossier trouvé' : 'Aucun dossier pour le moment'}
          </h3>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px 0', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
            {search ? "Essayez avec d'autres mots-clés." : "Créez votre premier dossier pour organiser vos analyses par bien."}
          </p>
          {!search && (
            <button onClick={() => setShowCreateModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              <Plus size={14} /> Créer mon premier dossier
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map((f) => (
            <FolderCard key={f.id} folder={f}
              onClick={() => navigate(`/dashboard/dossier/${f.id}`)}
              onDelete={() => setFolderToDelete(f)} />
          ))}
        </div>
      )}

      {/* Modale création */}
      <AnimatePresence>
        {showCreateModal && (
          <ModalCreateFolder
            onClose={() => setShowCreateModal(false)}
            onCreated={(folder) => {
              setShowCreateModal(false);
              loadFolders();
              // Naviguer vers le détail du dossier créé
              setTimeout(() => navigate(`/dashboard/dossier/${folder.id}`), 100);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modale suppression */}
      <AnimatePresence>
        {folderToDelete && (
          <ModalDeleteFolder
            folder={folderToDelete}
            onClose={() => setFolderToDelete(null)}
            onConfirm={() => handleDelete(folderToDelete)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   FOLDER CARD — Carte d'un dossier dans la liste
══════════════════════════════════════════ */
function FolderCard({ folder, onClick, onDelete }: { folder: ProFolder; onClick: () => void; onDelete: () => void }) {
  const hasAddress = folder.property_address || folder.property_city;
  const stats = [
    { label: folder.analyses_count === 1 ? 'analyse' : 'analyses', value: folder.analyses_count || 0, color: '#2a7d9c' },
    { label: folder.sellers_count === 1 ? 'vendeur' : 'vendeurs', value: folder.sellers_count || 0, color: '#7c3aed' },
    { label: folder.buyers_count === 1 ? 'acheteur' : 'acheteurs', value: folder.buyers_count || 0, color: '#16a34a' },
  ];
  return (
    <div onClick={onClick}
      style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: 18, cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
      onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.boxShadow = '0 8px 24px rgba(42,125,156,0.08)'; el.style.transform = 'translateY(-2px)'; }}
      onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)'; }}>

      {/* Bouton supprimer (apparait au hover) */}
      <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Supprimer ce dossier"
        className="folder-delete-btn"
        style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 7, background: '#fef2f2', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}>
        <Trash2 size={13} style={{ color: '#dc2626' }} />
      </button>

      <style>{`
        div:hover > .folder-delete-btn { opacity: 1 !important; }
      `}</style>

      {/* Icône + Nom */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Folder size={18} style={{ color: '#2a7d9c' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 30 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {folder.name}
          </h3>
          {hasAddress && (
            <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              <MapPin size={11} style={{ flexShrink: 0, color: '#94a3b8' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {[folder.property_address, folder.property_city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: s.value > 0 ? s.color : '#94a3b8' }}>{s.value}</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Date de dernière modif */}
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
        Modifié le {fmtDate(folder.updated_at)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MODAL : CRÉATION DOSSIER
══════════════════════════════════════════ */
function ModalCreateFolder({ onClose, onCreated }: { onClose: () => void; onCreated: (folder: ProFolder) => void }) {
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [name, setName] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [nameTouched, setNameTouched] = useState(false); // si l'utilisateur a manuellement modifié le nom
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Autocomplétion adresse via API Adresse Etalab
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ label: string; postcode: string; city: string }>>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const lastPostalCodeQueriedRef = useRef<string>('');
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-génération du nom du dossier
  useEffect(() => {
    if (nameTouched) return; // ne pas écraser si l'utilisateur a modifié manuellement
    const parts = [];
    if (address.trim()) parts.push(address.trim());
    if (city.trim()) parts.push(city.trim());
    setName(parts.join(', '));
  }, [address, city, nameTouched]);

  // Auto-complétion code postal → ville (API gouv.fr)
  // ✨ Fix : reset la ville à chaque changement de CP, pas juste si elle est vide
  useEffect(() => {
    const cp = postalCode.trim();
    if (cp.length !== 5) {
      setCityOptions([]);
      // Si le CP devient invalide, on reset la ville aussi (sauf si l'user l'a modifié manuellement)
      if (cp.length === 0 && lastPostalCodeQueriedRef.current) {
        setCity('');
        lastPostalCodeQueriedRef.current = '';
      }
      return;
    }
    // Si le CP a changé depuis la dernière requête, on reset l'ancienne ville
    if (lastPostalCodeQueriedRef.current && lastPostalCodeQueriedRef.current !== cp) {
      setCity('');
    }
    lastPostalCodeQueriedRef.current = cp;
    setCityLoading(true);
    fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom&format=json&limit=10`)
      .then(r => r.json())
      .then((data: { nom: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const cities = data.map(c => c.nom);
          setCityOptions(cities);
          // Si une seule ville trouvée → auto-remplit (même si city avait une ancienne valeur, on l'écrase)
          if (cities.length === 1) setCity(cities[0]);
        } else {
          setCityOptions([]);
        }
      })
      .catch(() => setCityOptions([]))
      .finally(() => setCityLoading(false));
  }, [postalCode]);

  // Autocomplétion adresse via API Etalab (api-adresse.data.gouv.fr)
  useEffect(() => {
    // Annule la requête précédente si nouvelle frappe
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);

    const q = address.trim();
    if (q.length < 4) {
      setAddressSuggestions([]);
      return;
    }

    // Debounce 300ms pour ne pas spammer l'API
    addressDebounceRef.current = setTimeout(() => {
      setAddressLoading(true);
      fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`)
        .then(r => r.json())
        .then((data: any) => {
          if (data?.features && Array.isArray(data.features)) {
            const suggestions = data.features
              .map((f: any) => ({
                label: f.properties?.label || '',
                postcode: f.properties?.postcode || '',
                city: f.properties?.city || '',
              }))
              .filter((s: any) => s.label);
            setAddressSuggestions(suggestions);
          } else {
            setAddressSuggestions([]);
          }
        })
        .catch(() => setAddressSuggestions([]))
        .finally(() => setAddressLoading(false));
    }, 300);

    return () => {
      if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    };
  }, [address]);

  // ESC pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function selectAddressSuggestion(s: { label: string; postcode: string; city: string }) {
    // On extrait juste la partie "numéro + rue" de l'adresse complète (avant la virgule)
    const streetOnly = s.label.split(',')[0].trim();
    setAddress(streetOnly);
    if (s.postcode) setPostalCode(s.postcode);
    if (s.city) setCity(s.city);
    setAddressSuggestions([]);
    setShowAddressDropdown(false);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setErrorMsg('Le nom du dossier est obligatoire.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté');

      const { data, error } = await supabase
        .from('pro_folders')
        .insert({
          user_id: user.id,
          name: name.trim(),
          property_address: address.trim() || null,
          property_postal_code: postalCode.trim() || null,
          property_city: city.trim() || null,
          internal_note: internalNote.trim() || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      onCreated(data as ProFolder);
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de la création du dossier.');
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      // ✨ Fix : pas de fermeture au clic backdrop (l'utilisateur perdrait son travail)
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(15,45,61,0.35)' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Folder size={18} style={{ color: '#2a7d9c' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Nouveau dossier</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>Organisez vos analyses par bien immobilier</p>
            </div>
          </div>
          <button onClick={onClose} title="Fermer"
            style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={15} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 8px' }}>

          {/* Adresse + autocomplétion */}
          <Field label="Adresse du bien" optional icon={MapPin}>
            <div style={{ position: 'relative' }}>
              <input value={address}
                onChange={e => { setAddress(e.target.value); setShowAddressDropdown(true); }}
                onFocus={() => { setAddressFocused(true); setShowAddressDropdown(true); }}
                onBlur={() => {
                  setAddressFocused(false);
                  // Délai pour laisser le clic sur une suggestion fonctionner
                  setTimeout(() => setShowAddressDropdown(false), 150);
                }}
                placeholder="Commencez à taper… (ex: 12 rue de Rivoli)"
                autoComplete="off"
                style={inputStyle} />

              {/* Dropdown suggestions */}
              {showAddressDropdown && addressFocused && (addressSuggestions.length > 0 || addressLoading) && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #edf2f7', borderRadius: 10, boxShadow: '0 12px 32px rgba(15,45,61,0.12)', zIndex: 10, maxHeight: 240, overflowY: 'auto' as const }}>
                  {addressLoading && addressSuggestions.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' as const }}>Recherche d'adresses…</div>
                  ) : (
                    addressSuggestions.map((s, i) => (
                      <button key={i}
                        onMouseDown={(e) => { e.preventDefault(); selectAddressSuggestion(s); }}
                        style={{
                          width: '100%', textAlign: 'left' as const, padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: i < addressSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', fontSize: 13, color: '#0f172a', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                        onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                        onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <MapPin size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{s.label}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </Field>

          {/* Code postal + Ville (alignés sur la même ligne) */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, marginBottom: 14 }}>
            <Field label="Code postal" optional>
              <input value={postalCode} onChange={e => {
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                  setPostalCode(v);
                }}
                placeholder="75001"
                inputMode="numeric"
                style={inputStyle} />
            </Field>
            <Field label="Ville" optional>
              {cityOptions.length > 1 ? (
                <select value={city} onChange={e => setCity(e.target.value)} style={{ ...inputStyle, paddingRight: 28, cursor: 'pointer' }}>
                  <option value="">Choisir…</option>
                  {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder={cityLoading ? 'Recherche…' : 'Paris 1er'}
                  style={inputStyle} />
              )}
            </Field>
          </div>

          {/* Nom du dossier (auto-rempli) */}
          <Field label="Nom du dossier" required hint="Auto-rempli depuis l'adresse, modifiable" icon={Folder}>
            <input value={name} onChange={e => { setName(e.target.value); setNameTouched(true); }}
              placeholder="Ex: 12 rue de Rivoli, Paris 1er"
              style={inputStyle} />
          </Field>

          {/* Note interne */}
          <Field label="Note interne" optional icon={FileText}>
            <textarea value={internalNote} onChange={e => setInternalNote(e.target.value)}
              placeholder="Ex: Mandat exclusif signé le 03/05, voisin bruyant"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 60, fontFamily: 'inherit' }} />
          </Field>

          {errorMsg && (
            <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12.5, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px 22px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} disabled={submitting}
            style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', color: '#64748b', border: '1.5px solid #edf2f7', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting || !name.trim()}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: submitting || !name.trim() ? '#cbd5e1' : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)',
              color: '#fff', cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}>
            {submitting ? 'Création…' : 'Créer le dossier'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MODAL : ÉDITION DOSSIER (modifier nom/adresse/note)
══════════════════════════════════════════ */
function ModalEditFolder({ folder, onClose, onSaved }: {
  folder: ProFolder;
  onClose: () => void;
  onSaved: (updated: Partial<ProFolder>) => void;
}) {
  const [name, setName] = useState(folder.name);
  const [address, setAddress] = useState(folder.property_address || '');
  const [postalCode, setPostalCode] = useState(folder.property_postal_code || '');
  const [city, setCity] = useState(folder.property_city || '');
  const [internalNote, setInternalNote] = useState(folder.internal_note || '');
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Autocomplétion adresse via API Adresse Etalab
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ label: string; postcode: string; city: string }>>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const lastPostalCodeQueriedRef = useRef<string>(folder.property_postal_code || '');
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-complétion code postal → ville (API gouv.fr)
  useEffect(() => {
    const cp = postalCode.trim();
    if (cp.length !== 5) {
      setCityOptions([]);
      return;
    }
    if (lastPostalCodeQueriedRef.current && lastPostalCodeQueriedRef.current !== cp) {
      setCity('');
    }
    lastPostalCodeQueriedRef.current = cp;
    setCityLoading(true);
    fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom&format=json&limit=10`)
      .then(r => r.json())
      .then((data: { nom: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const cities = data.map(c => c.nom);
          setCityOptions(cities);
          if (cities.length === 1 && cities[0] !== city) setCity(cities[0]);
        } else {
          setCityOptions([]);
        }
      })
      .catch(() => setCityOptions([]))
      .finally(() => setCityLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);

  // Autocomplétion adresse via Etalab
  useEffect(() => {
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    const q = address.trim();
    if (q.length < 4) { setAddressSuggestions([]); return; }
    addressDebounceRef.current = setTimeout(() => {
      setAddressLoading(true);
      fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`)
        .then(r => r.json())
        .then((data: any) => {
          if (data?.features && Array.isArray(data.features)) {
            const suggestions = data.features
              .map((f: any) => ({ label: f.properties?.label || '', postcode: f.properties?.postcode || '', city: f.properties?.city || '' }))
              .filter((s: any) => s.label);
            setAddressSuggestions(suggestions);
          } else {
            setAddressSuggestions([]);
          }
        })
        .catch(() => setAddressSuggestions([]))
        .finally(() => setAddressLoading(false));
    }, 300);
    return () => { if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current); };
  }, [address]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function selectAddressSuggestion(s: { label: string; postcode: string; city: string }) {
    const streetOnly = s.label.split(',')[0].trim();
    setAddress(streetOnly);
    if (s.postcode) setPostalCode(s.postcode);
    if (s.city) setCity(s.city);
    setAddressSuggestions([]);
    setShowAddressDropdown(false);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setErrorMsg('Le nom du dossier est obligatoire.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        name: name.trim(),
        property_address: address.trim() || null,
        property_postal_code: postalCode.trim() || null,
        property_city: city.trim() || null,
        internal_note: internalNote.trim() || null,
      };
      const { error } = await supabase.from('pro_folders').update(payload).eq('id', folder.id);
      if (error) throw error;
      onSaved(payload);
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de l\'enregistrement.');
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(15,45,61,0.35)' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Pencil size={16} style={{ color: '#2a7d9c' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Modifier le dossier</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>Mettez à jour les informations du bien</p>
            </div>
          </div>
          <button onClick={onClose} title="Fermer"
            style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={15} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 8px' }}>

          {/* Adresse + autocomplétion */}
          <Field label="Adresse du bien" optional icon={MapPin}>
            <div style={{ position: 'relative' }}>
              <input value={address}
                onChange={e => { setAddress(e.target.value); setShowAddressDropdown(true); }}
                onFocus={() => { setAddressFocused(true); setShowAddressDropdown(true); }}
                onBlur={() => { setAddressFocused(false); setTimeout(() => setShowAddressDropdown(false), 150); }}
                placeholder="Commencez à taper… (ex: 12 rue de Rivoli)"
                autoComplete="off"
                style={inputStyle} />

              {showAddressDropdown && addressFocused && (addressSuggestions.length > 0 || addressLoading) && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #edf2f7', borderRadius: 10, boxShadow: '0 12px 32px rgba(15,45,61,0.12)', zIndex: 10, maxHeight: 240, overflowY: 'auto' as const }}>
                  {addressLoading && addressSuggestions.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' as const }}>Recherche d'adresses…</div>
                  ) : (
                    addressSuggestions.map((s, i) => (
                      <button key={i}
                        onMouseDown={(e) => { e.preventDefault(); selectAddressSuggestion(s); }}
                        style={{
                          width: '100%', textAlign: 'left' as const, padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: i < addressSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', fontSize: 13, color: '#0f172a', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                        onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                        onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <MapPin size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{s.label}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </Field>

          {/* Code postal + Ville */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, marginBottom: 14 }}>
            <Field label="Code postal" optional>
              <input value={postalCode} onChange={e => {
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                  setPostalCode(v);
                }}
                placeholder="75001"
                inputMode="numeric"
                style={inputStyle} />
            </Field>
            <Field label="Ville" optional>
              {cityOptions.length > 1 ? (
                <select value={city} onChange={e => setCity(e.target.value)} style={{ ...inputStyle, paddingRight: 28, cursor: 'pointer' }}>
                  <option value="">Choisir…</option>
                  {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder={cityLoading ? 'Recherche…' : 'Paris 1er'}
                  style={inputStyle} />
              )}
            </Field>
          </div>

          {/* Nom du dossier */}
          <Field label="Nom du dossier" required icon={Folder}>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: 12 rue de Rivoli, Paris 1er"
              style={inputStyle} />
          </Field>

          {/* Note interne */}
          <Field label="Note interne" optional icon={FileText}>
            <textarea value={internalNote} onChange={e => setInternalNote(e.target.value)}
              placeholder="Ex: Mandat exclusif signé le 03/05, voisin bruyant"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 60, fontFamily: 'inherit' }} />
          </Field>

          {errorMsg && (
            <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12.5, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px 22px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} disabled={submitting}
            style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', color: '#64748b', border: '1.5px solid #edf2f7', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting || !name.trim()}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: submitting || !name.trim() ? '#cbd5e1' : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)',
              color: '#fff', cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MODAL : SUPPRESSION DOSSIER
══════════════════════════════════════════ */
function ModalDeleteFolder({ folder, onClose, onConfirm }: { folder: ProFolder; onClose: () => void; onConfirm: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const expectedConfirm = 'SUPPRIMER';
  const canDelete = confirmInput.trim().toUpperCase() === expectedConfirm;
  const analysesCount = folder.analyses_count || 0;
  const sellersCount = folder.sellers_count || 0;
  const buyersCount = folder.buyers_count || 0;
  const hasContent = analysesCount + sellersCount + buyersCount > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, boxShadow: '0 30px 80px rgba(15,45,61,0.35)', overflow: 'hidden' }}>

        {/* Header avec bandeau rouge dégradé */}
        <div style={{ padding: '26px 28px 22px', textAlign: 'center', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', position: 'relative', borderBottom: '1px solid #fecaca' }}>
          <button onClick={onClose} title="Fermer"
            style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(220,38,38,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} style={{ color: '#7f1d1d' }} />
          </button>
          <motion.div
            initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
            style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #fee2e2, #fecaca)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 6px 20px rgba(220,38,38,0.18)' }}>
            <Trash2 size={26} style={{ color: '#dc2626' }} />
          </motion.div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: 6 }}>Supprimer définitivement ce dossier ?</h2>
          <p style={{ fontSize: 13, color: '#991b1b', margin: 0, fontWeight: 500 }}>
            Cette action ne peut pas être annulée.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 28px 18px' }}>

          {/* Carte du dossier concerné */}
          <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 11, background: '#f8fafc', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Folder size={16} style={{ color: '#2a7d9c' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{folder.name}</div>
              {(folder.property_address || folder.property_city) && (
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {[folder.property_address, folder.property_city].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Bandeau d'avertissement clair */}
          <div style={{ padding: '14px 16px', borderRadius: 11, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: hasContent ? 10 : 0 }}>
              <AlertTriangle size={16} style={{ color: '#92400e', flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#78350f', marginBottom: 3 }}>
                  Le dossier <strong>et tout son contenu</strong> seront supprimés
                </div>
                <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.55 }}>
                  Toutes les données associées à ce dossier disparaîtront définitivement de Verimo.
                </div>
              </div>
            </div>

            {hasContent && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #fcd34d', display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                {analysesCount > 0 && (
                  <DeleteItem icon={FileText} label={`${analysesCount} analyse${analysesCount > 1 ? 's' : ''}`} sublabel={`Rapport${analysesCount > 1 ? 's' : ''} détaillé${analysesCount > 1 ? 's' : ''} (score, recommandations…)`} />
                )}
                {sellersCount > 0 && (
                  <DeleteItem icon={UserCheck} label={`${sellersCount} vendeur${sellersCount > 1 ? 's' : ''}`} sublabel="Coordonnées et notes" />
                )}
                {buyersCount > 0 && (
                  <DeleteItem icon={UserPlus} label={`${buyersCount} acheteur${buyersCount > 1 ? 's' : ''}`} sublabel="Coordonnées et notes" />
                )}
                {folder.internal_note && (
                  <DeleteItem icon={FileText} label="Note interne" sublabel="Annotations privées du dossier" />
                )}
              </div>
            )}
          </div>

          {/* Champ de confirmation */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
              Pour confirmer, tapez <code style={{ background: '#fee2e2', padding: '2px 8px', borderRadius: 5, fontSize: 12, color: '#991b1b', fontWeight: 800, fontFamily: 'monospace' as const, letterSpacing: '0.5px' }}>{expectedConfirm}</code> ci-dessous
            </label>
            <input value={confirmInput} onChange={e => setConfirmInput(e.target.value)} autoFocus
              placeholder={`Tapez ${expectedConfirm} pour confirmer`}
              style={{
                ...inputStyle,
                borderColor: canDelete ? '#dc2626' : confirmInput.length > 0 ? '#fde68a' : '#edf2f7',
                background: canDelete ? '#fef2f2' : '#fff',
                fontWeight: 700,
                letterSpacing: '0.3px',
              }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 28px 22px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} disabled={submitting}
            style={{ padding: '11px 18px', borderRadius: 10, background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
            Annuler
          </button>
          <button onClick={() => { setSubmitting(true); onConfirm(); }} disabled={!canDelete || submitting}
            style={{
              padding: '11px 22px', borderRadius: 10, border: 'none',
              background: canDelete && !submitting ? 'linear-gradient(135deg, #dc2626, #991b1b)' : '#fecaca',
              color: '#fff', cursor: canDelete && !submitting ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 700,
              boxShadow: canDelete && !submitting ? '0 4px 14px rgba(220,38,38,0.3)' : 'none',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {submitting ? 'Suppression…' : <><Trash2 size={13} /> Supprimer définitivement</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* Item d'élément à supprimer dans la liste */
function DeleteItem({ icon: Icon, label, sublabel }: { icon: React.ElementType; label: string; sublabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(146,64,14,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={11} style={{ color: '#92400e' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#78350f' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#92400e', marginLeft: 6, fontStyle: 'italic' as const }}>{sublabel}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STYLES PARTAGÉS POUR LES MODALES
══════════════════════════════════════════ */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 13px',
  borderRadius: 10,
  border: '1.5px solid #edf2f7',
  fontSize: 13.5,
  outline: 'none',
  boxSizing: 'border-box' as const,
  background: '#fff',
  fontFamily: 'inherit',
  color: '#0f172a',
};

function Field({ label, required, optional, hint, tooltip, icon: Icon, children }: { label: string; required?: boolean; optional?: boolean; hint?: string; tooltip?: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
        {Icon && <Icon size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />}
        <span>
          {label}
          {required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
          {optional && <span style={{ color: '#cbd5e1', fontWeight: 500, marginLeft: 6, textTransform: 'none' as const, fontSize: 10.5 }}>(optionnel)</span>}
        </span>
        {tooltip && <InfoTooltip text={tooltip} />}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' as const }}>{hint}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════
   TOOLTIP — Pastille "?" avec popover instantané
══════════════════════════════════════════ */
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(s => !s)}
      style={{
        position: 'relative' as const,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: show ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#e2e8f0',
        color: show ? '#fff' : '#64748b',
        fontSize: 10,
        fontWeight: 800,
        cursor: 'help',
        textTransform: 'none' as const,
        letterSpacing: 0,
        transition: 'all 0.15s',
        flexShrink: 0,
      }}>
      i
      <AnimatePresence>
        {show && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #1e3a4d, #0f2d3d)',
              color: '#fff',
              padding: '9px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 500,
              lineHeight: 1.5,
              letterSpacing: 0,
              textTransform: 'none' as const,
              width: 240,
              boxShadow: '0 8px 24px rgba(15,45,61,0.28)',
              zIndex: 1500,
              pointerEvents: 'none' as const,
              fontFamily: 'inherit',
              textAlign: 'left' as const,
            }}>
            {text}
            {/* Petite flèche pointant vers le bas */}
            <span style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #0f2d3d',
            }} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
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
/* ══════════════════════════════════════════
   DOSSIER DETAIL — Vue détaillée d'un dossier
══════════════════════════════════════════ */
function DossierDetail({ folderId, onBack }: { folderId: string; onBack: () => void }) {
  const [folder, setFolder] = useState<ProFolder | null>(null);
  const [sellers, setSellers] = useState<ProFolderSeller[]>([]);
  const [buyers, setBuyers] = useState<ProFolderBuyer[]>([]);
  const [folderAnalyses, setFolderAnalyses] = useState<ProAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState<ProFolderSeller | null>(null);
  const [sellerToDelete, setSellerToDelete] = useState<ProFolderSeller | null>(null);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<ProFolderBuyer | null>(null);
  const [buyerToDelete, setBuyerToDelete] = useState<ProFolderBuyer | null>(null);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  // Charge complet (au mount) : dossier + stats + vendeurs + acheteurs
  const loadFolder = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const { data, error } = await supabase
        .from('pro_folders')
        .select('*')
        .eq('id', folderId)
        .maybeSingle();

      if (error) throw error;
      if (!data) { setNotFound(true); setLoading(false); return; }

      // Charger les stats (counts directs, plus fiable que la RPC)
      try {
        const [analysesRes, sellersRes, buyersRes] = await Promise.all([
          supabase.from('analyses').select('id', { count: 'exact', head: true }).eq('folder_id', folderId),
          supabase.from('pro_folder_sellers').select('id', { count: 'exact', head: true }).eq('folder_id', folderId),
          supabase.from('pro_folder_buyers').select('id', { count: 'exact', head: true }).eq('folder_id', folderId),
        ]);
        setFolder({
          ...data,
          analyses_count: analysesRes.count || 0,
          sellers_count: sellersRes.count || 0,
          buyers_count: buyersRes.count || 0,
        });
      } catch {
        setFolder({ ...data, analyses_count: 0, sellers_count: 0, buyers_count: 0 });
      }

      // Charger les vendeurs, acheteurs et analyses en parallèle
      const [sellersResult, buyersResult, analysesResult] = await Promise.all([
        supabase
          .from('pro_folder_sellers')
          .select('*')
          .eq('folder_id', folderId)
          .order('created_at', { ascending: true }),
        supabase
          .from('pro_folder_buyers')
          .select('*')
          .eq('folder_id', folderId)
          .order('created_at', { ascending: true }),
        supabase
          .from('analyses')
          .select('id, type, status, title, address, created_at, result')
          .eq('folder_id', folderId)
          .order('created_at', { ascending: false }),
      ]);
      setSellers(sellersResult.data || []);
      setBuyers(buyersResult.data || []);
      setFolderAnalyses((analysesResult.data || []) as ProAnalysis[]);
    } catch (e) {
      console.error('Erreur chargement dossier:', e);
      setNotFound(true);
    }
    setLoading(false);
  }, [folderId]);

  useEffect(() => { loadFolder(); }, [loadFolder]);

  // Recharge silencieuse des vendeurs (sans loader full-page)
  const reloadSellers = useCallback(async () => {
    const { data: sellersData } = await supabase
      .from('pro_folder_sellers')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: true });
    setSellers(sellersData || []);
    setFolder(prev => prev ? { ...prev, sellers_count: (sellersData || []).length } : prev);
  }, [folderId]);

  // Recharge silencieuse des acheteurs
  const reloadBuyers = useCallback(async () => {
    const { data: buyersData } = await supabase
      .from('pro_folder_buyers')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: true });
    setBuyers(buyersData || []);
    setFolder(prev => prev ? { ...prev, buyers_count: (buyersData || []).length } : prev);
  }, [folderId]);

  // Toast auto-dismiss après 3s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleDeleteSeller(seller: ProFolderSeller) {
    // UX optimiste : on retire de la liste tout de suite
    setSellers(prev => prev.filter(s => s.id !== seller.id));
    setFolder(prev => prev ? { ...prev, sellers_count: Math.max(0, (prev.sellers_count || 1) - 1) } : prev);
    setSellerToDelete(null);
    try {
      const { error } = await supabase.from('pro_folder_sellers').delete().eq('id', seller.id);
      if (error) throw error;
      setToast({ message: 'Vendeur supprimé', type: 'success' });
    } catch (e: any) {
      // Rollback : on recharge depuis la BDD
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      reloadSellers();
    }
  }

  function handleSellerSaved(action: 'created' | 'updated') {
    setShowSellerModal(false);
    setEditingSeller(null);
    reloadSellers();
    setToast({
      message: action === 'created' ? 'Vendeur ajouté' : 'Vendeur modifié',
      type: 'success',
    });
  }

  async function handleDeleteBuyer(buyer: ProFolderBuyer) {
    // UX optimiste
    setBuyers(prev => prev.filter(b => b.id !== buyer.id));
    setFolder(prev => prev ? { ...prev, buyers_count: Math.max(0, (prev.buyers_count || 1) - 1) } : prev);
    setBuyerToDelete(null);
    try {
      const { error } = await supabase.from('pro_folder_buyers').delete().eq('id', buyer.id);
      if (error) throw error;
      setToast({ message: 'Acheteur supprimé', type: 'success' });
    } catch (e: any) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      reloadBuyers();
    }
  }

  function handleBuyerSaved(action: 'created' | 'updated') {
    setShowBuyerModal(false);
    setEditingBuyer(null);
    reloadBuyers();
    setToast({
      message: action === 'created' ? 'Acheteur ajouté' : 'Acheteur modifié',
      type: 'success',
    });
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Chargement du dossier…</div>
      </div>
    );
  }

  if (notFound || !folder) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 60, textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #edf2f7' }}>
        <Folder size={32} style={{ color: '#cbd5e1', marginBottom: 12 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Dossier introuvable</h3>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px 0' }}>Ce dossier n'existe pas ou a été supprimé.</p>
        <button onClick={onBack}
          style={{ padding: '10px 20px', borderRadius: 10, background: '#0f2d3d', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          ← Retour aux dossiers
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 16, padding: 0 }}>
        ← Retour aux dossiers
      </button>

      {/* Header dossier */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Folder size={24} style={{ color: '#2a7d9c' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: 4 }}>{folder.name}</h2>
            {(folder.property_address || folder.property_city) && (
              <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span>{[folder.property_address, folder.property_postal_code, folder.property_city].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
          <button onClick={() => setShowEditFolderModal(true)} title="Modifier les infos du dossier"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#fff', border: '1.5px solid #edf2f7', color: '#475569', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, flexShrink: 0, transition: 'all 0.15s' }}
            onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.color = '#2a7d9c'; }}
            onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.color = '#475569'; }}>
            <Pencil size={12} /> Modifier
          </button>
        </div>

        {folder.internal_note && (
          <div style={{ marginTop: 14, padding: '11px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fef3c7', fontSize: 12.5, color: '#78350f', fontStyle: 'italic' as const }}>
            📝 {folder.internal_note}
          </div>
        )}
      </div>

      {/* Actions principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        <ActionButton icon={UserCheck} label="Ajouter un vendeur" onClick={() => { setEditingSeller(null); setShowSellerModal(true); }} />
        <ActionButton icon={UserPlus} label="Ajouter un acheteur" onClick={() => { setEditingBuyer(null); setShowBuyerModal(true); }} />
        <ActionButton icon={Plus} label="Lancer une analyse"
          onClick={() => navigate(`/dashboard/nouvelle-analyse?folder=${folder.id}`)} />
      </div>

      {/* Sections Vendeurs + Acheteurs en 2 colonnes */}
      <div className="folder-people-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12, marginBottom: 12 }}>
        <SectionVendeurs
          sellers={sellers}
          onAdd={() => { setEditingSeller(null); setShowSellerModal(true); }}
          onEdit={(s) => { setEditingSeller(s); setShowSellerModal(true); }}
          onDelete={(s) => setSellerToDelete(s)}
        />

        <SectionAcheteurs
          buyers={buyers}
          onAdd={() => { setEditingBuyer(null); setShowBuyerModal(true); }}
          onEdit={(b) => { setEditingBuyer(b); setShowBuyerModal(true); }}
          onDelete={(b) => setBuyerToDelete(b)}
        />
      </div>

      {/* Section Analyses du dossier */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '18px 22px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: folderAnalyses.length > 0 ? 14 : 6 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={15} style={{ color: '#94a3b8' }} />
            Analyses
            {folderAnalyses.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: '#f0f7fb', padding: '2px 8px', borderRadius: 100 }}>{folderAnalyses.length}</span>
            )}
          </h3>
          <button onClick={() => navigate(`/dashboard/nouvelle-analyse?folder=${folder.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#f0f7fb', border: '1px solid #c7dde8', color: '#2a7d9c', cursor: 'pointer', fontSize: 11.5, fontWeight: 700 }}>
            <Plus size={12} /> Nouvelle
          </button>
        </div>
        {folderAnalyses.length === 0 ? (
          <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, fontStyle: 'italic' as const }}>Aucune analyse pour ce dossier.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {folderAnalyses.map(a => {
              const score = getScore(a.result as Record<string, unknown>);
              const isCompleted = a.status === 'completed';
              const isPending = a.status === 'pending' || a.status === 'processing';
              const isFailed = a.status === 'failed';
              return (
                <div key={a.id}
                  onClick={() => isCompleted ? (window.location.href = `/rapport?id=${a.id}`) : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12,
                    background: isFailed ? '#fef2f2' : '#f8fafc', border: `1px solid ${isFailed ? '#fecaca' : '#edf2f7'}`,
                    cursor: isCompleted ? 'pointer' : 'default', transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { if (isCompleted) { (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; (e.currentTarget as HTMLElement).style.background = '#fafdfe'; } }}
                  onMouseOut={e => { if (isCompleted) { (e.currentTarget as HTMLElement).style.borderColor = '#edf2f7'; (e.currentTarget as HTMLElement).style.background = '#f8fafc'; } }}>
                  {score !== null && isCompleted && <ScoreRing score={score} size={38} />}
                  {isPending && (
                    <div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2a7d9c', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  )}
                  {isFailed && (
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertTriangle size={16} style={{ color: '#dc2626' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {a.address || a.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{fmtDate(a.created_at)}</span>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1' }} />
                      <span>{a.type === 'complete' ? 'Complète' : 'Simple'}</span>
                      {score !== null && (
                        <>
                          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1' }} />
                          <span style={{ fontWeight: 700, color: getScoreColor(score) }}>{score}/20</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isPending && <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '3px 10px', borderRadius: 100, border: '1px solid #fef3c7' }}>En cours</span>}
                  {isFailed && <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: 100, border: '1px solid #fecaca' }}>Échoué</span>}
                  {isCompleted && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Voir le rapport <ChevronRight size={13} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale ajout/édition vendeur */}
      <AnimatePresence>
        {showSellerModal && (
          <ModalSeller
            folderId={folderId}
            seller={editingSeller}
            onClose={() => { setShowSellerModal(false); setEditingSeller(null); }}
            onSaved={(action) => handleSellerSaved(action)}
          />
        )}
      </AnimatePresence>

      {/* Modale suppression vendeur */}
      <AnimatePresence>
        {sellerToDelete && (
          <ModalDeleteSeller
            seller={sellerToDelete}
            onClose={() => setSellerToDelete(null)}
            onConfirm={() => handleDeleteSeller(sellerToDelete)}
          />
        )}
      </AnimatePresence>

      {/* Modale ajout/édition acheteur */}
      <AnimatePresence>
        {showBuyerModal && (
          <ModalBuyer
            folderId={folderId}
            buyer={editingBuyer}
            onClose={() => { setShowBuyerModal(false); setEditingBuyer(null); }}
            onSaved={(action) => handleBuyerSaved(action)}
          />
        )}
      </AnimatePresence>

      {/* Modale suppression acheteur */}
      <AnimatePresence>
        {buyerToDelete && (
          <ModalDeleteBuyer
            buyer={buyerToDelete}
            onClose={() => setBuyerToDelete(null)}
            onConfirm={() => handleDeleteBuyer(buyerToDelete)}
          />
        )}
      </AnimatePresence>

      {/* Modale édition du dossier */}
      <AnimatePresence>
        {showEditFolderModal && folder && (
          <ModalEditFolder
            folder={folder}
            onClose={() => setShowEditFolderModal(false)}
            onSaved={(updated) => {
              setShowEditFolderModal(false);
              setFolder(prev => prev ? { ...prev, ...updated } : prev);
              setToast({ message: 'Dossier mis à jour', type: 'success' });
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   TOAST — Notification flottante
══════════════════════════════════════════ */
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  const isSuccess = type === 'success';
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 1100,
        background: '#fff', borderRadius: 12,
        padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 12px 32px rgba(15,45,61,0.18)',
        border: `1.5px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
      }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: isSuccess ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isSuccess ? <CheckCircle size={14} style={{ color: '#16a34a' }} /> : <AlertTriangle size={14} style={{ color: '#dc2626' }} />}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: isSuccess ? '#15803d' : '#991b1b' }}>{message}</span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   SECTION VENDEURS
══════════════════════════════════════════ */
function SectionVendeurs({ sellers, onAdd, onEdit, onDelete }: {
  sellers: ProFolderSeller[];
  onAdd: () => void;
  onEdit: (s: ProFolderSeller) => void;
  onDelete: (s: ProFolderSeller) => void;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sellers.length > 0 ? 14 : 6 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserCheck size={15} style={{ color: '#94a3b8' }} />
          Vendeur{sellers.length > 1 ? 's' : ''}
          {sellers.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: 100 }}>{sellers.length}</span>
          )}
        </h3>
        {sellers.length > 0 && (
          <button onClick={onAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#f5f3ff', border: '1px solid #e9d5ff', color: '#7c3aed', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <Plus size={12} /> Ajouter
          </button>
        )}
      </div>

      {sellers.length === 0 ? (
        <div style={{ padding: '12px 0' }}>
          <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 12px 0', fontStyle: 'italic' as const }}>
            Aucun vendeur enregistré pour ce dossier.
          </p>
          <button onClick={onAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#f5f3ff', border: '1px dashed #c4b5fd', color: '#7c3aed', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <Plus size={12} /> Ajouter le vendeur
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <AnimatePresence initial={false}>
            {sellers.map(s => <SellerCard key={s.id} seller={s} onEdit={() => onEdit(s)} onDelete={() => onDelete(s)} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function SellerCard({ seller, onEdit, onDelete }: { seller: ProFolderSeller; onEdit: () => void; onDelete: () => void }) {
  const fullName = [seller.civility, seller.first_name, seller.last_name].filter(Boolean).join(' ');
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: '12px 14px', borderRadius: 11, background: 'linear-gradient(135deg, #fafafa, #f8fafc)', border: '1px solid #f1f5f9', position: 'relative' as const, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UserCheck size={16} style={{ color: '#7c3aed' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{fullName || seller.last_name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 14px', fontSize: 11.5, color: '#64748b' }}>
            {seller.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={11} style={{ color: '#94a3b8' }} />
                <a href={`mailto:${seller.email}`} style={{ color: '#64748b', textDecoration: 'none' }}>{seller.email}</a>
              </span>
            )}
            {seller.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#94a3b8' }}>📞</span>
                <a href={`tel:${seller.phone}`} style={{ color: '#64748b', textDecoration: 'none' }}>{seller.phone}</a>
              </span>
            )}
          </div>
          {seller.note && (
            <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 7, background: '#fffbeb', border: '1px solid #fef3c7', fontSize: 11.5, color: '#78350f', fontStyle: 'italic' as const }}>
              {seller.note}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button onClick={onEdit} title="Modifier"
            style={{ width: 28, height: 28, borderRadius: 7, background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pencil size={12} style={{ color: '#64748b' }} />
          </button>
          <button onClick={onDelete} title="Supprimer"
            style={{ width: 28, height: 28, borderRadius: 7, background: '#fef2f2', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={12} style={{ color: '#dc2626' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MODAL : AJOUT / ÉDITION VENDEUR
══════════════════════════════════════════ */
function ModalSeller({ folderId, seller, onClose, onSaved }: {
  folderId: string;
  seller: ProFolderSeller | null;
  onClose: () => void;
  onSaved: (action: 'created' | 'updated') => void;
}) {
  const isEditing = !!seller;
  const [civility, setCivility] = useState(seller?.civility || 'M.');
  const [firstName, setFirstName] = useState(seller?.first_name || '');
  const [lastName, setLastName] = useState(seller?.last_name || '');
  const [email, setEmail] = useState(seller?.email || '');
  const [phone, setPhone] = useState(seller?.phone || '');
  const [note, setNote] = useState(seller?.note || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit() {
    if (!lastName.trim()) {
      setErrorMsg('Le nom est obligatoire.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        folder_id: folderId,
        civility: civility || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        note: note.trim() || null,
      };
      if (isEditing && seller) {
        const { error } = await supabase.from('pro_folder_sellers').update(payload).eq('id', seller.id);
        if (error) throw error;
        onSaved('updated');
      } else {
        const { error } = await supabase.from('pro_folder_sellers').insert(payload);
        if (error) throw error;
        onSaved('created');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de l\'enregistrement.');
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(15,45,61,0.35)' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={18} style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isEditing ? 'Modifier le vendeur' : 'Ajouter un vendeur'}
              </h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>
                {isEditing ? 'Mettez à jour les informations du vendeur' : 'Renseignez les informations du vendeur du bien'}
              </p>
            </div>
          </div>
          <button onClick={onClose} title="Fermer"
            style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={15} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 8px' }}>

          {/* Civilité + Prénom + Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <Field label="Civilité" optional>
              <select value={civility} onChange={e => setCivility(e.target.value)} style={{ ...inputStyle, paddingRight: 28, cursor: 'pointer' }}>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="M. et Mme">M. et Mme</option>
                <option value="Société">Société</option>
              </select>
            </Field>
            <Field label="Prénom" optional>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" style={inputStyle} />
            </Field>
            <Field label="Nom" required>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Martin" style={inputStyle} />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email" optional icon={Mail} tooltip="Utile pour envoyer le rapport d'analyse directement par email à cette personne depuis votre espace.">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean.martin@email.fr" style={inputStyle} />
          </Field>

          {/* Téléphone */}
          <Field label="Téléphone" optional tooltip="Utile pour rappeler facilement votre interlocuteur depuis la fiche dossier.">
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" style={inputStyle} />
          </Field>

          {/* Note */}
          <Field label="Note interne" optional icon={FileText}>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ex: Mandat exclusif signé le 03/05, urgent à vendre"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 60, fontFamily: 'inherit' }} />
          </Field>

          {errorMsg && (
            <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12.5, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px 22px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} disabled={submitting}
            style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', color: '#64748b', border: '1.5px solid #edf2f7', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting || !lastName.trim()}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: submitting || !lastName.trim() ? '#cbd5e1' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: '#fff', cursor: submitting || !lastName.trim() ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}>
            {submitting ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Ajouter le vendeur'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MODAL : SUPPRESSION VENDEUR
══════════════════════════════════════════ */
function ModalDeleteSeller({ seller, onClose, onConfirm }: {
  seller: ProFolderSeller; onClose: () => void; onConfirm: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const fullName = [seller.civility, seller.first_name, seller.last_name].filter(Boolean).join(' ') || seller.last_name;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420, boxShadow: '0 30px 80px rgba(15,45,61,0.35)', overflow: 'hidden' }}>

        <div style={{ padding: '22px 24px 18px', textAlign: 'center', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', position: 'relative' as const }}>
          <button onClick={onClose} title="Fermer"
            style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(220,38,38,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} style={{ color: '#7f1d1d' }} />
          </button>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <Trash2 size={20} style={{ color: '#dc2626' }} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: 4 }}>Supprimer ce vendeur ?</h2>
          <p style={{ fontSize: 12.5, color: '#991b1b', margin: 0 }}>
            <strong>{fullName}</strong> sera retiré du dossier.
          </p>
        </div>

        <div style={{ padding: '14px 24px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={submitting}
            style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
            Annuler
          </button>
          <button onClick={() => { setSubmitting(true); onConfirm(); }} disabled={submitting}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {submitting ? 'Suppression…' : <><Trash2 size={13} /> Supprimer</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   SECTION ACHETEURS
══════════════════════════════════════════ */
function SectionAcheteurs({ buyers, onAdd, onEdit, onDelete }: {
  buyers: ProFolderBuyer[];
  onAdd: () => void;
  onEdit: (b: ProFolderBuyer) => void;
  onDelete: (b: ProFolderBuyer) => void;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: buyers.length > 0 ? 14 : 6 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserPlus size={15} style={{ color: '#94a3b8' }} />
          Acheteur{buyers.length > 1 ? 's' : ''}
          {buyers.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 100 }}>{buyers.length}</span>
          )}
        </h3>
        {buyers.length > 0 && (
          <button onClick={onAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <Plus size={12} /> Ajouter
          </button>
        )}
      </div>

      {buyers.length === 0 ? (
        <div style={{ padding: '12px 0' }}>
          <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 12px 0', fontStyle: 'italic' as const }}>
            Aucun acheteur enregistré pour ce dossier.
          </p>
          <button onClick={onAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px dashed #86efac', color: '#16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <Plus size={12} /> Ajouter un acheteur
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <AnimatePresence initial={false}>
            {buyers.map(b => <BuyerCard key={b.id} buyer={b} onEdit={() => onEdit(b)} onDelete={() => onDelete(b)} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function BuyerCard({ buyer, onEdit, onDelete }: { buyer: ProFolderBuyer; onEdit: () => void; onDelete: () => void }) {
  const fullName = [buyer.civility, buyer.first_name, buyer.last_name].filter(Boolean).join(' ');
  const statusCfg = BUYER_STATUS_CONFIG[buyer.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: '12px 14px', borderRadius: 11, background: 'linear-gradient(135deg, #fafafa, #f8fafc)', border: '1px solid #f1f5f9', position: 'relative' as const, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UserPlus size={16} style={{ color: '#16a34a' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 3 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{fullName || buyer.last_name}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: statusCfg.color, background: statusCfg.bg, padding: '2px 8px', borderRadius: 100, border: `1px solid ${statusCfg.border}` }}>
              {statusCfg.label}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 14px', fontSize: 11.5, color: '#64748b' }}>
            {buyer.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={11} style={{ color: '#94a3b8' }} />
                <a href={`mailto:${buyer.email}`} style={{ color: '#64748b', textDecoration: 'none' }}>{buyer.email}</a>
              </span>
            )}
            {buyer.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#94a3b8' }}>📞</span>
                <a href={`tel:${buyer.phone}`} style={{ color: '#64748b', textDecoration: 'none' }}>{buyer.phone}</a>
              </span>
            )}
          </div>
          {buyer.note && (
            <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 7, background: '#fffbeb', border: '1px solid #fef3c7', fontSize: 11.5, color: '#78350f', fontStyle: 'italic' as const }}>
              {buyer.note}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button onClick={onEdit} title="Modifier"
            style={{ width: 28, height: 28, borderRadius: 7, background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pencil size={12} style={{ color: '#64748b' }} />
          </button>
          <button onClick={onDelete} title="Supprimer"
            style={{ width: 28, height: 28, borderRadius: 7, background: '#fef2f2', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={12} style={{ color: '#dc2626' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MODAL : AJOUT / ÉDITION ACHETEUR
══════════════════════════════════════════ */
function ModalBuyer({ folderId, buyer, onClose, onSaved }: {
  folderId: string;
  buyer: ProFolderBuyer | null;
  onClose: () => void;
  onSaved: (action: 'created' | 'updated') => void;
}) {
  const isEditing = !!buyer;
  const [civility, setCivility] = useState(buyer?.civility || 'M.');
  const [firstName, setFirstName] = useState(buyer?.first_name || '');
  const [lastName, setLastName] = useState(buyer?.last_name || '');
  const [email, setEmail] = useState(buyer?.email || '');
  const [phone, setPhone] = useState(buyer?.phone || '');
  const [status, setStatus] = useState<BuyerStatus>(buyer?.status || 'candidat');
  const [note, setNote] = useState(buyer?.note || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit() {
    if (!lastName.trim()) {
      setErrorMsg('Le nom est obligatoire.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        folder_id: folderId,
        civility: civility || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        status,
        note: note.trim() || null,
      };
      if (isEditing && buyer) {
        const { error } = await supabase.from('pro_folder_buyers').update(payload).eq('id', buyer.id);
        if (error) throw error;
        onSaved('updated');
      } else {
        const { error } = await supabase.from('pro_folder_buyers').insert(payload);
        if (error) throw error;
        onSaved('created');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de l\'enregistrement.');
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(15,45,61,0.35)' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserPlus size={18} style={{ color: '#16a34a' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isEditing ? 'Modifier l\'acheteur' : 'Ajouter un acheteur'}
              </h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>
                {isEditing ? 'Mettez à jour les informations de l\'acheteur' : 'Renseignez les informations de l\'acheteur potentiel'}
              </p>
            </div>
          </div>
          <button onClick={onClose} title="Fermer"
            style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={15} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 8px' }}>

          {/* Civilité + Prénom + Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <Field label="Civilité" optional>
              <select value={civility} onChange={e => setCivility(e.target.value)} style={{ ...inputStyle, paddingRight: 28, cursor: 'pointer' }}>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="M. et Mme">M. et Mme</option>
                <option value="Société">Société</option>
              </select>
            </Field>
            <Field label="Prénom" optional>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Sophie" style={inputStyle} />
            </Field>
            <Field label="Nom" required>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" style={inputStyle} />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email" optional icon={Mail} tooltip="Utile pour envoyer le rapport d'analyse directement par email à cette personne depuis votre espace.">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sophie.dupont@email.fr" style={inputStyle} />
          </Field>

          {/* Téléphone */}
          <Field label="Téléphone" optional tooltip="Utile pour rappeler facilement votre interlocuteur depuis la fiche dossier.">
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" style={inputStyle} />
          </Field>

          {/* Statut */}
          <Field label="Statut" required hint="Évolution de l'acheteur dans le processus de vente">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {(Object.keys(BUYER_STATUS_CONFIG) as BuyerStatus[]).map(s => {
                const cfg = BUYER_STATUS_CONFIG[s];
                const isSelected = status === s;
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    style={{
                      padding: '9px 12px', borderRadius: 9,
                      background: isSelected ? cfg.bg : '#fff',
                      border: `1.5px solid ${isSelected ? cfg.border : '#edf2f7'}`,
                      color: isSelected ? cfg.color : '#475569',
                      cursor: 'pointer',
                      fontSize: 12.5, fontWeight: 700,
                      textAlign: 'left' as const,
                      transition: 'all 0.15s',
                    }}>
                    {isSelected && '✓ '}{cfg.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Note */}
          <Field label="Note interne" optional icon={FileText}>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ex: Apport 30%, finance par crédit, visite prévue le 15/05"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 60, fontFamily: 'inherit' }} />
          </Field>

          {errorMsg && (
            <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12.5, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px 22px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} disabled={submitting}
            style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', color: '#64748b', border: '1.5px solid #edf2f7', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting || !lastName.trim()}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: submitting || !lastName.trim() ? '#cbd5e1' : 'linear-gradient(135deg,#16a34a,#15803d)',
              color: '#fff', cursor: submitting || !lastName.trim() ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}>
            {submitting ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Ajouter l\'acheteur'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MODAL : SUPPRESSION ACHETEUR
══════════════════════════════════════════ */
function ModalDeleteBuyer({ buyer, onClose, onConfirm }: {
  buyer: ProFolderBuyer; onClose: () => void; onConfirm: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const fullName = [buyer.civility, buyer.first_name, buyer.last_name].filter(Boolean).join(' ') || buyer.last_name;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420, boxShadow: '0 30px 80px rgba(15,45,61,0.35)', overflow: 'hidden' }}>

        <div style={{ padding: '22px 24px 18px', textAlign: 'center', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', position: 'relative' as const }}>
          <button onClick={onClose} title="Fermer"
            style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(220,38,38,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} style={{ color: '#7f1d1d' }} />
          </button>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <Trash2 size={20} style={{ color: '#dc2626' }} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: 4 }}>Supprimer cet acheteur ?</h2>
          <p style={{ fontSize: 12.5, color: '#991b1b', margin: 0 }}>
            <strong>{fullName}</strong> sera retiré du dossier.
          </p>
        </div>

        <div style={{ padding: '14px 24px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={submitting}
            style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
            Annuler
          </button>
          <button onClick={() => { setSubmitting(true); onConfirm(); }} disabled={submitting}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {submitting ? 'Suppression…' : <><Trash2 size={13} /> Supprimer</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActionButton({ icon: Icon, label, onClick, comingSoon }: { icon: React.ElementType; label: string; onClick?: () => void; comingSoon?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={comingSoon}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12,
        background: comingSoon ? '#f8fafc' : '#fff',
        border: comingSoon ? '1.5px dashed #e2e8f0' : '1.5px solid #edf2f7',
        cursor: comingSoon ? 'not-allowed' : 'pointer',
        textAlign: 'left' as const,
        transition: 'all 0.15s',
        opacity: comingSoon ? 0.65 : 1,
      }}
      onMouseOver={e => { if (!comingSoon) { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.background = '#fafdfe'; } }}
      onMouseOut={e => { if (!comingSoon) { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.background = '#fff'; } }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: comingSoon ? '#f1f5f9' : 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color: comingSoon ? '#94a3b8' : '#2a7d9c' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</div>
        {comingSoon && <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>Bientôt disponible</div>}
      </div>
    </button>
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
  const [proCredits, setProCredits] = useState<ProCredits | null>(null);
  const [analyses, setAnalyses] = useState<ProAnalysis[]>([]);
  const [shares, setShares] = useState<ReportShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendReportId, setSendReportId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // ─── Notifications : rapports terminés ────────────────────
  type ProNotification = { id: string; analysisId: string; title: string; createdAt: string; read: boolean };
  const [notifications, setNotifications] = useState<ProNotification[]>([]);
  const prevAnalysesRef = useRef<ProAnalysis[]>([]);

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

    // Credits balance (agrège abo + unitaires + offerts)
    const { data: credits } = await supabase.rpc('get_pro_credits_balance', { p_user_id: user.id });
    if (credits && credits.length > 0) setProCredits(credits[0] as ProCredits);
    else setProCredits(null);

    // Analyses
    const { data: anal } = await supabase.from('analyses').select('id, type, status, title, address, created_at, result').eq('user_id', user.id).order('created_at', { ascending: false });
    setAnalyses((anal || []) as ProAnalysis[]);

    // Shares
    const { data: sh } = await supabase.from('report_shares').select('*').eq('sender_id', user.id).order('sent_at', { ascending: false });
    setShares((sh || []) as ReportShare[]);

    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Polling toutes les 15s pour détecter les analyses qui passent à "completed"
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: fresh } = await supabase.from('analyses').select('id, type, status, title, address, created_at, result').eq('user_id', user.id).order('created_at', { ascending: false });
      if (!fresh) return;
      const freshAnalyses = fresh as ProAnalysis[];

      // Détecter les nouvelles analyses terminées
      const prev = prevAnalysesRef.current;
      if (prev.length > 0) {
        const newlyCompleted = freshAnalyses.filter(a =>
          a.status === 'completed' && prev.find(p => p.id === a.id && p.status !== 'completed')
        );
        if (newlyCompleted.length > 0) {
          setNotifications(n => [
            ...newlyCompleted.map(a => ({
              id: `notif-${a.id}`,
              analysisId: a.id,
              title: a.address || a.title || 'Analyse',
              createdAt: new Date().toISOString(),
              read: false,
            })),
            ...n,
          ]);
          // Rafraîchir les crédits aussi
          const { data: credits } = await supabase.rpc('get_pro_credits_balance', { p_user_id: user.id });
          if (credits && credits.length > 0) setProCredits(credits[0] as ProCredits);
        }
      }
      prevAnalysesRef.current = freshAnalyses;
      setAnalyses(freshAnalyses);
    }, 15000);
    return () => clearInterval(interval);
  }, [loading]);

  // Initialiser prevAnalysesRef au premier chargement
  useEffect(() => {
    if (analyses.length > 0 && prevAnalysesRef.current.length === 0) {
      prevAnalysesRef.current = analyses;
    }
  }, [analyses]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));

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
      return <DossierDetail folderId={dossierMatch[1]} onBack={() => navigate('/dashboard/dossiers')} />;
    }
    if (path === '/dashboard/dossiers') return <MesDossiersPro />;
    if (path === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse />;
    if (path === '/dashboard/compare') return <Compare />;
    if (path === '/dashboard/abonnement') return <MonAbonnement subscription={subscription} />;
    if (path === '/dashboard/compte') return <ComptePro proProfile={proProfile} onUpdate={loadData} />;
    if (path === '/dashboard/aide') return <Aide />;
    if (path === '/dashboard/support') return <Support />;
    return <HomeViewPro proProfile={proProfile} subscription={subscription} proCredits={proCredits} analyses={analyses} shares={shares} />;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Sidebar desktop */}
      <div className="desktop-sidebar" style={{ width: 260, flexShrink: 0 }}>
        <div style={{ position: 'fixed', top: 0, left: 0, width: 260, height: '100vh', zIndex: 50, overflowY: 'auto' }}>
          <SidebarPro subscription={subscription} proCredits={proCredits} />
        </div>
      </div>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
            <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.45)' }} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260 }}>
              <SidebarPro subscription={subscription} proCredits={proCredits} onClose={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopbarPro onMenuClick={() => setMobileOpen(true)} title={title} proProfile={proProfile}
          unreadCount={unreadCount} notifications={notifications} onMarkAllRead={markAllRead}
          onClickNotification={(id) => { window.location.href = `/rapport?id=${id}`; }} />
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

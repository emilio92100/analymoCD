import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, Plus, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, CreditCard, BookOpen,
  Send, Search, Clock, Bell,
  CheckCircle, Upload, Mail, Download, XCircle,
  ChevronRight, ArrowRight,
  MapPin, Trash2, AlertTriangle, FileText, Pencil,
  UserPlus, UserCheck, Folder, Lightbulb, MessageSquare,
  LayoutGrid, LayoutList, ArrowUpDown, Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStripe } from '../lib/stripe-client';

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
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  cancellation_reason?: string;
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
  archived_at?: string | null;
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
function SidebarPro({ subscription, proCredits, onClose, unreadTickets }: { subscription: ProSubscription | null; proCredits: ProCredits | null; onClose?: () => void; unreadTickets?: number }) {
  const location = useLocation();

  const BG = '#0e3a4a';
  const ACCENT = '#7dd3fc';
  const TEXT = 'rgba(255,255,255,0.75)';
  const TEXT_ACTIVE = '#ffffff';
  const MUTED = 'rgba(255,255,255,0.45)';

  const creditsComplete = proCredits?.total_complete ?? 0;
  const creditsSimple = proCredits?.total_document ?? 0;

  return (
    <aside style={{ width: 260, minHeight: '100vh', height: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>
      {/* Logo + PRO badge — centré et gros */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 18px 0', flexShrink: 0, position: 'relative' }}>
        <Link to="/" onClick={onClose} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo-blanc.png" alt="Verimo" style={{ height: 100, width: 'auto', display: 'block', marginBottom: -20 }} />
          <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #38bdf8)`, color: '#0a1f2d', fontSize: 10, fontWeight: 800, padding: '3px 14px', borderRadius: 100, letterSpacing: '0.08em' }}>ACCÈS PRO</span>
        </Link>
        {onClose && <button onClick={onClose} style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}><X size={18} /></button>}
      </div>

      {/* CTA Nouvelle analyse */}
      <div style={{ padding: '10px 14px 8px' }}>
        <Link to="/dashboard/nouvelle-analyse" onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, background: '#2a7d9c', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}>
          <Plus size={15} strokeWidth={2.5} /> Nouvelle analyse
        </Link>
      </div>

      {/* Crédits restants */}
      <div style={{ margin: '0 14px 6px', padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', marginBottom: 7 }}>CRÉDITS RESTANTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ label: 'Complète', value: creditsComplete }, { label: 'Simple', value: creditsSimple }].map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{c.label}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: c.value > 0 ? ACCENT : 'rgba(255,255,255,0.2)' }}>{c.value}</span>
            </div>
          ))}
        </div>
        {subscription ? (
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', textAlign: 'center', lineHeight: 1.5 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              Abonnement : {subscription.plan === 'decouverte' ? 'Découverte' : subscription.plan === 'starter' ? 'Starter' : subscription.plan === 'power' ? 'Power' : subscription.plan}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: subscription.cancel_at_period_end ? '#fbbf24' : 'rgba(255,255,255,0.65)' }}>
              {subscription.cancel_at_period_end ? 'Fin d\'abonnement' : 'Renouvellement'} {subscription.current_period_end ? fmtDate(subscription.current_period_end) : '—'}
            </div>
          </div>
        ) : (
          <Link to="/dashboard/abonnement" onClick={onClose} style={{ display: 'block', marginTop: 7, fontSize: 11, fontWeight: 700, color: ACCENT, textDecoration: 'none', textAlign: 'center' }}>
            Choisir un abonnement
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.12em', padding: '10px 10px 5px', textTransform: 'uppercase' }}>Menu</p>
        {proNavItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.to || (item.to === '/dashboard/dossiers' && location.pathname.startsWith('/dashboard/dossier'));
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', textDecoration: 'none',
                fontSize: 14, fontWeight: active ? 700 : 500, color: active ? TEXT_ACTIVE : TEXT,
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'all 0.15s',
                borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent', borderRadius: 0,
              }}>
              <Icon size={18} style={{ color: active ? ACCENT : TEXT, flexShrink: 0 }} />
              {item.label}
              {item.to === '/dashboard/support' && (unreadTickets || 0) > 0 && (
                <span style={{ minWidth: 18, height: 18, borderRadius: 100, background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0, marginLeft: 4 }}>{unreadTickets}</span>
              )}
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
function TopbarPro({ onMenuClick, title, mobileTitle, proProfile, unreadCount, notifications, onMarkAllRead, onClickNotification }: {
  onMenuClick: () => void; title: string; mobileTitle?: string; proProfile: ProProfile | null;
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
    <header style={{ height: 76, background: '#fff', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, position: 'sticky', top: 0, zIndex: 40, flexShrink: 0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f2d3d', padding: 4, display: 'none' }}><Menu size={22} /></button>
      {mobileTitle && mobileTitle !== title ? (<>
        <p className="topbar-title topbar-title-desktop" style={{ flex: 1, fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</p>
        <p className="topbar-title topbar-title-mobile" style={{ flex: 1, fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'none' }}>{mobileTitle}</p>
      </>) : (
        <p className="topbar-title" style={{ flex: 1, fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</p>
      )}

      {/* Bouton Besoin d'aide */}
      <button onClick={() => { if ((window as unknown as Record<string, unknown>).__openHelp) ((window as unknown as Record<string, () => void>).__openHelp)(); }}
        className="topbar-help-btn"
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(217,119,6,0.2)', transition: 'all 0.15s' }}
        onMouseOver={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
        onMouseOut={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
        <LifeBuoy size={13} /> Besoin d&apos;aide
      </button>

      {/* Bouton Suggestion */}
      <button onClick={() => { if ((window as unknown as Record<string, unknown>).__openSuggestion) ((window as unknown as Record<string, () => void>).__openSuggestion)(); }}
        className="topbar-suggest-btn"
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: '#fff', border: '1.5px solid #edf2f7', cursor: 'pointer', color: '#64748b', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
        onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#d97706'; el.style.color = '#d97706'; el.style.background = '#fffbeb'; }}
        onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.color = '#64748b'; el.style.background = '#fff'; }}>
        <Lightbulb size={13} /> Suggestion
      </button>

      {/* Cloche notifications */}
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button onClick={() => { setBellOpen(!bellOpen); if (!bellOpen && onMarkAllRead) onMarkAllRead(); }}
          style={{ width: 40, height: 40, borderRadius: 10, background: bellOpen ? '#f0f7fb' : '#f8fafc', border: `1px solid ${bellOpen ? '#c7dde8' : '#edf2f7'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', position: 'relative', transition: 'all 0.15s' }}>
          <Bell size={18} />
          {(unreadCount || 0) > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 100,
              background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              border: '2px solid #fff',
            }}>{unreadCount}</span>
          )}
        </button>
        <AnimatePresence>
        {bellOpen && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ position: 'absolute', right: -60, top: 'calc(100% + 8px)', width: 320, maxWidth: 'calc(100vw - 24px)', background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', boxShadow: '0 16px 48px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden' }}>
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
                notifications.slice(0, 10).map(n => {
                  const isAnalysis = !!n.analysisId;
                  return (
                  <button key={n.id}
                    onClick={() => { setBellOpen(false); if (isAnalysis && onClickNotification) onClickNotification(n.analysisId); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: n.read ? '#fff' : '#f0f7fb', border: 'none', borderBottom: '1px solid #f0f5f9',
                      cursor: isAnalysis ? 'pointer' : 'default', textAlign: 'left' as const, transition: 'all 0.1s',
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = n.read ? '#fff' : '#f0f7fb'; }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: isAnalysis ? 'rgba(42,125,156,0.08)' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isAnalysis ? <CheckCircle size={15} style={{ color: '#16a34a' }} /> : <Bell size={15} style={{ color: '#d97706' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: n.read ? 500 : 700, color: '#0f172a' }}>
                        {isAnalysis ? 'Rapport prêt' : n.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{isAnalysis ? n.title : (n as unknown as Record<string, string>).message || ''}</div>
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{fmtDate(n.createdAt)}</span>
                  </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px 6px 6px', borderRadius: 10, background: dropdownOpen ? '#f0f7fb' : '#f8fafc', border: `1px solid ${dropdownOpen ? '#c7dde8' : '#edf2f7'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
            {(name.charAt(0) || 'P').toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }} className="topbar-cta">{name}</span>
            {company && <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }} className="topbar-cta">{company}</span>}
          </div>
          <ChevronDown size={13} style={{ color: '#94a3b8' }} />
        </button>
        <AnimatePresence>
        {dropdownOpen && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', boxShadow: '0 16px 48px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden' }}>
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
          </motion.div>
        )}
        </AnimatePresence>
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
function HomeViewPro({ proProfile, subscription, proCredits, analyses, shares, hasEverSubscribed }: { proProfile: ProProfile; subscription: ProSubscription | null; proCredits: ProCredits | null; analyses: ProAnalysis[]; shares: ReportShare[]; hasEverSubscribed: boolean }) {
  const prenom = proProfile.full_name?.split(' ')[0] || 'Pro';
  const completedAnalyses = analyses.filter(a => a.status === 'completed');
  const thisMonth = analyses.filter(a => { const d = new Date(a.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const creditsLeft = (proCredits?.total_complete ?? 0) + (proCredits?.total_document ?? 0);
  const totalShares = shares.length;

  // Toggle Ce mois / Total pour la KPI analyses
  const [analysesPeriod, setAnalysesPeriod] = useState<'month' | 'total'>('month');
  const periodAnalyses = analysesPeriod === 'month' ? thisMonth : analyses;
  const periodFailed = periodAnalyses.filter(a => a.status === 'failed').length;
  const periodInProgress = periodAnalyses.filter(a => a.status === 'queued' || a.status === 'processing' || a.status === 'pending').length;

  const lastAnalyses = completedAnalyses.slice(0, 3);
  const lastShares = shares.slice(0, 3);

  // Plan recommandé par l'admin
  const PLAN_INFO: Record<string, { name: string; price: string; completes: number; simples: number }> = {
    decouverte: { name: 'Découverte', price: '19,90', completes: 1, simples: 3 },
    starter: { name: 'Starter', price: '49,90', completes: 5, simples: 15 },
    power: { name: 'Power', price: '89,90', completes: 10, simples: 30 },
  };
  const recommendedPlanId = proProfile.pro_recommended_plan || '';
  const recommendedPlan = PLAN_INFO[recommendedPlanId] || null;
  const showRecommendedBanner = !subscription && !hasEverSubscribed && recommendedPlan;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28, background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {(prenom.charAt(0) || 'P').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap' as const }}>Bonjour {prenom} 👋</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {[proProfile.pro_company_name, proProfile.pro_network, proProfile.pro_ville].filter(Boolean).join(' · ')}
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Pas d'abonnement ? Bandeau personnalisé avec plan recommandé ou bandeau générique */}
      {!subscription && (
        showRecommendedBanner ? (
          <div style={{ background: 'linear-gradient(135deg, #0a1f2d, #1a4a5e)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, border: '1px solid rgba(125,211,252,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>🎉</span>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Bienvenue sur Verimo Pro !</h3>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: '0 0 18px 0', lineHeight: 1.6 }}>
              Nous vous avons pré-sélectionné l'offre <strong style={{ color: '#7dd3fc' }}>{recommendedPlan.name}</strong> — {recommendedPlan.completes} analyse{recommendedPlan.completes > 1 ? 's' : ''} complète{recommendedPlan.completes > 1 ? 's' : ''} + {recommendedPlan.simples} simple{recommendedPlan.simples > 1 ? 's' : ''} à {recommendedPlan.price}€ HT/mois.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
              <Link to="/dashboard/abonnement" style={{ padding: '12px 24px', borderRadius: 12, background: '#fff', color: '#0f2d3d', textDecoration: 'none', fontSize: 14, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                Activer cette offre <ArrowRight size={14} />
              </Link>
              <Link to="/dashboard/abonnement" style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(255,255,255,0.15)' }}>
                Voir toutes les offres
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ background: 'linear-gradient(135deg, #0a1f2d, #1a4a5e)', borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Activez votre abonnement</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>Choisissez Découverte, Starter ou Power pour commencer à analyser vos dossiers.</p>
            </div>
            <Link to="/dashboard/abonnement" style={{ padding: '11px 24px', borderRadius: 10, background: '#fff', color: '#0f2d3d', textDecoration: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
              Voir les offres <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
            </Link>
          </div>
        )
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
      <div className="pro-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {/* Tile 1 — Dossiers analysés */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #edf2f7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2a7d9c12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen size={16} style={{ color: '#2a7d9c' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{completedAnalyses.length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Dossiers analysés</div>
        </div>

        {/* Tile 2 — Analyses (avec toggle Ce mois / Total + sous-texte) */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #edf2f7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#7c3aed12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} style={{ color: '#7c3aed' }} />
            </div>
            <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 7, padding: 2, border: '1px solid #edf2f7' }}>
              <button
                onClick={() => setAnalysesPeriod('month')}
                style={{ padding: '3px 8px', borderRadius: 5, background: analysesPeriod === 'month' ? '#fff' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: analysesPeriod === 'month' ? '#7c3aed' : '#94a3b8', boxShadow: analysesPeriod === 'month' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                Mois
              </button>
              <button
                onClick={() => setAnalysesPeriod('total')}
                style={{ padding: '3px 8px', borderRadius: 5, background: analysesPeriod === 'total' ? '#fff' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: analysesPeriod === 'total' ? '#7c3aed' : '#94a3b8', boxShadow: analysesPeriod === 'total' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                Total
              </button>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{periodAnalyses.length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
            {analysesPeriod === 'month' ? 'Ce mois' : 'Total'}
          </div>
          {(periodFailed > 0 || periodInProgress > 0) && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #edf2f7', fontSize: 10.5, color: '#64748b', fontWeight: 600, display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {periodInProgress > 0 && (
                <span style={{ color: '#d97706' }}>⏳ {periodInProgress} en cours</span>
              )}
              {periodFailed > 0 && (
                <span style={{ color: '#dc2626' }}>✕ {periodFailed} échouée{periodFailed > 1 ? 's' : ''}</span>
              )}
            </div>
          )}
        </div>

        {/* Tile 3 — Crédits restants */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #edf2f7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#16a34a12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} style={{ color: '#16a34a' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{creditsLeft}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Crédits restants</div>
        </div>

        {/* Tile 4 — Rapports envoyés */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #edf2f7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#d9770612', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} style={{ color: '#d97706' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{totalShares}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Rapports envoyés</div>
        </div>
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
              <div key={s.id} style={{ padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Send size={14} style={{ color: '#2a7d9c', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.recipient_firstname} {s.recipient_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{s.recipient_email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(s.sent_at)}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>·</span>
                  {s.opened_at ? (
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 100 }}>Ouvert</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: 100, border: '1px solid #e2e8f0' }}>En attente</span>
                  )}
                </div>
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
  const [folderToArchive, setFolderToArchive] = useState<ProFolder | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name' | 'analyses'>('recent');
  const [filter, setFilter] = useState<'all' | 'thisMonth' | 'withShares' | 'noAnalyses'>('all');
  const [archiveView, setArchiveView] = useState<'active' | 'archived'>('active');
  const [archiveToast, setArchiveToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

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

  // Filtrage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  let filtered = folders.filter(f => {
    // 🆕 Filtre principal : actifs vs archivés
    const isArchived = !!f.archived_at;
    if (archiveView === 'active' && isArchived) return false;
    if (archiveView === 'archived' && !isArchived) return false;

    if (search) {
      const q = search.toLowerCase();
      if (!(f.name.toLowerCase().includes(q) || (f.property_address || '').toLowerCase().includes(q) || (f.property_city || '').toLowerCase().includes(q))) return false;
    }
    if (filter === 'thisMonth') return f.created_at >= startOfMonth;
    if (filter === 'noAnalyses') return (f.analyses_count || 0) === 0;
    // withShares would need share data — for now, show folders with analyses > 0 as proxy
    if (filter === 'withShares') return (f.analyses_count || 0) > 0;
    return true;
  });

  // Tri
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'analyses') return (b.analyses_count || 0) - (a.analyses_count || 0);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(); // recent
  });

  const totalAnalyses = folders.reduce((sum, f) => sum + (f.analyses_count || 0), 0);

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

  async function handleArchiveToggle(folder: ProFolder) {
    const willArchive = !folder.archived_at;
    try {
      const { error } = await supabase
        .from('pro_folders')
        .update({ archived_at: willArchive ? new Date().toISOString() : null })
        .eq('id', folder.id);
      if (error) throw error;
      await loadFolders();
      setFolderToArchive(null);
      setArchiveToast({
        message: willArchive ? `📦 Dossier "${folder.name}" archivé` : `📂 Dossier "${folder.name}" restauré`,
        type: 'success',
      });
      setTimeout(() => setArchiveToast(null), 3000);
    } catch (e: any) {
      setArchiveToast({ message: 'Erreur : ' + (e.message || 'inconnue'), type: 'error' });
      setTimeout(() => setArchiveToast(null), 4000);
      throw e; // remonte l'erreur pour que le modal sache
    }
  }

  const filterOptions = [
    { key: 'all' as const, label: 'Tous' },
    { key: 'thisMonth' as const, label: 'Ce mois' },
    { key: 'withShares' as const, label: 'Avec analyses' },
    { key: 'noAnalyses' as const, label: 'Sans analyse' },
  ];

  const sortOptions = [
    { value: 'recent' as const, label: 'Plus récent' },
    { value: 'oldest' as const, label: 'Plus ancien' },
    { value: 'name' as const, label: 'Nom A→Z' },
    { value: 'analyses' as const, label: 'Plus d\'analyses' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Banner header */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FolderOpen size={20} style={{ color: '#2a7d9c' }} />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Mes dossiers</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
            {folders.length === 0 ? 'Organisez vos analyses par bien' : `${folders.length} dossier${folders.length > 1 ? 's' : ''} · ${totalAnalyses} analyse${totalAnalyses > 1 ? 's' : ''} au total`}
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 12px rgba(15,45,61,0.15)', whiteSpace: 'nowrap' as const }}>
          <Plus size={14} /> Créer un dossier
        </button>
      </div>

      {/* Toolbar : filters + search + sort + view toggle */}
      {folders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          {/* 🆕 Toggle Actifs / Archivés */}
          <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 10, padding: 4, border: '1px solid #edf2f7', width: 'fit-content' }}>
            <button onClick={() => setArchiveView('active')}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                background: archiveView === 'active' ? '#fff' : 'transparent',
                color: archiveView === 'active' ? '#0f172a' : '#94a3b8',
                boxShadow: archiveView === 'active' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex', alignItems: 'center', gap: 6 }}>
              📂 Actifs
              <span style={{ fontSize: 10.5, fontWeight: 700, color: archiveView === 'active' ? '#2a7d9c' : '#cbd5e1', background: archiveView === 'active' ? '#dbeef5' : 'transparent', padding: '1px 7px', borderRadius: 100 }}>
                {folders.filter(f => !f.archived_at).length}
              </span>
            </button>
            <button onClick={() => setArchiveView('archived')}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                background: archiveView === 'archived' ? '#fff' : 'transparent',
                color: archiveView === 'archived' ? '#0f172a' : '#94a3b8',
                boxShadow: archiveView === 'archived' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex', alignItems: 'center', gap: 6 }}>
              📦 Archivés
              <span style={{ fontSize: 10.5, fontWeight: 700, color: archiveView === 'archived' ? '#d97706' : '#cbd5e1', background: archiveView === 'archived' ? '#fef3c7' : 'transparent', padding: '1px 7px', borderRadius: 100 }}>
                {folders.filter(f => !!f.archived_at).length}
              </span>
            </button>
          </div>

          {/* Row 1 : filters pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            {filterOptions.map(f => {
              const active = filter === f.key;
              const count = f.key === 'all' ? folders.length : f.key === 'thisMonth' ? folders.filter(fo => fo.created_at >= startOfMonth).length : f.key === 'withShares' ? folders.filter(fo => (fo.analyses_count || 0) > 0).length : folders.filter(fo => (fo.analyses_count || 0) === 0).length;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: active ? '1.5px solid #2a7d9c' : '1px solid #edf2f7', background: active ? '#f0f7fb' : '#fff', color: active ? '#2a7d9c' : '#64748b', transition: 'all 0.15s' }}>
                  {f.label}
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#2a7d9c' : '#94a3b8', background: active ? '#dbeef5' : '#f1f5f9', padding: '1px 7px', borderRadius: 100, marginLeft: 2 }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2 : search + sort + view toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un dossier..."
                style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <ArrowUpDown size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                style={{ padding: '9px 12px 9px 30px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 12, fontWeight: 600, color: '#64748b', background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: 'inherit', appearance: 'none', paddingRight: 28, WebkitAppearance: 'none' }}>
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
            <div style={{ display: 'flex', borderRadius: 9, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
              <button onClick={() => setViewMode('grid')} title="Vue grille"
                style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'grid' ? '#f0f7fb' : '#fff', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? '#2a7d9c' : '#94a3b8', borderRight: '1px solid #edf2f7' }}>
                <LayoutGrid size={15} />
              </button>
              <button onClick={() => setViewMode('list')} title="Vue liste"
                style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'list' ? '#f0f7fb' : '#fff', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? '#2a7d9c' : '#94a3b8' }}>
                <LayoutList size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste / Grille */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #edf2f7' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', animation: 'spin 0.9s linear infinite', margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #edf2f7' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Folder size={28} style={{ color: '#2a7d9c' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            {search || filter !== 'all' ? 'Aucun dossier trouvé' : 'Aucun dossier pour le moment'}
          </h3>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px 0', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
            {search || filter !== 'all' ? "Essayez avec d'autres critères." : "Créez votre premier dossier pour organiser vos analyses par bien."}
          </p>
          {!search && filter === 'all' && (
            <button onClick={() => setShowCreateModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              <Plus size={14} /> Créer mon premier dossier
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={archiveView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {filtered.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}>
                <FolderCard folder={f}
                  onClick={() => navigate(`/dashboard/dossier/${f.id}`)}
                  onDelete={() => setFolderToDelete(f)}
                  onArchiveToggle={() => setFolderToArchive(f)} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Vue liste — tableau compact */
        <AnimatePresence mode="wait">
          <motion.div
            key={archiveView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', overflow: 'hidden' }}>
            {filtered.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: i * 0.025, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => navigate(`/dashboard/dossier/${f.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s', opacity: f.archived_at ? 0.75 : 1 }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#fafcfd'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Folder size={16} style={{ color: '#2a7d9c' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.name}</span>
                    {f.archived_at && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#7c2d12', background: '#fed7aa', padding: '2px 6px', borderRadius: 5, letterSpacing: '0.04em', flexShrink: 0 }}>📦 ARCHIVÉ</span>
                    )}
                  </div>
                  {(f.property_address || f.property_city) && (
                    <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <MapPin size={10} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{[f.property_address, f.property_city].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: (f.analyses_count || 0) > 0 ? '#2a7d9c' : '#94a3b8' }}>{f.analyses_count || 0} analyse{(f.analyses_count || 0) > 1 ? 's' : ''}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{f.sellers_count || 0} vendeur{(f.sellers_count || 0) > 1 ? 's' : ''}</span>
                  <span style={{ fontSize: 11, color: '#cbd5e1' }}>{fmtDate(f.updated_at)}</span>
                </div>
                <ChevronRight size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
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

      {/* Modale archivage / restauration */}
      <AnimatePresence>
        {folderToArchive && (
          <ModalArchiveFolder
            folder={folderToArchive}
            mode={folderToArchive.archived_at ? 'restore' : 'archive'}
            onClose={() => setFolderToArchive(null)}
            onConfirm={() => handleArchiveToggle(folderToArchive)}
          />
        )}
      </AnimatePresence>

      {/* Toast archive */}
      <AnimatePresence>
        {archiveToast && <Toast message={archiveToast.message} type={archiveToast.type} />}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   FOLDER CARD — Carte d'un dossier dans la liste
══════════════════════════════════════════ */
function FolderCard({ folder, onClick, onDelete, onArchiveToggle }: { folder: ProFolder; onClick: () => void; onDelete: () => void; onArchiveToggle: () => void }) {
  const hasAddress = folder.property_address || folder.property_city;
  const isArchived = !!folder.archived_at;
  const stats = [
    { label: folder.analyses_count === 1 ? 'analyse' : 'analyses', value: folder.analyses_count || 0, color: '#2a7d9c' },
    { label: folder.sellers_count === 1 ? 'vendeur' : 'vendeurs', value: folder.sellers_count || 0, color: '#7c3aed' },
    { label: folder.buyers_count === 1 ? 'acheteur' : 'acheteurs', value: folder.buyers_count || 0, color: '#16a34a' },
  ];
  return (
    <div onClick={onClick}
      style={{ background: isArchived ? '#fafafa' : '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: 18, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', opacity: isArchived ? 0.85 : 1 }}
      onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.boxShadow = '0 8px 24px rgba(42,125,156,0.08)'; el.style.transform = 'translateY(-2px)'; }}
      onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)'; }}>

      {/* Boutons d'action (apparaissent au hover) */}
      <div style={{ position: 'absolute' as const, top: 10, right: 10, display: 'flex', gap: 6, opacity: 0, transition: 'opacity 0.15s', zIndex: 2 }} className="folder-actions-btns">
        <button onClick={e => { e.stopPropagation(); onArchiveToggle(); }} title={isArchived ? 'Restaurer' : 'Archiver ce dossier'}
          style={{ width: 28, height: 28, borderRadius: 7, background: isArchived ? '#f0fdf4' : '#fff7ed', border: `1px solid ${isArchived ? '#bbf7d0' : '#fed7aa'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12 }}>{isArchived ? '📂' : '📦'}</span>
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Supprimer ce dossier"
          style={{ width: 28, height: 28, borderRadius: 7, background: '#fef2f2', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={13} style={{ color: '#dc2626' }} />
        </button>
      </div>

      <style>{`
        div:hover > .folder-actions-btns { opacity: 1 !important; }
      `}</style>

      {/* Badge archivé — dans le flux, au-dessus du titre */}
      {isArchived && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, color: '#7c2d12', background: '#fed7aa', padding: '3px 8px', borderRadius: 6, letterSpacing: '0.04em', marginBottom: 10 }}>
          <span style={{ fontSize: 11 }}>📦</span> ARCHIVÉ
        </div>
      )}

      {/* Icône + Nom */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Folder size={18} style={{ color: '#2a7d9c' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 70 }}>
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
  const skipAddressAutoRef = useRef(false);
  const skipPostalAutoRef = useRef(false);

  // Auto-génération du nom du dossier
  useEffect(() => {
    if (nameTouched) return;
    const parts = [];
    if (address.trim()) parts.push(address.trim());
    if (city.trim()) parts.push(city.trim());
    setName(parts.join(', '));
  }, [address, city, nameTouched]);

  // Auto-complétion code postal → ville
  useEffect(() => {
    if (skipPostalAutoRef.current) { skipPostalAutoRef.current = false; return; }
    const cp = postalCode.trim();
    if (cp.length !== 5) {
      setCityOptions([]);
      if (cp.length === 0 && lastPostalCodeQueriedRef.current) {
        setCity('');
        lastPostalCodeQueriedRef.current = '';
      }
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
          if (cities.length === 1) setCity(cities[0]);
        } else {
          setCityOptions([]);
        }
      })
      .catch(() => setCityOptions([]))
      .finally(() => setCityLoading(false));
  }, [postalCode]);

  // Autocomplétion adresse via API Etalab
  useEffect(() => {
    if (skipAddressAutoRef.current) { skipAddressAutoRef.current = false; return; }
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
    let streetOnly = s.label;
    if (s.city) streetOnly = streetOnly.replace(new RegExp(`\\s*,?\\s*${s.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '');
    if (s.postcode) streetOnly = streetOnly.replace(new RegExp(`\\s*,?\\s*${s.postcode}\\s*`, 'g'), ' ');
    streetOnly = streetOnly.replace(/,\s*$/, '').trim();
    skipAddressAutoRef.current = true;
    skipPostalAutoRef.current = true;
    setAddress(streetOnly);
    if (s.postcode) { lastPostalCodeQueriedRef.current = s.postcode; setPostalCode(s.postcode); }
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
          <button onClick={onClose} title="Fermer" className="modal-close-btn"
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
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
          <Field label="Note interne" optional icon={FileText} tooltip="Ces informations sont strictement privées et uniquement accessibles par vous. Utilisez cet espace pour noter tout élément utile au suivi de ce dossier.">
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
  const skipAddressAutoRef = useRef(false);
  const skipPostalAutoRef = useRef(false);

  // Auto-complétion code postal → ville
  useEffect(() => {
    if (skipPostalAutoRef.current) { skipPostalAutoRef.current = false; return; }
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
    if (skipAddressAutoRef.current) { skipAddressAutoRef.current = false; return; }
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
    let streetOnly = s.label;
    if (s.city) streetOnly = streetOnly.replace(new RegExp(`\\s*,?\\s*${s.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '');
    if (s.postcode) streetOnly = streetOnly.replace(new RegExp(`\\s*,?\\s*${s.postcode}\\s*`, 'g'), ' ');
    streetOnly = streetOnly.replace(/,\s*$/, '').trim();
    skipAddressAutoRef.current = true;
    skipPostalAutoRef.current = true;
    setAddress(streetOnly);
    if (s.postcode) { lastPostalCodeQueriedRef.current = s.postcode; setPostalCode(s.postcode); }
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
          <button onClick={onClose} title="Fermer" className="modal-close-btn"
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
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
          <Field label="Note interne" optional icon={FileText} tooltip="Ces informations sont strictement privées et uniquement accessibles par vous. Utilisez cet espace pour noter tout élément utile au suivi de ce dossier.">
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
          <button onClick={onClose} title="Fermer" className="modal-close-btn"
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
   MODALE ARCHIVAGE / RESTAURATION
══════════════════════════════════════════ */
function ModalArchiveFolder({ folder, mode, onClose, onConfirm }: {
  folder: ProFolder;
  mode: 'archive' | 'restore';
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !submitting) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const isArchive = mode === 'archive';

  // Couleurs selon le mode
  const colors = isArchive ? {
    headerBg: 'linear-gradient(135deg, #fff7ed, #fed7aa)',
    headerBorder: '#fed7aa',
    iconBg: 'linear-gradient(135deg, #fed7aa, #fdba74)',
    iconColor: '#9a3412',
    iconShadow: '0 6px 20px rgba(154,52,18,0.18)',
    subtitle: '#9a3412',
    btnBg: 'linear-gradient(135deg, #ea580c, #c2410c)',
    btnShadow: '0 4px 14px rgba(234,88,12,0.35)',
    closeIconColor: '#7c2d12',
    closeBorder: 'rgba(154,52,18,0.18)',
  } : {
    headerBg: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
    headerBorder: '#bbf7d0',
    iconBg: 'linear-gradient(135deg, #bbf7d0, #86efac)',
    iconColor: '#15803d',
    iconShadow: '0 6px 20px rgba(21,128,61,0.18)',
    subtitle: '#15803d',
    btnBg: 'linear-gradient(135deg, #16a34a, #15803d)',
    btnShadow: '0 4px 14px rgba(22,163,74,0.35)',
    closeIconColor: '#14532d',
    closeBorder: 'rgba(21,128,61,0.18)',
  };

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <motion.div
        className="archive-modal-card"
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 460, boxShadow: '0 30px 80px rgba(15,45,61,0.35)', overflow: 'hidden' }}>

        {/* Header */}
        <div className="archive-modal-header" style={{ padding: '26px 28px 22px', textAlign: 'center', background: colors.headerBg, position: 'relative', borderBottom: `1px solid ${colors.headerBorder}` }}>
          <button onClick={onClose} disabled={submitting} title="Fermer"
            style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.85)', border: `1px solid ${colors.closeBorder}`, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: submitting ? 0.5 : 1 }}>
            <X size={14} style={{ color: colors.closeIconColor }} />
          </button>
          <motion.div
            className="archive-modal-icon"
            initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
            style={{ width: 56, height: 56, borderRadius: 14, background: colors.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: colors.iconShadow, fontSize: 26 }}>
            {isArchive ? '📦' : '📂'}
          </motion.div>
          <h2 className="archive-modal-title" style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: 6 }}>
            {isArchive ? 'Archiver ce dossier ?' : 'Restaurer ce dossier ?'}
          </h2>
          <p className="archive-modal-subtitle" style={{ fontSize: 13, color: colors.subtitle, margin: 0, fontWeight: 500 }}>
            {isArchive ? 'Vous pourrez le restaurer à tout moment.' : 'Le dossier redeviendra entièrement actif.'}
          </p>
        </div>

        {/* Body */}
        <div className="archive-modal-body" style={{ padding: '22px 28px 18px' }}>

          {/* Carte du dossier */}
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

          {/* Texte explicatif selon le mode */}
          {isArchive ? (
            <div>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 14px 0', lineHeight: 1.6 }}>
                Au fil du temps, votre liste de dossiers s'agrandit. <strong style={{ color: '#9a3412' }}>L'archivage vous aide à garder une vue claire sur ceux qui sont vraiment en cours</strong>, sans perdre l'historique des autres.
              </p>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', marginBottom: 9 }}>
                  Archivez par exemple :
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12.5, color: '#78350f', lineHeight: 1.85 }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 14 }}>🎉</span> Les ventes abouties</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 14 }}>🤝</span> Les mandats terminés</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 14 }}>⏸️</span> Les dossiers en pause</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 14 }}>🚫</span> Les projets abandonnés</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 14 }}>🔄</span> Les mandats partis chez un confrère</li>
                </ul>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '12px 0 0 0', lineHeight: 1.5, fontStyle: 'italic' as const }}>
                Tout reste consultable dans l'onglet 📦 Archivés, et la restauration se fait en un clic.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px 0', lineHeight: 1.55 }}>
                Le dossier redeviendra <strong style={{ color: '#15803d' }}>actif</strong> et apparaîtra à nouveau dans votre liste principale.
              </p>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✓</span> Toutes les actions seront à nouveau disponibles :
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#14532d', lineHeight: 1.7 }}>
                  <li>Ajout de vendeurs et acheteurs</li>
                  <li>Lancement d'analyses</li>
                  <li>Modification des informations</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="archive-modal-footer" style={{ display: 'flex', gap: 10, padding: '14px 28px 22px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={submitting}
            style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{
              padding: '10px 18px', borderRadius: 10, background: colors.btnBg, color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 700,
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: colors.btnShadow, opacity: submitting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {submitting
              ? (isArchive ? 'Archivage…' : 'Restauration…')
              : <>{isArchive ? '📦 Archiver' : '📂 Restaurer'}</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
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
  const [clicked, setClicked] = useState(false);

  return (
    <>
      <span
        onMouseEnter={() => { if (window.innerWidth > 768 && !clicked) setShow(true); }}
        onMouseLeave={() => { if (window.innerWidth > 768 && !clicked) setShow(false); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setClicked(true); setShow(true); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: show ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#cbd5e1',
          color: show ? '#fff' : '#475569',
          fontSize: 10,
          fontWeight: 800,
          cursor: 'help',
          textTransform: 'none' as const,
          letterSpacing: 0,
          transition: 'all 0.15s',
          flexShrink: 0,
          userSelect: 'none' as const,
        }}>
        i
      </span>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => { e.stopPropagation(); setShow(false); setClicked(false); }}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: clicked ? 'rgba(15,45,61,0.35)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: clicked ? 'auto' : 'none' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, #1e3a4d, #0f2d3d)',
                color: '#fff',
                padding: '18px 22px',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.65,
                maxWidth: 340,
                width: '100%',
                boxShadow: '0 20px 60px rgba(15,45,61,0.4)',
                textAlign: 'left' as const,
                position: 'relative' as const,
                pointerEvents: 'auto' as const,
              }}>
              {text}
              <button
                onClick={() => { setShow(false); setClicked(false); }}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 700 }}>
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
function MonAbonnement({ subscription, hasEverSubscribed, proProfile }: { subscription: ProSubscription | null; hasEverSubscribed: boolean; proProfile: ProProfile }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Plan recommandé par l'admin
  const PLAN_INFO_MAP: Record<string, { name: string; price: string; completes: number; simples: number }> = {
    decouverte: { name: 'Découverte', price: '19,90', completes: 1, simples: 3 },
    starter: { name: 'Starter', price: '49,90', completes: 5, simples: 15 },
    power: { name: 'Power', price: '89,90', completes: 10, simples: 30 },
  };
  const recommendedPlanId = proProfile?.pro_recommended_plan || '';
  const recommendedPlan = PLAN_INFO_MAP[recommendedPlanId] || null;
  const showRecommendedBanner = !subscription && !hasEverSubscribed && recommendedPlan;

  // Code promo
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [promoSuccessPopup, setPromoSuccessPopup] = useState<{ message: string } | null>(null);

  const handlePromoApply = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError(''); setPromoSuccess('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Vérifier le code
      const { data: promo, error: promoErr } = await supabase.from('promo_codes').select('*').eq('code', promoCode.trim().toUpperCase()).eq('active', true).single();
      if (promoErr || !promo) { setPromoError('Code invalide ou expiré.'); setPromoLoading(false); return; }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) { setPromoError('Ce code a expiré.'); setPromoLoading(false); return; }
      if (promo.max_uses && promo.uses_count >= promo.max_uses) { setPromoError("Ce code a atteint sa limite d'utilisation."); setPromoLoading(false); return; }
      if (promo.restricted_email && promo.restricted_email !== user.email) { setPromoError("Ce code n'est pas disponible pour votre compte."); setPromoLoading(false); return; }

      // Vérifier anti-doublon
      const { data: alreadyUsed } = await supabase.from('promo_uses').select('id').eq('code_id', promo.id).eq('user_id', user.id).single();
      if (alreadyUsed) { setPromoError('Vous avez déjà utilisé ce code.'); setPromoLoading(false); return; }

      if (promo.type !== 'credits') { setPromoError('Ce code n\'est pas compatible avec votre compte pro.'); setPromoLoading(false); return; }

      const creditType = promo.credit_type === 'document' ? 'document' : 'complete';
      const toAdd = promo.value;

      // Ajouter via credit_grants (le trigger crée la ligne pro_unit_purchases)
      const { error: grantErr } = await supabase.from('credit_grants').insert({
        user_id: user.id,
        granted_by: null,
        credit_type: creditType,
        quantity: toAdd,
        reason: `Code promo ${promo.code}`,
      });
      if (grantErr) throw new Error('Impossible d\'ajouter les crédits.');

      // Enregistrer l'usage
      await supabase.from('promo_uses').insert({ code_id: promo.id, user_id: user.id });
      await supabase.rpc('increment_promo_uses', { code_id: promo.id });

      // Enregistrer dans payments pour l'historique
      await supabase.from('payments').insert({
        user_id: user.id,
        amount: 0,
        currency: 'eur',
        description: `${toAdd} crédit${toAdd > 1 ? 's' : ''} ${creditType === 'complete' ? 'Complète' : 'Simple'} offert${toAdd > 1 ? 's' : ''} · Code ${promo.code}`,
        promo_code: promo.code,
        credits_added: toAdd,
        credit_type: creditType,
        status: 'completed',
      });

      setPromoSuccess(`+${toAdd} crédit${toAdd > 1 ? 's' : ''} ${creditType === 'complete' ? 'Complète' : 'Simple'} ajouté${toAdd > 1 ? 's' : ''} !`);
      setPromoSuccessPopup({ message: `🎉 +${toAdd} crédit${toAdd > 1 ? 's' : ''} ${creditType === 'complete' ? 'Complète' : 'Simple'} ajouté${toAdd > 1 ? 's' : ''} sur votre compte !` });
      setPromoCode('');

      // Rafraîchir les factures (le useEffect sur invoices se relance via setInvoicesLoading)
      setInvoicesLoading(true);
      try {
        const { data: { session: s2 } } = await supabase.auth.getSession();
        if (s2) {
          const r2 = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s2.access_token}` },
            body: JSON.stringify({ mode: 'list_invoices' }),
          });
          const d2 = await r2.json();
          if (d2.invoices) setInvoices(d2.invoices);
        }
      } catch { /* silent */ }
      setInvoicesLoading(false);
    } catch (e) { setPromoError((e as Error).message); }
    setPromoLoading(false);
  };

  const plans = [
    { id: 'decouverte', name: 'Découverte', price: '19,90', completes: 1, simples: 3, popular: false, tagline: 'Pour découvrir Verimo Pro' },
    { id: 'starter', name: 'Starter', price: '49,90', completes: 5, simples: 15, popular: true, tagline: 'Pour un usage régulier' },
    { id: 'power', name: 'Power', price: '89,90', completes: 10, simples: 30, popular: false, tagline: 'Pour un usage soutenu' },
  ];

  const isSubscribed = subscription?.status === 'active';

  // Détecter le retour de Stripe Checkout (?checkout=success ou ?checkout=cancel)
  const [successPopup, setSuccessPopup] = useState<'subscribe' | 'upgrade' | 'unit' | 'reactivate' | null>(null);

  // Popup confirmation upgrade avec récap TVA + 3D Secure inline
  // États du flow : null (fermé) | 'preview' (récap) | 'loading' (paiement) | 'success' | 'error'
  type UpgradeFlowState = null | 'preview' | 'loading' | 'success' | 'error';
  type UpgradePreview = {
    is_upgrade: boolean;
    is_downgrade: boolean;
    current_plan: string;
    current_plan_label: string;
    new_plan: string;
    new_plan_label: string;
    amount_ht_str: string;
    amount_tva_str: string;
    amount_ttc_str: string;
    next_billing_date: string;
    current_credits: { complete: number; simple: number };
    new_credits: { complete: number; simple: number };
    immediate_payment: boolean;
  };
  const [upgradeFlow, setUpgradeFlow] = useState<UpgradeFlowState>(null);
  const [upgradePreview, setUpgradePreview] = useState<UpgradePreview | null>(null);
  const [upgradeLoadingMsg, setUpgradeLoadingMsg] = useState<string>('Mise à jour de votre plan…');
  const [upgradeError, setUpgradeError] = useState<string>('');
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState<string>('');
  const [upgradeSuccessData, setUpgradeSuccessData] = useState<{
    plan_label: string;
    amount: string;
    new_credits: { complete: number; simple: number };
    next_billing: string;
    is_downgrade: boolean;
    switch_date?: string;
  } | null>(null);

  // Ouvrir le popup d'upgrade : appelle preview_upgrade pour obtenir le récap
  async function openUpgradeFlow(targetPlan: string) {
    setUpgradeTargetPlan(targetPlan);
    setUpgradeError('');
    setUpgradeFlow('preview');
    setUpgradePreview(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Vous devez être connecté');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode: 'preview_upgrade', plan: targetPlan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du calcul du récapitulatif');

      setUpgradePreview(data);
    } catch (e: any) {
      setUpgradeError(e.message || 'Une erreur est survenue');
      setUpgradeFlow('error');
    }
  }

  // Confirmer l'upgrade : appelle l'edge function et gère 3D Secure inline si besoin
  async function confirmUpgradeFlow() {
    if (!upgradePreview || !upgradeTargetPlan) return;
    setUpgradeFlow('loading');
    setUpgradeError('');
    setUpgradeLoadingMsg(upgradePreview.is_downgrade ? 'Programmation du changement…' : 'Mise à jour de votre plan…');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Vous devez être connecté');

      // 1. Appel à l'edge function (subscribe = upgrade ou downgrade selon le plan)
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode: 'subscribe', plan: upgradeTargetPlan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du changement de plan');

      // 2. Cas downgrade : changement programmé
      if (data.scheduled) {
        setUpgradeSuccessData({
          plan_label: upgradePreview.new_plan_label,
          amount: '0,00€',
          new_credits: upgradePreview.new_credits,
          next_billing: data.switch_date || upgradePreview.next_billing_date,
          is_downgrade: true,
          switch_date: data.switch_date,
        });
        setUpgradeFlow('success');
        return;
      }

      // 3. Cas 3D Secure requis → utiliser Stripe.js pour confirmer
      if (data.requires_action && data.client_secret) {
        setUpgradeLoadingMsg('Validation 3D Secure en cours…');
        const stripe = await getStripe();
        if (!stripe) throw new Error('Stripe.js n\'a pas pu être chargé');

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(data.client_secret);

        if (confirmError) {
          throw new Error(confirmError.message || 'Validation 3D Secure échouée');
        }

        if (paymentIntent?.status !== 'succeeded') {
          throw new Error('Le paiement n\'a pas pu être finalisé. Veuillez réessayer.');
        }
        // Si on arrive ici, le paiement est validé : on tombe dans le succès
      }

      // 4. Succès (avec ou sans 3DS)
      setUpgradeLoadingMsg('Activation de vos crédits…');
      // Petit délai pour que le webhook ait le temps de tomber côté serveur
      await new Promise(r => setTimeout(r, 1200));

      setUpgradeSuccessData({
        plan_label: upgradePreview.new_plan_label,
        amount: upgradePreview.amount_ttc_str,
        new_credits: upgradePreview.new_credits,
        next_billing: upgradePreview.next_billing_date,
        is_downgrade: false,
      });
      setUpgradeFlow('success');
    } catch (e: any) {
      console.error('[upgrade-flow] error:', e);
      setUpgradeError(e.message || 'Une erreur est survenue lors du paiement');
      setUpgradeFlow('error');
    }
  }

  function closeUpgradeFlow() {
    if (upgradeFlow === 'loading') return; // Pas de fermeture pendant le paiement
    setUpgradeFlow(null);
    setUpgradePreview(null);
    setUpgradeError('');
    setUpgradeSuccessData(null);
  }

  function reloadAfterSuccess() {
    window.location.reload();
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    const checkout = url.searchParams.get('checkout');
    const checkoutType = url.searchParams.get('type'); // subscribe, upgrade, unit
    if (checkout === 'success') {
      setErrorMsg('');
      url.searchParams.delete('checkout');
      url.searchParams.delete('type');
      window.history.replaceState({}, '', url.toString());
      setSuccessPopup(checkoutType === 'unit' ? 'unit' : checkoutType === 'upgrade' ? 'upgrade' : 'subscribe');
    } else if (checkout === 'cancel') {
      setErrorMsg('Paiement annulé. Vous pouvez réessayer quand vous voulez.');
      url.searchParams.delete('checkout');
      url.searchParams.delete('type');
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
        // Cas upgrade direct (sans Checkout)
        setSuccessPopup('upgrade');
        setLoading(null);
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

  // ── Cancel flow ──
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2 | 3>(0); // 0=hidden, 1=confirm, 2=reason, 3=done
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── Billing portal ──
  async function handleBillingPortal() {
    setLoading('billing_portal');
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Vous devez être connecté');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode: 'billing_portal' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Une erreur est survenue');
    }
    setLoading(null);
  }

  const CANCEL_REASONS = [
    "Je n'utilise pas assez mes crédits chaque mois",
    "C'est trop cher pour mon usage",
    "Il manque des fonctionnalités dont j'ai besoin",
    "Je change d'outil ou d'organisation",
    "Le service ne correspond pas à mes attentes",
    "Je ne souhaite pas répondre",
  ];

  async function handleCancelSubscription() {
    setCancelLoading(true);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Vous devez être connecté');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode: 'cancel', reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la résiliation');

      setCancelStep(3);
    } catch (e: any) {
      setErrorMsg(e.message || 'Une erreur est survenue');
      setCancelStep(0);
    }
    setCancelLoading(false);
  }

  async function handleReactivate() {
    setLoading('reactivate');
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Vous devez être connecté');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode: 'reactivate' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la réactivation');

      setSuccessPopup('reactivate');
    } catch (e: any) {
      setErrorMsg(e.message || 'Une erreur est survenue');
    }
    setLoading(null);
  }

  // ── Invoices ──
  type InvoiceItem = { id: string; date: string; description: string; amount: string; pdf_url: string | null; type: 'subscription' | 'unit' | 'promo' | 'grant' };
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setInvoicesLoading(false); return; }

      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://veszrayromldfgetqaxb.supabase.co'}/functions/v1/pro-checkout-create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ mode: 'list_invoices' }),
        });
        const data = await res.json();
        if (data.invoices) setInvoices(data.invoices);
      } catch { /* silent */ }
      setInvoicesLoading(false);
    })();
  }, [successPopup, cancelStep]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Cancel Step 1: Popup émotionnel ── */}
      <AnimatePresence>
        {cancelStep === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}
            onClick={() => setCancelStep(0)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>😢</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>
                Vous souhaitez nous quitter ?
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 8 }}>
                Votre abonnement reste actif jusqu'au <strong style={{ color: '#0f172a' }}>{subscription?.current_period_end ? fmtDate(subscription.current_period_end) : '—'}</strong>.
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
                Après cette date, vous perdrez l'accès à vos crédits d'abonnement. Vos crédits unitaires achetés resteront disponibles.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => setCancelStep(0)}
                  style={{ padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
                  Je reste 💪
                </button>
                <button onClick={() => setCancelStep(2)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#94a3b8', padding: '8px' }}>
                  Continuer la résiliation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cancel Step 2: Raison de départ ── */}
      <AnimatePresence>
        {cancelStep === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}
            onClick={() => setCancelStep(0)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #fed7aa' }}>
                <FileText size={26} style={{ color: '#ea580c' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Avant de partir, aidez-nous à nous améliorer</h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 22 }}>Pourriez-vous nous dire pourquoi vous résiliez ?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, textAlign: 'left' }}>
                {CANCEL_REASONS.map(reason => (
                  <label key={reason} onClick={() => setCancelReason(reason)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12,
                      background: cancelReason === reason ? '#f0f7fb' : '#f8fafc',
                      border: cancelReason === reason ? '2px solid #2a7d9c' : '1.5px solid #edf2f7',
                      cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: cancelReason === reason ? '5px solid #2a7d9c' : '2px solid #cbd5e1', flexShrink: 0, background: '#fff' }} />
                    <span style={{ fontSize: 13, fontWeight: cancelReason === reason ? 600 : 500, color: cancelReason === reason ? '#0f172a' : '#475569' }}>{reason}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setCancelStep(0); setCancelReason(''); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 14, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button disabled={!cancelReason || cancelLoading} onClick={handleCancelSubscription}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: cancelReason ? '#dc2626' : '#e5e7eb', fontSize: 14, fontWeight: 700, color: '#fff',
                    cursor: cancelReason ? (cancelLoading ? 'wait' : 'pointer') : 'default', opacity: cancelLoading ? 0.6 : 1 }}>
                  {cancelLoading ? 'Résiliation…' : 'Confirmer la résiliation'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cancel Step 3: Popup confirmation résiliation ── */}
      <AnimatePresence>
        {cancelStep === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}
            onClick={() => { setCancelStep(0); window.location.reload(); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #fed7aa' }}>
                <XCircle size={36} style={{ color: '#ea580c' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Abonnement résilié</h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 12 }}>
                Votre accès reste actif jusqu'au <strong style={{ color: '#0f172a' }}>{subscription?.current_period_end ? fmtDate(subscription.current_period_end) : '—'}</strong>.
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
                Vous pouvez vous réabonner à tout moment depuis cette page.
              </p>
              <button onClick={() => { setCancelStep(0); window.location.reload(); }}
                style={{ padding: '12px 28px', borderRadius: 12, background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message d'erreur global */}
      {errorMsg && (
        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 14, fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* Popup succès paiement */}
      <AnimatePresence>
        {successPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}
            onClick={() => { setSuccessPopup(null); window.location.reload(); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', position: 'relative' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #bbf7d0' }}>
                <CheckCircle size={36} style={{ color: '#16a34a' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
                {successPopup === 'subscribe' ? 'Abonnement activé !' : successPopup === 'upgrade' ? 'Plan mis à jour !' : successPopup === 'reactivate' ? 'Abonnement réactivé !' : 'Crédits ajoutés !'}
              </h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
                {successPopup === 'subscribe'
                  ? 'Votre abonnement Verimo Pro est maintenant actif. Vos crédits sont disponibles immédiatement.'
                  : successPopup === 'upgrade'
                  ? 'Votre plan a été mis à jour avec succès. Vos nouveaux crédits sont disponibles.'
                  : successPopup === 'reactivate'
                  ? 'Votre abonnement a été réactivé. Votre accès continue sans interruption.'
                  : 'Vos crédits supplémentaires ont été ajoutés à votre compte.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/dashboard/nouvelle-analyse"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 24px rgba(15,45,61,0.2)' }}>
                  Lancer une analyse <ArrowRight size={16} />
                </Link>
                <button onClick={() => { setSuccessPopup(null); window.location.reload(); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#94a3b8', padding: '8px' }}>
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bandeau plan recommandé (uniquement pour les nouveaux pros jamais abonnés) ── */}
      {showRecommendedBanner && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ background: 'linear-gradient(135deg, #0a1f2d, #1a4a5e)', borderRadius: 16, padding: '22px 26px', marginBottom: 24, border: '1px solid rgba(125,211,252,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Offre recommandée pour vous</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px 0', lineHeight: 1.5 }}>
            L'offre <strong style={{ color: '#7dd3fc' }}>{recommendedPlan.name}</strong> a été pré-sélectionnée pour votre activité — {recommendedPlan.completes} complète{recommendedPlan.completes > 1 ? 's' : ''} + {recommendedPlan.simples} simple{recommendedPlan.simples > 1 ? 's' : ''} à <strong style={{ color: '#fff' }}>{recommendedPlan.price}€ HT/mois</strong>. Vous pouvez choisir une autre offre ci-dessous.
          </p>
        </motion.div>
      )}

      {/* ── Popup Upgrade Flow : 4 états (preview → loading → success / error) ── */}
      <AnimatePresence>
        {upgradeFlow !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', padding: 16, backdropFilter: 'blur(4px)' }}
            onClick={closeUpgradeFlow}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', maxWidth: 480, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>

              {/* ═══ ÉTAT 1 : PREVIEW (récap avant validation) ═══ */}
              {upgradeFlow === 'preview' && (
                <>
                  {!upgradePreview && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ width: 40, height: 40, border: '3px solid #f0f7fb', borderTopColor: '#2a7d9c', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
                      <p style={{ fontSize: 13, color: '#64748b', marginTop: 16 }}>Calcul du récapitulatif…</p>
                    </div>
                  )}

                  {upgradePreview && (
                    <>
                      {/* Header */}
                      <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: upgradePreview.is_upgrade ? 'linear-gradient(135deg, #f0f7fb, #e0f0f6)' : 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: upgradePreview.is_upgrade ? '2px solid #d0e8f0' : '2px solid #fcd34d' }}>
                          <ArrowRight size={24} style={{ color: upgradePreview.is_upgrade ? '#2a7d9c' : '#d97706' }} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.02em' }}>
                          {upgradePreview.is_upgrade ? `Passer à ${upgradePreview.new_plan_label}` : `Passer à ${upgradePreview.new_plan_label}`}
                        </h2>
                        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                          {upgradePreview.is_upgrade
                            ? 'Votre nouveau plan prend effet immédiatement.'
                            : `Votre nouveau plan prendra effet le ${upgradePreview.next_billing_date}.`}
                        </p>
                      </div>

                      {/* Bandeau info downgrade */}
                      {upgradePreview.is_downgrade && (
                        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
                          <p style={{ fontSize: 12.5, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                            💡 D'ici la bascule, vous gardez votre plan {upgradePreview.current_plan_label} et vos crédits actuels.
                          </p>
                        </div>
                      )}

                      {/* Récap plan */}
                      <div style={{ background: '#f8fafc', borderRadius: 16, padding: '20px', marginBottom: 16, border: '1.5px solid #edf2f7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Plan {upgradePreview.new_plan_label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: '#f0f7fb', padding: '3px 10px', borderRadius: 100 }}>Mensuel</span>
                        </div>

                        {/* Crédits avant / après */}
                        <div style={{ marginBottom: 14, padding: '12px', background: '#fff', borderRadius: 10, border: '1px solid #edf2f7' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Vos crédits après le changement</p>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Complètes</div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{upgradePreview.new_credits.complete}</div>
                              {upgradePreview.current_credits.complete > 0 && (
                                <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
                                  ({upgradePreview.current_credits.complete} actuel + cumul)
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Simples</div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{upgradePreview.new_credits.simple}</div>
                              {upgradePreview.current_credits.simple > 0 && (
                                <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
                                  ({upgradePreview.current_credits.simple} actuel + cumul)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Détail prix (uniquement upgrade) */}
                        {upgradePreview.is_upgrade && (
                          <div style={{ borderTop: '1px solid #edf2f7', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>À payer aujourd'hui</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: '#64748b' }}>Prix HT</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{upgradePreview.amount_ht_str}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: '#64748b' }}>TVA (20%)</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>{upgradePreview.amount_tva_str}</span>
                            </div>
                            <div style={{ borderTop: '1.5px solid #d0e8f0', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Total TTC</span>
                              <span style={{ fontSize: 20, fontWeight: 900, color: '#2a7d9c' }}>{upgradePreview.amount_ttc_str}</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
                              Prochain prélèvement : {upgradePreview.next_billing_date}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Mention plafond crédits */}
                      <p style={{ fontSize: 11.5, color: '#64748b', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>
                        💡 Vos crédits abonnement non utilisés sont reportés sur le mois suivant. Ils restent valables 2 mois après leur attribution.
                      </p>

                      {/* Boutons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button
                          onClick={confirmUpgradeFlow}
                          style={{
                            width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 800,
                            boxShadow: '0 8px 24px rgba(15,45,61,0.2)',
                            transition: 'all 0.2s',
                          }}>
                          {upgradePreview.is_upgrade ? `Confirmer et payer ${upgradePreview.amount_ttc_str}` : 'Confirmer le changement'}
                        </button>
                        <button onClick={closeUpgradeFlow}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#94a3b8', padding: '8px' }}>
                          Annuler
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ═══ ÉTAT 2 : LOADING (paiement en cours) ═══ */}
              {upgradeFlow === 'loading' && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 56, height: 56, border: '4px solid #f0f7fb', borderTopColor: '#2a7d9c', borderRadius: '50%', margin: '0 auto 24px' }}
                  />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>
                    {upgradeLoadingMsg}
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                    Merci de patienter quelques instants.<br/>
                    Ne fermez pas cette fenêtre.
                  </p>
                </div>
              )}

              {/* ═══ ÉTAT 3 : SUCCESS (plan activé) ═══ */}
              {upgradeFlow === 'success' && upgradeSuccessData && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
                    style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 12px 32px rgba(22,163,74,0.3)' }}>
                    <CheckCircle size={36} style={{ color: '#fff' }} />
                  </motion.div>

                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>
                    {upgradeSuccessData.is_downgrade ? 'Changement programmé !' : `Plan ${upgradeSuccessData.plan_label} activé !`}
                  </h2>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 22, lineHeight: 1.6, padding: '0 8px' }}>
                    {upgradeSuccessData.is_downgrade
                      ? `Vous passerez en ${upgradeSuccessData.plan_label} le ${upgradeSuccessData.switch_date}. D'ici là, vous gardez votre plan actuel.`
                      : 'Votre paiement a été validé. Vos nouveaux crédits sont disponibles immédiatement.'}
                  </p>

                  {!upgradeSuccessData.is_downgrade && (
                    <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '16px', marginBottom: 20, border: '1px solid #bbf7d0' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Récapitulatif</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#64748b' }}>Montant prélevé</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{upgradeSuccessData.amount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#64748b' }}>Crédits disponibles</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{upgradeSuccessData.new_credits.complete} compl. + {upgradeSuccessData.new_credits.simple} simples</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: '#64748b' }}>Prochain prélèvement</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{upgradeSuccessData.next_billing}</span>
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 18, textAlign: 'center' }}>
                    📧 La facture vous sera envoyée par email dans quelques instants.
                  </p>

                  <button
                    onClick={reloadAfterSuccess}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', fontSize: 15, fontWeight: 800,
                      boxShadow: '0 8px 24px rgba(22,163,74,0.25)',
                      transition: 'all 0.2s',
                    }}>
                    Voir mon dashboard
                  </button>
                </div>
              )}

              {/* ═══ ÉTAT 4 : ERROR (paiement refusé / 3DS échoué) ═══ */}
              {upgradeFlow === 'error' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                    style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626, #991b1b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 12px 32px rgba(220,38,38,0.3)' }}>
                    <AlertTriangle size={36} style={{ color: '#fff' }} />
                  </motion.div>

                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>
                    Le paiement n'a pas pu être effectué
                  </h2>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6, padding: '0 8px' }}>
                    {upgradeError || 'Une erreur est survenue. Aucun montant n\'a été prélevé.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      onClick={() => { closeUpgradeFlow(); handleBillingPortal(); }}
                      style={{
                        width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700,
                        transition: 'all 0.2s',
                      }}>
                      Mettre à jour mon moyen de paiement
                    </button>
                    <button onClick={closeUpgradeFlow}
                      style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                      Fermer
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION 1 : Choisir / Changer de plan ═══ */}
      <div style={{ marginBottom: 28, borderRadius: 20, border: '1.5px solid #d0e8f0', overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', borderBottom: '1px solid #d0e8f0' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f2d3d', marginBottom: 4, letterSpacing: '-0.02em' }}>
            {isSubscribed ? 'Changer de plan' : 'Choisissez votre plan'}
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
            {isSubscribed ? 'Vous pouvez upgrader ou changer de formule à tout moment.' : 'Sélectionnez la formule adaptée à votre activité.'}
          </p>
        </div>
        <div style={{ padding: '20px 20px 24px' }}>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {plans.map(plan => {
            const isActive = subscription?.plan === plan.id && subscription?.status === 'active';
            const btnLoading = loading === `subscribe:${plan.id}`;
            return (
              <div key={plan.id} className="plan-card" style={{
                borderRadius: 18, padding: 22, position: 'relative',
                background: '#fff',
                border: isActive ? '2px solid #2a7d9c' : (showRecommendedBanner && plan.id === recommendedPlanId) ? '2px solid #16a34a' : plan.popular ? '2px solid #7dd3fc' : '1.5px solid #edf2f7',
                boxShadow: (showRecommendedBanner && plan.id === recommendedPlanId) ? '0 8px 32px rgba(22,163,74,0.1)' : plan.popular ? '0 8px 32px rgba(42,125,156,0.1)' : 'none',
              }}>
                {showRecommendedBanner && plan.id === recommendedPlanId && !isActive && (
                  <span style={{ position: 'absolute', top: -10, right: 16, background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 100, boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>✨ Recommandé pour vous</span>
                )}
                {plan.popular && !isActive && !(showRecommendedBanner && plan.id === recommendedPlanId) && (
                  <span style={{ position: 'absolute', top: -10, right: 16, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 100 }}>Recommandé</span>
                )}
                {isActive && (
                  <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: subscription?.cancel_at_period_end ? '#ea580c' : '#16a34a',
                    color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                    {subscription?.cancel_at_period_end
                      ? `Actif jusqu'au ${subscription?.current_period_end ? fmtDate(subscription.current_period_end) : '—'}`
                      : `Votre plan actuel ${subscription?.current_period_end ? `· Renouvellement ${fmtDate(subscription.current_period_end)}` : ''}`
                    }
                  </span>
                )}
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px 0', minHeight: 16 }}>{plan.tagline}</p>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: '#0f172a' }}>{plan.price}€</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>HT / mois</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
                  {[
                    `${plan.completes} analyse${plan.completes > 1 ? 's' : ''} complète${plan.completes > 1 ? 's' : ''}`,
                    `${plan.simples} analyse${plan.simples > 1 ? 's' : ''} simple${plan.simples > 1 ? 's' : ''}`,
                    'Dashboard pro + branding',
                    'Envoi de rapports clients',
                  ].map((feat, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#374151' }}>{feat}</span>
                    </div>
                  ))}
                </div>
                {isActive ? (
                  subscription?.cancel_at_period_end ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button onClick={handleReactivate} disabled={loading === 'reactivate'}
                        style={{ width: '100%', padding: '11px', borderRadius: 11, background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
                          cursor: loading === 'reactivate' ? 'wait' : 'pointer', opacity: loading === 'reactivate' ? 0.6 : 1, boxShadow: '0 4px 12px rgba(22,163,74,0.2)' }}>
                        {loading === 'reactivate' ? 'Réactivation…' : 'Réactiver mon abonnement'}
                      </button>
                      <div style={{ fontSize: 11, color: '#ea580c', textAlign: 'center', fontWeight: 600 }}>
                        Fin prévue le {subscription?.current_period_end ? fmtDate(subscription.current_period_end) : '—'}
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setCancelStep(1)}
                      style={{ width: '100%', padding: '11px', borderRadius: 11, background: '#fff', border: '1.5px solid #fecaca', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                      Annuler mon abonnement
                    </button>
                  )
                ) : (
                  <button disabled={btnLoading} onClick={() => {
                      if (subscription && subscription.status === 'active') {
                        // Upgrade : ouvrir popup de confirmation avec récap TVA
                        openUpgradeFlow(plan.id);
                      } else {
                        // Nouveau abo : rediriger vers Stripe Checkout
                        handleSubscribe(plan.id);
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: 11, border: 'none', cursor: btnLoading ? 'wait' : 'pointer',
                      background: plan.popular ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : '#0f172a', color: '#fff', fontSize: 14, fontWeight: 700, opacity: btnLoading ? 0.6 : 1 }}>
                    {btnLoading ? 'Redirection…' : (subscription ? 'Passer à ce plan' : 'Choisir ce plan')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Bouton modifier moyen de paiement — visible uniquement si abonné */}
      {isSubscribed && (
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button onClick={handleBillingPortal} disabled={loading === 'billing_portal'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: '#fff', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: loading === 'billing_portal' ? 'wait' : 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a7d9c'; e.currentTarget.style.color = '#2a7d9c'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#edf2f7'; e.currentTarget.style.color = '#64748b'; }}>
            <CreditCard size={14} />
            {loading === 'billing_portal' ? 'Redirection…' : 'Modifier mon moyen de paiement'}
          </button>
        </div>
      )}

      {/* ═══ SECTION 2 : Achats unitaires + Code promo (une seule ligne) ═══ */}
      <div style={{ marginBottom: 28, borderRadius: 20, border: isSubscribed ? '1.5px solid #bbf7d0' : '1.5px solid #fde68a', overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '20px 24px', background: isSubscribed ? 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' : 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderBottom: isSubscribed ? '1px solid #bbf7d0' : '1px solid #fde68a' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f2d3d', marginBottom: 4, letterSpacing: '-0.02em' }}>Crédits supplémentaires</h2>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
            {isSubscribed
              ? 'Besoin de plus d\'analyses ? Achetez à l\'unité ou utilisez un code promo.'
              : 'Les achats unitaires à tarif préférentiel sont réservés aux abonnés Verimo Pro.'}
          </p>
        </div>
        <div style={{ padding: '20px' }}>
      <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* Analyse complète */}
        <div style={{ padding: '20px', borderRadius: 16, background: '#fff', border: '1.5px solid #edf2f7', textAlign: 'center', opacity: isSubscribed ? 1 : 0.55 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>ACHAT UNITAIRE</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>9,90€ <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>HT</span></div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 14 }}>Analyse complète</div>
          <button disabled={!isSubscribed || loading === 'unit:complete'} onClick={() => handleBuyUnit('complete', 1)}
            style={{ width: '100%', padding: '10px', borderRadius: 10, background: isSubscribed ? '#0f172a' : '#cbd5e1', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: isSubscribed ? (loading === 'unit:complete' ? 'wait' : 'pointer') : 'not-allowed', opacity: loading === 'unit:complete' ? 0.6 : 1 }}>
            {loading === 'unit:complete' ? 'Redirection…' : 'Acheter'}
          </button>
          {!isSubscribed && <div style={{ fontSize: 12, color: '#d97706', marginTop: 10, lineHeight: 1.4, fontWeight: 600 }}>Abonnement requis</div>}
        </div>
        {/* Analyse simple */}
        <div style={{ padding: '20px', borderRadius: 16, background: '#fff', border: '1.5px solid #edf2f7', textAlign: 'center', opacity: isSubscribed ? 1 : 0.55 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>ACHAT UNITAIRE</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>2,90€ <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>HT</span></div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 14 }}>Analyse simple</div>
          <button disabled={!isSubscribed || loading === 'unit:document'} onClick={() => handleBuyUnit('document', 1)}
            style={{ width: '100%', padding: '10px', borderRadius: 10, background: isSubscribed ? '#0f172a' : '#cbd5e1', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: isSubscribed ? (loading === 'unit:document' ? 'wait' : 'pointer') : 'not-allowed', opacity: loading === 'unit:document' ? 0.6 : 1 }}>
            {loading === 'unit:document' ? 'Redirection…' : 'Acheter'}
          </button>
          {!isSubscribed && <div style={{ fontSize: 12, color: '#d97706', marginTop: 10, lineHeight: 1.4, fontWeight: 600 }}>Abonnement requis</div>}
        </div>
        {/* Code promo — toujours visible et actif */}
        <div style={{ padding: '20px', borderRadius: 16, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '2px solid #c4b5fd', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.08em', marginBottom: 10, textAlign: 'center' }}>CODE PROMO</div>
          <input type="text" value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); setPromoSuccess(''); }}
            placeholder="Votre code" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #ddd6fe', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', outline: 'none', textAlign: 'center', marginBottom: 10, boxSizing: 'border-box', background: '#fff' }} />
          <button disabled={promoLoading || !promoCode.trim()} onClick={handlePromoApply}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none',
              background: promoCode.trim() ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : '#a78bfa', color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: promoCode.trim() ? (promoLoading ? 'wait' : 'pointer') : 'default', opacity: promoLoading ? 0.6 : 1 }}>
            {promoLoading ? 'Vérification…' : 'Appliquer'}
          </button>
          {promoError && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>{promoError}</div>}
          {promoSuccess && <div style={{ marginTop: 8, fontSize: 12, color: '#16a34a', fontWeight: 600, textAlign: 'center' }}>{promoSuccess}</div>}
        </div>
        </div>
      </div>
      </div>

      {/* ═══ SECTION 3 : Agences ═══ */}
      <div style={{ background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', borderRadius: 16, padding: '22px 26px', border: '1px solid #d0e8f0', textAlign: 'center', marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f2d3d', marginBottom: 6 }}>Volumes importants ou besoins spécifiques ?</h3>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 14 }}>Agences, cabinets, équipes : contactez-nous pour une offre sur mesure.</p>
        <Link to="/contact-pro" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 10, background: '#0f2d3d', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
          Nous contacter <ArrowRight size={14} />
        </Link>
      </div>

      {/* ═══ SECTION 4 : Mes factures (paiements uniquement) ═══ */}
      {(() => {
        const paidInvoices = invoices.filter(inv => inv.type === 'subscription' || inv.type === 'unit');
        const grantInvoices = invoices.filter(inv => inv.type === 'promo' || inv.type === 'grant');
        return (<>
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={16} style={{ color: '#2a7d9c' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Mes factures</h3>
          {paidInvoices.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: '#f0f7fb', padding: '2px 8px', borderRadius: 100 }}>{paidInvoices.length}</span>
          )}
        </div>
        {invoicesLoading ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>Chargement…</div>
        ) : paidInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14, fontStyle: 'italic' }}>Aucune facture</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Description</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Type</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Montant</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Facture</th>
                </tr>
              </thead>
              <tbody>
                {paidInvoices.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom: i < paidInvoices.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' as const }}>{inv.date}</td>
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600 }}>{inv.description}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                        background: inv.type === 'subscription' ? '#f0f7fb' : '#f0fdf4',
                        color: inv.type === 'subscription' ? '#2a7d9c' : '#16a34a',
                      }}>
                        {inv.type === 'subscription' ? 'Abonnement' : 'Achat unitaire'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{inv.amount}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {inv.pdf_url ? (
                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, background: '#f0f7fb', color: '#2a7d9c', textDecoration: 'none', fontSize: 12, fontWeight: 700, border: '1px solid #d0e8f0' }}>
                          <Download size={12} /> PDF
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ SECTION 5 : Crédits offerts ═══ */}
      {grantInvoices.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={16} style={{ color: '#7c3aed' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Crédits offerts</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: 100 }}>{grantInvoices.length}</span>
          </div>
          <div>
            {grantInvoices.map((g, i) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < grantInvoices.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: g.type === 'promo' ? '#f5f3ff' : '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={16} style={{ color: g.type === 'promo' ? '#7c3aed' : '#2a7d9c' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{g.description}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{g.date}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1' }} />
                    <span style={{ fontWeight: 700, color: '#7c3aed' }}>{g.type === 'promo' ? 'Code promo' : 'Crédits offerts 🎁'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>);
      })()}

      {/* Popup succès code promo */}
      <AnimatePresence>
        {promoSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPromoSuccessPopup(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 18, padding: '32px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', position: 'relative', textAlign: 'center' as const }}>
              <button onClick={() => setPromoSuccessPopup(null)}
                style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <X size={16} />
              </button>
              <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#0f2d3d', marginBottom: 10 }}>
                Code promo appliqué !
              </div>
              <div style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.55, marginBottom: 22 }}>
                {promoSuccessPopup.message}
              </div>
              <button onClick={() => { setPromoSuccessPopup(null); window.location.reload(); }}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Voir mes crédits
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    let logoUrl: string | null = proProfile.pro_logo_url || null;

    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `${proProfile.id}/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('pro-logos').upload(path, logoFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('pro-logos').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }
    } else if (!logoPreview) {
      // Logo supprimé
      logoUrl = null;
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

      {/* Informations personnelles + coordonnées visibles */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 24px', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Informations personnelles</h3>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Vos informations de contact visibles par vos clients dans les rapports envoyés.</p>
        <div className="compte-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              Nom complet
              <TooltipInfo text="Ce prénom / nom sera affiché comme expéditeur lors de l'envoi de rapports par email à vos clients." />
            </label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="06 12 34 56 78" style={inputStyle} />
          </div>
        </div>
        <div className="compte-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              Email
              <TooltipInfo text="Les réponses de vos clients aux rapports envoyés arrivent sur cet email. Pour le modifier, contactez le support ou demandez une modification via Identité professionnelle." />
            </label>
            <input value={proProfile.email || ''} disabled style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
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
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  <Upload size={13} /> Choisir un fichier
                  <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                </label>
                {logoPreview && (
                  <button onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626' }}>
                    ✕ Supprimer
                  </button>
                )}
              </div>
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
/* ── Envoi rapport depuis un dossier — Wizard 3 étapes ── */
function SendReportFromDossier({ analyses, buyers, sellers, proProfile, folderAddress, onClose, onSent }: {
  analyses: ProAnalysis[]; buyers: ProFolderBuyer[]; sellers: ProFolderSeller[]; proProfile: ProProfile; folderAddress: string; onClose: () => void; onSent: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendDone, setSendDone] = useState(false);
  const [error, setError] = useState('');

  const senderName = proProfile.full_name || '';
  const senderNetwork = proProfile.pro_network || '';
  const senderCompanyName = proProfile.pro_company_name || '';
  const senderSignature = senderNetwork && senderCompanyName 
    ? `${senderNetwork} (${senderCompanyName})` 
    : senderNetwork || senderCompanyName;

  // Build unified recipients list (buyers + sellers with email)
  type Recipient = { id: string; first_name?: string | null; last_name: string; email: string; role: 'acheteur' | 'vendeur' };
  const allRecipients: Recipient[] = [
    ...sellers.filter(s => s.email).map(s => ({ id: `s-${s.id}`, first_name: s.first_name, last_name: s.last_name, email: s.email!, role: 'vendeur' as const })),
    ...buyers.filter(b => b.email).map(b => ({ id: `b-${b.id}`, first_name: b.first_name, last_name: b.last_name, email: b.email!, role: 'acheteur' as const })),
  ];

  // Extract clean doc name (first part before " — ")
  const getDocName = (a: ProAnalysis) => {
    const raw = a.address || a.title || 'Analyse';
    return raw.includes(' — ') ? raw.split(' — ')[0] : raw;
  };

  // Génère le message adapté
  const generateMessage = useCallback(() => {
    const selectedList = analyses.filter(a => selectedAnalysisIds.has(a.id));
    const address = folderAddress || 'le bien concerné';
    const docNames = selectedList.map(a => getDocName(a));

    const docPhrase = docNames.length === 1
      ? `du ${docNames[0].toLowerCase()}`
      : `du ${docNames.slice(0, -1).map(d => d.toLowerCase()).join(', du ')} et du ${docNames[docNames.length - 1].toLowerCase()}`;

    if (selectedList.length === 1) {
      return `Bonjour,\n\nDans le cadre de votre projet immobilier, je vous transmets le rapport d'analyse concernant le bien situé ${address}.\n\nCe rapport vous permettra d'avoir une vision claire ${docPhrase}.\n\nN'hésitez pas à me contacter pour en discuter ensemble.\n\nCordialement,\n${senderName}${senderSignature ? '\n' + senderSignature : ''}`;
    } else {
      return `Bonjour,\n\nDans le cadre de votre projet immobilier, je vous transmets ${selectedList.length} rapports d'analyse concernant le bien situé ${address}.\n\nCes rapports vous permettront d'avoir une vision claire ${docPhrase}.\n\nN'hésitez pas à me contacter pour en discuter ensemble.\n\nCordialement,\n${senderName}${senderSignature ? '\n' + senderSignature : ''}`;
    }
  }, [analyses, selectedAnalysisIds, folderAddress, senderName, senderSignature]);

  // Met à jour le message quand les analyses changent
  useEffect(() => {
    if (selectedAnalysisIds.size > 0) setMessage(generateMessage());
  }, [selectedAnalysisIds, generateMessage]);

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleAnalysis = (id: string) => {
    setSelectedAnalysisIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleSend = async () => {
    setError('');
    setSending(true);
    setSendProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const selectedRecipients = allRecipients.filter(r => selectedRecipientIds.has(r.id));
      const selectedAnalysesList = analyses.filter(a => selectedAnalysisIds.has(a.id));
      const totalSends = selectedRecipients.length;
      let sent = 0;

      for (const recipient of selectedRecipients) {
        // Envoyer un mail groupé avec toutes les analyses sélectionnées
        const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            action: 'send_report_batch',
            analysis_ids: selectedAnalysesList.map(a => a.id),
            recipient_name: `${recipient.first_name || ''} ${recipient.last_name}`.trim(),
            recipient_firstname: recipient.first_name || recipient.last_name,
            recipient_email: recipient.email,
            message: message.replace(/^Bonjour,/, `Bonjour ${recipient.first_name || recipient.last_name},`),
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        sent++;
        setSendProgress(Math.round((sent / totalSends) * 100));
      }

      setSendDone(true);
      setTimeout(() => { onSent(); onClose(); }, 2500);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'envoi.');
      setSending(false);
    }
  };

  const stepTitles = ['Destinataires', 'Analyses', 'Message & envoi'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 580, boxShadow: '0 32px 80px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>📧 Envoyer une analyse</h3>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                    background: step === s ? '#2a7d9c' : step > s ? '#16a34a' : '#f1f5f9',
                    color: step >= s ? '#fff' : '#94a3b8' }}>
                    {step > s ? '✓' : s}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: step === s ? 700 : 500, color: step === s ? '#0f172a' : '#94a3b8' }}>{stepTitles[s - 1]}</span>
                  {s < 3 && <div style={{ width: 20, height: 1.5, background: step > s ? '#16a34a' : '#e2e8f0', marginLeft: 2 }} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} style={{ color: '#94a3b8' }} /></button>
        </div>

        <div style={{ padding: '24px 28px 28px' }}>
          <AnimatePresence mode="wait">
            {/* ÉTAPE 1 : Sélection acheteurs */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>👥 À qui souhaitez-vous envoyer le rapport ?</p>
                {allRecipients.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center' as const, background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
                    <p style={{ fontSize: 13, color: '#78350f', margin: 0 }}>Aucun contact avec adresse email. Ajoutez un vendeur ou un acheteur potentiel avec un email pour pouvoir envoyer des rapports.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {allRecipients.map(r => {
                      const sel = selectedRecipientIds.has(r.id);
                      const roleStyle = r.role === 'vendeur'
                        ? { bg: '#fef3c7', color: '#92400e', label: 'Vendeur' }
                        : { bg: '#dbeafe', color: '#1e40af', label: 'Acheteur' };
                      return (
                        <button key={r.id} onClick={() => toggleRecipient(r.id)} type="button"
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14,
                            background: sel ? '#f0fdf4' : '#fff', border: sel ? '2px solid #16a34a' : '1.5px solid #edf2f7',
                            cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, border: sel ? 'none' : '2px solid #cbd5e1', background: sel ? '#16a34a' : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {sel && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{r.first_name} {r.last_name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.email}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: roleStyle.color, background: roleStyle.bg, padding: '3px 10px', borderRadius: 100 }}>{roleStyle.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button onClick={() => { if (selectedRecipientIds.size > 0) setStep(2); }}
                    disabled={selectedRecipientIds.size === 0}
                    style={{ padding: '12px 28px', borderRadius: 12, border: 'none',
                      background: selectedRecipientIds.size > 0 ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#e5e7eb',
                      color: '#fff', fontSize: 14, fontWeight: 700, cursor: selectedRecipientIds.size > 0 ? 'pointer' : 'default' }}>
                    Suivant →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 2 : Sélection analyses */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>📋 Sélectionnez les analyses à envoyer :</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analyses.map(a => {
                    const sel = selectedAnalysisIds.has(a.id);
                    const score = a.result && typeof a.result === 'object' && 'score' in (a.result as Record<string, unknown>) ? (a.result as Record<string, number>).score : null;
                    return (
                      <button key={a.id} onClick={() => toggleAnalysis(a.id)} type="button"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14,
                          background: sel ? '#f0f7fb' : '#fff', border: sel ? '2px solid #2a7d9c' : '1.5px solid #edf2f7',
                          cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, border: sel ? 'none' : '2px solid #cbd5e1', background: sel ? '#2a7d9c' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {sel && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.address || a.title}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            <span style={{ fontWeight: 700, color: a.type === 'complete' ? '#2a7d9c' : '#64748b' }}>{a.type === 'complete' ? 'Complète' : 'Simple'}</span> · {fmtDate(a.created_at)}
                          </div>
                        </div>
                        {score !== null && <span style={{ fontSize: 12, fontWeight: 900, color: score >= 14 ? '#16a34a' : score >= 10 ? '#d97706' : '#dc2626' }}>{score}/20</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                  <button onClick={() => setStep(1)}
                    style={{ padding: '12px 20px', borderRadius: 12, border: '1.5px solid #edf2f7', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    ← Retour
                  </button>
                  <button onClick={() => { if (selectedAnalysisIds.size > 0) setStep(3); }}
                    disabled={selectedAnalysisIds.size === 0}
                    style={{ padding: '12px 28px', borderRadius: 12, border: 'none',
                      background: selectedAnalysisIds.size > 0 ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#e5e7eb',
                      color: '#fff', fontSize: 14, fontWeight: 700, cursor: selectedAnalysisIds.size > 0 ? 'pointer' : 'default' }}>
                    Suivant →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 3 : Message + envoi */}
            {step === 3 && !sending && !sendDone && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 4px' }}>✉️ Prévisualisez et personnalisez votre message :</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>
                  → {selectedRecipientIds.size} destinataire{selectedRecipientIds.size > 1 ? 's' : ''} · {selectedAnalysisIds.size} analyse{selectedAnalysisIds.size > 1 ? 's' : ''}
                </p>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={10}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid #edf2f7', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.7, background: '#f8fafc' }} />

                {!proProfile.pro_logo_url && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fef3c7', fontSize: 12, color: '#78350f' }}>
                    💡 Pour afficher votre logo dans les rapports envoyés, ajoutez-le dans <strong>Mon compte</strong>.
                  </div>
                )}

                {error && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>{error}</div>}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                  <button onClick={() => setStep(2)}
                    style={{ padding: '12px 20px', borderRadius: 12, border: '1.5px solid #edf2f7', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    ← Retour
                  </button>
                  <button onClick={handleSend}
                    style={{ padding: '13px 32px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
                    📧 Envoyer
                  </button>
                </div>
              </motion.div>
            )}

            {/* ENVOI EN COURS */}
            {sending && !sendDone && (
              <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#2a7d9c', margin: '0 auto 20px' }} />
                <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Envoi en cours…</p>
                <div style={{ width: '100%', height: 6, borderRadius: 100, background: '#f1f5f9', overflow: 'hidden', marginBottom: 8 }}>
                  <motion.div animate={{ width: `${sendProgress}%` }} transition={{ duration: 0.3 }}
                    style={{ height: '100%', borderRadius: 100, background: 'linear-gradient(90deg, #2a7d9c, #16a34a)' }} />
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{sendProgress}%</p>
              </motion.div>
            )}

            {/* ENVOI TERMINÉ */}
            {sendDone && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>Rapport{selectedAnalysisIds.size > 1 ? 's' : ''} envoyé{selectedAnalysisIds.size > 1 ? 's' : ''} !</p>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                  {selectedRecipientIds.size} destinataire{selectedRecipientIds.size > 1 ? 's' : ''} · {selectedAnalysisIds.size} analyse{selectedAnalysisIds.size > 1 ? 's' : ''}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function BuyerGroupCollapsible({ email, items, folderAnalyses, fmtDate }: { email: string; items: { id: string; recipient_name: string; recipient_email: string; analysis_id: string; sent_at: string; opened_at?: string | null }[]; folderAnalyses: { id: string; address?: string; title?: string; type?: string }[]; fmtDate: (d: string) => string }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const handleToggle = () => {
    if (expanded) {
      const rect = ref.current?.getBoundingClientRect();
      setExpanded(false);
      if (rect && rect.top < 0) {
        requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
      }
    } else {
      setExpanded(true);
    }
  };
  return (
    <div ref={ref} style={{ padding: '14px 18px', borderRadius: 14, background: expanded ? '#f4f7f9' : '#f8fafc', border: `1px solid ${expanded ? '#d0e8f0' : '#edf2f7'}`, transition: 'all 0.2s' }}>
      <button onClick={handleToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'inherit' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Mail size={16} style={{ color: '#2a7d9c' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>✉️ {items[0].recipient_name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{email} · {fmtDate(items[0].sent_at)}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#fff', padding: '2px 8px', borderRadius: 100, border: '1px solid #edf2f7', marginRight: 8 }}>{items.length} rapport{items.length > 1 ? 's' : ''}</span>
        <ChevronDown size={14} style={{ color: '#94a3b8', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease', flexShrink: 0 }} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}>
            <div className="rapport-envoi-items" style={{ marginLeft: 48, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(item => {
                const analysis = folderAnalyses.find(a => a.id === item.analysis_id);
                const docName = analysis ? (analysis.address || analysis.title || 'Analyse').split(' — ')[0] : 'Analyse';
                return (
                  <div key={item.id} className="rapport-envoi-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: '#fff', border: '1px solid #edf2f7', flexWrap: 'wrap' }}>
                    <FileText size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <span className="rapport-envoi-name" style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, minWidth: 0 }}>{docName}</span>
                    <div className="rapport-envoi-meta" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{analysis?.type === 'complete' ? 'Complète' : 'Simple'}</span>
                      {item.opened_at ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '3px 10px', borderRadius: 100, border: '1px solid #bbf7d0' }}>✓ Ouvert le {fmtDate(item.opened_at!)}</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f8fafc', padding: '3px 10px', borderRadius: 100, border: '1px solid #e2e8f0' }}>En attente</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DossierDetail({ folderId, onBack, proProfile }: { folderId: string; onBack: () => void; proProfile: ProProfile }) {
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
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSendReport, setShowSendReport] = useState(false);
  const [sendHistory, setSendHistory] = useState<{ id: string; recipient_name: string; recipient_email: string; sent_at: string; opened_at?: string; analysis_id: string }[]>([]);
  const [errorPopup, setErrorPopup] = useState<{ message: string } | null>(null);
  const navigate = useNavigate();

  // Body scroll lock quand une modale est ouverte
  const anyModalOpen = showSellerModal || showBuyerModal || showEditFolderModal || showSendReport || showArchiveModal || !!sellerToDelete || !!buyerToDelete;
  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [anyModalOpen]);

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

  // Charger l'historique des envois de ce dossier
  const loadSendHistory = useCallback(async () => {
    const analysisIds = folderAnalyses.map(a => a.id);
    if (analysisIds.length === 0) { setSendHistory([]); return; }
    const { data } = await supabase
      .from('report_shares')
      .select('id, recipient_name, recipient_email, sent_at, opened_at, analysis_id')
      .in('analysis_id', analysisIds)
      .order('sent_at', { ascending: false });
    setSendHistory(data || []);
  }, [folderAnalyses]);

  useEffect(() => { loadSendHistory(); }, [loadSendHistory]);

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
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f7fb', border: '1px solid #d0e8f0', borderRadius: 10, cursor: 'pointer', color: '#2a7d9c', fontSize: 14, fontWeight: 700, marginBottom: 16, padding: '8px 16px' }}>
        ← Retour aux dossiers
      </button>

      {/* Header dossier */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 24px', marginBottom: 16 }}>
        <div className="dossier-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div className="dossier-icon-desktop" style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          <div className="dossier-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setShowArchiveModal(true)}
              className="dossier-archive-btn"
              title={folder.archived_at ? 'Restaurer ce dossier' : 'Archiver ce dossier (vente conclue, abandonné, etc.)'}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                background: folder.archived_at ? '#f0fdf4' : '#fff7ed',
                border: `1.5px solid ${folder.archived_at ? '#bbf7d0' : '#fed7aa'}`,
                color: folder.archived_at ? '#15803d' : '#9a3412',
                cursor: 'pointer', fontSize: 12.5, fontWeight: 700, flexShrink: 0, transition: 'all 0.15s' }}>
              <span style={{ fontSize: 13 }}>{folder.archived_at ? '📂' : '📦'}</span>
              {folder.archived_at ? 'Restaurer' : 'Archiver'}
            </button>
            <button
              onClick={() => { if (!folder.archived_at) setShowEditFolderModal(true); }}
              disabled={!!folder.archived_at}
              title={folder.archived_at ? 'Restaurez le dossier pour le modifier' : 'Modifier les infos du dossier'}
              className="dossier-edit-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#fff', border: '1.5px solid #edf2f7', color: '#475569',
                cursor: folder.archived_at ? 'not-allowed' : 'pointer',
                opacity: folder.archived_at ? 0.5 : 1,
                fontSize: 12.5, fontWeight: 700, flexShrink: 0, transition: 'all 0.15s' }}
              onMouseOver={e => { if (!folder.archived_at) { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.color = '#2a7d9c'; } }}
              onMouseOut={e => { if (!folder.archived_at) { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.color = '#475569'; } }}>
              <Pencil size={12} /> Modifier
            </button>
          </div>
        </div>

        {folder.archived_at && (
          <div style={{ marginTop: 14, padding: '11px 14px', borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12.5, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>📦</span>
            <span><strong>Dossier archivé</strong> le {new Date(folder.archived_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}. Cliquez sur "Restaurer" pour le réactiver et débloquer toutes les actions.</span>
          </div>
        )}

        {folder.internal_note && (
          <div style={{ marginTop: 14, padding: '11px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fef3c7', fontSize: 12.5, color: '#78350f', fontStyle: 'italic' as const }}>
            📝 {folder.internal_note}
          </div>
        )}
      </div>

      {/* Actions principales — 4 boutons */}
      <div className="dossier-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <ActionButton icon={UserCheck} label="Ajouter un vendeur"
          onClick={() => { setEditingSeller(null); setShowSellerModal(true); }}
          disabled={!!folder.archived_at}
          disabledReason="Restaurez le dossier pour ajouter un vendeur" />
        <ActionButton icon={UserPlus} label="Ajouter un acheteur potentiel"
          onClick={() => { setEditingBuyer(null); setShowBuyerModal(true); }}
          disabled={!!folder.archived_at}
          disabledReason="Restaurez le dossier pour ajouter un acheteur" />
        <button
          onClick={() => { if (!folder.archived_at) navigate(`/dashboard/nouvelle-analyse?folder=${folder.id}`); }}
          disabled={!!folder.archived_at}
          title={folder.archived_at ? 'Restaurez le dossier pour lancer une analyse' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12,
            background: folder.archived_at ? '#f8fafc' : '#f0f7fb',
            border: folder.archived_at ? '1.5px dashed #e2e8f0' : '1.5px solid #bae3f5',
            cursor: folder.archived_at ? 'not-allowed' : 'pointer',
            textAlign: 'left' as const, transition: 'all 0.15s',
            opacity: folder.archived_at ? 0.55 : 1 }}
          onMouseOver={e => { if (!folder.archived_at) (e.currentTarget as HTMLElement).style.background = '#e0f0f8'; }}
          onMouseOut={e => { if (!folder.archived_at) (e.currentTarget as HTMLElement).style.background = '#f0f7fb'; }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: folder.archived_at ? '#f1f5f9' : 'rgba(42,125,156,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={15} style={{ color: folder.archived_at ? '#94a3b8' : '#2a7d9c' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: folder.archived_at ? '#64748b' : '#2a7d9c' }}>Lancer une analyse</span>
            {folder.archived_at && <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>🔒 Dossier archivé</div>}
          </div>
        </button>
        <button
          onClick={() => {
            if (folder.archived_at) return;
            const completedAnalyses = folderAnalyses.filter(a => a.status === 'completed');
            if (completedAnalyses.length === 0) {
              setToast({ message: 'Aucune analyse terminée à envoyer. Lancez d\'abord une analyse.', type: 'error' });
              return;
            }
            const buyersWithEmail = buyers.filter(b => b.email);
            const sellersWithEmail = sellers.filter(s => s.email);
            if (buyersWithEmail.length === 0 && sellersWithEmail.length === 0) {
              setToast({ message: 'Aucun contact avec adresse email. Ajoutez un vendeur ou un acheteur potentiel avec un email.', type: 'error' });
              return;
            }
            setShowSendReport(true);
          }}
          disabled={!!folder.archived_at}
          title={folder.archived_at ? 'Restaurez le dossier pour envoyer une analyse' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12,
            background: folder.archived_at ? '#f8fafc' : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: folder.archived_at ? '1.5px dashed #e2e8f0' : '1.5px solid #86efac',
            cursor: folder.archived_at ? 'not-allowed' : 'pointer',
            textAlign: 'left' as const, transition: 'all 0.15s',
            opacity: folder.archived_at ? 0.55 : 1 }}
          onMouseOver={e => { if (!folder.archived_at) (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #dcfce7, #bbf7d0)'; }}
          onMouseOut={e => { if (!folder.archived_at) (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #f0fdf4, #dcfce7)'; }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: folder.archived_at ? '#f1f5f9' : 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Send size={15} style={{ color: folder.archived_at ? '#94a3b8' : '#16a34a' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: folder.archived_at ? '#64748b' : '#16a34a' }}>Envoyer une analyse</span>
            {folder.archived_at && <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>🔒 Dossier archivé</div>}
          </div>
        </button>
      </div>

      {/* Sections Vendeurs + Acheteurs en 2 colonnes */}
      <div className="folder-people-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12, marginBottom: 12 }}>
        <SectionVendeurs
          sellers={sellers}
          onAdd={() => { setEditingSeller(null); setShowSellerModal(true); }}
          onEdit={(s) => { setEditingSeller(s); setShowSellerModal(true); }}
          onDelete={(s) => setSellerToDelete(s)}
          disabled={!!folder.archived_at}
        />

        <SectionAcheteurs
          buyers={buyers}
          onAdd={() => { setEditingBuyer(null); setShowBuyerModal(true); }}
          onEdit={(b) => { setEditingBuyer(b); setShowBuyerModal(true); }}
          onDelete={(b) => setBuyerToDelete(b)}
          disabled={!!folder.archived_at}
        />
      </div>

      {/* Section Analyses du dossier */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '18px 22px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: folderAnalyses.length > 0 ? 14 : 6 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={15} style={{ color: '#94a3b8' }} />
            Analyses effectuées
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
        ) : (() => {
          const completes = folderAnalyses.filter(a => a.type === 'complete' || a.type === 'pack2' || a.type === 'pack3');
          const simples = folderAnalyses.filter(a => a.type === 'document');
          const renderRow = (a: ProAnalysis) => {
              const score = getScore(a.result as Record<string, unknown>);
              const isCompleted = a.status === 'completed';
              const isPending = a.status === 'pending' || a.status === 'processing' || a.status === 'queued';
              const isFailed = a.status === 'failed';
              return (
                <div key={a.id}
                  className="folder-analysis-row"
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
                      <span>{a.type === 'complete' || a.type === 'pack2' || a.type === 'pack3' ? 'Complète' : 'Simple'}</span>
                    </div>
                  </div>
                  {isPending && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '3px 10px', borderRadius: 100, border: '1px solid #fef3c7', flexShrink: 0 }}>
                      {a.status === 'queued' ? 'En cours de traitement' : 'En cours'}
                    </span>
                  )}
                  {isFailed && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 8px', borderRadius: 100, border: '1px solid #fecaca', flexShrink: 0 }}>
                      Échoué
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const msg = (a as ProAnalysis & { progress_message?: string }).progress_message
                            || "Une erreur est survenue lors de la génération. Si votre crédit n'a pas été restitué, contactez le support.";
                          setErrorPopup({ message: msg });
                        }}
                        aria-label="Voir le détail de l'erreur"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Info size={10} />
                      </button>
                    </span>
                  )}
                  {isCompleted && (
                    <div className="folder-analysis-cta" style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' as const }}>
                        Voir le rapport <ChevronRight size={13} />
                      </span>
                      {score !== null && (
                        <span style={{ fontSize: 13, fontWeight: 800, color: getScoreColor(score), whiteSpace: 'nowrap' as const }}>{score}/20</span>
                      )}
                    </div>
                  )}
                </div>
              );
          };
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {completes.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Search size={13} style={{ color: '#2a7d9c' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Analyses complètes</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c', background: '#f0f7fb', padding: '1px 7px', borderRadius: 100 }}>{completes.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {completes.map(renderRow)}
                  </div>
                </div>
              )}
              {simples.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <FileText size={13} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Analyses simples</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '1px 7px', borderRadius: 100 }}>{simples.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {simples.map(renderRow)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Historique des envois — regroupé par acheteur */}
      {sendHistory.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '18px 22px', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={15} style={{ color: '#16a34a' }} />
            Rapports envoyés
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 100 }}>{sendHistory.length}</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(() => {
              // Group by recipient email
              const grouped = new Map<string, typeof sendHistory>();
              sendHistory.forEach(sh => {
                const key = sh.recipient_email;
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(sh);
              });
              return Array.from(grouped.entries()).map(([email, items]) => (
                <BuyerGroupCollapsible key={email} email={email} items={items} folderAnalyses={folderAnalyses} fmtDate={fmtDate} />
              ));
            })()}
          </div>
        </div>
      )}

      {/* Modale envoi rapport */}
      <AnimatePresence>
        {showSendReport && (() => {
          const completedAnalyses = folderAnalyses.filter(a => a.status === 'completed');
          const buyersWithEmail = buyers.filter(b => b.email);
          const sellersWithEmail = sellers.filter(s => s.email);
          return (
            <SendReportFromDossier
              analyses={completedAnalyses}
              buyers={buyersWithEmail}
              sellers={sellersWithEmail}
              proProfile={proProfile}
              folderAddress={folder.property_address ? `${folder.property_address}${folder.property_postal_code ? ', ' + folder.property_postal_code : ''}${folder.property_city ? ' ' + folder.property_city : ''}` : ''}
              onClose={() => setShowSendReport(false)}
              onSent={() => { loadSendHistory(); setToast({ message: 'Rapport envoyé avec succès !', type: 'success' }); }}
            />
          );
        })()}
      </AnimatePresence>

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

      {/* Modale archivage / restauration */}
      <AnimatePresence>
        {showArchiveModal && folder && (
          <ModalArchiveFolder
            folder={folder}
            mode={folder.archived_at ? 'restore' : 'archive'}
            onClose={() => setShowArchiveModal(false)}
            onConfirm={async () => {
              const willArchive = !folder.archived_at;
              try {
                const { error } = await supabase
                  .from('pro_folders')
                  .update({ archived_at: willArchive ? new Date().toISOString() : null })
                  .eq('id', folder.id);
                if (error) throw error;
                setShowArchiveModal(false);
                setToast({ message: willArchive ? `📦 Dossier archivé` : `📂 Dossier restauré`, type: 'success' });
                setTimeout(() => setToast(null), 3000);
                const { data: refreshed } = await supabase.from('pro_folders').select('*').eq('id', folder.id).single();
                if (refreshed) setFolder(refreshed as ProFolder);
              } catch (e: any) {
                setToast({ message: 'Erreur : ' + (e.message || 'inconnue'), type: 'error' });
                setTimeout(() => setToast(null), 4000);
                throw e;
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      {/* Popup détail erreur analyse échouée */}
      <AnimatePresence>
        {errorPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setErrorPopup(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 18, padding: '28px 26px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', position: 'relative' }}>
              <button onClick={() => setErrorPopup(null)}
                style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <X size={16} />
              </button>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Info size={24} color="#dc2626" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f2d3d', textAlign: 'center', marginBottom: 10 }}>
                Analyse non générée
              </div>
              <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.55, textAlign: 'center', marginBottom: 18 }}>
                {errorPopup.message}
              </div>
              <button onClick={() => setErrorPopup(null)}
                style={{ width: '100%', padding: '11px 16px', borderRadius: 10, background: '#2a7d9c', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                J'ai compris
              </button>
            </motion.div>
          </motion.div>
        )}
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
function SectionVendeurs({ sellers, onAdd, onEdit, onDelete, disabled }: {
  sellers: ProFolderSeller[];
  onAdd: () => void;
  onEdit: (s: ProFolderSeller) => void;
  onDelete: (s: ProFolderSeller) => void;
  disabled?: boolean;
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
          <button onClick={() => { if (!disabled) onAdd(); }}
            disabled={disabled}
            title={disabled ? 'Restaurez le dossier pour ajouter un vendeur' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
              background: disabled ? '#f8fafc' : '#f5f3ff',
              border: `1px ${disabled ? 'dashed #e2e8f0' : 'solid #e9d5ff'}`,
              color: disabled ? '#94a3b8' : '#7c3aed',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 700, opacity: disabled ? 0.6 : 1 }}>
            <Plus size={12} /> Ajouter
          </button>
        )}
      </div>

      {sellers.length === 0 ? (
        <div style={{ padding: '12px 0' }}>
          <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 12px 0', fontStyle: 'italic' as const }}>
            {disabled ? 'Dossier archivé — aucun vendeur ne peut être ajouté.' : 'Aucun vendeur enregistré pour ce dossier.'}
          </p>
          {!disabled && (
            <button onClick={onAdd}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#f5f3ff', border: '1px dashed #c4b5fd', color: '#7c3aed', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              <Plus size={12} /> Ajouter le vendeur
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <AnimatePresence initial={false}>
            {sellers.map(s => <SellerCard key={s.id} seller={s} onEdit={() => onEdit(s)} onDelete={() => onDelete(s)} disabled={disabled} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function SellerCard({ seller, onEdit, onDelete, disabled }: { seller: ProFolderSeller; onEdit: () => void; onDelete: () => void; disabled?: boolean }) {
  const fullName = [seller.civility, seller.first_name, seller.last_name].filter(Boolean).join(' ');
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: '12px 14px', borderRadius: 11, background: 'linear-gradient(135deg, #fafafa, #f8fafc)', border: '1px solid #f1f5f9', position: 'relative' as const, overflow: 'hidden', opacity: disabled ? 0.65 : 1 }}>
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
        {!disabled && (
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
        )}
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
          <button onClick={onClose} title="Fermer" className="modal-close-btn"
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
          <Field label="Note interne" optional icon={FileText} tooltip="Ces informations sont strictement privées et uniquement accessibles par vous. Utilisez cet espace pour noter tout élément utile au suivi de ce dossier.">
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
          <button onClick={onClose} title="Fermer" className="modal-close-btn"
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
function SectionAcheteurs({ buyers, onAdd, onEdit, onDelete, disabled }: {
  buyers: ProFolderBuyer[];
  onAdd: () => void;
  onEdit: (b: ProFolderBuyer) => void;
  onDelete: (b: ProFolderBuyer) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: buyers.length > 0 ? 14 : 6 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserPlus size={15} style={{ color: '#94a3b8' }} />
          Acheteur{buyers.length > 1 ? 's' : ''} potentiel{buyers.length > 1 ? 's' : ''}
          {buyers.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 100 }}>{buyers.length}</span>
          )}
        </h3>
        {buyers.length > 0 && (
          <button onClick={() => { if (!disabled) onAdd(); }}
            disabled={disabled}
            title={disabled ? 'Restaurez le dossier pour ajouter un acheteur' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
              background: disabled ? '#f8fafc' : '#f0fdf4',
              border: `1px ${disabled ? 'dashed #e2e8f0' : 'solid #bbf7d0'}`,
              color: disabled ? '#94a3b8' : '#16a34a',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 700, opacity: disabled ? 0.6 : 1 }}>
            <Plus size={12} /> Ajouter
          </button>
        )}
      </div>

      {buyers.length === 0 ? (
        <div style={{ padding: '12px 0' }}>
          <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 12px 0', fontStyle: 'italic' as const }}>
            {disabled ? 'Dossier archivé — aucun acheteur ne peut être ajouté.' : 'Aucun acheteur enregistré pour ce dossier.'}
          </p>
          {!disabled && (
            <button onClick={onAdd}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px dashed #86efac', color: '#16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              <Plus size={12} /> Ajouter
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <AnimatePresence initial={false}>
            {buyers.map(b => <BuyerCard key={b.id} buyer={b} onEdit={() => onEdit(b)} onDelete={() => onDelete(b)} disabled={disabled} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function BuyerCard({ buyer, onEdit, onDelete, disabled }: { buyer: ProFolderBuyer; onEdit: () => void; onDelete: () => void; disabled?: boolean }) {
  const fullName = [buyer.civility, buyer.first_name, buyer.last_name].filter(Boolean).join(' ');
  const statusCfg = BUYER_STATUS_CONFIG[buyer.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: '12px 14px', borderRadius: 11, background: 'linear-gradient(135deg, #fafafa, #f8fafc)', border: '1px solid #f1f5f9', position: 'relative' as const, overflow: 'hidden', opacity: disabled ? 0.65 : 1 }}>
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
        {!disabled && (
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
        )}
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
          <button onClick={onClose} title="Fermer" className="modal-close-btn"
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
          <Field label="Note interne" optional icon={FileText} tooltip="Ces informations sont strictement privées et uniquement accessibles par vous. Utilisez cet espace pour noter tout élément utile au suivi de ce dossier.">
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
          <button onClick={onClose} title="Fermer" className="modal-close-btn"
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

/* ══════════════════════════════════════════
   TOOLTIP INFO — Cliquable sur mobile
══════════════════════════════════════════ */
function TooltipInfo({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <span
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#f0f7fb', border: '1px solid #d0e8f0', color: '#2a7d9c', fontSize: 10, fontWeight: 800, cursor: 'pointer', flexShrink: 0, userSelect: 'none' }}>?</span>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
          <div style={{ position: 'absolute', top: 22, left: 0, zIndex: 999, background: '#0f2d3d', color: '#fff', fontSize: 12, lineHeight: 1.5, padding: '10px 14px', borderRadius: 10, width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            {text}
            <div style={{ position: 'absolute', top: -5, left: 8, transform: 'rotate(45deg)', width: 10, height: 10, background: '#0f2d3d' }} />
          </div>
        </>
      )}
    </span>
  );
}

function ActionButton({ icon: Icon, label, onClick, comingSoon, disabled, disabledReason }: { icon: React.ElementType; label: string; onClick?: () => void; comingSoon?: boolean; disabled?: boolean; disabledReason?: string }) {
  const isDisabled = comingSoon || disabled;
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      title={disabled ? disabledReason : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12,
        background: isDisabled ? '#f8fafc' : '#fff',
        border: isDisabled ? '1.5px dashed #e2e8f0' : '1.5px solid #edf2f7',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        textAlign: 'left' as const,
        transition: 'all 0.15s',
        opacity: isDisabled ? 0.55 : 1,
      }}
      onMouseOver={e => { if (!isDisabled) { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.background = '#fafdfe'; } }}
      onMouseOut={e => { if (!isDisabled) { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.background = '#fff'; } }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: isDisabled ? '#f1f5f9' : 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color: isDisabled ? '#94a3b8' : '#2a7d9c' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: isDisabled ? '#64748b' : '#0f172a' }}>{label}</div>
        {comingSoon && <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>Bientôt disponible</div>}
        {disabled && !comingSoon && <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>🔒 Dossier archivé</div>}
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
  const [hasEverSubscribed, setHasEverSubscribed] = useState(false);
  const [proCredits, setProCredits] = useState<ProCredits | null>(null);
  const [analyses, setAnalyses] = useState<ProAnalysis[]>([]);
  const [shares, setShares] = useState<ReportShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendReportId, setSendReportId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionCategory, setSuggestionCategory] = useState('');
  const [suggestionSending, setSuggestionSending] = useState(false);
  const [suggestionSent, setSuggestionSent] = useState(false);
  const [suggestionView, setSuggestionView] = useState<'form' | 'history'>('form');
  const [suggestionHistory, setSuggestionHistory] = useState<Array<{ id: string; category: string | null; message: string; created_at: string; acknowledged: boolean }>>([]);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [helpSubject, setHelpSubject] = useState('');
  const [helpCustomSubject, setHelpCustomSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSending, setHelpSending] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  const [helpCreatedId, setHelpCreatedId] = useState<string | null>(null);
  const [helpHasOpenTicket, setHelpHasOpenTicket] = useState(false);
  const [helpCheckingTicket, setHelpCheckingTicket] = useState(false);
  const [unreadTickets, setUnreadTickets] = useState(0);

  // Expose popup openers for topbar buttons
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__openSuggestion = () => setShowSuggestionPopup(true);
    (window as unknown as Record<string, unknown>).__openHelp = async () => {
      setHelpCheckingTicket(true);
      setShowHelpPopup(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'open');
        setHelpHasOpenTicket((count || 0) > 0);
      }
      setHelpCheckingTicket(false);
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__openSuggestion;
      delete (window as unknown as Record<string, unknown>).__openHelp;
    };
  }, []);

  // ─── Notifications : rapports terminés ────────────────────
  type ProNotification = { id: string; analysisId: string; title: string; createdAt: string; read: boolean };
  const [notifications, setNotifications] = useState<ProNotification[]>([]);
  const [dbNotifications, setDbNotifications] = useState<Array<{ id: string; title: string; message: string | null; read: boolean; created_at: string }>>([]);
  const [notifToast, setNotifToast] = useState<string | null>(null);
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

    // Check if user has ever had a subscription (even canceled)
    const { count: subCount } = await supabase.from('pro_subscriptions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    setHasEverSubscribed((subCount || 0) > 0);

    // Credits balance (agrège abo + unitaires + offerts)
    const { data: credits } = await supabase.rpc('get_pro_credits_balance', { p_user_id: user.id });
    if (credits && credits.length > 0) setProCredits(credits[0] as ProCredits);
    else setProCredits(null);

    // Analyses
    const { data: anal } = await supabase.from('analyses').select('id, type, status, title, address, created_at, result').eq('user_id', user.id).order('created_at', { ascending: false });
    setAnalyses((anal || []) as ProAnalysis[]);

    // Shares
    const { data: sh } = await supabase.from('report_shares').select('*').eq('sender_id', user.id).order('sent_at', { ascending: false });

    // Unread support tickets
    const { count: unreadCount } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('unread_by_user', true);
    setUnreadTickets(unreadCount || 0);

    // DB notifications (cloche)
    const { data: dbNotifs } = await supabase.from('user_notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    setDbNotifications(dbNotifs || []);
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
          // Toast auto-dismiss 5s
          setNotifToast('Votre analyse est prête !');
          setTimeout(() => setNotifToast(null), 5000);
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

  const unreadNotifCount = notifications.filter(n => !n.read).length + dbNotifications.filter(n => !n.read).length;
  const markAllRead = async () => {
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    if (dbNotifications.some(n => !n.read)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('user_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
      setDbNotifications(n => n.map(x => ({ ...x, read: true })));
    }
  };

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

  // Titres raccourcis pour la topbar mobile
  const MOBILE_TITLES: Record<string, string> = {
    '/dashboard/abonnement': 'Mon plan',
  };
  const mobileTitle = dossierMatch ? 'Détail du dossier'
    : MOBILE_TITLES[path] || title;

  const renderContent = () => {
    if (dossierMatch) {
      return <DossierDetail folderId={dossierMatch[1]} onBack={() => navigate('/dashboard/dossiers')} proProfile={proProfile} />;
    }
    if (path === '/dashboard/dossiers') return <MesDossiersPro />;
    if (path === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse />;
    if (path === '/dashboard/compare') return <Compare />;
    if (path === '/dashboard/abonnement') return <MonAbonnement subscription={subscription} hasEverSubscribed={hasEverSubscribed} proProfile={proProfile} />;
    if (path === '/dashboard/compte') return <ComptePro proProfile={proProfile} onUpdate={loadData} />;
    if (path === '/dashboard/aide') return <Aide />;
    if (path === '/dashboard/support') return <Support />;
    return <HomeViewPro proProfile={proProfile} subscription={subscription} proCredits={proCredits} analyses={analyses} shares={shares} hasEverSubscribed={hasEverSubscribed} />;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Sidebar desktop */}
      <div className="desktop-sidebar" style={{ width: 260, flexShrink: 0 }}>
        <div style={{ position: 'fixed', top: 0, left: 0, width: 260, height: '100vh', zIndex: 50, overflowY: 'auto' }}>
          <SidebarPro subscription={subscription} proCredits={proCredits} unreadTickets={unreadTickets} />
        </div>
      </div>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
            <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.45)' }} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260 }}>
              <SidebarPro subscription={subscription} proCredits={proCredits} unreadTickets={unreadTickets} onClose={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopbarPro onMenuClick={() => setMobileOpen(true)} title={title} mobileTitle={mobileTitle} proProfile={proProfile}
          unreadCount={unreadNotifCount} notifications={[
            ...notifications,
            ...dbNotifications.map(n => ({ id: n.id, analysisId: '', title: n.title, message: n.message, createdAt: n.created_at, read: n.read })),
          ]} onMarkAllRead={markAllRead}
          onClickNotification={(id) => { window.location.href = `/rapport?id=${id}`; }} />
        <main className="dashboard-main" style={{ flex: 1, padding: '28px 24px', overflowX: 'hidden' }}>
          <motion.div key={path} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
            {renderContent()}
          </motion.div>
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

      {/* Toast notification analyse prête */}
      <AnimatePresence>
        {notifToast && (
          <motion.div initial={{ opacity: 0, y: -20, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 80, right: 24, background: '#fff', color: '#0f172a', padding: '14px 20px', borderRadius: 14, fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
            {notifToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Besoin d'aide */}
      <AnimatePresence>
        {showHelpPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,45,61,0.5)', padding: 20, backdropFilter: 'blur(3px)' }}
            onClick={() => { if (!helpSending) { setShowHelpPopup(false); setHelpSent(false); setHelpSubject(''); setHelpCustomSubject(''); setHelpMessage(''); setHelpCreatedId(null); setHelpHasOpenTicket(false); } }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 520, boxShadow: '0 32px 80px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>

              {helpCheckingTicket ? (
                <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', animation: 'spin 0.9s linear infinite', margin: '0 auto' }} />
                </div>
              ) : helpHasOpenTicket ? (
                <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #fde68a' }}>
                    <MessageSquare size={28} style={{ color: '#d97706' }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Vous avez déjà un ticket en cours</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 8px' }}>
                    Un ticket de support est actuellement ouvert. Vous pouvez y répondre ou le clôturer avant d&apos;en créer un nouveau.
                  </p>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>
                    Cela nous permet de mieux suivre vos demandes.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => { setShowHelpPopup(false); setHelpHasOpenTicket(false); window.location.href = '/dashboard/support'; }}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                      <MessageSquare size={15} /> Voir mon ticket
                    </button>
                    <button onClick={() => { setShowHelpPopup(false); setHelpHasOpenTicket(false); }}
                      style={{ padding: '12px 24px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                      Fermer
                    </button>
                  </div>
                </div>
              ) : helpSent ? (
                <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #bbf7d0' }}>
                    <CheckCircle size={32} style={{ color: '#16a34a' }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Message envoyé !</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 8px' }}>
                    Votre demande a bien été enregistrée. Notre équipe vous répondra dès que possible directement dans votre espace support.
                  </p>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>
                    Vous recevrez une notification dès qu&apos;une réponse sera disponible.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => { setShowHelpPopup(false); setHelpSent(false); setHelpSubject(''); setHelpCustomSubject(''); setHelpMessage(''); if (helpCreatedId) window.location.href = '/dashboard/support'; }}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                      <MessageSquare size={15} /> Voir la discussion
                    </button>
                    <button onClick={() => { setShowHelpPopup(false); setHelpSent(false); setHelpSubject(''); setHelpCustomSubject(''); setHelpMessage(''); setHelpCreatedId(null); }}
                      style={{ padding: '12px 24px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '28px 28px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LifeBuoy size={22} style={{ color: '#2a7d9c' }} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Besoin d&apos;aide ?</h3>
                          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Notre équipe vous répond rapidement.</p>
                        </div>
                      </div>
                      <button onClick={() => { setShowHelpPopup(false); setHelpSubject(''); setHelpCustomSubject(''); setHelpMessage(''); }} className="modal-close-btn"
                        style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={15} style={{ color: '#64748b' }} />
                      </button>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Quelle est la raison de votre demande ?</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                        {[
                          'Problème avec mon analyse',
                          'Question sur mon abonnement',
                          'Bug technique',
                          'Question sur les crédits',
                          'Autre',
                        ].map(opt => (
                          <button key={opt} onClick={() => setHelpSubject(opt)}
                            style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: helpSubject === opt ? '2px solid #2a7d9c' : '1.5px solid #edf2f7', background: helpSubject === opt ? '#f0f7fb' : '#fff', color: helpSubject === opt ? '#2a7d9c' : '#64748b', transition: 'all 0.15s', textAlign: 'left' }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                      {helpSubject === 'Autre' && (
                        <div style={{ marginTop: 12 }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Précisez le sujet de votre message</label>
                          <input value={helpCustomSubject} onChange={e => setHelpCustomSubject(e.target.value)} placeholder="Ex : question sur le rapport, problème de connexion…"
                            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '0 28px 28px' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Décrivez votre problème</label>
                    <textarea value={helpMessage} onChange={e => setHelpMessage(e.target.value)}
                      placeholder="Expliquez-nous votre situation en détail pour que nous puissions vous aider au mieux..."
                      rows={5} style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', marginBottom: 16 }} />
                    <button onClick={async () => {
                      const finalSubject = helpSubject === 'Autre' ? helpCustomSubject.trim() : helpSubject;
                      if (!finalSubject || !helpMessage.trim()) return;
                      setHelpSending(true);
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) { setHelpSending(false); return; }
                      const { data: ticket } = await supabase.from('support_tickets').insert({ user_id: user.id, subject: finalSubject }).select().single();
                      if (ticket) {
                        await supabase.from('support_messages').insert({ ticket_id: ticket.id, sender_type: 'user', message: helpMessage.trim() });
                        setHelpCreatedId(ticket.id);
                      }
                      setHelpSending(false);
                      setHelpSent(true);
                    }} disabled={helpSending || !helpSubject || (helpSubject === 'Autre' && !helpCustomSubject.trim()) || !helpMessage.trim()}
                      style={{ width: '100%', padding: '14px', borderRadius: 12, background: (helpSending || !helpSubject || (helpSubject === 'Autre' && !helpCustomSubject.trim()) || !helpMessage.trim()) ? '#e2e8f0' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: (helpSending || !helpSubject || (helpSubject === 'Autre' && !helpCustomSubject.trim()) || !helpMessage.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: (!helpSending && helpSubject && !(helpSubject === 'Autre' && !helpCustomSubject.trim()) && helpMessage.trim()) ? '0 4px 14px rgba(15,45,61,0.2)' : 'none' }}>
                      <Send size={15} /> {helpSending ? 'Envoi en cours...' : 'Envoyer mon message'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Suggestion */}
      <AnimatePresence>
        {showSuggestionPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,45,61,0.5)', padding: 20, backdropFilter: 'blur(3px)' }}
            onClick={() => { if (!suggestionSending) { setShowSuggestionPopup(false); setSuggestionSent(false); setSuggestionText(''); setSuggestionCategory(''); setSuggestionView('form'); } }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 520, boxShadow: '0 32px 80px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>

              {suggestionSent ? (
                <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #bbf7d0' }}>
                    <CheckCircle size={32} style={{ color: '#16a34a' }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Merci pour votre suggestion !</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 24px' }}>
                    Votre retour a bien été enregistré. Nous prenons en compte chaque suggestion pour améliorer Verimo Pro. Vous recevrez une notification quand elle sera traitée.
                  </p>
                  <button onClick={() => { setShowSuggestionPopup(false); setSuggestionSent(false); setSuggestionText(''); setSuggestionCategory(''); setSuggestionView('form'); }}
                    style={{ padding: '12px 28px', borderRadius: 12, background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Fermer
                  </button>
                </div>
              ) : suggestionView === 'history' ? (
                <>
                  <div style={{ padding: '24px 28px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => setSuggestionView('form')}
                          style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                          <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> Retour
                        </button>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Mes suggestions</h3>
                      </div>
                      <button onClick={() => { setShowSuggestionPopup(false); setSuggestionView('form'); }} className="modal-close-btn"
                        style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={15} style={{ color: '#64748b' }} />
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '0 28px 28px' }}>
                    {suggestionHistory.length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune suggestion envoyée pour le moment.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {suggestionHistory.map(s => (
                          <div key={s.id} style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #edf2f7', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              {s.category && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#fef3c7', color: '#92400e' }}>{s.category}</span>}
                              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>{s.message}</p>
                            <div style={{ fontSize: 11, fontWeight: 600, color: s.acknowledged ? '#16a34a' : '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {s.acknowledged ? <><CheckCircle size={11} /> Prise en compte</> : <><Clock size={11} /> En attente de lecture</>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: '28px 28px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Lightbulb size={22} style={{ color: '#d97706' }} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Une suggestion ?</h3>
                      </div>
                      <button onClick={() => { setShowSuggestionPopup(false); setSuggestionText(''); setSuggestionCategory(''); }} className="modal-close-btn"
                        style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={15} style={{ color: '#64748b' }} />
                      </button>
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', marginBottom: 20 }}>
                      <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.7, margin: 0 }}>
                        Aidez-nous à améliorer Verimo Pro ! Chaque suggestion est précieuse. Chaque demande sera prise en compte en fonction de son importance pour offrir la meilleure expérience possible.
                      </p>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Quel type de suggestion ?</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[
                          { id: 'Fonctionnalité manquante', emoji: '🔧' },
                          { id: 'Amélioration existante', emoji: '✨' },
                          { id: 'Nouveau type de rapport', emoji: '📊' },
                          { id: 'Autre idée', emoji: '💡' },
                        ].map(cat => (
                          <button key={cat.id} onClick={() => setSuggestionCategory(cat.id)}
                            style={{ padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: suggestionCategory === cat.id ? '1.5px solid #d97706' : '1px solid #edf2f7', background: suggestionCategory === cat.id ? '#fffbeb' : '#fff', color: suggestionCategory === cat.id ? '#92400e' : '#64748b', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{cat.emoji}</span> {cat.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '0 28px 28px' }}>
                    <textarea value={suggestionText} onChange={e => setSuggestionText(e.target.value)}
                      placeholder={
                        suggestionCategory === 'Fonctionnalité manquante' ? "Décrivez la fonctionnalité que vous aimeriez voir sur Verimo Pro..." :
                        suggestionCategory === 'Amélioration existante' ? "Quelle fonctionnalité existante pourrait être améliorée et comment ?" :
                        suggestionCategory === 'Nouveau type de rapport' ? "Quel type de rapport ou d'analyse vous serait utile ?" :
                        "Décrivez votre idée ou suggestion..."
                      }
                      rows={5} style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', marginBottom: 12 }} />

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button onClick={async () => {
                        if (!suggestionText.trim()) return;
                        setSuggestionSending(true);
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          await supabase.from('pro_suggestions').insert({ user_id: user.id, message: suggestionText.trim(), category: suggestionCategory || null });
                        }
                        setSuggestionSending(false);
                        setSuggestionSent(true);
                        setSuggestionText('');
                        setSuggestionCategory('');
                      }} disabled={suggestionSending || !suggestionText.trim()}
                        style={{ flex: 1, padding: '14px', borderRadius: 12, background: !suggestionText.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: !suggestionText.trim() ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: suggestionText.trim() ? '0 4px 14px rgba(217,119,6,0.25)' : 'none' }}>
                        <Send size={15} /> {suggestionSending ? 'Envoi...' : 'Envoyer ma suggestion'}
                      </button>
                    </div>

                    <button onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        const { data } = await supabase.from('pro_suggestions').select('id, category, message, created_at, acknowledged').eq('user_id', user.id).order('created_at', { ascending: false });
                        setSuggestionHistory(data || []);
                      }
                      setSuggestionView('history');
                    }}
                      style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 10, background: 'none', border: '1px solid #edf2f7', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Clock size={13} /> Voir mes suggestions précédentes
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .topbar-cta { display: none !important; }
          .topbar-help-btn { padding: 6px 10px !important; font-size: 11px !important; }
          .topbar-help-btn span { display: none !important; }
          .topbar-suggest-btn { display: none !important; }
          header { padding: 0 14px !important; height: 62px !important; gap: 10px !important; }
          .mobile-menu-btn svg { width: 24px !important; height: 24px !important; }
          .topbar-title { font-size: 15px !important; font-weight: 800 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
          .topbar-title-desktop { display: none !important; }
          .topbar-title-mobile { display: block !important; font-size: 15px !important; font-weight: 800 !important; }
          .dashboard-main { padding: 16px 12px !important; }
          .dashboard-main > div,
          .dashboard-main > section {
            max-width: 100% !important;
            width: 100% !important;
          }
          .compte-grid { grid-template-columns: 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .type-grid { grid-template-columns: 1fr !important; }
          .modal-close-btn { width: 36px !important; height: 36px !important; background: #edf2f7 !important; border-color: #cbd5e1 !important; }
          .pro-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .rapport-envoi-items { margin-left: 0 !important; }
          .rapport-envoi-item { flex-wrap: wrap !important; }
          .rapport-envoi-name { flex-basis: calc(100% - 30px) !important; white-space: normal !important; }
          .rapport-envoi-meta { width: 100% !important; padding-left: 24px !important; }
          .plan-card { padding: 16px !important; }
          .plan-card h3 { font-size: 16px !important; }
          .plan-card span[style*="font-size: 30"] { font-size: 24px !important; }
          .dossier-actions-grid { grid-template-columns: 1fr 1fr !important; }
          .dossier-icon-desktop { width: 40px !important; height: 40px !important; }
          .dossier-header { flex-wrap: wrap !important; }
          .dossier-header-actions {
            width: 100% !important;
            flex-direction: column !important;
            gap: 6px !important;
            margin-top: 10px !important;
          }
          .dossier-archive-btn,
          .dossier-edit-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 10px 14px !important;
          }
          .folder-analysis-row {
            gap: 10px !important;
            padding: 10px 12px !important;
          }
          .folder-analysis-cta {
            align-items: center !important;
          }
          .folder-analysis-cta span:first-child {
            font-size: 10.5px !important;
          }
          /* Modal archivage / restauration — réduit sur mobile */
          .archive-modal-card {
            max-width: 360px !important;
            border-radius: 14px !important;
          }
          .archive-modal-header {
            padding: 18px 20px 16px !important;
          }
          .archive-modal-icon {
            width: 44px !important;
            height: 44px !important;
            border-radius: 11px !important;
            font-size: 20px !important;
            margin-bottom: 10px !important;
          }
          .archive-modal-title {
            font-size: 15.5px !important;
            margin-bottom: 4px !important;
          }
          .archive-modal-subtitle {
            font-size: 11.5px !important;
          }
          .archive-modal-body {
            padding: 16px 20px 12px !important;
          }
          .archive-modal-body p {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }
          .archive-modal-body ul li {
            font-size: 11.5px !important;
            line-height: 1.7 !important;
          }
          .archive-modal-footer {
            padding: 12px 20px 18px !important;
            gap: 8px !important;
          }
          .archive-modal-footer button {
            padding: 9px 14px !important;
            font-size: 12.5px !important;
            flex: 1 !important;
            justify-content: center !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

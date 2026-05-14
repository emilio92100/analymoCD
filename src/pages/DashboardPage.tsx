import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, Bell, Shield, CreditCard,
  CheckCircle, BookOpen, Send, MessageSquare,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCredits } from '../hooks/useCredits';
import { useUser } from '../hooks/useUser';

// Vues
import HomeView from './dashboard/HomeView';
import MesAnalyses from './dashboard/MesAnalyses';
import NouvelleAnalyse from './dashboard/NouvelleAnalyse';
import Compare from './dashboard/Compare';
import Compte from './dashboard/Compte';
import Support from './dashboard/Support';
import Aide from './dashboard/Aide';
import Tarifs from './dashboard/Tarifs';

const navItems = [
  { to: '/dashboard',               icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/dashboard/analyses',      icon: FileText,        label: 'Mes analyses' },
  { to: '/dashboard/compare',       icon: GitCompare,      label: 'Comparer mes biens' },
  { to: '/dashboard/tarifs',        icon: CreditCard,      label: 'Tarifs' },
  { to: '/dashboard/compte',        icon: User,            label: 'Mon compte' },
  { to: '/dashboard/aide',          icon: BookOpen,        label: 'Aide & Méthode' },
  { to: '/dashboard/support',       icon: LifeBuoy,        label: 'Support' },
];

/* ═══════════════════════════════════════════
   SIDEBAR TEAL VERIMO
═══════════════════════════════════════════ */
function Sidebar({ onClose, unreadTickets }: { onClose?: () => void; unreadTickets?: number }) {
  const location = useLocation();
  const { credits } = useCredits();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const SB_BG = '#0e3a4a';
  const SB_ACTIVE_BG = 'rgba(255,255,255,0.1)';
  const SB_ACCENT = '#5dbfe0';
  const SB_TEXT = 'rgba(255,255,255,0.75)';
  const SB_TEXT_ACTIVE = '#ffffff';
  const SB_MUTED = 'rgba(255,255,255,0.45)';

  return (
    <aside style={{ width:260, minHeight:'100vh', height:'100%', background:SB_BG, display:'flex', flexDirection:'column' }}>
      {/* Logo — centré et plus gros */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'12px 18px 6px', flexShrink:0, position:'relative' }}>
        <Link to="/" onClick={onClose} style={{ textDecoration:'none' }}>
          <img src="/logo-blanc.png" alt="Verimo" style={{ height: 100, width: 'auto', display: 'block', marginBottom: -20 }} />
        </Link>
        {onClose && <button onClick={onClose} style={{ position:'absolute', right:14, top:14, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:4 }}><X size={18}/></button>}
      </div>

      {/* CTA Nouvelle analyse */}
      <div style={{ padding:'6px 14px 8px' }}>
        <Link to="/dashboard/nouvelle-analyse" onClick={onClose}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:10, background:'#2a7d9c', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:700, transition:'all 0.2s' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='#358da8'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='#2a7d9c'; }}>
          <Plus size={15} strokeWidth={2.5}/> Nouvelle analyse
        </Link>
      </div>

      {/* Crédits — Option B : bordure teal, textes bien visibles */}
      <div style={{ margin:'0 14px 6px', padding:'12px', borderRadius:10, background:'rgba(93,191,224,0.08)', border:'1.5px solid rgba(93,191,224,0.2)' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#5dbfe0', letterSpacing:'0.08em', marginBottom:8 }}>CRÉDITS RESTANTS</div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {[{ label:'Analyse simple', value:credits.document, color:SB_ACCENT }, { label:'Analyse complète', value:credits.complete, color:'#7dd3fc' }].map(c=>(
            <div key={c.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:12, color:'#fff', fontWeight:600 }}>{c.label}</span>
              <span style={{ fontSize:15, fontWeight:800, color:c.value>0?c.color:'rgba(255,255,255,0.2)' }}>{c.value}</span>
            </div>
          ))}
        </div>
        <Link to="/dashboard/tarifs" onClick={onClose} style={{ display:'block', marginTop:8, padding:'6px', borderRadius:7, background:'rgba(93,191,224,0.1)', textAlign:'center', textDecoration:'none' }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#5dbfe0' }}>{credits.document===0&&credits.complete===0?'+ Acheter une analyse':'+ Recharger'}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, padding:'4px 10px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        <p style={{ fontSize:10, fontWeight:700, color:SB_MUTED, letterSpacing:'0.12em', padding:'10px 10px 5px', textTransform:'uppercase' }}>Menu</p>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 12px', textDecoration:'none',
                fontSize:14, fontWeight:active?700:500, color:active?SB_TEXT_ACTIVE:SB_TEXT,
                background:active?SB_ACTIVE_BG:'transparent', transition:'all 0.15s',
                borderLeft:active?`3px solid ${SB_ACCENT}`:'3px solid transparent',
                borderRadius:0,
              }}
              onMouseOver={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; }}
              onMouseOut={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
              <Icon size={18} style={{ color:active?SB_ACCENT:SB_TEXT, flexShrink:0 }}/>
              {item.label}
              {item.to === '/dashboard/support' && (unreadTickets || 0) > 0 && (
                <span style={{ minWidth: 18, height: 18, borderRadius: 100, background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0, marginLeft: 4 }}>{unreadTickets}</span>
              )}
            </Link>
          );
        })}
      </nav>
      {isAdmin && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/admin" onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, #0f2d3d, #1a4a60)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, justifyContent: 'center' }}>
            <Shield size={15} /> Espace Admin
          </Link>
        </div>
      )}
    </aside>
  );
}

/* ═══════════════════════════════════════════
   TOPBAR (inchangé dans la logique)
═══════════════════════════════════════════ */
function Topbar({ onMenuClick, title, unreadCount, notifications, onMarkAllRead, onClickNotification }: {
  onMenuClick:()=>void; title:string;
  unreadCount?: number; notifications?: { id: string; analysisId: string; title: string; createdAt: string; read: boolean }[];
  onMarkAllRead?: () => void; onClickNotification?: (analysisId: string) => void;
}) {
  const { name, email } = useUser();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

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
    <header style={{ height:76, background:'#fff', borderBottom:'1px solid #edf2f7', display:'flex', alignItems:'center', padding:'0 28px', gap:14, position:'sticky', top:0, zIndex:40, flexShrink:0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background:'none', border:'none', cursor:'pointer', color:'#0f2d3d', padding:4, display:'none' }}><Menu size={22}/></button>
      <p className="topbar-title" style={{ flex:1, fontSize:20, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</p>

      {/* Bouton Besoin d'aide */}
      <button onClick={() => { if ((window as unknown as Record<string, unknown>).__openHelp) ((window as unknown as Record<string, () => void>).__openHelp)(); }}
        className="topbar-help-btn"
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(217,119,6,0.2)', transition: 'all 0.15s' }}
        onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
        onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
        <LifeBuoy size={13}/> Besoin d&apos;aide
      </button>

      {/* Cloche notifications */}
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button onClick={() => { setBellOpen(!bellOpen); if (!bellOpen && onMarkAllRead) onMarkAllRead(); }}
          style={{ width:40, height:40, borderRadius:10, background: bellOpen ? '#f0f7fb' : '#f8fafc', border:`1px solid ${bellOpen ? '#c7dde8' : '#edf2f7'}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', position: 'relative', transition: 'all 0.15s' }}>
          <Bell size={18}/>
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

      {isAdmin && (
        <button onClick={()=>navigate('/admin')} className="topbar-cta" style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:10, background:'linear-gradient(135deg,#0f2d3d,#1a4a60)', border:'none', cursor:'pointer', color:'#fff', fontSize:13.5, fontWeight:700, whiteSpace:'nowrap' }}>
          <Shield size={14}/> Espace Admin
        </button>
      )}
      <div ref={dropdownRef} style={{ position:'relative' }}>
        <button onClick={()=>setDropdownOpen(!dropdownOpen)}
          style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 10px 6px 6px', borderRadius:10, background:dropdownOpen?'#f0f7fb':'#f8fafc', border:`1px solid ${dropdownOpen?'#c7dde8':'#edf2f7'}`, cursor:'pointer', transition:'all 0.15s' }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>
            {(name.charAt(0)||'U').toUpperCase()}
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap' }} className="topbar-cta">{name||'Mon compte'}</span>
          <ChevronDown size={13} style={{ color:'#94a3b8', transition:'transform 0.2s', transform:dropdownOpen?'rotate(180deg)':'rotate(0deg)' }}/>
        </button>
        <AnimatePresence>
        {dropdownOpen && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:220, background:'#fff', borderRadius:14, border:'1px solid #edf2f7', boxShadow:'0 16px 48px rgba(0,0,0,0.12)', zIndex:9999, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f5f9' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{name}</div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{email}</div>
            </div>
            <button onClick={()=>{ navigate('/dashboard/compte'); setDropdownOpen(false); }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'#0f172a', textAlign:'left' as const }}
              onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='#f8fafc'}
              onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='none'}>
              <User size={15} style={{ color:'#2a7d9c' }}/> Mon profil
            </button>
            <button onClick={handleLogout}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'none', border:'none', borderTop:'1px solid #f0f5f9', cursor:'pointer', fontSize:13, fontWeight:600, color:'#ef4444', textAlign:'left' as const }}
              onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='#fef2f2'}
              onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='none'}>
              <LogOut size={15}/> Se déconnecter
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════
   BANNER — V2 : ciblage audience + dismiss journalier
   Affiche les bannières actives qui ciblent ce user :
   - audience='all' → tout le monde
   - audience='particulier' → user.role = 'particulier'
   - audience='specific' → target_user_id = user.id
   Dismiss : sessionStorage avec date du jour. Revient demain.
═══════════════════════════════════════════ */
type BannerData = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  audience: 'all' | 'pro' | 'particulier' | 'specific';
  target_user_id: string | null;
};

function DashboardBanner() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Récupère le role pour filtrer côté client (l'audience pro/particulier)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      const role = profile?.role || 'particulier';

      // On récupère TOUTES les bannières actives, puis on filtre côté front
      // (plus simple que des `or` Supabase imbriqués, et il y a peu de bannières)
      const { data } = await supabase
        .from('banners')
        .select('id, message, type, audience, target_user_id')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (!data) return;

      // Filtrage : on garde celles qui concernent ce user
      const visible = data.filter(b => {
        if (b.audience === 'all') return true;
        if (b.audience === 'pro') return role === 'pro';
        if (b.audience === 'particulier') return role !== 'pro';
        if (b.audience === 'specific') return b.target_user_id === user.id;
        return false;
      }) as BannerData[];

      // Lire les dismiss du jour pour chaque bannière visible
      const today = new Date().toISOString().slice(0, 10); // ex: "2026-05-11"
      const dismissed = new Set<string>();
      for (const b of visible) {
        const key = `verimo_banner_dismiss_${b.id}_${user.id}`;
        if (sessionStorage.getItem(key) === today) dismissed.add(b.id);
      }
      setDismissedIds(dismissed);
      setBanners(visible);
    };
    load();
  }, []);

  const handleDismiss = (bannerId: string) => {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    sessionStorage.setItem(`verimo_banner_dismiss_${bannerId}_${userId}`, today);
    setDismissedIds(prev => new Set([...prev, bannerId]));
  };

  const visibleBanners = banners.filter(b => !dismissedIds.has(b.id));
  if (visibleBanners.length === 0) return null;

  // Couleurs vives — texte blanc sur fond saturé pour bien attirer l'œil
  const STYLES: Record<string, { bg: string; borderLeft: string; iconBg: string }> = {
    info:    { bg: '#0284c7', borderLeft: '#075985', iconBg: '#fff' },
    warning: { bg: '#f97316', borderLeft: '#c2410c', iconBg: '#fff' },
    success: { bg: '#16a34a', borderLeft: '#15803d', iconBg: '#fff' },
  };
  const ICONS: Record<string, string> = { info: 'ℹ️', warning: '⚠️', success: '✅' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {visibleBanners.map(b => {
        const s = STYLES[b.type] || STYLES.info;
        return (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', background: s.bg, borderLeft: `5px solid ${s.borderLeft}`, color: '#fff' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
              {ICONS[b.type] || ICONS.info}
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#fff', lineHeight: 1.5 }}>{b.message}</span>
            <button onClick={() => handleDismiss(b.id)} aria-label="Fermer"
              style={{ background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', color: '#fff', padding: 6, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}


/* ═══════════════════════════════════════════
   RAPPORT DASHBOARD — Redirige vers le rapport
═══════════════════════════════════════════ */
function RapportDashboard() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  useEffect(() => {
    if (id) {
      window.location.href = "/rapport?id=" + id;
    } else {
      window.location.href = '/dashboard/analyses';
    }
  }, [id]);
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', animation: 'spin 0.9s linear infinite' }}/></div>;
}


/* ═══════════════════════════════════════════
   CONTENU & EXPORT
═══════════════════════════════════════════ */
function DashboardContent({ path }: { path:string }) {
  if (path === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse/>;
  if (path === '/dashboard/tarifs')           return <Tarifs/>;
  if (path === '/dashboard/analyses')         return <MesAnalyses/>;
  if (path === '/dashboard/compare')          return <Compare/>;
  if (path === '/dashboard/compte')           return <Compte/>;
  if (path === '/dashboard/support')          return <Support/>;
  if (path === '/dashboard/aide')             return <Aide/>;
  if (path === '/dashboard/rapport')          return <RapportDashboard/>;
  return <HomeView/>;
}

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ─── Notifications : rapports terminés + notifications BDD ────────────────────
  type PartNotification = { id: string; analysisId: string; title: string; createdAt: string; read: boolean };
  const [notifications, setNotifications] = useState<PartNotification[]>([]);
  const [dbNotifications, setDbNotifications] = useState<Array<{ id: string; title: string; message: string | null; read: boolean; created_at: string }>>([]);
  const [notifToast, setNotifToast] = useState<string | null>(null);
  const prevAnalysesRef = useRef<{ id: string; status: string }[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/connexion');
    });
  }, [navigate]);

  // Load DB notifications
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('user_notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      setDbNotifications(data || []);
    })();
  }, []);

  // Polling toutes les 15s pour détecter les analyses qui passent à "completed"
  useEffect(() => {
    // Premier chargement
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('analyses').select('id, status, title, address').eq('user_id', user.id);
      if (data) prevAnalysesRef.current = data;
    };
    init();

    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: fresh } = await supabase.from('analyses').select('id, status, title, address').eq('user_id', user.id);
      if (!fresh) return;

      const prev = prevAnalysesRef.current;
      if (prev.length > 0) {
        const newlyCompleted = fresh.filter(a =>
          a.status === 'completed' && prev.find(p => p.id === a.id && p.status !== 'completed')
        );
        if (newlyCompleted.length > 0) {
          setNotifications(n => [
            ...newlyCompleted.map(a => ({
              id: `notif-${a.id}`,
              analysisId: a.id,
              title: (a as Record<string, string>).address || (a as Record<string, string>).title || 'Analyse',
              createdAt: new Date().toISOString(),
              read: false,
            })),
            ...n,
          ]);
          setNotifToast('Votre analyse est prête !');
          setTimeout(() => setNotifToast(null), 5000);
        }
      }
      prevAnalysesRef.current = fresh;
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length + dbNotifications.filter(n => !n.read).length;
  const [unreadTickets, setUnreadTickets] = useState(0);

  // Load unread tickets count
  useEffect(() => {
    const loadUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('unread_by_user', true);
      setUnreadTickets(count || 0);
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const [showHelpPopup, setShowHelpPopup] = useState(false);

  // Welcome popup — première connexion
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('welcome_shown').eq('id', user.id).single();
      if (data && !data.welcome_shown) setShowWelcome(true);
    })();
  }, []);
  const dismissWelcome = async (goToAide?: boolean) => {
    setShowWelcome(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').update({ welcome_shown: true }).eq('id', user.id);
    if (goToAide) navigate('/dashboard/aide');
  };
  const [helpSubject, setHelpSubject] = useState('');
  const [helpCustomSubject, setHelpCustomSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSending, setHelpSending] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  const [, setHelpCreatedId] = useState<string | null>(null);
  const [helpHasOpenTicket, setHelpHasOpenTicket] = useState(false);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__openHelp = async () => {
      // ⭐ Vérifier d'abord si un ticket est ouvert, AVANT d'afficher le popup.
      // Comme ça le popup s'ouvre directement avec le bon contenu (pas de spinner
      // qui saute en cours d'animation → animation fluide identique à Suggestion).
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'open');
          setHelpHasOpenTicket((count || 0) > 0);
        }
      } catch (e) {
        console.warn('[help] Check ticket failed:', e);
        setHelpHasOpenTicket(false);
      }
      // Maintenant on ouvre le popup avec le bon contenu prêt
      setShowHelpPopup(true);
    };
    return () => { delete (window as unknown as Record<string, unknown>).__openHelp; };
  }, []);
  const markAllRead = async () => {
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    if (dbNotifications.some(n => !n.read)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('user_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
      setDbNotifications(n => n.map(x => ({ ...x, read: true })));
    }
  };

  const title = navItems.find(i => i.to === location.pathname)?.label || 'Mon espace';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f9fb', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <div className="desktop-sidebar" style={{ width:260, flexShrink:0 }}>
        <div style={{ position:'fixed', top:0, left:0, width:260, height:'100vh', zIndex:50, overflowY:'auto' }}>
          <Sidebar unreadTickets={unreadTickets}/>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'fixed', inset:0, zIndex:200 }}>
            <div onClick={()=>setMobileOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(15,45,61,0.45)' }}/>
            <motion.div initial={{ x:-260 }} animate={{ x:0 }} exit={{ x:-260 }} transition={{ type:'spring', stiffness:320, damping:32 }}
              style={{ position:'absolute', left:0, top:0, bottom:0, width:260 }}>
              <Sidebar onClose={()=>setMobileOpen(false)} unreadTickets={unreadTickets}/>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Topbar onMenuClick={()=>setMobileOpen(true)} title={title}
          unreadCount={unreadCount} notifications={[
            ...notifications,
            ...dbNotifications.map(n => ({ id: n.id, analysisId: n.analysis_id || '', title: n.title, message: n.message, createdAt: n.created_at, read: n.read })),
          ]} onMarkAllRead={markAllRead}
          onClickNotification={(id) => { window.location.href = `/rapport?id=${id}`; }} />
        <DashboardBanner/>
        <main className="dashboard-main" style={{ flex:1, padding:'28px 24px', overflowX:'hidden' }}>
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
            <DashboardContent path={location.pathname}/>
          </motion.div>
        </main>
      </div>

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

      {/* Popup Bienvenue — première connexion */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,45,61,0.5)', padding: 20, backdropFilter: 'blur(3px)' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 420, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Bienvenue sur Verimo !</h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                Vous êtes prêt à analyser vos premiers documents immobiliers.<br />
                Découvrez comment fonctionne Verimo en 2 minutes.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => dismissWelcome(true)}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <BookOpen size={16} /> Découvrir le guide Aide & Méthode
                </button>
                <button onClick={() => dismissWelcome(false)}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  C&apos;est parti, je commence !
                </button>
              </div>
            </motion.div>
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

              {helpHasOpenTicket ? (
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
                    <button onClick={() => { setShowHelpPopup(false); setHelpSent(false); window.location.href = '/dashboard/support'; }}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                      Voir la discussion
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
                      <button onClick={() => { setShowHelpPopup(false); setHelpSubject(''); setHelpCustomSubject(''); setHelpMessage(''); }}
                        style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={15} style={{ color: '#64748b' }} />
                      </button>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Quelle est la raison de votre demande ?</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                        {['Problème avec mon analyse', 'Question sur mon abonnement', 'Bug technique', 'Question sur les crédits', 'Autre'].map(opt => (
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
                      placeholder="Expliquez-nous votre situation en détail..."
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
                      style={{ width: '100%', padding: '14px', borderRadius: 12, background: (helpSending || !helpSubject || (helpSubject === 'Autre' && !helpCustomSubject.trim()) || !helpMessage.trim()) ? '#e2e8f0' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: (helpSending || !helpSubject || (helpSubject === 'Autre' && !helpCustomSubject.trim()) || !helpMessage.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Send size={15} /> {helpSending ? 'Envoi en cours...' : 'Envoyer mon message'}
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
          header { padding: 0 14px !important; height: 62px !important; gap: 10px !important; }
          .mobile-menu-btn svg { width: 24px !important; height: 24px !important; }
          .dashboard-main { padding: 16px 12px !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .action-grid { grid-template-columns: 1fr !important; }
          .compare-grid { grid-template-columns: 1fr !important; }
          .result-grid { grid-template-columns: 1fr !important; }
          .type-grid { grid-template-columns: 1fr !important; }
          .compare-addr { white-space: normal !important; }
          .topbar-title { font-size: 15px !important; font-weight: 800 !important; white-space: normal !important; overflow: visible !important; }
          .dashboard-main > div,
          .dashboard-main > section {
            max-width: 100% !important;
            width: 100% !important;
          }
          .dashboard-main [style*="padding: '28px'"],
          .dashboard-main [style*="padding: \\"28px\\""],
          .dashboard-main [style*="padding:28px"] {
            padding: 18px !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.15)} 50%{box-shadow:0 0 0 10px rgba(255,255,255,0)} }
      `}</style>
    </div>
  );
}

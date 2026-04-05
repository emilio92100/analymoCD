import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, Search, Send, Bell,
  ChevronRight, Building2, ExternalLink, ChevronLeft,
  Shield, BarChart2, Upload, CheckCircle,
  ShieldCheck, ArrowRight, Sparkles, AlertTriangle,
  Download, CreditCard, Lock, Info, Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PROMPT_ANALYSE_COMPLETE, PROMPT_ANALYSE_SIMPLE, PROMPT_APERCU_COMPLET, PROMPT_APERCU_SIMPLE } from '../lib/prompts';
import { createAnalyse, createApercu, updateAnalyseResult, updateApercuResult, markAnalyseFailed, markFreePreviewUsed, checkFreePreviewUsedSync, fetchAnalyses, type AnalyseDB } from '../lib/analyses';

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type AnalyseType = 'document' | 'complete';
type AnalyseStatus = 'completed' | 'processing' | 'error';

type Analyse = {
  id: string;
  type: AnalyseType;
  status: AnalyseStatus;
  nom_document?: string;
  adresse_bien?: string;
  score?: number;
  recommandation?: string;
  recommandationColor?: string;
  date: string;
  price: string;
  is_preview?: boolean;        // true = aperçu gratuit non payé
  document_names?: string[];   // noms des fichiers analysés
  regeneration_deadline?: string;
};

type ApercuResult = {
  titre: string;
  recommandation_courte: string;
  points_vigilance: string[];
};

type Credits = {
  document: number;   // crédits analyse simple (4,90€)
  complete: number;   // crédits analyse complète (19,90€+)
};

type AnalyseResult = {
  titre: string;           // nom doc (simple) ou adresse (complète)
  score?: number;
  recommandation?: string;
  resume: string;
  points_forts: string[];
  points_vigilance: string[];
  risques_financiers?: string;
  conclusion: string;
};

/* ══════════════════════════════════════════
   HOOK CRÉDITS — lecture depuis Supabase
══════════════════════════════════════════ */
function useCredits() {
  const [credits, setCredits] = useState<Credits>({ document: 0, complete: 0 });
  const [loadingCredits, setLoadingCredits] = useState(true);

  const fetchCredits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('credits_document, credits_complete')
      .eq('id', user.id)
      .single();
    if (data) {
      setCredits({
        document: data.credits_document || 0,
        complete: data.credits_complete || 0,
      });
    }
    setLoadingCredits(false);
  }, []);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const deductCredit = async (type: 'document' | 'complete') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const field = type === 'document' ? 'credits_document' : 'credits_complete';
    const current = type === 'document' ? credits.document : credits.complete;
    if (current <= 0) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: current - 1 })
      .eq('id', user.id);
    if (error) return false;
    setCredits(prev => ({ ...prev, [type]: current - 1 }));
    return true;
  };

  return { credits, loadingCredits, fetchCredits, deductCredit };
}


/* ══════════════════════════════════════════
   NAV
══════════════════════════════════════════ */
const navItems = [
  { to: '/dashboard',                  icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/dashboard/analyses',         icon: FileText,        label: 'Mes analyses' },
  { to: '/dashboard/compare',          icon: GitCompare,      label: 'Comparer mes biens' },
  { to: '/dashboard/tarifs',            icon: CreditCard,      label: 'Tarifs' },
  { to: '/dashboard/compte',           icon: User,            label: 'Mon compte' },
  { to: '/dashboard/support',          icon: LifeBuoy,        label: 'Support / Aide' },
];

/* ══════════════════════════════════════════
   HOOK
══════════════════════════════════════════ */
function useUser() {
  // Lecture instantanée depuis localStorage — zéro flash
  const [name, setName] = useState<string>(() => localStorage.getItem('verimo_user_name') || '');
  const [email, setEmail] = useState<string>(() => localStorage.getItem('verimo_user_email') || '');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const n = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur';
        const e = user.email || '';
        setName(n);
        setEmail(e);
        // Mise en cache pour le prochain chargement
        localStorage.setItem('verimo_user_name', n);
        localStorage.setItem('verimo_user_email', e);
      }
    });
  }, []);
  return { name, email };
}

/* ─── HOOK ANALYSES ──────────────────────── */
function useAnalyses() {
  const [analyses, setAnalyses] = useState<Analyse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAnalyses();
      const mapped: Analyse[] = data.map((a: AnalyseDB) => {
        const result = a.result as Record<string, unknown> | null;
        const score = result?.score as number | undefined;
        const reco = result?.recommandation as string | undefined;
        const recoColor = reco === 'Acheter' ? '#16a34a'
          : reco === 'Négocier' ? '#d97706'
          : reco === 'Bien à éviter' ? '#dc2626'
          : '#7c3aed';
        return {
          id: a.id,
          type: (a.type === 'pack2' || a.type === 'pack3' ? 'complete' : a.type) as 'document' | 'complete',
          status: (a.status === 'completed' ? 'completed'
            : a.status === 'failed' ? 'error'
            : 'processing') as 'completed' | 'processing' | 'error',
          nom_document: a.type === 'document' ? a.title : undefined,
          adresse_bien: a.type !== 'document' ? (a.address || a.title) : undefined,
          score,
          recommandation: reco,
          recommandationColor: reco ? recoColor : undefined,
          date: new Date(a.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }),
          price: a.type === 'document' ? '4,90€'
            : a.type === 'complete' ? '19,90€'
            : a.type === 'pack2' ? '29,90€'
            : '39,90€',
          is_preview: a.is_preview ?? false,
          document_names: a.document_names || [],
          regeneration_deadline: a.regeneration_deadline || undefined,
        };
      });
      setAnalyses(mapped);
      setLoading(false);
    };
    load();
  }, []);

  return { analyses, loading };
}



/* ══════════════════════════════════════════
   SCORE BADGE
══════════════════════════════════════════ */
function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 14 ? '#16a34a' : score >= 10 ? '#d97706' : '#dc2626';
  const bg    = score >= 14 ? '#f0fdf4' : score >= 10 ? '#fffbeb' : '#fef2f2';
  const bord  = score >= 14 ? '#bbf7d0' : score >= 10 ? '#fde68a' : '#fecaca';
  const fs    = size === 'lg' ? 52 : size === 'md' ? 18 : 14;
  const pad   = size === 'lg' ? '12px 28px' : size === 'md' ? '5px 12px' : '3px 9px';
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', gap:2, padding:pad, borderRadius:10, background:bg, border:`1.5px solid ${bord}`, fontSize:fs, fontWeight:900, color, letterSpacing:'-0.01em', flexShrink:0 }}>
      {score.toFixed(1)}<span style={{ fontSize: fs * 0.55, fontWeight:600, opacity:0.65 }}>/20</span>
    </span>
  );
}

/* ══════════════════════════════════════════
   CREDITS DISPLAY
══════════════════════════════════════════ */

/* ══════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════ */
function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const { credits } = useCredits();

  return (
    <aside style={{ width:260, minHeight:'100vh', height:'100%', background:'#fff', display:'flex', flexDirection:'column', borderRight:'1px solid #edf2f7', boxShadow:'2px 0 16px rgba(15,45,61,0.05)' }}>
      {/* Logo */}
      <div style={{ height:68, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:'1px solid #f0f5f9', flexShrink:0 }}>
        <Link to="/" onClick={onClose}><img src="/logo.png" alt="Verimo" style={{ height:28, objectFit:'contain' }}/></Link>
        {onClose && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}><X size={18}/></button>}
      </div>

      {/* CTA */}
      <div style={{ padding:'16px 14px 10px' }}>
        <Link to="/dashboard/nouvelle-analyse" onClick={onClose}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:12, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:700, boxShadow:'0 4px 14px rgba(42,125,156,0.3)', transition:'all 0.2s' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 6px 20px rgba(42,125,156,0.42)'; el.style.transform='translateY(-1px)'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 14px rgba(42,125,156,0.3)'; el.style.transform='translateY(0)'; }}>
          <Plus size={15} strokeWidth={2.5}/> Nouvelle analyse
        </Link>
      </div>

      {/* Crédits mini */}
      <div style={{ margin:'0 14px 8px', padding:'12px', borderRadius:10, background:'#f8fafc', border:'1px solid #edf2f7' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.12em', marginBottom:8 }}>CRÉDITS RESTANTS</div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', borderRadius:8, background:'#f8fafc', border:'1px solid #edf2f7' }}>
            <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Document</span>
            <span style={{ fontSize:12, fontWeight:900, color:credits.document > 0 ? '#2a7d9c' : '#94a3b8' }}>
              {credits.document} crédit{credits.document > 1 ? 's' : ''} restant{credits.document > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', borderRadius:8, background:'#f8fafc', border:'1px solid #edf2f7' }}>
            <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Complète</span>
            <span style={{ fontSize:12, fontWeight:900, color:credits.complete > 0 ? '#0f2d3d' : '#94a3b8' }}>
              {credits.complete} crédit{credits.complete > 1 ? 's' : ''} restant{credits.complete > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Link to="/dashboard/tarifs" onClick={onClose} style={{ display:'block', marginTop:8, fontSize:11, fontWeight:700, color:'#2a7d9c', textDecoration:'none', textAlign:'center' }}>
          {credits.document === 0 && credits.complete === 0 ? '+ Acheter une analyse' : '+ Recharger'}
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'4px 10px', display:'flex', flexDirection:'column', gap:1, overflowY:'auto' }}>
        <p style={{ fontSize:10, fontWeight:700, color:'#b0bec5', letterSpacing:'0.14em', padding:'8px 10px 5px', textTransform:'uppercase' }}>Menu</p>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, textDecoration:'none', fontSize:13.5, fontWeight:active?700:500, color:active?'#0f2d3d':'#64748b', background:active?'#f0f7fb':'transparent', transition:'all 0.15s', position:'relative' }}
              onMouseOver={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='#f8fafc'; }}
              onMouseOut={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
              {active && <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:99, background:'#2a7d9c' }}/>}
              <Icon size={16} style={{ color:active?'#2a7d9c':'#94a3b8', flexShrink:0 }}/>{item.label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}

/* ══════════════════════════════════════════
   TOPBAR
══════════════════════════════════════════ */
function Topbar({ onMenuClick, title }: { onMenuClick:()=>void; title:string }) {
  const { name, email } = useUser();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.clear();
    supabase.auth.signOut();
    window.location.replace('/');
  };

  return (
    <header style={{ height:68, background:'#fff', borderBottom:'1px solid #edf2f7', display:'flex', alignItems:'center', padding:'0 24px', gap:12, position:'sticky', top:0, zIndex:40, flexShrink:0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background:'none', border:'none', cursor:'pointer', color:'#0f2d3d', padding:4, display:'none' }}><Menu size={20}/></button>
      <p style={{ flex:1, fontSize:17, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em', margin:0 }}>{title}</p>
      <button style={{ width:36, height:36, borderRadius:9, background:'#f8fafc', border:'1px solid #edf2f7', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}><Bell size={15}/></button>
      {isAdmin && (
        <button onClick={() => navigate('/admin')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:9, background:'linear-gradient(135deg,#0f2d3d,#1a4a60)', border:'none', cursor:'pointer', color:'#fff', fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>
          <Shield size={13}/> Espace Admin
        </button>
      )}

      {/* Bouton profil + dropdown */}
      <div ref={dropdownRef} style={{ position:'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 10px 6px 6px', borderRadius:10, background: dropdownOpen ? '#f0f7fb' : '#f8fafc', border:`1px solid ${dropdownOpen ? '#c7dde8' : '#edf2f7'}`, cursor:'pointer', transition:'all 0.15s' }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>
            {(name.charAt(0) || 'U').toUpperCase()}
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap' }} className="topbar-cta">{name || 'Mon compte'}</span>
          <ChevronDown size={13} style={{ color:'#94a3b8', transition:'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
        </button>

        {dropdownOpen && (
          <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:220, background:'#fff', borderRadius:14, border:'1px solid #edf2f7', boxShadow:'0 16px 48px rgba(0,0,0,0.12)', zIndex:9999, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f5f9' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{name}</div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{email}</div>
            </div>
            <button onClick={() => { navigate('/dashboard/compte'); setDropdownOpen(false); }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'#0f172a', textAlign:'left' as const }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.background='#f8fafc'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.background='none'}>
              <User size={15} style={{ color:'#2a7d9c' }}/> Mon profil
            </button>
            <button onClick={handleLogout}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'none', border:'none', borderTop:'1px solid #f0f5f9', cursor:'pointer', fontSize:13, fontWeight:600, color:'#ef4444', textAlign:'left' as const }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.background='#fef2f2'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.background='none'}>
              <LogOut size={15}/> Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}




/* ══════════════════════════════════════════
   ROOT LAYOUT
══════════════════════════════════════════ */
export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/connexion');
    });
  }, [navigate]);

  const title = navItems.find(i => i.to === location.pathname)?.label || 'Mon espace';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f9fb', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <div className="desktop-sidebar" style={{ width:260, flexShrink:0 }}>
        <div style={{ position:'fixed', top:0, left:0, width:260, height:'100vh', zIndex:50, overflowY:'auto' }}>
          <Sidebar/>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'fixed', inset:0, zIndex:200 }}>
            <div onClick={()=>setMobileOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(15,45,61,0.35)', backdropFilter:'blur(4px)' }}/>
            <motion.div initial={{ x:-260 }} animate={{ x:0 }} exit={{ x:-260 }} transition={{ type:'spring', stiffness:320, damping:32 }}
              style={{ position:'absolute', left:0, top:0, bottom:0, width:260 }}>
              <Sidebar onClose={()=>setMobileOpen(false)}/>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Topbar onMenuClick={()=>setMobileOpen(true)} title={title}/>
        <DashboardBanner />
        <main style={{ flex:1, padding:'28px 20px', overflowX:'hidden' }}>
          <div style={{ maxWidth:1040, margin:'0 auto' }}>
            <DashboardContent path={location.pathname}/>
          </div>
        </main>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .topbar-cta { display: none !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .action-grid { grid-template-columns: 1fr !important; }
          .compare-grid { grid-template-columns: 1fr !important; }
          .result-grid { grid-template-columns: 1fr !important; }
          .type-grid { grid-template-columns: 1fr !important; }
          .credit-detail { flex-direction: column !important; }
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

/* ══════════════════════════════════════════
   BANNIÈRE DASHBOARD
══════════════════════════════════════════ */
function DashboardBanner() {
  const [banner, setBanner] = useState<{ id: string; message: string; type: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        const b = data[0];
        // Clé unique par bannière ET par utilisateur pour reset à chaque connexion
        const key = `verimo_banner_${b.id}_${user?.id}`;
        if (sessionStorage.getItem(key) === 'dismissed') {
          setDismissed(true);
        }
        setBanner(b);
      }
    };
    load();
  }, []);

  const handleDismiss = async () => {
    if (!banner) return;
    const { data: { user } } = await supabase.auth.getUser();
    const key = `verimo_banner_${banner.id}_${user?.id}`;
    sessionStorage.setItem(key, 'dismissed');
    setDismissed(true);
  };

  if (!banner || dismissed) return null;

  const STYLES: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    info:    { bg: '#f0f7fb', border: '#bae3f5', color: '#2a7d9c', icon: 'ℹ️' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', icon: '⚠️' },
    success: { bg: '#f0fdf4', border: '#86efac', color: '#16a34a', icon: '✅' },
  };
  const s = STYLES[banner.type] || STYLES.info;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: s.bg, borderBottom: `1.5px solid ${s.border}` }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: s.color }}>{banner.message}</span>
      <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, opacity: 0.5, padding: 4, flexShrink: 0 }}>
        <X size={15} />
      </button>
    </div>
  );
}

function DashboardContent({ path }: { path:string }) {
  if (path === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse/>;
  if (path === '/dashboard/tarifs')           return <Tarifs/>;
  if (path === '/dashboard/analyses')          return <MesAnalyses/>;
  if (path === '/dashboard/compare')           return <Compare/>;
  if (path === '/dashboard/compte')            return <Compte/>;
  if (path === '/dashboard/support')           return <Support/>;
  return <HomeView/>;
}

/* ══════════════════════════════════════════
   HOME VIEW
══════════════════════════════════════════ */
function HomeView() {
  const { name } = useUser();
  const { analyses } = useAnalyses();
  const { credits } = useCredits();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const hasAnalyses = analyses.length > 0;
  const [freePreviewUsedHome, setFreePreviewUsedHome] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setFreePreviewUsedHome(true); return; }
      const { data } = await supabase.from('profiles').select('free_preview_used').eq('id', user.id).single();
      const used = data?.free_preview_used === true;
      if (used) localStorage.setItem('verimo_free_preview_used', 'true');
      else localStorage.removeItem('verimo_free_preview_used');
      setFreePreviewUsedHome(used);
    };
    sync();
  }, []);

  const totalAnalyses = analyses.length;
  const lastAnalyse = [...analyses].sort((a: Analyse, b: Analyse) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const completedComplete = analyses.filter(a => a.type === 'complete' && a.status === 'completed' && a.score != null);
  const avgScore = completedComplete.length > 0
    ? (completedComplete.reduce((s: number, a: Analyse) => s + (a.score||0), 0) / completedComplete.length).toFixed(1)
    : null;

const penalties = [
    { cat: 'Travaux', items: [{ l: 'Gros travaux évoqués non votés', v: '-2 à -3' }, { l: 'Travaux urgents non anticipés', v: '-3 à -4' }] },
    { cat: 'Procédures', items: [{ l: 'Copro vs syndic', v: '-2 à -4' }, { l: 'Copro vs copropriétaire', v: '-0,5 à -1' }, { l: 'Copropriété en difficulté', v: '-3 à -4' }] },
    { cat: 'Finances', items: [{ l: 'Écart budget >30%', v: '-3' }, { l: 'Écart budget 15-30%', v: '-2' }, { l: 'Fonds travaux nul', v: '-2' }, { l: 'Impayés charges', v: '-1 à -2' }] },
    { cat: 'Diagnostics privatifs', items: [{ l: 'DPE F (résidence principale)', v: '-2' }, { l: 'DPE G (résidence principale)', v: '-3' }, { l: 'DPE F (investissement)', v: '-4' }, { l: 'DPE G (investissement)', v: '-6' }, { l: 'Électricité anomalies majeures', v: '-2' }, { l: 'Amiante accessible dégradé', v: '-2' }, { l: 'Termites non traités', v: '-2' }] },
    { cat: 'Diagnostics communs', items: [{ l: 'Amiante parties communes dégradé', v: '-2' }, { l: 'Termites parties communes non traités', v: '-2' }] },
  ];

  const bonuses = [
    { l: 'Travaux votés (à la charge du vendeur)', v: '+0,5 à +1' },
    { l: 'Garantie décennale sur travaux récents', v: '+0,5 à +1' },
    { l: 'Fonds travaux conforme au minimum légal', v: '+0,5' },
    { l: 'Fonds travaux au-dessus du minimum légal', v: '+1' },
    { l: 'Certificat entretien chaudière/ramonage', v: '+0,5' },
    { l: 'Immeuble bien entretenu', v: '+0,5' },
    { l: 'DPE A', v: '+1' },
    { l: 'DPE B ou C', v: '+0,5' },
  ];

  const scale = [
    { r: '17 – 20', l: 'Bien irréprochable', c: '#15803d', bg: '#f0fdf4' },
    { r: '14 – 16', l: 'Bien sain', c: '#16a34a', bg: '#f0fdf4' },
    { r: '10 – 13', l: 'Bien correct avec réserves', c: '#d97706', bg: '#fffbeb' },
    { r: '7 – 9', l: 'Bien risqué', c: '#ea580c', bg: '#fff7ed' },
    { r: '0 – 6', l: 'Bien à éviter', c: '#dc2626', bg: '#fef2f2' },
  ];

  const tips = [
    { color: '#d97706', title: 'Points de vigilance', desc: 'Un DPE classé F ou G peut impacter la valeur du bien. Les travaux votés en AG mais non réalisés sont à surveiller de près.' },
    { color: '#16a34a', title: 'Documents à prioriser', desc: 'PV d\'AG, règlement de copropriété, DPE, diagnostic électricité et gaz, appels de charges — ce sont les docs les plus riches en informations.' },
    { color: '#7c3aed', title: 'Vos rapports sont permanents', desc: 'Chaque rapport est sauvegardé définitivement dans votre espace. Consultez-le et téléchargez-le en PDF à tout moment.' },
    { color: '#dc2626', title: 'Besoin d\'aide ?', desc: 'Notre équipe est disponible depuis la page Support pour toute question sur votre rapport ou l\'utilisation de Verimo.' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, animation:'fadeUp 0.35s ease both' }}>

      {/* ── Greeting */}
      <div>
        <h1 style={{ fontSize:'clamp(26px,3vw,34px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>
          {greeting}{name ? `, ${name}` : ''} 👋
        </h1>
        <p style={{ fontSize:15, color:'#94a3b8' }}>
          {hasAnalyses ? 'Bienvenue sur votre espace Verimo.' : 'Bienvenue sur Verimo — lancez votre première analyse.'}
        </p>
      </div>

      {/* ── Bandeau offre gratuite */}
      {freePreviewUsedHome === false && credits.document === 0 && credits.complete === 0 && (
        <div style={{ background:'#0f2d3d', borderRadius:16, padding:'22px 28px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(42,125,156,0.18)', pointerEvents:'none' }}/>
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, animation:'pulseGlow 2.5s ease-in-out infinite' }}>
              <Sparkles size={24} style={{ color:'#fff' }}/>
            </div>
            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ fontSize:18, fontWeight:900, color:'#fff', marginBottom:4 }}>1 analyse offerte 🎁</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:1.5 }}>Profitez d&apos;une analyse gratuite pour visualiser un aperçu du rapport et découvrir notre outil.</div>
            </div>
            <Link to="/dashboard/nouvelle-analyse" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:10, background:'#fff', color:'#0f2d3d', fontSize:14, fontWeight:800, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
              <ArrowRight size={14}/> En profiter
            </Link>
          </div>
        </div>
      )}

      {/* ── Stats si analyses existantes */}
      {hasAnalyses && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }} className="stats-grid">
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #edf2f7', padding:'18px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', marginBottom:8 }}>ANALYSES TOTALES</div>
            <div style={{ fontSize:34, fontWeight:900, color:'#0f172a', letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{totalAnalyses}</div>
            {avgScore ? <div style={{ fontSize:12, color:'#16a34a', fontWeight:700 }}>Note moyenne : {avgScore}/20</div> : <div style={{ fontSize:12, color:'#94a3b8' }}>Aucune analyse complète</div>}
          </div>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #edf2f7', padding:'18px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', marginBottom:8 }}>DERNIÈRE ANALYSE</div>
            {lastAnalyse ? (
              <>
                <div style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{lastAnalyse.date}</div>
                <div style={{ fontSize:12, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {lastAnalyse.type === 'complete' ? lastAnalyse.adresse_bien : lastAnalyse.nom_document}
                </div>
              </>
            ) : <div style={{ fontSize:14, color:'#94a3b8' }}>Aucune encore</div>}
          </div>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #edf2f7', padding:'18px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', marginBottom:8 }}>CRÉDITS</div>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1, textAlign:'center', padding:'8px', borderRadius:8, background:'#f8fafc', border:'1px solid #edf2f7' }}>
                <div style={{ fontSize:20, fontWeight:900, color:credits.document>0?'#2a7d9c':'#94a3b8' }}>{credits.document}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8' }}>SIMPLE</div>
              </div>
              <div style={{ flex:1, textAlign:'center', padding:'8px', borderRadius:8, background:'#f8fafc', border:'1px solid #edf2f7' }}>
                <div style={{ fontSize:20, fontWeight:900, color:credits.complete>0?'#0f2d3d':'#94a3b8' }}>{credits.complete}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8' }}>COMPLÈTE</div>
              </div>
            </div>
            <Link to="/dashboard/tarifs" style={{ fontSize:12, fontWeight:700, color:'#2a7d9c', textDecoration:'none', display:'block', marginTop:8 }}>+ Acheter des crédits</Link>
          </div>
        </div>
      )}

      {/* ── Analyses récentes */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>Analyses récentes</h2>
          {hasAnalyses && <Link to="/dashboard/analyses" style={{ fontSize:13, color:'#2a7d9c', textDecoration:'none', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>Tout voir <ChevronRight size={14}/></Link>}
        </div>
        {!hasAnalyses ? <EmptyAnalyses/> : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{analyses.slice(0,3).map(a=><AnalyseRow key={a.id} a={a}/>)}</div>
        )}
      </div>

      {/* ── Layout 2 colonnes : Guide + Droite */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }} className="compare-grid">

        {/* ── Colonne gauche */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Guide étapes */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', overflow:'hidden' }}>
            <div style={{ background:'#0f2d3d', padding:'16px 20px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FileText size={14} style={{ color:'#fff' }}/>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Comment ça marche</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>4 étapes pour analyser votre bien</div>
              </div>
            </div>
            <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:0 }}>
              {[
                { num:'1', title:'Rassemblez vos documents', desc:'PV d\'AG, règlement de copropriété, diagnostics, appels de charges — tout au même endroit.' },
                { num:'2', title:'Choisissez votre analyse', desc:'Simple (4,90€) pour un document. Complète (19,90€) pour un rapport global avec note /20.' },
                { num:'3', title:'Uploadez en quelques secondes', desc:'Glissez-déposez vos fichiers PDF, Word ou images directement.' },
                { num:'4', title:'Rapport prêt en 30 secondes', desc:'Note /20, risques, travaux et recommandation personnalisée. Téléchargeable en PDF.' },
              ].map((step, i, arr) => (
                <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'#0f2d3d', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800 }}>{step.num}</div>
                    {i < arr.length - 1 && <div style={{ width:2, height:20, background:'#e2e8f0', margin:'3px 0' }}/>}
                  </div>
                  <div style={{ paddingBottom: i < arr.length - 1 ? 8 : 0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:3 }}>{step.title}</div>
                    <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips bordure colorée */}
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:12 }}>Conseils & astuces</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ background:'#fff', borderLeft:`4px solid ${tip.color}`, borderTop:'0.5px solid #edf2f7', borderRight:'0.5px solid #edf2f7', borderBottom:'0.5px solid #edf2f7', borderRadius:'0 10px 10px 0', padding:'14px 18px' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:4 }}>{tip.title}</div>
                  <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Conseil important */}
          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:14, padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:18 }}>💡</span>
              <span style={{ fontSize:13, fontWeight:800, color:'#92400e' }}>Conseil important Verimo</span>
            </div>
            <div style={{ fontSize:13, color:'#78350f', lineHeight:1.7 }}>
              Plus vous fournissez de documents pour une analyse complète, plus la note /20 sera précise et le rapport détaillé.<br/><br/>
              Idéalement : 3 derniers PV d&apos;AG + DPE + règlement de copropriété + appels de charges.
            </div>
          </div>

          {/* Glossaire immobilier */}
          <GlossaireBlock/>

        </div>
      </div>

      {/* ── Section note /20 — pleine largeur avec onglets */}
      <NoteExplicativeBlock penalties={penalties} bonuses={bonuses} scale={scale}/>

    </div>
  );
}

/* ─── GLOSSAIRE ─────────────────────────── */
function GlossaireBlock() {
  const [open, setOpen] = useState<number|null>(null);
  const termes = [
    { t: "PV d'AG", d: "Procès-verbal d'Assemblée Générale — compte-rendu officiel des décisions votées par les copropriétaires lors de leur réunion annuelle. Contient les travaux votés, les charges, les litiges." },
    { t: "DPE", d: "Diagnostic de Performance Énergétique — note de A (très économe) à G (très énergivore) évaluant la consommation d'énergie du logement. Un DPE F ou G peut impacter la valeur et la revente." },
    { t: "Fonds de travaux", d: "Somme mise de côté chaque année par la copropriété pour financer les futurs travaux importants. Un fonds bien provisionné est rassurant pour l'acheteur." },
    { t: "Charges de copropriété", d: "Frais mensuels ou trimestriels payés par chaque copropriétaire pour l'entretien des parties communes (ascenseur, jardins, gardien, etc.)." },
    { t: "Règlement de copropriété", d: "Document juridique définissant les règles de vie dans la copropriété, la répartition des charges et l'usage des parties communes et privatives." },
    { t: "Appel de charges", d: "Document envoyé par le syndic demandant le paiement des charges de copropriété. Permet de vérifier le montant réel des charges courantes." },
  ];
  return (
    <div style={{ background:'#fff', border:'1px solid #edf2f7', borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #edf2f7', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'#2a7d9c', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Info size={14} style={{ color:'#fff' }}/>
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>Glossaire immobilier</div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>6 termes clés expliqués simplement</div>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column' }}>
        {termes.map((terme, i) => (
          <div key={i} style={{ borderBottom: i < termes.length-1 ? '0.5px solid #edf2f7' : 'none' }}>
            <button onClick={()=>setOpen(open===i?null:i)}
              style={{ width:'100%', padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{terme.t}</span>
              <ChevronDown size={14} style={{ color:'#94a3b8', flexShrink:0, transform:open===i?'rotate(180deg)':'none', transition:'transform 0.2s' }}/>
            </button>
            {open===i && (
              <div style={{ padding:'0 18px 14px', fontSize:13, color:'#64748b', lineHeight:1.7 }}>
                {terme.d}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── NOTE EXPLICATIVE ───────────────────── */
function NoteExplicativeBlock({ penalties, bonuses, scale }: {
  penalties: { cat: string; items: { l: string; v: string }[] }[];
  bonuses: { l: string; v: string }[];
  scale: { r: string; l: string; c: string; bg: string }[];
}) {
  const [activeTab, setActiveTab] = useState<'bonus'|'penalites'|'echelle'>('bonus');
  const tabs: { id: 'bonus'|'penalites'|'echelle'; label: string }[] = [
    { id: 'bonus', label: '✓ Bonus' },
    { id: 'penalites', label: '− Pénalités' },
    { id: 'echelle', label: '📊 Échelle' },
  ];
  return (
    <div style={{ background:'#fff', border:'1px solid #edf2f7', borderRadius:16, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'20px 28px', borderBottom:'1px solid #edf2f7', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'#0f2d3d', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Star size={18} style={{ color:'#fff' }}/>
        </div>
        <div>
          <div style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:2 }}>Découvrez comment nous calculons la note /20</div>
          <div style={{ fontSize:13, color:'#94a3b8' }}>Transparence totale sur notre méthode de calcul</div>
        </div>
      </div>

      <div style={{ padding:'20px 28px', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Point de départ */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'#f0f7fb', borderRadius:12 }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background:'#2a7d9c', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, flexShrink:0 }}>20</div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:2 }}>Note sur 20 points</div>
            <div style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>On démarre toujours de la note maximale. Notre outil retire des points selon les risques détectés dans vos documents, et en ajoute pour les points positifs.</div>
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display:'flex', gap:8, padding:'4px', background:'#f8fafc', borderRadius:12 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{ flex:1, padding:'10px', borderRadius:9, border:'none', background:activeTab===tab.id?'#fff':'transparent', color:activeTab===tab.id?'#0f172a':'#94a3b8', fontSize:13, fontWeight:activeTab===tab.id?700:500, cursor:'pointer', boxShadow:activeTab===tab.id?'0 1px 4px rgba(0,0,0,0.08)':'none', transition:'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu onglet Bonus */}
        {activeTab==='bonus' && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>Ces éléments <strong>ajoutent</strong> des points à la note finale :</div>
            <div style={{ background:'#fff', border:'0.5px solid #edf2f7', borderRadius:10, overflow:'hidden' }}>
              {bonuses.map((b, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderTop:i>0?'0.5px solid #edf2f7':'none' }}>
                  <span style={{ fontSize:13, color:'#374151' }}>{b.l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#16a34a', background:'#f0fdf4', padding:'3px 10px', borderRadius:6 }}>{b.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenu onglet Pénalités */}
        {activeTab==='penalites' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:2 }}>Ces éléments <strong>retirent</strong> des points à la note finale :</div>
            {penalties.map((p, i) => (
              <div key={i} style={{ background:'#fff', border:'0.5px solid #edf2f7', borderRadius:10, overflow:'hidden' }}>
                <div style={{ padding:'7px 14px', background:'#fef2f2', fontSize:11, fontWeight:700, color:'#dc2626', letterSpacing:'0.04em' }}>{p.cat.toUpperCase()}</div>
                {p.items.map((item, j) => (
                  <div key={j} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 14px', borderTop:'0.5px solid #edf2f7' }}>
                    <span style={{ fontSize:13, color:'#374151' }}>{item.l}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:'#dc2626', background:'#fef2f2', padding:'3px 10px', borderRadius:6 }}>{item.v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Contenu onglet Échelle */}
        {activeTab==='echelle' && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>Comment interpréter votre note :</div>
            {scale.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:10, background:s.bg }}>
                <span style={{ fontSize:16, fontWeight:900, color:s.c }}>{s.r}</span>
                <span style={{ fontSize:13, fontWeight:600, color:s.c }}>{s.l}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding:'12px 16px', background:'#f8fafc', borderRadius:10, fontSize:12, color:'#94a3b8', lineHeight:1.6 }}>
          La note est arrondie au 0,5 près et établie uniquement à partir des documents fournis. Elle ne remplace pas une visite du bien ni l&apos;avis d&apos;un professionnel.
        </div>
      </div>
    </div>
  );
}




/* ─── EMPTY STATE ────────────────────────── */
function EmptyAnalyses() {
  return (
    <div style={{ background:'#fff', borderRadius:18, border:'2px dashed #e2e8f0', padding:'48px 32px', textAlign:'center' }}>
      <div style={{ width:64, height:64, borderRadius:18, background:'rgba(42,125,156,0.07)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
        <Sparkles size={28} style={{ color:'#2a7d9c' }}/>
      </div>
      <h3 style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Aucune analyse pour le moment</h3>
      <p style={{ fontSize:13, color:'#94a3b8', marginBottom:24, lineHeight:1.6 }}>Déposez vos documents immobiliers et obtenez un rapport complet en moins de 2 minutes.</p>
      <Link to="/dashboard/nouvelle-analyse"
        style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 16px rgba(15,45,61,0.2)' }}>
        <Plus size={15}/> Lancer ma première analyse
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════
   ANALYSE ROW — avec logique nom/adresse
══════════════════════════════════════════ */
function AnalyseRow({ a }: { a:Analyse }) {
  const isComplete = a.type === 'complete';
  // Affichage du titre selon le type
  const displayTitle = isComplete
    ? (a.adresse_bien || 'Adresse en cours de détection…')
    : (a.nom_document || 'Document sans nom');

  const isPreview = a.is_preview ?? false;
  const typeLabel = isPreview ? 'Aperçu gratuit' : isComplete ? 'Analyse Complète' : 'Analyse Document';
  const typeBg    = isPreview ? 'rgba(22,163,74,0.07)' : isComplete ? 'rgba(15,45,61,0.07)' : 'rgba(42,125,156,0.07)';
  const typeColor = isPreview ? '#16a34a' : isComplete ? '#0f2d3d' : '#2a7d9c';

  return (
    <div style={{ background:'#fff', borderRadius:13, border:'1px solid #edf2f7', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', boxShadow:'0 1px 3px rgba(0,0,0,0.03)', transition:'all 0.18s' }}
      onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 18px rgba(42,125,156,0.08)'; el.style.transform='translateY(-1px)'; el.style.borderColor='#dbeafe'; }}
      onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 1px 3px rgba(0,0,0,0.03)'; el.style.transform='translateY(0)'; el.style.borderColor='#edf2f7'; }}>

      {/* Icone */}
      <div style={{ width:42, height:42, borderRadius:11, flexShrink:0, background:a.status==='processing'?'rgba(42,125,156,0.07)':`${isComplete?'#0f2d3d':'#2a7d9c'}0d`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {a.status==='processing'
          ? <div style={{ width:17, height:17, borderRadius:'50%', border:'2.5px solid #2a7d9c', borderTopColor:'transparent', animation:'spin 0.85s linear infinite' }}/>
          : isComplete ? <Building2 size={17} style={{ color:'#0f2d3d' }}/> : <FileText size={17} style={{ color:'#2a7d9c' }}/>}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayTitle}</div>
        <div style={{ fontSize:11, color:'#94a3b8', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ background:typeBg, borderRadius:5, padding:'2px 7px', fontSize:10, fontWeight:700, color:typeColor }}>{typeLabel}</span>
          <span>·</span><span>{a.date}</span>
          <span>·</span><span style={{ fontWeight:700, color:'#64748b' }}>{a.price}</span>
        </div>
      </div>

      {/* Droite */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, flexWrap:'wrap' }}>
        {a.status === 'processing' ? (
          <span style={{ fontSize:11, fontWeight:700, color:'#2a7d9c', background:'rgba(42,125,156,0.07)', padding:'4px 10px', borderRadius:7 }}>En cours…</span>
        ) : (
          <>
            {/* Score uniquement pour analyse complète */}
            {isComplete && a.score != null && <ScoreBadge score={a.score} size="sm"/>}
            {a.recommandation && (
              <span style={{ fontSize:11, fontWeight:700, color:a.recommandationColor, background:`${a.recommandationColor}10`, border:`1px solid ${a.recommandationColor}22`, padding:'4px 9px', borderRadius:7, whiteSpace:'nowrap' }}>{a.recommandation}</span>
            )}
            <Link to={`/dashboard/rapport?id=${a.id}`}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:8, background:'#f8fafc', border:'1px solid #edf2f7', fontSize:12, fontWeight:700, color:'#2a7d9c', cursor:'pointer', textDecoration:'none', whiteSpace:'nowrap', transition:'background 0.15s' }}
              onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='#e8f4f8'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='#f8fafc'}>
              <ExternalLink size={11}/> Rapport
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   NOUVELLE ANALYSE — avec logique crédits + API Claude
══════════════════════════════════════════ */
function NouvelleAnalyse() {
  const { credits, deductCredit } = useCredits();
  const [step, setStep] = useState<'choice'|'upload'|'analyse'|'apercu'|'result'>('choice');
  const [type, setType] = useState<'document'|'complete'|null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<AnalyseResult|null>(null);
  const [apercu, setApercu] = useState<ApercuResult|null>(null);
  const [apercuId, setApercuId] = useState<string|null>(null);
  const [freePreviewUsed, setFreePreviewUsed] = useState<boolean>(() => checkFreePreviewUsedSync());
  const [error, setError] = useState('');

  const plans = {
    document: { label:"Analyse d'un document",       price:'4,90€',  max:1,  desc:'Un seul fichier — PV d\'AG, règlement, diagnostic, appel de charges.', creditsKey:'document' as keyof Credits },
    complete: { label:"Analyse complète d'un logement", price:'19,90€', max:20, desc:'Tous les documents du bien — score /20, risques, recommandation Verimo.', creditsKey:'complete' as keyof Credits },
  };
  const plan = type ? plans[type] : null;

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(',')[1]);
      r.onerror = () => rej(new Error('Lecture impossible'));
      r.readAsDataURL(file);
    });

  const extractText = async (file: File): Promise<string> => {
    const b64 = await fileToBase64(file);
    const isPdf = file.type === 'application/pdf';
    const mediaType = isPdf ? 'application/pdf' : file.type as 'image/jpeg'|'image/png';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514', max_tokens:2000,
        messages:[{ role:'user', content:[
          { type:isPdf?'document':'image', source:{ type:'base64', media_type:mediaType, data:b64 } },
          { type:'text', text:'Extrais tout le texte de ce document immobilier de façon fidèle. Conserve les sections, données chiffrées et informations clés.' }
        ]}]
      })
    });
    const d = await res.json();
    return d.content?.find((b:any)=>b.type==='text')?.text || '';
  };

  /* ── Lancer l'APERÇU GRATUIT */
  const lancerApercu = async () => {
    if (!files.length || !type) return;
    setStep('analyse'); setError(''); setProgress(5); setProgressMsg('Lecture des documents…');

    const docNames = files.map(f => f.name);
    const analyseDB = await createApercu(type, files[0].name, 'rp', docNames);
    const analyseId = analyseDB?.id || null;

    try {
      const textes: string[] = [];
      for (let i=0; i<files.length; i++) {
        setProgressMsg(`Extraction document ${i+1}/${files.length}…`);
        setProgress(10 + Math.floor((i/files.length)*30));
        textes.push(`=== ${files[i].name} ===\n${await extractText(files[i])}`);
      }
      setProgress(50); setProgressMsg('Traitement en cours…');
      const systemPrompt = type === 'complete' ? PROMPT_APERCU_COMPLET : PROMPT_APERCU_SIMPLE;

      setProgress(70); setProgressMsg('Génération de votre aperçu…');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:800,
          system: systemPrompt,
          messages:[{ role:'user', content:`Documents à analyser :\n\n${textes.join('\n\n').slice(0,8000)}` }]
        })
      });
      setProgress(88); setProgressMsg('Finalisation…');
      const d = await res.json();
      const raw = d.content?.find((b:any)=>b.type==='text')?.text || '{}';
      const parsed: ApercuResult = JSON.parse(raw.replace(/```json|```/g,'').trim());

      if (analyseId) {
        const isComplete = type === 'complete';
        const title = parsed.titre || files[0].name;
        const address = isComplete ? (parsed.titre || null) : null;
        await updateApercuResult(analyseId, parsed as unknown as Record<string, unknown>, title, address);
        await markFreePreviewUsed();
      }

      setFreePreviewUsed(true);
      setProgress(100); setProgressMsg('Aperçu prêt !');
      await new Promise(r => setTimeout(r, 400));

      setApercu(parsed);
      setApercuId(analyseId);
      setFreePreviewUsed(true);
      setStep('apercu');
    } catch {
      if (analyseId) await markAnalyseFailed(analyseId);
      setError("Erreur lors de l'analyse. Vérifiez vos fichiers et réessayez.");
      setStep('upload');
    }
  };

  /* ── Lancer l'ANALYSE COMPLÈTE PAYANTE */
  const lancer = async () => {
    if (!files.length || !type) return;

    // Vérifier et déduire le crédit
    const creditType = type === 'document' ? 'document' : 'complete';
    const ok = await deductCredit(creditType);
    if (!ok) {
      setError("Vous n'avez plus de crédit disponible. Veuillez recharger votre compte.");
      return;
    }

    setStep('analyse'); setError(''); setProgress(5); setProgressMsg('Lecture des documents…');

    const docNames = files.map(f => f.name);
    const analyseDB = await createAnalyse(type, files[0].name, 'rp', docNames);
    const analyseId = analyseDB?.id || null;

    try {
      const textes: string[] = [];
      for (let i=0; i<files.length; i++) {
        setProgressMsg(`Extraction document ${i+1}/${files.length}…`);
        setProgress(10 + Math.floor((i/files.length)*30));
        textes.push(`=== ${files[i].name} ===\n${await extractText(files[i])}`);
      }
      setProgress(50); setProgressMsg('Traitement en cours…');
      const isComplete = type === 'complete';
      const systemPrompt = isComplete ? PROMPT_ANALYSE_COMPLETE : PROMPT_ANALYSE_SIMPLE;

      setProgress(70); setProgressMsg('Génération du rapport…');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1500,
          system: systemPrompt,
          messages:[{ role:'user', content:`Documents à analyser :\n\n${textes.join('\n\n').slice(0,8000)}` }]
        })
      });
      setProgress(88); setProgressMsg('Finalisation…');
      const d = await res.json();
      const raw = d.content?.find((b:any)=>b.type==='text')?.text || '{}';
      const parsed: AnalyseResult = JSON.parse(raw.replace(/```json|```/g,'').trim());

      if (analyseId) {
        const title = isComplete ? (parsed.titre || 'Bien analysé') : (parsed.titre || files[0].name);
        const address = isComplete ? (parsed.titre || null) : null;
        await updateAnalyseResult(analyseId, parsed as unknown as Record<string, unknown>, title, address, docNames);
      }

      setProgress(100); setProgressMsg('Rapport prêt !');
      await new Promise(r => setTimeout(r, 500));

      if (analyseId) {
        window.location.href = `/dashboard/rapport?id=${analyseId}`;
      } else {
        setResult(parsed);
        setStep('result');
      }
    } catch {
      if (analyseId) await markAnalyseFailed(analyseId);
      setError("Erreur lors de l'analyse. Vérifiez vos fichiers et réessayez.");
      setStep('upload');
    }
  };

  /* ── CHOICE */
  if (step==='choice') return (
    <div>
      <Link to="/dashboard" style={{ fontSize:13, color:'#94a3b8', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginBottom:24, fontWeight:600 }}><ChevronLeft size={14}/> Retour</Link>
      <h1 style={{ fontSize:'clamp(22px,3vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:6 }}>Que souhaitez-vous analyser ?</h1>
      <p style={{ fontSize:14, color:'#64748b', marginBottom:!freePreviewUsed?16:32 }}>Choisissez le mode d'analyse adapté à votre besoin.</p>

      {/* Badge aperçu — visible uniquement si pas encore utilisé */}
      {!freePreviewUsed && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderRadius:14, background:'linear-gradient(135deg, #0f2d3d, #1a5068)', marginBottom:28, boxShadow:'0 4px 16px rgba(15,45,61,0.18)' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Sparkles size={16} style={{ color:'#fff'}}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:900, color:'#fff', marginBottom:4 }}>1 analyse offerte 🎁</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>Profitez d'une analyse gratuite pour visualiser un aperçu du rapport et découvrir notre outil.</div>
          </div>
          <span style={{ fontSize:10, fontWeight:800, color:'#0f2d3d', background:'#fff', padding:'4px 12px', borderRadius:100, whiteSpace:'nowrap', flexShrink:0 }}>OFFERT</span>
        </div>
      )}

      <div className="type-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:0 }}>

        {/* ── Analyse simple */}
        <button onClick={()=>{ setType('document'); setStep('upload'); }}
          style={{ padding:'28px 24px', borderRadius:20, border:'1.5px solid #edf2f7', background:'#fff', cursor:'pointer', textAlign:'left', transition:'all 0.18s', position:'relative', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#2a7d9c'; el.style.boxShadow='0 8px 28px rgba(42,125,156,0.1)'; el.style.transform='translateY(-2px)'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#edf2f7'; el.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; el.style.transform='translateY(0)'; }}>
          {freePreviewUsed && (
            <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:credits.document>0?'#f0fdf4':'#f8fafc', color:credits.document>0?'#16a34a':'#94a3b8', border:`1px solid ${credits.document>0?'#bbf7d0':'#e2e8f0'}` }}>
              {credits.document > 0 ? `${credits.document} crédit${credits.document>1?'s':''} restant${credits.document>1?'s':''}` : '0 crédit'}
            </div>
          )}
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(42,125,156,0.08)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, marginTop: freePreviewUsed ? 8 : 0 }}>
            <FileText size={24} style={{ color:'#2a7d9c' }}/>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Analyse d&apos;un seul document</div>
          <div style={{ fontSize:12, color:'#64748b', lineHeight:1.7, marginBottom:20 }}>
            Retenez l&apos;essentiel d&apos;un document précis :<br/>
            <span style={{ color:'#94a3b8' }}>Règlement de copro, PV d&apos;AG, PV d&apos;AGE, diagnostic immeuble, diagnostic parties privatives, DPE, appel de charges…</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#2a7d9c', display:'flex', alignItems:'center', gap:5 }}>
              {freePreviewUsed && credits.document===0 ? <><Lock size={13}/> Acheter un crédit</> : <><ArrowRight size={14}/> Commencer</>}
            </span>
            {freePreviewUsed && <span style={{ fontSize:22, fontWeight:900, color:'#0f172a' }}>4,90€</span>}
          </div>
        </button>

        {/* ── Analyse complète */}
        <button onClick={()=>{ setType('complete'); setStep('upload'); }}
          style={{ padding:'28px 24px', borderRadius:20, border:'1.5px solid transparent', background:'linear-gradient(145deg, #0f2d3d, #1a5068)', cursor:'pointer', textAlign:'left', transition:'all 0.18s', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(15,45,61,0.15)' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 12px 40px rgba(15,45,61,0.28)'; el.style.transform='translateY(-2px)'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 20px rgba(15,45,61,0.15)'; el.style.transform='translateY(0)'; }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:14, left:14, fontSize:9, fontWeight:800, color:'#fff', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', padding:'3px 10px', borderRadius:100 }}>&#9733; RECOMMANDÉ</div>
          {freePreviewUsed && (
            <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:credits.complete>0?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.08)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}>
              {credits.complete > 0 ? `${credits.complete} crédit${credits.complete>1?'s':''} restant${credits.complete>1?'s':''}` : '0 crédit'}
            </div>
          )}
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, marginTop: freePreviewUsed ? 18 : 10 }}>
            <ShieldCheck size={24} style={{ color:'#fff' }}/>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:8 }}>Analyse complète d&apos;un logement</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.7, marginBottom:20 }}>
            Déposez tous vos documents d&apos;un seul coup :<br/>
            <span style={{ color:'rgba(255,255,255,0.45)' }}>PV AG 2022/2023/2024, règlement copro, DPE, diagnostic électricité, amiante, appels de charges…</span><br/>
            <span style={{ color:'rgba(255,255,255,0.8)', fontWeight:600 }}>Rapport détaillé avec score /10 et recommandation.</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:5 }}>
              {freePreviewUsed && credits.complete===0 ? <>Acheter un crédit <ArrowRight size={14}/></> : <>Commencer l&apos;audit <ArrowRight size={14}/></>}
            </span>
            {freePreviewUsed && <span style={{ fontSize:22, fontWeight:900, color:'#fff' }}>19,90€</span>}
          </div>
        </button>
      </div>
    </div>
  );

  /* ── UPLOAD */
  if (step==='upload' && plan) return (
    <div style={{ maxWidth:640, margin:'0 auto' }}>
      <button onClick={()=>{ setStep('choice'); setFiles([]); }} style={{ fontSize:13, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, marginBottom:24, fontWeight:600 }}><ChevronLeft size={14}/> Retour</button>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, padding:'16px 18px', background:'#fff', borderRadius:14, border:'1px solid #edf2f7' }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'rgba(42,125,156,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {type==='complete'?<ShieldCheck size={19} style={{ color:'#2a7d9c' }}/>:<FileText size={19} style={{ color:'#2a7d9c' }}/>}
        </div>
        <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{plan.label}</div><div style={{ fontSize:12, color:'#94a3b8' }}>{plan.desc}</div></div>
        <span style={{ fontSize:16, fontWeight:900, color:'#2a7d9c', flexShrink:0 }}>{plan.price}</span>
      </div>
      {error && (
        <div style={{ padding:'12px 16px', borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca', display:'flex', gap:10, alignItems:'center', marginBottom:16 }}>
          <AlertTriangle size={15} color="#dc2626" style={{ flexShrink:0 }}/><span style={{ fontSize:13, color:'#dc2626' }}>{error}</span>
        </div>
      )}
      <div onClick={()=>document.getElementById('file-input')?.click()}
        style={{ padding:'52px 32px', borderRadius:18, border:'2px dashed #dde6ec', background:'#fafcfe', textAlign:'center', cursor:'pointer', marginBottom:14, transition:'all 0.18s' }}
        onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#2a7d9c'; el.style.background='rgba(42,125,156,0.02)'; }}
        onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#dde6ec'; el.style.background='#fafcfe'; }}
        onDragOver={e=>{ e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor='#2a7d9c'; }}
        onDrop={e=>{ e.preventDefault(); setFiles(prev=>[...prev,...Array.from(e.dataTransfer.files)].slice(0,plan.max)); }}>
        <input id="file-input" type="file" multiple={plan.max>1} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display:'none' }}
          onChange={e=>{ if(e.target.files) setFiles(prev=>[...prev,...Array.from(e.target.files!)].slice(0,plan.max)); }}/>
        <div style={{ width:54, height:54, borderRadius:15, background:'rgba(42,125,156,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
          <Upload size={24} style={{ color:'#2a7d9c' }}/>
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:'#0f172a', marginBottom:5 }}>Déposez vos documents ici</div>
        <div style={{ fontSize:13, color:'#94a3b8' }}>ou <span style={{ color:'#2a7d9c', fontWeight:700 }}>cliquez pour sélectionner</span></div>
        <div style={{ fontSize:12, color:'#cbd5e1', marginTop:7 }}>PDF, Word, JPG/PNG · Max {plan.max} fichier{plan.max>1?'s':''}</div>
      </div>
      {files.length>0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {files.map((f,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:'#fff', border:'1px solid #edf2f7' }}>
              <FileText size={14} color="#2a7d9c" style={{ flexShrink:0 }}/>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
              <span style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>{(f.size/1024).toFixed(0)} Ko</span>
              <CheckCircle size={13} color="#16a34a" style={{ flexShrink:0 }}/>
              <button onClick={()=>setFiles(prev=>prev.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18, lineHeight:1, flexShrink:0 }}>×</button>
            </div>
          ))}
        </div>
      )}
      {/* Badge aperçu si encore disponible */}
      {!freePreviewUsed && (
        <div style={{ padding:'12px 16px', borderRadius:12, background:'linear-gradient(135deg, #0f2d3d, #1a5068)', display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <Sparkles size={13} style={{ color:'#fff', flexShrink:0 }}/>
          <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>Votre analyse offerte — aperçu du rapport généré gratuitement.</span>
        </div>
      )}
      <button onClick={!freePreviewUsed ? lancerApercu : lancer} disabled={files.length===0}
        style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:files.length>0?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#e2e8f0', color:files.length>0?'#fff':'#94a3b8', fontSize:15, fontWeight:800, cursor:files.length>0?'pointer':'default', boxShadow:files.length>0?'0 4px 18px rgba(15,45,61,0.2)':'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.15s' }}>
        <Sparkles size={16}/> {!freePreviewUsed ? 'Générer mon aperçu gratuit' : 'Analyser'} {files.length>0?`(${files.length} fichier${files.length>1?'s':''})` : ''}
      </button>
    </div>
  );

  /* ── LOADING */
  if (step==='analyse') return (
    <div style={{ maxWidth:480, margin:'80px auto 0', textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg, rgba(42,125,156,0.1), rgba(15,45,61,0.07))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', animation:'float 3s ease-in-out infinite' }}>
        <Sparkles size={32} style={{ color:'#2a7d9c' }}/>
      </div>
      <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Traitement en cours…</h2>
      <p style={{ fontSize:14, color:'#64748b', marginBottom:32 }}>{progressMsg}</p>
      <div style={{ height:8, borderRadius:99, background:'#edf2f7', overflow:'hidden', marginBottom:8 }}>
        <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg, #2a7d9c, #0f2d3d)', width:`${progress}%`, transition:'width 0.4s ease' }}/>
      </div>
      <div style={{ fontSize:13, color:'#94a3b8', fontWeight:600 }}>{progress}%</div>
    </div>
  );

  /* ── RESULT */
  if (step==='result' && result) {
    const isComplete = type === 'complete';
    const sc = result.score ?? 0;
    const scoreColor = sc >= 7.5 ? '#16a34a' : sc >= 5 ? '#d97706' : '#dc2626';
    const recColor = result.recommandation==='Acheter'?'#16a34a':result.recommandation==='Négocier'?'#d97706':'#dc2626';
    return (
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:14 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:'#2a7d9c', letterSpacing:'0.14em', marginBottom:6 }}>RAPPORT VERIMO</div>
            <h1 style={{ fontSize:'clamp(16px,2.5vw,22px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em' }}>{result.titre}</h1>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{ setStep('choice'); setType(null); setFiles([]); setResult(null); }} style={{ padding:'9px 18px', borderRadius:10, border:'1.5px solid #edf2f7', background:'#fff', fontSize:13, fontWeight:700, color:'#64748b', cursor:'pointer' }}>Nouvelle analyse</button>
            <button style={{ padding:'9px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <Download size={13}/> PDF
            </button>
          </div>
        </div>
        {isComplete && result.score != null && (
          <div className="result-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'24px', textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:12 }}>SCORE GLOBAL</div>
              <div style={{ fontSize:56, fontWeight:900, color:scoreColor, letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{result.score.toFixed(1)}</div>
              <div style={{ fontSize:14, color:'#94a3b8' }}>/ 20</div>
            </div>
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'24px', textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:12 }}>RECOMMANDATION</div>
              <div style={{ display:'inline-block', padding:'8px 24px', borderRadius:12, background:`${recColor}10`, border:`2px solid ${recColor}25`, fontSize:22, fontWeight:900, color:recColor, marginBottom:8 }}>{result.recommandation}</div>
              {result.risques_financiers && <div style={{ fontSize:12, color:'#94a3b8', marginTop:8 }}>{result.risques_financiers}</div>}
            </div>
          </div>
        )}
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'20px 22px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:10 }}>RÉSUMÉ</div>
          <p style={{ fontSize:14, color:'#374151', lineHeight:1.75 }}>{result.resume}</p>
        </div>
        <div className="result-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div style={{ background:'#f0fdf4', borderRadius:16, border:'1px solid #d1fae5', padding:'18px 20px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#16a34a', letterSpacing:'0.1em', marginBottom:12 }}>✓ POINTS FORTS</div>
            {result.points_forts.map((p,i)=>(
              <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}><CheckCircle size={13} color="#16a34a" style={{ flexShrink:0, marginTop:2 }}/><span style={{ fontSize:13, color:'#166534', lineHeight:1.5 }}>{p}</span></div>
            ))}
          </div>
          <div style={{ background:'#fffbeb', borderRadius:16, border:'1px solid #fde68a', padding:'18px 20px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#d97706', letterSpacing:'0.1em', marginBottom:12 }}>⚠ POINTS DE VIGILANCE</div>
            {result.points_vigilance.map((p,i)=>(
              <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}><AlertTriangle size={13} color="#d97706" style={{ flexShrink:0, marginTop:2 }}/><span style={{ fontSize:13, color:'#92400e', lineHeight:1.5 }}>{p}</span></div>
            ))}
          </div>
        </div>
        <div style={{ background:'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius:16, padding:'20px 22px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em', marginBottom:10 }}>AVIS VERIMO</div>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.9)', lineHeight:1.75, fontWeight:500 }}>{result.conclusion}</p>
        </div>
      </div>
    );
  }
  /* ── APERÇU GRATUIT */
  if (step==='apercu' && apercu) {
    const isComplete = type === 'complete';
    return (
      <div style={{ maxWidth:640, margin:'0 auto', animation:'fadeUp 0.35s ease both' }}>
        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:10, fontWeight:800, color:'#16a34a', letterSpacing:'0.14em', background:'#f0fdf4', border:'1px solid #bbf7d0', padding:'3px 10px', borderRadius:100 }}>APERÇU GRATUIT</span>
          </div>
          <h1 style={{ fontSize:'clamp(18px,2.5vw,24px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em', marginBottom:4 }}>{apercu.titre}</h1>
          <p style={{ fontSize:13, color:'#94a3b8' }}>Voici un aperçu de votre analyse. Débloquez le rapport complet pour accéder à tous les détails.</p>
        </div>

        {/* Recommandation courte */}
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'20px 22px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:8 }}>RÉSUMÉ</div>
          <p style={{ fontSize:14, color:'#374151', lineHeight:1.75 }}>{apercu.recommandation_courte}</p>
        </div>

        {/* Points de vigilance */}
        <div style={{ background:'#fffbeb', borderRadius:16, border:'1px solid #fde68a', padding:'20px 22px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#d97706', letterSpacing:'0.1em', marginBottom:12 }}>⚠ POINTS DE VIGILANCE</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {apercu.points_vigilance.map((p, i) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <AlertTriangle size={13} color="#d97706" style={{ flexShrink:0, marginTop:2 }}/>
                <span style={{ fontSize:13, color:'#92400e', lineHeight:1.5 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score grisé (analyse complète uniquement) */}
        {isComplete && (
          <div style={{ background:'#f8fafc', borderRadius:16, border:'1px solid #e2e8f0', padding:'20px 22px', marginBottom:14, position:'relative', overflow:'hidden' }}>
            <div style={{ filter:'blur(6px)', pointerEvents:'none', userSelect:'none' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:8 }}>SCORE GLOBAL</div>
              <div style={{ fontSize:52, fontWeight:900, color:'#94a3b8', letterSpacing:'-0.03em', lineHeight:1 }}>?.?</div>
              <div style={{ fontSize:14, color:'#94a3b8' }}>/20</div>
            </div>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
              <Lock size={22} style={{ color:'#64748b' }}/>
              <span style={{ fontSize:13, fontWeight:700, color:'#64748b' }}>Score disponible après paiement</span>
            </div>
          </div>
        )}

        {/* Sections grisées */}
        <div style={{ background:'#f8fafc', borderRadius:16, border:'1px solid #e2e8f0', padding:'20px 22px', marginBottom:24, position:'relative', overflow:'hidden' }}>
          <div style={{ filter:'blur(4px)', pointerEvents:'none', userSelect:'none' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:12 }}>ANALYSE COMPLÈTE</div>
            {['Rapport financier détaillé', 'Liste des travaux votés et à prévoir', 'Analyse des charges et fonds travaux', 'Procédures en cours', 'Avis Verimo personnalisé'].map((item, i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#cbd5e1', flexShrink:0 }}/>
                <span style={{ fontSize:13, color:'#cbd5e1' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6 }}>
            <Lock size={20} style={{ color:'#64748b' }}/>
            <span style={{ fontSize:12, fontWeight:700, color:'#64748b' }}>Contenu réservé aux analyses payantes</span>
          </div>
        </div>

        {/* CTA débloquer */}
        <div style={{ background:'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius:18, padding:'24px 26px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
          <div style={{ position:'relative' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.45)', letterSpacing:'0.12em', marginBottom:8 }}>DÉBLOQUER LE RAPPORT COMPLET</div>
            <h2 style={{ fontSize:18, fontWeight:900, color:'#fff', marginBottom:8 }}>
              {isComplete ? 'Accédez au rapport complet' : 'Accédez à l&apos;analyse complète du document'}
            </h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6, marginBottom:20 }}>
              Score {isComplete ? '/20, travaux, charges, procédures et avis Verimo' : 'et analyse approfondie'}. Rapport PDF téléchargeable inclus.
            </p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Link to="/dashboard/tarifs"
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 24px', borderRadius:12, background:'#fff', color:'#0f2d3d', fontSize:14, fontWeight:800, textDecoration:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
                <Sparkles size={15}/> Débloquer — {isComplete ? '19,90€' : '4,90€'}
              </Link>
              <button onClick={()=>{ setStep('choice'); setType(null); setFiles([]); setApercu(null); }}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'13px 18px', borderRadius:12, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Nouvelle analyse
              </button>
            </div>
            {apercuId && (
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:12 }}>
                Votre aperçu est sauvegardé dans "Mes analyses" avec le badge Aperçu gratuit.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ══════════════════════════════════════════
   MES ANALYSES
══════════════════════════════════════════ */
function MesAnalyses() {
  const { analyses, loading: analysesLoading } = useAnalyses();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'complete'|'document'>('all');
  const filtered = analyses.filter(a => {
    const matchSearch = (a.adresse_bien||a.nom_document||'').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter==='all' || a.type===filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>Mes analyses</h1>
          <p style={{ fontSize:13, color:'#94a3b8' }}>{analyses.length} analyse{analyses.length>1?'s':''}</p>
        </div>
        <Link to="/dashboard/nouvelle-analyse" style={{ padding:'10px 20px', borderRadius:10, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={14}/> Nouvelle
        </Link>
      </div>

      {/* Filters + Search */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ width:'100%', padding:'10px 14px 10px 37px', borderRadius:10, border:'1.5px solid #edf2f7', fontSize:13, background:'#fff', outline:'none', boxSizing:'border-box' as const, color:'#0f172a' }}/>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {([['all','Tout'],['complete','Complètes'],['document','Documents']] as const).map(([val,label])=>(
            <button key={val} onClick={()=>setFilter(val)}
              style={{ padding:'10px 14px', borderRadius:10, border:`1.5px solid ${filter===val?'#2a7d9c':'#edf2f7'}`, background:filter===val?'rgba(42,125,156,0.07)':'#fff', fontSize:12, fontWeight:700, color:filter===val?'#2a7d9c':'#64748b', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {analysesLoading ? (
        <div style={{ textAlign:'center', padding:'48px', color:'#94a3b8', fontSize:14 }}>Chargement de vos analyses…</div>
      ) : filtered.length>0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{filtered.map(a=><AnalyseRow key={a.id} a={a}/>)}</div>
      ) : (
        <EmptyAnalyses/>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPARE — avec logique analyses complètes
══════════════════════════════════════════ */
function Compare() {
  const { analyses } = useAnalyses();
  const completedAnalyses = analyses.filter((a: Analyse) => a.type === 'complete' && a.status === 'completed');
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) :
      prev.length < 3 ? [...prev, id] : prev
    );
  };

  const selectedAnalyses = completedAnalyses.filter(a => selected.includes(a.id));
  const canCompare = selected.length >= 2;

  /* ── helpers ── */
  function getScoreColor(s: number) {
    if (s >= 17) return '#15803d';
    if (s >= 14) return '#16a34a';
    if (s >= 10) return '#d97706';
    if (s >= 7)  return '#ea580c';
    return '#dc2626';
  }
  function getScoreLabel(s: number) {
    if (s >= 17) return 'Bien irréprochable';
    if (s >= 14) return 'Bien sain';
    if (s >= 10) return 'Bien correct avec réserves';
    if (s >= 7)  return 'Bien risqué';
    return 'Bien à éviter';
  }
  function getScoreBg(s: number) {
    if (s >= 17) return '#f0fdf4';
    if (s >= 14) return '#f0fdf4';
    if (s >= 10) return '#fffbeb';
    if (s >= 7)  return '#fff7ed';
    return '#fef2f2';
  }
  function getScoreBorder(s: number) {
    if (s >= 17) return '#bbf7d0';
    if (s >= 14) return '#d1fae5';
    if (s >= 10) return '#fde68a';
    if (s >= 7)  return '#fed7aa';
    return '#fecaca';
  }

  /* ── Verdict avec explication ── */
  function buildVerdict(analyses: Analyse[]) {
    const sorted = [...analyses].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const diff = (best.score ?? 0) - (worst.score ?? 0);

    let raisons: string[] = [];
    const bestScore = best.score ?? 0;
    const worstScore = worst.score ?? 0;

    if (bestScore >= 14) raisons.push('score solide (bien sain ou irréprochable)');
    if (diff >= 3) raisons.push(`écart significatif de ${diff.toFixed(1)} points avec le bien le moins bien noté`);
    if (bestScore >= 14 && worstScore < 10) raisons.push('l\'autre bien présente des risques financiers ou juridiques identifiés');
    if (raisons.length === 0) raisons.push('meilleure note globale sur les 5 catégories analysées');

    return { best, raisons };
  }

  /* ══ ÉTAT 1 : Aucune analyse ══ */
  if (completedAnalyses.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 24 }}>
          Comparer mes biens
        </h1>
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #edf2f7', padding: '52px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(42,125,156,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <GitCompare size={30} style={{ color: '#94a3b8' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
            Il vous faut au minimum 2 analyses complètes
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
            La comparaison de biens s'active automatiquement dès que votre compte contient <strong style={{ color: '#0f172a' }}>2 analyses complètes ou plus</strong>. Elles peuvent avoir été achetées séparément ou via un Pack.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
            <Link to="/dashboard/nouvelle-analyse?type=complete"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(15,45,61,0.2)' }}>
              <ShieldCheck size={16} /> Lancer une analyse complète
            </Link>
            <Link to="/tarifs"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, background: '#f4f7f9', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Voir les packs (Pack 2 et 3 biens)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ══ ÉTAT 2 : 1 seule analyse ══ */
  if (completedAnalyses.length === 1) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 24 }}>
          Comparer mes biens
        </h1>
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #edf2f7', padding: '40px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🏠 + ?</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
            Plus qu'une analyse pour comparer
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75, marginBottom: 8, maxWidth: 380, margin: '0 auto 8px' }}>
            Vous avez 1 analyse complète. La comparaison se débloque automatiquement dès que vous en avez <strong style={{ color: '#0f172a' }}>une deuxième</strong>.
          </p>
          {/* Bien actuel */}
          <div style={{ margin: '20px auto', maxWidth: 360, padding: '14px 18px', borderRadius: 13, background: '#f8fafc', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,125,156,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={17} color="#2a7d9c" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {completedAnalyses[0].adresse_bien}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Analysé le {completedAnalyses[0].date}</div>
            </div>
            {completedAnalyses[0].score != null && <ScoreBadge score={completedAnalyses[0].score} size="sm" />}
          </div>
          <Link to="/dashboard/nouvelle-analyse?type=complete"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            <ShieldCheck size={15} /> Analyser un 2e bien
          </Link>
        </div>
      </div>
    );
  }

  /* ══ ÉTAT 3 : Sélection (2+ analyses disponibles, pas encore sélectionnées) ══ */
  const maxSelect = completedAnalyses.length >= 3 ? 3 : 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 4 }}>
            Comparer mes biens
          </h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {canCompare
              ? `${selectedAnalyses.length} bien${selectedAnalyses.length > 1 ? 's' : ''} sélectionné${selectedAnalyses.length > 1 ? 's' : ''} — rapport de comparaison ci-dessous`
              : `Sélectionnez 2${maxSelect === 3 ? ' ou 3' : ''} biens à comparer`
            }
          </p>
        </div>
        {canCompare && (
          <button onClick={() => setSelected([])}
            style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', background: '#f4f7f9', border: '1px solid #edf2f7', borderRadius: 9, padding: '7px 14px', cursor: 'pointer' }}>
            ← Changer la sélection
          </button>
        )}
      </div>

      {/* Sélection */}
      {!canCompare && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            {completedAnalyses.length} analyse{completedAnalyses.length > 1 ? 's' : ''} disponible{completedAnalyses.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completedAnalyses.map((a, idx) => {
              const isSel = selected.includes(a.id);
              const selIdx = selected.indexOf(a.id);
              const score = a.score ?? 0;
              const sc = getScoreColor(score);
              return (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  onClick={() => toggleSelect(a.id)}
                  style={{
                    background: '#fff', borderRadius: 14,
                    border: `1.5px solid ${isSel ? '#2a7d9c' : '#edf2f7'}`,
                    padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer', transition: 'all 0.18s',
                    boxShadow: isSel ? '0 0 0 3px rgba(42,125,156,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                  {/* Numéro de sélection */}
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSel ? '#2a7d9c' : '#f4f7f9', border: `1px solid ${isSel ? '#2a7d9c' : '#edf2f7'}`, transition: 'all 0.18s' }}>
                    {isSel
                      ? <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{selIdx + 1}</span>
                      : <Building2 size={15} style={{ color: '#94a3b8' }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.adresse_bien}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Analysé le {a.date}</div>
                  </div>
                  {a.score != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{ padding: '4px 10px', borderRadius: 8, background: getScoreBg(score), border: `1px solid ${getScoreBorder(score)}` }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: sc }}>{score.toFixed(1)}</span>
                        <span style={{ fontSize: 10, color: sc, opacity: 0.7 }}>/20</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          {selected.length === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ marginTop: 12, padding: '11px 16px', borderRadius: 11, background: 'rgba(42,125,156,0.05)', border: '1px solid rgba(42,125,156,0.15)', fontSize: 13, color: '#2a7d9c', fontWeight: 600 }}>
              ✓ 1 bien sélectionné — choisissez {maxSelect === 3 ? 'un 2e ou un 3e bien' : 'un 2e bien'} pour comparer
            </motion.div>
          )}
        </div>
      )}

      {/* ══ RAPPORT DE COMPARAISON ══ */}
      {canCompare && selectedAnalyses.length >= 2 && (() => {
        const { best, raisons } = buildVerdict(selectedAnalyses);
        const cols = selectedAnalyses.length;
        const gridCols = cols === 2 ? '1fr 1fr' : '1fr 1fr 1fr';

        return (
          <AnimatePresence mode="wait">
            <motion.div key="rapport" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ── En-têtes des biens ── */}
              <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12 }}>
                {selectedAnalyses.map((a, i) => {
                  const score = a.score ?? 0;
                  const sc = getScoreColor(score);
                  const isBest = a.id === best.id;
                  const circ = 2 * Math.PI * 22;
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      style={{
                        background: '#fff', borderRadius: 18,
                        border: `2px solid ${isBest ? sc : '#edf2f7'}`,
                        padding: '20px', position: 'relative',
                        boxShadow: isBest ? `0 6px 24px ${sc}18` : '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                      {isBest && (
                        <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 100, background: sc, color: '#fff', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ⭐ Recommandé
                        </div>
                      )}
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 6 }}>BIEN {i + 1}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: 16, minHeight: 36 }}>{a.adresse_bien}</div>

                      {/* Jauge score */}
                      {a.score != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <svg width="52" height="52" style={{ flexShrink: 0 }}>
                            <circle cx="26" cy="26" r="22" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                            <motion.circle cx="26" cy="26" r="22" fill="none" stroke={sc} strokeWidth="5" strokeLinecap="round"
                              transform="rotate(-90 26 26)"
                              strokeDasharray={circ}
                              initial={{ strokeDashoffset: circ }}
                              animate={{ strokeDashoffset: circ - circ * (score / 20) }}
                              transition={{ duration: 1.2, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }} />
                            <text x="26" y="22" textAnchor="middle" fontSize="11" fontWeight="900" fill={sc}>{score.toFixed(1)}</text>
                            <text x="26" y="33" textAnchor="middle" fontSize="8" fill="#94a3b8">/20</text>
                          </svg>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: sc }}>{getScoreLabel(score)}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Analysé le {a.date}</div>
                          </div>
                        </div>
                      )}

                      {/* Mini barre de score */}
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${((a.score ?? 0) / 20) * 100}%` }}
                          transition={{ duration: 1.2, delay: i * 0.15 + 0.2 }}
                          style={{ height: '100%', background: sc, borderRadius: 99 }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* ── Tableau comparatif par section ── */}
              {[
                {
                  label: 'Score par catégorie', icon: '📊',
                  rows: [
                    { label: 'Travaux', key: 'travaux', max: 5 },
                    { label: 'Procédures', key: 'procedures', max: 4 },
                    { label: 'Finances copropriété', key: 'finances', max: 4 },
                    { label: 'Diagnostics privatifs', key: 'diags_privatifs', max: 4 },
                    { label: 'Diagnostics communs', key: 'diags_communs', max: 3 },
                  ],
                },
              ].map((section) => (
                <div key={section.label} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{section.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{section.label}</span>
                  </div>
                  {section.rows.map((row, ri) => (
                    <div key={ri} style={{ display: 'grid', gridTemplateColumns: `200px repeat(${cols}, 1fr)`, borderBottom: ri < section.rows.length - 1 ? '1px solid #f8fafc' : 'none', background: ri % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <div style={{ padding: '12px 20px', fontSize: 13, color: '#374151', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{row.label}</div>
                      {selectedAnalyses.map((a, j) => {
                        // Score simulé par catégorie (en attente de vraies données Supabase)
                        const totalScore = a.score ?? 10;
                        const catScore = Math.round((totalScore / 20) * row.max * 10) / 10;
                        const catColor = catScore >= row.max * 0.8 ? '#16a34a' : catScore >= row.max * 0.5 ? '#d97706' : '#dc2626';
                        return (
                          <div key={j} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #f1f5f9', background: a.id === best.id ? 'rgba(42,125,156,0.03)' : 'transparent' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 15, fontWeight: 900, color: catColor }}>{catScore}</div>
                              <div style={{ fontSize: 10, color: '#cbd5e1' }}>/{row.max}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}

              {/* ── Points forts & vigilances ── */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Points clés par bien</span>
                </div>
                <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                  {selectedAnalyses.map((a, i) => (
                    <div key={a.id} style={{ padding: '16px 18px', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 10 }}>BIEN {i + 1}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ Points forts</div>
                        {[
                          a.score != null && a.score >= 14 ? 'Score solide — bien globalement sain' : null,
                          a.recommandation ? `${a.recommandation}` : null,
                          'Voir le rapport complet pour le détail',
                        ].filter(Boolean).map((p, pi) => (
                          <div key={pi} style={{ fontSize: 12, color: '#374151', padding: '6px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #d1fae5' }}>{p}</div>
                        ))}
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f0a500', marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠ Vigilances</div>
                        {[
                          a.score != null && a.score < 14 ? 'Score inférieur à 14/20 — points à vérifier' : null,
                          a.score != null && a.score < 10 ? 'Risques identifiés — rapport complet conseillé' : null,
                          'Consultez le rapport pour le détail complet',
                        ].filter(Boolean).map((p, pi) => (
                          <div key={pi} style={{ fontSize: 12, color: '#374151', padding: '6px 10px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a' }}>{p}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Verdict Verimo ── */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ padding: '22px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5', boxShadow: '0 4px 16px rgba(42,125,156,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Shield size={16} color="#2a7d9c" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verdict Verimo</div>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 10, lineHeight: 1.5 }}>
                  Notre recommandation : <span style={{ color: getScoreColor(best.score ?? 0) }}>"{best.adresse_bien}"</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {raisons.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(42,125,156,0.12)', border: '1px solid rgba(42,125,156,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <CheckCircle size={10} color="#2a7d9c" />
                      </div>
                      <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, textTransform: 'capitalize' }}>{r}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>
                  Ce verdict est établi uniquement à partir des données disponibles dans vos rapports et ne remplace pas l'avis d'un professionnel de l'immobilier.
                </p>
              </motion.div>

              {/* ── Liens vers rapports complets ── */}
              <div style={{ padding: '16px 20px', borderRadius: 14, background: '#fff', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Consulter les rapports individuels</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Pour le détail complet de chaque bien</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedAnalyses.map((a, i) => (
                    <Link key={a.id} to={`/rapport?id=${a.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#f4f7f9', border: '1px solid #edf2f7', color: '#0f172a', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      <FileText size={12} /> Bien {i + 1}
                    </Link>
                  ))}
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        );
      })()}
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPTE
══════════════════════════════════════════ */
function Compte() {
  const [user, setUser] = useState({name:'',email:''});
  const [saved, setSaved] = useState(false);
  const [pwdSection, setPwdSection] = useState(false);
  const [pwd, setPwd] = useState({current:'',next:'',confirm:''});
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(()=>{ supabase.auth.getUser().then(({data:{user:u}})=>{ if(u) setUser({name:u.user_metadata?.full_name||'',email:u.email||''}); }); },[]);

  const save = async ()=>{
    const { data: { user: u } } = await supabase.auth.getUser();
    await supabase.auth.updateUser({ data: { full_name: user.name } });
    if (u) await supabase.from('profiles').update({ full_name: user.name }).eq('id', u.id);
    setSaved(true); setTimeout(()=>setSaved(false),3000);
  };

  const changePwd = async () => {
    setPwdError(''); setPwdMsg('');
    if (pwd.next !== pwd.confirm) { setPwdError('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.next.length < 8) { setPwdError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) { setPwdError('Erreur : ' + error.message); }
    else { setPwdMsg('Mot de passe modifié avec succès !'); setPwd({current:'',next:'',confirm:''}); setTimeout(()=>{ setPwdMsg(''); setPwdSection(false); },3000); }
  };

  // Historique achats mock — à remplacer par Supabase après Stripe
  const mockAchats = [
    { date:'24 mars 2026', label:'Analyse Complète', montant:'19,90€', statut:'Payé' },
    { date:'19 mars 2026', label:'Analyse Document', montant:'4,90€', statut:'Payé' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em' }}>Mon compte</h1>

      {/* Informations personnelles */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:18, paddingBottom:13, borderBottom:'1px solid #f0f5f9' }}>Informations personnelles</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
          {[{l:'Nom complet',v:user.name,set:(v:string)=>setUser({...user,name:v}),ph:'Jean Dupont',disabled:false},{l:'Email',v:user.email,set:(_:string)=>{},ph:'',disabled:true}].map(f=>(
            <div key={f.l}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:7 }}>{f.l}</label>
              <input value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} disabled={f.disabled}
                style={{ width:'100%', padding:'11px 13px', borderRadius:9, border:'1.5px solid #edf2f7', fontSize:14, background:f.disabled?'#f8fafc':'#fff', color:f.disabled?'#94a3b8':'#0f172a', outline:'none', boxSizing:'border-box' as const }}/>
              {f.disabled && <p style={{ fontSize:11, color:'#94a3b8', marginTop:5 }}>L'adresse email ne peut pas être modifiée.</p>}
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
            <button onClick={save} style={{ padding:'10px 22px', borderRadius:9, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Enregistrer</button>
            {saved && <span style={{ fontSize:13, color:'#16a34a', fontWeight:700 }}>✓ Enregistré</span>}
          </div>
        </div>
      </div>

      {/* Changer le mot de passe */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: pwdSection ? 18 : 0, paddingBottom: pwdSection ? 13 : 0, borderBottom: pwdSection ? '1px solid #f0f5f9' : 'none' }}>
          <h2 style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>Mot de passe</h2>
          <button onClick={()=>{ setPwdSection(!pwdSection); setPwdError(''); setPwdMsg(''); }}
            style={{ fontSize:13, fontWeight:700, color:'#2a7d9c', background:'none', border:'none', cursor:'pointer' }}>
            {pwdSection ? 'Annuler' : 'Modifier'}
          </button>
        </div>
        {!pwdSection && <p style={{ fontSize:13, color:'#94a3b8', marginTop:8 }}>••••••••••••</p>}
        {pwdSection && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { l:'Nouveau mot de passe', k:'next' as const, v:pwd.next },
              { l:'Confirmer le mot de passe', k:'confirm' as const, v:pwd.confirm },
            ].map(f=>(
              <div key={f.k}>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:7 }}>{f.l}</label>
                <input type="password" value={f.v} onChange={e=>setPwd({...pwd,[f.k]:e.target.value})}
                  style={{ width:'100%', padding:'11px 13px', borderRadius:9, border:'1.5px solid #edf2f7', fontSize:14, outline:'none', boxSizing:'border-box' as const }}/>
              </div>
            ))}
            {pwdError && <p style={{ fontSize:13, color:'#dc2626', fontWeight:600 }}>⚠ {pwdError}</p>}
            {pwdMsg && <p style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>✓ {pwdMsg}</p>}
            <button onClick={changePwd}
              style={{ alignSelf:'flex-start', padding:'10px 22px', borderRadius:9, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Mettre à jour
            </button>
          </div>
        )}
      </div>

      {/* Historique des achats */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:18, paddingBottom:13, borderBottom:'1px solid #f0f5f9' }}>Historique des achats</h2>
        {mockAchats.length === 0 ? (
          <p style={{ fontSize:13, color:'#94a3b8' }}>Aucun achat pour le moment.</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {mockAchats.map((a,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, background:'#f8fafc', border:'1px solid #edf2f7', flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{a.label}</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{a.date}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{a.montant}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:'#16a34a', background:'#f0fdf4', border:'1px solid #bbf7d0', padding:'2px 8px', borderRadius:6 }}>{a.statut}</span>
                </div>
              </div>
            ))}
            <p style={{ fontSize:11, color:'#cbd5e1', marginTop:4 }}>Les factures détaillées seront disponibles après connexion de Stripe.</p>
          </div>
        )}
      </div>

      {/* Zone danger */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #fecaca', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize:14, fontWeight:800, color:'#dc2626', marginBottom:8 }}>Zone de danger</h2>
        <p style={{ fontSize:13, color:'#64748b', marginBottom:16 }}>La suppression de votre compte est irréversible. Toutes vos analyses seront perdues.</p>
        {!deleteConfirm ? (
          <button onClick={()=>setDeleteConfirm(true)}
            style={{ padding:'10px 22px', borderRadius:9, background:'#fef2f2', border:'1.5px solid #fecaca', color:'#dc2626', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Supprimer mon compte
          </button>
        ) : (
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:13, color:'#dc2626', fontWeight:600 }}>Êtes-vous sûr ? Cette action est irréversible.</span>
            <button onClick={async () => {
              try {
                // Suppression réelle du compte via RPC Supabase
                const { error } = await supabase.rpc('delete_current_user');
                if (error) {
                  // Fallback : suppression via API REST avec le token actuel
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) {
                    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                      },
                    });
                    if (!res.ok) {
                      alert('Erreur lors de la suppression. Contactez le support à hello@verimo.fr');
                      return;
                    }
                  }
                }
                // Nettoyage localStorage
                localStorage.removeItem('verimo_user_name');
                localStorage.removeItem('verimo_user_email');
                await supabase.auth.signOut();
                window.location.href = '/';
              } catch {
                alert('Erreur lors de la suppression. Contactez le support à hello@verimo.fr');
              }
            }}
              style={{ padding:'10px 18px', borderRadius:9, background:'#dc2626', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Confirmer la suppression
            </button>
            <button onClick={()=>setDeleteConfirm(false)}
              style={{ padding:'10px 18px', borderRadius:9, background:'#f8fafc', border:'1.5px solid #edf2f7', color:'#64748b', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Annuler
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════
   SUPPORT
══════════════════════════════════════════ */
function Support() {
  const faqs = [
    {q:"Quels documents puis-je analyser ?",a:"PV d'AG, règlements de copropriété, appels de charges, diagnostics immobiliers. Formats : PDF, Word, JPG/PNG."},
    {q:"Combien de temps prend une analyse ?",a:"Moins de 2 minutes. Une notification vous est envoyée dès que le rapport est disponible."},
    {q:"Mes documents sont-ils sécurisés ?",a:"Oui. Chiffrement SSL/TLS, aucun partage de données. Les fichiers sont supprimés immédiatement après l'analyse."},
    {q:"Comment fonctionnent les crédits ?",a:"Chaque achat vous attribue des crédits : 4,90€ = 1 crédit analyse document, 19,90€ = 1 crédit analyse complète, 29,90€ = 2 crédits complets, 39,90€ = 3 crédits complets. Les crédits ne expirent pas."},
  ];
  const [open, setOpen] = useState<number|null>(null);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  return (
    <div>
      <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:24 }}>Support / Aide</h1>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:12 }}>Questions fréquentes</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {faqs.map((f,i)=>(
            <div key={i} style={{ borderRadius:12, border:'1px solid #edf2f7', overflow:'hidden', background:'#fff' }}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{ width:'100%', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{f.q}</span>
                <ChevronDown size={15} color="#2a7d9c" style={{ flexShrink:0, transform:open===i?'rotate(180deg)':'none', transition:'transform 0.2s' }}/>
              </button>
              {open===i && <div style={{ padding:'0 18px 14px' }}><p style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>{f.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:18 }}>Nous contacter</h2>
        {sent ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:5 }}>Message envoyé !</h3>
            <p style={{ fontSize:13, color:'#94a3b8' }}>Réponse sous 24h à hello@verimo.fr</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} placeholder="Décrivez votre problème…"
              style={{ width:'100%', padding:'11px 13px', borderRadius:10, border:'1.5px solid #edf2f7', fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' as const, fontFamily:'inherit', color:'#0f172a' }}/>
            <button onClick={()=>{ if(msg)setSent(true); }} disabled={!msg}
              style={{ alignSelf:'flex-start', padding:'10px 22px', borderRadius:9, background:msg?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#edf2f7', border:'none', color:msg?'#fff':'#94a3b8', fontSize:14, fontWeight:700, cursor:msg?'pointer':'not-allowed', display:'flex', alignItems:'center', gap:7 }}>
              <Send size={14}/> Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TARIFS — onglet interne dashboard
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   TARIFS — SaaS moderne avec tooltips
══════════════════════════════════════════ */
/* ── Types promo ── */
type PromoResult = {
  id: string;
  code: string;
  type: 'credits' | 'percent' | 'fixed';
  value: number;
  credit_type?: string;
};

/* ── Modale intermédiaire avant paiement ── */
function CheckoutModal({
  plan, onClose,
}: {
  plan: { id: string; label: string; price: string; priceNum: number; color: string; creditLabel: string };
  onClose: () => void;
}) {
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);
    setPromoApplied(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Récupérer le code promo
      const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('active', true)
        .single();

      if (error || !promo) { setPromoError('Code invalide ou expiré.'); setPromoLoading(false); return; }

      // Vérifier expiration
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        setPromoError('Ce code a expiré.'); setPromoLoading(false); return;
      }

      // Vérifier max utilisations
      if (promo.max_uses && promo.uses_count >= promo.max_uses) {
        setPromoError('Ce code a atteint sa limite d\'utilisation.'); setPromoLoading(false); return;
      }

      // Vérifier restriction email
      if (promo.restricted_email && promo.restricted_email !== user.email) {
        setPromoError('Ce code n\'est pas disponible pour votre compte.'); setPromoLoading(false); return;
      }

      // Vérifier usage unique par compte
      const { data: alreadyUsed } = await supabase
        .from('promo_uses')
        .select('id')
        .eq('code_id', promo.id)
        .eq('user_id', user.id)
        .single();

      if (alreadyUsed) { setPromoError('Vous avez déjà utilisé ce code.'); setPromoLoading(false); return; }

      setPromoResult(promo);
      setPromoApplied(true);
    } catch {
      setPromoError('Erreur lors de la vérification du code.');
    }
    setPromoLoading(false);
  };

  const removePromo = () => {
    setPromoResult(null);
    setPromoApplied(false);
    setPromoCode('');
    setPromoError('');
  };

  // Calcul du prix final
  const basePrice = plan.priceNum;
  let finalPrice = basePrice;
  let promoLabel = '';
  if (promoResult) {
    if (promoResult.type === 'percent') {
      finalPrice = Math.max(0, basePrice * (1 - promoResult.value / 100));
      promoLabel = `−${promoResult.value}%`;
    } else if (promoResult.type === 'fixed') {
      finalPrice = Math.max(0, basePrice - promoResult.value);
      promoLabel = `−${promoResult.value.toFixed(2).replace('.', ',')}€`;
    } else if (promoResult.type === 'credits') {
      finalPrice = basePrice; // crédits bonus → prix inchangé
      promoLabel = `+${promoResult.value} crédit${promoResult.value > 1 ? 's' : ''} offert${promoResult.value > 1 ? 's' : ''}`;
    }
  }

  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const PRICE_IDS: Record<string, string> = {
    'document': 'price_1TIb1LBO4ekMbwz0020eqcR0',
    'complete': 'price_1TIb3XBO4ekMbwz0a7m7E7gD',
    'pack2': 'price_1TIb4KBO4ekMbwz0gGF2gI1S',
    'pack3': 'price_1TIb51BO4ekMbwz0mmEez47o',
  };

  const handlePay = async () => {
    setPayLoading(true);
    setPayError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session ? 'OK' : 'NULL', session?.access_token?.substring(0, 20));
      if (!session) throw new Error('Session expirée — veuillez vous reconnecter');

      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk',
        },
        body: JSON.stringify({
          priceId: PRICE_IDS[plan.id],
          userId: session.user.id,
          promoCodeId: promoResult?.id ?? null,
        }),
      });

      console.log('Response status:', res.status);
      if (!res.ok) {
        const err = await res.text();
        console.log('Error response:', err);
        throw new Error(err || `Erreur ${res.status}`);
      }

      const data = await res.json();
      console.log('Response data:', data);
      if (data.error) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
      else throw new Error('Lien de paiement non reçu');
    } catch (e) {
      console.error('handlePay error:', e);
      setPayError((e as Error).message);
    }
    setPayLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', marginBottom: 3 }}>RÉCAPITULATIF</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{plan.label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{plan.creditLabel}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Prix */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', borderRadius: 12, border: '1.5px solid #edf2f7' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Total</span>
            <div style={{ textAlign: 'right' }}>
              {promoResult && promoResult.type !== 'credits' && (
                <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through', marginBottom: 2 }}>{plan.price}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {promoResult && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: promoResult.type === 'credits' ? '#7c3aed' : '#16a34a', background: promoResult.type === 'credits' ? '#f5f3ff' : '#f0fdf4', border: `1px solid ${promoResult.type === 'credits' ? '#ddd6fe' : '#d1fae5'}`, padding: '2px 8px', borderRadius: 100 }}>
                    {promoLabel}
                  </span>
                )}
                <span style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                  {promoResult && promoResult.type !== 'credits' ? `${finalPrice.toFixed(2).replace('.', ',')}€` : plan.price}
                </span>
              </div>
            </div>
          </div>

          {/* Champ code promo */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
              Code promo <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optionnel)</span>
            </label>

            {promoApplied && promoResult ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 11 }}>
                <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', flex: 1 }}>Code <strong>{promoResult.code}</strong> appliqué — {promoLabel}</span>
                <button onClick={removePromo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                  onKeyDown={e => e.key === 'Enter' && applyPromo()}
                  placeholder="EX : VERIMO20"
                  style={{
                    flex: 1, padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    border: `1.5px solid ${promoError ? '#fca5a5' : '#e2e8f0'}`,
                    outline: 'none', letterSpacing: '0.05em', fontFamily: 'monospace',
                    background: promoError ? '#fef2f2' : '#fff', color: '#0f172a',
                  }}
                />
                <button
                  onClick={applyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  style={{
                    padding: '11px 16px', borderRadius: 10, border: 'none',
                    background: plan.color, color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: promoLoading || !promoCode.trim() ? 'not-allowed' : 'pointer',
                    opacity: promoLoading || !promoCode.trim() ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                  }}
                >
                  {promoLoading
                    ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                    : 'Appliquer'}
                </button>
              </div>
            )}

            {promoError && (
              <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertTriangle size={12} /> {promoError}
              </div>
            )}
          </div>

          {/* Bouton paiement */}
          <button
            onClick={handlePay}
            disabled={payLoading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
              color: '#fff', fontSize: 15, fontWeight: 800,
              cursor: payLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 6px 20px ${plan.color}40`,
              opacity: payLoading ? 0.75 : 1,
            }}
          >
            {payLoading
              ? <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Redirection…</>
              : <><Lock size={15} /> Continuer vers le paiement</>
            }
          </button>

          {payError && (
            <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <AlertTriangle size={12} /> {payError}
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: -8 }}>
            🔒 Paiement sécurisé par Stripe — vos données sont chiffrées
          </div>
        </div>
      </div>
    </div>
  );
}

function Tarifs() {
  const { credits } = useCredits();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<null | { id: string; label: string; price: string; priceNum: number; color: string; creditLabel: string }>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('cancelled') === 'true') {
      // Retour depuis Stripe sans payer → juste nettoyer l'URL, ne rien toucher
      window.history.replaceState({}, '', '/dashboard/tarifs');
      return;
    }

    if (params.get('success') === 'true') {
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/dashboard/tarifs');

      // Vérifier si l'offre gratuite n'avait pas été utilisée
      const freePreviewUsed = localStorage.getItem('verimo_free_preview_used') === 'true';
      if (!freePreviewUsed) {
        // Marquer l'offre gratuite comme utilisée
        markFreePreviewUsed();
        setSuccessToast("🎉 Vous aviez une analyse gratuite disponible, mais pourquoi regarder par le trou de la serrure quand on peut ouvrir la porte en grand ? En payant directement, votre offre gratuite a été remplacée par votre analyse complète. Bonne analyse !");
      } else {
        setSuccessToast("✅ Paiement confirmé ! Vos crédits ont été ajoutés à votre compte. Bonne analyse !");
      }
    }
  }, []);

  const handleAcheter = (plan: { id: string; label: string; price: string; priceNum: number; color: string; creditLabel: string }) => {
    setCheckoutPlan(plan);
  };

  const plans: { id: string; label: string; price: string; priceNum: number; desc: string; creditLabel: string; creditType: keyof Credits; color: string; icon: React.ElementType; popular?: boolean; badge?: string; details: string[] }[] = [
    {
      id: 'document',
      label: 'Analyse Document',
      price: '4,90€',
      priceNum: 4.90,
      desc: 'Idéal pour lever un doute sur un document précis.',
      creditLabel: '1 crédit simple',
      creditType: 'document' as keyof Credits,
      color: '#2a7d9c',
      icon: FileText,
      details: [
        '1 fichier analysé en profondeur',
        "PV d'AG, règlement, diagnostic ou appel de charges",
        'Résumé clair + points forts + vigilances',
        'Rapport PDF téléchargeable',
        'Résultat en moins de 2 minutes',
      ],
    },
    {
      id: 'complete',
      label: 'Analyse Complète',
      price: '19,90€',
      priceNum: 19.90,
      desc: "Audit global d'un bien avec score et recommandation.",
      creditLabel: '1 crédit complet',
      creditType: 'complete' as keyof Credits,
      color: '#0f2d3d',
      icon: ShieldCheck,
      popular: true,
      details: [
        'Documents illimités pour un seul bien',
        'Score global noté /20',
        'Recommandation : Acheter / Négocier / Risqué',
        'Estimation des risques financiers',
        'Avis Verimo complet',
        'Rapport PDF téléchargeable',
        'Résultat en moins de 2 minutes',
      ],
    },
    {
      id: 'pack2',
      label: 'Pack 2 Biens',
      price: '29,90€',
      priceNum: 29.90,
      desc: 'Comparez 2 biens côte à côte. 14,95€ / bien.',
      creditLabel: '2 crédits complets',
      creditType: 'complete' as keyof Credits,
      color: '#1a5068',
      icon: GitCompare,
      badge: '−25%',
      details: [
        '2 analyses complètes incluses',
        'Comparaison côte à côte des 2 biens',
        'Verdict Verimo : quel bien choisir',
        '14,95€ / analyse au lieu de 19,90€',
        'Rapport PDF pour chaque bien',
      ],
    },
    {
      id: 'pack3',
      label: 'Pack 3 Biens',
      price: '39,90€',
      priceNum: 39.90,
      desc: 'Le meilleur rapport qualité/prix. 13,30€ / bien.',
      creditLabel: '3 crédits complets',
      creditType: 'complete' as keyof Credits,
      color: '#1a5068',
      icon: BarChart2,
      badge: '−33%',
      details: [
        '3 analyses complètes incluses',
        'Comparaison des 3 biens',
        'Classement final Verimo',
        'Recommandation définitive',
        '13,30€ / analyse au lieu de 19,90€',
        'Rapport PDF pour chaque bien',
      ],
    },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28, maxWidth:740, margin:'0 auto' }}>

      {/* Toast succès paiement */}
      {successToast && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#0f2d3d', borderRadius: 20, padding: '28px 24px',
            maxWidth: 420, width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: 16,
            animation: 'fadeInUp 0.4s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 32 }}>🎉</span>
              <button onClick={() => setSuccessToast(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.7, fontWeight: 500 }}>{successToast}</div>
            <button onClick={() => setSuccessToast(null)} style={{
              width: '100%', padding: '12px', borderRadius: 12, border: 'none',
              background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 14,
              fontWeight: 700, cursor: 'pointer',
            }}>
              Compris !
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.03em', marginBottom:6 }}>
          Choisissez votre analyse
        </h1>
        <p style={{ fontSize:14, color:'#64748b' }}>
          Achetez des crédits selon votre besoin — ils n'expirent jamais.
        </p>
      </div>

      {/* Crédits actuels */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', background:'#fff', borderRadius:12, border:'1px solid #edf2f7', flexWrap:'wrap' }}>
        <CreditCard size={15} style={{ color:'#2a7d9c', flexShrink:0 }}/>
        <span style={{ fontSize:13, fontWeight:600, color:'#64748b' }}>Vos crédits :</span>
        <span style={{ padding:'3px 11px', borderRadius:7, background:credits.document>0?'#f0fdf4':'#f8fafc', border:`1px solid ${credits.document>0?'#bbf7d0':'#e2e8f0'}`, fontSize:13, fontWeight:700, color:credits.document>0?'#16a34a':'#94a3b8' }}>
          {credits.document} simple
        </span>
        <span style={{ padding:'3px 11px', borderRadius:7, background:credits.complete>0?'#eff6ff':'#f8fafc', border:`1px solid ${credits.complete>0?'#bfdbfe':'#e2e8f0'}`, fontSize:13, fontWeight:700, color:credits.complete>0?'#1d4ed8':'#94a3b8' }}>
          {credits.complete} complet{credits.complete>1?'s':''}
        </span>
        <span style={{ fontSize:11, color:'#94a3b8', marginLeft:'auto' }}>♾️ Sans expiration</span>
      </div>

      {/* Cartes horizontales */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {plans.map(plan => {
          const Icon = plan.icon;
          const hasCredits = credits[plan.creditType] > 0;
          const showTip = tooltip === plan.id;

          return (
            <div key={plan.id} style={{
              background:'#fff',
              borderRadius:16,
              border: plan.popular ? '2px solid #0f2d3d' : '1.5px solid #edf2f7',
              overflow:'hidden',
              boxShadow: plan.popular ? '0 8px 28px rgba(15,45,61,0.12)' : '0 1px 6px rgba(0,0,0,0.04)',
              transition:'box-shadow 0.2s, transform 0.2s',
            }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow=plan.popular?'0 14px 44px rgba(15,45,61,0.18)':'0 6px 20px rgba(0,0,0,0.08)'; el.style.transform='translateY(-2px)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow=plan.popular?'0 8px 28px rgba(15,45,61,0.12)':'0 1px 6px rgba(0,0,0,0.04)'; el.style.transform='translateY(0)'; }}
            >
              {/* Bande populaire */}
              {plan.popular && (
                <div style={{ background:'linear-gradient(90deg, #0f2d3d, #1a5068)', padding:'7px 20px', display:'flex', alignItems:'center', gap:7 }}>
                  <Star size={11} style={{ color:'#fbbf24' }}/>
                  <span style={{ fontSize:10, fontWeight:800, color:'#fff', letterSpacing:'0.1em' }}>LE PLUS POPULAIRE</span>
                  <span style={{ marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,0.45)' }}>Recommandé par Verimo</span>
                </div>
              )}

              <div style={{ display:'flex', alignItems:'center', padding:'20px 22px', gap:18, flexWrap:'wrap' }}>

                {/* Icone */}
                <div style={{ width:48, height:48, borderRadius:13, background:`${plan.color}0e`, border:`1.5px solid ${plan.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={21} style={{ color:plan.color }}/>
                </div>

                {/* Nom + desc */}
                <div style={{ flex:'1 1 160px', minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>{plan.label}</span>
                    {plan.badge && (
                      <span style={{ fontSize:10, fontWeight:800, color:'#d97706', background:'#fef3c7', border:'1px solid #fde68a', padding:'2px 7px', borderRadius:100 }}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:12.5, color:'#64748b', lineHeight:1.5, marginBottom:5 }}>{plan.desc}</div>
                  <span style={{ fontSize:10, fontWeight:700, color:plan.color, background:`${plan.color}09`, border:`1px solid ${plan.color}18`, padding:'2px 8px', borderRadius:6, display:'inline-block' }}>
                    {plan.creditLabel}
                  </span>
                </div>

                {/* Prix */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:30, fontWeight:900, color:'#0f172a', letterSpacing:'-0.03em', lineHeight:1 }}>{plan.price}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>paiement unique</div>
                </div>

                {/* Bouton info avec tooltip */}
                <div style={{ position:'relative', flexShrink:0 }}>
                  <button
                    onMouseEnter={()=>setTooltip(plan.id)}
                    onMouseLeave={()=>setTooltip(null)}
                    style={{ width:30, height:30, borderRadius:'50%', background:'#f8fafc', border:'1.5px solid #edf2f7', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8', transition:'all 0.15s' }}
                    onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.background=`${plan.color}10`; el.style.borderColor=`${plan.color}30`; el.style.color=plan.color; }}
                    onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='#f8fafc'; el.style.borderColor='#edf2f7'; el.style.color='#94a3b8'; }}
                  >
                    <Info size={13}/>
                  </button>

                  {showTip && (
                    <div style={{
                      position:'absolute', right:0, top:38, zIndex:200,
                      background:'#0f172a', borderRadius:13, padding:'14px 16px',
                      width:240, boxShadow:'0 16px 48px rgba(0,0,0,0.28)',
                      animation:'fadeUp 0.15s ease both',
                      pointerEvents:'none',
                    }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', marginBottom:10 }}>INCLUS DANS CE PACK</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        {plan.details.map((d,i)=>(
                          <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                            <CheckCircle size={11} style={{ color:'#4ade80', flexShrink:0, marginTop:2 }}/>
                            <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.72)', lineHeight:1.4 }}>{d}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ position:'absolute', top:-5, right:10, width:10, height:10, background:'#0f172a', transform:'rotate(45deg)', borderRadius:2 }}/>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={()=>handleAcheter({ id: plan.id, label: plan.label, price: plan.price, priceNum: plan.priceNum, color: plan.color, creditLabel: plan.creditLabel })}
                  style={{
                    flexShrink:0, padding:'11px 22px', borderRadius:11, border:'none',
                    background:`linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                    color:'#fff', fontSize:13.5, fontWeight:800,
                    cursor:'pointer',
                    boxShadow:`0 4px 14px ${plan.color}30`,
                    display:'flex', alignItems:'center', gap:7,
                    transition:'all 0.15s', whiteSpace:'nowrap',
                  }}
                  onMouseOver={e=>{ (e.currentTarget as HTMLElement).style.filter='brightness(1.1)'; }}
                  onMouseOut={e=>{ (e.currentTarget as HTMLElement).style.filter='brightness(1)'; }}
                >
                  {hasCredits ? 'Racheter' : 'Acheter'}
                </button>
              </div>

              {/* Barre verte si crédits dispos */}
              {hasCredits && (
                <div style={{ padding:'9px 22px', background:'#f0fdf4', borderTop:'1px solid #dcfce7', display:'flex', alignItems:'center', gap:7 }}>
                  <CheckCircle size={12} style={{ color:'#16a34a' }}/>
                  <span style={{ fontSize:12, fontWeight:600, color:'#16a34a' }}>
                    {credits[plan.creditType]} crédit{credits[plan.creditType]>1?'s':''} disponible{credits[plan.creditType]>1?'s':''} — utilisez-les depuis "Nouvelle analyse"
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Garanties */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:10 }}>
        {[
          { icon:'🔒', title:'Stripe sécurisé', sub:'Paiement chiffré' },
          { icon:'♾️', title:'Sans expiration', sub:'Utilisez quand vous voulez' },
          { icon:'⚡', title:'< 2 minutes', sub:'Rapport immédiat' },
          { icon:'🗑️', title:'Données supprimées', sub:'Après chaque analyse' },
        ].map(g=>(
          <div key={g.title} style={{ background:'#fff', borderRadius:11, border:'1px solid #edf2f7', padding:'13px 15px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{g.icon}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{g.title}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>{g.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modale checkout + code promo */}
      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
        />
      )}

    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, Search, Send, Bell,
  ChevronRight, Building2, ExternalLink, ChevronLeft,
  Shield, BarChart2, Clock, Upload, CheckCircle,
  ShieldCheck, ArrowRight, Sparkles, AlertTriangle,
  Download, CreditCard, Lock, Info, Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PROMPT_ANALYSE_COMPLETE, PROMPT_ANALYSE_SIMPLE, PROMPT_APERCU_COMPLET, PROMPT_APERCU_SIMPLE } from '../lib/prompts';
import { createAnalyse, createApercu, updateAnalyseResult, updateApercuResult, markAnalyseFailed, markFreePreviewUsed, checkFreePreviewUsed, fetchAnalyses, type AnalyseDB } from '../lib/analyses';

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
   MOCK DATA — à remplacer par Supabase
══════════════════════════════════════════ */
// Crédits disponibles de l'utilisateur
const MOCK_CREDITS: Credits = {
  document: 0,   // 0 crédit — branché après Stripe
  complete: 0,   // 0 crédit — branché après Stripe
};

// Historique analyses
const MOCK_ANALYSES: Analyse[] = [
  {
    id: '1',
    type: 'complete',
    status: 'completed',
    adresse_bien: '12 rue de la Paix, 75002 Paris',
    score: 8.2,
    recommandation: 'Acheter',
    recommandationColor: '#16a34a',
    date: '24 mars 2026',
    price: '19,90€',
  },
  {
    id: '2',
    type: 'document',
    status: 'completed',
    nom_document: 'PV_AG_2025_Mirabeau.pdf',
    date: '19 mars 2026',
    price: '4,90€',
  },
  {
    id: '3',
    type: 'complete',
    status: 'processing',
    adresse_bien: '7 quai de Saône, 69002 Lyon',
    date: '26 mars 2026',
    price: '29,90€',
  },
];

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setName(user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur');
        setEmail(user.email || '');
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
          : reco === 'Risqué' ? '#dc2626'
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
  const color = score >= 7.5 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626';
  const bg    = score >= 7.5 ? '#f0fdf4' : score >= 5 ? '#fffbeb' : '#fef2f2';
  const bord  = score >= 7.5 ? '#bbf7d0' : score >= 5 ? '#fde68a' : '#fecaca';
  const fs    = size === 'lg' ? 52 : size === 'md' ? 18 : 14;
  const pad   = size === 'lg' ? '12px 28px' : size === 'md' ? '5px 12px' : '3px 9px';
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', gap:2, padding:pad, borderRadius:10, background:bg, border:`1.5px solid ${bord}`, fontSize:fs, fontWeight:900, color, letterSpacing:'-0.01em', flexShrink:0 }}>
      {score.toFixed(1)}<span style={{ fontSize: fs * 0.55, fontWeight:600, opacity:0.65 }}>/10</span>
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
  const navigate = useNavigate();
  const { name, email } = useUser();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };
  const credits = MOCK_CREDITS;

  return (
    <aside style={{ width:260, minHeight:'100vh', height:'100%', background:'#fff', display:'flex', flexDirection:'column', borderRight:'1px solid #edf2f7', boxShadow:'2px 0 16px rgba(15,45,61,0.05)' }}>
      {/* Logo */}
      <div style={{ height:68, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:'1px solid #f0f5f9', flexShrink:0 }}>
        <Link to="/" onClick={onClose}><img src="/logo.png" alt="Analymo" style={{ height:28, objectFit:'contain' }}/></Link>
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
        <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.12em', marginBottom:8 }}>MES ANALYSES</div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', borderRadius:8, background:'#f8fafc', border:'1px solid #edf2f7' }}>
            <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Document</span>
            <span style={{ fontSize:14, fontWeight:900, color:credits.document > 0 ? '#2a7d9c' : '#94a3b8' }}>{credits.document}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', borderRadius:8, background:'#f8fafc', border:'1px solid #edf2f7' }}>
            <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Complète</span>
            <span style={{ fontSize:14, fontWeight:900, color:credits.complete > 0 ? '#0f2d3d' : '#94a3b8' }}>{credits.complete}</span>
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

      {/* User */}
      <div style={{ padding:'10px 14px 16px', borderTop:'1px solid #f0f5f9', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'#f8fafc', border:'1px solid #edf2f7' }}>
          <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }}>
            {(name.charAt(0)||'U').toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name||'…'}</div>
            <div style={{ fontSize:11, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</div>
          </div>
          <button onClick={handleLogout} title="Déconnexion" style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', padding:4, transition:'color 0.15s', flexShrink:0 }}
            onMouseOver={e=>(e.currentTarget.style.color='#ef4444')} onMouseOut={e=>(e.currentTarget.style.color='#cbd5e1')}>
            <LogOut size={14}/>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════
   TOPBAR
══════════════════════════════════════════ */
function Topbar({ onMenuClick, title }: { onMenuClick:()=>void; title:string }) {
  return (
    <header style={{ height:68, background:'#fff', borderBottom:'1px solid #edf2f7', display:'flex', alignItems:'center', padding:'0 24px', gap:12, position:'sticky', top:0, zIndex:40, flexShrink:0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background:'none', border:'none', cursor:'pointer', color:'#0f2d3d', padding:4, display:'none' }}><Menu size={20}/></button>
      <p style={{ flex:1, fontSize:16, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em', margin:0 }}>{title}</p>
      <div className="topbar-cta" style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Link to="/dashboard/tarifs" style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, background:'#f0f7fb', border:'1px solid #dbeafe', textDecoration:'none' }}>
          <span style={{ fontSize:12, fontWeight:700, color:'#2a7d9c' }}>{MOCK_CREDITS.document} simple</span>
          <span style={{ width:1, height:12, background:'#cbd5e1' }}/>
          <span style={{ fontSize:12, fontWeight:700, color:'#0f2d3d' }}>{MOCK_CREDITS.complete} complet{MOCK_CREDITS.complete > 1 ? 's' : ''}</span>
        </Link>
      </div>
      <button style={{ width:36, height:36, borderRadius:9, background:'#f8fafc', border:'1px solid #edf2f7', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}><Bell size={15}/></button>
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
      `}</style>
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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const credits = MOCK_CREDITS; // TODO: remplacer par Supabase après Stripe
  const hasAnalyses = analyses.length > 0;
  const [freePreviewUsedHome] = useState<boolean>(() => checkFreePreviewUsedSync());



  // Stats calculées
  const totalAnalyses = analyses.length;
  const lastAnalyse = [...analyses].sort((a: Analyse, b: Analyse) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const completedComplete = analyses.filter(a => a.type === 'complete' && a.status === 'completed' && a.score != null);
  const avgScore = completedComplete.length > 0
    ? (completedComplete.reduce((s: number, a: Analyse) => s + (a.score||0), 0) / completedComplete.length).toFixed(1)
    : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, animation:'fadeUp 0.35s ease both' }}>

      {/* ── Greeting */}
      <div>
        <h1 style={{ fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>
          {greeting}{name ? `, ${name}` : ''} 👋
        </h1>
        <p style={{ fontSize:14, color:'#64748b' }}>
          {!hasAnalyses ? 'Bienvenue sur Analymo. Lancez votre première analyse dès maintenant.' : 'Bienvenue sur votre espace Analymo.'}
        </p>
      </div>

      {/* ── Bandeau analyse offerte (HomeView) */}
      {/* ── Bandeau offre — visible uniquement si pas encore utilisé */}
      {!freePreviewUsedHome && (
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'18px 22px', borderRadius:16, background:'linear-gradient(135deg, #0f2d3d, #1a5068)', boxShadow:'0 4px 20px rgba(15,45,61,0.18)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Sparkles size={20} style={{ color:'#fff' }}/>
          </div>
          <div style={{ flex:1, position:'relative' }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:3 }}>1 analyse offerte 🎁</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.5 }}>Profitez d'une analyse gratuite afin de visualiser un aperçu du rapport et découvrir notre outil.</div>
          </div>
          <Link to="/dashboard/nouvelle-analyse" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:10, background:'#fff', color:'#0f2d3d', fontSize:13, fontWeight:800, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.12)' }}>
            <ArrowRight size={13}/> En profiter
          </Link>
        </div>
      )}

      {/* ── Bloc bienvenue si aucune analyse */}
      {!hasAnalyses && (
        <div style={{ background:'linear-gradient(135deg, #0f2d3d 0%, #1a5068 100%)', borderRadius:20, padding:'28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap', boxShadow:'0 8px 32px rgba(15,45,61,0.18)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(42,125,156,0.18)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-40, left:60, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.5)', letterSpacing:'0.14em', marginBottom:10 }}>POUR COMMENCER</div>
            <h2 style={{ fontSize:'clamp(16px,2vw,20px)', fontWeight:900, color:'#fff', marginBottom:8, letterSpacing:'-0.02em' }}>Prêt à analyser votre premier bien ?</h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.6, maxWidth:420 }}>
              Déposez vos documents immobiliers et obtenez un rapport complet en moins de 2 minutes.
            </p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, flexShrink:0 }}>
            <Link to="/dashboard/nouvelle-analyse"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 24px', borderRadius:12, background:'#fff', color:'#0f2d3d', fontSize:14, fontWeight:800, textDecoration:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', whiteSpace:'nowrap' }}>
              <Plus size={15}/> Lancer une analyse
            </Link>
            <Link to="/dashboard/tarifs"
              style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', textDecoration:'none' }}>
              Voir les tarifs <ArrowRight size={12}/>
            </Link>
          </div>
        </div>
      )}

      {/* ── Bloc stats + crédits (uniquement si analyses existantes) */}
      {hasAnalyses && <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }} className="stats-grid">

        {/* Analyses totales */}
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid #edf2f7', padding:'22px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'rgba(42,125,156,0.09)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <BarChart2 size={19} style={{ color:'#2a7d9c' }}/>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em' }}>ANALYSES TOTALES</span>
          </div>
          <div>
            <div style={{ fontSize:40, fontWeight:900, color:'#0f172a', letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{totalAnalyses}</div>
            {avgScore && <div style={{ fontSize:12, color:'#16a34a', fontWeight:700 }}>Score moyen : {avgScore}/10</div>}
            {!avgScore && <div style={{ fontSize:12, color:'#94a3b8' }}>Aucune analyse complète encore</div>}
          </div>
        </div>

        {/* Dernière analyse */}
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid #edf2f7', padding:'22px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'rgba(217,119,6,0.09)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Clock size={19} style={{ color:'#d97706' }}/>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em' }}>DERNIÈRE ANALYSE</span>
          </div>
          {hasAnalyses && lastAnalyse ? (
            <div>
              <div style={{ fontSize:18, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em', marginBottom:4 }}>{lastAnalyse.date}</div>
              <div style={{ fontSize:12, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {lastAnalyse.type === 'complete' ? lastAnalyse.adresse_bien : lastAnalyse.nom_document}
              </div>
              <div style={{ marginTop:6 }}>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:6, background: lastAnalyse.type==='complete'?'rgba(15,45,61,0.08)':'rgba(42,125,156,0.08)', color:lastAnalyse.type==='complete'?'#0f2d3d':'#2a7d9c' }}>
                  {lastAnalyse.type === 'complete' ? 'Analyse complète' : 'Analyse document'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:15, fontWeight:700, color:'#94a3b8' }}>Aucune encore</div>
          )}
        </div>

        {/* Crédits restants — détaillé */}
        <div style={{ background:'linear-gradient(145deg, #0f2d3d 0%, #1a5068 100%)', borderRadius:18, padding:'22px', boxShadow:'0 4px 20px rgba(15,45,61,0.18)', display:'flex', flexDirection:'column', gap:12, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CreditCard size={19} style={{ color:'#fff' }}/>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em' }}>CRÉDITS RESTANTS</span>
          </div>
          <div className="credit-detail" style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1, padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:26, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:3 }}>{credits.document}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', marginBottom:2 }}>SIMPLE</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>4,90€ / crédit</div>
            </div>
            <div style={{ flex:1, padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:26, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:3 }}>{credits.complete}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', marginBottom:2 }}>COMPLÈTE</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>19,90€ / crédit</div>
            </div>
          </div>
          <Link to="/dashboard/tarifs" style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', textDecoration:'none', transition:'color 0.15s' }}
            onMouseOver={e=>(e.currentTarget.style.color='#fff')} onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.7)')}>
            Recharger des crédits <ArrowRight size={12}/>
          </Link>
        </div>
      </div>}

      {/* ── Section : Analyser un document */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em' }}>Analyser un document</h2>
          <span style={{ fontSize:12, color:'#94a3b8' }}>Choisissez selon votre besoin</span>
        </div>
        <div className="action-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* Analyse simple */}
          <Link to="/dashboard/nouvelle-analyse?type=document" style={{ textDecoration:'none' }}>
            <div style={{ background:'#fff', borderRadius:18, border:`1.5px solid ${credits.document > 0 ? '#edf2f7' : '#fecaca'}`, padding:'24px', cursor:'pointer', transition:'all 0.2s', height:'100%', boxSizing:'border-box' as const, position:'relative', opacity: credits.document > 0 ? 1 : 0.7 }}
              onMouseOver={e=>{ if(credits.document > 0){ const el=e.currentTarget as HTMLElement; el.style.borderColor='#2a7d9c'; el.style.boxShadow='0 8px 24px rgba(42,125,156,0.1)'; el.style.transform='translateY(-2px)'; }}}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=credits.document>0?'#edf2f7':'#fecaca'; el.style.boxShadow='none'; el.style.transform='translateY(0)'; }}>
              {credits.document === 0 && (
                <div style={{ position:'absolute', top:14, right:14, display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:'#ef4444', background:'#fef2f2', border:'1px solid #fecaca', padding:'3px 8px', borderRadius:6 }}>
                  <Lock size={10}/> 0 crédit
                </div>
              )}
              {credits.document > 0 && (
                <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:700, color:'#16a34a', background:'#f0fdf4', border:'1px solid #bbf7d0', padding:'3px 8px', borderRadius:6 }}>
                  {credits.document} crédit{credits.document > 1 ? 's' : ''} dispo
                </div>
              )}
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(42,125,156,0.08)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <FileText size={22} style={{ color:'#2a7d9c' }}/>
              </div>
              <div style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:6 }}>Analyse d'un document</div>
              <div style={{ fontSize:12, color:'#64748b', lineHeight:1.6, marginBottom:18 }}>
                Un seul fichier analysé — PV d'AG, règlement, diagnostic ou appel de charges.
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, fontWeight:700, color: credits.document > 0 ? '#2a7d9c' : '#94a3b8', display:'flex', alignItems:'center', gap:5 }}>
                  {credits.document > 0 ? 'Commencer' : 'Acheter un crédit'} <ArrowRight size={14}/>
                </span>
                <span style={{ fontSize:20, fontWeight:900, color:'#0f172a' }}>4,90€</span>
              </div>
            </div>
          </Link>

          {/* Analyse complète */}
          <Link to={credits.complete > 0 ? '/dashboard/nouvelle-analyse?type=complete' : '/tarifs'} style={{ textDecoration:'none' }}>
            <div style={{ background:'linear-gradient(145deg, #0f2d3d 0%, #1a5068 100%)', borderRadius:18, padding:'24px', cursor:'pointer', transition:'all 0.2s', position:'relative', overflow:'hidden', height:'100%', boxSizing:'border-box' as const }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 12px 36px rgba(15,45,61,0.3)'; el.style.transform='translateY(-2px)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='none'; el.style.transform='translateY(0)'; }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
              {/* Badge crédits */}
              {credits.complete > 0 ? (
                <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:700, color:'#fff', background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)', padding:'3px 8px', borderRadius:6 }}>
                  {credits.complete} crédit{credits.complete > 1 ? 's' : ''} dispo
                </div>
              ) : (
                <div style={{ position:'absolute', top:14, right:14, display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.7)', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', padding:'3px 8px', borderRadius:6 }}>
                  <Lock size={10}/> Acheter
                </div>
              )}
              <div style={{ position:'absolute', top:14, left:14, fontSize:9, fontWeight:800, color:'#fff', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', padding:'3px 10px', borderRadius:100 }}>
                ⭐ RECOMMANDÉ
              </div>
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, marginTop:8 }}>
                <ShieldCheck size={22} style={{ color:'#fff' }}/>
              </div>
              <div style={{ fontSize:17, fontWeight:800, color:'#fff', marginBottom:6 }}>Analyse complète d'un logement</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:18 }}>
                Tous les documents du bien — score /10, risques, recommandation Analymo.
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:5 }}>
                  {credits.complete > 0 ? 'Commencer l\'audit' : 'Acheter un crédit'} <ArrowRight size={14}/>
                </span>
                <span style={{ fontSize:20, fontWeight:900, color:'#fff' }}>19,90€</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Analyses récentes */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em' }}>Analyses récentes</h2>
          <Link to="/dashboard/analyses" style={{ fontSize:13, color:'#2a7d9c', textDecoration:'none', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
            Tout voir <ChevronRight size={14}/>
          </Link>
        </div>
        {!hasAnalyses ? (
          <EmptyAnalyses/>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {MOCK_ANALYSES.slice(0,3).map(a=><AnalyseRow key={a.id} a={a}/>)}
          </div>
        )}
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
  const credits = MOCK_CREDITS;
  const [step, setStep] = useState<'choice'|'upload'|'analyse'|'apercu'|'result'>('choice');
  const [type, setType] = useState<'document'|'complete'|null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<AnalyseResult|null>(null);
  const [apercu, setApercu] = useState<ApercuResult|null>(null);
  const [apercuId, setApercuId] = useState<string|null>(null);
  const [freePreviewUsed, setFreePreviewUsed] = useState<boolean|null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkFreePreviewUsed().then(used => setFreePreviewUsed(used));
  }, []);

  const plans = {
    document: { label:"Analyse d'un document",       price:'4,90€',  max:1,  desc:'Un seul fichier — PV d\'AG, règlement, diagnostic, appel de charges.', creditsKey:'document' as keyof Credits },
    complete: { label:"Analyse complète d'un logement", price:'19,90€', max:20, desc:'Tous les documents du bien — score /10, risques, recommandation Analymo.', creditsKey:'complete' as keyof Credits },
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
    const analyseDB = await createApercu(type, files[0].name, docNames);
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
    setStep('analyse'); setError(''); setProgress(5); setProgressMsg('Lecture des documents…');

    const docNames = files.map(f => f.name);
    const analyseDB = await createAnalyse(type, files[0].name, docNames);
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
      <p style={{ fontSize:14, color:'#64748b', marginBottom:freePreviewUsed===false?16:32 }}>Choisissez le mode d'analyse adapté à votre besoin.</p>

      {/* Badge aperçu — visible uniquement si pas encore utilisé */}
      {!freePreviewUsed && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderRadius:14, background:'linear-gradient(135deg, #0f2d3d, #1a5068)', marginBottom:28, boxShadow:'0 4px 16px rgba(15,45,61,0.18)' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Sparkles size={16} style={{ color:'#fff'}}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:2 }}>1 analyse offerte 🎁</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.4 }}>Profitez d'une analyse gratuite afin de visualiser un aperçu du rapport et découvrir notre outil.</div>
          </div>
          <span style={{ fontSize:10, fontWeight:800, color:'#0f2d3d', background:'#fff', padding:'4px 12px', borderRadius:100, whiteSpace:'nowrap', flexShrink:0 }}>OFFERT</span>
        </div>
      )}

      <div className="type-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        {/* Document simple */}
        <button onClick={()=>{ setType('document'); setStep('upload'); }}
          style={{ padding:'28px 24px', borderRadius:20, border:`1.5px solid ${credits.document>0?'#edf2f7':'#fecaca'}`, background:'#fff', cursor:'pointer', textAlign:'left', transition:'all 0.18s', position:'relative', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=credits.document>0?'#2a7d9c':'#fca5a5'; el.style.boxShadow='0 8px 28px rgba(42,125,156,0.1)'; el.style.transform='translateY(-2px)'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor=credits.document>0?'#edf2f7':'#fecaca'; el.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; el.style.transform='translateY(0)'; }}>
          <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:credits.document>0?'#f0fdf4':'#fef2f2', color:credits.document>0?'#16a34a':'#ef4444', border:`1px solid ${credits.document>0?'#bbf7d0':'#fecaca'}` }}>
            {credits.document > 0 ? `${credits.document} crédit${credits.document>1?'s':''}` : '0 crédit — Acheter'}
          </div>
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(42,125,156,0.08)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
            <FileText size={24} style={{ color:'#2a7d9c' }}/>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Analyse d'un document</div>
          <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:20 }}>Un seul fichier — PV d'AG, règlement de copropriété, diagnostic ou appel de charges.</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:700, color:credits.document>0?'#2a7d9c':'#ef4444', display:'flex', alignItems:'center', gap:5 }}>
              {credits.document>0?<><ArrowRight size={14}/> Commencer</>:<><Lock size={13}/> Acheter un crédit</>}
            </span>
            <span style={{ fontSize:22, fontWeight:900, color:'#0f172a' }}>4,90€</span>
          </div>
        </button>

        {/* Analyse complète */}
        <button onClick={()=>{ if(credits.complete>0){ setType('complete'); setStep('upload'); } else { window.location.href='/dashboard/tarifs'; } }}
          style={{ padding:'28px 24px', borderRadius:20, border:'1.5px solid transparent', background:'linear-gradient(145deg, #0f2d3d, #1a5068)', cursor:'pointer', textAlign:'left', transition:'all 0.18s', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(15,45,61,0.15)' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 12px 40px rgba(15,45,61,0.28)'; el.style.transform='translateY(-2px)'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 20px rgba(15,45,61,0.15)'; el.style.transform='translateY(0)'; }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:14, left:14, fontSize:9, fontWeight:800, color:'#fff', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', padding:'3px 10px', borderRadius:100 }}>⭐ RECOMMANDÉ</div>
          <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:credits.complete>0?'rgba(255,255,255,0.15)':'rgba(239,68,68,0.25)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}>
            {credits.complete>0 ? `${credits.complete} crédit${credits.complete>1?'s':''}` : '0 crédit — Acheter'}
          </div>
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18, marginTop:10 }}>
            <ShieldCheck size={24} style={{ color:'#fff' }}/>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:8 }}>Analyse complète d'un logement</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:20 }}>Tous les documents du bien — score /10, risques identifiés, recommandation Analymo.</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:5 }}>
              {credits.complete>0?'Commencer l\'audit ':'Acheter un crédit '}<ArrowRight size={14}/>
            </span>
            <span style={{ fontSize:22, fontWeight:900, color:'#fff' }}>19,90€</span>
          </div>
        </button>
      </div>

      {/* Packs */}
      <div className="type-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[
          { l:'Pack 2 biens', p:'29,90€', s:'2 crédits analyse complète', credits:'2 crédits complets' },
          { l:'Pack 3 biens', p:'39,90€', s:'3 crédits analyse complète', credits:'3 crédits complets' },
        ].map(pk=>(
          <Link key={pk.l} to="/dashboard/tarifs" style={{ textDecoration:'none' }}>
            <div style={{ background:'#fff', borderRadius:13, border:'1.5px solid #edf2f7', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'all 0.15s' }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(42,125,156,0.3)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#edf2f7'; }}>
              <div>
                <div style={{ fontSize:13.5, fontWeight:800, color:'#0f172a', marginBottom:2 }}>{pk.l}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>{pk.s}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:15, fontWeight:900, color:'#0f172a' }}>{pk.p}</span>
                <ArrowRight size={13} style={{ color:'#2a7d9c' }}/>
              </div>
            </div>
          </Link>
        ))}
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
      {freePreviewUsed === false && (
        <div style={{ padding:'12px 16px', borderRadius:12, background:'linear-gradient(135deg, #0f2d3d, #1a5068)', display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <Sparkles size={13} style={{ color:'#fff', flexShrink:0 }}/>
          <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>Votre analyse offerte — aperçu du rapport généré gratuitement.</span>
        </div>
      )}
      <button onClick={freePreviewUsed === false ? lancerApercu : lancer} disabled={files.length===0}
        style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:files.length>0?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#e2e8f0', color:files.length>0?'#fff':'#94a3b8', fontSize:15, fontWeight:800, cursor:files.length>0?'pointer':'default', boxShadow:files.length>0?'0 4px 18px rgba(15,45,61,0.2)':'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.15s' }}>
        <Sparkles size={16}/> {freePreviewUsed === false ? 'Générer mon aperçu gratuit' : 'Analyser'} {files.length>0?`(${files.length} fichier${files.length>1?'s':''})` : ''}
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
            <div style={{ fontSize:10, fontWeight:800, color:'#2a7d9c', letterSpacing:'0.14em', marginBottom:6 }}>RAPPORT ANALYMO</div>
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
              <div style={{ fontSize:14, color:'#94a3b8' }}>/ 10</div>
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
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em', marginBottom:10 }}>AVIS ANALYMO</div>
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
              <div style={{ fontSize:14, color:'#94a3b8' }}>/10</div>
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
            {['Rapport financier détaillé', 'Liste des travaux votés et à prévoir', 'Analyse des charges et fonds travaux', 'Procédures en cours', 'Avis Analymo personnalisé'].map((item, i) => (
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
              Score {isComplete ? '/10, travaux, charges, procédures et avis Analymo' : 'et analyse approfondie'}. Rapport PDF téléchargeable inclus.
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

  // Pas d'analyses complètes du tout
  if (completedAnalyses.length === 0) {
    return (
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:24 }}>Comparer mes biens</h1>
        <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #edf2f7', padding:'52px 32px', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ width:72, height:72, borderRadius:20, background:'rgba(42,125,156,0.07)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Lock size={30} style={{ color:'#94a3b8' }}/>
          </div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:10 }}>Fonctionnalité réservée aux analyses complètes</h2>
          <p style={{ fontSize:14, color:'#64748b', lineHeight:1.7, marginBottom:28, maxWidth:420, margin:'0 auto 28px' }}>
            La comparaison de biens fonctionne uniquement avec des <strong>analyses complètes</strong>. Vous n'en avez aucune pour le moment.<br/><br/>
            Lancez une analyse complète (19,90€) pour accéder à cette fonctionnalité.
          </p>
          <Link to="/dashboard/nouvelle-analyse?type=complete"
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:12, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 16px rgba(15,45,61,0.2)' }}>
            <ShieldCheck size={16}/> Lancer une analyse complète
          </Link>
        </div>
      </div>
    );
  }

  // Moins de 2 analyses complètes → sélection
  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s=>s!==id) : prev.length < 2 ? [...prev, id] : prev);
  };

  const selectedAnalyses = completedAnalyses.filter(a => selected.includes(a.id));
  const canCompare = selected.length === 2;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>Comparer mes biens</h1>
        <p style={{ fontSize:13, color:'#64748b' }}>Sélectionnez 2 analyses complètes pour les comparer côte à côte.</p>
      </div>

      {/* Sélection */}
      {!canCompare && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>
            Analyses complètes disponibles ({completedAnalyses.length})
            <span style={{ fontSize:12, fontWeight:500, color:'#94a3b8', marginLeft:8 }}>Sélectionnez 2 biens</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {completedAnalyses.map(a => {
              const isSel = selected.includes(a.id);
              return (
                <div key={a.id} onClick={()=>toggleSelect(a.id)}
                  style={{ background:'#fff', borderRadius:13, border:`1.5px solid ${isSel?'#2a7d9c':'#edf2f7'}`, padding:'14px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', transition:'all 0.18s', boxShadow:isSel?'0 0 0 3px rgba(42,125,156,0.12)':'none' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:isSel?'rgba(42,125,156,0.12)':'rgba(15,45,61,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {isSel ? <CheckCircle size={18} color="#2a7d9c"/> : <Building2 size={17} style={{ color:'#64748b' }}/>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.adresse_bien}</div>
                    <div style={{ fontSize:12, color:'#94a3b8' }}>{a.date}</div>
                  </div>
                  {a.score != null && <ScoreBadge score={a.score} size="sm"/>}
                </div>
              );
            })}
          </div>
          {selected.length === 1 && (
            <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background:'rgba(42,125,156,0.05)', border:'1px solid rgba(42,125,156,0.15)', fontSize:13, color:'#2a7d9c', fontWeight:600 }}>
              ✓ 1 bien sélectionné — choisissez un deuxième bien pour comparer
            </div>
          )}
        </div>
      )}

      {/* Comparaison côte à côte */}
      {canCompare && selectedAnalyses.length === 2 && (
        <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Comparaison sélectionnée</span>
            <button onClick={()=>setSelected([])} style={{ fontSize:13, fontWeight:600, color:'#94a3b8', background:'none', border:'none', cursor:'pointer' }}>
              Changer la sélection
            </button>
          </div>
          <div className="compare-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {selectedAnalyses.map((a, i) => {
              const sc2 = a.score ?? 0;
              const color = sc2 >= 7.5 ? '#16a34a' : sc2 >= 5 ? '#d97706' : '#dc2626';
              return (
                <div key={a.id} style={{ background:'#fff', borderRadius:18, border:`1.5px solid ${color}20`, padding:'26px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.12em', marginBottom:8 }}>BIEN {i+1}</div>
                  <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:18, lineHeight:1.4 }}>{a.adresse_bien}</h3>
                  {a.score != null && (
                    <div style={{ marginBottom:16 }}>
                      <ScoreBadge score={a.score} size="lg"/>
                    </div>
                  )}
                  {a.recommandation && (
                    <span style={{ display:'inline-block', padding:'5px 14px', borderRadius:8, background:`${a.recommandationColor}10`, color:a.recommandationColor, fontSize:13, fontWeight:700, border:`1px solid ${a.recommandationColor}22` }}>
                      {a.recommandation}
                    </span>
                  )}
                  <div style={{ marginTop:16, fontSize:12, color:'#94a3b8' }}>Analysé le {a.date}</div>
                </div>
              );
            })}
          </div>
          <div style={{ padding:'20px 22px', borderRadius:14, background:'#fff', border:'1px solid #edf2f7', display:'flex', gap:12, alignItems:'flex-start' }}>
            <Shield size={18} color="#2a7d9c" style={{ flexShrink:0, marginTop:2 }}/>
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:'#2a7d9c', letterSpacing:'0.12em', marginBottom:6 }}>VERDICT ANALYMO</div>
              {(() => {
                const [b1, b2] = selectedAnalyses;
                const s1 = b1.score ?? 0, s2 = b2.score ?? 0;
                const best = s1 >= s2 ? b1 : b2;
                return <p style={{ fontSize:14, color:'#0f172a', fontWeight:600, lineHeight:1.6 }}>Le bien <strong>"{best.adresse_bien}"</strong> (score {(best.score??0).toFixed(1)}/10) est recommandé selon nos analyses. Consultez les rapports détaillés pour affiner votre décision.</p>;
              })()}
            </div>
          </div>
        </>
      )}
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
            <span style={{ fontSize:13, color:'#dc2626', fontWeight:600 }}>Êtes-vous sûr ?</span>
            <button onClick={async ()=>{ await supabase.auth.signOut(); window.location.href='/'; }}
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
            <p style={{ fontSize:13, color:'#94a3b8' }}>Réponse sous 24h à hello@analymo.fr</p>
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
function Tarifs() {
  const credits = MOCK_CREDITS;
  const [loading, setLoading] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleAcheter = (planId: string) => {
    setLoading(planId);
    setTimeout(() => {
      setLoading(null);
      alert('Redirection vers Stripe… (à connecter)');
    }, 800);
  };

  const plans = [
    {
      id: 'document',
      label: 'Analyse Document',
      price: '4,90€',
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
      desc: "Audit global d'un bien avec score et recommandation.",
      creditLabel: '1 crédit complet',
      creditType: 'complete' as keyof Credits,
      color: '#0f2d3d',
      icon: ShieldCheck,
      popular: true,
      details: [
        'Documents illimités pour un seul bien',
        'Score global noté /10',
        'Recommandation : Acheter / Négocier / Risqué',
        'Estimation des risques financiers',
        'Avis Analymo complet',
        'Rapport PDF téléchargeable',
        'Résultat en moins de 2 minutes',
      ],
    },
    {
      id: 'pack2',
      label: 'Pack 2 Biens',
      price: '29,90€',
      desc: 'Comparez 2 biens côte à côte. 14,95€ / bien.',
      creditLabel: '2 crédits complets',
      creditType: 'complete' as keyof Credits,
      color: '#1a5068',
      icon: GitCompare,
      badge: '−25%',
      details: [
        '2 analyses complètes incluses',
        'Comparaison côte à côte des 2 biens',
        'Verdict Analymo : quel bien choisir',
        '14,95€ / analyse au lieu de 19,90€',
        'Rapport PDF pour chaque bien',
      ],
    },
    {
      id: 'pack3',
      label: 'Pack 3 Biens',
      price: '39,90€',
      desc: 'Le meilleur rapport qualité/prix. 13,30€ / bien.',
      creditLabel: '3 crédits complets',
      creditType: 'complete' as keyof Credits,
      color: '#1a5068',
      icon: BarChart2,
      badge: '−33%',
      details: [
        '3 analyses complètes incluses',
        'Comparaison des 3 biens',
        'Classement final Analymo',
        'Recommandation définitive',
        '13,30€ / analyse au lieu de 19,90€',
        'Rapport PDF pour chaque bien',
      ],
    },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28, maxWidth:740, margin:'0 auto' }}>

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
                  <span style={{ marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,0.45)' }}>Recommandé par Analymo</span>
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
                  onClick={()=>handleAcheter(plan.id)}
                  disabled={loading===plan.id}
                  style={{
                    flexShrink:0, padding:'11px 22px', borderRadius:11, border:'none',
                    background:`linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                    color:'#fff', fontSize:13.5, fontWeight:800,
                    cursor:loading===plan.id?'not-allowed':'pointer',
                    boxShadow:`0 4px 14px ${plan.color}30`,
                    display:'flex', alignItems:'center', gap:7,
                    opacity:loading===plan.id?0.75:1,
                    transition:'all 0.15s', whiteSpace:'nowrap',
                  }}
                  onMouseOver={e=>{ if(loading!==plan.id)(e.currentTarget as HTMLElement).style.filter='brightness(1.1)'; }}
                  onMouseOut={e=>{ (e.currentTarget as HTMLElement).style.filter='brightness(1)'; }}
                >
                  {loading===plan.id
                    ? <><div style={{ width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.35)',borderTopColor:'#fff',animation:'spin 0.8s linear infinite' }}/> Traitement…</>
                    : hasCredits ? 'Racheter' : 'Acheter'
                  }
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

    </div>
  );
}

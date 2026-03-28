import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, Search, Send, Bell,
  ChevronRight, Building2, ExternalLink, ChevronLeft,
  Shield, BarChart2, Clock, Upload, CheckCircle,
  ShieldCheck, ArrowRight, Sparkles, AlertTriangle,
  Download, CreditCard, TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ─── TYPES ─────────────────────────────── */
type Analyse = {
  id: string; title: string;
  type: 'document' | 'complete';
  status: 'completed' | 'processing' | 'error';
  score?: number; recommandation?: string; recommandationColor?: string;
  date: string; price: string;
};

type AnalyseResult = {
  titre: string;
  score?: number;
  recommandation?: string;
  resume: string;
  points_forts: string[];
  points_vigilance: string[];
  risques_financiers?: string;
  conclusion: string;
};

/* ─── MOCK DATA ──────────────────────────── */
const mockAnalyses: Analyse[] = [
  { id:'1', title:'Appartement rue de la Paix, Paris 2e', type:'complete', status:'completed', score:8.2, recommandation:'Acheter', recommandationColor:'#16a34a', date:'24 mars 2026', price:'19,90€' },
  { id:'2', title:'Studio Cours Mirabeau, Aix-en-Provence', type:'document', status:'completed', date:'19 mars 2026', price:'4,99€' },
  { id:'3', title:'T3 Quai de Saône, Lyon 2e', type:'complete', status:'processing', date:'26 mars 2026', price:'29,90€' },
];

/* ─── NAV CONFIG ─────────────────────────── */
const navItems = [
  { to:'/dashboard',                  icon:LayoutDashboard, label:'Tableau de bord' },
  { to:'/dashboard/analyses',         icon:FileText,        label:'Mes analyses' },
  { to:'/dashboard/compare',          icon:GitCompare,      label:'Comparer mes biens' },
  { to:'/tarifs',                     icon:CreditCard,      label:'Tarifs', external:true },
  { to:'/dashboard/compte',           icon:User,            label:'Mon compte' },
  { to:'/dashboard/support',          icon:LifeBuoy,        label:'Support / Aide' },
];

/* ─── HOOK USER ──────────────────────────── */
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

/* ─── SCORE BADGE ────────────────────────── */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7.5 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626';
  const bg    = score >= 7.5 ? '#f0fdf4' : score >= 5 ? '#fffbeb' : '#fef2f2';
  const bord  = score >= 7.5 ? '#bbf7d0' : score >= 5 ? '#fde68a' : '#fecaca';
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', gap:2, padding:'4px 11px', borderRadius:9, background:bg, border:`1.5px solid ${bord}`, fontSize:15, fontWeight:900, color, letterSpacing:'-0.01em' }}>
      {score.toFixed(1)}<span style={{ fontSize:10, fontWeight:600, opacity:0.65 }}>/10</span>
    </span>
  );
}

/* ══════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════ */
function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, email } = useUser();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  return (
    <aside style={{
      width:256, minHeight:'100vh', height:'100%',
      background:'#fff',
      display:'flex', flexDirection:'column',
      borderRight:'1px solid #edf2f7',
      boxShadow:'2px 0 12px rgba(15,45,61,0.04)',
    }}>
      {/* Logo */}
      <div style={{ height:68, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:'1px solid #f0f5f9', flexShrink:0 }}>
        <Link to="/" onClick={onClose}>
          <img src="/logo.png" alt="Analymo" style={{ height:28, objectFit:'contain' }}/>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}><X size={18}/></button>
        )}
      </div>

      {/* CTA Nouvelle analyse */}
      <div style={{ padding:'16px 14px 10px' }}>
        <Link to="/dashboard/nouvelle-analyse" onClick={onClose}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px 16px', borderRadius:12, background:'linear-gradient(135deg, #2a7d9c 0%, #0f2d3d 100%)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:700, boxShadow:'0 4px 14px rgba(42,125,156,0.3)', transition:'all 0.2s' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 6px 20px rgba(42,125,156,0.4)'; el.style.transform='translateY(-1px)'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 14px rgba(42,125,156,0.3)'; el.style.transform='translateY(0)'; }}>
          <Plus size={15} strokeWidth={2.5}/> Nouvelle analyse
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'4px 10px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        <p style={{ fontSize:10, fontWeight:700, color:'#b0bec5', letterSpacing:'0.14em', padding:'10px 10px 6px', textTransform:'uppercase' }}>Menu</p>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:active?700:500, color:active?'#0f2d3d':'#64748b', background:active?'#f0f7fb':'transparent', transition:'all 0.15s', position:'relative' }}
              onMouseOver={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='#f8fafc'; }}
              onMouseOut={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
              {active && <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:99, background:'#2a7d9c' }}/>}
              <Icon size={16} style={{ color:active?'#2a7d9c':'#94a3b8', flexShrink:0 }}/>
              <span style={{ flex:1 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User block */}
      <div style={{ padding:'10px 14px 16px', borderTop:'1px solid #f0f5f9', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'#f8fafc', border:'1px solid #edf2f7' }}>
          <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }}>
            {(name.charAt(0)||'U').toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name||'…'}</div>
            <div style={{ fontSize:11, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</div>
          </div>
          <button onClick={handleLogout} title="Déconnexion"
            style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', padding:4, transition:'color 0.15s', flexShrink:0 }}
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
      <div style={{ flex:1 }}>
        <p style={{ fontSize:16, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em', margin:0 }}>{title}</p>
      </div>
      <button style={{ width:36, height:36, borderRadius:9, background:'#f8fafc', border:'1px solid #edf2f7', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}>
        <Bell size={15}/>
      </button>
      <Link to="/dashboard/nouvelle-analyse" className="topbar-cta"
        style={{ padding:'9px 18px', borderRadius:10, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(15,45,61,0.18)' }}>
        <Plus size={13}/> Nouvelle analyse
      </Link>
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
      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ width:256, flexShrink:0 }}>
        <div style={{ position:'fixed', top:0, left:0, width:256, height:'100vh', zIndex:50, overflowY:'auto' }}>
          <Sidebar/>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'fixed', inset:0, zIndex:200 }}>
            <div onClick={()=>setMobileOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(15,45,61,0.35)', backdropFilter:'blur(4px)' }}/>
            <motion.div initial={{ x:-256 }} animate={{ x:0 }} exit={{ x:-256 }} transition={{ type:'spring', stiffness:320, damping:32 }}
              style={{ position:'absolute', left:0, top:0, bottom:0, width:256 }}>
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
          .analyse-grid { grid-template-columns: 1fr !important; }
          .result-grid { grid-template-columns: 1fr !important; }
          .type-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}

/* ─── CONTENT ROUTER ─────────────────────── */
function DashboardContent({ path }: { path:string }) {
  if (path === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse/>;
  if (path === '/dashboard/analyses')          return <MesAnalyses/>;
  if (path === '/dashboard/compare')           return <Compare/>;
  if (path === '/dashboard/compte')            return <Compte/>;
  if (path === '/dashboard/support')           return <Support/>;
  return <HomeView/>;
}

/* ══════════════════════════════════════════
   HOME — adaptatif selon nb d'analyses
══════════════════════════════════════════ */
function HomeView() {
  const { name } = useUser();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  // Simule 0 ou plusieurs analyses — à connecter à Supabase plus tard
  const hasAnalyses = mockAnalyses.length > 0;

  if (!hasAnalyses) return <OnboardingView name={name} greeting={greeting}/>;
  return <DashboardFull name={name} greeting={greeting}/>;
}

/* ─── ONBOARDING (0 analyse) ─────────────── */
function OnboardingView({ name, greeting }: { name:string; greeting:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:32, animation:'fadeUp 0.4s ease both' }}>
      {/* Hero welcome */}
      <div style={{ background:'linear-gradient(135deg, #0f2d3d 0%, #1a5068 100%)', borderRadius:24, padding:'48px 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-30, left:20, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
        <div style={{ position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:100, background:'rgba(42,125,156,0.3)', border:'1px solid rgba(42,125,156,0.5)', marginBottom:20 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', animation:'pulse 2s ease-in-out infinite' }}/>
            <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'0.06em' }}>BIENVENUE SUR ANALYMO</span>
          </div>
          <h1 style={{ fontSize:'clamp(24px,3.5vw,36px)', fontWeight:900, color:'#fff', letterSpacing:'-0.03em', marginBottom:12, lineHeight:1.15 }}>
            {greeting}{name ? `, ${name}` : ''} 👋<br/>
            <span style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.75em', fontWeight:700 }}>Prêt à analyser votre premier bien ?</span>
          </h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.6)', lineHeight:1.65, maxWidth:500, marginBottom:32 }}>
            Déposez vos documents immobiliers et obtenez un rapport complet avec score, risques et recommandations en moins de 2 minutes.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link to="/dashboard/nouvelle-analyse"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:12, background:'#fff', color:'#0f2d3d', fontSize:15, fontWeight:800, textDecoration:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.2)', transition:'all 0.2s' }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-2px)'; el.style.boxShadow='0 8px 28px rgba(0,0,0,0.25)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform='translateY(0)'; el.style.boxShadow='0 4px 20px rgba(0,0,0,0.2)'; }}>
              <Sparkles size={17}/> Lancer ma première analyse
            </Link>
            <Link to="/exemple"
              style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'13px 22px', borderRadius:12, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.85)', fontSize:14, fontWeight:600, textDecoration:'none', transition:'all 0.2s' }}>
              Voir un exemple de rapport <ArrowRight size={14}/>
            </Link>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div>
        <h2 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:16, letterSpacing:'-0.01em' }}>Comment ça fonctionne ?</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
          {[
            { step:'1', icon:Upload,    title:'Déposez vos docs',      desc:'PDF, Word, images — PV d\'AG, règlement, diagnostic, charges', color:'#2a7d9c' },
            { step:'2', icon:Sparkles,  title:'L\'IA analyse tout',    desc:'Analymo lit et croise tous vos documents en moins de 2 min', color:'#7c3aed' },
            { step:'3', icon:BarChart2, title:'Rapport détaillé',      desc:'Score /10, risques identifiés, recommandation finale', color:'#16a34a' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.step} style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'22px', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={17} style={{ color:s.color }}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'0.1em' }}>ÉTAPE {s.step}</span>
                </div>
                <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:6 }}>{s.title}</div>
                <div style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reassurance */}
      <div style={{ display:'flex', gap:24, flexWrap:'wrap', padding:'16px 20px', background:'#fff', borderRadius:14, border:'1px solid #edf2f7' }}>
        {[['🔒','Données chiffrées SSL'],['🗑️','Documents supprimés après analyse'],['⚡','Résultat en < 2 minutes'],['🏅','Satisfaction garantie']].map(([icon,txt])=>(
          <div key={txt} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#64748b', fontWeight:500 }}>
            <span style={{ fontSize:16 }}>{icon}</span>{txt}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── DASHBOARD FULL (avec analyses) ────── */
function DashboardFull({ name, greeting }: { name:string; greeting:string }) {
  const stats = [
    { label:'Analyses réalisées', value:String(mockAnalyses.length), icon:FileText,  color:'#2a7d9c', bg:'rgba(42,125,156,0.09)',  trend:'+1 ce mois' },
    { label:'Score moyen',        value:'8,2/10',                    icon:TrendingUp, color:'#16a34a', bg:'rgba(22,163,74,0.09)',   trend:'↑ Bon niveau' },
    { label:'Dernière analyse',   value:'24 mars',                   icon:Clock,     color:'#d97706', bg:'rgba(217,119,6,0.09)',   trend:'il y a 2 jours' },
    { label:'Crédits restants',   value:'0',                         icon:CreditCard,color:'#7c3aed', bg:'rgba(124,58,237,0.09)', trend:<Link to="/tarifs" style={{ color:'#7c3aed', fontWeight:700, fontSize:11, textDecoration:'none' }}>Recharger →</Link> },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      {/* Greeting */}
      <div style={{ animation:'fadeUp 0.3s ease both' }}>
        <h1 style={{ fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>
          {greeting}{name ? `, ${name}` : ''} 👋
        </h1>
        <p style={{ fontSize:14, color:'#64748b' }}>Voici un aperçu de votre activité.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, animation:'fadeUp 0.38s ease both' }}>
        {stats.map((s,i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={17} style={{ color:s.color }}/>
                </div>
              </div>
              <div style={{ fontSize:24, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em', lineHeight:1, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:11, color:s.color, fontWeight:700 }}>{s.trend}</div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div style={{ animation:'fadeUp 0.44s ease both' }}>
        <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:14, letterSpacing:'-0.01em' }}>Lancer une analyse</h2>
        <div className="analyse-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Document simple */}
          <Link to="/dashboard/nouvelle-analyse?type=document" style={{ textDecoration:'none' }}>
            <div style={{ background:'#fff', borderRadius:18, border:'1.5px solid #edf2f7', padding:'24px', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:16 }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#2a7d9c'; el.style.boxShadow='0 8px 24px rgba(42,125,156,0.1)'; el.style.transform='translateY(-2px)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#edf2f7'; el.style.boxShadow='none'; el.style.transform='translateY(0)'; }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'rgba(42,125,156,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FileText size={24} style={{ color:'#2a7d9c' }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Analyse d'un document</div>
                <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>1 fichier · PV, règlement, diagnostic…</div>
                <div style={{ fontSize:18, fontWeight:900, color:'#2a7d9c' }}>4,99€</div>
              </div>
              <ArrowRight size={18} style={{ color:'#cbd5e1', flexShrink:0 }}/>
            </div>
          </Link>

          {/* Analyse complète */}
          <Link to="/dashboard/nouvelle-analyse?type=complete" style={{ textDecoration:'none' }}>
            <div style={{ background:'linear-gradient(145deg, #0f2d3d 0%, #1a5068 100%)', borderRadius:18, padding:'24px', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:16, position:'relative', overflow:'hidden' }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 10px 32px rgba(15,45,61,0.3)'; el.style.transform='translateY(-2px)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='none'; el.style.transform='translateY(0)'; }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
              <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <ShieldCheck size={24} style={{ color:'#fff' }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:15, fontWeight:800, color:'#fff' }}>Analyse complète</span>
                  <span style={{ fontSize:9, fontWeight:800, color:'#fff', background:'rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:100, letterSpacing:'0.05em' }}>⭐ RECOMMANDÉ</span>
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:8 }}>Multi-docs · Score /10 + recommandation</div>
                <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>19,90€</div>
              </div>
              <ArrowRight size={18} style={{ color:'rgba(255,255,255,0.4)', flexShrink:0 }}/>
            </div>
          </Link>
        </div>
      </div>

      {/* Analyses récentes */}
      <div style={{ animation:'fadeUp 0.5s ease both' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em' }}>Analyses récentes</h2>
          <Link to="/dashboard/analyses" style={{ fontSize:13, color:'#2a7d9c', textDecoration:'none', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
            Tout voir <ChevronRight size={14}/>
          </Link>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {mockAnalyses.map(a => <AnalyseRow key={a.id} a={a}/>)}
        </div>
      </div>
    </div>
  );
}

/* ─── ANALYSE ROW ────────────────────────── */
function AnalyseRow({ a }: { a:Analyse }) {
  const isComplete = a.type === 'complete';
  const sc = a.score ?? 0;
  const scoreColor = sc >= 7.5 ? '#16a34a' : sc >= 5 ? '#d97706' : '#dc2626';
  const typeLabel = isComplete ? 'Analyse Complète' : 'Analyse Document';

  return (
    <div style={{ background:'#fff', borderRadius:13, border:'1px solid #edf2f7', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', boxShadow:'0 1px 3px rgba(0,0,0,0.03)', transition:'all 0.18s' }}
      onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 18px rgba(42,125,156,0.08)'; el.style.transform='translateY(-1px)'; el.style.borderColor='#dbeafe'; }}
      onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 1px 3px rgba(0,0,0,0.03)'; el.style.transform='translateY(0)'; el.style.borderColor='#edf2f7'; }}>
      <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:a.status==='processing'?'rgba(42,125,156,0.07)':`${scoreColor}0d`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {a.status==='processing'
          ? <div style={{ width:17, height:17, borderRadius:'50%', border:'2.5px solid #2a7d9c', borderTopColor:'transparent', animation:'spin 0.85s linear infinite' }}/>
          : <Building2 size={17} style={{ color:scoreColor }}/>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
        <div style={{ fontSize:11, color:'#94a3b8', display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ background:'#f8fafc', border:'1px solid #edf2f7', borderRadius:5, padding:'1px 6px', fontWeight:600, color:'#64748b' }}>{typeLabel}</span>
          <span>·</span><span>{a.date}</span>
          <span>·</span><span style={{ fontWeight:700, color:'#64748b' }}>{a.price}</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, flexWrap:'wrap' }}>
        {a.status==='processing' ? (
          <span style={{ fontSize:11, fontWeight:700, color:'#2a7d9c', background:'rgba(42,125,156,0.07)', padding:'4px 10px', borderRadius:7 }}>En cours…</span>
        ) : (
          <>
            {isComplete && a.score != null && <ScoreBadge score={a.score}/>}
            {a.recommandation && (
              <span style={{ fontSize:11, fontWeight:700, color:a.recommandationColor, background:`${a.recommandationColor}10`, border:`1px solid ${a.recommandationColor}22`, padding:'4px 10px', borderRadius:7, whiteSpace:'nowrap' }}>{a.recommandation}</span>
            )}
            <button style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:8, background:'#f8fafc', border:'1px solid #edf2f7', fontSize:12, fontWeight:700, color:'#2a7d9c', cursor:'pointer', transition:'background 0.15s' }}
              onMouseOver={e=>(e.currentTarget.style.background='#e8f4f8')} onMouseOut={e=>(e.currentTarget.style.background='#f8fafc')}>
              <ExternalLink size={11}/> Rapport
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   NOUVELLE ANALYSE — avec API Claude
══════════════════════════════════════════ */
function NouvelleAnalyse() {
  const [step, setStep] = useState<'choice'|'upload'|'analyse'|'result'>('choice');
  const [type, setType] = useState<'document'|'complete'|null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<AnalyseResult|null>(null);
  const [error, setError] = useState('');

  const plans = {
    document: { label:"Analyse d'un document", price:'4,99€', max:1, desc:'Un seul fichier analysé en détail.' },
    complete: { label:"Analyse complète d'un logement", price:'19,90€', max:20, desc:'Tous les documents du bien analysés ensemble — score /10, risques, recommandation.' },
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
          { type:'text', text:'Extrais tout le texte de ce document immobilier de façon fidèle et structurée.' }
        ]}]
      })
    });
    const d = await res.json();
    return d.content?.find((b:any)=>b.type==='text')?.text || '';
  };

  const lancer = async () => {
    if (!files.length || !type) return;
    setStep('analyse'); setError(''); setProgress(5); setProgressMsg('Lecture des documents…');
    try {
      const textes: string[] = [];
      for (let i=0; i<files.length; i++) {
        setProgressMsg(`Extraction document ${i+1}/${files.length}…`);
        setProgress(10 + Math.floor((i/files.length)*30));
        textes.push(`=== ${files[i].name} ===\n${await extractText(files[i])}`);
      }
      setProgress(50); setProgressMsg('Analyse IA en cours…');
      const isComplete = type === 'complete';
      const systemPrompt = isComplete
        ? `Tu es Analymo, expert en analyse de documents immobiliers français. Réponds UNIQUEMENT en JSON valide :
{"titre":"nom du bien détecté","score":7.5,"recommandation":"Acheter"|"Négocier"|"Risqué"|"Déconseillé","resume":"2-3 phrases","points_forts":["..."],"points_vigilance":["..."],"risques_financiers":"estimation","conclusion":"avis final 2-3 phrases"}`
        : `Tu es Analymo, expert en analyse de documents immobiliers français. Réponds UNIQUEMENT en JSON valide :
{"titre":"type et nom du document","resume":"2-3 phrases","points_forts":["..."],"points_vigilance":["..."],"conclusion":"synthèse"}`;
      setProgress(70); setProgressMsg('Génération du rapport…');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1000,
          system:systemPrompt,
          messages:[{ role:'user', content:`Documents à analyser :\n\n${textes.join('\n\n').slice(0,8000)}` }]
        })
      });
      setProgress(90); setProgressMsg('Finalisation…');
      const d = await res.json();
      const raw = d.content?.find((b:any)=>b.type==='text')?.text || '{}';
      const parsed: AnalyseResult = JSON.parse(raw.replace(/```json|```/g,'').trim());
      setProgress(100); setProgressMsg('Rapport prêt !');
      await new Promise(r=>setTimeout(r,500));
      setResult(parsed); setStep('result');
    } catch {
      setError("Erreur lors de l'analyse. Vérifiez vos fichiers et réessayez.");
      setStep('upload');
    }
  };

  /* CHOICE */
  if (step==='choice') return (
    <div style={{ maxWidth:760, margin:'0 auto' }}>
      <Link to="/dashboard" style={{ fontSize:13, color:'#94a3b8', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginBottom:24, fontWeight:600 }}><ChevronLeft size={14}/> Retour</Link>
      <h1 style={{ fontSize:'clamp(22px,3vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:6 }}>Que souhaitez-vous analyser ?</h1>
      <p style={{ fontSize:14, color:'#64748b', marginBottom:32 }}>Choisissez le mode d'analyse adapté à votre besoin.</p>
      <div className="type-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <button onClick={()=>{ setType('document'); setStep('upload'); }}
          style={{ padding:'28px 24px', borderRadius:20, border:'1.5px solid #edf2f7', background:'#fff', cursor:'pointer', textAlign:'left', transition:'all 0.18s', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#2a7d9c'; el.style.boxShadow='0 8px 28px rgba(42,125,156,0.1)'; el.style.transform='translateY(-2px)'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#edf2f7'; el.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; el.style.transform='translateY(0)'; }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(42,125,156,0.08)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}><FileText size={24} style={{ color:'#2a7d9c' }}/></div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Analyse d'un document</div>
          <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:20 }}>Un seul fichier — PV d'AG, règlement de copropriété, diagnostic ou appel de charges.</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#2a7d9c', display:'flex', alignItems:'center', gap:5 }}>Commencer <ArrowRight size={14}/></span>
            <span style={{ fontSize:22, fontWeight:900, color:'#0f172a' }}>4,99€</span>
          </div>
        </button>
        <button onClick={()=>{ setType('complete'); setStep('upload'); }}
          style={{ padding:'28px 24px', borderRadius:20, border:'1.5px solid transparent', background:'linear-gradient(145deg, #0f2d3d, #1a5068)', cursor:'pointer', textAlign:'left', transition:'all 0.18s', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(15,45,61,0.15)' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 12px 40px rgba(15,45,61,0.28)'; el.style.transform='translateY(-2px)'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 20px rgba(15,45,61,0.15)'; el.style.transform='translateY(0)'; }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:100, border:'1px solid rgba(255,255,255,0.2)' }}>RECOMMANDÉ ⭐</div>
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}><ShieldCheck size={24} style={{ color:'#fff' }}/></div>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:8 }}>Analyse complète d'un logement</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:20 }}>Tous les documents du bien — score /10, risques identifiés, recommandation Analymo.</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:5 }}>Commencer l'audit <ArrowRight size={14}/></span>
            <span style={{ fontSize:22, fontWeight:900, color:'#fff' }}>19,90€</span>
          </div>
        </button>
      </div>
      <div className="type-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[{l:'Pack 2 biens',p:'29,90€',s:'Comparaison côte à côte'},{l:'Pack 3 biens',p:'39,90€',s:'Classement + recommandation'}].map(p=>(
          <div key={p.l} style={{ background:'#fff', borderRadius:13, border:'1.5px solid #edf2f7', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'all 0.15s' }}
            onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(42,125,156,0.3)'; }}
            onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#edf2f7'; }}>
            <div><div style={{ fontSize:13.5, fontWeight:800, color:'#0f172a', marginBottom:2 }}>{p.l}</div><div style={{ fontSize:11, color:'#94a3b8' }}>{p.s}</div></div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontSize:15, fontWeight:900, color:'#0f172a' }}>{p.p}</span><ArrowRight size={13} style={{ color:'#2a7d9c' }}/></div>
          </div>
        ))}
      </div>
    </div>
  );

  /* UPLOAD */
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
          <AlertTriangle size={15} color="#dc2626" style={{ flexShrink:0 }}/>
          <span style={{ fontSize:13, color:'#dc2626' }}>{error}</span>
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
      <button onClick={lancer} disabled={files.length===0}
        style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:files.length>0?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#e2e8f0', color:files.length>0?'#fff':'#94a3b8', fontSize:15, fontWeight:800, cursor:files.length>0?'pointer':'default', boxShadow:files.length>0?'0 4px 18px rgba(15,45,61,0.2)':'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.15s' }}>
        <Sparkles size={16}/> Analyser {files.length>0?`(${files.length} fichier${files.length>1?'s':''})` :''}
      </button>
      <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:14, flexWrap:'wrap' }}>
        {[['🔒','SSL'],['🗑️','Suppression auto'],['⚡','< 2 min']].map(([i,t])=>
          <span key={t} style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:5 }}>{i} {t}</span>
        )}
      </div>
    </div>
  );

  /* LOADING */
  if (step==='analyse') return (
    <div style={{ maxWidth:480, margin:'80px auto 0', textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg, rgba(42,125,156,0.1), rgba(15,45,61,0.07))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', animation:'float 3s ease-in-out infinite' }}>
        <Sparkles size={32} style={{ color:'#2a7d9c' }}/>
      </div>
      <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Analyse en cours…</h2>
      <p style={{ fontSize:14, color:'#64748b', marginBottom:32 }}>{progressMsg}</p>
      <div style={{ height:8, borderRadius:99, background:'#edf2f7', overflow:'hidden', marginBottom:8 }}>
        <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg, #2a7d9c, #0f2d3d)', width:`${progress}%`, transition:'width 0.4s ease' }}/>
      </div>
      <div style={{ fontSize:13, color:'#94a3b8', fontWeight:600 }}>{progress}%</div>
    </div>
  );

  /* RESULT */
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
            <h1 style={{ fontSize:'clamp(18px,2.5vw,24px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em' }}>{result.titre}</h1>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={()=>{ setStep('choice'); setType(null); setFiles([]); setResult(null); }}
              style={{ padding:'9px 18px', borderRadius:10, border:'1.5px solid #edf2f7', background:'#fff', fontSize:13, fontWeight:700, color:'#64748b', cursor:'pointer' }}>
              Nouvelle analyse
            </button>
            <button style={{ padding:'9px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <Download size={13}/> PDF
            </button>
          </div>
        </div>
        {isComplete && result.score != null && (
          <div className="result-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'24px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:12 }}>SCORE GLOBAL</div>
              <div style={{ fontSize:56, fontWeight:900, color:scoreColor, letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{result.score.toFixed(1)}</div>
              <div style={{ fontSize:14, color:'#94a3b8' }}>/ 10</div>
            </div>
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'24px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:12 }}>RECOMMANDATION</div>
              <div style={{ display:'inline-block', padding:'8px 24px', borderRadius:12, background:`${recColor}10`, border:`2px solid ${recColor}25`, fontSize:22, fontWeight:900, color:recColor, marginBottom:8 }}>{result.recommandation}</div>
              {result.risques_financiers && <div style={{ fontSize:12, color:'#94a3b8', marginTop:8 }}>{result.risques_financiers}</div>}
            </div>
          </div>
        )}
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'20px 22px', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:10 }}>RÉSUMÉ</div>
          <p style={{ fontSize:14, color:'#374151', lineHeight:1.75 }}>{result.resume}</p>
        </div>
        <div className="result-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div style={{ background:'#f0fdf4', borderRadius:16, border:'1px solid #d1fae5', padding:'18px 20px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#16a34a', letterSpacing:'0.1em', marginBottom:12 }}>✓ POINTS FORTS</div>
            {result.points_forts.map((p,i)=>(
              <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                <CheckCircle size={13} color="#16a34a" style={{ flexShrink:0, marginTop:2 }}/>
                <span style={{ fontSize:13, color:'#166534', lineHeight:1.5 }}>{p}</span>
              </div>
            ))}
          </div>
          <div style={{ background:'#fffbeb', borderRadius:16, border:'1px solid #fde68a', padding:'18px 20px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#d97706', letterSpacing:'0.1em', marginBottom:12 }}>⚠ VIGILANCE</div>
            {result.points_vigilance.map((p,i)=>(
              <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                <AlertTriangle size={13} color="#d97706" style={{ flexShrink:0, marginTop:2 }}/>
                <span style={{ fontSize:13, color:'#92400e', lineHeight:1.5 }}>{p}</span>
              </div>
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
  return null;
}

/* ══════════════════════════════════════════
   MES ANALYSES
══════════════════════════════════════════ */
function MesAnalyses() {
  const [search, setSearch] = useState('');
  const filtered = mockAnalyses.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>Mes analyses</h1>
          <p style={{ fontSize:13, color:'#94a3b8' }}>{mockAnalyses.length} analyse{mockAnalyses.length>1?'s':''}</p>
        </div>
        <Link to="/dashboard/nouvelle-analyse" style={{ padding:'10px 20px', borderRadius:10, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={14}/> Nouvelle
        </Link>
      </div>
      <div style={{ position:'relative' }}>
        <Search size={14} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un bien…"
          style={{ width:'100%', padding:'11px 14px 11px 38px', borderRadius:11, border:'1.5px solid #edf2f7', fontSize:14, background:'#fff', outline:'none', boxSizing:'border-box' as const, color:'#0f172a' }}/>
      </div>
      {filtered.length>0
        ? <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{filtered.map(a=><AnalyseRow key={a.id} a={a}/>)}</div>
        : <div style={{ background:'#fff', borderRadius:14, border:'2px dashed #e2e8f0', padding:'48px 24px', textAlign:'center' }}><FileText size={30} style={{ color:'#e2e8f0', margin:'0 auto 12px', display:'block' }}/><div style={{ fontSize:14, fontWeight:700, color:'#94a3b8' }}>Aucune analyse trouvée</div></div>}
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPARE
══════════════════════════════════════════ */
function Compare() {
  const b1 = { title:'Appartement rue de la Paix, Paris 2e', score:8.2, recommandation:'Acheter', color:'#16a34a', scores:{Financier:85,Travaux:70,Juridique:91,Charges:80}, positifs:['Fonds de travaux bien provisionné','Charges raisonnables (180€/mois)'], risques:['Ravalement prévu en 2026 (~8 000€)','Quelques impayés en copropriété'] };
  const b2 = { title:'Studio Cours Mirabeau, Aix-en-Provence', score:6.7, recommandation:'Négocier', color:'#d97706', scores:{Financier:55,Travaux:60,Juridique:78,Charges:75}, positifs:['Emplacement premium','Bon DPE (classe C)'], risques:['Trésorerie faible du syndicat','Toiture à rénover sous 3 ans'] };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div><h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>Comparer mes biens</h1><p style={{ fontSize:13, color:'#94a3b8' }}>Analyse comparative côte à côte.</p></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:16 }}>
        {[b1,b2].map((b,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:16, border:`1.5px solid ${b.color}20`, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.12em', marginBottom:8 }}>BIEN {i+1}</div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:16, lineHeight:1.4 }}>{b.title}</h3>
            <div style={{ display:'flex', alignItems:'flex-end', gap:10, marginBottom:20 }}>
              <div style={{ fontSize:50, fontWeight:900, color:b.color, lineHeight:1, letterSpacing:'-0.03em' }}>{b.score}</div>
              <div style={{ paddingBottom:4 }}><div style={{ fontSize:13, color:'#94a3b8' }}>/10</div><span style={{ display:'inline-block', padding:'3px 10px', borderRadius:7, background:`${b.color}10`, color:b.color, fontSize:12, fontWeight:700, marginTop:4 }}>{b.recommandation}</span></div>
            </div>
            {Object.entries(b.scores).map(([cat,val])=>(
              <div key={cat} style={{ marginBottom:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ fontSize:12, color:'#94a3b8' }}>{cat}</span><span style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{val}</span></div>
                <div style={{ height:5, borderRadius:3, background:'#f1f5f9' }}><div style={{ width:`${val}%`, height:'100%', borderRadius:3, background:val>=75?'#16a34a':val>=55?'#d97706':'#dc2626' }}/></div>
              </div>
            ))}
            <div style={{ marginTop:18, padding:'12px', borderRadius:10, background:'#f0fdf4', marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#16a34a', marginBottom:7 }}>✓ POINTS FORTS</div>
              {b.positifs.map(p=><div key={p} style={{ fontSize:12, color:'#166534', marginBottom:4, paddingLeft:8 }}>· {p}</div>)}
            </div>
            <div style={{ padding:'12px', borderRadius:10, background:'#fffbeb' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#d97706', marginBottom:7 }}>⚠ VIGILANCE</div>
              {b.risques.map(r=><div key={r} style={{ fontSize:12, color:'#92400e', marginBottom:4, paddingLeft:8 }}>· {r}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'20px 22px', borderRadius:14, background:'#fff', border:'1px solid #edf2f7', display:'flex', gap:12, alignItems:'flex-start', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <Shield size={18} color="#2a7d9c" style={{ flexShrink:0, marginTop:2 }}/>
        <div><div style={{ fontSize:10, fontWeight:800, color:'#2a7d9c', letterSpacing:'0.12em', marginBottom:5 }}>VERDICT ANALYMO</div><p style={{ fontSize:14, color:'#0f172a', fontWeight:600, lineHeight:1.6 }}>Le <strong>Bien 1</strong> (score 8,2/10) est recommandé. Anticipez le ravalement 2026 dans votre négociation.</p></div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPTE
══════════════════════════════════════════ */
function Compte() {
  const [user, setUser] = useState({name:'',email:''});
  const [saved, setSaved] = useState(false);
  useEffect(()=>{ supabase.auth.getUser().then(({data:{user:u}})=>{ if(u) setUser({name:u.user_metadata?.full_name||'',email:u.email||''}); }); },[]);
  const save = async ()=>{ await supabase.auth.updateUser({data:{full_name:user.name}}); setSaved(true); setTimeout(()=>setSaved(false),3000); };
  return (
    <div style={{ maxWidth:580 }}>
      <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:24 }}>Mon compte</h1>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #edf2f7', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:18, paddingBottom:13, borderBottom:'1px solid #f0f5f9' }}>Informations personnelles</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
          {[{l:'Nom complet',v:user.name,set:(v:string)=>setUser({...user,name:v}),ph:'Jean Dupont'},{l:'Email',v:user.email,set:(_:string)=>{},ph:'',disabled:true}].map(f=>(
            <div key={f.l}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:7 }}>{f.l}</label>
              <input value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} disabled={f.disabled}
                style={{ width:'100%', padding:'11px 13px', borderRadius:9, border:'1.5px solid #edf2f7', fontSize:14, background:f.disabled?'#f8fafc':'#fff', color:f.disabled?'#94a3b8':'#0f172a', outline:'none', boxSizing:'border-box' as const }}/>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
            <button onClick={save} style={{ padding:'10px 22px', borderRadius:9, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Enregistrer</button>
            {saved && <span style={{ fontSize:13, color:'#16a34a', fontWeight:700 }}>✓ Enregistré</span>}
          </div>
        </div>
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
    {q:"Analymo remplace-t-il un notaire ?",a:"Non. Analymo est un outil d'aide à la décision, pas un conseil juridique professionnel."},
  ];
  const [open, setOpen] = useState<number|null>(null);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  return (
    <div style={{ maxWidth:660 }}>
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

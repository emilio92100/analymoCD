import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, Search, Send, Bell,
  ChevronRight, Building2, ExternalLink, ChevronLeft,
  Shield, BarChart2, Zap, Clock, Upload, CheckCircle,
  ShieldCheck, TrendingUp, ArrowRight, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ─── TYPES ───────────────────────────────────────────────── */
type Analyse = {
  id: string; title: string;
  type: 'document' | 'complete' | 'pack2' | 'pack3';
  status: 'completed' | 'processing';
  score?: number; recommandation?: string; recommandationColor?: string;
  date: string; price: string;
};

/* ─── MOCK DATA ───────────────────────────────────────────── */
const mockAnalyses: Analyse[] = [
  { id:'1', title:'Appartement rue de la Paix, Paris 2e', type:'complete', status:'completed', score:8.2, recommandation:'Acheter', recommandationColor:'#16a34a', date:'24 mars 2026', price:'19,90€' },
  { id:'2', title:'Studio Cours Mirabeau, Aix-en-Provence', type:'document', status:'completed', date:'19 mars 2026', price:'4,99€' },
  { id:'3', title:'T3 Quai de Saône, Lyon 2e', type:'complete', status:'processing', date:'26 mars 2026', price:'29,90€' },
];

/* ─── NAV ─────────────────────────────────────────────────── */
const navMain = [
  { to:'/dashboard',                  icon:LayoutDashboard, label:'Tableau de bord' },
  { to:'/dashboard/analyses',         icon:FileText,        label:'Mes analyses' },
  { to:'/dashboard/compare',          icon:GitCompare,      label:'Comparaisons' },
];
const navBottom = [
  { to:'/dashboard/compte',   icon:User,      label:'Mon compte' },
  { to:'/dashboard/support',  icon:LifeBuoy,  label:'Support' },
];

/* ─── HOOKS ───────────────────────────────────────────────── */
function useUserName() {
  const [name, setName] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setName(user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur');
    });
  }, []);
  return name;
}

/* ─── SCORE CHIP ──────────────────────────────────────────── */
function ScoreChip({ score }: { score: number }) {
  const color  = score >= 7.5 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626';
  const bg     = score >= 7.5 ? '#f0fdf4' : score >= 5 ? '#fffbeb' : '#fef2f2';
  const border = score >= 7.5 ? '#bbf7d0' : score >= 5 ? '#fde68a' : '#fecaca';
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', gap:2, padding:'5px 12px', borderRadius:10, background:bg, border:`1.5px solid ${border}`, fontSize:16, fontWeight:900, color, letterSpacing:'-0.01em' }}>
      {score.toFixed(1)}<span style={{ fontSize:11, fontWeight:700, opacity:0.65 }}>/10</span>
    </span>
  );
}

/* ─── SIDEBAR ─────────────────────────────────────────────── */
function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = useUserName();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  return (
    <aside style={{ width:260, minHeight:'100vh', height:'100%', background:'#0f2d3d', display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
      {/* Logo */}
      <div style={{ height:72, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
        <Link to="/" onClick={onClose}>
          <img src="/logo.png" alt="Analymo" style={{ height:30, objectFit:'contain', filter:'brightness(0) invert(1)' }} />
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:6 }}><X size={18}/></button>
        )}
      </div>

      {/* New analyse CTA */}
      <div style={{ padding:'20px 16px 8px' }}>
        <Link to="/dashboard/nouvelle-analyse" onClick={onClose} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px 16px', borderRadius:12, background:'linear-gradient(135deg, #2a7d9c, #1a5e78)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:700, boxShadow:'0 4px 16px rgba(42,125,156,0.35)', transition:'opacity 0.15s' }}
          onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.9'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>
          <Plus size={16}/> Nouvelle analyse
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 12px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', letterSpacing:'0.14em', padding:'12px 8px 6px' }}>NAVIGATION</div>
        {navMain.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:isActive?700:500, color:isActive?'#fff':'rgba(255,255,255,0.5)', background:isActive?'rgba(42,125,156,0.25)':'transparent', borderLeft:isActive?'3px solid #2a7d9c':'3px solid transparent', transition:'all 0.15s' }}
              onMouseOver={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.85)'; }}
              onMouseOut={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.5)'; }}>
              <Icon size={16} style={{ color:isActive?'#3a9cbf':'inherit', flexShrink:0 }}/>{item.label}
            </Link>
          );
        })}
        <div style={{ margin:'12px 0', borderTop:'1px solid rgba(255,255,255,0.07)' }}/>
        {navBottom.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:500, color:isActive?'#fff':'rgba(255,255,255,0.42)', background:isActive?'rgba(42,125,156,0.18)':'transparent', transition:'color 0.15s' }}
              onMouseOver={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.75)'; }}
              onMouseOut={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.42)'; }}>
              <Icon size={15} style={{ flexShrink:0 }}/>{item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding:'12px 16px 16px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.05)' }}>
          <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg, #2a7d9c, #1a5e78)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#fff' }}>
            {(userName.charAt(0)||'U').toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userName||'…'}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Mon espace</div>
          </div>
          <button onClick={handleLogout} title="Se déconnecter"
            style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:4, transition:'color 0.15s' }}
            onMouseOver={e=>(e.currentTarget.style.color='#ef4444')} onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.3)')}>
            <LogOut size={14}/>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ─── TOPBAR ──────────────────────────────────────────────── */
function Topbar({ onMenuClick, breadcrumb }: { onMenuClick:()=>void; breadcrumb:string }) {
  return (
    <header style={{ height:72, background:'#fff', borderBottom:'1px solid #e8eef2', display:'flex', alignItems:'center', padding:'0 28px', gap:12, position:'sticky', top:0, zIndex:40, flexShrink:0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background:'none', border:'none', cursor:'pointer', color:'#0f2d3d', padding:4, display:'none' }}><Menu size={20}/></button>
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>Analymo</span>
        <ChevronRight size={12} style={{ color:'#cbd5e1' }}/>
        <span style={{ fontSize:13, fontWeight:700, color:'#0f2d3d' }}>{breadcrumb}</span>
      </div>
      <button style={{ width:38, height:38, borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><Bell size={15}/></button>
      <Link to="/dashboard/nouvelle-analyse"
        style={{ padding:'9px 20px', borderRadius:10, background:'linear-gradient(135deg, #2a7d9c 0%, #0f2d3d 100%)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', boxShadow:'0 2px 10px rgba(15,45,61,0.22)' }}>
        <Plus size={14}/> Nouvelle analyse
      </Link>
    </header>
  );
}

/* ─── ROOT LAYOUT ─────────────────────────────────────────── */
export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/connexion');
    });
  }, [navigate]);

  const allItems = [...navMain, ...navBottom];
  const currentLabel = allItems.find(i => i.to === location.pathname)?.label || 'Mon espace';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f4f7f9', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ width:260, flexShrink:0 }}>
        <div style={{ position:'fixed', top:0, left:0, width:260, height:'100vh', zIndex:50, overflowY:'auto' }}>
          <Sidebar/>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'fixed', inset:0, zIndex:200 }}>
            <div onClick={()=>setMobileOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(10,25,35,0.6)', backdropFilter:'blur(4px)' }}/>
            <motion.div initial={{ x:-260 }} animate={{ x:0 }} exit={{ x:-260 }} transition={{ type:'spring', stiffness:300, damping:30 }}
              style={{ position:'absolute', left:0, top:0, bottom:0, width:260 }}>
              <Sidebar onClose={()=>setMobileOpen(false)}/>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Topbar onMenuClick={()=>setMobileOpen(true)} breadcrumb={currentLabel}/>
        <main style={{ flex:1, padding:'36px 28px', overflowX:'hidden' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <DashboardContent currentPath={location.pathname}/>
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .analyse-cards { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

function DashboardContent({ currentPath }: { currentPath:string }) {
  if (currentPath === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse/>;
  if (currentPath === '/dashboard/analyses')          return <MesAnalyses/>;
  if (currentPath === '/dashboard/compare')           return <Compare/>;
  if (currentPath === '/dashboard/compte')            return <Compte/>;
  if (currentPath === '/dashboard/support')           return <Support/>;
  return <DashboardHome/>;
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD HOME
═══════════════════════════════════════════════════════════ */
function DashboardHome() {
  const userName = useUserName();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const stats = [
    { label:'Analyses réalisées', value:'3',       icon:FileText,  color:'#2a7d9c', bg:'rgba(42,125,156,0.09)' },
    { label:'Score moyen',        value:'8,2/10',  icon:BarChart2, color:'#16a34a', bg:'rgba(22,163,74,0.09)',  sub:'↑ Bon niveau' },
    { label:'Dernière analyse',   value:'2 j',     icon:Clock,     color:'#d97706', bg:'rgba(217,119,6,0.09)'  },
    { label:'Économies estimées', value:'~8 000€', icon:Zap,       color:'#0f2d3d', bg:'rgba(15,45,61,0.07)'   },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:32 }}>

      {/* ── Greeting */}
      <div style={{ animation:'fadeUp 0.4s ease both' }}>
        <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>
          {greeting}{userName ? `, ${userName}` : ''} 👋
        </h1>
        <p style={{ fontSize:15, color:'#64748b', fontWeight:500 }}>Bienvenue sur votre tableau de bord Analymo.</p>
      </div>

      {/* ── Stats */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, animation:'fadeUp 0.45s ease both' }}>
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eef2', padding:'22px 20px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ width:42, height:42, borderRadius:12, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <Icon size={19} style={{ color:s.color }}/>
              </div>
              <div style={{ fontSize:26, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em', lineHeight:1, marginBottom:2 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize:11, color:'#16a34a', fontWeight:700, marginBottom:3 }}>{s.sub}</div>}
              <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600, marginTop:4 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Analyse CTA cards (like the screenshot) */}
      <div style={{ animation:'fadeUp 0.5s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', letterSpacing:'-0.015em' }}>Que souhaitez-vous analyser ?</h2>
          <span style={{ fontSize:13, color:'#94a3b8', fontWeight:500 }}>Choisissez le mode adapté à votre besoin</span>
        </div>
        <div className="analyse-cards" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* Analyse simple */}
          <Link to="/dashboard/nouvelle-analyse" style={{ textDecoration:'none' }}>
            <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e8eef2', padding:'32px 28px', cursor:'pointer', transition:'all 0.2s ease', position:'relative', overflow:'hidden' }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#2a7d9c'; el.style.boxShadow='0 8px 32px rgba(42,125,156,0.12)'; el.style.transform='translateY(-2px)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#e8eef2'; el.style.boxShadow='none'; el.style.transform='translateY(0)'; }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'rgba(42,125,156,0.09)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                <FileText size={24} style={{ color:'#2a7d9c' }}/>
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:10, letterSpacing:'-0.015em' }}>Analyse d'un document</div>
              <div style={{ fontSize:14, color:'#64748b', lineHeight:1.6, marginBottom:24 }}>Idéal pour comprendre rapidement un document précis et lever un doute.</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:22, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em' }}>4,99€</span>
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:700, color:'#2a7d9c' }}>
                  Commencer <ArrowRight size={15}/>
                </span>
              </div>
            </div>
          </Link>

          {/* Analyse complète — Recommandée */}
          <Link to="/dashboard/nouvelle-analyse" style={{ textDecoration:'none' }}>
            <div style={{ background:'linear-gradient(135deg, #0f2d3d 0%, #1a4f6e 100%)', borderRadius:20, border:'1.5px solid transparent', padding:'32px 28px', cursor:'pointer', transition:'all 0.2s ease', position:'relative', overflow:'hidden' }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 12px 40px rgba(15,45,61,0.3)'; el.style.transform='translateY(-2px)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='none'; el.style.transform='translateY(0)'; }}>
              {/* Recommended badge */}
              <div style={{ position:'absolute', top:20, right:20, background:'#2a7d9c', color:'#fff', fontSize:11, fontWeight:800, padding:'4px 12px', borderRadius:100, letterSpacing:'0.04em' }}>
                RECOMMANDÉ ⭐
              </div>
              {/* Decorative glow */}
              <div style={{ position:'absolute', bottom:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(42,125,156,0.15)', pointerEvents:'none' }}/>
              <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                <ShieldCheck size={24} style={{ color:'#fff' }}/>
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:10, letterSpacing:'-0.015em' }}>Analyse complète d'un bien</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:1.6, marginBottom:24 }}>Analyse croisée de tous les documents du bien pour une décision éclairée.</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>19,90€</span>
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>
                  Commencer l'audit <ArrowRight size={15}/>
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Pack multi-biens — smaller row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:12 }}>
          {[
            { label:'Pack 2 biens', desc:'Comparaison côte à côte', price:'29,90€', to:'/dashboard/nouvelle-analyse' },
            { label:'Pack 3 biens', desc:'Classement + recommandation finale', price:'39,90€', to:'/dashboard/nouvelle-analyse' },
          ].map(p => (
            <Link key={p.label} to={p.to} style={{ textDecoration:'none' }}>
              <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #e8eef2', padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'all 0.2s' }}
                onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#2a7d9c50'; el.style.boxShadow='0 4px 16px rgba(42,125,156,0.08)'; }}
                onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#e8eef2'; el.style.boxShadow='none'; }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:2 }}>{p.label}</div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>{p.desc}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:16, fontWeight:900, color:'#0f172a' }}>{p.price}</span>
                  <ArrowRight size={14} style={{ color:'#2a7d9c' }}/>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent analyses */}
      <div style={{ animation:'fadeUp 0.55s ease both' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', letterSpacing:'-0.015em' }}>Vos analyses</h2>
          <Link to="/dashboard/analyses" style={{ fontSize:13, color:'#2a7d9c', textDecoration:'none', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
            Tout voir <ChevronRight size={14}/>
          </Link>
        </div>

        {mockAnalyses.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:16, border:'1.5px dashed #e2e8f0', padding:'56px 24px', textAlign:'center' }}>
            <FileText size={36} style={{ color:'#cbd5e1', margin:'0 auto 12px' }}/>
            <div style={{ fontSize:15, fontWeight:700, color:'#94a3b8', marginBottom:4 }}>Aucune analyse pour le moment</div>
            <div style={{ fontSize:13, color:'#cbd5e1' }}>Uploadez un document pour commencer</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {mockAnalyses.map(a => <AnalyseRow key={a.id} a={a}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ANALYSE ROW ─────────────────────────────────────────── */
function AnalyseRow({ a }: { a:Analyse }) {
  const isComplete = a.type !== 'document';
  const scoreColor = !a.score ? '#2a7d9c' : a.score >= 7.5 ? '#16a34a' : a.score >= 5 ? '#d97706' : '#dc2626';
  const typeLabel = a.type==='document'?'Analyse Document':a.type==='complete'?'Analyse Complète':a.type==='pack2'?'Pack 2 Biens':'Pack 3 Biens';

  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eef2', padding:'16px 22px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,0.03)', transition:'all 0.18s ease' }}
      onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 6px 24px rgba(42,125,156,0.1)'; el.style.transform='translateY(-1px)'; el.style.borderColor='#c8dde8'; }}
      onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 1px 4px rgba(0,0,0,0.03)'; el.style.transform='translateY(0)'; el.style.borderColor='#e8eef2'; }}>

      <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:a.status==='processing'?'rgba(42,125,156,0.08)':`${scoreColor}0f`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {a.status==='processing'
          ? <div style={{ width:18, height:18, borderRadius:'50%', border:'2.5px solid #2a7d9c', borderTopColor:'transparent', animation:'spin 0.9s linear infinite' }}/>
          : <Building2 size={19} style={{ color:scoreColor }}/>}
      </div>

      <div style={{ flex:1, minWidth:160 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
        <div style={{ fontSize:12, color:'#94a3b8', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600, color:'#64748b' }}>{typeLabel}</span>
          <span>·</span><span>{a.date}</span>
          <span>·</span><span style={{ fontWeight:700, color:'#64748b' }}>{a.price}</span>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, flexWrap:'wrap' }}>
        {a.status==='processing' ? (
          <span style={{ fontSize:12, fontWeight:700, color:'#2a7d9c', background:'rgba(42,125,156,0.08)', padding:'5px 12px', borderRadius:8 }}>En cours d'analyse…</span>
        ) : (
          <>
            {isComplete && a.score != null && <ScoreChip score={a.score}/>}
            {a.recommandation && (
              <span style={{ fontSize:12, fontWeight:700, color:a.recommandationColor, background:`${a.recommandationColor}12`, border:`1px solid ${a.recommandationColor}25`, padding:'5px 12px', borderRadius:8, whiteSpace:'nowrap' }}>{a.recommandation}</span>
            )}
            <button style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:9, background:'#f8fafc', border:'1px solid #e2e8f0', fontSize:12, fontWeight:700, color:'#2a7d9c', cursor:'pointer', transition:'background 0.15s' }}
              onMouseOver={e=>(e.currentTarget.style.background='#e8f4f8')} onMouseOut={e=>(e.currentTarget.style.background='#f8fafc')}>
              <ExternalLink size={12}/> Voir le rapport
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NOUVELLE ANALYSE
═══════════════════════════════════════════════════════════ */
function NouvelleAnalyse() {
  const [selectedType, setSelectedType] = useState<string|null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<'type'|'upload'|'confirm'>('type');
  const stepIdx = {type:0,upload:1,confirm:2}[step];

  const types = [
    { id:'document', icon:FileText,  label:"Analyse d'un document",      desc:"Un seul document analysé en détail.", price:'4,99€',  maxFiles:1,  color:'#2a7d9c' },
    { id:'complete', icon:ShieldCheck, label:"Analyse complète d'un bien", desc:"Tous les documents d'un bien ensemble.", price:'19,90€', maxFiles:10, popular:true, color:'#0f2d3d' },
    { id:'pack2',    icon:GitCompare, label:'Pack 2 biens',                desc:'Analyse complète + comparaison côte à côte.', price:'29,90€', maxFiles:20, color:'#1a5e78' },
    { id:'pack3',    icon:BarChart2,  label:'Pack 3 biens',                desc:'Analyse + classement et recommandation finale.', price:'39,90€', maxFiles:30, color:'#1a5e78' },
  ];

  const selectedPlan = types.find(t=>t.id===selectedType);
  const canNext = (step==='type'&&!!selectedType)||(step==='upload'&&files.length>0)||(step==='confirm');

  return (
    <div style={{ maxWidth:820, margin:'0 auto' }}>
      <Link to="/dashboard" style={{ fontSize:13, color:'#94a3b8', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginBottom:24, fontWeight:600 }}><ChevronLeft size={14}/> Retour</Link>

      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:6 }}>Que souhaitez-vous analyser ?</h1>
        <p style={{ fontSize:15, color:'#64748b' }}>Choisissez le mode d'analyse adapté à votre besoin.</p>
      </div>

      {/* Steps */}
      <div style={{ display:'flex', gap:0, marginBottom:36, background:'#fff', borderRadius:14, border:'1px solid #e8eef2', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        {['Type d\'analyse','Vos documents','Paiement'].map((l,i)=>(
          <div key={l} style={{ flex:1, padding:'16px 0', textAlign:'center', background:i===stepIdx?'#f4f7f9':'#fff', borderRight:i<2?'1px solid #e8eef2':'none' }}>
            <div style={{ width:26, height:26, borderRadius:'50%', margin:'0 auto 6px', background:i<stepIdx?'#2a7d9c':i===stepIdx?'#0f2d3d':'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:i<=stepIdx?'#fff':'#94a3b8' }}>
              {i<stepIdx?'✓':i+1}
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:i===stepIdx?'#0f172a':i<stepIdx?'#2a7d9c':'#94a3b8' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Step type */}
      {step==='type' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {types.map(type=>{
            const Icon = type.icon;
            const sel = selectedType===type.id;
            const isDark = type.id==='complete';
            return (
              <button key={type.id} onClick={()=>setSelectedType(type.id)}
                style={{ padding:'26px 24px', borderRadius:18, border:sel?`2px solid ${type.color}`:'1.5px solid #e8eef2', background:isDark&&sel?`linear-gradient(135deg, #0f2d3d, #1a4f6e)`:sel?'rgba(42,125,156,0.04)':'#fff', cursor:'pointer', textAlign:'left', position:'relative', transition:'all 0.18s ease', boxShadow:sel?`0 0 0 4px ${type.color}15`:type.popular?'0 4px 20px rgba(15,45,61,0.1)':'none' }}>
                {type.popular && (
                  <div style={{ position:'absolute', top:-11, right:16, padding:'3px 12px', borderRadius:100, background:'#2a7d9c', fontSize:10, fontWeight:800, color:'#fff', letterSpacing:'0.05em' }}>RECOMMANDÉ</div>
                )}
                {sel && <CheckCircle size={18} color={isDark?'rgba(255,255,255,0.8)':'#2a7d9c'} style={{ position:'absolute', top:16, right:16 }}/>}
                <div style={{ width:48, height:48, borderRadius:13, background:isDark&&sel?'rgba(255,255,255,0.12)':sel?`${type.color}12`:'#f4f7f9', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <Icon size={22} style={{ color:isDark&&sel?'#fff':sel?type.color:'#64748b' }}/>
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:isDark&&sel?'#fff':'#0f172a', marginBottom:8, letterSpacing:'-0.01em' }}>{type.label}</div>
                <div style={{ fontSize:13, color:isDark&&sel?'rgba(255,255,255,0.6)':'#64748b', marginBottom:18, lineHeight:1.55 }}>{type.desc}</div>
                <div style={{ fontSize:22, fontWeight:900, color:isDark&&sel?'#fff':type.color, letterSpacing:'-0.02em' }}>{type.price}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step upload */}
      {step==='upload' && selectedPlan && (
        <div>
          <div style={{ padding:'14px 20px', borderRadius:12, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#0f172a', flex:1 }}>{selectedPlan.label}</span>
            <span style={{ fontSize:15, fontWeight:900, color:'#2a7d9c' }}>{selectedPlan.price}</span>
            <button onClick={()=>setStep('type')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#94a3b8', fontWeight:600 }}>Changer</button>
          </div>
          <div onClick={()=>document.getElementById('file-input')?.click()}
            style={{ padding:'56px 32px', borderRadius:18, border:'2px dashed #cbd5e1', background:'#fafcfd', textAlign:'center', cursor:'pointer', marginBottom:16, transition:'all 0.18s' }}
            onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#2a7d9c'; el.style.background='rgba(42,125,156,0.02)'; }}
            onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#cbd5e1'; el.style.background='#fafcfd'; }}>
            <input id="file-input" type="file" multiple={selectedPlan.maxFiles>1} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display:'none' }}
              onChange={e=>{ if(e.target.files) setFiles(prev=>[...prev,...Array.from(e.target.files!)].slice(0,selectedPlan.maxFiles)); }}/>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(42,125,156,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Upload size={24} style={{ color:'#2a7d9c' }}/>
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:6 }}>Déposez vos documents ici</div>
            <div style={{ fontSize:14, color:'#94a3b8' }}>ou <span style={{ color:'#2a7d9c', fontWeight:700 }}>cliquez pour sélectionner</span></div>
            <div style={{ fontSize:12, color:'#cbd5e1', marginTop:8 }}>PDF, Word, JPG · Max {selectedPlan.maxFiles} fichier{selectedPlan.maxFiles>1?'s':''}</div>
          </div>
          {files.map((f,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderRadius:10, background:'#fff', border:'1px solid #e8eef2', marginBottom:8 }}>
              <FileText size={16} color="#2a7d9c"/>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
              <CheckCircle size={14} color="#16a34a"/>
              <button onClick={()=>setFiles(prev=>prev.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18, lineHeight:1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Step confirm */}
      {step==='confirm' && selectedPlan && (
        <div>
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eef2', padding:'28px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:20 }}>Récapitulatif</h3>
            {[{l:"Type d'analyse",v:selectedPlan.label},{l:'Documents',v:`${files.length} fichier${files.length>1?'s':''}`},{l:'Total',v:selectedPlan.price,bold:true}].map(row=>(
              <div key={row.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>{row.l}</span>
                <span style={{ fontSize:row.bold?22:14, fontWeight:row.bold?900:700, color:row.bold?'#2a7d9c':'#0f172a', letterSpacing:row.bold?'-0.02em':0 }}>{row.v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding:'14px 20px', borderRadius:12, background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', gap:10, alignItems:'center' }}>
            <Zap size={16} color="#16a34a"/>
            <span style={{ fontSize:13, color:'#15803d', fontWeight:600 }}>Rapport disponible en moins de 2 minutes après paiement</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:32, gap:12 }}>
        {step!=='type' && (
          <button onClick={()=>setStep(step==='confirm'?'upload':'type')}
            style={{ padding:'13px 24px', borderRadius:11, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:14, fontWeight:700, color:'#0f172a', cursor:'pointer' }}>
            ← Retour
          </button>
        )}
        <button onClick={()=>{ if(step==='type'&&selectedType)setStep('upload'); else if(step==='upload'&&files.length>0)setStep('confirm'); else if(step==='confirm')alert('Redirection vers Stripe…'); }}
          disabled={!canNext}
          style={{ marginLeft:'auto', padding:'13px 32px', borderRadius:11, border:'none', background:canNext?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#e2e8f0', color:canNext?'#fff':'#94a3b8', fontSize:14, fontWeight:800, cursor:canNext?'pointer':'default', boxShadow:canNext?'0 4px 18px rgba(15,45,61,0.18)':'none', transition:'all 0.15s' }}>
          {step==='type'?'Continuer →':step==='upload'?'Vérifier →':'💳 Payer et analyser'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MES ANALYSES
═══════════════════════════════════════════════════════════ */
function MesAnalyses() {
  const [search, setSearch] = useState('');
  const filtered = mockAnalyses.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 style={{ fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>Mes analyses</h1>
          <p style={{ fontSize:13, color:'#94a3b8', fontWeight:500 }}>{mockAnalyses.length} analyse{mockAnalyses.length>1?'s':''}</p>
        </div>
        <Link to="/dashboard/nouvelle-analyse" style={{ padding:'10px 22px', borderRadius:10, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={14}/> Nouvelle analyse
        </Link>
      </div>
      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un bien…"
          style={{ width:'100%', padding:'12px 14px 12px 40px', borderRadius:11, border:'1.5px solid #e2e8f0', fontSize:14, background:'#fff', outline:'none', boxSizing:'border-box' as const, color:'#0f172a' }}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length>0
          ? filtered.map(a=><AnalyseRow key={a.id} a={a}/>)
          : <div style={{ textAlign:'center', padding:'56px 24px', color:'#94a3b8', fontSize:14 }}>Aucune analyse trouvée.</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPARE
═══════════════════════════════════════════════════════════ */
function Compare() {
  const b1 = { title:'Appartement rue de la Paix, Paris 2e', score:8.2, recommandation:'Acheter', color:'#16a34a', scores:{Financier:85,Travaux:70,Juridique:91,Charges:80}, positifs:['Fonds de travaux bien provisionné','Charges raisonnables (180€/mois)'], risques:['Ravalement prévu en 2026 (~8 000€)','Quelques impayés en copropriété'] };
  const b2 = { title:'Studio Cours Mirabeau, Aix-en-Provence', score:6.7, recommandation:'Négocier', color:'#d97706', scores:{Financier:55,Travaux:60,Juridique:78,Charges:75}, positifs:['Emplacement premium','Bon DPE (classe C)'], risques:['Trésorerie du syndicat faible','Toiture à rénover sous 3 ans'] };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 style={{ fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>Comparaison de biens</h1>
        <p style={{ fontSize:14, color:'#94a3b8', fontWeight:500 }}>Deux biens analysés côte à côte.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
        {[b1,b2].map((b,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:16, border:`1.5px solid ${b.color}25`, padding:'26px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:8 }}>BIEN {i+1}</div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:18, lineHeight:1.4 }}>{b.title}</h3>
            <div style={{ display:'flex', alignItems:'flex-end', gap:10, marginBottom:22 }}>
              <div style={{ fontSize:52, fontWeight:900, color:b.color, lineHeight:1, letterSpacing:'-0.03em' }}>{b.score}</div>
              <div style={{ paddingBottom:4 }}>
                <div style={{ fontSize:14, color:'#94a3b8' }}>/10</div>
                <span style={{ display:'inline-block', padding:'3px 11px', borderRadius:7, background:`${b.color}10`, color:b.color, fontSize:12, fontWeight:700, marginTop:4 }}>{b.recommandation}</span>
              </div>
            </div>
            {Object.entries(b.scores).map(([cat,val])=>(
              <div key={cat} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{cat}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{val}</span>
                </div>
                <div style={{ height:5, borderRadius:3, background:'#f1f5f9' }}>
                  <div style={{ width:`${val}%`, height:'100%', borderRadius:3, background:val>=75?'#16a34a':val>=55?'#d97706':'#dc2626', transition:'width 0.5s ease' }}/>
                </div>
              </div>
            ))}
            <div style={{ marginTop:20, padding:'14px', borderRadius:11, background:'#f8fffe', border:'1px solid #d1fae5', marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', marginBottom:8 }}>✓ Points forts</div>
              {b.positifs.map(p=><div key={p} style={{ fontSize:12, color:'#374151', marginBottom:5, paddingLeft:8 }}>· {p}</div>)}
            </div>
            <div style={{ padding:'14px', borderRadius:11, background:'#fffbf0', border:'1px solid #fde68a' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#d97706', marginBottom:8 }}>⚠ Points de vigilance</div>
              {b.risques.map(r=><div key={r} style={{ fontSize:12, color:'#374151', marginBottom:5, paddingLeft:8 }}>· {r}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'22px 26px', borderRadius:14, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', gap:14, alignItems:'flex-start' }}>
        <Shield size={20} color="#2a7d9c" style={{ flexShrink:0, marginTop:2 }}/>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:'#2a7d9c', letterSpacing:'0.1em', marginBottom:6 }}>VERDICT ANALYMO</div>
          <p style={{ fontSize:14, color:'#0f172a', fontWeight:600, lineHeight:1.65 }}>Le <strong>Bien 1</strong> (score 8,2/10) est recommandé. Anticipez le ravalement 2026 dans votre négociation pour optimiser votre acquisition.</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPTE
═══════════════════════════════════════════════════════════ */
function Compte() {
  const [user, setUser] = useState({name:'',email:''});
  const [saved, setSaved] = useState(false);
  useEffect(()=>{ supabase.auth.getUser().then(({data:{user:u}})=>{ if(u) setUser({name:u.user_metadata?.full_name||'',email:u.email||''}); }); },[]);
  const handleSave = async ()=>{ await supabase.auth.updateUser({data:{full_name:user.name}}); setSaved(true); setTimeout(()=>setSaved(false),3000); };
  return (
    <div style={{ maxWidth:620 }}>
      <h1 style={{ fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:28 }}>Mon compte</h1>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eef2', padding:'28px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:20, paddingBottom:14, borderBottom:'1px solid #f1f5f9' }}>Informations personnelles</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[{l:'Nom complet',v:user.name,set:(v:string)=>setUser({...user,name:v}),ph:'Jean Dupont'},{l:'Email',v:user.email,set:(_:string)=>{},ph:'',disabled:true}].map(f=>(
            <div key={f.l}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:8 }}>{f.l}</label>
              <input value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} disabled={f.disabled}
                style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, background:f.disabled?'#f8fafc':'#fff', color:f.disabled?'#94a3b8':'#0f172a', outline:'none', boxSizing:'border-box' as const }}/>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:4 }}>
            <button onClick={handleSave} style={{ padding:'11px 24px', borderRadius:10, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Enregistrer</button>
            {saved && <span style={{ fontSize:13, color:'#16a34a', fontWeight:700 }}>✓ Modifications enregistrées</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUPPORT
═══════════════════════════════════════════════════════════ */
function Support() {
  const faqs = [
    {q:"Quels types de documents Analymo peut-il analyser ?",a:"Analymo est spécialisé dans les documents immobiliers : PV d'AG, règlements de copropriété, appels de charges, diagnostics. Formats : PDF, Word, images."},
    {q:"Combien de temps prend une analyse ?",a:"La plupart des analyses sont prêtes en moins de 2 minutes. Vous recevez un email dès que votre rapport est disponible."},
    {q:"Mes documents sont-ils sécurisés ?",a:"Vos documents sont chiffrés lors du transfert (SSL/TLS). Nous ne partageons jamais vos données. Les fichiers sont supprimés après l'analyse."},
    {q:"Analymo remplace-t-il un notaire ?",a:"Non. Analymo est un outil d'aide à la décision. Il ne remplace pas les conseils d'un notaire ou d'un expert juridique."},
  ];
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  return (
    <div style={{ maxWidth:700 }}>
      <h1 style={{ fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:28 }}>Support</h1>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:14 }}>Questions fréquentes</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {faqs.map((faq,i)=>(
            <div key={i} style={{ borderRadius:12, border:'1px solid #e8eef2', overflow:'hidden', background:'#fff' }}>
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{ width:'100%', padding:'17px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{faq.q}</span>
                <ChevronDown size={16} color="#2a7d9c" style={{ flexShrink:0, transform:openFaq===i?'rotate(180deg)':'rotate(0)', transition:'transform 0.2s' }}/>
              </button>
              {openFaq===i && <div style={{ padding:'0 20px 17px' }}><p style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eef2', padding:'28px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:20 }}>Nous contacter</h2>
        {sent ? (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ fontSize:44, marginBottom:14 }}>✅</div>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:6 }}>Message envoyé !</h3>
            <p style={{ fontSize:13, color:'#94a3b8' }}>Nous vous répondrons sous 24h à hello@analymo.fr</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} placeholder="Décrivez votre problème…"
              style={{ width:'100%', padding:'13px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' as const, fontFamily:'inherit', color:'#0f172a' }}/>
            <button onClick={()=>{ if(msg)setSent(true); }} disabled={!msg}
              style={{ alignSelf:'flex-start', padding:'12px 26px', borderRadius:10, background:msg?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#e2e8f0', border:'none', color:msg?'#fff':'#94a3b8', fontSize:14, fontWeight:700, cursor:msg?'pointer':'not-allowed', display:'flex', alignItems:'center', gap:8 }}>
              <Send size={14}/> Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

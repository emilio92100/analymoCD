import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, Search, Send, Bell,
  ChevronRight, Building2, ExternalLink, ChevronLeft,
  Shield, BarChart2, Zap, Clock, Upload, CheckCircle,
  ShieldCheck, ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ─── TYPES ───────────────────────────────────────────────── */
type Analyse = {
  id: string; title: string;
  type: 'document' | 'complete';
  status: 'completed' | 'processing';
  score?: number; recommandation?: string; recommandationColor?: string;
  date: string; price: string;
};

/* ─── MOCK ────────────────────────────────────────────────── */
const mockAnalyses: Analyse[] = [
  { id:'1', title:'Appartement rue de la Paix, Paris 2e', type:'complete', status:'completed', score:8.2, recommandation:'Acheter', recommandationColor:'#16a34a', date:'24 mars 2026', price:'19,90€' },
  { id:'2', title:'Studio Cours Mirabeau, Aix-en-Provence', type:'document', status:'completed', date:'19 mars 2026', price:'4,99€' },
  { id:'3', title:'T3 Quai de Saône, Lyon 2e', type:'complete', status:'processing', date:'26 mars 2026', price:'29,90€' },
];

/* ─── NAV ─────────────────────────────────────────────────── */
const navItems = [
  { to:'/dashboard',                  icon:LayoutDashboard, label:'Tableau de bord' },
  { to:'/dashboard/analyses',         icon:FileText,        label:'Mes analyses' },
  { to:'/dashboard/compare',          icon:GitCompare,      label:'Comparer mes biens' },
  { to:'/dashboard/compte',           icon:User,            label:'Compte' },
  { to:'/dashboard/support',          icon:LifeBuoy,        label:'Support' },
];

/* ─── HOOK ────────────────────────────────────────────────── */
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

/* ─── SCORE ───────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const color = score >= 7.5 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626';
  const r = 22, circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <svg width="54" height="54" style={{ flexShrink:0 }}>
        <circle cx="27" cy="27" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4"/>
        <circle cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 27 27)"/>
        <text x="27" y="32" textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{score.toFixed(1)}</text>
      </svg>
      <div>
        <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, letterSpacing:'0.05em' }}>SCORE</div>
        <div style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>sur 10</div>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ─────────────────────────────────────────────── */
function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, email } = useUser();
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  return (
    <aside style={{
      width: 260, minHeight:'100vh', height:'100%',
      background:'#0d2235',
      display:'flex', flexDirection:'column',
      borderRight:'1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Logo + close */}
      <div style={{ padding:'24px 20px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <Link to="/" onClick={onClose}>
          <img src="/logo.png" alt="Analymo" style={{ height:28, objectFit:'contain', filter:'brightness(0) invert(1)' }}/>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:4 }}><X size={18}/></button>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding:'0 16px 20px' }}>
        <Link to="/dashboard/nouvelle-analyse" onClick={onClose}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 16px', borderRadius:12, background:'linear-gradient(135deg, #2a7d9c, #1a5e78)', color:'#fff', textDecoration:'none', fontSize:13.5, fontWeight:700, boxShadow:'0 4px 16px rgba(42,125,156,0.4)', transition:'opacity 0.15s' }}
          onMouseOver={e=>(e.currentTarget as HTMLElement).style.opacity='0.88'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.opacity='1'}>
          <Plus size={15}/> Nouvelle analyse
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'4px 10px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:active?700:500, color:active?'#fff':'rgba(255,255,255,0.48)', background:active?'rgba(255,255,255,0.08)':'transparent', transition:'all 0.15s' }}
              onMouseOver={e=>{ if(!active)(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.8)'; }}
              onMouseOut={e=>{ if(!active)(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.48)'; }}>
              <Icon size={16} style={{ color:active?'#5bb8d4':'inherit', flexShrink:0 }}/>{item.label}
              {active && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#2a7d9c', flexShrink:0 }}/>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding:'12px 16px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg, #2a7d9c, #1a5e78)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }}>
            {(name.charAt(0)||'U').toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name||'…'}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</div>
          </div>
          <button onClick={handleLogout} title="Déconnexion"
            style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:4, transition:'color 0.15s', flexShrink:0 }}
            onMouseOver={e=>(e.currentTarget.style.color='#f87171')} onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.3)')}>
            <LogOut size={14}/>
          </button>
        </div>
        <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:6, marginTop:10, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.28)', fontSize:12, fontWeight:600, padding:'2px 2px', letterSpacing:'0.04em', transition:'color 0.15s' }}
          onMouseOver={e=>(e.currentTarget.style.color='#f87171')} onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.28)')}>
          <LogOut size={12}/> DÉCONNEXION
        </button>
      </div>
    </aside>
  );
}

/* ─── TOPBAR ──────────────────────────────────────────────── */
function Topbar({ onMenuClick, title }: { onMenuClick:()=>void; title:string }) {
  return (
    <header style={{ height:64, background:'rgba(255,255,255,0.82)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderBottom:'1px solid rgba(15,45,61,0.07)', display:'flex', alignItems:'center', padding:'0 24px', gap:12, position:'sticky', top:0, zIndex:40, flexShrink:0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background:'none', border:'none', cursor:'pointer', color:'#0f2d3d', padding:4, display:'none', marginRight:4 }}><Menu size={20}/></button>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em' }}>{title}</div>
      </div>
      <button style={{ width:36, height:36, borderRadius:10, background:'#f1f5f9', border:'1px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><Bell size={15}/></button>
      <Link to="/dashboard/nouvelle-analyse"
        className="topbar-cta"
        style={{ padding:'9px 18px', borderRadius:10, background:'#0f2d3d', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
        <Plus size={13}/> Nouvelle analyse
      </Link>
    </header>
  );
}

/* ─── ROOT ────────────────────────────────────────────────── */
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
    <div style={{ display:'flex', minHeight:'100vh', background:'#f0f4f8', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ width:260, flexShrink:0 }}>
        <div style={{ position:'fixed', top:0, left:0, width:260, height:'100vh', zIndex:50, overflowY:'auto' }}>
          <Sidebar/>
        </div>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'fixed', inset:0, zIndex:200 }}>
            <div onClick={()=>setMobileOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(8,20,30,0.65)', backdropFilter:'blur(4px)' }}/>
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
          <div style={{ maxWidth:1060, margin:'0 auto' }}>
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
          .choice-grid { grid-template-columns: 1fr !important; }
          .type-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}

function DashboardContent({ path }: { path:string }) {
  if (path === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse/>;
  if (path === '/dashboard/analyses')          return <MesAnalyses/>;
  if (path === '/dashboard/compare')           return <Compare/>;
  if (path === '/dashboard/compte')            return <Compte/>;
  if (path === '/dashboard/support')           return <Support/>;
  return <Home_/>;
}

/* ══════════════════════════════════════
   HOME
══════════════════════════════════════ */
function Home_() {
  const { name } = useUser();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const stats = [
    { label:'Analyses totales', value:'3',       icon:FileText,  color:'#2a7d9c', bg:'rgba(42,125,156,0.1)' },
    { label:'Score moyen',      value:'—',        icon:BarChart2, color:'#94a3b8', bg:'rgba(148,163,184,0.1)' },
    { label:'Dernière analyse', value:'2 j',      icon:Clock,     color:'#d97706', bg:'rgba(217,119,6,0.1)'   },
    { label:'Crédits restants', value:'0',        icon:Zap,       color:'#0f2d3d', bg:'rgba(15,45,61,0.08)'   },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>

      {/* Greeting */}
      <div style={{ animation:'fadeUp 0.3s ease both' }}>
        <h1 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>
          {greeting}{name ? `, ${name}` : ''} 👋
        </h1>
        <p style={{ fontSize:14, color:'#64748b' }}>Bienvenue sur votre tableau de bord Analymo.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, animation:'fadeUp 0.38s ease both' }}>
        {stats.map((s,i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eef4', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ width:40, height:40, borderRadius:11, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <Icon size={18} style={{ color:s.color }}/>
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', marginBottom:4 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize:26, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em', lineHeight:1 }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Analyse choices */}
      <div style={{ animation:'fadeUp 0.44s ease both' }}>
        <div style={{ marginBottom:16 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', letterSpacing:'-0.015em', marginBottom:4 }}>Analyser un document</h2>
          <p style={{ fontSize:13, color:'#94a3b8' }}>Choisissez le type d'analyse adapté à votre besoin.</p>
        </div>

        <div className="choice-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Analyse simple */}
          <Link to="/dashboard/nouvelle-analyse?type=document" style={{ textDecoration:'none' }}>
            <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e8eef4', padding:'28px 24px', cursor:'pointer', transition:'all 0.2s ease', height:'100%', boxSizing:'border-box' as const }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(42,125,156,0.4)'; el.style.boxShadow='0 8px 28px rgba(42,125,156,0.1)'; el.style.transform='translateY(-2px)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#e8eef4'; el.style.boxShadow='none'; el.style.transform='translateY(0)'; }}>
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(42,125,156,0.09)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                <FileText size={22} style={{ color:'#2a7d9c' }}/>
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:'#0f172a', letterSpacing:'-0.015em', marginBottom:10 }}>Analyse d'un document</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:20 }}>Idéal pour comprendre rapidement un document précis et lever un doute.</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#2a7d9c', display:'flex', alignItems:'center', gap:5 }}>Commencer <ArrowRight size={14}/></span>
                <span style={{ fontSize:18, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em' }}>4,99€</span>
              </div>
            </div>
          </Link>

          {/* Analyse complète */}
          <Link to="/dashboard/nouvelle-analyse?type=complete" style={{ textDecoration:'none' }}>
            <div style={{ background:'linear-gradient(145deg, #0f2d3d 0%, #1a4f6e 100%)', borderRadius:20, border:'1.5px solid transparent', padding:'28px 24px', cursor:'pointer', transition:'all 0.2s ease', position:'relative', overflow:'hidden', height:'100%', boxSizing:'border-box' as const }}
              onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 12px 40px rgba(15,45,61,0.35)'; el.style.transform='translateY(-2px)'; }}
              onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='none'; el.style.transform='translateY(0)'; }}>
              <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(42,125,156,0.18)', pointerEvents:'none' }}/>
              <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
              {/* Badge */}
              <div style={{ position:'absolute', top:18, right:18, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', color:'#fff', fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:100, letterSpacing:'0.05em', border:'1px solid rgba(255,255,255,0.2)' }}>
                Recommandé
              </div>
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                <ShieldCheck size={22} style={{ color:'#fff' }}/>
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.015em', marginBottom:10 }}>Analyse complète d'un logement</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.62)', lineHeight:1.6, marginBottom:20 }}>Analyse croisée de tous les documents du bien pour une décision éclairée.</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:5 }}>Commencer l'audit <ArrowRight size={14}/></span>
                <span style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>19,90€</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Packs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:12 }}>
          {[
            { label:'Pack 2 biens', sub:'Comparaison côte à côte', price:'29,90€' },
            { label:'Pack 3 biens', sub:'Classement + recommandation finale', price:'39,90€' },
          ].map(p => (
            <Link key={p.label} to="/dashboard/nouvelle-analyse" style={{ textDecoration:'none' }}>
              <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #e8eef4', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'all 0.18s' }}
                onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(42,125,156,0.3)'; el.style.boxShadow='0 4px 14px rgba(42,125,156,0.07)'; }}
                onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#e8eef4'; el.style.boxShadow='none'; }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:2 }}>{p.label}</div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>{p.sub}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:16, fontWeight:900, color:'#0f172a' }}>{p.price}</span>
                  <ArrowRight size={14} style={{ color:'#2a7d9c' }}/>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent analyses */}
      <div style={{ animation:'fadeUp 0.5s ease both' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', letterSpacing:'-0.015em' }}>Vos analyses</h2>
          <Link to="/dashboard/analyses" style={{ fontSize:13, color:'#2a7d9c', textDecoration:'none', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
            Tout voir <ChevronRight size={14}/>
          </Link>
        </div>
        {mockAnalyses.length === 0 ? (
          <EmptyState label="Aucune analyse pour le moment" sub="Uploadez un document pour commencer"/>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {mockAnalyses.map(a => <AnalyseRow key={a.id} a={a}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ─────────────────────────────────────────── */
function EmptyState({ label, sub }: { label:string; sub:string }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1.5px dashed #e2e8f0', padding:'52px 24px', textAlign:'center' }}>
      <FileText size={34} style={{ color:'#cbd5e1', display:'block', margin:'0 auto 12px' }}/>
      <div style={{ fontSize:15, fontWeight:700, color:'#94a3b8', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:13, color:'#cbd5e1' }}>{sub}</div>
    </div>
  );
}

/* ─── ANALYSE ROW ─────────────────────────────────────────── */
function AnalyseRow({ a }: { a:Analyse }) {
  const isComplete = a.type === 'complete';
  const sc = a.score ?? 0;
  const scoreColor = sc >= 7.5 ? '#16a34a' : sc >= 5 ? '#d97706' : '#dc2626';
  const typeLabel = isComplete ? 'Analyse Complète' : 'Analyse Document';

  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eef4', padding:'15px 20px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,0.03)', transition:'all 0.18s ease' }}
      onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 6px 22px rgba(42,125,156,0.09)'; el.style.transform='translateY(-1px)'; el.style.borderColor='#c8dde8'; }}
      onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 1px 4px rgba(0,0,0,0.03)'; el.style.transform='translateY(0)'; el.style.borderColor='#e8eef4'; }}>

      {/* Icon */}
      <div style={{ width:42, height:42, borderRadius:11, flexShrink:0, background:a.status==='processing'?'rgba(42,125,156,0.08)':`${scoreColor}0e`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {a.status==='processing'
          ? <div style={{ width:18, height:18, borderRadius:'50%', border:'2.5px solid #2a7d9c', borderTopColor:'transparent', animation:'spin 0.85s linear infinite' }}/>
          : <Building2 size={18} style={{ color:scoreColor }}/>}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:140 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
        <div style={{ fontSize:12, color:'#94a3b8', display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'1px 7px', fontSize:11, fontWeight:600, color:'#64748b' }}>{typeLabel}</span>
          <span>·</span><span>{a.date}</span>
          <span>·</span><span style={{ fontWeight:700, color:'#64748b' }}>{a.price}</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, flexWrap:'wrap' }}>
        {a.status==='processing' ? (
          <span style={{ fontSize:12, fontWeight:700, color:'#2a7d9c', background:'rgba(42,125,156,0.08)', padding:'5px 11px', borderRadius:8 }}>En cours…</span>
        ) : (
          <>
            {isComplete && a.score != null && <ScoreRing score={a.score}/>}
            {a.recommandation && (
              <span style={{ fontSize:12, fontWeight:700, color:a.recommandationColor, background:`${a.recommandationColor}10`, border:`1px solid ${a.recommandationColor}22`, padding:'5px 11px', borderRadius:8, whiteSpace:'nowrap' }}>{a.recommandation}</span>
            )}
            <button style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:9, background:'#f8fafc', border:'1px solid #e2e8f0', fontSize:12, fontWeight:700, color:'#2a7d9c', cursor:'pointer', transition:'background 0.15s', whiteSpace:'nowrap' }}
              onMouseOver={e=>(e.currentTarget.style.background='#e8f4f8')} onMouseOut={e=>(e.currentTarget.style.background='#f8fafc')}>
              <ExternalLink size={12}/> Voir le rapport
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   NOUVELLE ANALYSE
══════════════════════════════════════ */
function NouvelleAnalyse() {
  const [step, setStep] = useState<'choice'|'upload'|'confirm'>('choice');
  const [type, setType] = useState<'document'|'complete'|null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const plans = {
    document: { label:"Analyse d'un document", price:'4,99€', max:1, desc:'Un seul document analysé en détail. Parfait pour lever un doute rapidement.' },
    complete: { label:"Analyse complète d'un logement", price:'19,90€', max:20, desc:'Déposez tous les documents du bien — PV d\'AG, règlement, diagnostics, appels de charges. Rapport global + score /10.' },
  };

  const plan = type ? plans[type] : null;
  const canContinue = (step==='choice'&&type) || (step==='upload'&&files.length>0) || step==='confirm';

  const handleNext = () => {
    if (step==='choice'&&type) setStep('upload');
    else if (step==='upload'&&files.length>0) setStep('confirm');
    else if (step==='confirm') alert('Redirection vers Stripe… (à connecter)');
  };

  return (
    <div style={{ maxWidth:780, margin:'0 auto' }}>
      <Link to="/dashboard" style={{ fontSize:13, color:'#94a3b8', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginBottom:24, fontWeight:600 }}>
        <ChevronLeft size={14}/> Retour
      </Link>

      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:6 }}>Que souhaitez-vous analyser ?</h1>
        <p style={{ fontSize:14, color:'#64748b' }}>Choisissez le mode d'analyse adapté à votre besoin.</p>
      </div>

      {/* Stepper */}
      <div style={{ display:'flex', marginBottom:32, background:'#fff', borderRadius:14, border:'1px solid #e8eef4', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        {(['choice','upload','confirm'] as const).map((s,i) => {
          const labels = ['Type','Documents','Paiement'];
          const idx = ['choice','upload','confirm'].indexOf(step);
          const done = i < idx;
          const active = i === idx;
          return (
            <div key={s} style={{ flex:1, padding:'14px 0', textAlign:'center', background:active?'rgba(42,125,156,0.05)':'#fff', borderRight:i<2?'1px solid #e8eef4':'none', transition:'background 0.2s' }}>
              <div style={{ width:26, height:26, borderRadius:'50%', margin:'0 auto 6px', background:done?'#2a7d9c':active?'#0f2d3d':'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:done||active?'#fff':'#94a3b8' }}>
                {done?'✓':i+1}
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:active?'#0f172a':done?'#2a7d9c':'#94a3b8' }}>{labels[i]}</div>
            </div>
          );
        })}
      </div>

      {/* Step: choice */}
      {step==='choice' && (
        <div>
          <div className="type-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            {/* Document simple */}
            <button onClick={()=>setType('document')}
              style={{ padding:'26px 22px', borderRadius:20, border:type==='document'?'2px solid #2a7d9c':'1.5px solid #e8eef4', background:type==='document'?'rgba(42,125,156,0.04)':'#fff', cursor:'pointer', textAlign:'left', transition:'all 0.18s', boxShadow:type==='document'?'0 0 0 4px rgba(42,125,156,0.1)':'0 1px 4px rgba(0,0,0,0.04)', position:'relative' }}>
              {type==='document' && <CheckCircle size={18} color="#2a7d9c" style={{ position:'absolute', top:16, right:16 }}/>}
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(42,125,156,0.09)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <FileText size={22} style={{ color:'#2a7d9c' }}/>
              </div>
              <div style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:8, letterSpacing:'-0.01em' }}>Analyse d'un document</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:18 }}>Un seul fichier — PV d'AG, règlement, diagnostic ou appel de charges.</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#2a7d9c', letterSpacing:'-0.02em' }}>4,99€</div>
            </button>

            {/* Analyse complète */}
            <button onClick={()=>setType('complete')}
              style={{ padding:'26px 22px', borderRadius:20, border:type==='complete'?'2px solid rgba(255,255,255,0.3)':'1.5px solid transparent', background:type==='complete'?'linear-gradient(145deg, #0f2d3d, #1a4f6e)':'linear-gradient(145deg, #0f2d3d, #1a4f6e)', cursor:'pointer', textAlign:'left', transition:'all 0.18s', position:'relative', overflow:'hidden', boxShadow:type==='complete'?'0 0 0 4px rgba(15,45,61,0.2)':'0 4px 20px rgba(15,45,61,0.15)' }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(42,125,156,0.2)', pointerEvents:'none' }}/>
              <div style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:100 }}>RECOMMANDÉ</div>
              {type==='complete' && <CheckCircle size={18} color="rgba(255,255,255,0.9)" style={{ position:'absolute', top:14, left:14 }}/>}
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <ShieldCheck size={22} style={{ color:'#fff' }}/>
              </div>
              <div style={{ fontSize:17, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.01em' }}>Analyse complète d'un logement</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:18 }}>Tous les documents du bien — rapport global avec score /10 et recommandations.</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>19,90€</div>
            </button>
          </div>

          {/* Packs */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[{label:'Pack 2 biens', sub:'Comparaison côte à côte', price:'29,90€'},{label:'Pack 3 biens', sub:'Classement + recommandation', price:'39,90€'}].map(p=>(
              <div key={p.label} style={{ background:'#fff', borderRadius:13, border:'1.5px solid #e8eef4', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'all 0.16s' }}
                onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(42,125,156,0.3)'; }}
                onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#e8eef4'; }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:2 }}>{p.label}</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{p.sub}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:15, fontWeight:900, color:'#0f172a' }}>{p.price}</span>
                  <ArrowRight size={13} style={{ color:'#2a7d9c' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: upload */}
      {step==='upload' && plan && (
        <div>
          <div style={{ padding:'14px 18px', borderRadius:11, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#0f172a', flex:1 }}>{plan.label}</span>
            <span style={{ fontSize:14, fontWeight:900, color:'#2a7d9c' }}>{plan.price}</span>
            <button onClick={()=>{ setStep('choice'); setFiles([]); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#94a3b8', fontWeight:600 }}>Changer</button>
          </div>

          <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:18, padding:'12px 16px', background:'rgba(42,125,156,0.05)', borderRadius:10, border:'1px solid rgba(42,125,156,0.12)' }}>
            {plan.desc}
          </div>

          <div onClick={()=>document.getElementById('file-input')?.click()}
            style={{ padding:'52px 32px', borderRadius:18, border:'2px dashed #cbd5e1', background:'#fafcfe', textAlign:'center', cursor:'pointer', marginBottom:14, transition:'all 0.18s' }}
            onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#2a7d9c'; el.style.background='rgba(42,125,156,0.02)'; }}
            onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor='#cbd5e1'; el.style.background='#fafcfe'; }}>
            <input id="file-input" type="file" multiple={plan.max>1} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display:'none' }}
              onChange={e=>{ if(e.target.files) setFiles(prev=>[...prev,...Array.from(e.target.files!)].slice(0,plan.max)); }}/>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(42,125,156,0.09)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <Upload size={24} style={{ color:'#2a7d9c' }}/>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'#0f172a', marginBottom:5 }}>Déposez vos documents ici</div>
            <div style={{ fontSize:13, color:'#94a3b8' }}>ou <span style={{ color:'#2a7d9c', fontWeight:700 }}>cliquez pour sélectionner</span></div>
            <div style={{ fontSize:12, color:'#cbd5e1', marginTop:7 }}>PDF, Word, JPG · Max {plan.max} fichier{plan.max>1?'s':''}</div>
          </div>

          {files.length>0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {files.map((f,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderRadius:10, background:'#fff', border:'1px solid #e8eef4' }}>
                  <FileText size={15} color="#2a7d9c" style={{ flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                  <CheckCircle size={14} color="#16a34a" style={{ flexShrink:0 }}/>
                  <button onClick={()=>setFiles(prev=>prev.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18, lineHeight:1, flexShrink:0 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: confirm */}
      {step==='confirm' && plan && (
        <div>
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eef4', padding:'26px', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:18 }}>Récapitulatif de votre commande</h3>
            {[{l:"Type d'analyse",v:plan.label},{l:'Documents déposés',v:`${files.length} fichier${files.length>1?'s':''}`},{l:'Total à payer',v:plan.price,bold:true}].map(row=>(
              <div key={row.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>{row.l}</span>
                <span style={{ fontSize:row.bold?22:14, fontWeight:row.bold?900:700, color:row.bold?'#2a7d9c':'#0f172a', letterSpacing:row.bold?'-0.02em':0 }}>{row.v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding:'13px 18px', borderRadius:11, background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', gap:10, alignItems:'center' }}>
            <Zap size={16} color="#16a34a" style={{ flexShrink:0 }}/>
            <span style={{ fontSize:13, color:'#15803d', fontWeight:600 }}>Rapport prêt en moins de 2 minutes après paiement</span>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:28, gap:12 }}>
        {step!=='choice' && (
          <button onClick={()=>setStep(step==='confirm'?'upload':'choice')}
            style={{ padding:'12px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:14, fontWeight:700, color:'#0f172a', cursor:'pointer' }}>
            ← Retour
          </button>
        )}
        <button onClick={handleNext} disabled={!canContinue}
          style={{ marginLeft:'auto', padding:'12px 30px', borderRadius:10, border:'none', background:canContinue?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#e2e8f0', color:canContinue?'#fff':'#94a3b8', fontSize:14, fontWeight:800, cursor:canContinue?'pointer':'default', boxShadow:canContinue?'0 4px 16px rgba(15,45,61,0.18)':'none', transition:'all 0.15s' }}>
          {step==='choice'?'Continuer →':step==='upload'?'Vérifier ma commande →':'💳 Payer et analyser'}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MES ANALYSES
══════════════════════════════════════ */
function MesAnalyses() {
  const [search, setSearch] = useState('');
  const filtered = mockAnalyses.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>Mes analyses</h1>
          <p style={{ fontSize:13, color:'#94a3b8' }}>{mockAnalyses.length} analyse{mockAnalyses.length>1?'s':''} réalisées</p>
        </div>
        <Link to="/dashboard/nouvelle-analyse" style={{ padding:'10px 20px', borderRadius:10, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={14}/> Nouvelle analyse
        </Link>
      </div>
      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un bien…"
          style={{ width:'100%', padding:'12px 14px 12px 40px', borderRadius:11, border:'1.5px solid #e2e8f0', fontSize:14, background:'#fff', outline:'none', boxSizing:'border-box' as const, color:'#0f172a' }}/>
      </div>
      {filtered.length>0
        ? <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{filtered.map(a=><AnalyseRow key={a.id} a={a}/>)}</div>
        : <EmptyState label="Aucune analyse trouvée" sub="Essayez un autre terme de recherche"/>}
    </div>
  );
}

/* ══════════════════════════════════════
   COMPARE
══════════════════════════════════════ */
function Compare() {
  const b1 = { title:'Appartement rue de la Paix, Paris 2e', score:8.2, recommandation:'Acheter', color:'#16a34a', scores:{Financier:85,Travaux:70,Juridique:91,Charges:80}, positifs:['Fonds de travaux bien provisionné','Charges raisonnables (180€/mois)'], risques:['Ravalement prévu en 2026 (~8 000€)','Quelques impayés en copropriété'] };
  const b2 = { title:'Studio Cours Mirabeau, Aix-en-Provence', score:6.7, recommandation:'Négocier', color:'#d97706', scores:{Financier:55,Travaux:60,Juridique:78,Charges:75}, positifs:['Emplacement premium','Bon DPE (classe C)'], risques:['Trésorerie du syndicat faible','Toiture à rénover sous 3 ans'] };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div>
        <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:4 }}>Comparer mes biens</h1>
        <p style={{ fontSize:13, color:'#94a3b8' }}>Analyse comparative côte à côte.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:16 }}>
        {[b1,b2].map((b,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:16, border:`1.5px solid ${b.color}22`, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.12em', marginBottom:8 }}>BIEN {i+1}</div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:16, lineHeight:1.4 }}>{b.title}</h3>
            <div style={{ display:'flex', alignItems:'flex-end', gap:10, marginBottom:20 }}>
              <div style={{ fontSize:50, fontWeight:900, color:b.color, lineHeight:1, letterSpacing:'-0.03em' }}>{b.score}</div>
              <div style={{ paddingBottom:4 }}>
                <div style={{ fontSize:13, color:'#94a3b8' }}>/10</div>
                <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:7, background:`${b.color}10`, color:b.color, fontSize:12, fontWeight:700, marginTop:4 }}>{b.recommandation}</span>
              </div>
            </div>
            {Object.entries(b.scores).map(([cat,val])=>(
              <div key={cat} style={{ marginBottom:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{cat}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{val}</span>
                </div>
                <div style={{ height:5, borderRadius:3, background:'#f1f5f9' }}>
                  <div style={{ width:`${val}%`, height:'100%', borderRadius:3, background:val>=75?'#16a34a':val>=55?'#d97706':'#dc2626', transition:'width 0.5s ease' }}/>
                </div>
              </div>
            ))}
            <div style={{ marginTop:18, padding:'13px', borderRadius:10, background:'#f8fffe', border:'1px solid #d1fae530', marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', marginBottom:7 }}>✓ Points forts</div>
              {b.positifs.map(p=><div key={p} style={{ fontSize:12, color:'#374151', marginBottom:4, paddingLeft:8 }}>· {p}</div>)}
            </div>
            <div style={{ padding:'13px', borderRadius:10, background:'#fffbf0', border:'1px solid #fde68a30' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#d97706', marginBottom:7 }}>⚠ Points de vigilance</div>
              {b.risques.map(r=><div key={r} style={{ fontSize:12, color:'#374151', marginBottom:4, paddingLeft:8 }}>· {r}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'20px 24px', borderRadius:13, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', gap:12, alignItems:'flex-start' }}>
        <Shield size={19} color="#2a7d9c" style={{ flexShrink:0, marginTop:2 }}/>
        <div>
          <div style={{ fontSize:10, fontWeight:800, color:'#2a7d9c', letterSpacing:'0.12em', marginBottom:5 }}>VERDICT ANALYMO</div>
          <p style={{ fontSize:14, color:'#0f172a', fontWeight:600, lineHeight:1.6 }}>Le <strong>Bien 1</strong> (score 8,2/10) est recommandé. Anticipez le ravalement 2026 dans votre négociation.</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   COMPTE
══════════════════════════════════════ */
function Compte() {
  const [user, setUser] = useState({name:'',email:''});
  const [saved, setSaved] = useState(false);
  useEffect(()=>{ supabase.auth.getUser().then(({data:{user:u}})=>{ if(u) setUser({name:u.user_metadata?.full_name||'',email:u.email||''}); }); },[]);
  const save = async ()=>{ await supabase.auth.updateUser({data:{full_name:user.name}}); setSaved(true); setTimeout(()=>setSaved(false),3000); };
  return (
    <div style={{ maxWidth:600 }}>
      <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:26 }}>Mon compte</h1>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eef4', padding:'26px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:18, paddingBottom:13, borderBottom:'1px solid #f1f5f9' }}>Informations personnelles</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
          {[{l:'Nom complet',v:user.name,set:(v:string)=>setUser({...user,name:v}),ph:'Jean Dupont'},{l:'Email',v:user.email,set:(_:string)=>{},ph:'',disabled:true}].map(f=>(
            <div key={f.l}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:7 }}>{f.l}</label>
              <input value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} disabled={f.disabled}
                style={{ width:'100%', padding:'11px 13px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:14, background:f.disabled?'#f8fafc':'#fff', color:f.disabled?'#94a3b8':'#0f172a', outline:'none', boxSizing:'border-box' as const }}/>
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

/* ══════════════════════════════════════
   SUPPORT
══════════════════════════════════════ */
function Support() {
  const faqs = [
    {q:"Quels types de documents puis-je analyser ?",a:"PV d'AG, règlements de copropriété, appels de charges, diagnostics immobiliers. Formats : PDF, Word, images JPG/PNG."},
    {q:"Combien de temps prend une analyse ?",a:"Moins de 2 minutes. Vous recevez un email dès que votre rapport est disponible."},
    {q:"Mes documents sont-ils sécurisés ?",a:"Oui. Chiffrement SSL/TLS, aucun partage de données. Les fichiers sont supprimés après l'analyse."},
    {q:"Analymo remplace-t-il un notaire ?",a:"Non. Analymo est un outil d'aide à la décision. Il ne remplace pas les conseils d'un professionnel juridique."},
  ];
  const [open, setOpen] = useState<number|null>(null);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  return (
    <div style={{ maxWidth:680 }}>
      <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#0f172a', letterSpacing:'-0.025em', marginBottom:26 }}>Support</h1>
      <div style={{ marginBottom:26 }}>
        <h2 style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:12 }}>Questions fréquentes</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {faqs.map((f,i)=>(
            <div key={i} style={{ borderRadius:12, border:'1px solid #e8eef4', overflow:'hidden', background:'#fff' }}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{ width:'100%', padding:'15px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{f.q}</span>
                <ChevronDown size={15} color="#2a7d9c" style={{ flexShrink:0, transform:open===i?'rotate(180deg)':'none', transition:'transform 0.2s' }}/>
              </button>
              {open===i && <div style={{ padding:'0 18px 15px' }}><p style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>{f.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8eef4', padding:'26px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:18 }}>Nous contacter</h2>
        {sent ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:5 }}>Message envoyé !</h3>
            <p style={{ fontSize:13, color:'#94a3b8' }}>Réponse sous 24h à hello@analymo.fr</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} placeholder="Décrivez votre problème…"
              style={{ width:'100%', padding:'12px 13px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' as const, fontFamily:'inherit', color:'#0f172a' }}/>
            <button onClick={()=>{ if(msg)setSent(true); }} disabled={!msg}
              style={{ alignSelf:'flex-start', padding:'11px 24px', borderRadius:9, background:msg?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#e2e8f0', border:'none', color:msg?'#fff':'#94a3b8', fontSize:14, fontWeight:700, cursor:msg?'pointer':'not-allowed', display:'flex', alignItems:'center', gap:7 }}>
              <Send size={14}/> Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

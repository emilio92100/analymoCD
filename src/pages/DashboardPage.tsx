import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, CheckCircle,
  Search, Send, Bell, ChevronRight, Building2, ExternalLink,
  ChevronLeft, Shield, BarChart2, Zap, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Analyse = {
  id: string; title: string;
  type: 'document' | 'complete' | 'pack2' | 'pack3';
  status: 'completed' | 'processing';
  score?: number; recommandation?: string; recommandationColor?: string;
  date: string; price: string;
};

const mockAnalyses: Analyse[] = [
  { id:'1', title:'Appartement rue de la Paix, Paris 2e', type:'complete', status:'completed', score:8.2, recommandation:'Acheter', recommandationColor:'#16a34a', date:'24 mars 2026', price:'19,90€' },
  { id:'2', title:'Studio Cours Mirabeau, Aix-en-Provence', type:'document', status:'completed', date:'19 mars 2026', price:'4,99€' },
  { id:'3', title:'T3 Quai de Saône, Lyon 2e', type:'complete', status:'processing', date:'26 mars 2026', price:'29,90€' },
];

const navMain = [
  { to:'/dashboard',                  icon:LayoutDashboard, label:'Tableau de bord' },
  { to:'/dashboard/analyses',         icon:FileText,        label:'Mes analyses' },
  { to:'/dashboard/compare',          icon:GitCompare,      label:'Comparaisons' },
  { to:'/dashboard/nouvelle-analyse', icon:Plus,            label:'Nouvelle analyse', cta:true },
];
const navBottom = [
  { to:'/dashboard/compte',   icon:User,      label:'Mon compte' },
  { to:'/dashboard/support',  icon:LifeBuoy,  label:'Support' },
];

function useUserName() {
  const [name, setName] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setName(user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur');
    });
  }, []);
  return name;
}

function ScoreChip({ score }: { score: number }) {
  const color  = score >= 7.5 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626';
  const bg     = score >= 7.5 ? '#f0fdf4'  : score >= 5 ? '#fffbeb'  : '#fef2f2';
  const border = score >= 7.5 ? '#bbf7d0'  : score >= 5 ? '#fde68a'  : '#fecaca';
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', gap:1, padding:'4px 10px', borderRadius:8, background:bg, border:`1px solid ${border}`, fontSize:15, fontWeight:800, color }}>
      {score.toFixed(1)}<span style={{ fontSize:11, fontWeight:600, opacity:0.7 }}>/10</span>
    </span>
  );
}

function Sidebar({ collapsed, onToggle, onClose, isMobileOverlay=false }:
  { collapsed:boolean; onToggle:()=>void; onClose?:()=>void; isMobileOverlay?:boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = useUserName();
  const w = (collapsed && !isMobileOverlay) ? 68 : 240;

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  return (
    <aside style={{ width:w, minHeight:'100vh', height:'100%', background:'#0f2d3d', display:'flex', flexDirection:'column', transition:'width 0.22s cubic-bezier(.4,0,.2,1)', overflow:'hidden', borderRight:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
      <div style={{ height:64, display:'flex', alignItems:'center', padding:(collapsed&&!isMobileOverlay)?'0 0 0 18px':'0 16px', justifyContent:(collapsed&&!isMobileOverlay)?'center':'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {(!collapsed||isMobileOverlay) && (
          <Link to="/" onClick={onClose}><img src="/logo.png" alt="Analymo" style={{ height:28, objectFit:'contain', filter:'brightness(0) invert(1)' }} /></Link>
        )}
        <button onClick={isMobileOverlay?onClose:onToggle} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:6, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}
          onMouseOver={e=>(e.currentTarget.style.color='#fff')} onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.4)')}>
          {isMobileOverlay ? <X size={18}/> : collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
        </button>
      </div>

      <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto', overflowX:'hidden' }}>
        {navMain.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          const isCol = collapsed && !isMobileOverlay;
          if (item.cta) return (
            <Link key={item.to} to={item.to} onClick={onClose} title={isCol?item.label:undefined} style={{ display:'flex', alignItems:'center', gap:isCol?0:10, padding:isCol?'10px 0':'10px 12px', justifyContent:isCol?'center':'flex-start', borderRadius:9, textDecoration:'none', fontSize:13.5, fontWeight:700, color:'#fff', background:'linear-gradient(135deg, #2a7d9c, #1a5e78)', marginTop:8, marginBottom:4, boxShadow:'0 2px 8px rgba(42,125,156,0.35)', overflow:'hidden', whiteSpace:'nowrap' }}>
              <Icon size={16} style={{ flexShrink:0 }} />{!isCol && item.label}
            </Link>
          );
          return (
            <Link key={item.to} to={item.to} onClick={onClose} title={isCol?item.label:undefined} style={{ display:'flex', alignItems:'center', gap:isCol?0:10, padding:isCol?'10px 0':'10px 12px', justifyContent:isCol?'center':'flex-start', borderRadius:9, textDecoration:'none', fontSize:13.5, fontWeight:isActive?700:500, color:isActive?'#fff':'rgba(255,255,255,0.52)', background:isActive?'rgba(42,125,156,0.28)':'transparent', borderLeft:isActive&&!isCol?'3px solid #2a7d9c':'3px solid transparent', overflow:'hidden', whiteSpace:'nowrap', transition:'all 0.15s ease' }}
              onMouseOver={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.color='#fff'; }}
              onMouseOut={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.52)'; }}>
              <Icon size={16} style={{ color:isActive?'#3a9cbf':'inherit', flexShrink:0 }} />
              {!isCol && item.label}
            </Link>
          );
        })}
        <div style={{ margin:'16px 0 8px', borderTop:'1px solid rgba(255,255,255,0.06)' }} />
        {navBottom.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          const isCol = collapsed && !isMobileOverlay;
          return (
            <Link key={item.to} to={item.to} onClick={onClose} title={isCol?item.label:undefined} style={{ display:'flex', alignItems:'center', gap:isCol?0:10, padding:isCol?'9px 0':'9px 12px', justifyContent:isCol?'center':'flex-start', borderRadius:9, textDecoration:'none', fontSize:13, fontWeight:500, color:isActive?'#fff':'rgba(255,255,255,0.42)', background:isActive?'rgba(42,125,156,0.2)':'transparent', overflow:'hidden', whiteSpace:'nowrap', transition:'color 0.15s' }}
              onMouseOver={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.75)'; }}
              onMouseOut={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.42)'; }}>
              <Icon size={15} style={{ flexShrink:0 }} />{!isCol && item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding:'8px 8px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:2 }}>
        {(!collapsed||isMobileOverlay) && (
          <div style={{ marginTop:8, padding:'10px 12px', borderRadius:9, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg, #2a7d9c, #1a5e78)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }}>
              {(userName.charAt(0)||'U').toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userName||'…'}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Mon compte</div>
            </div>
            <button onClick={handleLogout} title="Se déconnecter" style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:4, flexShrink:0, transition:'color 0.15s' }}
              onMouseOver={e=>(e.currentTarget.style.color='#ef4444')} onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.3)')}>
              <LogOut size={14}/>
            </button>
          </div>
        )}
        {(collapsed&&!isMobileOverlay) && (
          <button onClick={handleLogout} title="Se déconnecter" style={{ margin:'8px auto 0', width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg, #2a7d9c, #1a5e78)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }}>
            {(userName.charAt(0)||'U').toUpperCase()}
          </button>
        )}
      </div>
    </aside>
  );
}

function Topbar({ onMenuClick, breadcrumb }: { onMenuClick:()=>void; breadcrumb:string }) {
  return (
    <header style={{ height:64, background:'#fff', borderBottom:'1px solid #e8eef2', display:'flex', alignItems:'center', padding:'0 24px', gap:12, position:'sticky', top:0, zIndex:40, flexShrink:0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background:'none', border:'none', cursor:'pointer', color:'#0f2d3d', padding:4, display:'none' }}><Menu size={20}/></button>
      <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
        <span style={{ fontSize:12, color:'#7a9aaa' }}>Analymo</span>
        <ChevronRight size={12} style={{ color:'#b0c4ce' }}/>
        <span style={{ fontSize:12, fontWeight:600, color:'#0f2d3d' }}>{breadcrumb}</span>
      </div>
      <button style={{ width:36, height:36, borderRadius:8, background:'#f4f7f9', border:'1px solid #e0eaf0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#4a6b7c' }}><Bell size={15}/></button>
      <Link to="/dashboard/nouvelle-analyse" style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg, #2a7d9c 0%, #0f2d3d 100%)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(15,45,61,0.2)' }}>
        <Plus size={14}/> Nouvelle analyse
      </Link>
    </header>
  );
}

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/connexion');
    });
  }, [navigate]);

  const allItems = [...navMain, ...navBottom];
  const currentLabel = allItems.find(i => i.to === location.pathname)?.label || 'Dashboard';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f4f7f9' }}>
      <div className="desktop-sidebar" style={{ width:collapsed?68:240, flexShrink:0, transition:'width 0.22s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ position:'fixed', top:0, left:0, width:collapsed?68:240, height:'100vh', zIndex:50, transition:'width 0.22s cubic-bezier(.4,0,.2,1)' }}>
          <Sidebar collapsed={collapsed} onToggle={()=>setCollapsed(c=>!c)}/>
        </div>
      </div>
      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <div onClick={()=>setMobileOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(10,25,35,0.55)', backdropFilter:'blur(3px)' }}/>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:240 }}>
            <Sidebar collapsed={false} onToggle={()=>{}} onClose={()=>setMobileOpen(false)} isMobileOverlay/>
          </div>
        </div>
      )}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Topbar onMenuClick={()=>setMobileOpen(true)} breadcrumb={currentLabel}/>
        <main style={{ flex:1, padding:'28px 24px', overflowX:'hidden' }}>
          <div style={{ maxWidth:1080, margin:'0 auto' }}>
            <DashboardContent currentPath={location.pathname}/>
          </div>
        </main>
      </div>
      <style>{`
        @media (max-width: 767px) { .desktop-sidebar { display: none !important; } .mobile-menu-btn { display: flex !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function DashboardContent({ currentPath }: { currentPath:string }) {
  if (currentPath === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse/>;
  if (currentPath === '/dashboard/analyses')         return <MesAnalyses/>;
  if (currentPath === '/dashboard/compare')          return <Compare/>;
  if (currentPath === '/dashboard/compte')           return <Compte/>;
  if (currentPath === '/dashboard/support')          return <Support/>;
  return <DashboardHome/>;
}

function StatCard({ icon:Icon, label, value, sub, color }: { icon:React.ElementType; label:string; value:string; sub?:string; color:string }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eef2', padding:'22px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', gap:12, animation:'fadeIn 0.4s ease both' }}>
      <div style={{ width:40, height:40, borderRadius:10, background:`${color}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={18} style={{ color }}/>
      </div>
      <div>
        <div style={{ fontSize:26, fontWeight:900, color:'#0f2d3d', letterSpacing:'-0.02em', lineHeight:1 }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:'#22c55e', fontWeight:700, marginTop:3 }}>{sub}</div>}
        <div style={{ fontSize:12, color:'#7a9aaa', marginTop:4, fontWeight:500 }}>{label}</div>
      </div>
    </div>
  );
}

function AnalyseRow({ a }: { a:Analyse }) {
  const isComplete = a.type !== 'document';
  const scoreColor = !a.score ? '#2a7d9c' : a.score >= 7.5 ? '#16a34a' : a.score >= 5 ? '#d97706' : '#dc2626';
  const typeLabel = a.type==='document'?'Analyse Document':a.type==='complete'?'Analyse Complète':a.type==='pack2'?'Pack 2 Biens':'Pack 3 Biens';

  return (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8eef2', padding:'16px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', transition:'box-shadow 0.2s, transform 0.2s', animation:'fadeIn 0.35s ease both' }}
      onMouseOver={e=>{ (e.currentTarget as HTMLElement).style.boxShadow='0 6px 24px rgba(42,125,156,0.1)'; (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'; }}
      onMouseOut={e=>{ (e.currentTarget as HTMLElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.transform='translateY(0)'; }}>
      <div style={{ width:44, height:44, borderRadius:11, flexShrink:0, background:a.status==='processing'?'rgba(42,125,156,0.08)':`${scoreColor}0f`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {a.status==='processing'
          ? <div style={{ width:18, height:18, borderRadius:'50%', border:'2.5px solid #2a7d9c', borderTopColor:'transparent', animation:'spin 0.9s linear infinite' }}/>
          : <Building2 size={19} style={{ color:scoreColor }}/>}
      </div>
      <div style={{ flex:1, minWidth:160 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#0f2d3d', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
        <div style={{ fontSize:12, color:'#7a9aaa', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ background:'#f4f7f9', borderRadius:5, padding:'2px 7px', fontSize:11, fontWeight:600, color:'#4a6b7c' }}>{typeLabel}</span>
          <span>·</span><span>{a.date}</span>
          <span>·</span><span style={{ fontWeight:600, color:'#4a6b7c' }}>{a.price}</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, flexWrap:'wrap' }}>
        {a.status==='processing' ? (
          <span style={{ fontSize:12, fontWeight:700, color:'#2a7d9c', background:'rgba(42,125,156,0.08)', padding:'5px 12px', borderRadius:7 }}>En cours d'analyse…</span>
        ) : (
          <>
            {isComplete && a.score!=null && <ScoreChip score={a.score}/>}
            {a.recommandation && (
              <span style={{ fontSize:12, fontWeight:700, color:a.recommandationColor, background:`${a.recommandationColor}12`, border:`1px solid ${a.recommandationColor}30`, padding:'4px 10px', borderRadius:7, whiteSpace:'nowrap' }}>{a.recommandation}</span>
            )}
            <button style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:8, background:'#f4f7f9', border:'1px solid #dce8ef', fontSize:12, fontWeight:700, color:'#2a7d9c', cursor:'pointer', whiteSpace:'nowrap', transition:'background 0.15s' }}
              onMouseOver={e=>(e.currentTarget.style.background='#e4f0f6')} onMouseOut={e=>(e.currentTarget.style.background='#f4f7f9')}>
              <ExternalLink size={12}/> Voir le rapport
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DashboardHome() {
  const userName = useUserName();
  const hour = new Date().getHours();
  const greeting = hour<12?'Bonjour':hour<18?'Bon après-midi':'Bonsoir';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      <div>
        <h1 style={{ fontSize:'clamp(20px, 2.5vw, 28px)', fontWeight:800, color:'#0f2d3d', marginBottom:4 }}>{greeting}{userName?`, ${userName}`:''} 👋</h1>
        <p style={{ fontSize:14, color:'#7a9aaa' }}>Voici un aperçu de votre espace Analymo.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14 }}>
        <StatCard icon={FileText}  label="Analyses réalisées" value="3"       color="#2a7d9c"/>
        <StatCard icon={BarChart2} label="Score moyen"        value="8,2/10"  color="#16a34a" sub="↑ Bon niveau"/>
        <StatCard icon={Clock}     label="Dernière analyse"   value="2j"      color="#d97706"/>
        <StatCard icon={Zap}       label="Économies estimées" value="~8 000€" color="#0f2d3d"/>
      </div>
      <div style={{ borderRadius:16, background:'linear-gradient(130deg, #1a5e78 0%, #0f2d3d 100%)', padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap', boxShadow:'0 4px 24px rgba(15,45,61,0.18)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-40, top:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.12em', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>NOUVELLE ANALYSE</div>
          <h3 style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:6, lineHeight:1.3 }}>Un nouveau bien à analyser ?</h3>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>Déposez vos documents — rapport complet en moins de 2 minutes.</p>
        </div>
        <Link to="/dashboard/nouvelle-analyse" style={{ padding:'13px 24px', borderRadius:10, background:'#fff', color:'#0f2d3d', fontSize:14, fontWeight:800, textDecoration:'none', display:'flex', alignItems:'center', gap:7, flexShrink:0, whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', position:'relative' }}>
          <Plus size={15}/> Lancer une analyse
        </Link>
      </div>
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontSize:15, fontWeight:800, color:'#0f2d3d' }}>Analyses récentes</h2>
          <Link to="/dashboard/analyses" style={{ fontSize:13, color:'#2a7d9c', textDecoration:'none', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>Tout voir <ChevronRight size={14}/></Link>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {mockAnalyses.map(a => <AnalyseRow key={a.id} a={a}/>)}
        </div>
      </div>
    </div>
  );
}

function MesAnalyses() {
  const [search, setSearch] = useState('');
  const filtered = mockAnalyses.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 style={{ fontSize:'clamp(20px, 2.5vw, 26px)', fontWeight:800, color:'#0f2d3d', marginBottom:4 }}>Mes analyses</h1>
          <p style={{ fontSize:13, color:'#7a9aaa' }}>{mockAnalyses.length} analyse{mockAnalyses.length>1?'s':''}</p>
        </div>
        <Link to="/dashboard/nouvelle-analyse" style={{ padding:'10px 20px', borderRadius:9, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={14}/> Nouvelle analyse
        </Link>
      </div>
      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#7a9aaa' }}/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un bien…" style={{ width:'100%', padding:'11px 14px 11px 38px', borderRadius:10, border:'1px solid #dce8ef', fontSize:14, background:'#fff', outline:'none', boxSizing:'border-box', color:'#0f2d3d' }}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length>0 ? filtered.map(a=><AnalyseRow key={a.id} a={a}/>) : <div style={{ textAlign:'center', padding:'48px 24px', color:'#7a9aaa', fontSize:14 }}>Aucune analyse trouvée.</div>}
      </div>
    </div>
  );
}

function NouvelleAnalyse() {
  const [selectedType, setSelectedType] = useState<string|null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<'type'|'upload'|'confirm'>('type');
  const stepIdx = {type:0,upload:1,confirm:2}[step];
  const types = [
    { id:'document', label:"Analyse d'un document",      desc:"Un seul document analysé en détail.", price:'4,99€',  maxFiles:1  },
    { id:'complete', label:"Analyse complète d'un bien", desc:"Tous les documents d'un bien ensemble.", price:'19,90€', maxFiles:10, popular:true },
    { id:'pack2',    label:'Pack 2 biens',                desc:'Analyse complète + comparaison côte à côte.', price:'29,90€', maxFiles:20 },
    { id:'pack3',    label:'Pack 3 biens',                desc:'Analyse + classement et recommandation finale.', price:'39,90€', maxFiles:30 },
  ];
  const selectedPlan = types.find(t=>t.id===selectedType);
  const canNext = (step==='type'&&!!selectedType)||(step==='upload'&&files.length>0)||(step==='confirm');

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>
      <Link to="/dashboard" style={{ fontSize:13, color:'#7a9aaa', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginBottom:20 }}><ChevronLeft size={14}/> Retour</Link>
      <h1 style={{ fontSize:'clamp(20px, 2.5vw, 26px)', fontWeight:800, color:'#0f2d3d', marginBottom:4 }}>Nouvelle analyse</h1>
      <p style={{ fontSize:14, color:'#7a9aaa', marginBottom:32 }}>Choisissez un type, déposez vos documents, puis payez en toute sécurité.</p>
      <div style={{ display:'flex', gap:0, marginBottom:36, background:'#fff', borderRadius:12, border:'1px solid #e8eef2', overflow:'hidden' }}>
        {['Type','Documents','Paiement'].map((l,i)=>(
          <div key={l} style={{ flex:1, padding:'14px 0', textAlign:'center', background:i===stepIdx?'#f4f7f9':'#fff', borderRight:i<2?'1px solid #e8eef2':'none' }}>
            <div style={{ width:24, height:24, borderRadius:'50%', margin:'0 auto 6px', background:i<stepIdx?'#2a7d9c':i===stepIdx?'#0f2d3d':'#e8eef2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:i<=stepIdx?'#fff':'#7a9aaa' }}>
              {i<stepIdx?'✓':i+1}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:i===stepIdx?'#0f2d3d':i<stepIdx?'#2a7d9c':'#7a9aaa' }}>{l}</div>
          </div>
        ))}
      </div>
      {step==='type' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:14 }}>
          {types.map(type=>(
            <button key={type.id} onClick={()=>setSelectedType(type.id)} style={{ padding:'22px', borderRadius:13, border:selectedType===type.id?'2px solid #2a7d9c':'1.5px solid #e8eef2', background:selectedType===type.id?'rgba(42,125,156,0.04)':'#fff', cursor:'pointer', textAlign:'left', position:'relative', transition:'all 0.15s ease', boxShadow:selectedType===type.id?'0 0 0 3px rgba(42,125,156,0.1)':'none' }}>
              {type.popular && <div style={{ position:'absolute', top:-10, left:16, padding:'2px 10px', borderRadius:100, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', fontSize:9, fontWeight:800, color:'#fff', letterSpacing:'0.05em' }}>LE PLUS POPULAIRE</div>}
              {selectedType===type.id && <CheckCircle size={18} color="#2a7d9c" style={{ position:'absolute', top:14, right:14 }}/>}
              <div style={{ fontSize:15, fontWeight:800, color:'#0f2d3d', marginBottom:8 }}>{type.label}</div>
              <div style={{ fontSize:13, color:'#7a9aaa', marginBottom:16, lineHeight:1.5 }}>{type.desc}</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#2a7d9c' }}>{type.price}</div>
            </button>
          ))}
        </div>
      )}
      {step==='upload' && selectedPlan && (
        <div>
          <div style={{ padding:'14px 18px', borderRadius:10, background:'#f4f7f9', border:'1px solid #dce8ef', display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#0f2d3d', flex:1 }}>{selectedPlan.label}</span>
            <span style={{ fontSize:14, fontWeight:800, color:'#2a7d9c' }}>{selectedPlan.price}</span>
            <button onClick={()=>setStep('type')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#7a9aaa' }}>Changer</button>
          </div>
          <div onClick={()=>document.getElementById('file-input')?.click()} style={{ padding:'48px 32px', borderRadius:14, border:'2px dashed #c8dce6', background:'#fafcfd', textAlign:'center', cursor:'pointer', marginBottom:16, transition:'border-color 0.15s, background 0.15s' }}
            onMouseOver={e=>{ (e.currentTarget as HTMLElement).style.borderColor='#2a7d9c'; (e.currentTarget as HTMLElement).style.background='rgba(42,125,156,0.02)'; }}
            onMouseOut={e=>{ (e.currentTarget as HTMLElement).style.borderColor='#c8dce6'; (e.currentTarget as HTMLElement).style.background='#fafcfd'; }}>
            <input id="file-input" type="file" multiple={selectedPlan.maxFiles>1} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e=>{ if(e.target.files) setFiles(prev=>[...prev,...Array.from(e.target.files!)].slice(0,selectedPlan.maxFiles)); }}/>
            <div style={{ fontSize:32, marginBottom:12 }}>📂</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#0f2d3d', marginBottom:6 }}>Glissez-déposez vos documents</div>
            <div style={{ fontSize:13, color:'#7a9aaa' }}>ou <span style={{ color:'#2a7d9c', fontWeight:700 }}>parcourez vos fichiers</span></div>
            <div style={{ fontSize:12, color:'#b0c4ce', marginTop:8 }}>PDF, Word, JPG — max {selectedPlan.maxFiles} fichier{selectedPlan.maxFiles>1?'s':''}</div>
          </div>
          {files.map((f,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderRadius:9, background:'#fff', border:'1px solid #e8eef2', marginBottom:8 }}>
              <FileText size={16} color="#2a7d9c"/>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#0f2d3d', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
              <CheckCircle size={14} color="#22c55e"/>
              <button onClick={()=>setFiles(prev=>prev.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'#7a9aaa', fontSize:16, lineHeight:1 }}>×</button>
            </div>
          ))}
        </div>
      )}
      {step==='confirm' && selectedPlan && (
        <div>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eef2', padding:'24px 28px', marginBottom:16 }}>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f2d3d', marginBottom:20 }}>Récapitulatif</h3>
            {[{l:"Type d'analyse",v:selectedPlan.label},{l:'Documents',v:`${files.length} fichier${files.length>1?'s':''}`},{l:'Total',v:selectedPlan.price,bold:true}].map(row=>(
              <div key={row.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid #f0f4f6' }}>
                <span style={{ fontSize:13, color:'#7a9aaa' }}>{row.l}</span>
                <span style={{ fontSize:row.bold?20:14, fontWeight:row.bold?900:600, color:row.bold?'#2a7d9c':'#0f2d3d' }}>{row.v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding:'14px 18px', borderRadius:10, background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', gap:10, alignItems:'center' }}>
            <Zap size={16} color="#16a34a"/>
            <span style={{ fontSize:13, color:'#15803d', fontWeight:600 }}>Rapport disponible en moins de 2 minutes après paiement</span>
          </div>
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:32, gap:12 }}>
        {step!=='type' && (
          <button onClick={()=>setStep(step==='confirm'?'upload':'type')} style={{ padding:'12px 22px', borderRadius:9, border:'1.5px solid #dce8ef', background:'#fff', fontSize:14, fontWeight:700, color:'#0f2d3d', cursor:'pointer' }}>← Retour</button>
        )}
        <button onClick={()=>{ if(step==='type'&&selectedType)setStep('upload'); else if(step==='upload'&&files.length>0)setStep('confirm'); else if(step==='confirm')alert('Redirection vers Stripe…'); }} disabled={!canNext}
          style={{ marginLeft:'auto', padding:'12px 28px', borderRadius:9, border:'none', background:canNext?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#e8eef2', color:canNext?'#fff':'#7a9aaa', fontSize:14, fontWeight:800, cursor:canNext?'pointer':'default', boxShadow:canNext?'0 4px 16px rgba(15,45,61,0.15)':'none', transition:'all 0.15s' }}>
          {step==='type'?'Continuer →':step==='upload'?'Vérifier →':'💳 Payer et analyser'}
        </button>
      </div>
    </div>
  );
}

function Compare() {
  const b1 = { title:'Appartement rue de la Paix, Paris 2e', score:8.2, recommandation:'Acheter', color:'#16a34a', scores:{Financier:85,Travaux:70,Juridique:91,Charges:80}, positifs:['Fonds de travaux bien provisionné','Charges raisonnables (180€/mois)'], risques:['Ravalement prévu en 2026 (~8 000€)','Quelques impayés en copropriété'] };
  const b2 = { title:'Studio Cours Mirabeau, Aix-en-Provence', score:6.7, recommandation:'Négocier', color:'#d97706', scores:{Financier:55,Travaux:60,Juridique:78,Charges:75}, positifs:['Emplacement premium','Bon DPE (classe C)'], risques:['Trésorerie du syndicat faible','Toiture à rénover sous 3 ans'] };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 style={{ fontSize:'clamp(20px, 2.5vw, 26px)', fontWeight:800, color:'#0f2d3d', marginBottom:4 }}>Comparaison de biens</h1>
        <p style={{ fontSize:13, color:'#7a9aaa' }}>Deux biens analysés côte à côte.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
        {[b1,b2].map((b,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:14, border:`1.5px solid ${b.color}30`, padding:'24px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#7a9aaa', letterSpacing:'0.08em', marginBottom:6 }}>BIEN {i+1}</div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#0f2d3d', marginBottom:18, lineHeight:1.4 }}>{b.title}</h3>
            <div style={{ display:'flex', alignItems:'flex-end', gap:12, marginBottom:20 }}>
              <div style={{ fontSize:48, fontWeight:900, color:b.color, lineHeight:1 }}>{b.score}</div>
              <div><div style={{ fontSize:14, color:'#7a9aaa' }}>/10</div><span style={{ display:'inline-block', padding:'3px 10px', borderRadius:6, background:`${b.color}12`, color:b.color, fontSize:12, fontWeight:700, marginTop:4 }}>{b.recommandation}</span></div>
            </div>
            {Object.entries(b.scores).map(([cat,val])=>(
              <div key={cat} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ fontSize:12, color:'#7a9aaa' }}>{cat}</span><span style={{ fontSize:12, fontWeight:700, color:'#0f2d3d' }}>{val}</span></div>
                <div style={{ height:5, borderRadius:3, background:'#f0f4f6' }}><div style={{ width:`${val}%`, height:'100%', borderRadius:3, background:val>=75?'#16a34a':val>=55?'#d97706':'#dc2626', transition:'width 0.5s ease' }}/></div>
              </div>
            ))}
            <div style={{ marginTop:18, padding:'14px', borderRadius:10, background:'#f9fdfb', marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', marginBottom:8 }}>✓ Points forts</div>
              {b.positifs.map(p=><div key={p} style={{ fontSize:12, color:'#374151', marginBottom:5 }}>· {p}</div>)}
            </div>
            <div style={{ padding:'14px', borderRadius:10, background:'#fffbf0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#d97706', marginBottom:8 }}>⚠ Vigilance</div>
              {b.risques.map(r=><div key={r} style={{ fontSize:12, color:'#374151', marginBottom:5 }}>· {r}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'22px 28px', borderRadius:14, background:'#f4f7f9', border:'1px solid #dce8ef', display:'flex', gap:14, alignItems:'flex-start' }}>
        <Shield size={20} color="#2a7d9c" style={{ flexShrink:0, marginTop:2 }}/>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:'#2a7d9c', letterSpacing:'0.1em', marginBottom:6 }}>VERDICT ANALYMO</div>
          <p style={{ fontSize:14, color:'#0f2d3d', fontWeight:600, lineHeight:1.6 }}>Le <strong>Bien 1</strong> (score 8,2/10) est recommandé. Anticipez le ravalement 2026 dans votre négociation pour optimiser votre acquisition.</p>
        </div>
      </div>
    </div>
  );
}

function Compte() {
  const [user, setUser] = useState({name:'',email:''});
  const [saved, setSaved] = useState(false);
  useEffect(()=>{ supabase.auth.getUser().then(({data:{user:u}})=>{ if(u) setUser({name:u.user_metadata?.full_name||'',email:u.email||''}); }); },[]);
  const handleSave = async ()=>{ await supabase.auth.updateUser({data:{full_name:user.name}}); setSaved(true); setTimeout(()=>setSaved(false),3000); };
  return (
    <div style={{ maxWidth:640 }}>
      <h1 style={{ fontSize:'clamp(20px, 2.5vw, 26px)', fontWeight:800, color:'#0f2d3d', marginBottom:28 }}>Mon compte</h1>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eef2', padding:'28px', marginBottom:16 }}>
        <h2 style={{ fontSize:15, fontWeight:800, color:'#0f2d3d', marginBottom:20, paddingBottom:14, borderBottom:'1px solid #f0f4f6' }}>Informations personnelles</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[{l:'Nom complet',v:user.name,set:(v:string)=>setUser({...user,name:v}),ph:'Jean Dupont'},{l:'Email',v:user.email,set:(_:string)=>{},ph:'',disabled:true}].map(f=>(
            <div key={f.l}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#0f2d3d', marginBottom:8 }}>{f.l}</label>
              <input value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} disabled={f.disabled} style={{ width:'100%', padding:'11px 14px', borderRadius:9, border:'1.5px solid #dce8ef', fontSize:14, background:f.disabled?'#f9fbfc':'#fff', color:f.disabled?'#7a9aaa':'#0f2d3d', outline:'none', boxSizing:'border-box' as const }}/>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:4 }}>
            <button onClick={handleSave} style={{ padding:'10px 22px', borderRadius:9, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Enregistrer</button>
            {saved && <span style={{ fontSize:13, color:'#16a34a', fontWeight:700 }}>✓ Modifications enregistrées</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Support() {
  const faqs = [
    {q:"Quels types de documents Analymo peut-il analyser ?",a:"Analymo est spécialisé dans les documents immobiliers : PV d'AG, règlements de copropriété, appels de charges, diagnostics. Formats acceptés : PDF, Word, images."},
    {q:"Combien de temps prend une analyse ?",a:"La plupart des analyses sont prêtes en moins de 2 minutes. Vous recevez un email dès que votre rapport est disponible."},
    {q:"Mes documents sont-ils sécurisés ?",a:"Vos documents sont chiffrés lors du transfert (SSL/TLS). Nous ne partageons jamais vos données. Les fichiers sont supprimés après l'analyse."},
    {q:"Analymo remplace-t-il un notaire ?",a:"Non. Analymo est un outil d'aide à la décision. Il ne remplace pas les conseils d'un notaire ou d'un expert juridique."},
  ];
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  return (
    <div style={{ maxWidth:720 }}>
      <h1 style={{ fontSize:'clamp(20px, 2.5vw, 26px)', fontWeight:800, color:'#0f2d3d', marginBottom:28 }}>Support</h1>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:15, fontWeight:800, color:'#0f2d3d', marginBottom:14 }}>Questions fréquentes</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {faqs.map((faq,i)=>(
            <div key={i} style={{ borderRadius:11, border:'1px solid #e8eef2', overflow:'hidden', background:'#fff' }}>
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{ width:'100%', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#0f2d3d' }}>{faq.q}</span>
                <ChevronDown size={16} color="#2a7d9c" style={{ flexShrink:0, transform:openFaq===i?'rotate(180deg)':'rotate(0)', transition:'transform 0.2s' }}/>
              </button>
              {openFaq===i && <div style={{ padding:'0 20px 16px' }}><p style={{ fontSize:13, color:'#4a6b7c', lineHeight:1.7 }}>{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eef2', padding:'28px' }}>
        <h2 style={{ fontSize:15, fontWeight:800, color:'#0f2d3d', marginBottom:20 }}>Nous contacter</h2>
        {sent ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#0f2d3d', marginBottom:6 }}>Message envoyé !</h3>
            <p style={{ fontSize:13, color:'#7a9aaa' }}>Nous vous répondrons sous 24h à hello@analymo.fr</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} placeholder="Décrivez votre problème…" style={{ width:'100%', padding:'12px 14px', borderRadius:9, border:'1.5px solid #dce8ef', fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' as const, fontFamily:'inherit', color:'#0f2d3d' }}/>
            <button onClick={()=>{ if(msg) setSent(true); }} disabled={!msg} style={{ alignSelf:'flex-start', padding:'11px 24px', borderRadius:9, background:msg?'linear-gradient(135deg, #2a7d9c, #0f2d3d)':'#e8eef2', border:'none', color:msg?'#fff':'#7a9aaa', fontSize:14, fontWeight:700, cursor:msg?'pointer':'not-allowed', display:'flex', alignItems:'center', gap:8 }}>
              <Send size={14}/> Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

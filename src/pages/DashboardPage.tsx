import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, Bell, Shield, CreditCard,
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
import Tarifs from './dashboard/Tarifs';

const navItems = [
  { to: '/dashboard',               icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/dashboard/analyses',      icon: FileText,        label: 'Mes analyses' },
  { to: '/dashboard/compare',       icon: GitCompare,      label: 'Comparer mes biens' },
  { to: '/dashboard/tarifs',        icon: CreditCard,      label: 'Tarifs' },
  { to: '/dashboard/compte',        icon: User,            label: 'Mon compte' },
  { to: '/dashboard/support',       icon: LifeBuoy,        label: 'Support / Aide' },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const { credits } = useCredits();
  return (
    <aside style={{ width:260, minHeight:'100vh', height:'100%', background:'#fff', display:'flex', flexDirection:'column', borderRight:'1px solid #edf2f7', boxShadow:'2px 0 16px rgba(15,45,61,0.05)' }}>
      <div style={{ height:68, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:'1px solid #f0f5f9', flexShrink:0 }}>
        <Link to="/" onClick={onClose}><img src="/logo.png" alt="Verimo" style={{ height:28, objectFit:'contain' }}/></Link>
        {onClose && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}><X size={18}/></button>}
      </div>
      <div style={{ padding:'16px 14px 10px' }}>
        <Link to="/dashboard/nouvelle-analyse" onClick={onClose}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:12, background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:700, boxShadow:'0 4px 14px rgba(42,125,156,0.3)', transition:'all 0.2s' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 6px 20px rgba(42,125,156,0.42)'; el.style.transform='translateY(-1px)'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 14px rgba(42,125,156,0.3)'; el.style.transform='translateY(0)'; }}>
          <Plus size={15} strokeWidth={2.5}/> Nouvelle analyse
        </Link>
      </div>
      <div style={{ margin:'0 14px 8px', padding:'12px', borderRadius:10, background:'#f8fafc', border:'1px solid #edf2f7' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.12em', marginBottom:8 }}>CRÉDITS RESTANTS</div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {[{ label:'Document', value:credits.document, color:'#2a7d9c' }, { label:'Complète', value:credits.complete, color:'#0f2d3d' }].map(c=>(
            <div key={c.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', borderRadius:8, background:'#f8fafc', border:'1px solid #edf2f7' }}>
              <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{c.label}</span>
              <span style={{ fontSize:12, fontWeight:900, color:c.value>0?c.color:'#94a3b8' }}>{c.value} crédit{c.value>1?'s':''} restant{c.value>1?'s':''}</span>
            </div>
          ))}
        </div>
        <Link to="/dashboard/tarifs" onClick={onClose} style={{ display:'block', marginTop:8, fontSize:11, fontWeight:700, color:'#2a7d9c', textDecoration:'none', textAlign:'center' }}>
          {credits.document===0&&credits.complete===0?'+ Acheter une analyse':'+ Recharger'}
        </Link>
      </div>
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
              {active&&<div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:99, background:'#2a7d9c' }}/>}
              <Icon size={16} style={{ color:active?'#2a7d9c':'#94a3b8', flexShrink:0 }}/>{item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => { localStorage.clear(); supabase.auth.signOut(); window.location.replace('/'); };

  return (
    <header style={{ height:68, background:'#fff', borderBottom:'1px solid #edf2f7', display:'flex', alignItems:'center', padding:'0 24px', gap:12, position:'sticky', top:0, zIndex:40, flexShrink:0 }}>
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ background:'none', border:'none', cursor:'pointer', color:'#0f2d3d', padding:4, display:'none' }}><Menu size={20}/></button>
      <p style={{ flex:1, fontSize:17, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em', margin:0 }}>{title}</p>
      <button style={{ width:36, height:36, borderRadius:9, background:'#f8fafc', border:'1px solid #edf2f7', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}><Bell size={15}/></button>
      {isAdmin && (
        <button onClick={()=>navigate('/admin')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:9, background:'linear-gradient(135deg,#0f2d3d,#1a4a60)', border:'none', cursor:'pointer', color:'#fff', fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>
          <Shield size={13}/> Espace Admin
        </button>
      )}
      <div ref={dropdownRef} style={{ position:'relative' }}>
        <button onClick={()=>setDropdownOpen(!dropdownOpen)}
          style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 10px 6px 6px', borderRadius:10, background:dropdownOpen?'#f0f7fb':'#f8fafc', border:`1px solid ${dropdownOpen?'#c7dde8':'#edf2f7'}`, cursor:'pointer', transition:'all 0.15s' }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>
            {(name.charAt(0)||'U').toUpperCase()}
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap' }} className="topbar-cta">{name||'Mon compte'}</span>
          <ChevronDown size={13} style={{ color:'#94a3b8', transition:'transform 0.2s', transform:dropdownOpen?'rotate(180deg)':'rotate(0deg)' }}/>
        </button>
        {dropdownOpen && (
          <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:220, background:'#fff', borderRadius:14, border:'1px solid #edf2f7', boxShadow:'0 16px 48px rgba(0,0,0,0.12)', zIndex:9999, overflow:'hidden' }}>
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
          </div>
        )}
      </div>
    </header>
  );
}

function DashboardBanner() {
  const [banner, setBanner] = useState<{ id:string; message:string; type:string }|null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('banners').select('*').eq('active', true).order('created_at', { ascending:false }).limit(1);
      if (data && data.length > 0) {
        const b = data[0];
        const key = `verimo_banner_${b.id}_${user?.id}`;
        if (sessionStorage.getItem(key) === 'dismissed') setDismissed(true);
        setBanner(b);
      }
    };
    load();
  }, []);

  const handleDismiss = async () => {
    if (!banner) return;
    const { data: { user } } = await supabase.auth.getUser();
    sessionStorage.setItem(`verimo_banner_${banner.id}_${user?.id}`, 'dismissed');
    setDismissed(true);
  };

  if (!banner || dismissed) return null;
  const STYLES: Record<string, { bg:string; border:string; color:string; icon:string }> = {
    info:    { bg:'#f0f7fb', border:'#bae3f5', color:'#2a7d9c', icon:'ℹ️' },
    warning: { bg:'#fffbeb', border:'#fde68a', color:'#d97706', icon:'⚠️' },
    success: { bg:'#f0fdf4', border:'#86efac', color:'#16a34a', icon:'✅' },
  };
  const s = STYLES[banner.type] || STYLES.info;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', background:s.bg, borderBottom:`1.5px solid ${s.border}` }}>
      <span style={{ fontSize:16, flexShrink:0 }}>{s.icon}</span>
      <span style={{ flex:1, fontSize:13, fontWeight:600, color:s.color }}>{banner.message}</span>
      <button onClick={handleDismiss} style={{ background:'none', border:'none', cursor:'pointer', color:s.color, opacity:0.5, padding:4, flexShrink:0 }}><X size={15}/></button>
    </div>
  );
}

function DashboardContent({ path }: { path:string }) {
  if (path === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse/>;
  if (path === '/dashboard/tarifs')           return <Tarifs/>;
  if (path === '/dashboard/analyses')         return <MesAnalyses/>;
  if (path === '/dashboard/compare')          return <Compare/>;
  if (path === '/dashboard/compte')           return <Compte/>;
  if (path === '/dashboard/support')          return <Support/>;
  return <HomeView/>;
}

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
        <DashboardBanner/>
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

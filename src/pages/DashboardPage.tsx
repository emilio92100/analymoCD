import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy,
  LogOut, Menu, X, ChevronDown, Bell, Shield, CreditCard,
  AlertTriangle, Lock, Sparkles, CheckCircle, BookOpen,
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
  { to: '/dashboard/support',       icon: LifeBuoy,        label: 'Support / Aide' },
];

/* ═══════════════════════════════════════════
   SIDEBAR TEAL VERIMO
═══════════════════════════════════════════ */
function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const { credits } = useCredits();

  const SB_BG = '#0e3a4a';
  const SB_ACTIVE_BG = 'rgba(255,255,255,0.1)';
  const SB_ACCENT = '#5dbfe0';
  const SB_TEXT = 'rgba(255,255,255,0.75)';
  const SB_TEXT_ACTIVE = '#ffffff';
  const SB_MUTED = 'rgba(255,255,255,0.25)';

  return (
    <aside style={{ width:260, minHeight:'100vh', height:'100%', background:SB_BG, display:'flex', flexDirection:'column' }}>
      {/* Logo */}
      <div style={{ height:68, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <Link to="/" onClick={onClose} style={{ textDecoration:'none' }}>
          <span style={{ fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>verimo</span>
        </Link>
        {onClose && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:4 }}><X size={18}/></button>}
      </div>

      {/* CTA Nouvelle analyse */}
      <div style={{ padding:'14px 14px 8px' }}>
        <Link to="/dashboard/nouvelle-analyse" onClick={onClose}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:10, background:'#2a7d9c', color:'#fff', textDecoration:'none', fontSize:13, fontWeight:700, transition:'all 0.2s' }}
          onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='#358da8'; }}
          onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.background='#2a7d9c'; }}>
          <Plus size={15} strokeWidth={2.5}/> Nouvelle analyse
        </Link>
      </div>

      {/* Crédits — juste sous le CTA comme l'actuel */}
      <div style={{ margin:'0 14px 6px', padding:'10px 12px', borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:10, fontWeight:700, color:SB_MUTED, letterSpacing:'0.1em', marginBottom:7 }}>CRÉDITS RESTANTS</div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {[{ label:'Document', value:credits.document }, { label:'Complète', value:credits.complete }].map(c=>(
            <div key={c.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 8px', borderRadius:7, background:'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:500 }}>{c.label}</span>
              <span style={{ fontSize:12, fontWeight:800, color:c.value>0?SB_ACCENT:'rgba(255,255,255,0.2)' }}>{c.value} crédit{c.value>1?'s':''}</span>
            </div>
          ))}
        </div>
        <Link to="/dashboard/tarifs" onClick={onClose} style={{ display:'block', marginTop:7, fontSize:11, fontWeight:700, color:SB_ACCENT, textDecoration:'none', textAlign:'center' }}>
          {credits.document===0&&credits.complete===0?'+ Acheter une analyse':'+ Recharger'}
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, padding:'4px 10px', display:'flex', flexDirection:'column', gap:1, overflowY:'auto' }}>
        <p style={{ fontSize:10, fontWeight:700, color:SB_MUTED, letterSpacing:'0.12em', padding:'10px 10px 5px', textTransform:'uppercase' }}>Menu</p>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 12px', textDecoration:'none',
                fontSize:13, fontWeight:active?700:500, color:active?SB_TEXT_ACTIVE:SB_TEXT,
                background:active?SB_ACTIVE_BG:'transparent', transition:'all 0.15s',
                borderLeft:active?`3px solid ${SB_ACCENT}`:'3px solid transparent',
                borderRadius:0,
              }}
              onMouseOver={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; }}
              onMouseOut={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
              <Icon size={16} style={{ color:active?SB_ACCENT:SB_TEXT, flexShrink:0 }}/>{item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/* ═══════════════════════════════════════════
   TOPBAR (inchangé dans la logique)
═══════════════════════════════════════════ */
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
      <p className="topbar-title" style={{ flex:1, fontSize:17, fontWeight:800, color:'#0f172a', letterSpacing:'-0.01em', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</p>
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

/* ═══════════════════════════════════════════
   BANNER (inchangé)
═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   RAPPORT DASHBOARD (APERÇU — inchangé)
═══════════════════════════════════════════ */
function RapportDashboard() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const action = searchParams.get('action') || '';
  const [apercuData, setApercuData] = useState<{ apercu: Record<string, unknown>; type: string; id: string } | null>(null);
  const [showReupload, setShowReupload] = useState(action === 'reupload');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    supabase.from('analyses').select('*').eq('id', id).single().then(({ data }) => {
      if (data?.is_preview && data?.apercu && !data?.result) {
        setApercuData({ apercu: data.apercu as Record<string, unknown>, type: data.type, id: data.id });
      } else if (data?.result) {
        window.location.href = `/rapport?id=${id}${action ? '&action=' + action : ''}`;
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', animation: 'spin 0.9s linear infinite' }}/></div>;

  if (showReupload) return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius: 18, padding: '28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Paiement confirmé !</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 20 }}>
            Bonne nouvelle ! Conformément au RGPD, vos documents ont été supprimés 🔒<br />
            Re-uploadez vos documents pour générer votre rapport complet...<br />
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>et profitez-en pour ajouter ceux que vous aviez oubliés ! 😉</span>
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
            <Link to="/dashboard/nouvelle-analyse" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
              Re-uploader mes documents →
            </Link>
            <button onClick={() => setShowReupload(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Voir l'aperçu d'abord
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!apercuData) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Rapport introuvable.</div>;

  const ap = apercuData.apercu;
  const isComplete = apercuData.type === 'complete' || apercuData.type === 'apercu_complete';

  const lancerPaiement = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/connexion'; return; }
    const priceId = isComplete ? 'price_1TIb3XBO4ekMbwz0a7m7E7gD' : 'price_1TIb1LBO4ekMbwz0020eqcR0';
    const successUrl = `https://verimo.fr/dashboard/rapport?id=${apercuData.id}&action=reupload`;
    const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk' },
      body: JSON.stringify({ priceId, userId: session.user.id, successUrl }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div>
      <style>{`.apercu-dash-grid { display: flex; flex-direction: column; gap: 16px; } @media (min-width: 860px) { .apercu-dash-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; } }`}</style>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: 100 }}>APERÇU GRATUIT</span>
        <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 900, color: '#0f172a', marginTop: 8, marginBottom: 4 }}>{ap.titre as string}</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Débloquez le rapport complet pour accéder à tous les détails.</p>
      </div>
      <div className="apercu-dash-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 22px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 8 }}>RÉSUMÉ</div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{ap.recommandation_courte as string}</p>
          </div>
          {(ap.points_vigilance as string[])?.length > 0 && (
            <div style={{ background: '#fffbeb', borderRadius: 16, border: '1px solid #fde68a', padding: '20px 22px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: '0.1em', marginBottom: 12 }}>⚠ POINTS DE VIGILANCE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(ap.points_vigilance as string[]).map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isComplete && (
            <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 8 }}>SCORE GLOBAL</div>
                <div style={{ fontSize: 52, fontWeight: 900, color: '#94a3b8' }}>?.?</div>
                <div style={{ fontSize: 14, color: '#94a3b8' }}>/20</div>
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <Lock size={22} style={{ color: '#64748b' }}/><span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Score disponible après paiement</span>
              </div>
            </div>
          )}
          <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 12 }}>ANALYSE DÉTAILLÉE</div>
              {['Rapport financier détaillé', 'Travaux votés et à prévoir', 'Charges et fonds travaux', 'Procédures en cours', 'Avis Verimo personnalisé'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0, marginTop: 5 }} />
                  <span style={{ fontSize: 13, color: '#cbd5e1' }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
              <Lock size={20} style={{ color: '#64748b' }}/><span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Contenu réservé aux analyses payantes</span>
            </div>
          </div>
        </div>

        {/* CTA sticky */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius: 18, padding: '22px', overflow: 'hidden' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', marginBottom: 6 }}>DÉBLOQUER</div>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{isComplete ? 'Rapport complet' : 'Analyse du document'}</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 16 }}>{isComplete ? 'Score /20, travaux, charges, procédures, avis Verimo.' : 'Analyse approfondie et recommandations.'} PDF inclus.</p>
            <button onClick={lancerPaiement} style={{ width: '100%', padding: '13px', borderRadius: 12, background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Sparkles size={14}/> Débloquer — {isComplete ? '19,90€' : '4,90€'}
            </button>
            <Link to="/dashboard/analyses" style={{ display: 'block', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Mes analyses</Link>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 10 }}>CE QUI VOUS ATTEND</div>
            {(isComplete ? ['Score global /20', 'Analyse travaux détaillée', 'Finances copropriété', 'Onglet Copropriété', 'Avis Verimo', 'Rapport PDF'] : ['Analyse approfondie', 'Points clés détaillés', 'Recommandations', 'Rapport PDF']).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <CheckCircle size={12} color="#16a34a" style={{ flexShrink: 0 }}/>
                <span style={{ fontSize: 12, color: '#374151' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
            <div onClick={()=>setMobileOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(15,45,61,0.45)' }}/>
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
        <main className="dashboard-main" style={{ flex:1, padding:'28px 24px', overflowX:'hidden' }}>
          <DashboardContent path={location.pathname}/>
        </main>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .topbar-cta { display: none !important; }
          header { padding: 0 14px !important; height: 62px !important; gap: 10px !important; }
          .mobile-menu-btn svg { width: 24px !important; height: 24px !important; }
          .topbar-title { font-size: 15px !important; font-weight: 800 !important; }
          .dashboard-main { padding: 16px 12px !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .action-grid { grid-template-columns: 1fr !important; }
          .compare-grid { grid-template-columns: 1fr !important; }
          .result-grid { grid-template-columns: 1fr !important; }
          .type-grid { grid-template-columns: 1fr !important; }
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

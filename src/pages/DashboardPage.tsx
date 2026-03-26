import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, FileText, GitCompare, User, LifeBuoy, LogOut, Menu, Bell, TrendingUp, Clock, Zap, ChevronDown, CheckCircle, Search, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
  { to: '/dashboard/nouvelle-analyse', icon: <Plus size={20} />, label: 'Nouvelle analyse', highlight: true },
  { to: '/dashboard/analyses', icon: <FileText size={20} />, label: 'Mes analyses' },
  { to: '/dashboard/compare', icon: <GitCompare size={20} />, label: 'Comparaisons' },
];
const bottomItems = [
  { to: '/dashboard/compte', icon: <User size={20} />, label: 'Mon compte' },
  { to: '/dashboard/support', icon: <LifeBuoy size={20} />, label: 'Support' },
];

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Utilisateur');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur');
    });
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  return (
    <aside style={{ width: mobile ? '100%' : 260, height: mobile ? 'auto' : '100vh', background: 'var(--brand-navy)', display: 'flex', flexDirection: 'column', position: mobile ? 'relative' : 'fixed', top: 0, left: 0, zIndex: mobile ? 0 : 50, padding: '24px 0' }}>
      <div style={{ padding: '0 24px 32px' }}>
        <Link to="/"><img src="/logo.png" alt="Analymo" style={{ height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /></Link>
      </div>
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 8 }}>NAVIGATION</div>
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', background: isActive ? 'linear-gradient(135deg, rgba(42,125,156,0.5), rgba(42,125,156,0.25))' : item.highlight ? 'rgba(240,165,0,0.12)' : 'transparent', border: item.highlight ? '1px solid rgba(240,165,0,0.25)' : 'none', marginBottom: item.highlight ? 8 : 0 }}>
              <span style={{ color: isActive ? 'var(--brand-teal-light)' : item.highlight ? '#f0a500' : 'rgba(255,255,255,0.5)' }}>{item.icon}</span>
              {item.label}
              {item.highlight && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#f0a500', background: 'rgba(240,165,0,0.15)', padding: '2px 8px', borderRadius: 100 }}>NOUVEAU</span>}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '16px 12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {bottomItems.map(item => {
          const isActive = location.pathname === item.to;
          return <Link key={item.to} to={item.to} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', background: isActive ? 'rgba(42,125,156,0.3)' : 'transparent' }}>{item.icon}{item.label}</Link>;
        })}
        <div style={{ margin: '12px 0 0', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{userName.charAt(0).toUpperCase()}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, display: 'flex' }}><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/connexion');
    });
  }, [navigate]);

  const currentLabel = [...navItems, ...bottomItems].find(i => i.to === location.pathname)?.label || 'Dashboard';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="desktop-sidebar" style={{ width: 260, flexShrink: 0 }}><Sidebar /></div>
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 280 }}><Sidebar mobile onClose={() => setSidebarOpen(false)} /></div>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: 64, background: '#fff', borderBottom: '1px solid rgba(42,125,156,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-navy)', display: 'none', padding: 4 }}><Menu size={22} /></button>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{currentLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><Bell size={16} /></button>
            <Link to="/dashboard/nouvelle-analyse" style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ Nouvelle analyse</Link>
          </div>
        </header>
        <main style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
          <DashboardContent currentPath={location.pathname} />
        </main>
      </div>
      <style>{`@media (max-width: 767px) { .desktop-sidebar { display: none !important; } .mobile-menu-btn { display: flex !important; } }`}</style>
    </div>
  );
}

function DashboardContent({ currentPath }: { currentPath: string }) {
  if (currentPath === '/dashboard/nouvelle-analyse') return <NouvelleAnalyse />;
  if (currentPath === '/dashboard/analyses') return <MesAnalyses />;
  if (currentPath === '/dashboard/compare') return <Compare />;
  if (currentPath === '/dashboard/compte') return <Compte />;
  if (currentPath === '/dashboard/support') return <Support />;
  return <DashboardHome />;
}

const mockAnalyses = [
  { id:'1', title:"Appartement rue de la Paix, Paris 2e", type:'Analyse Complète', status:'completed', score:82, recommandation:'Acheter', recommandationColor:'#22c55e', date:'24 mars 2026', price:'19,90€' },
  { id:'2', title:'Studio Cours Mirabeau, Aix-en-Provence', type:'Analyse Document', status:'completed', score:67, recommandation:'Négocier', recommandationColor:'#f0a500', date:'19 mars 2026', price:'4,99€' },
  { id:'3', title:'T3 Quai de Saône, Lyon 2e', type:'Pack 2 Biens', status:'processing', score:undefined, recommandation:undefined, recommandationColor:undefined, date:'26 mars 2026', price:'29,90€' },
];

function DashboardHome() {
  const [userName, setUserName] = useState('Utilisateur');
  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserName(user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur'); }); }, []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 8 }}>{greeting}, {userName} 👋</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Voici un aperçu de votre activité sur Analymo.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        {[{ label:'Analyses réalisées', value:'3', icon:<FileText size={20}/>, color:'var(--brand-teal)', bg:'rgba(42,125,156,0.08)' },{ label:'Score moyen', value:'74/100', icon:<TrendingUp size={20}/>, color:'#22c55e', bg:'rgba(34,197,94,0.08)' },{ label:'Dernière analyse', value:'2j', icon:<Clock size={20}/>, color:'#f0a500', bg:'rgba(240,165,0,0.08)' },{ label:'€ économisés', value:'~8 000€', icon:<Zap size={20}/>, color:'var(--brand-navy)', bg:'rgba(15,45,61,0.06)' }].map(stat => (
          <div key={stat.label} style={{ padding: '24px', borderRadius: 16, background: '#fff', border: '1px solid rgba(42,125,156,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: 16 }}>{stat.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '28px 32px', borderRadius: 20, background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 40 }}>
        <div><h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Vous avez un nouveau bien à analyser ?</h3><p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Déposez vos documents et obtenez une analyse complète en 2 minutes.</p></div>
        <Link to="/dashboard/nouvelle-analyse" style={{ padding: '13px 28px', borderRadius: 12, background: '#fff', color: 'var(--brand-teal)', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Plus size={18} /> Lancer une analyse
        </Link>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-navy)' }}>Analyses récentes</h2>
          <Link to="/dashboard/analyses" style={{ fontSize: 14, color: 'var(--brand-teal)', textDecoration: 'none', fontWeight: 600 }}>Tout voir →</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mockAnalyses.map(a => (
            <div key={a.id} style={{ padding: '20px 24px', borderRadius: 16, background: '#fff', border: '1px solid rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: a.status === 'processing' ? 'rgba(42,125,156,0.1)' : `${a.recommandationColor || '#2a7d9c'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {a.status === 'processing' ? <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--brand-teal)', borderTopColor: 'transparent' }} className="animate-spin" /> : <FileText size={20} color={a.recommandationColor || 'var(--brand-teal)'} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.type} · {a.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                {a.score != null ? <div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: a.recommandationColor }}>{a.score}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div></div> : <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(42,125,156,0.08)', fontSize: 13, color: 'var(--brand-teal)', fontWeight: 600 }}>En cours...</div>}
                {a.recommandation && <div style={{ padding: '6px 14px', borderRadius: 8, background: `${a.recommandationColor}15`, fontSize: 13, fontWeight: 600, color: a.recommandationColor }}>{a.recommandation}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NouvelleAnalyse() {
  const [selectedType, setSelectedType] = useState<string|null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<'type'|'upload'|'confirm'>('type');
  const types = [
    { id:'document', icon:'📄', label:"Analyse d'un document", desc:"Un seul document : PV d'AG, règlement, appel de charges ou diagnostic.", price:'4,99€', maxFiles:1 },
    { id:'complete', icon:'🏠', label:"Analyse complète d'un bien", desc:"Tous les documents d'un bien analysés ensemble.", price:'19,90€', maxFiles:10, popular:true },
    { id:'pack2', icon:'🔄', label:'Comparer 2 biens', desc:'Analyse complète de 2 biens avec comparaison côte à côte.', price:'29,90€', maxFiles:20 },
    { id:'pack3', icon:'📊', label:'Comparer 3 biens', desc:'Analyse complète de 3 biens avec classement final.', price:'39,90€', maxFiles:30 },
  ];
  const selectedPlan = types.find(t => t.id === selectedType);
  const stepIdx = { type:0, upload:1, confirm:2 }[step];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <Link to="/dashboard" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Retour</Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 8 }}>Nouvelle analyse</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Sélectionnez le type, déposez vos documents et payez en toute sécurité.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {['Type', 'Documents', 'Paiement'].map((l, i) => (
          <div key={l} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= stepIdx ? 'var(--brand-teal)' : 'rgba(42,125,156,0.15)', marginBottom: 6, transition: 'background 0.3s' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: i === stepIdx ? 'var(--brand-teal)' : i < stepIdx ? 'var(--brand-navy)' : 'var(--text-muted)' }}>{l}</span>
          </div>
        ))}
      </div>
      {step === 'type' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {types.map(type => (
            <button key={type.id} onClick={() => setSelectedType(type.id)} style={{ padding: '24px', borderRadius: 16, border: selectedType === type.id ? '2px solid var(--brand-teal)' : '1.5px solid rgba(42,125,156,0.15)', background: selectedType === type.id ? 'rgba(42,125,156,0.04)' : '#fff', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
              {type.popular && <div style={{ position: 'absolute', top: -10, left: 20, padding: '3px 12px', borderRadius: 100, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', fontSize: 10, fontWeight: 700, color: '#fff' }}>LE PLUS POPULAIRE</div>}
              {selectedType === type.id && <CheckCircle size={20} color="var(--brand-teal)" style={{ position: 'absolute', top: 16, right: 16 }} />}
              <div style={{ fontSize: 28, marginBottom: 12 }}>{type.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 8 }}>{type.label}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{type.desc}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-navy)' }}>{type.price}</div>
            </button>
          ))}
        </div>
      )}
      {step === 'upload' && selectedPlan && (
        <div>
          <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(42,125,156,0.06)', border: '1px solid rgba(42,125,156,0.15)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{selectedPlan.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)' }}>{selectedPlan.label}</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 4 }}>{selectedPlan.price}</span>
            <button onClick={() => setStep('type')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>Changer</button>
          </div>
          <div onClick={() => document.getElementById('file-input')?.click()} style={{ padding: '48px 32px', borderRadius: 16, border: '2px dashed rgba(42,125,156,0.25)', background: 'rgba(42,125,156,0.01)', textAlign: 'center', cursor: 'pointer', marginBottom: 20 }}>
            <input id="file-input" type="file" multiple={selectedPlan.maxFiles > 1} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)].slice(0, selectedPlan.maxFiles)); }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Glissez-déposez vos documents ici</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>ou <span style={{ color: 'var(--brand-teal)', fontWeight: 600 }}>parcourez vos fichiers</span></div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>PDF, Word, JPG · Max {selectedPlan.maxFiles} fichier{selectedPlan.maxFiles > 1 ? 's' : ''}</div>
          </div>
          {files.length > 0 && files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: '#fff', border: '1px solid rgba(42,125,156,0.1)', marginBottom: 8 }}>
              <FileText size={18} color="var(--brand-teal)" /><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: 'var(--brand-navy)' }}>{f.name}</div></div>
              <CheckCircle size={16} color="#22c55e" />
              <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
      {step === 'confirm' && selectedPlan && (
        <div>
          <div style={{ padding: 28, borderRadius: 16, background: '#fff', border: '1px solid rgba(42,125,156,0.1)', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 20 }}>Récapitulatif</h3>
            {[{ l:"Type d'analyse", v:selectedPlan.label }, { l:'Documents', v:`${files.length} fichier${files.length > 1 ? 's' : ''}` }, { l:'Total', v:selectedPlan.price, bold:true }].map(row => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(42,125,156,0.06)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{row.l}</span>
                <span style={{ fontSize: row.bold ? 20 : 14, fontWeight: row.bold ? 800 : 600, color: row.bold ? 'var(--brand-teal)' : 'var(--brand-navy)' }}>{row.v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', gap: 12 }}>
            <Zap size={18} color="#22c55e" /><span style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>Résultats disponibles en moins de 2 minutes après paiement</span>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, gap: 12 }}>
        {step !== 'type' && <button onClick={() => setStep(step === 'confirm' ? 'upload' : 'type')} style={{ padding: '13px 24px', borderRadius: 12, border: '1.5px solid rgba(42,125,156,0.2)', background: '#fff', fontSize: 15, fontWeight: 600, color: 'var(--brand-navy)', cursor: 'pointer' }}>← Retour</button>}
        <button onClick={() => { if (step === 'type' && selectedType) setStep('upload'); else if (step === 'upload' && files.length > 0) setStep('confirm'); else if (step === 'confirm') alert('Redirection vers Stripe... (à connecter)'); }} disabled={(step === 'type' && !selectedType) || (step === 'upload' && files.length === 0)} style={{ marginLeft: 'auto', padding: '13px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(42,125,156,0.25)' }}>
          {step === 'type' ? 'Continuer →' : step === 'upload' ? 'Vérifier →' : '💳 Payer et analyser'}
        </button>
      </div>
    </div>
  );
}

function MesAnalyses() {
  const [search, setSearch] = useState('');
  const filtered = mockAnalyses.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div><h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 6 }}>Mes analyses</h1><p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{mockAnalyses.length} analyses</p></div>
        <Link to="/dashboard/nouvelle-analyse" style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Nouvelle analyse</Link>
      </div>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un bien..." style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.15)', fontSize: 14, background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(42,125,156,0.08)', overflow: 'hidden' }}>
        {filtered.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', borderBottom: i < filtered.length-1 ? '1px solid rgba(42,125,156,0.06)' : 'none', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.type} · {a.date} · {a.price}</div>
            </div>
            {a.score != null && <div style={{ fontSize: 20, fontWeight: 800, color: a.score >= 80 ? '#22c55e' : a.score >= 60 ? '#f0a500' : '#ef4444' }}>{a.score}<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/100</span></div>}
            {a.recommandation && <div style={{ padding: '6px 14px', borderRadius: 8, background: `${a.recommandationColor}15`, fontSize: 13, fontWeight: 600, color: a.recommandationColor }}>{a.recommandation}</div>}
            {a.status === 'processing' && <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(42,125,156,0.08)', fontSize: 13, color: 'var(--brand-teal)', fontWeight: 600 }}>En cours...</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Compare() {
  const b1 = { title:"Appartement rue de la Paix, Paris 2e", score:82, recommandation:'Acheter', color:'#22c55e', scores:{Financier:85,Travaux:70,Juridique:91,Charges:80}, positifs:["Fonds de travaux bien provisionné","Charges raisonnables (180€/mois)"], risques:["Ravalement prévu en 2026 (~8 000€)","Quelques impayés en copropriété"] };
  const b2 = { title:'Studio Cours Mirabeau, Aix-en-Provence', score:67, recommandation:'Négocier', color:'#f0a500', scores:{Financier:55,Travaux:60,Juridique:78,Charges:75}, positifs:['Emplacement premium','Bon DPE (classe C)'], risques:['Trésorerie du syndicat faible','Toiture à rénover sous 3 ans'] };
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 8 }}>Comparaison de biens</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Comparez deux biens analysés côte à côte.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {[b1, b2].map((b, i) => (
          <div key={i} style={{ padding: '24px', borderRadius: 16, background: '#fff', border: `2px solid ${b.color}30` }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Bien {i+1}</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 16, lineHeight: 1.4 }}>{b.title}</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: b.color, lineHeight: 1 }}>{b.score}</div>
              <div><div style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</div><div style={{ padding: '4px 14px', borderRadius: 8, background: `${b.color}15`, color: b.color, fontSize: 13, fontWeight: 700, marginTop: 4 }}>{b.recommandation}</div></div>
            </div>
            {Object.entries(b.scores).map(([cat, val]) => (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{cat}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(42,125,156,0.1)' }}><div style={{ width: `${val}%`, height: '100%', borderRadius: 3, background: val >= 75 ? '#22c55e' : val >= 55 ? '#f0a500' : '#ef4444' }} /></div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-navy)', minWidth: 24 }}>{val}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[b1, b2].map((b, i) => (
          <div key={i}>
            <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>✓ Points forts</div>
              {b.positifs.map(p => <div key={p} style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>· {p}</div>)}
            </div>
            <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(240,165,0,0.04)', border: '1px solid rgba(240,165,0,0.15)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>⚠ Points de vigilance</div>
              {b.risques.map(r => <div key={r} style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>· {r}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: '24px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(42,125,156,0.06), rgba(15,45,61,0.03))', border: '1px solid rgba(42,125,156,0.15)', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-teal)', marginBottom: 10 }}>VERDICT ANALYMO</div>
        <p style={{ fontSize: 16, color: 'var(--brand-navy)', fontWeight: 600 }}>Le <strong>Bien 1</strong> (score 82/100) est recommandé. Anticipez le ravalement 2026 dans votre négociation.</p>
      </div>
    </div>
  );
}

function Compte() {
  const [user, setUser] = useState({ name: '', email: '' });
  const [saved, setSaved] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data: { user: u } }) => { if (u) setUser({ name: u.user_metadata?.full_name || '', email: u.email || '' }); }); }, []);
  const handleSave = async () => { await supabase.auth.updateUser({ data: { full_name: user.name } }); setSaved(true); setTimeout(() => setSaved(false), 3000); };
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 40 }}>Mon compte</h1>
      {[
        { title: 'Informations personnelles', content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[{ l:'Nom complet', v:user.name, set:(v:string)=>setUser({...user,name:v}), ph:'Jean Dupont' },{ l:'Email', v:user.email, set:(_:string)=>{}, ph:'', disabled:true }].map(f => (
              <div key={f.l}><label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>{f.l}</label><input value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} disabled={f.disabled} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 15, background: f.disabled ? 'var(--bg-secondary)' : '#fff', outline: 'none', boxSizing: 'border-box' }} /></div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handleSave} style={{ padding: '11px 24px', borderRadius: 10, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
              {saved && <span style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>✓ Modifications enregistrées</span>}
            </div>
          </div>
        )},
      ].map(s => (
        <div key={s.title} style={{ marginBottom: 24, padding: '28px', borderRadius: 16, background: '#fff', border: '1px solid rgba(42,125,156,0.08)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(42,125,156,0.08)' }}>{s.title}</h2>
          {s.content}
        </div>
      ))}
    </div>
  );
}

function Support() {
  const faqs = [
    { q:"Quels types de documents Analymo peut-il analyser ?", a:"Analymo est spécialisé dans les documents immobiliers : PV d'AG, règlements de copropriété, appels de charges, diagnostics (DPE, amiante, plomb, électricité). Formats : PDF, Word, images." },
    { q:"Combien de temps prend une analyse ?", a:"La plupart des analyses sont prêtes en moins de 2 minutes. Vous recevez un email dès que votre analyse est disponible." },
    { q:"Mes documents sont-ils sécurisés ?", a:"Oui. Vos documents sont chiffrés lors du transfert (SSL/TLS). Nous ne partageons jamais vos données. Vos fichiers sont supprimés 30 jours après l'analyse." },
    { q:"Analymo remplace-t-il un notaire ?", a:"Non. Analymo est un outil d'aide à la décision. Il ne remplace pas les conseils d'un notaire ou d'un expert. Les analyses sont fournies à titre informatif." },
  ];
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 40 }}>Support</h1>
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 20 }}>Questions fréquentes</h2>
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderRadius: 12, border: '1px solid rgba(42,125,156,0.1)', overflow: 'hidden', background: '#fff', marginBottom: 8 }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-navy)' }}>{faq.q}</span>
              <ChevronDown size={18} color="var(--brand-teal)" style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            {openFaq === i && <div style={{ padding: '0 20px 18px' }}><p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{faq.a}</p></div>}
          </div>
        ))}
      </div>
      <div style={{ padding: 28, borderRadius: 20, background: '#fff', border: '1px solid rgba(42,125,156,0.08)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 20 }}>Nous contacter</h2>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}><div style={{ fontSize: 48, marginBottom: 12 }}>✅</div><h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)' }}>Message envoyé !</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} placeholder="Décrivez votre problème..." style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <button onClick={() => { if (msg) setSent(true); }} disabled={!msg} style={{ alignSelf: 'flex-start', padding: '13px 28px', borderRadius: 12, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={16} /> Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

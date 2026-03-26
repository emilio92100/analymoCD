import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Zap, Star, CheckCircle, FileText, Search, Building2, BadgeCheck, UserCheck, CheckCircle2, Crown, Mail, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { PRICING_PLANS } from '../types';

/* ── Intersection observer ───────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Animated counter ────────────────────────────────────── */
function useCounter(target: number, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, start]);
  return val;
}

export default function HomePage() {
  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Hero />
      <Stats />
      <Why />
      <ForWho />
      <HowItWorks />
      <Security />
      <AvantApres />
      <Testimonials />
      <Pricing />
      <CtaFinal />
      <style>{`
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes scanPulse { 0%{top:0%;opacity:0} 5%{opacity:1} 45%{opacity:1} 50%{top:100%;opacity:0} 51%{top:0%;opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .float { animation: floatY 5s ease-in-out infinite; }
        .spin { animation: spin 1s linear infinite; }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }
        .scan { animation: scanPulse 3.5s linear infinite; }
        .card-hover { transition: transform .2s ease, box-shadow .2s ease; cursor: default; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(15,45,61,0.1) !important; }
        @media(max-width:767px){
          .hero-grid{grid-template-columns:1fr!important;gap:40px!important}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important}
          .why-grid{grid-template-columns:1fr!important}
          .forwho-grid{grid-template-columns:1fr!important}
          .steps-grid{grid-template-columns:1fr!important}
          .sec-grid{grid-template-columns:1fr!important}
          .av-grid{grid-template-columns:1fr!important;gap:16px!important}
          .testi-grid{grid-template-columns:1fr!important}
          .price-grid{grid-template-columns:1fr!important}
        }
      `}</style>
    </main>
  );
}

/* ════════════════════════════════════════════════════════════
   HERO
════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{ background: 'linear-gradient(160deg,#f0f8fc 0%,#e8f4f9 60%,#f8fafc 100%)', padding: '80px 24px 72px', paddingTop: 110, position: 'relative', overflow: 'hidden' }}>
      {/* deco blobs */}
      <div style={{ position:'absolute', top:-80, right:-80, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(42,125,156,0.1) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-60, left:-60, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(240,165,0,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />

      <div style={{ maxWidth:1160, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }} className="hero-grid">
        {/* LEFT */}
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'7px 16px', borderRadius:100, background:'rgba(42,125,156,0.1)', border:'1px solid rgba(42,125,156,0.2)', marginBottom:28 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#2a7d9c', display:'inline-block' }} className="pulse-dot" />
            <span style={{ fontSize:13, fontWeight:700, color:'#1a5e78', letterSpacing:'0.04em' }}>Outil d'analyse documentaire immobilier</span>
          </div>
          <h1 style={{ fontSize:'clamp(34px,4.5vw,58px)', fontWeight:900, lineHeight:1.08, color:'#0f2d3d', marginBottom:22, letterSpacing:'-0.02em' }}>
            Comprenez vos documents<br />immobiliers{' '}
            <span style={{ color:'#2a7d9c' }}>avant d'acheter.</span>
          </h1>
          <p style={{ fontSize:18, color:'#4a6b7c', lineHeight:1.75, marginBottom:36, maxWidth:490 }}>
            Analymo décrypte vos PV d'AG, règlements de copropriété, diagnostics et appels de charges. Obtenez un rapport clair avec scores, risques et recommandation — en moins de 2 minutes.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:40 }}>
            <Link to="/tarifs" style={{ padding:'15px 34px', borderRadius:14, fontSize:16, fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#2a7d9c,#0f2d3d)', textDecoration:'none', display:'flex', alignItems:'center', gap:8, boxShadow:'0 6px 28px rgba(42,125,156,0.35)', transition:'transform .2s' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='translateY(0)'}>
              Lancer une analyse <ChevronRight size={18} />
            </Link>
            <Link to="/exemple" style={{ padding:'15px 26px', borderRadius:14, fontSize:16, fontWeight:600, color:'#2a7d9c', border:'1.5px solid rgba(42,125,156,0.3)', textDecoration:'none', background:'#fff', transition:'all .2s' }}>
              Voir un exemple →
            </Link>
          </div>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {[['⚡','Résultats en 2 min'],['🔒','Données sécurisées'],['📄','Sans jargon']].map(([ic,t])=>(
              <div key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#7a9aaa', fontWeight:500 }}>
                <span>{ic}</span>{t}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Report card */}
        <div style={{ display:'flex', justifyContent:'center' }}>
          <ReportCard />
        </div>
      </div>
    </section>
  );
}

function ReportCard() {
  return (
    <div style={{ position:'relative' }} className="float">
      {/* shadow glow */}
      <div style={{ position:'absolute', inset:-16, borderRadius:32, background:'rgba(42,125,156,0.08)', filter:'blur(20px)' }} />
      <div style={{ width:310, background:'#fff', borderRadius:24, padding:24, boxShadow:'0 24px 64px rgba(15,45,61,0.14)', position:'relative', overflow:'hidden', border:'1px solid rgba(42,125,156,0.07)' }}>
        {/* scan line */}
        <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(42,125,156,0.6),transparent)', zIndex:5, top:0 }} className="scan" />

        {/* header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div>
            <div style={{ fontSize:10, color:'#7a9aaa', fontWeight:700, letterSpacing:'0.08em', marginBottom:2 }}>ANALYMO</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#0f2d3d' }}>Rapport d'analyse</div>
          </div>
          <div style={{ padding:'5px 12px', borderRadius:8, background:'#ecfdf5', border:'1px solid #a7f3d0', fontSize:11, fontWeight:700, color:'#065f46' }}>✓ Terminé</div>
        </div>

        {/* score */}
        <div style={{ background:'linear-gradient(135deg,#eaf4f8,#f0f8fc)', borderRadius:16, padding:'18px 16px', textAlign:'center', marginBottom:16, border:'1px solid rgba(42,125,156,0.1)' }}>
          <div style={{ fontSize:10, color:'#7a9aaa', fontWeight:700, letterSpacing:'0.08em', marginBottom:6 }}>SCORE GLOBAL</div>
          <div style={{ fontSize:56, fontWeight:900, color:'#f0a500', lineHeight:1, marginBottom:4 }}>78</div>
          <div style={{ fontSize:12, color:'#7a9aaa' }}>sur 100 · Recommandation : Négocier</div>
        </div>

        {/* score bars */}
        {[{l:'Financier',s:68,c:'#f0a500'},{l:'Travaux',s:62,c:'#fb923c'},{l:'Juridique',s:88,c:'#22c55e'},{l:'Charges',s:80,c:'#2a7d9c'}].map(sc=>(
          <div key={sc.l} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:12, color:'#4a6b7c', fontWeight:500 }}>{sc.l}</span>
              <span style={{ fontSize:12, fontWeight:700, color:sc.c }}>{sc.s}</span>
            </div>
            <div style={{ height:5, borderRadius:3, background:'#f0f4f6' }}>
              <div style={{ width:`${sc.s}%`, height:'100%', borderRadius:3, background:sc.c }} />
            </div>
          </div>
        ))}

        {/* alert */}
        <div style={{ marginTop:14, padding:'10px 12px', borderRadius:10, background:'#fffbeb', border:'1px solid #fde68a', display:'flex', gap:8, alignItems:'flex-start' }}>
          <AlertTriangle size={14} color="#d97706" style={{ flexShrink:0, marginTop:1 }} />
          <span style={{ fontSize:11, color:'#92400e', lineHeight:1.5 }}>Ravalement voté — part estimée ~2 400€ en 2026</span>
        </div>
      </div>

      {/* floating labels */}
      <div style={{ position:'absolute', right:-40, top:'18%', padding:'9px 14px', borderRadius:12, background:'#fff', boxShadow:'0 8px 28px rgba(15,45,61,0.12)', fontSize:12, fontWeight:600, color:'#22c55e', display:'flex', alignItems:'center', gap:6, border:'1px solid #dcfce7', whiteSpace:'nowrap' }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} /> Analyse complète
      </div>
      <div style={{ position:'absolute', left:-50, bottom:'22%', padding:'9px 14px', borderRadius:12, background:'#fff', boxShadow:'0 8px 28px rgba(15,45,61,0.12)', fontSize:12, fontWeight:600, color:'#f0a500', border:'1px solid #fef3c7', whiteSpace:'nowrap' }}>
        ⚡ 1 min 47s
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   STATS
════════════════════════════════════════════════════════════ */
function Stats() {
  const { ref, inView } = useInView();
  const data = [
    { value:200, suffix:'+', label:'analyses réalisées', icon:<FileText size={20}/>, color:'#2a7d9c', bg:'#eaf4f8' },
    { value:2, suffix:' min', label:'temps moyen d\'analyse', icon:<Clock size={20}/>, color:'#f0a500', bg:'#fffbeb' },
    { value:98, suffix:'%', label:'clients satisfaits', icon:<Star size={20}/>, color:'#22c55e', bg:'#f0fdf4' },
    { value:8000, suffix:'€', label:'économisés en moyenne', icon:<TrendingUp size={20}/>, color:'#8b5cf6', bg:'#f5f3ff' },
  ];
  return (
    <section ref={ref} style={{ padding:'56px 24px', background:'#fff', borderBottom:'1px solid #f0f4f6' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }} className="stats-grid">
        {data.map((d,i)=>{
          const count = useCounter(d.value, 1800, inView);
          return (
            <div key={i} className="card-hover" style={{ padding:'28px 20px', borderRadius:20, background:d.bg, border:`1px solid ${d.color}20`, textAlign:'center', opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(16px)', transition:`all .5s ease ${i*100}ms` }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', color:d.color, margin:'0 auto 14px', boxShadow:`0 4px 12px ${d.color}20` }}>{d.icon}</div>
              <div style={{ fontSize:38, fontWeight:900, color:'#0f2d3d', lineHeight:1, marginBottom:6 }}>
                {d.suffix==='€'?'~':''}{count.toLocaleString('fr-FR')}{d.suffix}
              </div>
              <div style={{ fontSize:13, color:'#7a9aaa', fontWeight:500 }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   WHY — style image 1
════════════════════════════════════════════════════════════ */
function Why() {
  const { ref, inView } = useInView(0.1);
  return (
    <section ref={ref} style={{ padding:'96px 24px', background:'#f8fafc' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }} className="why-grid">
        {/* LEFT: feature cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:16, opacity:inView?1:0, transform:inView?'translateX(0)':'translateX(-24px)', transition:'all .7s ease' }}>
          {[
            { icon:<Shield size={22}/>, title:'Sécurité maximale', text:'Vos données sont chiffrées et anonymisées. Jamais revendues.', color:'#2a7d9c', bg:'#eaf4f8' },
            { icon:<Zap size={22}/>, title:'Rapidité inégalée', text:"Analyse complète d'un dossier en moins de 2 minutes, 24h/24.", color:'#f0a500', bg:'#fffbeb' },
            { icon:<Star size={22}/>, title:'Précision documentaire', text:'Détection des travaux votés, clauses abusives et risques financiers.', color:'#8b5cf6', bg:'#f5f3ff' },
          ].map((f,i)=>(
            <div key={i} className="card-hover" style={{ display:'flex', alignItems:'center', gap:18, padding:'20px 22px', borderRadius:16, background:'#fff', boxShadow:'0 2px 16px rgba(15,45,61,0.06)', border:'1px solid #f0f4f6' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', color:f.color, flexShrink:0 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#0f2d3d', marginBottom:4 }}>{f.title}</div>
                <div style={{ fontSize:13, color:'#7a9aaa', lineHeight:1.5 }}>{f.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: text */}
        <div style={{ opacity:inView?1:0, transform:inView?'translateX(0)':'translateX(24px)', transition:'all .7s ease .15s' }}>
          <div style={{ display:'inline-block', padding:'6px 16px', borderRadius:100, background:'#eaf4f8', border:'1px solid rgba(42,125,156,0.2)', fontSize:13, fontWeight:700, color:'#1a5e78', marginBottom:20 }}>Pourquoi choisir Analymo ?</div>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:900, color:'#0f2d3d', marginBottom:18, letterSpacing:'-0.02em', lineHeight:1.15 }}>
            L'achat d'une vie mérite<br />une analyse sérieuse.
          </h2>
          <p style={{ fontSize:16, color:'#4a6b7c', lineHeight:1.8, marginBottom:28 }}>
            L'achat d'un bien immobilier est souvent l'investissement d'une vie. Ne laissez pas une lecture rapide de documents complexes compromettre votre avenir financier.
          </p>
          {['Identification des travaux votés ou à prévoir','Analyse de la santé financière de la copropriété','Détection des procédures judiciaires en cours','Vérification de la conformité des diagnostics'].map(item=>(
            <div key={item} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <CheckCircle size={18} color="#22c55e" style={{ flexShrink:0 }} />
              <span style={{ fontSize:15, color:'#0f2d3d', fontWeight:500 }}>{item}</span>
            </div>
          ))}
          <Link to="/tarifs" style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:28, padding:'14px 30px', borderRadius:14, background:'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color:'#fff', fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 6px 24px rgba(42,125,156,0.3)' }}>
            Commencer maintenant <ChevronRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   FOR WHO — style image 2
════════════════════════════════════════════════════════════ */
function ForWho() {
  const { ref, inView } = useInView(0.1);
  return (
    <section ref={ref} style={{ padding:'96px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <SectionBadge>Pour qui est fait Analymo ?</SectionBadge>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:'#0f2d3d', marginBottom:12, letterSpacing:'-0.02em' }}>Pour qui est fait Analymo ?</h2>
          <p style={{ fontSize:17, color:'#7a9aaa' }}>Une solution adaptée à chaque acteur de l'immobilier.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap:20 }} className="forwho-grid">
          {/* Main card */}
          <div className="card-hover" style={{ padding:'36px 32px', borderRadius:24, background:'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color:'#fff', opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(20px)', transition:'all .6s ease' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:26 }}>⭐</div>
            <h3 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:14 }}>Acheteurs Particuliers</h3>
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.7, marginBottom:24 }}>
              Ne faites pas d'erreur coûteuse. Analymo décrypte pour vous la santé financière de la copropriété et les travaux à venir. Sécurisez votre achat.
            </p>
            {['Comprendre les PV d\'AG sans effort','Anticiper les gros travaux','Vérifier la santé financière','Acheter l\'esprit tranquille'].map(item=>(
              <div key={item} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <CheckCircle size={16} color="#4ade80" style={{ flexShrink:0 }} />
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.85)' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Right grid */}
          <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap:20 }}>
            {[
              { icon:<Shield size={22}/>, title:'Notaires', text:'Accélérez la préparation de vos dossiers et offrez une valeur ajoutée à vos clients.', color:'#2a7d9c', bg:'#eaf4f8' },
              { icon:<Building2 size={22}/>, title:'Syndics', text:'Facilitez la transmission des informations lors des ventes et valorisez votre gestion.', color:'#8b5cf6', bg:'#f5f3ff' },
            ].map((a,i)=>(
              <div key={i} className="card-hover" style={{ padding:'24px', borderRadius:20, background:'#f8fafc', border:'1px solid #f0f4f6', boxShadow:'0 2px 12px rgba(15,45,61,0.05)', opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(20px)', transition:`all .6s ease ${i*100+150}ms` }}>
                <div style={{ width:44, height:44, borderRadius:12, background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', color:a.color, marginBottom:14 }}>{a.icon}</div>
                <h4 style={{ fontSize:17, fontWeight:700, color:'#0f2d3d', marginBottom:8 }}>{a.title}</h4>
                <p style={{ fontSize:13, color:'#7a9aaa', lineHeight:1.6 }}>{a.text}</p>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap:20 }}>
            {[
              { icon:<UserCheck size={22}/>, title:'Agents Immobiliers', text:'Valorisez votre devoir de conseil et instaurez une confiance totale avec vos acquéreurs.', color:'#f0a500', bg:'#fffbeb' },
              { icon:<BadgeCheck size={22}/>, title:'Marchands de biens', text:'Optimisez vos audits d\'acquisition et identifiez instantanément le potentiel ou les risques.', color:'#22c55e', bg:'#f0fdf4' },
            ].map((a,i)=>(
              <div key={i} className="card-hover" style={{ padding:'24px', borderRadius:20, background:'#f8fafc', border:'1px solid #f0f4f6', boxShadow:'0 2px 12px rgba(15,45,61,0.05)', opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(20px)', transition:`all .6s ease ${i*100+250}ms` }}>
                <div style={{ width:44, height:44, borderRadius:12, background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', color:a.color, marginBottom:14 }}>{a.icon}</div>
                <h4 style={{ fontSize:17, fontWeight:700, color:'#0f2d3d', marginBottom:8 }}>{a.title}</h4>
                <p style={{ fontSize:13, color:'#7a9aaa', lineHeight:1.6 }}>{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   HOW IT WORKS — style image 3
════════════════════════════════════════════════════════════ */
function HowItWorks() {
  const { ref, inView } = useInView(0.1);
  const steps = [
    { n:'01', icon:<FileText size={24}/>, title:'Importez vos documents', text:"Déposez vos PV d'AG, règlements de copropriété ou diagnostics techniques. PDF, Word ou image.", color:'#2a7d9c', bg:'linear-gradient(135deg,#2a7d9c,#1a5e78)' },
    { n:'02', icon:<Search size={24}/>, title:'Audit par algorithme', text:'Notre moteur scanne chaque ligne pour détecter les risques cachés, les charges futures et les travaux votés.', color:'#0f2d3d', bg:'linear-gradient(135deg,#0f2d3d,#1a4a60)' },
    { n:'03', icon:<CheckCircle size={24}/>, title:'Rapport détaillé', text:'Recevez une synthèse claire avec un score de fiabilité, des points de vigilance et des conseils personnalisés.', color:'#22c55e', bg:'linear-gradient(135deg,#16a34a,#15803d)' },
  ];
  return (
    <section ref={ref} id="comment" style={{ padding:'96px 24px', background:'#f8fafc' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <SectionBadge>En 3 étapes</SectionBadge>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:'#0f2d3d', marginBottom:12, letterSpacing:'-0.02em' }}>Comment ça marche ?</h2>
          <p style={{ fontSize:17, color:'#7a9aaa' }}>Trois étapes simples pour sécuriser votre investissement immobilier.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }} className="steps-grid">
          {steps.map((s,i)=>(
            <div key={i} className="card-hover" style={{ padding:'32px 28px', borderRadius:24, background:'#fff', boxShadow:'0 4px 24px rgba(15,45,61,0.07)', border:'1px solid #f0f4f6', opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(24px)', transition:`all .6s ease ${i*150}ms` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
                <div style={{ width:56, height:56, borderRadius:16, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>{s.icon}</div>
                <span style={{ fontSize:40, fontWeight:900, color:'#f0f4f6', letterSpacing:'-0.02em' }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize:19, fontWeight:800, color:'#0f2d3d', marginBottom:12 }}>{s.title}</h3>
              <p style={{ fontSize:14, color:'#7a9aaa', lineHeight:1.7 }}>{s.text}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:48 }}>
          <Link to="/tarifs" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 36px', borderRadius:14, background:'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color:'#fff', fontSize:16, fontWeight:700, textDecoration:'none', boxShadow:'0 6px 28px rgba(42,125,156,0.3)' }}>
            Essayer maintenant — dès 4,99€ <ChevronRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SECURITY — style image 4
════════════════════════════════════════════════════════════ */
function Security() {
  const { ref, inView } = useInView(0.1);
  const items = [
    { icon:<Shield size={26}/>, title:'Confidentiel', text:'Vos documents sont analysés puis supprimés. Aucune donnée n\'est revendue ou partagée.', color:'#22c55e', bg:'#f0fdf4', border:'#bbf7d0' },
    { icon:<svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title:'Sécurisé', text:'Chiffrement de bout en bout et infrastructure bancaire pour vos paiements.', color:'#2a7d9c', bg:'#eaf4f8', border:'#bae6fd' },
    { icon:<Zap size={26}/>, title:'Rapide', text:'Obtenez votre rapport complet en moins d\'une minute, 24h/24 et 7j/7.', color:'#f0a500', bg:'#fffbeb', border:'#fde68a' },
  ];
  return (
    <section ref={ref} style={{ padding:'96px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <SectionBadge>Fiabilité</SectionBadge>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:'#0f2d3d', marginBottom:12, letterSpacing:'-0.02em' }}>Une sécurité sans compromis</h2>
          <p style={{ fontSize:17, color:'#7a9aaa', maxWidth:560, margin:'0 auto' }}>Nous utilisons les meilleures technologies pour protéger vos données et vous offrir une analyse fiable.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }} className="sec-grid">
          {items.map((it,i)=>(
            <div key={i} className="card-hover" style={{ padding:'36px 28px', borderRadius:24, background:it.bg, border:`1px solid ${it.border}`, textAlign:'center', opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(20px)', transition:`all .5s ease ${i*130}ms` }}>
              <div style={{ width:64, height:64, borderRadius:18, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', color:it.color, margin:'0 auto 22px', boxShadow:`0 4px 16px ${it.color}20` }}>{it.icon}</div>
              <h3 style={{ fontSize:20, fontWeight:800, color:'#0f2d3d', marginBottom:10 }}>{it.title}</h3>
              <p style={{ fontSize:14, color:'#4a6b7c', lineHeight:1.7 }}>{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   AVANT / APRÈS
════════════════════════════════════════════════════════════ */
function AvantApres() {
  const { ref, inView } = useInView(0.1);
  const before = [['😰',"40 pages de PV d'AG à déchiffrer seul"],['🤯','Jargon juridique incompréhensible'],['⏳','Des heures perdues à chercher l\'info clé'],['😬','Signer sans vraiment savoir ce qu\'on achète'],['💸','Découvrir les travaux APRÈS la signature']];
  const after = [['✅','Rapport clair en moins de 2 minutes'],['🎯','Points clés mis en avant, rien à chercher'],['🔍','Travaux, charges, risques — tout est détecté'],['💪','Achetez en confiance, offre négociée'],['💰','Économisez des milliers d\'euros en amont']];
  return (
    <section ref={ref} style={{ padding:'96px 24px', background:'#f8fafc' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <SectionBadge>Avant / Après</SectionBadge>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:'#0f2d3d', marginBottom:12, letterSpacing:'-0.02em' }}>Deux façons d'acheter un bien.</h2>
          <p style={{ fontSize:17, color:'#7a9aaa' }}>L'une vous coûte du temps et de l'argent. L'autre, non.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:28, alignItems:'center' }} className="av-grid">
          <div style={{ padding:'32px', borderRadius:24, background:'#fff', border:'1px solid #fee2e2', boxShadow:'0 4px 20px rgba(239,68,68,0.06)', opacity:inView?1:0, transform:inView?'translateX(0)':'translateX(-24px)', transition:'all .7s ease' }}>
            <div style={{ display:'inline-block', padding:'5px 16px', borderRadius:100, background:'#fee2e2', color:'#b91c1c', fontSize:12, fontWeight:700, marginBottom:20 }}>Sans Analymo</div>
            {before.map(([ic,t],i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:i<before.length-1?'1px solid #fef2f2':'none' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{ic}</span>
                <span style={{ fontSize:14, color:'#6b7280' }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#2a7d9c,#f0a500)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff', flexShrink:0, boxShadow:'0 4px 16px rgba(42,125,156,0.3)' }}>VS</div>
          <div style={{ padding:'32px', borderRadius:24, background:'#fff', border:'1px solid #bae6fd', boxShadow:'0 4px 20px rgba(42,125,156,0.08)', opacity:inView?1:0, transform:inView?'translateX(0)':'translateX(24px)', transition:'all .7s ease .15s' }}>
            <div style={{ display:'inline-block', padding:'5px 16px', borderRadius:100, background:'#e0f2fe', color:'#0369a1', fontSize:12, fontWeight:700, marginBottom:20 }}>Avec Analymo</div>
            {after.map(([ic,t],i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:i<after.length-1?'1px solid #f0f9ff':'none' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{ic}</span>
                <span style={{ fontSize:14, color:'#0f2d3d', fontWeight:500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   TESTIMONIALS
════════════════════════════════════════════════════════════ */
function Testimonials() {
  const testimonials = [
    { name:'Marie L.', role:'Primo-accédante, Lyon', initials:'ML', color:'#2a7d9c', text:"Analymo m'a signalé un ravalement prévu à 12 000€ non provisionné. J'ai renégocié le prix à la baisse. Inestimable avant une signature." },
    { name:'Thomas R.', role:'Investisseur, Paris', initials:'TR', color:'#0f2d3d', text:"Je regarde 5 à 10 biens par mois. Avant Analymo, 3h par dossier. Maintenant 15 minutes. Le ROI est évident dès le premier mois." },
    { name:'Sophie D.', role:'Acheteuse, Bordeaux', initials:'SD', color:'#0f6e56', text:"Le rapport est clair, structuré, avec des scores par catégorie. Mon notaire a été impressionné. À recommander sans hésiter." },
    { name:'Céline B.', role:'Première acquisition, Nantes', initials:'CB', color:'#7c3aed', text:"Mon notaire m'avait dit de lire le règlement. 80 pages. Analymo l'a analysé en 90 secondes et sorti les 3 points importants pour moi." },
    { name:'Pierre M.', role:'Gestionnaire, Marseille', initials:'PM', color:'#d97706', text:"On utilise Analymo pour tous nos dossiers clients. 20 minutes de réunion au lieu de 2 heures. Un outil devenu indispensable." },
    { name:'Antoine G.', role:'Investisseur locatif, Toulouse', initials:'AG', color:'#dc2626', text:"La comparaison entre 2 biens est bluffante. Analymo a identifié que l'un avait des charges 40% plus élevées. Choix évident ensuite." },
  ];
  return (
    <section style={{ padding:'96px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <SectionBadge>Avis clients</SectionBadge>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:'#0f2d3d', marginBottom:12, letterSpacing:'-0.02em' }}>Ils nous font confiance.</h2>
          <p style={{ fontSize:17, color:'#7a9aaa' }}>Des acheteurs qui ont pris de meilleures décisions grâce à Analymo.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }} className="testi-grid">
          {testimonials.map((t,i)=>(
            <div key={i} className="card-hover" style={{ padding:'26px', borderRadius:20, background:'#f8fafc', border:'1px solid #f0f4f6', boxShadow:'0 2px 12px rgba(15,45,61,0.04)' }}>
              <div style={{ display:'flex', gap:3, marginBottom:14 }}>
                {[0,1,2,3,4].map(j=><Star key={j} size={14} fill="#f0a500" color="#f0a500" />)}
              </div>
              <p style={{ fontSize:14, color:'#4a6b7c', lineHeight:1.75, marginBottom:18, fontStyle:'italic' }}>"{t.text}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#0f2d3d' }}>{t.name}</div>
                  <div style={{ fontSize:12, color:'#7a9aaa' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   PRICING
════════════════════════════════════════════════════════════ */
function Pricing() {
  return (
    <section id="tarifs" style={{ padding:'96px 24px', background:'#f8fafc' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <SectionBadge>Tarification transparente</SectionBadge>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:'#0f2d3d', marginBottom:12, letterSpacing:'-0.02em' }}>Investissez en toute sérénité.</h2>
          <p style={{ fontSize:17, color:'#7a9aaa' }}>Des tarifs simples pour sécuriser votre futur chez-vous.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }} className="price-grid">
          {PRICING_PLANS.map(plan=>(
            <div key={plan.id} className="card-hover" style={{ padding:'30px 26px', borderRadius:24, background:'#fff', border:plan.highlighted?'2px solid #2a7d9c':'1px solid #f0f4f6', position:'relative', boxShadow:plan.highlighted?'0 12px 40px rgba(42,125,156,0.15)':'0 4px 20px rgba(15,45,61,0.06)' }}>
              {plan.badge&&<div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', padding:'5px 16px', borderRadius:100, fontSize:11, fontWeight:700, whiteSpace:'nowrap', background:plan.badgeColor==='teal'?'linear-gradient(135deg,#2a7d9c,#0f2d3d)':'#f0a500', color:plan.badgeColor==='teal'?'#fff':'#0f2d3d' }}>{plan.badge}</div>}
              <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
                <div style={{ width:56, height:56, borderRadius:16, background:plan.highlighted?'linear-gradient(135deg,#eaf4f8,#d0eaf5)':'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, border:`1px solid ${plan.highlighted?'rgba(42,125,156,0.2)':'#f0f4f6'}` }}>{plan.icon}</div>
              </div>
              <h3 style={{ fontSize:18, fontWeight:700, color:'#0f2d3d', textAlign:'center', marginBottom:8 }}>{plan.name}</h3>
              <div style={{ textAlign:'center', marginBottom:18 }}>
                <span style={{ fontSize:42, fontWeight:900, color:'#0f2d3d' }}>{plan.price.toFixed(2).replace('.',',')}</span>
                <span style={{ fontSize:17, color:'#7a9aaa' }}>€</span>
              </div>
              <div style={{ padding:'10px 14px', borderRadius:10, background:plan.highlighted?'#eaf4f8':'#f8fafc', border:`1px solid ${plan.highlighted?'rgba(42,125,156,0.15)':'#f0f4f6'}`, marginBottom:18 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#2a7d9c', letterSpacing:'0.08em', marginBottom:3 }}>+ IDÉAL POUR</div>
                <div style={{ fontSize:12, color:'#4a6b7c', lineHeight:1.4 }}>{plan.idealFor}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:24 }}>
                {plan.features.map(f=>(
                  <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <CheckCircle2 size={15} color="#22c55e" style={{ flexShrink:0, marginTop:1 }}/>
                    <span style={{ fontSize:13, color:'#4a6b7c', lineHeight:1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to={`/inscription?plan=${plan.id}`} style={{ display:'block', padding:'13px 0', borderRadius:12, fontSize:15, fontWeight:700, color:plan.highlighted?'#fff':'#0f2d3d', background:plan.highlighted?'linear-gradient(135deg,#2a7d9c,#0f2d3d)':'transparent', border:plan.highlighted?'none':'2px solid #0f2d3d', textDecoration:'none', textAlign:'center', boxShadow:plan.highlighted?'0 6px 20px rgba(42,125,156,0.3)':'none' }}>{plan.cta}</Link>
            </div>
          ))}
        </div>
        <div style={{ marginTop:28, padding:'26px 32px', borderRadius:20, background:'linear-gradient(135deg,#0f2d3d,#1a4a60)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <Crown size={22} color="#f0a500"/>
            <div>
              <h3 style={{ color:'#fff', fontSize:17, fontWeight:700, marginBottom:2 }}>Offre Professionnelle</h3>
              <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13 }}>Notaires, agents, syndics — volumes illimités, accès dédié, support prioritaire.</p>
            </div>
          </div>
          <Link to="/contact" style={{ padding:'12px 24px', borderRadius:12, fontSize:14, fontWeight:700, color:'#0f2d3d', background:'#f0a500', textDecoration:'none', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(240,165,0,0.4)' }}>
            <Mail size={15}/> Nous contacter
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   CTA FINAL
════════════════════════════════════════════════════════════ */
function CtaFinal() {
  return (
    <section style={{ padding:'96px 24px', background:'linear-gradient(135deg,#0f2d3d 0%,#2a7d9c 100%)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-80, right:-80, width:360, height:360, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-60, left:-60, width:260, height:260, borderRadius:'50%', background:'rgba(240,165,0,0.08)', pointerEvents:'none' }} />
      <div style={{ maxWidth:640, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
        <h2 style={{ fontSize:'clamp(28px,4.5vw,50px)', fontWeight:900, color:'#fff', marginBottom:16, letterSpacing:'-0.02em', lineHeight:1.1 }}>
          Votre prochain bien mérite une analyse complète.
        </h2>
        <p style={{ fontSize:17, color:'rgba(255,255,255,0.65)', lineHeight:1.7, marginBottom:44 }}>
          Rejoignez les acheteurs qui décident avec les bons éléments. Dès 4,99€, en moins de 2 minutes.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/tarifs" style={{ padding:'16px 44px', borderRadius:14, fontSize:16, fontWeight:700, color:'#0f2d3d', background:'#fff', textDecoration:'none', display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
            Commencer maintenant <ChevronRight size={18}/>
          </Link>
          <Link to="/exemple" style={{ padding:'16px 30px', borderRadius:14, fontSize:16, fontWeight:600, color:'rgba(255,255,255,0.85)', border:'1.5px solid rgba(255,255,255,0.3)', textDecoration:'none' }}>
            Voir un exemple
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Shared badge ────────────────────────────────────────── */
function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'inline-block', padding:'6px 18px', borderRadius:100, background:'#eaf4f8', border:'1px solid rgba(42,125,156,0.2)', fontSize:13, fontWeight:700, color:'#1a5e78', marginBottom:18 }}>
      {children}
    </div>
  );
}

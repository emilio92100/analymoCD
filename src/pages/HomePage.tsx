import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Zap, FileSearch, Upload, Search, FileText, CheckCircle, Star, Users, Building2, BadgeCheck, UserCheck, CheckCircle2, Crown, Mail, ArrowRight, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { PRICING_PLANS } from '../types';

function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function DarkHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 100, background: 'rgba(42,125,156,0.1)', border: '1px solid rgba(42,125,156,0.25)', fontSize: 13, fontWeight: 700, color: '#7dd3ed', marginBottom: 20 }}>{badge}</div>
      <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{title}</h2>
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main style={{ background: '#040d14', overflow: 'hidden' }}>
      <Hero />
      <Stats />
      <AvantApres />
      <Why />
      <Demo />
      <ForWho />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CtaFinal />
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes scanline { 0%{top:0%;opacity:0} 5%{opacity:1} 45%{opacity:1} 50%{top:100%;opacity:0} 51%{top:0%;opacity:0} 100%{top:100%;opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-spin { animation: spin 1s linear infinite; }
        .anim-pulse { animation: pulse 2s ease-in-out infinite; }
        .scan { animation: scanline 4s linear infinite; }
        @media(max-width:767px){ .hero-grid{grid-template-columns:1fr!important;gap:40px!important} .av-grid{grid-template-columns:1fr!important} .demo-sc{grid-template-columns:repeat(2,1fr)!important} }
      `}</style>
    </main>
  );
}

function Hero() {
  return (
    <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', position:'relative', paddingTop:90, overflow:'hidden', background:'linear-gradient(135deg,#040d14 0%,#071a2a 50%,#0a2640 100%)' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'5%', left:'8%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(42,125,156,0.18) 0%,transparent 70%)', filter:'blur(40px)', animation:'float 8s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'10%', right:'5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(240,165,0,0.1) 0%,transparent 70%)', filter:'blur(50px)', animation:'float 10s ease-in-out infinite reverse' }} />
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.05 }}>
          <defs><pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2a7d9c" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'60px 24px', width:'100%', position:'relative', zIndex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }} className="hero-grid">
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:100, background:'rgba(42,125,156,0.12)', border:'1px solid rgba(42,125,156,0.35)', marginBottom:32, backdropFilter:'blur(10px)' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#3a9cbf', display:'inline-block', boxShadow:'0 0 8px #3a9cbf' }} className="anim-pulse" />
              <span style={{ fontSize:13, fontWeight:600, color:'#7dd3ed', letterSpacing:'0.06em' }}>Outil d'analyse documentaire immobilier</span>
            </div>
            <h1 style={{ fontSize:'clamp(36px,5vw,64px)', fontWeight:900, lineHeight:1.05, color:'#fff', marginBottom:28, letterSpacing:'-0.03em' }}>
              Lisez vos docs<br />immobiliers{' '}
              <span style={{ background:'linear-gradient(135deg,#3a9cbf,#f0a500)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>en 2 minutes.</span>
            </h1>
            <p style={{ fontSize:18, color:'rgba(255,255,255,0.6)', lineHeight:1.8, marginBottom:40, maxWidth:500 }}>
              Analymo décrypte vos PV d'AG, règlements de copropriété, diagnostics et appels de charges. Vous obtenez <strong style={{ color:'rgba(255,255,255,0.9)' }}>l'essentiel, clair et structuré</strong>, avant de signer.
            </p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:48 }}>
              <Link to="/tarifs" style={{ padding:'16px 36px', borderRadius:14, fontSize:16, fontWeight:700, color:'#040d14', background:'linear-gradient(135deg,#3a9cbf,#f0a500)', textDecoration:'none', display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 40px rgba(42,125,156,0.4)' }}>
                Analyser mes documents <ChevronRight size={18} />
              </Link>
              <Link to="/exemple" style={{ padding:'16px 28px', borderRadius:14, fontSize:16, fontWeight:600, color:'rgba(255,255,255,0.85)', border:'1px solid rgba(255,255,255,0.15)', textDecoration:'none', background:'rgba(255,255,255,0.05)', backdropFilter:'blur(10px)' }}>
                Voir un exemple →
              </Link>
            </div>
            <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
              {[{icon:<Zap size={14}/>,t:'Résultats en 2 min'},{icon:<Shield size={14}/>,t:'Données chiffrées'},{icon:<FileSearch size={14}/>,t:'Sans jargon'}].map(item=>(
                <div key={item.t} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:500 }}>
                  <span style={{ color:'#3a9cbf' }}>{item.icon}</span>{item.t}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center' }}><HeroCard /></div>
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div style={{ position:'relative' }} className="anim-float">
      <div style={{ position:'absolute', inset:-30, borderRadius:32, background:'radial-gradient(ellipse,rgba(42,125,156,0.25) 0%,transparent 70%)', filter:'blur(20px)' }} />
      <div style={{ width:300, borderRadius:24, background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.1)', padding:24, boxShadow:'0 40px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.1)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(58,156,191,0.8),transparent)', boxShadow:'0 0 12px rgba(58,156,191,0.6)', zIndex:10, top:0 }} className="scan" />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', marginBottom:3 }}>ANALYMO</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Rapport d'analyse</div>
          </div>
          <div style={{ padding:'5px 12px', borderRadius:8, background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', fontSize:11, fontWeight:700, color:'#4ade80' }}>✓ Terminé</div>
        </div>
        <div style={{ padding:'18px', borderRadius:16, background:'linear-gradient(135deg,rgba(42,125,156,0.2),rgba(240,165,0,0.1))', border:'1px solid rgba(255,255,255,0.08)', marginBottom:14, textAlign:'center' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', marginBottom:6 }}>SCORE GLOBAL</div>
          <div style={{ fontSize:58, fontWeight:900, color:'#f0a500', lineHeight:1, marginBottom:6, textShadow:'0 0 30px rgba(240,165,0,0.4)' }}>78</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>sur 100 · Négocier le prix</div>
        </div>
        {[{l:'Financier',s:68,c:'#f0a500'},{l:'Travaux',s:62,c:'#fb923c'},{l:'Juridique',s:88,c:'#4ade80'},{l:'Charges',s:80,c:'#3a9cbf'}].map(s=>(
          <div key={s.l} style={{ marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>{s.l}</span>
              <span style={{ fontSize:11, fontWeight:700, color:s.c }}>{s.s}</span>
            </div>
            <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)' }}>
              <div style={{ width:`${s.s}%`, height:'100%', borderRadius:2, background:`linear-gradient(90deg,${s.c}70,${s.c})`, boxShadow:`0 0 6px ${s.c}40` }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop:14, padding:'10px 12px', borderRadius:10, background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.25)', display:'flex', gap:8, alignItems:'flex-start' }}>
          <AlertTriangle size={13} color="#fb923c" style={{ flexShrink:0, marginTop:1 }} />
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>Ravalement voté — prévoir ~2 400€ en 2026</span>
        </div>
      </div>
      <div style={{ position:'absolute', right:-35, top:'15%', padding:'9px 14px', borderRadius:11, background:'rgba(4,13,20,0.92)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.1)', fontSize:12, fontWeight:600, color:'#4ade80', display:'flex', alignItems:'center', gap:6, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', whiteSpace:'nowrap' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block', boxShadow:'0 0 6px #4ade80' }} /> Analyse complète
      </div>
      <div style={{ position:'absolute', left:-45, bottom:'22%', padding:'9px 14px', borderRadius:11, background:'rgba(4,13,20,0.92)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.1)', fontSize:12, fontWeight:600, color:'#f0a500', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', whiteSpace:'nowrap' }}>
        ⚡ 1 min 47s
      </div>
    </div>
  );
}

function Stats() {
  const { ref, inView } = useInView();
  const data = [
    { value:200, suffix:'+', label:'analyses réalisées', icon:<FileText size={20}/> },
    { value:2, suffix:' min', label:"temps d'analyse moyen", icon:<Clock size={20}/> },
    { value:98, suffix:'%', label:'de clients satisfaits', icon:<Star size={20}/> },
    { value:8000, suffix:'€', label:'économisés en moyenne', icon:<TrendingUp size={20}/> },
  ];
  return (
    <section ref={ref} style={{ padding:'80px 24px', background:'linear-gradient(180deg,#040d14 0%,#071520 100%)', position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(42,125,156,0.5),transparent)' }} />
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20 }}>
          {data.map((d,i)=>{
            const count = useCounter(d.value, 2000, inView);
            return (
              <div key={i} style={{ padding:'28px', borderRadius:20, background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)', textAlign:'center', position:'relative', overflow:'hidden', opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(20px)', transition:`all 0.6s ease ${i*150}ms` }}>
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%,rgba(42,125,156,0.07) 0%,transparent 60%)' }} />
                <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,rgba(42,125,156,0.25),rgba(240,165,0,0.12))', border:'1px solid rgba(42,125,156,0.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'#3a9cbf', margin:'0 auto 16px' }}>{d.icon}</div>
                <div style={{ fontSize:44, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:6 }}>{d.suffix==='€'?'~':''}{count.toLocaleString('fr-FR')}{d.suffix}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:500 }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AvantApres() {
  const { ref, inView } = useInView(0.1);
  const before = ["40 pages de PV d'AG à déchiffrer seul","Jargon juridique incompréhensible","Des heures perdues à chercher l'info clé","Signer sans vraiment savoir ce qu'on achète","Découvrir les travaux APRÈS la signature"];
  const after = ["Rapport clair en moins de 2 minutes","Points clés mis en avant, rien à chercher","Travaux, charges, risques — tout est détecté","Achetez en confiance, offre négociée","Économisez des milliers d'euros en amont"];
  const icons_b = ['😰','🤯','⏳','😬','💸'];
  const icons_a = ['✅','🎯','🔍','💪','💰'];
  return (
    <section ref={ref} style={{ padding:'100px 24px', background:'#040d14', position:'relative' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <div style={{ display:'inline-block', padding:'6px 18px', borderRadius:100, background:'rgba(42,125,156,0.1)', border:'1px solid rgba(42,125,156,0.25)', fontSize:13, fontWeight:700, color:'#7dd3ed', marginBottom:20 }}>Avant / Après</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, color:'#fff', letterSpacing:'-0.02em', marginBottom:16 }}>Deux façons d'acheter un bien.</h2>
          <p style={{ fontSize:18, color:'rgba(255,255,255,0.45)' }}>L'une vous coûte du temps et de l'argent. L'autre, non.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:28, alignItems:'center' }} className="av-grid">
          <div style={{ padding:'32px', borderRadius:24, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', opacity:inView?1:0, transform:inView?'translateX(0)':'translateX(-30px)', transition:'all 0.7s ease' }}>
            <div style={{ padding:'7px 16px', borderRadius:100, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', fontSize:12, fontWeight:700, color:'#f87171', display:'inline-block', marginBottom:24 }}>Sans Analymo</div>
            {before.map((item,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:i<before.length-1?'1px solid rgba(239,68,68,0.07)':'none' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{icons_b[i]}</span>
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.4 }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#3a9cbf,#f0a500)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#040d14', boxShadow:'0 0 30px rgba(42,125,156,0.4)', flexShrink:0 }}>VS</div>
          <div style={{ padding:'32px', borderRadius:24, background:'rgba(42,125,156,0.06)', border:'1px solid rgba(42,125,156,0.25)', opacity:inView?1:0, transform:inView?'translateX(0)':'translateX(30px)', transition:'all 0.7s ease 0.15s' }}>
            <div style={{ padding:'7px 16px', borderRadius:100, background:'rgba(42,125,156,0.12)', border:'1px solid rgba(42,125,156,0.3)', fontSize:12, fontWeight:700, color:'#7dd3ed', display:'inline-block', marginBottom:24 }}>Avec Analymo</div>
            {after.map((item,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:i<after.length-1?'1px solid rgba(42,125,156,0.07)':'none' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{icons_a[i]}</span>
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.8)', lineHeight:1.4, fontWeight:500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Why() {
  const { ref, inView } = useInView(0.1);
  const reasons = [
    { icon:<FileText size={22}/>, title:"Des documents que personne ne lit vraiment", text:"Un PV d'AG peut faire 40 pages. Notre moteur d'analyse extrait l'essentiel en quelques secondes : travaux votés, finances de l'immeuble, points de vigilance.", grad:'rgba(42,125,156,0.15),rgba(42,125,156,0.04)' },
    { icon:<Shield size={22}/>, title:"Achetez sans mauvaise surprise", text:"Les vraies surprises arrivent après la signature : ravalement, fuite en toiture, conflits. Notre système les détecte avant que vous signiez.", grad:'rgba(240,165,0,0.12),rgba(240,165,0,0.03)' },
    { icon:<Zap size={22}/>, title:"Un moteur formé sur l'immobilier français", text:"Pas un simple résumé. Analymo comprend le jargon juridique, les normes de charges, les obligations légales. Un expert disponible 24h/24.", grad:'rgba(74,222,128,0.1),rgba(74,222,128,0.02)' },
    { icon:<FileSearch size={22}/>, title:"La clarté que personne n'a le temps de vous donner", text:"Votre notaire est excellent — mais il ne peut pas tout expliquer. Analymo si. En 2 minutes, pour 4,99€.", grad:'rgba(251,146,60,0.1),rgba(251,146,60,0.02)' },
  ];
  return (
    <section ref={ref} id="pourquoi" style={{ padding:'100px 24px', background:'linear-gradient(180deg,#040d14 0%,#06111c 100%)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <DarkHeader badge="Pourquoi Analymo ?" title="L'immo, c'est le plus grand achat de votre vie." subtitle="Ne le faites pas les yeux fermés." />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20, marginTop:64 }}>
          {reasons.map((r,i)=>(
            <div key={i} style={{ padding:30, borderRadius:24, background:`linear-gradient(135deg,${r.grad})`, border:'1px solid rgba(255,255,255,0.07)', opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(24px)', transition:`all 0.6s ease ${i*100}ms` }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#3a9cbf', marginBottom:18 }}>{r.icon}</div>
              <h3 style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:10, lineHeight:1.3 }}>{r.title}</h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Demo() {
  const [active, setActive] = useState(0);
  useEffect(() => { const t = setInterval(()=>setActive(s=>(s+1)%3), 3000); return ()=>clearInterval(t); }, []);
  const steps = [
    { label:'Déposez vos documents', icon:'📁', desc:"PV d'AG, règlement, diagnostics..." },
    { label:'Analyse en cours', icon:'⚙️', desc:'Extraction et structuration des données' },
    { label:'Rapport disponible', icon:'📊', desc:'Score, risques, recommandation' },
  ];
  return (
    <section style={{ padding:'80px 24px', background:'#06111c', position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(240,165,0,0.25),transparent)' }} />
      <div style={{ maxWidth:860, margin:'0 auto' }}>
        <DarkHeader badge="En pratique" title="Voir Analymo en action." subtitle="En 3 étapes simples, passez de documents bruts à une décision éclairée." />
        <div style={{ marginTop:56, padding:'40px', borderRadius:28, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(20px)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 100%,rgba(42,125,156,0.07) 0%,transparent 60%)' }} />
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:40, position:'relative', zIndex:1, flexWrap:'wrap' }}>
            {steps.map((s,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div onClick={()=>setActive(i)} style={{ padding:'16px 20px', borderRadius:14, background:active===i?'rgba(42,125,156,0.15)':'transparent', border:active===i?'1px solid rgba(42,125,156,0.3)':'1px solid transparent', cursor:'pointer', textAlign:'center', transition:'all 0.3s', minWidth:160 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:active===i?'#7dd3ed':'rgba(255,255,255,0.35)', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>{s.desc}</div>
                </div>
                {i<2 && <ArrowRight size={16} color="rgba(255,255,255,0.2)" style={{ flexShrink:0 }} />}
              </div>
            ))}
          </div>
          <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.07)', marginBottom:32, position:'relative', zIndex:1 }}>
            <div style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg,#3a9cbf,#f0a500)', width:`${((active+1)/3)*100}%`, transition:'width 0.5s ease', boxShadow:'0 0 8px rgba(58,156,191,0.5)' }} />
          </div>
          <div style={{ position:'relative', zIndex:1, minHeight:80 }}>
            {active===0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {["PV d'AG 2023 — 24 pages","Règlement copro — 68 pages","DPE + Diagnostics — 12 pages"].map((doc,i)=>(
                  <div key={i} style={{ padding:'14px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16 }}>📄</span><span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>{doc}</span>
                  </div>
                ))}
              </div>
            )}
            {active===1 && (
              <div style={{ textAlign:'center', padding:'12px 0' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid rgba(42,125,156,0.3)', borderTopColor:'#3a9cbf', margin:'0 auto 16px' }} className="anim-spin" />
                <p style={{ fontSize:15, color:'rgba(255,255,255,0.45)' }}>Lecture de 104 pages en cours...</p>
                <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16, flexWrap:'wrap' }}>
                  {['Extraction','Détection des risques','Calcul scores'].map(t=>(
                    <div key={t} style={{ padding:'5px 12px', borderRadius:8, background:'rgba(42,125,156,0.1)', border:'1px solid rgba(42,125,156,0.2)', fontSize:12, color:'#7dd3ed' }}>{t}</div>
                  ))}
                </div>
              </div>
            )}
            {active===2 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }} className="demo-sc">
                {[{l:'Global',v:78,c:'#f0a500'},{l:'Financier',v:68,c:'#fb923c'},{l:'Travaux',v:62,c:'#f87171'},{l:'Juridique',v:88,c:'#4ade80'}].map(s=>(
                  <div key={s.l} style={{ padding:'14px 10px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', textAlign:'center' }}>
                    <div style={{ fontSize:30, fontWeight:900, color:s.c, marginBottom:4 }}>{s.v}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ForWho() {
  const audiences = [
    { icon:<UserCheck size={26}/>, title:'Primo-accédants', text:"Vous achetez pour la première fois ? Analymo vous explique ce qui compte, sans jargon.", tag:'★ Principal', tc:'#f0a500', hi:true },
    { icon:<Building2 size={26}/>, title:'Investisseurs', text:"Plusieurs biens à analyser en parallèle. Gagnez 3h par dossier.", tag:'Investisseurs', tc:'#3a9cbf', hi:false },
    { icon:<BadgeCheck size={26}/>, title:'Notaires & Agents', text:"Offrez un rapport Analymo à vos clients. Différenciez votre service.", tag:'Professionnels', tc:'#7dd3ed', hi:false },
    { icon:<Users size={26}/>, title:'Syndics', text:"Des dizaines de documents chaque semaine. Notre accès dédié s'adapte à vos volumes.", tag:'Syndics', tc:'#4ade80', hi:false },
  ];
  return (
    <section style={{ padding:'100px 24px', background:'#040d14' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <DarkHeader badge="Pour qui ?" title="Analymo, c'est fait pour vous." subtitle="Que vous achetiez votre premier appartement ou gériez un portefeuille immobilier." />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20, marginTop:64 }}>
          {audiences.map((a,i)=>(
            <div key={i} style={{ padding:'30px', borderRadius:24, background:a.hi?'linear-gradient(135deg,rgba(240,165,0,0.08),rgba(42,125,156,0.06))':'rgba(255,255,255,0.03)', border:a.hi?'1px solid rgba(240,165,0,0.25)':'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(10px)' }}>
              <div style={{ display:'inline-block', padding:'4px 12px', borderRadius:6, background:`${a.tc}15`, border:`1px solid ${a.tc}30`, fontSize:11, fontWeight:700, color:a.tc, marginBottom:18 }}>{a.tag}</div>
              <div style={{ color:'#3a9cbf', marginBottom:14 }}>{a.icon}</div>
              <h3 style={{ fontSize:19, fontWeight:700, color:'#fff', marginBottom:8 }}>{a.title}</h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n:'01', icon:<Upload size={18}/>, title:'Importez vos documents', text:"PV d'AG, règlements, diagnostics, appels de charges. PDF, Word ou image." },
    { n:'02', icon:<Search size={18}/>, title:'Notre moteur analyse', text:"Chaque page est lue, les informations cruciales extraites et classées." },
    { n:'03', icon:<FileText size={18}/>, title:'Recevez votre rapport', text:"Scores, points de vigilance, recommandation finale. Clair et sans jargon." },
    { n:'04', icon:<CheckCircle size={18}/>, title:'Décidez en confiance', text:"Négociez, faites votre offre, ou évitez une mauvaise affaire à temps." },
  ];
  return (
    <section id="comment" style={{ padding:'100px 24px', background:'linear-gradient(180deg,#040d14 0%,#06111c 100%)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <DarkHeader badge="Comment ça marche ?" title="Simple comme 1, 2, 3, 4." subtitle="Pas de formation, pas de jargon. Déposez vos documents, on fait le reste." />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:20, marginTop:64 }}>
          {steps.map((s,i)=>(
            <div key={i} style={{ padding:'28px 20px', borderRadius:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,rgba(42,125,156,0.25),rgba(240,165,0,0.15))', border:'1px solid rgba(42,125,156,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'#7dd3ed', position:'relative', boxShadow:'0 0 20px rgba(42,125,156,0.2)' }}>
                {s.icon}
                <span style={{ position:'absolute', top:-8, right:-8, width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#f0a500,#fb923c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#040d14' }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:8 }}>{s.title}</h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.7 }}>{s.text}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:52 }}>
          <Link to="/tarifs" style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'16px 40px', borderRadius:14, fontSize:16, fontWeight:700, color:'#040d14', background:'linear-gradient(135deg,#3a9cbf,#f0a500)', textDecoration:'none', boxShadow:'0 8px 40px rgba(42,125,156,0.35)' }}>
            Essayer maintenant — dès 4,99€ <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    { name:'Marie L.', role:'Primo-accédante, Lyon', initials:'ML', color:'#2a7d9c', text:"Analymo m'a dit en 2 minutes qu'il y avait un ravalement prévu à 12 000€ non provisionné. J'ai renégocié le prix à la baisse. Inestimable." },
    { name:'Thomas R.', role:'Investisseur, Paris', initials:'TR', color:'#1a5e78', text:"Je regarde 5 à 10 biens par mois. Avant, 3h par dossier. Maintenant 15 minutes. Le ROI est évident." },
    { name:'Sophie D.', role:'Acheteuse, Bordeaux', initials:'SD', color:'#0f6e56', text:"Le rapport est clair, bien structuré. Mon agent a été impressionné par la qualité de l'analyse. À recommander sans hésiter." },
    { name:'Pierre M.', role:'Gestionnaire, Marseille', initials:'PM', color:'#7c5e0f', text:"On utilise Analymo pour tous nos dossiers. 20 minutes de réunion au lieu de 2 heures. Indispensable." },
    { name:'Céline B.', role:'Première acquisition, Nantes', initials:'CB', color:'#5e1a78', text:"Mon notaire m'avait dit de lire le règlement. 80 pages. Analymo l'a analysé en 90 secondes et sorti les 3 points importants." },
    { name:'Antoine G.', role:'Investisseur, Toulouse', initials:'AG', color:'#5e1a2a', text:"La comparaison entre 2 biens est bluffante. L'un avait des charges 40% plus élevées. Choix facile ensuite." },
  ];
  return (
    <section style={{ padding:'100px 24px', background:'#06111c' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <DarkHeader badge="Ils nous font confiance" title="Des acheteurs qui ont vu juste." subtitle="Analymo a déjà aidé des centaines d'acheteurs à prendre de meilleures décisions." />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20, marginTop:64 }}>
          {testimonials.map((t,i)=>(
            <div key={i} style={{ padding:'26px', borderRadius:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(10px)' }}>
              <div style={{ display:'flex', gap:3, marginBottom:14 }}>
                {[0,1,2,3,4].map(j=><Star key={j} size={13} fill="#f0a500" color="#f0a500"/>)}
              </div>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.7, marginBottom:18, fontStyle:'italic' }}>"{t.text}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', boxShadow:`0 0 10px ${t.color}60`, flexShrink:0 }}>{t.initials}</div>
                <div><div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{t.name}</div><div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="tarifs" style={{ padding:'100px 24px', background:'#040d14' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <DarkHeader badge="🏷️ Tarification transparente" title="Investissez en toute sérénité." subtitle="Des tarifs simples pour sécuriser votre futur chez-vous." />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20, marginTop:64 }}>
          {PRICING_PLANS.map(plan=>(
            <div key={plan.id} style={{ padding:'30px 26px', borderRadius:24, background:plan.highlighted?'linear-gradient(135deg,rgba(42,125,156,0.14),rgba(240,165,0,0.07))':'rgba(255,255,255,0.03)', border:plan.highlighted?'1px solid rgba(42,125,156,0.4)':'1px solid rgba(255,255,255,0.07)', position:'relative', backdropFilter:'blur(10px)', boxShadow:plan.highlighted?'0 0 40px rgba(42,125,156,0.12)':'none' }}>
              {plan.badge&&<div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', padding:'4px 14px', borderRadius:100, fontSize:10, fontWeight:700, whiteSpace:'nowrap', background:plan.badgeColor==='teal'?'linear-gradient(135deg,#3a9cbf,#2a7d9c)':'#f0a500', color:plan.badgeColor==='teal'?'#fff':'#040d14' }}>{plan.badge}</div>}
              <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{plan.icon}</div>
              </div>
              <h3 style={{ fontSize:17, fontWeight:700, color:'#fff', textAlign:'center', marginBottom:8 }}>{plan.name}</h3>
              <div style={{ textAlign:'center', marginBottom:18 }}>
                <span style={{ fontSize:42, fontWeight:900, color:'#fff' }}>{plan.price.toFixed(2).replace('.',',')}</span>
                <span style={{ fontSize:16, color:'rgba(255,255,255,0.3)' }}>€</span>
              </div>
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:18 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#7dd3ed', letterSpacing:'0.08em', marginBottom:4 }}>+ IDÉAL POUR</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.4 }}>{plan.idealFor}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                {plan.features.map(f=>(
                  <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <CheckCircle2 size={14} color="#3a9cbf" style={{ flexShrink:0, marginTop:1 }}/>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to={`/inscription?plan=${plan.id}`} style={{ display:'block', padding:'12px 0', borderRadius:12, fontSize:14, fontWeight:700, color:plan.highlighted?'#040d14':'#fff', background:plan.highlighted?'linear-gradient(135deg,#3a9cbf,#f0a500)':'rgba(255,255,255,0.07)', border:plan.highlighted?'none':'1px solid rgba(255,255,255,0.1)', textDecoration:'none', textAlign:'center', boxShadow:plan.highlighted?'0 6px 24px rgba(42,125,156,0.3)':'none' }}>{plan.cta}</Link>
            </div>
          ))}
        </div>
        <div style={{ marginTop:28, padding:'26px 32px', borderRadius:20, background:'rgba(240,165,0,0.05)', border:'1px solid rgba(240,165,0,0.18)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <Crown size={22} color="#f0a500"/>
            <div>
              <h3 style={{ color:'#fff', fontSize:16, fontWeight:700, marginBottom:2 }}>Offre Professionnelle</h3>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Notaires, agents, syndics — volumes illimités, accès dédié, support prioritaire.</p>
            </div>
          </div>
          <Link to="/contact" style={{ padding:'11px 22px', borderRadius:11, fontSize:14, fontWeight:700, color:'#040d14', background:'#f0a500', textDecoration:'none', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
            <Mail size={15}/> Nous contacter
          </Link>
        </div>
      </div>
    </section>
  );
}

function CtaFinal() {
  return (
    <section style={{ padding:'100px 24px', background:'linear-gradient(135deg,#06111c 0%,#071a2a 100%)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:700, height:350, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(42,125,156,0.1) 0%,transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }} />
      <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
        <h2 style={{ fontSize:'clamp(30px,5vw,54px)', fontWeight:900, color:'#fff', marginBottom:18, letterSpacing:'-0.02em', lineHeight:1.1 }}>
          Votre prochain bien mérite<br />
          <span style={{ background:'linear-gradient(135deg,#3a9cbf,#f0a500)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>une analyse complète.</span>
        </h2>
        <p style={{ fontSize:17, color:'rgba(255,255,255,0.4)', lineHeight:1.7, marginBottom:44 }}>
          Rejoignez les acheteurs qui décident avec les bons éléments. Dès 4,99€, en moins de 2 minutes.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/tarifs" style={{ padding:'17px 44px', borderRadius:14, fontSize:16, fontWeight:700, color:'#040d14', background:'linear-gradient(135deg,#3a9cbf,#f0a500)', textDecoration:'none', display:'flex', alignItems:'center', gap:8, boxShadow:'0 12px 50px rgba(42,125,156,0.4)' }}>
            Commencer maintenant <ChevronRight size={18}/>
          </Link>
          <Link to="/exemple" style={{ padding:'17px 32px', borderRadius:14, fontSize:16, fontWeight:600, color:'rgba(255,255,255,0.65)', border:'1px solid rgba(255,255,255,0.13)', textDecoration:'none', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(10px)' }}>
            Voir un exemple
          </Link>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ChevronRight, ShieldCheck, Trash2, Building2, TrendingUp,

  AlertTriangle, FileText, ArrowRight, Scale, Banknote,
  Target, Lock, Clock, CheckCircle2, Star, UserCheck,
  BadgeCheck, X, Check,
} from 'lucide-react';

/* ── helpers ─── */
function useInView(t = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [t]);
  return { ref, inView: v };
}

function useCounter(target: number, go = false) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go) return;
    let t0: number;
    const r = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 1800, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(r);
    };
    requestAnimationFrame(r);
  }, [target, go]);
  return v;
}

export default function HomePage() {
  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Hero />
      <Stats />
      <Why />
      <ForWho />
      <HowItWorks />
      <AvantApres />
      <Testimonials />
      <CtaFinal />
      <style>{`
        @keyframes pls{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes scan2{0%{top:0%;opacity:0}4%{opacity:1}46%{opacity:1}50%{top:100%;opacity:0}51%{top:0%;opacity:0}}
        @keyframes spin2{to{transform:rotate(360deg)}}
        @keyframes popIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
        .pls{animation:pls 2s ease-in-out infinite}
        .scan2{animation:scan2 3s linear infinite}
        .spin2{animation:spin2 1s linear infinite}
        @media(max-width:900px){
          .hg{grid-template-columns:1fr!important;gap:40px!important}
          .sg{grid-template-columns:repeat(2,1fr)!important}
          .wg{grid-template-columns:repeat(2,1fr)!important}
          .fg{grid-template-columns:1fr!important}
          .tg{grid-template-columns:1fr!important}
          .ag{grid-template-columns:1fr!important;gap:12px!important}
        }
        @media(max-width:560px){.sg{grid-template-columns:1fr!important}.wg{grid-template-columns:1fr!important}}
      `}</style>
    </main>
  );
}

/* ═══ HERO ═══════════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: 70, background: 'linear-gradient(150deg,#eef7fb 0%,#e4f2f8 45%,#f8fafc 100%)' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '5%', right: '8%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,125,156,0.1) 0%,transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '8%', left: '5%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(240,165,0,0.07) 0%,transparent 70%)', filter: 'blur(50px)' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025 }}>
          <defs><pattern id="gr" width="52" height="52" patternUnits="userSpaceOnUse"><path d="M 52 0 L 0 0 0 52" fill="none" stroke="#2a7d9c" strokeWidth="1" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#gr)" />
        </svg>
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 28px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }} className="hg">

          {/* LEFT */}
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 18px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 13, fontWeight: 700, color: '#1a5e78', marginBottom: 28, letterSpacing: '0.03em' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2a7d9c', display: 'inline-block' }} className="pls" />
              Outil d'analyse documentaire immobilier
            </motion.div>

            <h1 style={{ fontSize: 'clamp(36px,4.8vw,62px)', fontWeight: 900, lineHeight: 1.06, color: '#0f2d3d', marginBottom: 22, letterSpacing: '-0.03em' }}>
              L'analyse<br />immobilière,{' '}
              <span style={{ background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>réinventée.</span>
            </h1>

            <p style={{ fontSize: 17, color: '#4a6b7c', lineHeight: 1.78, marginBottom: 34, maxWidth: 460 }}>
              Arrêtez de signer les yeux fermés. Analymo décrypte vos PV d'AG, règlements et diagnostics — et vous donne{' '}
              <strong style={{ color: '#0f2d3d', fontWeight: 700 }}>exactement ce qui compte</strong> en moins de 2 minutes.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
              <Link to="/tarifs"
                style={{ padding: '15px 34px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 28px rgba(42,125,156,0.3)', transition: 'transform .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
                <ShieldCheck size={17} /> Lancer l'analyse
              </Link>
              <Link to="/exemple" style={{ padding: '15px 26px', borderRadius: 14, fontSize: 16, fontWeight: 600, color: '#2a7d9c', border: '1.5px solid rgba(42,125,156,0.26)', textDecoration: 'none', background: '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
                Voir un exemple <ArrowRight size={15} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {[{ I: ShieldCheck, l: 'Données chiffrées' }, { I: Trash2, l: 'Suppression auto' }, { I: Building2, l: 'Sans engagement' }].map(({ I, l }, i) => (
                <motion.div key={l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#7a9aaa', fontWeight: 500 }}>
                  <I size={13} style={{ color: '#2a7d9c' }} />{l}
                </motion.div>
              ))}
            </div>

            {/* Social proof */}
            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex' }}>
                {['ML', 'TR', 'SD', 'CB', 'PG'].map((ini, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${195 + i * 18},55%,${38 + i * 4}%)`, border: '2px solid #f0f8fc', marginLeft: i === 0 ? 0 : -9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>{ini}</div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#7a9aaa' }}>
                <strong style={{ color: '#0f2d3d', fontWeight: 700 }}>+200 acheteurs</strong> font confiance à Analymo
              </p>
            </div>
          </motion.div>

          {/* RIGHT */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PhoneShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Phone showcase ──────────────────────────── */
function PhoneShowcase() {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2200);
    const t2 = setTimeout(() => setPhase(2), 4600);
    const t3 = setTimeout(() => { setPhase(0); }, 9000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [phase]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Glow */}
      <div style={{ position: 'absolute', inset: -32, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(42,125,156,0.13) 0%,transparent 70%)', filter: 'blur(24px)' }} />

      {/* Floating badge left */}
      <motion.div animate={{ y: [0, -8, 0], x: [0, 3, 0] }} transition={{ duration: 4.5, repeat: Infinity }}
        style={{ position: 'absolute', left: -72, top: '18%', background: '#fff', borderRadius: 14, padding: '11px 16px', boxShadow: '0 8px 28px rgba(15,45,61,0.1)', border: '1px solid #e8f0f4', zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, minWidth: 148 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={16} style={{ color: '#22c55e' }} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#0f2d3d', lineHeight: 1 }}>Score global</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e', lineHeight: 1.2 }}>78<span style={{ fontSize: 10, color: '#7a9aaa', fontWeight: 500 }}>/100</span></div>
        </div>
      </motion.div>

      {/* Floating badge right */}
      <motion.div animate={{ y: [0, 9, 0], x: [0, -3, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1.2 }}
        style={{ position: 'absolute', right: -66, bottom: '26%', background: '#fff', borderRadius: 14, padding: '11px 16px', boxShadow: '0 8px 28px rgba(15,45,61,0.1)', border: '1px solid #e8f0f4', zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, minWidth: 140 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#0f2d3d' }}>Vigilance</div>
          <div style={{ fontSize: 11, color: '#7a9aaa', lineHeight: 1.3 }}>Ravalement 2026</div>
        </div>
      </motion.div>

      {/* Floating top-right */}
      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 2 }}
        style={{ position: 'absolute', right: -52, top: '10%', background: '#fff', borderRadius: 12, padding: '9px 14px', boxShadow: '0 6px 20px rgba(15,45,61,0.1)', border: '1px solid #e8f0f4', zIndex: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#f0a500' }}>1 min 47s</span>
      </motion.div>

      {/* Phone */}
      <motion.div animate={{ rotateY: [3, -3, 3], rotateX: [-1.5, 1.5, -1.5], y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ transformStyle: 'preserve-3d' }}>
        <div style={{ width: 252, height: 530, background: '#0f2d3d', borderRadius: 46, padding: 5, boxShadow: '0 36px 80px rgba(15,45,61,0.28), 0 0 0 1px rgba(255,255,255,0.07) inset' }}>
          <div style={{ width: '100%', height: '100%', background: '#f8fafc', borderRadius: 42, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 84, height: 24, background: '#0f2d3d', borderRadius: 100, zIndex: 10 }} />
            <div style={{ padding: '3px 20px 0', display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 700, color: 'rgba(15,45,61,0.35)' }}>
              <span>9:41</span><span>5G ▪▪▪</span>
            </div>
            <div style={{ padding: '26px 14px 14px', height: 'calc(100% - 20px)' }}>
              <AnimatePresence mode="wait">
                {phase === 0 && <UploadPhase key="u" />}
                {phase === 1 && <ScanPhase key="s" />}
                {phase === 2 && <ResultPhase key="r" />}
              </AnimatePresence>
            </div>
            <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 80, height: 4, borderRadius: 2, background: 'rgba(15,45,61,0.15)' }} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function UploadPhase() {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setInterval(() => setP(v => Math.min(v + 3, 95)), 70); return () => clearInterval(t); }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d', marginBottom: 14 }}>Analymo</div>
      <div style={{ fontSize: 10, color: '#7a9aaa', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em' }}>CHARGEMENT DES DOCUMENTS</div>
      {['PV AG 2024.pdf', 'Règlement copro.pdf', 'Diagnostic DPE.pdf'].map((f, i) => (
        <motion.div key={f} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.35 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: '#fff', border: '1px solid #edf2f4', marginBottom: 7, boxShadow: '0 1px 4px rgba(15,45,61,0.05)' }}>
          <FileText size={11} style={{ color: '#2a7d9c', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#0f2d3d', fontWeight: 600, flex: 1 }}>{f}</span>
          <CheckCircle2 size={10} style={{ color: '#22c55e' }} />
        </motion.div>
      ))}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 9, color: '#7a9aaa' }}>Préparation...</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2a7d9c' }}>{p}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: '#edf2f4' }}>
          <motion.div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#2a7d9c,#0f2d3d)', width: `${p}%` }} />
        </div>
      </div>
    </motion.div>
  );
}

function ScanPhase() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(42,125,156,0.65),transparent)', boxShadow: '0 0 10px rgba(42,125,156,0.35)', zIndex: 5, top: 0 }} className="scan2" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d' }}>Analyse en cours</span>
        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #2a7d9c', borderTopColor: 'transparent' }} className="spin2" />
      </div>
      <div style={{ fontSize: 9, color: '#7a9aaa', marginBottom: 10 }}>104 pages en cours de lecture</div>
      {['Détection travaux votés...', 'Analyse financière...', 'Vérification juridique...', 'Calcul du score...'].map((t, i) => (
        <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.45 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < 3 ? '1px solid #f0f4f6' : 'none' }}>
          <motion.div animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#2a7d9c', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#4a6b7c' }}>{t}</span>
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
        style={{ marginTop: 14, padding: '9px 12px', borderRadius: 10, background: 'rgba(42,125,156,0.06)', border: '1px solid rgba(42,125,156,0.14)', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#2a7d9c', fontWeight: 700 }}>Finalisation du rapport...</div>
      </motion.div>
    </motion.div>
  );
}

function ResultPhase() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d' }}>Rapport Analymo</span>
        <span style={{ padding: '3px 9px', borderRadius: 6, background: '#ecfdf5', fontSize: 9, fontWeight: 700, color: '#16a34a' }}>✓ Terminé</span>
      </div>
      <div style={{ background: 'linear-gradient(135deg,#eaf4f8,#f0f8fc)', borderRadius: 14, padding: '12px', textAlign: 'center', marginBottom: 10, border: '1px solid rgba(42,125,156,0.09)' }}>
        <div style={{ fontSize: 8.5, color: '#7a9aaa', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>SCORE GLOBAL</div>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, delay: 0.1 }} style={{ fontSize: 50, fontWeight: 900, color: '#f0a500', lineHeight: 1 }}>78</motion.div>
        <div style={{ fontSize: 8.5, color: '#7a9aaa' }}>sur 100 · Négocier le prix</div>
      </div>
      {[{ l: 'Financier', v: 68, c: '#f0a500' }, { l: 'Travaux', v: 62, c: '#fb923c' }, { l: 'Juridique', v: 88, c: '#22c55e' }].map((s, i) => (
        <div key={s.l} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: '#4a6b7c' }}>{s.l}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: s.c }}>{s.v}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: '#f0f4f6' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${s.v}%` }} transition={{ delay: i * 0.12, duration: 0.8 }} style={{ height: '100%', borderRadius: 2, background: s.c }} />
          </div>
        </div>
      ))}
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ marginTop: 9, padding: '8px 10px', borderRadius: 9, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <AlertTriangle size={10} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 9, color: '#92400e', lineHeight: 1.4 }}>Ravalement voté — prévoir ~2 400€ en 2026</span>
      </motion.div>
    </motion.div>
  );
}

/* ═══ STATS ══════════════════════════════════════════════ */
function Stats() {
  const { ref, inView } = useInView();
  const data = [
    { v: 200, s: '+', l: 'analyses réalisées', I: FileText, c: '#2a7d9c', bg: 'rgba(42,125,156,0.07)' },
    { v: 2, s: ' min', l: "temps moyen d'analyse", I: Clock, c: '#f59e0b', bg: 'rgba(245,158,11,0.07)' },
    { v: 98, s: '%', l: 'clients satisfaits', I: Star, c: '#22c55e', bg: 'rgba(34,197,94,0.07)' },
    { v: 8000, s: '€', l: 'économisés en moyenne', I: TrendingUp, c: '#8b5cf6', bg: 'rgba(139,92,246,0.07)' },
  ];
  return (
    <section ref={ref} style={{ padding: '52px 28px', background: '#fff', borderTop: '1px solid #edf2f4', borderBottom: '1px solid #edf2f4' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }} className="sg">
        {data.map((d, i) => {
          const count = useCounter(d.v, inView);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.09 }}
              style={{ padding: '24px 18px', borderRadius: 18, background: d.bg, textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.c, margin: '0 auto 12px', boxShadow: `0 3px 10px ${d.c}22` }}>
                <d.I size={20} />
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#0f2d3d', lineHeight: 1, marginBottom: 5 }}>
                {d.s === '€' ? '~' : ''}{count.toLocaleString('fr-FR')}{d.s}
              </div>
              <div style={{ fontSize: 12, color: '#7a9aaa', fontWeight: 500 }}>{d.l}</div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ═══ WHY ════════════════════════════════════════════════ */
function Why() {
  const sRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sRef, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -36]);

  const cards = [
    { I: AlertTriangle, title: 'Risques détectés', items: ['Travaux votés non réalisés', 'Impayés de copropriétaires', 'Procédures judiciaires'], c: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.13)' },
    { I: Banknote, title: 'Santé financière', items: ['Budget prévisionnel analysé', 'Fonds de travaux évalué', 'Charges futures estimées'], c: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.13)' },
    { I: Scale, title: 'Conformité juridique', items: ['Diagnostics vérifiés', 'Clauses abusives identifiées', 'Règlement de copropriété'], c: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.13)' },
    { I: TrendingUp, title: 'Potentiel du bien', items: ["Historique des travaux", "État général de l'immeuble", "Valorisation estimée"], c: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.13)' },
  ];

  return (
    <section ref={sRef} style={{ padding: '80px 28px', position: 'relative', overflow: 'hidden' }}>
      <motion.div style={{ position: 'absolute', inset: 0, y: bgY, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,125,156,0.04) 0%,transparent 70%)', filter: 'blur(50px)' }} />
      </motion.div>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.07)', border: '1px solid rgba(42,125,156,0.18)', fontSize: 13, fontWeight: 700, color: '#1a5e78', marginBottom: 18 }}>
            Pourquoi Analymo ?
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontSize: 'clamp(26px,3.8vw,44px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Un score unique pour <span style={{ color: '#2a7d9c' }}>tout comprendre.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} style={{ fontSize: 16, color: '#6b8a96', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            L'achat immobilier est l'investissement d'une vie. Notre outil décrypte chaque document pour que vous achetiez en toute sérénité.
          </motion.p>
        </div>

        {/* Score hero */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ borderRadius: 26, background: '#0f2d3d', padding: '40px 48px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 260, height: 260, borderRadius: '50%', background: 'rgba(42,125,156,0.1)', filter: 'blur(36px)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 44, flexWrap: 'wrap', position: 'relative' }}>
            <div style={{ position: 'relative', width: 124, height: 124, flexShrink: 0 }}>
              <svg width="124" height="124" viewBox="0 0 124 124" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="62" cy="62" r="50" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                <motion.circle cx="62" cy="62" r="50" fill="none" stroke="#2a7d9c" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={314} initial={{ strokeDashoffset: 314 }}
                  whileInView={{ strokeDashoffset: 314 - 314 * 0.7 }} viewport={{ once: true }} transition={{ duration: 2, delay: 0.3 }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1 }}>7</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.1em' }}>/10</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h3 style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 900, color: '#fff', marginBottom: 10 }}>Score global, risques cachés, impact financier</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 440, marginBottom: 20 }}>
                Chaque document est analysé et synthétisé en un score de fiabilité clair — en moins de 2 minutes.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[{ l: '98% des risques détectés', I: Target }, { l: '< 2 min', I: Clock }, { l: '0 donnée conservée', I: Lock }].map((b, j) => (
                  <motion.div key={j} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + j * 0.09 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                    <b.I size={12} />{b.l}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }} className="wg">
          {cards.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(15,45,61,0.08)' }}
              style={{ padding: '22px', borderRadius: 18, border: `1px solid ${c.border}`, background: '#fff', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,${c.bg},transparent)`, opacity: 0.7 }} />
              <div style={{ position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <c.I size={18} style={{ color: c.c }} />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', marginBottom: 10 }}>{c.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {c.items.map((it, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: '#6b8a96', marginBottom: 6 }}>
                      <CheckCircle2 size={12} style={{ color: c.c, flexShrink: 0, marginTop: 1 }} />{it}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 34px', borderRadius: 13, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 7px 24px rgba(42,125,156,0.27)' }}>
            Lancer l'analyse <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══ FOR WHO ════════════════════════════════════════════ */
function ForWho() {
  const pros = [
    { title: 'Notaires', desc: 'Synthèse claire pour préparer vos dossiers plus vite.', I: ShieldCheck, c: '#2a7d9c', bg: 'rgba(42,125,156,0.07)' },
    { title: 'Agents Immobiliers', desc: 'Un rapport de transparence qui valorise votre conseil.', I: UserCheck, c: '#8b5cf6', bg: 'rgba(139,92,246,0.07)' },
    { title: 'Syndics', desc: "Facilitez les transmissions d'informations lors des ventes.", I: Building2, c: '#f59e0b', bg: 'rgba(245,158,11,0.07)' },
    { title: 'Marchands de biens', desc: "Évaluez instantanément le potentiel ou les risques.", I: BadgeCheck, c: '#22c55e', bg: 'rgba(34,197,94,0.07)' },
  ];

  return (
    <section style={{ padding: '72px 28px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.07)', border: '1px solid rgba(42,125,156,0.18)', fontSize: 13, fontWeight: 700, color: '#1a5e78', marginBottom: 18 }}>
            Pour qui ?
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.025em' }}>
            Une solution pour <span style={{ color: '#2a7d9c' }}>chaque acteur.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} style={{ fontSize: 16, color: '#7a9aaa', maxWidth: 500, margin: '0 auto' }}>
            Particulier ou professionnel, Analymo s'adapte à votre besoin.
          </motion.p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', gap: 14, alignItems: 'stretch' }} className="fg">

          {/* Main buyers card */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ borderRadius: 22, background: 'linear-gradient(145deg,#2a7d9c,#0f2d3d)', padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'relative' }}>
              <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.13)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', marginBottom: 18 }}>⭐ Principal</span>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>Acheteurs Particuliers</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, marginBottom: 22 }}>
                Ne faites pas d'erreur coûteuse. Analymo décrypte la santé financière de la copropriété et les travaux à venir.
              </p>
              {["Comprendre les PV d'AG", "Anticiper les travaux", "Vérifier les finances", "Acheter sereinement"].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.82)', marginBottom: 9 }}>
                  <CheckCircle2 size={14} style={{ color: '#4ade80', flexShrink: 0 }} />{item}
                </div>
              ))}
              <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 22, padding: '10px 22px', borderRadius: 11, background: '#fff', color: '#0f2d3d', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Commencer <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>

          {/* Pro cards */}
          {pros.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 + 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(15,45,61,0.08)' }}
              style={{ padding: '24px 20px', borderRadius: 18, background: '#fff', border: '1px solid #edf2f4', cursor: 'default' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <p.I size={19} style={{ color: p.c }} />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', marginBottom: 7 }}>{p.title}</h4>
              <p style={{ fontSize: 12, color: '#7a9aaa', lineHeight: 1.55 }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ HOW IT WORKS ═══════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { n: 1, I: FileText, title: 'Importez', text: "PV d'AG, règlement, diagnostics. PDF, Word ou image.", c: '#2a7d9c', bg: 'rgba(42,125,156,0.1)' },
    { n: 2, I: Target, title: 'Notre moteur analyse', text: 'Chaque ligne scannée pour détecter risques et travaux.', c: '#0f2d3d', bg: 'rgba(15,45,61,0.08)' },
    { n: 3, I: CheckCircle2, title: 'Rapport clair', text: 'Score, vigilances, recommandation. Prêt à négocier.', c: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  ];

  return (
    <section id="comment" style={{ padding: '72px 28px', background: '#fff' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.07)', border: '1px solid rgba(42,125,156,0.18)', fontSize: 13, fontWeight: 700, color: '#1a5e78', marginBottom: 18 }}>
            Comment ça marche ?
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.025em' }}>
            Trois étapes. <span style={{ color: '#2a7d9c' }}>Deux minutes.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} style={{ fontSize: 16, color: '#7a9aaa' }}>
            Une décision éclairée, sans jargon, sans effort.
          </motion.p>
        </div>

        {/* Steps with arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }} className="steps-row">
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                whileHover={{ y: -4, boxShadow: '0 16px 44px rgba(15,45,61,0.09)' }}
                style={{ flex: 1, padding: '28px 24px', borderRadius: 20, background: '#fff', border: '1px solid #edf2f4', boxShadow: '0 2px 10px rgba(15,45,61,0.04)', cursor: 'default', textAlign: 'center' }}>
                {/* Number + icon */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 18, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.I size={24} style={{ color: s.c }} />
                  </div>
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>{s.n}</div>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f2d3d', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: '#7a9aaa', lineHeight: 1.6 }}>{s.text}</p>
              </motion.div>

              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + 0.3 }}
                  style={{ flexShrink: 0, width: 36, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={16} style={{ color: '#2a7d9c' }} />
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 34px', borderRadius: 13, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 7px 24px rgba(42,125,156,0.27)' }}>
            Essayer maintenant — dès 4,99€ <ChevronRight size={16} />
          </Link>
        </motion.div>
      </div>
      <style>{`@media(max-width:700px){.steps-row{flex-direction:column!important;gap:12px!important}}`}</style>
    </section>
  );
}

/* ═══ AVANT / APRÈS ══════════════════════════════════════ */
function AvantApres() {
  const { ref, inView } = useInView(0.1);
  const before = [
    "Des dizaines de pages illisibles à parcourir seul",
    "Du jargon juridique sans traduction claire",
    "Des travaux découverts après la signature",
    "Une décision prise dans l'incertitude",
    "Des milliers d'euros de mauvaises surprises",
  ];
  const after = [
    "Un rapport structuré, clair, en 2 minutes",
    "Les risques mis en avant, sans jargon",
    "Travaux, charges et risques détectés en amont",
    "Une offre négociée sur des bases solides",
    "Des économies significatives dès le départ",
  ];

  return (
    <section ref={ref} style={{ padding: '72px 28px', background: 'linear-gradient(180deg,#f8fafc 0%,#eef7fb 100%)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.07)', border: '1px solid rgba(42,125,156,0.18)', fontSize: 13, fontWeight: 700, color: '#1a5e78', marginBottom: 18 }}>
            Avant / Après
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.025em' }}>
            Deux façons d'acheter. <span style={{ color: '#2a7d9c' }}>Une seule bonne.</span>
          </motion.h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 1fr', gap: 0, alignItems: 'center' }} className="ag">

          {/* SANS */}
          <motion.div initial={{ opacity: 0, x: -28 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}
            style={{ padding: '32px', borderRadius: 22, background: '#fff', border: '1px solid rgba(239,68,68,0.16)', boxShadow: '0 4px 20px rgba(239,68,68,0.06)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 24 }}>
              <X size={13} /> Sans Analymo
            </div>
            {before.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.08 + 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < before.length - 1 ? '1px solid #fff5f5' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={11} style={{ color: '#dc2626' }} />
                </div>
                <span style={{ fontSize: 14, color: '#6b7280' }}>{item}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* VS bubble */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
              style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#2a7d9c,#f0a500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', boxShadow: '0 4px 16px rgba(42,125,156,0.3)', flexShrink: 0 }}>
              VS
            </motion.div>
          </div>

          {/* AVEC */}
          <motion.div initial={{ opacity: 0, x: 28 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.12 }}
            style={{ padding: '32px', borderRadius: 22, background: '#fff', border: '1px solid rgba(42,125,156,0.2)', boxShadow: '0 4px 20px rgba(42,125,156,0.08)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 12, fontWeight: 700, color: '#1a5e78', marginBottom: 24 }}>
              <Check size={13} /> Avec Analymo
            </div>
            {after.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.08 + 0.3 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < after.length - 1 ? '1px solid #f0f9ff' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} style={{ color: '#22c55e' }} />
                </div>
                <span style={{ fontSize: 14, color: '#0f2d3d', fontWeight: 500 }}>{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══ TESTIMONIALS ═══════════════════════════════════════ */
function Testimonials() {
  const testimonials = [
    { name: 'Marie L.', role: 'Primo-accédante, Lyon', initials: 'ML', color: '#2a7d9c', text: "Analymo m'a signalé un ravalement à 12 000€. J'ai renégocié. Inestimable." },
    { name: 'Thomas R.', role: 'Investisseur, Paris', initials: 'TR', color: '#0f2d3d', text: "De 3h par dossier à 15 minutes. Indispensable quand on analyse 10 biens par mois." },
    { name: 'Sophie D.', role: 'Acheteuse, Bordeaux', initials: 'SD', color: '#0f6e56', text: "Rapport clair, scores par catégorie. Mon notaire a été impressionné." },
  ];

  return (
    <section style={{ padding: '72px 28px', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.07)', border: '1px solid rgba(42,125,156,0.18)', fontSize: 13, fontWeight: 700, color: '#1a5e78', marginBottom: 18 }}>
            Avis clients
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.025em' }}>
            Ils nous <span style={{ color: '#2a7d9c' }}>font confiance.</span>
          </motion.h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }} className="tg">
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.09 }}
              whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(15,45,61,0.07)' }}
              style={{ padding: '26px', borderRadius: 18, background: '#f8fafc', border: '1px solid #edf2f4', cursor: 'default' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                {[0, 1, 2, 3, 4].map(j => <Star key={j} size={13} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontSize: 14, color: '#4a6b7c', lineHeight: 1.7, marginBottom: 18, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2d3d' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#7a9aaa' }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ CTA FINAL ══════════════════════════════════════════ */
function CtaFinal() {
  return (
    <section style={{ padding: '88px 28px', background: 'linear-gradient(135deg,#0f2d3d 0%,#2a7d9c 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -70, right: -70, width: 340, height: 340, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -50, left: -50, width: 260, height: 260, borderRadius: '50%', background: 'rgba(240,165,0,0.06)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ fontSize: 'clamp(26px,4.5vw,50px)', fontWeight: 900, color: '#fff', marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          Votre prochain bien mérite une analyse complète.
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          style={{ fontSize: 17, color: 'rgba(255,255,255,0.58)', lineHeight: 1.7, marginBottom: 40 }}>
          Dès 4,99€ · Résultats en moins de 2 minutes.
        </motion.p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/tarifs" style={{ padding: '15px 40px', borderRadius: 13, fontSize: 16, fontWeight: 700, color: '#0f2d3d', background: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 7px 24px rgba(0,0,0,0.17)' }}>
            Commencer maintenant <ArrowRight size={17} />
          </Link>
          <Link to="/exemple" style={{ padding: '15px 28px', borderRadius: 13, fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.78)', border: '1.5px solid rgba(255,255,255,0.24)', textDecoration: 'none' }}>
            Voir un exemple
          </Link>
        </div>
      </div>
    </section>
  );
}

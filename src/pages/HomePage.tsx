import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Star, CheckCircle2, FileText,
  TrendingUp, AlertTriangle, ArrowRight,
  Scale, Banknote, Target, Lock, Clock, Crown, Mail,
  Building2, UserCheck, BadgeCheck, ShieldCheck, Trash2,
} from 'lucide-react';
import { PRICING_PLANS } from '../types';

/* ─────────────────────────────── helpers ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [threshold]);
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

/* ─────────────────────────────── shared ── */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 18px', borderRadius: 100,
        background: 'rgba(42,125,156,0.08)',
        border: '1px solid rgba(42,125,156,0.2)',
        fontSize: 13, fontWeight: 700, color: '#1a5e78',
        marginBottom: 22, letterSpacing: '0.03em',
      }}
    >
      {children}
    </motion.span>
  );
}

function H2({ title, accent, sub }: { title: string; accent: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 56 }}>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
        {title} <span style={{ color: '#2a7d9c' }}>{accent}</span>
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
        style={{ fontSize: 17, color: '#6b8a96', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
        {sub}
      </motion.p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════ */
export default function HomePage() {
  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Hero />
      <Stats />
      <Why />
      <ForWho />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CtaFinal />
      <style>{`
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes scanline { 0%{top:0%;opacity:0} 4%{opacity:1} 46%{opacity:1} 50%{top:100%;opacity:0} 51%{top:0%;opacity:0} }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .pulse2 { animation: pulse2 2s ease-in-out infinite; }
        .scan { animation: scanline 3s linear infinite; }
        .blink { animation: blink 1.2s step-end infinite; }
        .spin { animation: spin 1s linear infinite; }
        @media(max-width:900px){
          .hero-g{grid-template-columns:1fr!important;gap:48px!important}
          .stats-g{grid-template-columns:repeat(2,1fr)!important}
          .why-g{grid-template-columns:repeat(2,1fr)!important}
          .fwho-g{grid-template-columns:1fr!important}
          .steps-g{grid-template-columns:1fr!important}
          .testi-g{grid-template-columns:1fr!important}
          .price-g{grid-template-columns:repeat(2,1fr)!important}
        }
        @media(max-width:600px){
          .stats-g{grid-template-columns:repeat(2,1fr)!important}
          .why-g{grid-template-columns:1fr!important}
          .price-g{grid-template-columns:1fr!important}
        }
      `}</style>
    </main>
  );
}

/* ═══════════════════════════════════════════
   HERO
═══════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      position: 'relative', overflow: 'hidden', paddingTop: 80,
      background: 'linear-gradient(150deg,#f0f8fc 0%,#e8f4f9 40%,#f5f9fb 100%)',
    }}>
      {/* blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '8%', right: '10%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,125,156,0.09) 0%,transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(240,165,0,0.06) 0%,transparent 70%)', filter: 'blur(50px)' }} />
        {/* subtle grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <defs><pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#2a7d9c" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '60px 28px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }} className="hero-g">

          {/* ── LEFT ── */}
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }}>
            <Pill>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2a7d9c', display: 'inline-block' }} className="pulse2" />
              Outil d'analyse documentaire immobilier
            </Pill>

            <h1 style={{ fontSize: 'clamp(38px,5vw,64px)', fontWeight: 900, lineHeight: 1.05, color: '#0f2d3d', marginBottom: 24, letterSpacing: '-0.03em' }}>
              L'analyse<br />immobilière,{' '}
              <span style={{
                background: 'linear-gradient(135deg,#2a7d9c 30%,#0f2d3d 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>réinventée.</span>
            </h1>

            <p style={{ fontSize: 18, color: '#4a6b7c', lineHeight: 1.8, marginBottom: 38, maxWidth: 480 }}>
              Arrêtez de signer les yeux fermés. Analymo décrypte vos PV d'AG, règlements et diagnostics — et vous donne{' '}
              <strong style={{ color: '#0f2d3d', fontWeight: 700 }}>exactement ce qui compte</strong>{' '}
              en moins de 2 minutes.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}>
              <Link to="/tarifs"
                style={{ padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 32px rgba(42,125,156,0.32)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
              >
                <ShieldCheck size={18} /> Lancer l'analyse
              </Link>
              <Link to="/exemple" style={{ padding: '16px 28px', borderRadius: 14, fontSize: 16, fontWeight: 600, color: '#2a7d9c', border: '1.5px solid rgba(42,125,156,0.28)', textDecoration: 'none', background: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                Voir un exemple <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {[
                { icon: ShieldCheck, l: 'Données chiffrées' },
                { icon: Trash2, l: 'Suppression auto' },
                { icon: Building2, l: 'Sans engagement' },
              ].map(({ icon: I, l }, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#7a9aaa', fontWeight: 500 }}>
                  <I size={14} style={{ color: '#2a7d9c' }} />{l}
                </motion.div>
              ))}
            </div>

            {/* social proof */}
            <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex' }}>
                {['ML', 'TR', 'SD', 'CB', 'PG'].map((ini, i) => (
                  <div key={i} style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: `hsl(${195 + i * 18},55%,${38 + i * 4}%)`,
                    border: '2px solid #f0f8fc', marginLeft: i === 0 ? 0 : -10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff',
                  }}>{ini}</div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#7a9aaa' }}>
                <strong style={{ color: '#0f2d3d', fontWeight: 700 }}>+200 acheteurs</strong> font déjà confiance à Analymo
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: spectacular phone ── */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <SpectacularPhone />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Phone animation ─────────────────────── */
function SpectacularPhone() {
  const [step, setStep] = useState(0); // 0=uploading 1=scanning 2=results

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2000),
      setTimeout(() => setStep(2), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // restart loop
  useEffect(() => {
    if (step !== 2) return;
    const t = setTimeout(() => setStep(0), 7000);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== 0) return;
    const t1 = setTimeout(() => setStep(1), 2000);
    const t2 = setTimeout(() => setStep(2), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Glow */}
      <div style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(42,125,156,0.14) 0%,transparent 70%)', filter: 'blur(24px)' }} />

      {/* Floating cards */}
      <motion.div animate={{ y: [0, -8, 0], x: [0, 4, 0] }} transition={{ duration: 4, repeat: Infinity }}
        style={{ position: 'absolute', left: -70, top: '15%', background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 32px rgba(15,45,61,0.1)', border: '1px solid #e8f4f9', zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={16} style={{ color: '#22c55e' }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d' }}>Score global</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>78<span style={{ fontSize: 11, color: '#7a9aaa' }}>/100</span></div>
        </div>
      </motion.div>

      <motion.div animate={{ y: [0, 10, 0], x: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        style={{ position: 'absolute', right: -64, bottom: '28%', background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 32px rgba(15,45,61,0.1)', border: '1px solid #e8f4f9', zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, minWidth: 150 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d' }}>Vigilance</div>
          <div style={{ fontSize: 12, color: '#7a9aaa', lineHeight: 1.3 }}>Ravalement 2026</div>
        </div>
      </motion.div>

      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 2 }}
        style={{ position: 'absolute', right: -56, top: '12%', background: '#fff', borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 32px rgba(15,45,61,0.1)', border: '1px solid #e8f4f9', zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#f0a500' }}>1 min 47s</span>
      </motion.div>

      {/* Phone shell */}
      <motion.div
        animate={{ rotateY: [3, -3, 3], rotateX: [-2, 2, -2], y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div style={{ width: 250, height: 520, background: '#0f2d3d', borderRadius: 44, padding: 5, boxShadow: '0 32px 80px rgba(15,45,61,0.3), 0 0 0 1px rgba(255,255,255,0.08) inset', position: 'relative' }}>
          <div style={{ width: '100%', height: '100%', background: '#f8fafc', borderRadius: 40, overflow: 'hidden', position: 'relative' }}>
            {/* Dynamic island */}
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 82, height: 24, background: '#0f2d3d', borderRadius: 100, zIndex: 10 }} />

            {/* Status bar */}
            <div style={{ padding: '3px 20px 0', display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, color: 'rgba(15,45,61,0.4)' }}>
              <span>9:41</span><span>5G ▪▪▪</span>
            </div>

            {/* Screen content */}
            <div style={{ padding: '28px 14px 14px', height: '100%', overflowY: 'hidden' }}>
              <AnimatePresence mode="wait">
                {step === 0 && <UploadScreen key="upload" />}
                {step === 1 && <ScanScreen key="scan" />}
                {step === 2 && <ResultScreen key="result" />}
              </AnimatePresence>
            </div>

            {/* Home bar */}
            <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 80, height: 4, borderRadius: 2, background: 'rgba(15,45,61,0.18)' }} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function UploadScreen() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProgress(p => Math.min(p + 4, 95)), 80);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#0f2d3d', marginBottom: 16 }}>Analymo</div>
      <div style={{ fontSize: 11, color: '#7a9aaa', marginBottom: 12, fontWeight: 600 }}>CHARGEMENT DES DOCUMENTS</div>
      {['PV AG 2024.pdf', 'Règlement copro.pdf', 'Diagnostic DPE.pdf'].map((f, i) => (
        <motion.div key={f} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: '#fff', border: '1px solid #e8f4f9', marginBottom: 8, boxShadow: '0 1px 4px rgba(15,45,61,0.05)' }}>
          <FileText size={12} style={{ color: '#2a7d9c', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#0f2d3d', fontWeight: 600, flex: 1 }}>{f}</span>
          <CheckCircle2 size={11} style={{ color: '#22c55e' }} />
        </motion.div>
      ))}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: '#7a9aaa' }}>Préparation de l'analyse...</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c' }}>{progress}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: '#e8f4f9' }}>
          <motion.div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#2a7d9c,#0f2d3d)', width: `${progress}%` }} />
        </div>
      </div>
    </motion.div>
  );
}

function ScanScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative' }}>
      {/* scan line */}
      <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(42,125,156,0.7),transparent)', boxShadow: '0 0 10px rgba(42,125,156,0.4)', zIndex: 5, top: 0 }} className="scan" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d' }}>Analyse en cours</span>
        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #2a7d9c', borderTopColor: 'transparent' }} className="spin" />
      </div>

      <div style={{ fontSize: 10, color: '#7a9aaa', marginBottom: 10 }}>Lecture des documents</div>

      {['Détection travaux votés...', 'Analyse financière...', 'Vérification juridique...', 'Calcul du score global...'].map((t, i) => (
        <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < 3 ? '1px solid #f0f4f6' : 'none' }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#2a7d9c', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#4a6b7c' }}>{t}</span>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        style={{ marginTop: 16, padding: '10px 12px', borderRadius: 10, background: 'rgba(42,125,156,0.06)', border: '1px solid rgba(42,125,156,0.15)', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#2a7d9c', fontWeight: 700 }}>104 pages analysées</div>
        <div style={{ fontSize: 9, color: '#7a9aaa' }}>Finalisation du rapport...</div>
      </motion.div>
    </motion.div>
  );
}

function ResultScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d' }}>Rapport Analymo</span>
        <span style={{ padding: '3px 8px', borderRadius: 6, background: '#ecfdf5', fontSize: 9, fontWeight: 700, color: '#16a34a' }}>✓ Terminé</span>
      </div>

      {/* Big score */}
      <div style={{ background: 'linear-gradient(135deg,#eaf4f8,#f0f8fc)', borderRadius: 14, padding: '14px', textAlign: 'center', marginBottom: 12, border: '1px solid rgba(42,125,156,0.1)' }}>
        <div style={{ fontSize: 9, color: '#7a9aaa', fontWeight: 700, letterSpacing: '0.07em', marginBottom: 4 }}>SCORE GLOBAL</div>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          style={{ fontSize: 52, fontWeight: 900, color: '#f0a500', lineHeight: 1 }}>78</motion.div>
        <div style={{ fontSize: 9, color: '#7a9aaa' }}>sur 100 · Négocier le prix</div>
      </div>

      {/* Score bars */}
      {[{ l: 'Financier', v: 68, c: '#f0a500' }, { l: 'Travaux', v: 62, c: '#fb923c' }, { l: 'Juridique', v: 88, c: '#22c55e' }].map((s, i) => (
        <div key={s.l} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: '#4a6b7c' }}>{s.l}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: s.c }}>{s.v}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: '#f0f4f6' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${s.v}%` }} transition={{ delay: i * 0.15, duration: 0.8 }}
              style={{ height: '100%', borderRadius: 2, background: s.c }} />
          </div>
        </div>
      ))}

      {/* Alert */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        style={{ marginTop: 10, padding: '8px 10px', borderRadius: 9, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
        <AlertTriangle size={11} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 9, color: '#92400e', lineHeight: 1.5 }}>Ravalement voté — prévoir ~2 400€ en 2026</span>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   STATS
═══════════════════════════════════════════ */
function Stats() {
  const { ref, inView } = useInView();
  const data = [
    { v: 200, s: '+', l: 'analyses réalisées', icon: FileText, c: '#2a7d9c', bg: 'rgba(42,125,156,0.07)' },
    { v: 2, s: ' min', l: "temps moyen d'analyse", icon: Clock, c: '#f59e0b', bg: 'rgba(245,158,11,0.07)' },
    { v: 98, s: '%', l: 'clients satisfaits', icon: Star, c: '#22c55e', bg: 'rgba(34,197,94,0.07)' },
    { v: 8000, s: '€', l: 'économisés en moyenne', icon: TrendingUp, c: '#8b5cf6', bg: 'rgba(139,92,246,0.07)' },
  ];
  return (
    <section ref={ref} style={{ padding: '56px 28px', background: '#fff', borderTop: '1px solid #edf2f4', borderBottom: '1px solid #edf2f4' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="stats-g">
        {data.map((d, i) => {
          const count = useCounter(d.v, inView);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
              style={{ padding: '26px 20px', borderRadius: 20, background: d.bg, textAlign: 'center' }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.c, margin: '0 auto 14px', boxShadow: `0 3px 10px ${d.c}22` }}>
                <d.icon size={21} />
              </div>
              <div style={{ fontSize: 38, fontWeight: 900, color: '#0f2d3d', lineHeight: 1, marginBottom: 5 }}>
                {d.s === '€' ? '~' : ''}{count.toLocaleString('fr-FR')}{d.s}
              </div>
              <div style={{ fontSize: 13, color: '#7a9aaa', fontWeight: 500 }}>{d.l}</div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   WHY
═══════════════════════════════════════════ */
function Why() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const cards = [
    { icon: AlertTriangle, title: 'Risques détectés', items: ['Travaux votés non réalisés', 'Impayés de copropriétaires', 'Procédures judiciaires en cours'], c: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.14)' },
    { icon: Banknote, title: 'Santé financière', items: ['Budget prévisionnel analysé', 'Fonds de travaux évalué', 'Charges futures estimées'], c: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.14)' },
    { icon: Scale, title: 'Conformité juridique', items: ['Diagnostics obligatoires', 'Clauses abusives identifiées', 'Règlement de copropriété'], c: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.14)' },
    { icon: TrendingUp, title: 'Potentiel du bien', items: ["Historique des travaux", "État général de l'immeuble", "Valorisation estimée"], c: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.14)' },
  ];

  return (
    <section ref={sectionRef} style={{ padding: '96px 28px', position: 'relative', overflow: 'hidden' }}>
      <motion.div style={{ position: 'absolute', inset: 0, y: bgY, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,125,156,0.04) 0%,transparent 70%)', filter: 'blur(50px)' }} />
      </motion.div>

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <H2 title="Pourquoi" accent="Analymo ?" sub="L'achat immobilier est l'investissement d'une vie. Notre outil décrypte vos documents pour que vous achetiez en toute sérénité." />

        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ borderRadius: 28, background: '#0f2d3d', padding: '48px 52px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(42,125,156,0.1)', filter: 'blur(40px)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap', position: 'relative' }}>
            {/* Score circle */}
            <div style={{ position: 'relative', width: 136, height: 136, flexShrink: 0 }}>
              <svg width="136" height="136" viewBox="0 0 136 136" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="68" cy="68" r="56" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                <motion.circle cx="68" cy="68" r="56" fill="none" stroke="#2a7d9c" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={352} initial={{ strokeDashoffset: 352 }}
                  whileInView={{ strokeDashoffset: 352 - (352 * 0.7) }} viewport={{ once: true }}
                  transition={{ duration: 2, delay: 0.3 }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1 }}>7</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.1em' }}>/10</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, color: '#fff', marginBottom: 12 }}>Un score unique pour tout comprendre</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 480, marginBottom: 22 }}>
                Chaque document est analysé et synthétisé en un score de fiabilité clair. Risques, finances, juridique — tout est passé au crible en moins de 2 minutes.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[{ l: '98% de risques détectés', i: Target }, { l: '< 2 min d\'analyse', i: Clock }, { l: '0 donnée conservée', i: Lock }].map((b, j) => (
                  <motion.div key={j} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + j * 0.1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                    <b.i size={13} />{b.l}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="why-g">
          {cards.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, boxShadow: '0 14px 40px rgba(15,45,61,0.08)' }}
              style={{ padding: '24px', borderRadius: 20, border: `1px solid ${c.border}`, background: '#fff', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,${c.bg},transparent)`, opacity: 0.6 }} />
              <div style={{ position: 'relative' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <c.icon size={20} style={{ color: c.c }} />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f2d3d', marginBottom: 12 }}>{c.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {c.items.map((it, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#6b8a96', marginBottom: 7 }}>
                      <CheckCircle2 size={14} style={{ color: c.c, flexShrink: 0, marginTop: 1 }} />{it}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', borderRadius: 14, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 28px rgba(42,125,156,0.28)' }}>
            Lancer l'analyse <ArrowRight size={17} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOR WHO
═══════════════════════════════════════════ */
function ForWho() {
  const pros = [
    { title: 'Notaires', desc: 'Accélérez la préparation de vos dossiers avec une synthèse claire et fiable pour vos clients.', icon: ShieldCheck },
    { title: 'Agents Immobiliers', desc: 'Valorisez votre devoir de conseil avec un rapport de transparence sur chaque bien.', icon: UserCheck },
    { title: 'Syndics', desc: 'Facilitez la transmission des informations lors des ventes en copropriété.', icon: Building2 },
    { title: 'Marchands de biens', desc: "Identifiez instantanément le potentiel ou les risques d'un bien avant acquisition.", icon: BadgeCheck },
  ];
  return (
    <section style={{ padding: '96px 28px', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <H2 title="Pour" accent="qui ?" sub="Que vous soyez acheteur particulier ou professionnel de l'immobilier, Analymo s'adapte à vos besoins." />

        {/* Buyers big card */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ borderRadius: 28, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', padding: '52px 60px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', right: -20, bottom: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'relative', maxWidth: 680 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Particuliers — Audience principale</span>
            <h3 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-0.02em' }}>
              Acheteurs : ne signez plus les yeux fermés.
            </h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 540, marginBottom: 32 }}>
              Analymo décrypte la santé financière de la copropriété et les travaux à venir pour que vous achetiez avec les bons éléments entre les mains.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
              {["Comprendre les PV d'AG sans effort", "Anticiper les gros travaux à venir", "Vérifier la santé financière", "Acheter l'esprit tranquille"].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                  <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />{item}
                </motion.div>
              ))}
            </div>
            <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: '#fff', color: '#0f2d3d', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Commencer <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Pro cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="fwho-g">
          {pros.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(15,45,61,0.08)' }}
              style={{ padding: '24px', borderRadius: 20, background: '#fff', border: '1px solid #edf2f4', cursor: 'default' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(42,125,156,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <p.icon size={20} style={{ color: '#2a7d9c' }} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f2d3d', marginBottom: 8 }}>{p.title}</h4>
              <p style={{ fontSize: 13, color: '#7a9aaa', lineHeight: 1.6 }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { n: '01', icon: FileText, title: 'Importez vos documents', text: "PV d'AG, règlement de copropriété, diagnostics techniques. PDF, Word ou image — on s'occupe du reste.", c: '#fff', bg: 'linear-gradient(135deg,#2a7d9c,#1a5e78)' },
    { n: '02', icon: Target, title: 'Notre moteur analyse', text: 'Chaque ligne est scannée pour détecter les risques cachés, charges futures et travaux votés.', c: '#fff', bg: 'linear-gradient(135deg,#0f2d3d,#1a4a60)' },
    { n: '03', icon: CheckCircle2, title: 'Rapport clair & actionnable', text: 'Score de fiabilité, points de vigilance, recommandation finale. Prêt à négocier en toute confiance.', c: '#fff', bg: 'linear-gradient(135deg,#16a34a,#15803d)' },
  ];
  return (
    <section id="comment" style={{ padding: '96px 28px', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <H2 title="Comment" accent="ça marche ?" sub="Trois étapes. Deux minutes. Une décision éclairée." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="steps-g">
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(15,45,61,0.08)' }}
              style={{ padding: '32px', borderRadius: 24, background: '#fff', border: '1px solid #edf2f4', boxShadow: '0 2px 10px rgba(15,45,61,0.04)', cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={24} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontSize: 44, fontWeight: 900, color: '#f0f4f6', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f2d3d', marginBottom: 12 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#7a9aaa', lineHeight: 1.7 }}>{s.text}</p>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', borderRadius: 14, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 28px rgba(42,125,156,0.28)' }}>
            Essayer maintenant — dès 4,99€ <ChevronRight size={17} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════ */
function Testimonials() {
  const testimonials = [
    { name: 'Marie L.', role: 'Primo-accédante, Lyon', initials: 'ML', color: '#2a7d9c', text: "Analymo m'a signalé un ravalement prévu à 12 000€ non provisionné. J'ai renégocié le prix à la baisse. Inestimable avant une signature." },
    { name: 'Thomas R.', role: 'Investisseur, Paris', initials: 'TR', color: '#0f2d3d', text: "Je regarde 5 à 10 biens par mois. Avant Analymo, 3h par dossier. Maintenant 15 minutes. Le ROI est évident dès le premier mois." },
    { name: 'Sophie D.', role: 'Acheteuse, Bordeaux', initials: 'SD', color: '#0f6e56', text: "Le rapport est clair, structuré, avec des scores par catégorie. Mon notaire a été impressionné. À recommander sans hésiter." },
    { name: 'Céline B.', role: 'Première acquisition, Nantes', initials: 'CB', color: '#7c3aed', text: "80 pages de règlement de copropriété. Analymo l'a analysé en 90 secondes et sorti les 3 points vraiment importants pour moi." },
    { name: 'Pierre M.', role: 'Gestionnaire, Marseille', initials: 'PM', color: '#d97706', text: "On utilise Analymo pour tous nos dossiers clients. 20 minutes de réunion au lieu de 2 heures. Un outil devenu indispensable." },
    { name: 'Antoine G.', role: 'Investisseur, Toulouse', initials: 'AG', color: '#dc2626', text: "La comparaison entre 2 biens est bluffante. Analymo a identifié que l'un avait des charges 40% plus élevées. Choix évident ensuite." },
  ];
  return (
    <section style={{ padding: '96px 28px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <H2 title="Ils nous" accent="font confiance." sub="Des acheteurs qui ont pris de meilleures décisions grâce à Analymo." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="testi-g">
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}
              whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(15,45,61,0.08)' }}
              style={{ padding: '28px', borderRadius: 20, background: '#fff', border: '1px solid #edf2f4', cursor: 'default' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {[0, 1, 2, 3, 4].map(j => <Star key={j} size={13} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontSize: 14, color: '#4a6b7c', lineHeight: 1.75, marginBottom: 18, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#7a9aaa' }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   PRICING
═══════════════════════════════════════════ */
function Pricing() {
  return (
    <section id="tarifs" style={{ padding: '96px 28px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Pill>🏷️ Tarification transparente</Pill>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.025em' }}>Investissez en toute sérénité.</h2>
          <p style={{ fontSize: 17, color: '#7a9aaa' }}>Des tarifs simples pour sécuriser votre futur chez-vous.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="price-g">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              style={{ padding: '28px 24px', borderRadius: 24, background: '#fff', border: plan.highlighted ? '2px solid #2a7d9c' : '1px solid #edf2f4', position: 'relative', boxShadow: plan.highlighted ? '0 12px 40px rgba(42,125,156,0.14)' : '0 2px 10px rgba(15,45,61,0.05)' }}>
              {plan.badge && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', padding: '5px 16px', borderRadius: 100, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: plan.badgeColor === 'teal' ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : '#f59e0b', color: '#fff' }}>{plan.badge}</div>}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: plan.highlighted ? 'rgba(42,125,156,0.09)' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: `1px solid ${plan.highlighted ? 'rgba(42,125,156,0.2)' : '#edf2f4'}` }}>{plan.icon}</div>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f2d3d', textAlign: 'center', marginBottom: 8 }}>{plan.name}</h3>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#0f2d3d' }}>{plan.price.toFixed(2).replace('.', ',')}</span>
                <span style={{ fontSize: 16, color: '#7a9aaa' }}>€</span>
              </div>
              <div style={{ padding: '9px 12px', borderRadius: 10, background: plan.highlighted ? 'rgba(42,125,156,0.06)' : '#f8fafc', marginBottom: 16, border: `1px solid ${plan.highlighted ? 'rgba(42,125,156,0.12)' : '#edf2f4'}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.07em', marginBottom: 3 }}>+ IDÉAL POUR</div>
                <div style={{ fontSize: 12, color: '#4a6b7c', lineHeight: 1.4 }}>{plan.idealFor}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckCircle2 size={14} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: '#7a9aaa', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to={`/inscription?plan=${plan.id}`} style={{ display: 'block', padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, color: plan.highlighted ? '#fff' : '#0f2d3d', background: plan.highlighted ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : 'transparent', border: plan.highlighted ? 'none' : '2px solid #0f2d3d', textDecoration: 'none', textAlign: 'center', boxShadow: plan.highlighted ? '0 6px 20px rgba(42,125,156,0.28)' : 'none' }}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ marginTop: 24, padding: '24px 32px', borderRadius: 20, background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Crown size={22} style={{ color: '#f59e0b' }} />
            <div>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Offre Professionnelle</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Notaires, agents, syndics — volumes illimités, accès dédié, support prioritaire.</p>
            </div>
          </div>
          <Link to="/contact" style={{ padding: '11px 22px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0f2d3d', background: '#f59e0b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <Mail size={15} /> Nous contacter
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CTA FINAL
═══════════════════════════════════════════ */
function CtaFinal() {
  return (
    <section style={{ padding: '96px 28px', background: 'linear-gradient(135deg,#0f2d3d 0%,#2a7d9c 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(240,165,0,0.07)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ fontSize: 'clamp(28px,4.5vw,52px)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          Votre prochain bien mérite une analyse complète.
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 44 }}>
          Rejoignez les acheteurs qui décident avec les bons éléments. Dès 4,99€, en moins de 2 minutes.
        </motion.p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/tarifs" style={{ padding: '16px 44px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#0f2d3d', background: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
            Commencer maintenant <ArrowRight size={18} />
          </Link>
          <Link to="/exemple" style={{ padding: '16px 30px', borderRadius: 14, fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(255,255,255,0.25)', textDecoration: 'none' }}>
            Voir un exemple
          </Link>
        </div>
      </div>
    </section>
  );
}

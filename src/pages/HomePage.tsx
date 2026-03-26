import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ShieldCheck, Trash2, Building2, ChevronDown, CheckCircle2,
  Eye, TrendingUp, AlertTriangle, CircleDollarSign, FileText,
  ArrowRight, Scale, Banknote, Target, Lock, Clock, Star,
  UserCheck, Zap, Crown, Mail,
} from 'lucide-react';
import { PRICING_PLANS } from '../types';

/* ── helpers ─────────────────────────────────────────────── */
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function useCounter(target: number, dur = 1800, go = false) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go) return;
    let t0: number;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, dur, go]);
  return v;
}

/* ── shared badge ────────────────────────────────────────── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '7px 18px', borderRadius: 100,
        border: '1px solid rgba(42,125,156,0.2)',
        background: 'rgba(42,125,156,0.07)',
        fontSize: 13, fontWeight: 700,
        color: '#1a5e78', marginBottom: 20, letterSpacing: '0.03em',
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── section header ──────────────────────────────────────── */
function SectionHeader({ title, highlight, subtitle }: { title: string; highlight: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 56 }}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 14, letterSpacing: '-0.02em', lineHeight: 1.1 }}
      >
        {title} <span style={{ color: '#2a7d9c' }}>{highlight}</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        style={{ fontSize: 18, color: '#6b8a96', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}
      >
        {subtitle}
      </motion.p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   EXPORT DEFAULT
════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <main style={{ background: 'hsl(200,20%,98%)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <HeroSection />
      <StatsSection />
      <WhySection />
      <ForWhoSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
    </main>
  );
}

/* ════════════════════════════════════════════════════════════
   HERO
════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'linear-gradient(160deg, hsl(200,20%,98%) 0%, hsl(200,30%,95%) 60%, hsl(200,20%,98%) 100%)' }}>
      {/* blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 80, right: '25%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,125,156,0.06) 0%,transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: 80, left: '25%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,125,156,0.04) 0%,transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '144px 32px 64px', width: '100%', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="hero-grid">

          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 100, border: '1px solid rgba(42,125,156,0.2)', background: 'rgba(42,125,156,0.06)', fontSize: 13, fontWeight: 600, color: '#1a5e78', marginBottom: 32, width: 'fit-content' }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', display: 'inline-block', animation: 'pulseDot 2s ease-in-out infinite' }} />
              Outil d'analyse documentaire immobilier
            </motion.div>

            <h1 style={{ fontSize: 'clamp(36px,5vw,58px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0f2d3d', lineHeight: 1.1, marginBottom: 24 }}>
              Analysez vos documents{' '}
              <span style={{ color: '#2a7d9c' }}>immobiliers</span>
            </h1>

            <p style={{ fontSize: 18, color: '#4a6b7c', lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}>
              Score global, risques cachés, impact financier — tout ce qu'il faut savoir avant de signer, expliqué simplement en moins de 2 minutes grâce à notre outil d'analyse.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 32px', borderRadius: 16, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(42,125,156,0.3)' }}>
                <ShieldCheck size={18} /> Lancer l'analyse
              </Link>
              <Link to="/exemple" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 28px', borderRadius: 16, border: '2px solid hsl(200,15%,88%)', color: '#0f2d3d', fontSize: 16, fontWeight: 600, textDecoration: 'none', background: '#fff' }}>
                <Eye size={18} /> Voir un exemple
              </Link>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {[{ icon: ShieldCheck, label: 'Documents chiffrés' }, { icon: Trash2, label: 'Suppression auto' }, { icon: Building2, label: 'Sans engagement' }].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#7a9aaa' }}>
                  <item.icon size={14} style={{ color: '#2a7d9c' }} />
                  {item.label}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — Phone mockup */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            {/* Floating badge — Sécurisé */}
            <motion.div
              animate={{ y: [0, -10, 0], x: [0, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ position: 'absolute', left: -24, top: '18%', background: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: '0 8px 32px rgba(15,45,61,0.1)', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid hsl(200,15%,92%)', zIndex: 20 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} style={{ color: '#2a7d9c' }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0f2d3d', margin: 0 }}>100% sécurisé</p>
                <p style={{ fontSize: 10, color: '#7a9aaa', margin: 0 }}>Chiffré & supprimé</p>
              </div>
            </motion.div>

            {/* Floating badge — Score */}
            <motion.div
              animate={{ y: [0, 10, 0], x: [0, -3, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              style={{ position: 'absolute', right: -24, bottom: '28%', background: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: '0 8px 32px rgba(15,45,61,0.1)', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid hsl(200,15%,92%)', zIndex: 20 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} style={{ color: '#22c55e' }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0f2d3d', margin: 0 }}>Score : 7/10</p>
                <p style={{ fontSize: 10, color: '#7a9aaa', margin: 0 }}>Bien recommandé</p>
              </div>
            </motion.div>

            {/* Phone */}
            <motion.div
              animate={{ rotateY: [4, -4, 4], rotateX: [-2, 2, -2], y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div style={{ width: 240, height: 500, background: '#0f2d3d', borderRadius: 44, padding: 5, boxShadow: '0 32px 64px rgba(15,45,61,0.35)', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', background: 'hsl(200,20%,98%)', borderRadius: 40, overflow: 'hidden', position: 'relative' }}>
                  {/* Dynamic island */}
                  <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 24, background: '#0f2d3d', borderRadius: 100, zIndex: 10 }} />
                  {/* Status bar */}
                  <div style={{ padding: '4px 20px 0', display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, color: 'rgba(15,45,61,0.5)' }}>
                    <span>9:41</span><span>5G ■■■</span>
                  </div>
                  {/* Screen content */}
                  <div style={{ padding: '32px 12px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2d3d' }}>Résultat d'analyse</span>
                      <motion.div
                        animate={{ opacity: [1, 0.6, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(34,197,94,0.1)', fontSize: 9, fontWeight: 700, color: '#16a34a' }}
                      >Terminé</motion.div>
                    </div>
                    {/* Score circle */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <div style={{ position: 'relative', width: 88, height: 88 }}>
                        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(200,15%,90%)" strokeWidth="6" />
                          <motion.circle cx="44" cy="44" r="36" fill="none" stroke="#2a7d9c" strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={226}
                            initial={{ strokeDashoffset: 226 }}
                            animate={{ strokeDashoffset: 226 - (226 * 0.7) }}
                            transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
                          />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ fontSize: 22, fontWeight: 900, color: '#0f2d3d', lineHeight: 1 }}>7</motion.span>
                          <span style={{ fontSize: 8, color: '#7a9aaa' }}>/10</span>
                        </div>
                      </div>
                    </div>
                    {/* Bar chart */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, justifyContent: 'center', height: 40, marginBottom: 12 }}>
                      {[60, 85, 45, 70, 90, 55, 75].map((h, i) => (
                        <motion.div key={i} style={{ width: 16, borderRadius: '3px 3px 0 0', background: 'rgba(42,125,156,0.7)' }}
                          initial={{ height: 0 }} animate={{ height: `${h}%` }}
                          transition={{ delay: 1 + i * 0.1, duration: 0.6 }}
                        />
                      ))}
                    </div>
                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.15)', title: '3 points positifs', sub: 'Finances saines, entretien ok' },
                        { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)', title: '2 vigilances', sub: 'Toiture prévue 2026' },
                        { icon: CircleDollarSign, color: '#2a7d9c', bg: 'rgba(42,125,156,0.06)', border: 'rgba(42,125,156,0.12)', title: 'Impact financier', sub: '~12 000 € de charges' },
                      ].map((it, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 + i * 0.2 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: it.bg, border: `1px solid ${it.border}` }}>
                          <it.icon size={12} style={{ color: it.color, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#0f2d3d', margin: 0 }}>{it.title}</p>
                            <p style={{ fontSize: 8, color: '#7a9aaa', margin: 0 }}>{it.sub}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  {/* Home bar */}
                  <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 4, borderRadius: 2, background: 'rgba(15,45,61,0.15)' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(74,107,124,0.5)' }}>Découvrir</span>
          <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown size={18} style={{ color: 'rgba(74,107,124,0.35)' }} />
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @media(max-width:767px){ .hero-grid{grid-template-columns:1fr!important;gap:48px!important} }
        @media(max-width:600px){ .stats-grid{grid-template-columns:repeat(2,1fr)!important} .why-grid{grid-template-columns:1fr!important} .forwho-grid{grid-template-columns:1fr!important} .steps-grid{grid-template-columns:1fr!important} .testi-grid{grid-template-columns:1fr!important} .price-grid{grid-template-columns:1fr!important} }
      `}</style>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   STATS
════════════════════════════════════════════════════════════ */
function StatsSection() {
  const { ref, inView } = useInView();
  const data = [
    { value: 200, suffix: '+', label: 'analyses réalisées', icon: FileText, color: '#2a7d9c', bg: 'rgba(42,125,156,0.07)' },
    { value: 2, suffix: ' min', label: "temps moyen d'analyse", icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.07)' },
    { value: 98, suffix: '%', label: 'clients satisfaits', icon: Star, color: '#22c55e', bg: 'rgba(34,197,94,0.07)' },
    { value: 8000, suffix: '€', label: 'économisés en moyenne', icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.07)' },
  ];
  return (
    <section ref={ref} style={{ padding: '64px 32px', background: '#fff', borderTop: '1px solid hsl(200,15%,92%)', borderBottom: '1px solid hsl(200,15%,92%)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="stats-grid">
        {data.map((d, i) => {
          const count = useCounter(d.value, 1800, inView);
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              style={{ padding: '24px 20px', borderRadius: 20, background: d.bg, textAlign: 'center' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.color, margin: '0 auto 14px', boxShadow: `0 4px 12px ${d.color}25` }}>
                <d.icon size={22} />
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#0f2d3d', lineHeight: 1, marginBottom: 6 }}>
                {d.suffix === '€' ? '~' : ''}{count.toLocaleString('fr-FR')}{d.suffix}
              </div>
              <div style={{ fontSize: 13, color: '#7a9aaa', fontWeight: 500 }}>{d.label}</div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   WHY
════════════════════════════════════════════════════════════ */
function WhySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const cards = [
    { icon: AlertTriangle, title: 'Risques détectés', items: ['Travaux votés non réalisés', 'Impayés de copropriétaires', 'Procédures judiciaires en cours'], color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)' },
    { icon: Banknote, title: 'Santé financière', items: ['Budget prévisionnel analysé', 'Fonds de travaux évalué', 'Charges futures estimées'], color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
    { icon: Scale, title: 'Conformité juridique', items: ['Diagnostics obligatoires vérifiés', 'Clauses abusives identifiées', 'Règlement de copropriété'], color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)' },
    { icon: TrendingUp, title: 'Potentiel du bien', items: ["Historique des travaux réalisés", "État général de l'immeuble", "Valorisation estimée"], color: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)' },
  ];

  return (
    <section ref={sectionRef} style={{ padding: '96px 32px', position: 'relative', overflow: 'hidden' }}>
      <motion.div style={{ position: 'absolute', inset: 0, y: bgY, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,125,156,0.04) 0%,transparent 70%)', filter: 'blur(60px)' }} />
      </motion.div>

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <SectionHeader title="Pourquoi" highlight="Analymo ?" subtitle="L'achat immobilier est l'investissement d'une vie. Notre outil décrypte vos documents pour que vous achetiez en toute sérénité." />

        {/* Score hero card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ borderRadius: 28, background: '#0f2d3d', padding: '48px 56px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(42,125,156,0.12)', filter: 'blur(40px)' }} />
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <motion.circle cx="70" cy="70" r="58" fill="none" stroke="#2a7d9c" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={364} initial={{ strokeDashoffset: 364 }}
                  whileInView={{ strokeDashoffset: 364 - (364 * 0.7) }}
                  viewport={{ once: true }} transition={{ duration: 2, delay: 0.3 }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1 }}>7</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em' }}>/10</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, color: '#fff', marginBottom: 12 }}>Un score unique pour tout comprendre</h3>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 500, marginBottom: 24 }}>
                Chaque document est analysé et synthétisé en un score de fiabilité clair. Risques, finances, juridique — tout est passé au crible en moins de 2 minutes.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[{ label: '98% de risques détectés', icon: Target }, { label: '< 2 min d\'analyse', icon: Clock }, { label: '0 donnée conservée', icon: Lock }].map((b, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>
                    <b.icon size={14} /> {b.label}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4 analysis cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="why-grid">
          {cards.map((c, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(15,45,61,0.1)' }}
              style={{ padding: '24px', borderRadius: 20, border: `1px solid ${c.border}`, background: '#fff', position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'box-shadow .2s' }}
            >
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom,${c.bg},transparent)`, opacity: 0.5 }} />
              <div style={{ position: 'relative' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <c.icon size={20} style={{ color: c.color }} />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f2d3d', marginBottom: 12 }}>{c.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {c.items.map((it, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#6b8a96' }}>
                      <CheckCircle2 size={14} style={{ color: c.color, flexShrink: 0, marginTop: 1 }} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', borderRadius: 16, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 28px rgba(42,125,156,0.3)' }}>
            Lancer l'analyse <ArrowRight size={17} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   FOR WHO
════════════════════════════════════════════════════════════ */
function ForWhoSection() {
  const pros = [
    { title: 'Notaires', desc: 'Accélérez la préparation de vos dossiers avec une synthèse claire et fiable.', icon: ShieldCheck },
    { title: 'Agents Immobiliers', desc: 'Valorisez votre devoir de conseil avec un rapport de transparence.', icon: UserCheck },
    { title: 'Syndics', desc: 'Facilitez la transmission des informations lors des ventes en copropriété.', icon: Building2 },
    { title: 'Marchands de biens', desc: "Identifiez instantanément le potentiel ou les risques d'un bien.", icon: Zap },
  ];

  return (
    <section style={{ padding: '96px 32px', background: 'hsl(200,20%,97%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,125,156,0.04) 0%,transparent 70%)', filter: 'blur(60px)' }} />
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <SectionHeader title="Pour" highlight="qui ?" subtitle="Que vous soyez acheteur particulier ou professionnel, Analymo s'adapte à vos besoins." />

        {/* Buyers big card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ borderRadius: 28, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', padding: '56px 64px', color: '#fff', marginBottom: 20, position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', right: -20, bottom: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'relative', maxWidth: 700 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Particuliers</span>
            <h3 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, color: '#fff', marginBottom: 16 }}>Acheteurs : ne laissez rien au hasard</h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 560, marginBottom: 32 }}>
              Nous décryptons la santé financière de la copropriété et les travaux à venir pour que vous achetiez en toute sérénité.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
              {["Comprendre les PV d'AG sans effort", "Anticiper les gros travaux à venir", "Vérifier la santé financière", "Acheter l'esprit tranquille"].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                  <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
                  {item}
                </motion.div>
              ))}
            </div>
            <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, background: '#fff', color: '#0f2d3d', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Commencer <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Pro cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="forwho-grid">
          {pros.map((p, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(15,45,61,0.08)' }}
              style={{ padding: '24px', borderRadius: 20, background: '#fff', border: '1px solid hsl(200,15%,92%)', cursor: 'default' }}
            >
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

/* ════════════════════════════════════════════════════════════
   HOW IT WORKS
════════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    { n: '01', icon: FileText, title: 'Importez vos documents', text: "Déposez vos PV d'AG, règlements de copropriété ou diagnostics techniques. PDF, Word ou image.", color: '#2a7d9c', bg: 'linear-gradient(135deg,#2a7d9c,#1a5e78)' },
    { n: '02', icon: Target, title: 'Audit par algorithme', text: 'Notre moteur scanne chaque ligne pour détecter les risques cachés, les charges futures et les travaux votés.', color: '#0f2d3d', bg: 'linear-gradient(135deg,#0f2d3d,#1a4a60)' },
    { n: '03', icon: CheckCircle2, title: 'Rapport détaillé', text: 'Recevez une synthèse claire avec un score de fiabilité, des points de vigilance et des conseils personnalisés.', color: '#22c55e', bg: 'linear-gradient(135deg,#16a34a,#15803d)' },
  ];

  return (
    <section id="comment" style={{ padding: '96px 32px', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader title="Comment" highlight="ça marche ?" subtitle="Trois étapes simples pour sécuriser votre investissement immobilier." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="steps-grid">
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(15,45,61,0.08)' }}
              style={{ padding: '32px', borderRadius: 24, background: '#fff', border: '1px solid hsl(200,15%,92%)', boxShadow: '0 2px 12px rgba(15,45,61,0.05)', cursor: 'default' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={24} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontSize: 44, fontWeight: 900, color: 'hsl(200,15%,92%)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f2d3d', marginBottom: 12 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#7a9aaa', lineHeight: 1.7 }}>{s.text}</p>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', borderRadius: 16, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 28px rgba(42,125,156,0.3)' }}>
            Essayer maintenant — dès 4,99€ <ArrowRight size={17} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   TESTIMONIALS
════════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    { name: 'Marie L.', role: 'Primo-accédante, Lyon', initials: 'ML', color: '#2a7d9c', text: "Analymo m'a signalé un ravalement prévu à 12 000€ non provisionné. J'ai renégocié le prix à la baisse. Inestimable avant une signature." },
    { name: 'Thomas R.', role: 'Investisseur, Paris', initials: 'TR', color: '#0f2d3d', text: "Je regarde 5 à 10 biens par mois. Avant Analymo, 3h par dossier. Maintenant 15 minutes. Le ROI est évident dès le premier mois." },
    { name: 'Sophie D.', role: 'Acheteuse, Bordeaux', initials: 'SD', color: '#0f6e56', text: "Le rapport est clair, structuré, avec des scores par catégorie. Mon notaire a été impressionné. À recommander sans hésiter." },
    { name: 'Céline B.', role: 'Première acquisition, Nantes', initials: 'CB', color: '#7c3aed', text: "Mon notaire m'avait dit de lire le règlement. 80 pages. Analymo l'a analysé en 90 secondes et sorti les 3 points importants." },
    { name: 'Pierre M.', role: 'Gestionnaire, Marseille', initials: 'PM', color: '#d97706', text: "On utilise Analymo pour tous nos dossiers clients. 20 minutes de réunion au lieu de 2 heures. Un outil devenu indispensable." },
    { name: 'Antoine G.', role: 'Investisseur, Toulouse', initials: 'AG', color: '#dc2626', text: "La comparaison entre 2 biens est bluffante. Analymo a identifié que l'un avait des charges 40% plus élevées. Choix évident." },
  ];
  return (
    <section style={{ padding: '96px 32px', background: 'hsl(200,20%,97%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader title="Ils nous" highlight="font confiance." subtitle="Des acheteurs qui ont pris de meilleures décisions grâce à Analymo." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="testi-grid">
          {testimonials.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08 }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(15,45,61,0.08)' }}
              style={{ padding: '28px', borderRadius: 20, background: '#fff', border: '1px solid hsl(200,15%,92%)', cursor: 'default' }}
            >
              <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                {[0, 1, 2, 3, 4].map(j => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontSize: 14, color: '#4a6b7c', lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
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

/* ════════════════════════════════════════════════════════════
   PRICING
════════════════════════════════════════════════════════════ */
function PricingSection() {
  return (
    <section id="tarifs" style={{ padding: '96px 32px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Badge>Tarification transparente</Badge>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 12, letterSpacing: '-0.02em' }}>Investissez en toute sérénité.</h2>
          <p style={{ fontSize: 17, color: '#7a9aaa' }}>Des tarifs simples pour sécuriser votre futur chez-vous.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="price-grid">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              style={{ padding: '28px 24px', borderRadius: 24, background: '#fff', border: plan.highlighted ? '2px solid #2a7d9c' : '1px solid hsl(200,15%,92%)', position: 'relative', boxShadow: plan.highlighted ? '0 12px 40px rgba(42,125,156,0.15)' : '0 2px 12px rgba(15,45,61,0.05)' }}
            >
              {plan.badge && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', padding: '5px 16px', borderRadius: 100, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: plan.badgeColor === 'teal' ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : '#f59e0b', color: '#fff' }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: plan.highlighted ? 'rgba(42,125,156,0.1)' : 'hsl(200,20%,96%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{plan.icon}</div>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f2d3d', textAlign: 'center', marginBottom: 8 }}>{plan.name}</h3>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#0f2d3d' }}>{plan.price.toFixed(2).replace('.', ',')}</span>
                <span style={{ fontSize: 16, color: '#7a9aaa' }}>€</span>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: plan.highlighted ? 'rgba(42,125,156,0.06)' : 'hsl(200,20%,97%)', marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 3 }}>+ IDÉAL POUR</div>
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
              <Link to={`/inscription?plan=${plan.id}`} style={{ display: 'block', padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, color: plan.highlighted ? '#fff' : '#0f2d3d', background: plan.highlighted ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : 'transparent', border: plan.highlighted ? 'none' : '2px solid #0f2d3d', textDecoration: 'none', textAlign: 'center', boxShadow: plan.highlighted ? '0 6px 20px rgba(42,125,156,0.3)' : 'none' }}>
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

/* ════════════════════════════════════════════════════════════
   CTA FINAL
════════════════════════════════════════════════════════════ */
function CtaSection() {
  return (
    <section style={{ padding: '96px 32px', background: 'linear-gradient(135deg,#0f2d3d 0%,#2a7d9c 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(240,165,0,0.07)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Votre prochain bien mérite une analyse complète.
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 44 }}>
          Rejoignez les acheteurs qui décident avec les bons éléments. Dès 4,99€, en moins de 2 minutes.
        </motion.p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/tarifs" style={{ padding: '16px 44px', borderRadius: 16, fontSize: 16, fontWeight: 700, color: '#0f2d3d', background: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            Commencer maintenant <ArrowRight size={18} />
          </Link>
          <Link to="/exemple" style={{ padding: '16px 30px', borderRadius: 16, fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(255,255,255,0.25)', textDecoration: 'none' }}>
            Voir un exemple
          </Link>
        </div>
      </div>
    </section>
  );
}

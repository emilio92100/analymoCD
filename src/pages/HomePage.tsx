import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, AlertTriangle, Banknote, Scale,
  TrendingUp, FileText, Target, ShieldCheck, Trash2,
  Building2, UserCheck, BadgeCheck, Clock, Star,
  ChevronDown, X, Check, Zap,
} from 'lucide-react';

/* ── helpers ── */
function useInView(t = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [t]);
  return { ref, inView: v };
}


/* ════════════════════════════════════════════════════════
   EXPORT
════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", overflow: 'hidden' }}>
      <Hero />
      <Marquee />
      <Why />
      <ForWho />
      <HowItWorks />
      <AvantApres />
      <Testimonials />
      <CtaFinal />
      <style>{`
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse3 { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes grow { from{width:0} to{width:var(--w)} }
        .pulse3{animation:pulse3 2s ease-in-out infinite}
        @media(max-width:860px){
          .hero-cols{flex-direction:column!important;gap:0!important;min-height:auto!important}
          .hero-left{min-height:50vh!important;padding:80px 24px 40px!important}
          .hero-right{min-height:50vh!important;padding:40px 24px 60px!important}
          .why-g{grid-template-columns:repeat(2,1fr)!important}
          .fw-g{grid-template-columns:1fr!important}
          .steps-g{grid-template-columns:1fr!important}
          .av-g{grid-template-columns:1fr!important;gap:16px!important}
          .testi-g{grid-template-columns:1fr!important}
        }
        @media(max-width:560px){
          .why-g{grid-template-columns:1fr!important}
        }
      `}</style>
    </main>
  );
}

/* ════════════════════════════════════════════════════════
   HERO — split screen, texte choc à droite
════════════════════════════════════════════════════════ */
function Hero() {
  const sRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sRef, offset: ['start start', 'end start'] });
  const leftY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const rightY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <section ref={sRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', minHeight: '100vh' }} className="hero-cols">

        {/* LEFT — fond teal foncé, subtitles */}
        <motion.div style={{ y: leftY, flex: 1, background: 'linear-gradient(160deg,#0f2d3d 0%,#1a4a60 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 56px 80px', position: 'relative', overflow: 'hidden' }} className="hero-left">
          {/* deco */}
          <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(42,125,156,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(240,165,0,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          {/* Badge */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 48, width: 'fit-content', letterSpacing: '0.04em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} className="pulse3" />
            ANALYMO · ANALYSE DOCUMENTAIRE
          </motion.div>

          {/* Left big label */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
            <div style={{ fontSize: 'clamp(14px,1.4vw,18px)', fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Ce qu'Analymo vous évite
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                "40 pages de PV que personne ne lit",
                "Des travaux à 15 000€ découverts après la signature",
                "Un jargon juridique impossible à déchiffrer",
                "Une décision prise dans l'incertitude totale",
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <X size={11} style={{ color: '#f87171' }} />
                  </div>
                  <span style={{ fontSize: 'clamp(14px,1.3vw,17px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            style={{ marginTop: 56, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {[{ I: ShieldCheck, l: 'Données chiffrées' }, { I: Trash2, l: 'Suppression auto' }, { I: Zap, l: 'Résultats en 2 min' }].map(({ I, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                <I size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />{l}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT — fond blanc cassé, titre choc */}
        <motion.div style={{ y: rightY, flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 56px 80px', position: 'relative', overflow: 'hidden' }} className="hero-right">
          <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,125,156,0.07) 0%,transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.9 }}>
            <h1 style={{ fontSize: 'clamp(38px,5.5vw,78px)', fontWeight: 900, lineHeight: 1.0, color: '#0f2d3d', marginBottom: 28, letterSpacing: '-0.04em' }}>
              Vos docs<br />
              immo,{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ color: '#2a7d9c' }}>décryptés</span>
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
                  style={{ position: 'absolute', bottom: 2, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#2a7d9c,#f0a500)', borderRadius: 2, transformOrigin: 'left' }} />
              </span>
              <br />en 2 min.
            </h1>

            <p style={{ fontSize: 'clamp(15px,1.4vw,19px)', color: '#4a6b7c', lineHeight: 1.75, marginBottom: 40, maxWidth: 440 }}>
              PV d'AG, règlement de copropriété, diagnostics, appels de charges — Analymo lit tout,
              extrait l'essentiel et vous donne une recommandation claire{' '}
              <strong style={{ color: '#0f2d3d', fontWeight: 700 }}>avant que vous signiez.</strong>
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link to="/tarifs"
                style={{ padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 32px rgba(42,125,156,0.3)', transition: 'transform .2s,box-shadow .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(42,125,156,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(42,125,156,0.3)'; }}>
                Lancer mon analyse <ArrowRight size={17} />
              </Link>
              <Link to="/exemple"
                style={{ padding: '16px 26px', borderRadius: 14, fontSize: 16, fontWeight: 600, color: '#0f2d3d', border: '1.5px solid rgba(15,45,61,0.15)', textDecoration: 'none', background: '#fff', display: 'flex', alignItems: 'center', gap: 7, transition: 'border-color .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(15,45,61,0.15)'}>
                Voir un exemple
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex' }}>
                {['ML', 'TR', 'SD', 'CB', 'PG'].map((ini, i) => (
                  <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${195 + i * 20},52%,${36 + i * 4}%)`, border: '2px solid #f8fafc', marginLeft: i === 0 ? 0 : -10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{ini}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#0f2d3d', fontWeight: 700 }}>+200 acheteurs satisfaits</div>
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {[0, 1, 2, 3, 4].map(j => <Star key={j} size={11} fill="#f59e0b" color="#f59e0b" />)}
                  <span style={{ fontSize: 11, color: '#7a9aaa', marginLeft: 4 }}>4,8/5</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
            style={{ position: 'absolute', bottom: 32, right: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7a9aaa' }}>Découvrir</span>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown size={18} style={{ color: '#7a9aaa' }} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   MARQUEE — stats défilantes
════════════════════════════════════════════════════════ */
function Marquee() {
  const items = ['200+ analyses réalisées', '2 minutes chrono', '98% de satisfaction', '~8 000€ économisés en moyenne', 'Zéro donnée conservée', 'Rapport PDF inclus', 'Paiement sécurisé Stripe', '200+ analyses réalisées', '2 minutes chrono', '98% de satisfaction', '~8 000€ économisés en moyenne', 'Zéro donnée conservée', 'Rapport PDF inclus', 'Paiement sécurisé Stripe'];
  return (
    <div style={{ background: '#0f2d3d', padding: '14px 0', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', animation: 'marquee 28s linear infinite', width: 'max-content' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', padding: '0 32px' }}>{item}</span>
            <span style={{ color: 'rgba(42,125,156,0.6)', fontSize: 16 }}>·</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   WHY — storytelling avec grande carte score
════════════════════════════════════════════════════════ */
function Why() {
  const sRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sRef, offset: ['start end', 'end start'] });
  const titleX = useTransform(scrollYProgress, [0, 0.5], [-40, 0]);
  const titleOp = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  const cards = [
    { I: AlertTriangle, title: 'Risques détectés', items: ['Travaux votés non réalisés', 'Impayés copropriétaires', 'Procédures judiciaires'], c: '#ef4444', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.15)' },
    { I: Banknote, title: 'Santé financière', items: ['Budget prévisionnel', 'Fonds de travaux évalué', 'Charges futures'], c: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.15)' },
    { I: Scale, title: 'Conformité juridique', items: ['Diagnostics vérifiés', 'Clauses abusives', 'Règlement copro'], c: '#3b82f6', bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.15)' },
    { I: TrendingUp, title: 'Potentiel du bien', items: ["Historique travaux", "État général immeuble", "Valorisation estimée"], c: '#22c55e', bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.15)' },
  ];

  return (
    <section ref={sRef} style={{ padding: '96px 0', background: '#fff', overflow: 'hidden' }}>
      {/* Section label */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', marginBottom: 64 }}>
        <motion.div style={{ x: titleX, opacity: titleOp }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ height: 2, width: 48, background: '#2a7d9c', borderRadius: 1 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pourquoi Analymo</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: '#0f2d3d', lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 640 }}>
            Un score unique.<br />
            <span style={{ color: '#2a7d9c' }}>Tout comprendre</span> d'un coup d'œil.
          </h2>
        </motion.div>
      </div>

      {/* Full-width score band */}
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{ background: '#0f2d3d', padding: '52px 40px', marginBottom: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(42,125,156,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap', position: 'relative' }}>
          {/* Score ring */}
          <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle cx="70" cy="70" r="58" fill="none" stroke="#2a7d9c" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={364} initial={{ strokeDashoffset: 364 }}
                whileInView={{ strokeDashoffset: 364 - 364 * 0.74 }} viewport={{ once: true }} transition={{ duration: 1.8, delay: 0.3 }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1 }}>74</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.1em' }}>/100</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ fontSize: 'clamp(18px,2.4vw,28px)', fontWeight: 900, color: '#fff', marginBottom: 10 }}>
              Score global · Risques · Finances · Juridique
            </h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 500, marginBottom: 20 }}>
              Chaque document est lu, analysé et condensé en un score de fiabilité avec recommandation claire. Tout ce qu'il faut pour décider — en moins de 2 minutes.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[{ l: '98% risques détectés', I: Target }, { l: '< 2 min', I: Clock }, { l: '0 donnée conservée', I: ShieldCheck }].map((b, j) => (
                <motion.div key={j} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + j * 0.09 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                  <b.I size={12} />{b.l}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Score breakdown bars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px', flexShrink: 0, minWidth: 220 }}>
            {[{ l: 'Financier', v: 68, c: '#f0a500' }, { l: 'Travaux', v: 62, c: '#fb923c' }, { l: 'Juridique', v: 88, c: '#4ade80' }, { l: 'Charges', v: 80, c: '#60a5fa' }].map((s, i) => (
              <div key={s.l}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.l}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.c }}>{s.v}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.v}%` }} viewport={{ once: true }} transition={{ delay: i * 0.1 + 0.4, duration: 0.8 }}
                    style={{ height: '100%', borderRadius: 2, background: s.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 4 cards */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="why-g">
          {cards.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(15,45,61,0.09)' }}
              style={{ padding: '24px', borderRadius: 20, border: `1px solid ${c.border}`, background: '#fff', position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'box-shadow .25s' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg,${c.bg},transparent)` }} />
              <div style={{ position: 'relative' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <c.I size={19} style={{ color: c.c }} />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f2d3d', marginBottom: 12 }}>{c.title}</h4>
                {c.items.map((it, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: '#6b8a96', marginBottom: 6 }}>
                    <CheckCircle2 size={12} style={{ color: c.c, flexShrink: 0, marginTop: 2 }} />{it}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: 44 }}>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', borderRadius: 13, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 7px 24px rgba(42,125,156,0.27)' }}>
            Lancer l'analyse <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   FOR WHO — acheteurs en vedette + pros compacts
════════════════════════════════════════════════════════ */
function ForWho() {
  const pros = [
    { title: 'Notaires', desc: 'Synthèse claire, dossiers préparés plus vite.', I: ShieldCheck, c: '#2a7d9c', bg: 'rgba(42,125,156,0.07)' },
    { title: 'Agents immo', desc: 'Rapport de transparence pour vos acquéreurs.', I: UserCheck, c: '#8b5cf6', bg: 'rgba(139,92,246,0.07)' },
    { title: 'Syndics', desc: "Transmissions d'info fluides lors des ventes.", I: Building2, c: '#f59e0b', bg: 'rgba(245,158,11,0.07)' },
    { title: 'Marchands de biens', desc: "Risques et potentiel identifiés instantanément.", I: BadgeCheck, c: '#22c55e', bg: 'rgba(34,197,94,0.07)' },
  ];

  return (
    <section style={{ padding: '88px 0', background: '#f8fafc', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ height: 2, width: 48, background: '#2a7d9c', borderRadius: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pour qui</span>
        </div>

        {/* Main buyers — horizontal split */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 24, overflow: 'hidden', marginBottom: 20, boxShadow: '0 8px 48px rgba(15,45,61,0.1)' }}>
          {/* Left dark */}
          <div style={{ background: 'linear-gradient(145deg,#2a7d9c,#0f2d3d)', padding: '44px 40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -50, bottom: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <span style={{ display: 'inline-block', padding: '4px 13px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>⭐ Audience principale</span>
            <h3 style={{ fontSize: 'clamp(20px,2.8vw,32px)', fontWeight: 900, color: '#fff', marginBottom: 14, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Acheteurs<br />Particuliers
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 24 }}>
              Primo-accédants ou investisseurs — ne laissez aucun document vous surprendre après la signature.
            </p>
            <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 11, background: '#fff', color: '#0f2d3d', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Commencer <ArrowRight size={14} />
            </Link>
          </div>

          {/* Right checkmarks */}
          <div style={{ background: '#fff', padding: '44px 40px', borderLeft: '1px solid #edf2f4' }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f2d3d', marginBottom: 24 }}>Ce qu'Analymo détecte pour vous</h4>
            {[
              "Travaux votés et leur coût estimé par lot",
              "Santé financière réelle de la copropriété",
              "Procédures judiciaires ou impayés en cours",
              "Conformité des diagnostics obligatoires",
              "Points de vigilance avant de faire une offre",
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderBottom: i < 4 ? '1px solid #f4f6f8' : 'none' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={12} style={{ color: '#22c55e' }} />
                </div>
                <span style={{ fontSize: 13, color: '#0f2d3d', fontWeight: 500 }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pro cards — horizontal strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }} className="fw-g">
          {pros.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, boxShadow: '0 10px 32px rgba(15,45,61,0.08)' }}
              style={{ padding: '22px 20px', borderRadius: 18, background: '#fff', border: '1px solid #edf2f4', cursor: 'default', transition: 'box-shadow .2s' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <p.I size={18} style={{ color: p.c }} />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', marginBottom: 6 }}>{p.title}</h4>
              <p style={{ fontSize: 12, color: '#7a9aaa', lineHeight: 1.55 }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   HOW IT WORKS — timeline verticale élégante
════════════════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { n: '01', I: FileText, title: 'Importez vos documents', text: "Déposez vos PV d'AG, règlements de copropriété, diagnostics et appels de charges. PDF, Word ou image — on s'occupe du reste.", c: '#2a7d9c', bg: 'rgba(42,125,156,0.1)' },
    { n: '02', I: Target, title: 'Notre moteur analyse tout', text: 'Chaque ligne est passée au crible. Risques, finances, travaux votés, conformité juridique — rien ne passe à travers les mailles.', c: '#0f2d3d', bg: 'rgba(15,45,61,0.08)' },
    { n: '03', I: CheckCircle2, title: 'Vous recevez votre rapport', text: 'Score global, points de vigilance classés par priorité, recommandation finale. Prêt à négocier, ou à passer votre chemin.', c: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  ];

  return (
    <section style={{ padding: '88px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 56 }}>
          <div style={{ height: 2, width: 48, background: '#2a7d9c', borderRadius: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Comment ça marche</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          {/* Left: big headline */}
          <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 style={{ fontSize: 'clamp(30px,4vw,54px)', fontWeight: 900, color: '#0f2d3d', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 28 }}>
              Trois étapes.<br />
              <span style={{ color: '#2a7d9c' }}>Une décision</span><br />
              éclairée.
            </h2>
            <p style={{ fontSize: 16, color: '#6b8a96', lineHeight: 1.75, marginBottom: 36, maxWidth: 380 }}>
              Pas de formation, pas de jargon. Vous déposez vos fichiers — Analymo fait tout le reste en moins de 2 minutes.
            </p>
            <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 13, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 7px 24px rgba(42,125,156,0.27)' }}>
              Essayer maintenant — dès 4,99€ <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Right: steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 20, top: 44, bottom: 44, width: 2, background: 'linear-gradient(to bottom,#2a7d9c,rgba(42,125,156,0.1))' }} />

            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                style={{ display: 'flex', gap: 24, paddingBottom: i < steps.length - 1 ? 32 : 0, position: 'relative' }}>
                {/* Circle */}
                <div style={{ width: 42, height: 42, borderRadius: '50%', border: `2px solid ${s.c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, background: '#fff', boxShadow: `0 0 0 6px #fff` }}>
                  <s.I size={18} style={{ color: s.c }} />
                </div>
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: s.c, letterSpacing: '0.1em', marginBottom: 6 }}>{s.n}</div>
                  <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0f2d3d', marginBottom: 8 }}>{s.title}</h4>
                  <p style={{ fontSize: 13, color: '#7a9aaa', lineHeight: 1.65 }}>{s.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   AVANT / APRÈS — horizontal cinematic
════════════════════════════════════════════════════════ */
function AvantApres() {
  const { ref, inView } = useInView(0.1);

  const before = [
    "Des dizaines de pages illisibles à parcourir seul",
    "Du jargon juridique sans traduction claire",
    "Des travaux découverts après la signature",
    "Une décision prise dans l'incertitude totale",
    "Des milliers d'euros de mauvaises surprises",
  ];
  const after = [
    "Un rapport structuré en 2 minutes chrono",
    "Les risques mis en avant, sans jargon",
    "Travaux et charges détectés en amont",
    "Une offre négociée sur des bases solides",
    "Des économies significatives avant la signature",
  ];

  return (
    <section ref={ref} style={{ padding: '0', background: '#f8fafc', overflow: 'hidden' }}>
      {/* Full-width header */}
      <div style={{ background: '#0f2d3d', padding: '56px 40px 48px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
          <div style={{ height: 1, width: 40, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Avant / Après</span>
          <div style={{ height: 1, width: 40, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <h2 style={{ fontSize: 'clamp(26px,4vw,50px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          Deux façons d'acheter.<br />
          <span style={{ color: '#2a7d9c' }}>Une seule bonne.</span>
        </h2>
      </div>

      {/* Split columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="av-g">
        {/* SANS */}
        <motion.div initial={{ opacity: 0, x: -24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7 }}
          style={{ padding: '48px 48px', background: '#fff', borderRight: '1px solid #edf2f4' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '7px 18px', borderRadius: 100, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 32 }}>
            <X size={14} /> Sans Analymo
          </div>
          {before.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.08 + 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < before.length - 1 ? '1px solid #fef2f2' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={12} style={{ color: '#dc2626' }} />
              </div>
              <span style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.4 }}>{item}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* AVEC */}
        <motion.div initial={{ opacity: 0, x: 24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}
          style={{ padding: '48px 48px', background: '#f0f9f4' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '7px 18px', borderRadius: 100, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 32 }}>
            <Check size={14} /> Avec Analymo
          </div>
          {after.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.08 + 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < after.length - 1 ? '1px solid rgba(34,197,94,0.08)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={12} style={{ color: '#22c55e' }} />
              </div>
              <span style={{ fontSize: 14, color: '#0f2d3d', fontWeight: 500, lineHeight: 1.4 }}>{item}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   TESTIMONIALS — cards épurées
════════════════════════════════════════════════════════ */
function Testimonials() {
  const testimonials = [
    { name: 'Marie L.', role: 'Primo-accédante, Lyon', initials: 'ML', color: '#2a7d9c', text: "Analymo m'a signalé un ravalement à 12 000€. J'ai renégocié. Inestimable avant une signature." },
    { name: 'Thomas R.', role: 'Investisseur, Paris', initials: 'TR', color: '#0f2d3d', text: "De 3h par dossier à 15 minutes. Quand on analyse 10 biens par mois, le gain est immédiat." },
    { name: 'Sophie D.', role: 'Acheteuse, Bordeaux', initials: 'SD', color: '#0f6e56', text: "Rapport clair, scores par catégorie. Mon notaire a été impressionné. À recommander." },
  ];

  return (
    <section style={{ padding: '88px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 52 }}>
          <div style={{ height: 2, width: 48, background: '#2a7d9c', borderRadius: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Ils nous font confiance</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="testi-g">
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 14px 40px rgba(15,45,61,0.08)' }}
              style={{ padding: '32px', borderRadius: 20, background: '#f8fafc', border: '1px solid #edf2f4', cursor: 'default', transition: 'box-shadow .25s' }}>
              {/* Quote mark */}
              <div style={{ fontSize: 48, lineHeight: 1, color: '#2a7d9c', opacity: 0.2, fontFamily: 'Georgia,serif', marginBottom: 8 }}>"</div>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, marginBottom: 24, fontStyle: 'italic' }}>{t.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#7a9aaa' }}>{t.role}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                  {[0, 1, 2, 3, 4].map(j => <Star key={j} size={12} fill="#f59e0b" color="#f59e0b" />)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   CTA FINAL — full width dramatic
════════════════════════════════════════════════════════ */
function CtaFinal() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Split background */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 320 }}>
        <div style={{ background: '#0f2d3d', padding: '72px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(42,125,156,0.12)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <motion.h2 initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ fontSize: 'clamp(26px,3.5vw,46px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 16 }}>
            Votre prochain bien<br />
            mérite une analyse<br />
            <span style={{ color: '#2a7d9c' }}>complète.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Dès 4,99€ · Sans abonnement · Résultats en 2 min
          </motion.p>
        </div>
        <div style={{ background: '#f0f8fc', padding: '72px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Link to="/tarifs"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderRadius: 16, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(42,125,156,0.28)', marginBottom: 14 }}>
              <span>Lancer mon analyse</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/exemple"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', borderRadius: 16, background: '#fff', color: '#0f2d3d', fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1.5px solid #edf2f4', boxShadow: '0 2px 8px rgba(15,45,61,0.05)' }}>
              <span>Voir un exemple de rapport</span>
              <ArrowRight size={18} style={{ color: '#7a9aaa' }} />
            </Link>
            <p style={{ fontSize: 12, color: '#7a9aaa', textAlign: 'center', marginTop: 16 }}>
              Paiement sécurisé · Données supprimées automatiquement · Sans engagement
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

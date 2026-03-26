import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, AlertTriangle, Banknote, Scale,
  TrendingUp, FileText, ShieldCheck, Building2,
  UserCheck, BadgeCheck, Check, X, Star, ChevronRight,
} from 'lucide-react';

function useInView(t = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [t]);
  return { ref, inView: v };
}

export default function HomePage() {
  return (
    <main style={{ background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#0f172a' }}>
      <HeroSection />
      <LogosSection />
      <FeaturesSection />
      <ForWhoSection />
      <HowSection />
      <AvantApresSection />
      <TestimonialsSection />
      <CtaSection />
      <style>{`
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes dot { 0%,100%{opacity:1} 50%{opacity:.3} }
        .dot { animation: dot 2s ease-in-out infinite; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media(max-width:768px) {
          .hero-ctas { flex-direction: column !important; align-items: stretch !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .forwho-grid { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .av-grid { grid-template-columns: 1fr !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .cta-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

/* ── HERO ─────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '120px 24px 80px', textAlign: 'center',
      background: '#fff',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle gradient bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(42,125,156,0.07) 0%, transparent 70%)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: 'relative', maxWidth: 860, width: '100%' }}
      >
        {/* Eyebrow badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 100,
          border: '1px solid #e2e8f0', background: '#f8fafc',
          fontSize: 13, fontWeight: 600, color: '#64748b',
          marginBottom: 32,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} className="dot" />
          Analyse documentaire immobilier · Dès 4,99€
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: 'clamp(44px, 7vw, 88px)',
          fontWeight: 900,
          lineHeight: 1.0,
          letterSpacing: '-0.04em',
          color: '#0f172a',
          marginBottom: 28,
        }}>
          Arrêtez de signer<br />
          <span style={{
            background: 'linear-gradient(135deg, #2a7d9c 0%, #0f2d3d 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>les yeux fermés.</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: 'clamp(17px, 2vw, 21px)',
          color: '#64748b', lineHeight: 1.7,
          maxWidth: 600, margin: '0 auto 44px',
          fontWeight: 400,
        }}>
          Analymo décrypte vos PV d'AG, règlements de copropriété
          et diagnostics — et vous livre un rapport clair en{' '}
          <strong style={{ color: '#0f172a', fontWeight: 700 }}>moins de 2 minutes</strong>.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }} className="hero-ctas">
          <Link to="/tarifs" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 32px', borderRadius: 12,
            background: '#0f172a', color: '#fff',
            fontSize: 16, fontWeight: 700, textDecoration: 'none',
            transition: 'transform .15s, box-shadow .15s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)'; }}
          >
            Lancer mon analyse <ArrowRight size={17} />
          </Link>
          <Link to="/exemple" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 28px', borderRadius: 12,
            background: '#fff', color: '#0f172a',
            fontSize: 16, fontWeight: 600, textDecoration: 'none',
            border: '1px solid #e2e8f0',
            transition: 'border-color .15s, background .15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#fff'; }}
          >
            Voir un exemple
          </Link>
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ display: 'flex' }}>
            {['#2a7d9c', '#0f2d3d', '#0f6e56', '#7c3aed', '#d97706'].map((bg, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: '50%', background: bg,
                border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: '#fff',
              }}>
                {['ML', 'TR', 'SD', 'CB', 'PG'][i]}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
              {[0,1,2,3,4].map(j => <Star key={j} size={12} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              <strong style={{ color: '#0f172a' }}>+200 acheteurs</strong> font confiance à Analymo
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dashboard preview */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{ marginTop: 72, width: '100%', maxWidth: 960, position: 'relative' }}
      >
        <DashboardPreview />
      </motion.div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div style={{
      borderRadius: 20, border: '1px solid #e2e8f0',
      boxShadow: '0 32px 80px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset',
      overflow: 'hidden', background: '#f8fafc',
    }}>
      {/* Window bar */}
      <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
        <div style={{ flex: 1, margin: '0 12px', background: '#e2e8f0', borderRadius: 6, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>app.analymo.fr/rapport</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Score card */}
        <div style={{ gridColumn: '1', padding: '20px', borderRadius: 14, background: '#0f172a', color: '#fff' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 12 }}>SCORE GLOBAL</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#f0a500', lineHeight: 1, marginBottom: 4 }}>78</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>sur 100 · Négocier</div>
          <div style={{ marginTop: 16, padding: '8px 12px', borderRadius: 8, background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.2)' }}>
            <div style={{ fontSize: 11, color: '#f0a500', fontWeight: 600 }}>→ Recommandation : négocier le prix à la baisse</div>
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ gridColumn: '2', padding: '20px', borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 16 }}>SCORES DÉTAILLÉS</div>
          {[
            { l: 'Financier', v: 68, c: '#f0a500' },
            { l: 'Travaux', v: 62, c: '#fb923c' },
            { l: 'Juridique', v: 88, c: '#22c55e' },
            { l: 'Charges', v: 80, c: '#2a7d9c' },
          ].map(s => (
            <div key={s.l} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{s.l}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.c }}>{s.v}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: '#f1f5f9' }}>
                <motion.div
                  initial={{ width: 0 }} whileInView={{ width: `${s.v}%` }}
                  viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                  style={{ height: '100%', borderRadius: 2, background: s.c }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div style={{ gridColumn: '3', padding: '20px', borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 8 }}>POINTS DE VIGILANCE</div>
          {[
            { text: 'Ravalement voté — ~2 400€ en 2026', level: 'warn' },
            { text: 'Fonds travaux sous-provisionné', level: 'warn' },
            { text: '3 copropriétaires en impayé', level: 'info' },
            { text: 'DPE classe C — conforme', level: 'ok' },
          ].map((a, i) => (
            <div key={i} style={{
              padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 500,
              background: a.level === 'warn' ? '#fffbeb' : a.level === 'ok' ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${a.level === 'warn' ? '#fde68a' : a.level === 'ok' ? '#bbf7d0' : '#e2e8f0'}`,
              color: a.level === 'warn' ? '#92400e' : a.level === 'ok' ? '#15803d' : '#64748b',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              {a.level === 'warn' && <AlertTriangle size={11} />}
              {a.level === 'ok' && <CheckCircle2 size={11} />}
              {a.level === 'info' && <FileText size={11} />}
              {a.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── LOGOS / STATS ────────────────────────────────────── */
function LogosSection() {
  const stats = [
    { value: '200+', label: 'Analyses réalisées' },
    { value: '2 min', label: 'Temps moyen' },
    { value: '98%', label: 'Satisfaction client' },
    { value: '~8 000€', label: 'Économisés en moyenne' },
  ];
  return (
    <section style={{ padding: '0 24px 80px', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9', background: '#f1f5f9' }}>
        {stats.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            style={{ background: '#fff', padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── FEATURES / WHY ───────────────────────────────────── */
function FeaturesSection() {
  const cards = [
    { I: AlertTriangle, title: 'Risques détectés', desc: 'Travaux votés, impayés de copropriétaires, procédures judiciaires en cours.', c: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    { I: Banknote, title: 'Santé financière', desc: 'Budget prévisionnel analysé, fonds de travaux évalué, charges futures estimées.', c: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { I: Scale, title: 'Conformité juridique', desc: 'Diagnostics obligatoires vérifiés, clauses abusives identifiées, règlement copro.', c: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    { I: TrendingUp, title: 'Potentiel du bien', desc: "Historique des travaux réalisés, état général de l'immeuble, valorisation estimée.", c: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  ];

  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Pourquoi Analymo</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 16, lineHeight: 1.15 }}>
            Un rapport sur 4 dimensions.<br />Zéro surprise après la signature.
          </h2>
          <p style={{ fontSize: 17, color: '#64748b', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            L'achat immobilier est l'investissement d'une vie. Analymo lit ce que personne ne lit — et vous dit exactement ce qui compte.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="features-grid">
          {cards.map((c, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{
                padding: '28px 24px', borderRadius: 16,
                background: '#fff', border: '1px solid #f1f5f9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'box-shadow .2s, transform .2s', cursor: 'default',
              }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(15,23,42,0.08)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <c.I size={20} style={{ color: c.c }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{c.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Score showcase */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ marginTop: 20, padding: '40px 48px', borderRadius: 20, background: '#0f172a', display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
              <motion.circle cx="60" cy="60" r="50" fill="none" stroke="#2a7d9c" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={314} initial={{ strokeDashoffset: 314 }}
                whileInView={{ strokeDashoffset: 314 - 314 * 0.74 }} viewport={{ once: true }} transition={{ duration: 1.6, delay: 0.2 }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>74</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>/100</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>Un score unique pour tout comprendre</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 440 }}>
              Chaque document analysé, chaque risque pesé, chaque charge estimée — condensé en un score et une recommandation claire.
            </p>
          </div>
          <Link to="/tarifs" style={{ padding: '13px 28px', borderRadius: 11, background: '#fff', color: '#0f172a', fontSize: 14, fontWeight: 700, textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
            Lancer l'analyse <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ── FOR WHO ──────────────────────────────────────────── */
function ForWhoSection() {
  const pros = [
    { title: 'Notaires', desc: 'Synthèse claire, dossiers préparés plus vite, clients mieux informés.', I: ShieldCheck },
    { title: 'Agents immobiliers', desc: 'Rapport de transparence qui valorise votre devoir de conseil.', I: UserCheck },
    { title: 'Syndics', desc: "Transmission d'informations fluide lors des ventes en copropriété.", I: Building2 },
    { title: 'Marchands de biens', desc: 'Risques et potentiel identifiés instantanément avant acquisition.', I: BadgeCheck },
  ];

  return (
    <section style={{ padding: '96px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Pour qui</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 14, lineHeight: 1.15 }}>
            Une solution pour chaque acteur.
          </h2>
          <p style={{ fontSize: 17, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
            Particulier ou professionnel, Analymo s'adapte à votre besoin.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 16 }} className="forwho-grid">
          {/* Main buyers */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ padding: '40px 36px', borderRadius: 20, background: '#0f172a', gridRow: '1 / 2' }}>
            <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', marginBottom: 20 }}>ACHETEURS PARTICULIERS</span>
            <h3 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#fff', marginBottom: 14, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Ne signez plus<br />les yeux fermés.
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 28 }}>
              Analymo décrypte la santé financière de la copropriété, les travaux à venir et les risques juridiques — avant que vous fassiez une offre.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {["Comprendre les PV d'AG", "Anticiper les travaux votés", "Vérifier les finances", "Décider avec confiance"].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                  <CheckCircle2 size={15} style={{ color: '#22c55e', flexShrink: 0 }} />{item}
                </div>
              ))}
            </div>
            <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 10, background: '#fff', color: '#0f172a', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Commencer <ChevronRight size={15} />
            </Link>
          </motion.div>

          {/* Pro cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pros.slice(0, 2).map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 + 0.1 }}
                style={{ padding: '24px', borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', flex: 1 }}
                whileHover={{ boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <p.I size={18} style={{ color: '#2a7d9c' }} />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{p.title}</h4>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55 }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pros.slice(2, 4).map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 + 0.2 }}
                style={{ padding: '24px', borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', flex: 1 }}
                whileHover={{ boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <p.I size={18} style={{ color: '#2a7d9c' }} />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{p.title}</h4>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55 }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── HOW ──────────────────────────────────────────────── */
function HowSection() {
  const steps = [
    { n: '01', I: FileText, title: 'Importez vos documents', desc: "PV d'AG, règlements, diagnostics, appels de charges. PDF, Word ou image.", c: '#2a7d9c' },
    { n: '02', I: TrendingUp, title: 'Notre moteur analyse tout', desc: 'Chaque ligne scannée. Risques, travaux, finances et conformité passés au crible.', c: '#0f172a' },
    { n: '03', I: CheckCircle2, title: 'Rapport clair & actionnable', desc: 'Score, vigilances classées par priorité, recommandation. Prêt à négocier.', c: '#22c55e' },
  ];

  return (
    <section style={{ padding: '96px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Comment ça marche</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 14, lineHeight: 1.15 }}>
            Trois étapes. Deux minutes.
          </h2>
          <p style={{ fontSize: 17, color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
            Pas de formation, pas de jargon. Vous déposez — on analyse.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, borderRadius: 20, overflow: 'hidden', border: '1px solid #f1f5f9', background: '#f1f5f9' }} className="how-grid">
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ padding: '36px 32px', background: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 24, right: 24, fontSize: 72, fontWeight: 900, color: '#f8fafc', lineHeight: 1, userSelect: 'none' }}>{s.n}</div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.c}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' }}>
                <s.I size={22} style={{ color: s.c }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 10, lineHeight: 1.3 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{s.desc}</p>
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 28, height: 28, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 11, background: '#0f172a', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Essayer maintenant — dès 4,99€ <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── AVANT / APRÈS ────────────────────────────────────── */
function AvantApresSection() {
  const { ref, inView } = useInView();
  const before = [
    "40 pages de PV d'AG à déchiffrer seul",
    "Du jargon juridique sans traduction",
    "Des travaux découverts après la signature",
    "Une décision prise dans l'incertitude",
    "Des milliers d'euros de mauvaises surprises",
  ];
  const after = [
    "Rapport structuré clair en 2 minutes",
    "Les risques en français, sans jargon",
    "Travaux et charges détectés en amont",
    "Une offre négociée sur des bases solides",
    "Des économies avant même la signature",
  ];

  return (
    <section ref={ref} style={{ padding: '96px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Avant / Après</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.15 }}>
            Deux façons d'acheter.<br />Une seule bonne.
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="av-grid">
          {/* Sans */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}
            style={{ padding: '36px', borderRadius: 20, background: '#fff', border: '1px solid #fee2e2' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 28 }}>
              <X size={13} /> Sans Analymo
            </div>
            {before.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.07 + 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < before.length - 1 ? '1px solid #fef2f2' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={11} style={{ color: '#dc2626' }} />
                </div>
                <span style={{ fontSize: 14, color: '#64748b' }}>{item}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Avec */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
            style={{ padding: '36px', borderRadius: 20, background: '#fff', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 28 }}>
              <Check size={13} /> Avec Analymo
            </div>
            {after.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.07 + 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < after.length - 1 ? '1px solid #f0fdf4' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} style={{ color: '#22c55e' }} />
                </div>
                <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── TESTIMONIALS ─────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    { name: 'Marie L.', role: 'Primo-accédante · Lyon', initials: 'ML', color: '#2a7d9c', text: "Analymo m'a signalé un ravalement prévu à 12 000€. J'ai renégocié le prix à la baisse. Inestimable avant une signature." },
    { name: 'Thomas R.', role: 'Investisseur · Paris', initials: 'TR', color: '#0f172a', text: "De 3h par dossier à 15 minutes. Quand on analyse 10 biens par mois, le gain est immédiat et le ROI évident." },
    { name: 'Sophie D.', role: 'Acheteuse · Bordeaux', initials: 'SD', color: '#0f6e56', text: "Rapport clair, scores détaillés par catégorie. Mon notaire a été impressionné. Je recommande à tous les acheteurs." },
  ];

  return (
    <section style={{ padding: '96px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Témoignages</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.15 }}>
            Ils ont acheté avec Analymo.
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="testi-grid">
          {testimonials.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.09 }}
              style={{ padding: '32px', borderRadius: 20, background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'default' }}
              whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(15,23,42,0.07)' }}
            >
              <div style={{ fontSize: 40, lineHeight: 1, color: '#e2e8f0', fontFamily: 'Georgia,serif', marginBottom: 4 }}>"</div>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, marginBottom: 24 }}>{t.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[0,1,2,3,4].map(j => <Star key={j} size={12} fill="#f59e0b" color="#f59e0b" />)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA FINAL ────────────────────────────────────────── */
function CtaSection() {
  return (
    <section style={{ padding: '96px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ padding: '72px 56px', borderRadius: 28, background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(42,125,156,0.12)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(240,165,0,0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Votre prochain bien mérite<br />une analyse complète.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 40 }}>
              Dès 4,99€ · Sans abonnement · Résultats en moins de 2 minutes
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/tarifs" style={{ padding: '15px 36px', borderRadius: 12, background: '#fff', color: '#0f172a', fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                Commencer maintenant <ArrowRight size={17} />
              </Link>
              <Link to="/exemple" style={{ padding: '15px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', fontSize: 16, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
                Voir un exemple
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

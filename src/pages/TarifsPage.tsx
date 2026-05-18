import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, Check, X, Shield, Zap, FileText, Crown, Mail, GitCompare, ChevronDown } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { VerimoConfetti, VERIMO_CONFETTI_COLORS } from '../components/VerimoConfetti';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isLowPerf = () => isIOS() || (typeof window !== 'undefined' && window.innerWidth <= 768);

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const allFeatures = [
  { label: 'Avis Verimo personnalisé', tip: 'Conclusion rédigée par Verimo adaptée à votre profil d\'acheteur', simple: true, complete: true, pack2: true, pack3: true },
  { label: 'Score /20 + recommandation Verimo', tip: 'Note globale sur 20 avec recommandation : Acheter, Négocier ou Prudence', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Travaux votés et à prévoir', tip: 'Travaux décidés en AG et travaux à anticiper détectés dans vos documents', simple: 'partial', complete: true, pack2: true, pack3: true },
  { label: 'Santé financière copro', tip: 'Charges, fonds travaux, impayés et budget de la copropriété', simple: 'partial', complete: true, pack2: true, pack3: true },
  { label: 'Pistes de négociation', tip: 'Arguments concrets pour négocier le prix, affichés si le score est inférieur à 17/20', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Rapport PDF téléchargeable', tip: 'Téléchargez votre rapport complet au format PDF', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Compléter sous 7 jours', tip: 'Ajoutez des documents oubliés dans les 7 jours — le rapport est recalculé gratuitement', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Comparaison de biens', tip: 'Une vue côte à côte avec classement, points forts/faibles de chaque bien et écarts clés (charges, travaux, DPE…) — pour trancher d\'un coup d\'œil', simple: false, complete: false, pack2: true, pack3: true },
];

const plans = [
  {
    id: 'document',
    key: 'simple' as const,
    name: 'Simple',
    sub: 'Analysez un seul document',
    price: '4,90',
    perUnit: null,
    docsLabel: '1 seul fichier PDF',
    cta: 'Analyser un document',
    popular: false,
    badge: null,
    badgeColor: '',
    badgeBg: '',
    bonus: null,
  },
  {
    id: 'complete',
    key: 'complete' as const,
    name: 'Complète',
    sub: 'Analysez un bien avant d\'acheter',
    price: '19,90',
    perUnit: null,
    docsLabel: 'Jusqu\'à 15 fichiers en une fois',
    cta: 'Analyser mon bien',
    popular: true,
    badge: 'Recommandée',
    badgeColor: '#0c447c',
    badgeBg: '#e6f1fb',
    bonus: null,
  },
  {
    id: 'pack2',
    key: 'pack2' as const,
    name: 'Pack 2',
    sub: 'Comparez 2 biens',
    price: '29,90',
    perUnit: '14,95€ / bien',
    docsLabel: '2 × 15 fichiers simultanés',
    cta: 'Comparer 2 biens',
    popular: false,
    badge: '−25%',
    badgeColor: '#92400e',
    badgeBg: '#fef3c7',
    bonus: 'Économisez 10€',
  },
  {
    id: 'pack3',
    key: 'pack3' as const,
    name: 'Pack 3',
    sub: 'Analysez et classez',
    price: '39,90',
    perUnit: '13,30€ / bien',
    docsLabel: '3 × 15 fichiers simultanés',
    cta: 'Comparer 3 biens',
    popular: false,
    badge: '−33%',
    badgeColor: '#3C3489',
    badgeBg: '#EEEDFE',
    bonus: 'Économisez 20€',
  },
];

const tableRows = [
  { label: 'Avis Verimo personnalisé', tip: 'Conclusion rédigée par Verimo adaptée à votre profil d\'acheteur', vals: [true, true, true, true], type: 'bool' },
  { label: 'Documents analysés', tip: 'Nombre de fichiers PDF analysables simultanément pour un même bien', vals: ['1 doc', 'Jusqu\'à 15', '2 × 15', '3 × 15'], type: 'text' },
  { label: 'Score /20 + recommandation Verimo', tip: 'Note globale sur 20 avec recommandation : Acheter, Négocier ou Prudence', vals: [false, true, true, true], type: 'bool' },
  { label: 'Travaux votés et à prévoir', tip: 'Travaux décidés en AG et travaux à anticiper détectés dans vos documents', vals: ['Selon le doc', true, true, true], type: 'text_or_bool' },
  { label: 'Santé financière copro', tip: 'Charges, fonds travaux, impayés et budget de la copropriété', vals: ['Selon le doc', true, true, true], type: 'text_or_bool' },
  { label: 'Pistes de négociation', tip: 'Arguments pour négocier le prix, affichés si le score est inférieur à 17/20', vals: [false, true, true, true], type: 'bool' },
  { label: 'Compléter le dossier (7j)', tip: 'Ajoutez des documents oubliés dans les 7 jours — rapport recalculé gratuitement', vals: [false, true, true, true], type: 'bool' },
  { label: 'Rapport PDF téléchargeable', tip: 'Téléchargez votre rapport complet au format PDF', vals: [false, true, true, true], type: 'bool' },
  { label: 'Comparaison de biens', tip: 'Une vue côte à côte avec classement, points forts/faibles de chaque bien et écarts clés (charges, travaux, DPE…) — pour trancher d\'un coup d\'œil', vals: [false, false, true, true], type: 'bool' },
  { label: 'Économie vs achats séparés', tip: 'Réduction par rapport à l\'achat de chaque analyse individuellement', vals: ['—', '—', '−10€', '−20€'], type: 'text' },
];

/* ══════════════════════════════════════════
   COMPOSANTS
══════════════════════════════════════════ */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const _lp = isLowPerf();

  if (_lp) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      }, { threshold: 0.1 });
      obs.observe(el);
      return () => obs.disconnect();
    }, []);
    return (
      <div ref={ref} className={className} style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: `opacity 0.25s ease ${Math.min(delay, 0.05)}s, transform 0.25s ease ${Math.min(delay, 0.05)}s`,
      }}>
        {children}
      </div>
    );
  }

  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function TableCell({ val, isHighlight }: { val: boolean | string; isHighlight: boolean }) {
  const bg = isHighlight ? 'rgba(42,125,156,0.04)' : 'transparent';
  if (val === true) return (
    <td style={{ textAlign: 'center', padding: '12px 8px', background: bg, borderLeft: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={11} color="#16a34a" strokeWidth={2.5} />
        </div>
      </div>
    </td>
  );
  if (val === false) return (
    <td style={{ textAlign: 'center', padding: '12px 8px', background: bg, borderLeft: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={10} color="#cbd5e1" />
        </div>
      </div>
    </td>
  );
  const isAmber = typeof val === 'string' && val === 'Selon le doc';
  const isGreen = val !== '—' && val !== '1 doc' && !isAmber;
  return (
    <td style={{ textAlign: 'center', padding: '12px 8px', background: bg, borderLeft: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: isAmber ? 11 : 12.5, fontWeight: 700, color: val === '—' ? '#e2e8f0' : isAmber ? '#d97706' : isGreen ? '#16a34a' : '#2a7d9c' }}>{val as string}</span>
    </td>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function TarifsPage() {
  useSEO({
    title: 'Tarifs Verimo — Analyse de documents immobiliers dès 4,90€',
    description: "Faites analyser vos PV d'AG, DPE, diagnostics, règlement de copropriété, compromis, etc. dès 4,90€. Score /20, risques, santé financière. Sans abonnement.",
    canonical: '/tarifs',
  });

  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [hoveredTip, setHoveredTip] = useState<number | null>(null);

  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f4f7f9', paddingTop: 72, minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)',
        padding: 'clamp(44px,7vw,80px) 20px clamp(20px,3vw,32px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Cercles décoratifs */}
        <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(180deg, transparent 0%, #f4f7f9 100%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* Confettis — desktop (6) + mobile allégé (3) */}
        <div className="confetti-desktop" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <VerimoConfetti items={[
            { top: '18%', left: '6%', size: 10, color: VERIMO_CONFETTI_COLORS.blue, shape: 'circle' },
            { top: '28%', right: '8%', size: 12, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 0.5 },
            { top: '60%', left: '5%', size: 8, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1 },
            { top: '72%', right: '7%', size: 10, color: VERIMO_CONFETTI_COLORS.blue, shape: 'square', delay: 1.3 },
            { bottom: '20%', left: '10%', size: 8, color: VERIMO_CONFETTI_COLORS.red, shape: 'circle', delay: 0.8 },
            { bottom: '30%', right: '12%', size: 12, color: VERIMO_CONFETTI_COLORS.green, shape: 'circle', delay: 1.5 },
          ]} />
        </div>
        <div className="confetti-mobile" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <VerimoConfetti items={[
            { top: '12%', left: '4%', size: 6, color: VERIMO_CONFETTI_COLORS.blue, shape: 'circle' },
            { top: '50%', right: '4%', size: 7, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 0.6 },
            { bottom: '15%', left: '5%', size: 6, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1.1 },
          ]} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 12, fontWeight: 700, color: '#1a5e78', marginBottom: 20, letterSpacing: '0.06em' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse2 2s ease-in-out infinite' }} />
          TARIFICATION TRANSPARENTE
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          style={{ fontSize: 'clamp(28px,4.5vw,52px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 14 }}>
          Des tarifs simples, <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ color: '#2a7d9c' }}>sans surprise.</span>
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 4, background: 'rgba(42,125,156,0.25)', borderRadius: 99, transformOrigin: 'left', display: 'block' }} />
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.13 }}
          style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.65, textAlign: 'center', padding: '0 16px' }}>
          Sans abonnement. Sans engagement.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          {[{ I: Shield, l: 'Paiement sécurisé' }, { I: Zap, l: 'Résultats en 30s*' }, { I: FileText, l: 'PDF inclus' }, { I: Crown, l: 'Crédits sans expiration' }].map(({ I, l }) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 600 }}>
              <I size={14} style={{ color: '#2a7d9c', flexShrink: 0 }} /> {l}
            </div>
          ))}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
          style={{ marginTop: 14, fontSize: 12, color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
          * Moyenne observée sur une analyse simple. Jusqu'à quelques minutes pour une analyse complète.
        </motion.p>
        </div>
      </section>

      {/* ── CARTES ── */}
      <section style={{ padding: 'clamp(16px,2.5vw,28px) 20px 0', maxWidth: 1100, margin: '0 auto' }}>
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'stretch' }}>
          {plans.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(15,45,61,0.12)' }}
              style={{
                background: '#fff',
                borderRadius: 16,
                border: plan.popular ? '2px solid #2a7d9c' : '1.5px solid #edf2f7',
                display: 'flex',
                flexDirection: 'column' as const,
                position: 'relative' as const,
                overflow: 'visible',
                boxShadow: plan.popular ? '0 8px 32px rgba(42,125,156,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.3s',
              }}>

              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute' as const, top: -11, left: '50%', transform: 'translateX(-50%)',
                  padding: '4px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                  background: plan.badgeBg, color: plan.badgeColor, whiteSpace: 'nowrap' as const,
                  border: `1px solid ${plan.badgeColor}20`,
                }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ padding: '28px 22px 24px', display: 'flex', flexDirection: 'column' as const, flex: 1 }}>

                {/* Nom + sous-titre */}
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 3, marginTop: plan.badge ? 4 : 0 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>{plan.sub}</div>

                {/* Prix */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 3 }}>
                  <span style={{ fontSize: 'clamp(34px,3.5vw,42px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1' }}>€</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 22 }}>
                  {plan.perUnit ? `${plan.perUnit} · paiement unique` : 'TTC · paiement unique'}
                </div>

                {/* Séparateur */}
                <div style={{ height: 1, background: '#f1f5f9', marginBottom: 18 }} />

                {/* Documents */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="8" cy="8" r="7" fill={plan.popular ? '#e6f7ed' : '#f0fdf4'} stroke={plan.popular ? '#22c55e' : '#bbf7d0'} strokeWidth="1.2" />
                    <path d="M5 8.2l2 2 4-4.4" stroke="#16a34a" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.45, fontWeight: 600 }}>{plan.docsLabel}</span>
                </div>

                {/* Features liste complète */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 11, flex: 1, marginBottom: 22 }}>
                  {allFeatures.map((feat, fi) => {
                    const included = feat[plan.key];
                    const isPartial = included === 'partial';
                    return (
                      <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, opacity: included ? 1 : 0.3 }}>
                        {isPartial ? (
                          <svg width="18" height="18" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
                            <circle cx="8" cy="8" r="7" fill="#fffbeb" stroke="#fde68a" strokeWidth="1.2" />
                            <path d="M5.5 8h5" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        ) : included ? (
                          <svg width="18" height="18" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
                            <circle cx="8" cy="8" r="7" fill={plan.popular ? '#e6f7ed' : '#f0fdf4'} stroke={plan.popular ? '#22c55e' : '#bbf7d0'} strokeWidth="1.2" />
                            <path d="M5 8.2l2 2 4-4.4" stroke="#16a34a" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
                            <circle cx="8" cy="8" r="7" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                            <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
                          </svg>
                        )}
                        <span style={{ fontSize: 13.5, color: isPartial ? '#92400e' : included ? '#374151' : '#94a3b8', lineHeight: 1.45 }}>{isPartial ? `${feat.label} *` : feat.label}</span>
                      </div>
                    );
                  })}
                  {/* Bonus économie */}
                  {plan.bonus && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: '#16a34a', fontWeight: 700 }}>★</div>
                      <span style={{ fontSize: 13.5, color: '#16a34a', lineHeight: 1.45, fontWeight: 700 }}>{plan.bonus}</span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Link to={`/start?plan=${plan.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '13px 16px', borderRadius: 12, boxSizing: 'border-box' as const,
                    background: plan.popular ? 'linear-gradient(135deg, #0f2d3d, #1a5068)' : '#fff',
                    color: plan.popular ? '#fff' : '#0f172a',
                    border: plan.popular ? 'none' : '1.5px solid #e2e8f0',
                    fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    boxShadow: plan.popular ? '0 4px 16px rgba(15,45,61,0.25)' : 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { if (plan.popular) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.15)'; else { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; } }}
                  onMouseOut={e => { if (plan.popular) (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'; else { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; } }}>
                  {plan.cta} <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TABLEAU COMPARATIF ── */}
      <section style={{ padding: 'clamp(40px,5vw,60px) 20px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 900, color: '#0f172a', marginBottom: 20, letterSpacing: '-0.02em' }}>
            Tout ce qui est inclus
          </h2>
        </Reveal>

        {/* Desktop : tableau */}
        <Reveal delay={0.05} className="table-desktop">
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', minWidth: 560 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #edf2f7' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left' as const, fontSize: 12, fontWeight: 700, color: '#94a3b8', width: '35%' }} />
                  {plans.map((p, i) => (
                    <th key={p.id} style={{ padding: '12px 8px', textAlign: 'center' as const, fontSize: 12, fontWeight: 800, color: i === 1 ? '#2a7d9c' : '#0f172a', background: i === 1 ? 'rgba(42,125,156,0.04)' : 'transparent', borderLeft: '1px solid #f1f5f9' }}>
                      {p.name}
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 1 }}>{p.price}€</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < tableRows.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '11px 20px', fontSize: 13, color: '#374151', fontWeight: 500, position: 'relative' as const }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {row.label}
                        {row.tip && (
                          <div style={{ position: 'relative', display: 'inline-flex' }}
                            onMouseEnter={() => setHoveredTip(i)} onMouseLeave={() => setHoveredTip(null)}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: hoveredTip === i ? '#2a7d9c' : '#edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', transition: 'all 0.15s', flexShrink: 0 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: hoveredTip === i ? '#fff' : '#94a3b8', lineHeight: 1 }}>i</span>
                            </div>
                            {hoveredTip === i && (
                              <div style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 500, background: '#0f172a', borderRadius: 10, padding: '10px 14px', width: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', pointerEvents: 'none' }}>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{row.tip}</span>
                                <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%) rotate(45deg)', width: 8, height: 8, background: '#0f172a', borderRadius: 1 }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    {row.vals.map((val, j) => (
                      <TableCell key={j} val={val} isHighlight={j === 1} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </Reveal>

        {/* Mobile : accordéon par fonctionnalité */}
        <div className="table-mobile" style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
          {tableRows.map((row, i) => (
            <div key={i} style={{ borderRadius: 12, border: `1.5px solid ${openAccordion === i ? '#2a7d9c' : '#edf2f7'}`, background: '#fff', overflow: 'hidden', transition: 'border-color 0.18s' }}>
              <button onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{row.label}</span>
                <ChevronDown size={15} color={openAccordion === i ? '#2a7d9c' : '#cbd5e1'} style={{ flexShrink: 0, transform: openAccordion === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <AnimatePresence>
                {openAccordion === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f0f5f9', display: 'flex', flexDirection: 'column' as const, gap: 8, paddingTop: 12 }}>
                      {row.tip && (
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 4 }}>
                          {row.tip}
                        </div>
                      )}
                      {plans.map((p, j) => {
                        const val = row.vals[j];
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 9, background: j === 1 ? 'rgba(42,125,156,0.04)' : '#f8fafc', border: `1px solid ${j === 1 ? 'rgba(42,125,156,0.12)' : '#f1f5f9'}` }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: j === 1 ? '#2a7d9c' : '#0f172a' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.price}€ TTC</div>
                            </div>
                            {val === true && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={11} color="#16a34a" strokeWidth={2.5} /></div>}
                            {val === false && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} color="#cbd5e1" /></div>}
                            {typeof val === 'string' && <span style={{ fontSize: 12, fontWeight: 700, color: val === '—' ? '#e2e8f0' : val === 'Selon le doc' ? '#d97706' : '#16a34a' }}>{val}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARAISON INFO + PRO ── */}
      <section style={{ padding: '0 20px clamp(40px,5vw,60px)', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
        <Reveal>
          <div style={{ padding: '20px 28px', borderRadius: 16, background: '#fff', border: '1.5px solid #bae3f5', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
            <GitCompare size={22} color="#2a7d9c" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6, flex: 1 }}>
              <strong style={{ color: '#0f2d3d' }}>La comparaison se débloque automatiquement</strong> dès que votre compte contient au minimum 2 analyses complètes — via un Pack ou des achats séparés.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div style={{ padding: '20px 28px', borderRadius: 16, background: '#0f2d3d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Crown size={18} color="#f0a500" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Offre Professionnelle</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Agents immobiliers, investisseurs, marchands de bien, notaires — tarif dédié.</div>
              </div>
            </div>
            <Link to="/pro/rejoindre" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
              <Mail size={12} /> Rejoindre Verimo Pro
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── INFO DÉLAIS — bien visible ── */}
      <section style={{ padding: '0 20px clamp(48px,6vw,80px)', maxWidth: 900, margin: '0 auto' }}>
        <Reveal>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f7fb 100%)',
            borderRadius: 18,
            border: '1.5px solid #d0e8f0',
            padding: 'clamp(24px,3vw,32px)',
            boxShadow: '0 4px 20px rgba(42,125,156,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(42,125,156,0.2)' }}>
                <Zap size={17} style={{ color: '#fff' }} />
              </div>
              <h3 style={{ fontSize: 'clamp(18px,2.4vw,22px)', fontWeight: 900, color: '#0f2d3d', margin: 0, letterSpacing: '-0.01em' }}>
                Combien de temps pour recevoir mon rapport ?
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <div style={{ padding: '18px 20px', background: '#fff', borderRadius: 14, border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  Analyse simple
                </div>
                <div style={{ fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 900, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  ~30 secondes
                </div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  Résultat quasi instantané pour 1 document PDF natif.
                </div>
              </div>
              <div style={{ padding: '18px 20px', background: '#fff', borderRadius: 14, border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  Analyse complète
                </div>
                <div style={{ fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 900, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  Quelques minutes
                </div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  Selon le nombre de documents soumis (jusqu'à 15).
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <style>{`
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media (max-width: 860px) { .plans-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 520px) { .plans-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .table-desktop { display: none !important; } .table-mobile { display: flex !important; } }
        @media (min-width: 641px) { .table-mobile { display: none !important; } .table-desktop { display: block !important; } }
        @media (max-width: 1023px) { .confetti-desktop { display: none !important; } }
        @media (min-width: 1024px) { .confetti-mobile { display: none !important; } }
      `}</style>
    </main>
  );
}

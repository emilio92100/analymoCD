import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, Check, X, Shield, Zap, FileText, Crown, Mail, GitCompare, ChevronDown } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isLowPerf = () => isIOS() || (typeof window !== 'undefined' && window.innerWidth <= 768);

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const allFeatures = [
  { label: 'Avis Verimo personnalisé', tip: 'Conclusion rédigée par Verimo adaptée à votre profil d\'acheteur', simple: true, complete: true, pack2: true, pack3: true },
  { label: 'Score /20 + verdict d\'achat', tip: 'Note globale sur 20 avec verdict clair : Acheter, Négocier ou Risqué', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Travaux votés et à prévoir', tip: 'Travaux décidés en AG et travaux à anticiper détectés dans vos documents', simple: 'partial', complete: true, pack2: true, pack3: true },
  { label: 'Santé financière copro', tip: 'Charges, fonds travaux, impayés et budget de la copropriété', simple: 'partial', complete: true, pack2: true, pack3: true },
  { label: 'Pistes de négociation', tip: 'Arguments concrets pour négocier le prix, affichés si le score est inférieur à 14/20', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Rapport PDF téléchargeable', tip: 'Téléchargez votre rapport complet au format PDF', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Compléter sous 7 jours', tip: 'Ajoutez des documents oubliés dans les 7 jours — le rapport est recalculé gratuitement', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Comparaison de biens', tip: 'Comparez vos analyses côte à côte pour choisir le meilleur bien', simple: false, complete: false, pack2: true, pack3: true },
];

const plans = [
  {
    id: 'document',
    key: 'simple' as const,
    name: 'Simple',
    sub: '1 document analysé',
    price: '4,90',
    perUnit: null,
    docsLabel: '1 fichier PDF',
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
    sub: 'Jusqu\'à 15 documents en une fois',
    price: '19,90',
    perUnit: null,
    docsLabel: 'Jusqu\'à 15 fichiers simultanés',
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
  { label: 'Score /20 + verdict d\'achat', tip: 'Note globale sur 20 avec verdict clair : Acheter, Négocier ou Risqué', vals: [false, true, true, true], type: 'bool' },
  { label: 'Travaux votés et à prévoir', tip: 'Travaux décidés en AG et travaux à anticiper détectés dans vos documents', vals: ['Selon le doc', true, true, true], type: 'text_or_bool' },
  { label: 'Santé financière copro', tip: 'Charges, fonds travaux, impayés et budget de la copropriété', vals: ['Selon le doc', true, true, true], type: 'text_or_bool' },
  { label: 'Pistes de négociation', tip: 'Arguments pour négocier le prix, affichés si le score est inférieur à 14/20', vals: [false, true, true, true], type: 'bool' },
  { label: 'Compléter le dossier (7j)', tip: 'Ajoutez des documents oubliés dans les 7 jours — rapport recalculé gratuitement', vals: [false, true, true, true], type: 'bool' },
  { label: 'Rapport PDF téléchargeable', tip: 'Téléchargez votre rapport complet au format PDF', vals: [false, true, true, true], type: 'bool' },
  { label: 'Comparaison de biens', tip: 'Comparez vos analyses côte à côte pour choisir le meilleur bien', vals: [false, false, true, true], type: 'bool' },
  { label: 'Économie vs achats séparés', tip: 'Réduction par rapport à l\'achat de chaque analyse individuellement', vals: ['—', '—', '−10€', '−20€'], type: 'text' },
];

const faqs = [
  { q: 'Les crédits expirent-ils ?', a: 'Non, jamais. Vos crédits sont valables indéfiniment. Achetez-les aujourd\'hui, utilisez-les dans 6 mois — aucune contrainte de temps.' },
  { q: 'Quels documents puis-je analyser ?', a: 'Tous les documents liés à un bien immobilier en copropriété : PV d\'assemblée générale, règlement de copropriété, diagnostics (DPE, amiante, électricité, gaz, termites…), appels de charges, état daté, et plus encore. Seuls les fichiers PDF sont acceptés.' },
  { q: 'Quelle est la différence entre l\'analyse simple et complète ?', a: 'L\'analyse simple décrypte un seul document et vous donne les points clés. L\'analyse complète croise jusqu\'à 15 documents d\'un même bien pour calculer un score /20, détecter les risques et vous donner une recommandation d\'achat personnalisée.' },
  { q: 'Puis-je compléter mon dossier après l\'analyse ?', a: 'Oui ! Avec l\'analyse complète, vous avez 7 jours pour ajouter des documents oubliés. Votre rapport sera recalculé gratuitement avec les nouvelles informations.' },
  { q: 'Comment fonctionne la comparaison de biens ?', a: 'Dès que votre compte contient au minimum 2 analyses complètes — via un Pack ou des achats séparés — l\'outil de comparaison s\'active automatiquement. Vous sélectionnez les biens à comparer et Verimo affiche un rapport côte à côte.' },
  { q: 'Mes documents sont-ils sécurisés ?', a: 'Vos fichiers sont chiffrés et supprimés automatiquement de nos serveurs après traitement. Aucune donnée n\'est conservée — conforme au RGPD.' },
  { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique empêchant la génération de votre rapport, contactez-nous sous 48h. Nous étudions chaque demande individuellement.' },
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
    title: 'Tarifs Verimo — Analyse immobilière dès 9€',
    description: "Découvrez nos tarifs : analyse simple, complète ou pack comparatif. Score /20, travaux, santé financière de la copro et négociation. Sans abonnement.",
    canonical: '/tarifs',
  });

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [hoveredTip, setHoveredTip] = useState<number | null>(null);

  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f4f7f9', paddingTop: 72, minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #edf2f7', padding: 'clamp(44px,7vw,80px) 20px clamp(36px,5vw,56px)', textAlign: 'center' }}>
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
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              <I size={14} style={{ color: '#2a7d9c', flexShrink: 0 }} /> {l}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── CARTES ── */}
      <section style={{ padding: 'clamp(32px,5vw,52px) 20px 0', maxWidth: 1100, margin: '0 auto' }}>
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
            <Link to="/contact-pro" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
              <Mail size={12} /> Nous contacter
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '0 20px clamp(48px,6vw,80px)', maxWidth: 900, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(24px,3vw,34px)', fontWeight: 900, color: '#0f172a', marginBottom: 24, letterSpacing: '-0.02em' }}>
            Questions fréquentes
          </h2>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.03}>
              <div style={{ borderRadius: 14, border: `1.5px solid ${openFaq === i ? '#2a7d9c' : '#edf2f7'}`, overflow: 'hidden', background: '#fff', transition: 'border-color 0.18s', boxShadow: openFaq === i ? '0 4px 16px rgba(42,125,156,0.08)' : 'none' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{faq.q}</span>
                  <ChevronDown size={18} color={openFaq === i ? '#2a7d9c' : '#cbd5e1'} style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75, margin: 0, padding: '0 24px 18px', borderTop: '1px solid #f0f5f9' }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FORMULAIRE CONTACT ── */}
      <section style={{ padding: '0 20px clamp(48px,6vw,80px)', maxWidth: 680, margin: '0 auto' }}>
        <Reveal>
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #edf2f7', padding: 'clamp(28px,4vw,40px)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ textAlign: 'center' as const, marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Mail size={24} color="#2a7d9c" />
              </div>
              <h3 style={{ fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 900, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.02em' }}>Une question ?</h3>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6 }}>Remplissez le formulaire, nous vous répondons sous 24h.</p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              const name = data.get('name') as string;
              const email = data.get('email') as string;
              const message = data.get('message') as string;
              if (!name || !email || !message) return;
              try {
                const { supabase } = await import('../lib/supabase');
                await supabase.from('contact_messages').insert({ name, email, message, source: 'tarifs' });
                form.reset();
                alert('Message envoyé ! Nous vous répondons sous 24h.');
              } catch {
                alert('Erreur lors de l\'envoi. Réessayez ou contactez hello@verimo.fr');
              }
            }} style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Prénom</label>
                  <input name="name" required placeholder="Votre prénom"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', background: '#fafcfe', transition: 'border-color 0.15s', boxSizing: 'border-box' as const }}
                    onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'}
                    onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
                  <input name="email" type="email" required placeholder="votre@email.com"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', background: '#fafcfe', transition: 'border-color 0.15s', boxSizing: 'border-box' as const }}
                    onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'}
                    onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Votre question</label>
                <textarea name="message" required rows={4} placeholder="Décrivez votre question ou demande…"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', background: '#fafcfe', resize: 'vertical' as const, fontFamily: 'inherit', transition: 'border-color 0.15s', boxSizing: 'border-box' as const }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'} />
              </div>
              <button type="submit"
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(15,45,61,0.2)', transition: 'all 0.15s' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'; }}>
                Envoyer mon message
              </button>
            </form>
          </div>
        </Reveal>
      </section>

      <section style={{ padding: '0 20px 24px', textAlign: 'center' as const }}>
        <p style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>
          * Pour les documents PDF nativement numériques. Les documents scannés peuvent nécessiter un délai supplémentaire.
        </p>
      </section>

      <style>{`
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media (max-width: 860px) { .plans-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 520px) { .plans-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .table-desktop { display: none !important; } .table-mobile { display: flex !important; } }
        @media (min-width: 641px) { .table-mobile { display: none !important; } .table-desktop { display: block !important; } }
      `}</style>
    </main>
  );
}

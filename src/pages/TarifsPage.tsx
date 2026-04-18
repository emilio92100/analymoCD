import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, Check, X, Shield, Zap, FileText, Crown, Mail, GitCompare, ChevronDown } from 'lucide-react';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isLowPerf = () => isIOS() || (typeof window !== 'undefined' && window.innerWidth <= 768);

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const plans = [
  {
    id: 'document',
    name: 'Analyse Simple',
    price: '4,90',
    badge: null,
    color: '#64748b',
    borderColor: '#e2e8f0',
    accentBg: '#f8fafc',
    desc: 'Un document à déchiffrer rapidement avant d\'aller plus loin.',
    cta: 'Analyser un document',
    features: [
      "Analyse d'un seul document",
      'Points forts et vigilances détectés',
      'Recommandation adaptée au contenu',
      'Identification et explication du doc',
    ],
    missing: [
      'Score /20 global du bien',
      'Rapport PDF complet',
      'Comparaison de biens',
    ],
  },
  {
    id: 'complete',
    name: 'Analyse Complète',
    price: '19,90',
    badge: '⭐ Recommandée',
    color: '#2a7d9c',
    borderColor: '#2a7d9c',
    accentBg: '#f0f7fb',
    desc: 'Tout comprendre sur un bien avant de faire une offre.',
    cta: 'Analyser mon bien',
    features: [
      'Documents illimités analysés ensemble',
      'Score global /20 avec recommandation',
      'Travaux votés + estimation financière',
      'Santé financière de la copropriété',
      'Procédures judiciaires détectées',
      'Pistes de négociation si score < 14',
      'Rapport PDF complet téléchargeable',
      'Compléter le dossier sous 7 jours',
    ],
    missing: [
      'Comparaison de biens (dès le Pack 2)',
    ],
  },
  {
    id: 'pack2',
    name: 'Pack 2 Biens',
    price: '29,90',
    badge: 'Économique',
    color: '#0f2d3d',
    borderColor: '#0f2d3d',
    accentBg: '#f4f7f9',
    desc: 'Hésitez entre deux biens ? Analysez et comparez-les.',
    cta: 'Comparer 2 biens',
    features: [
      '2 analyses complètes indépendantes',
      'Comparaison côte à côte débloquée',
      'Score, travaux, finances des 2 biens',
      'Verdict Verimo : quel bien choisir ?',
      'Économisez 10€ vs 2 achats séparés',
    ],
    missing: [],
  },
  {
    id: 'pack3',
    name: 'Pack 3 Biens',
    price: '39,90',
    badge: 'Meilleure valeur',
    color: '#7c3aed',
    borderColor: '#7c3aed',
    accentBg: '#f5f3ff',
    desc: '3 biens à analyser, comparer et classer ensemble.',
    cta: 'Comparer 3 biens',
    features: [
      '3 analyses complètes indépendantes',
      'Comparaison de 2 ou 3 biens librement',
      'Rapport comparatif : score, travaux, finances',
      'Verdict Verimo : quel bien est le meilleur',
      'Classement final automatique des 3 biens',
      'Économisez 20€ vs 3 achats séparés',
    ],
    missing: [],
  },
];

const tableRows = [
  { label: 'Documents analysés', vals: ['1 doc', 'Illimités', '2 × illimités', '3 × illimités'], type: 'text' },
  { label: 'Score /20 du bien', vals: [false, true, true, true], type: 'bool' },
  { label: 'Rapport PDF complet', vals: [false, true, true, true], type: 'bool' },
  { label: 'Travaux + estimation', vals: [false, true, true, true], type: 'bool' },
  { label: 'Pistes de négociation', vals: [false, true, true, true], type: 'bool' },
  { label: 'Comparaison de biens', vals: [false, false, true, true], type: 'bool' },
  { label: 'Rapport comparatif détaillé', vals: [false, false, true, true], type: 'bool' },
  { label: 'Verdict Verimo', vals: [false, false, true, true], type: 'bool' },
  { label: 'Classement final 3 biens', vals: [false, false, false, true], type: 'bool' },
  { label: 'Économie vs achats séparés', vals: ['—', '—', '−10€', '−20€'], type: 'text' },
];

const faqs = [
  { q: 'Les crédits expirent-ils ?', a: 'Non, jamais. Vos crédits sont valables indéfiniment.' },
  { q: 'Comment fonctionne la comparaison de biens ?', a: 'Dès que votre compte contient au minimum 2 analyses complètes — via un Pack ou des achats séparés — l\'onglet "Comparer mes biens" s\'active automatiquement dans votre tableau de bord. Vous sélectionnez les biens à comparer et Verimo affiche un rapport côte à côte.' },
  { q: 'Qu\'est-ce que le classement final du Pack 3 ?', a: 'En plus de la comparaison côte à côte des 3 biens, Verimo génère un verdict automatique indiquant quel bien est le mieux noté selon nos analyses (score, travaux, finances, procédures) et pourquoi.' },
  { q: 'Mes documents sont-ils sécurisés ?', a: 'Vos fichiers sont chiffrés et supprimés automatiquement après traitement. Aucune donnée conservée — conforme RGPD.' },
  { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique, contactez-nous sous 48h à hello@verimo.fr. Nous étudions chaque demande.' },
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
  const isGreen = val !== '—' && val !== '1 doc';
  return (
    <td style={{ textAlign: 'center', padding: '12px 8px', background: bg, borderLeft: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: val === '—' ? '#e2e8f0' : isGreen ? '#16a34a' : '#2a7d9c' }}>{val as string}</span>
    </td>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function TarifsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

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
          Sans abonnement. Sans engagement. Payez une fois, gardez votre rapport.
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
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {plans.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: '#fff',
                borderRadius: 18,
                border: `2px solid ${plan.badge ? plan.borderColor : '#edf2f7'}`,
                boxShadow: plan.badge ? `0 8px 32px ${plan.color}18` : '0 1px 4px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column' as const,
                position: 'relative' as const,
                overflow: 'visible',
              }}>

              {/* Barre colorée en haut */}
              <div style={{ height: 4, background: plan.badge ? plan.color : '#edf2f7', borderRadius: '16px 16px 0 0', flexShrink: 0 }} />

              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute' as const, top: -13, left: '50%', transform: 'translateX(-50%)',
                  padding: '4px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: plan.color, color: '#fff', whiteSpace: 'nowrap' as const,
                  boxShadow: `0 4px 12px ${plan.color}40`,
                }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ padding: '24px 22px 22px', display: 'flex', flexDirection: 'column' as const, flex: 1 }}>

                {/* Nom */}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#94a3b8', marginBottom: 14, paddingTop: plan.badge ? 8 : 0, textAlign: 'center' as const }}>
                  {plan.name}
                </div>

                {/* Prix */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, marginBottom: 3, justifyContent: 'center' }}>
                  <span style={{ fontSize: 'clamp(34px,3.5vw,46px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#cbd5e1', marginBottom: 1 }}>€</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 18, textAlign: 'center' as const }}>TTC · paiement unique</div>

                {/* Description */}
                <div style={{ padding: '10px 12px', borderRadius: 10, background: plan.accentBg, marginBottom: 20, minHeight: 52, display: 'flex', alignItems: 'center' }}>
                  <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{plan.desc}</p>
                </div>

                {/* Séparateur */}
                <div style={{ height: 1, background: '#f1f5f9', marginBottom: 16 }} />

                {/* Features incluses */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 9, flex: 1, marginBottom: 20 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${plan.color}14`, border: `1.5px solid ${plan.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <Check size={9} color={plan.color} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.45, fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                  {plan.missing.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, opacity: 0.4 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <X size={8} color="#94a3b8" />
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link to={`/start?plan=${plan.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px 16px', borderRadius: 11, boxSizing: 'border-box' as const,
                    background: plan.badge ? plan.color : '#f4f7f9',
                    color: plan.badge ? '#fff' : '#0f172a',
                    border: plan.badge ? 'none' : '1.5px solid #e2e8f0',
                    fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    boxShadow: plan.badge ? `0 4px 16px ${plan.color}30` : 'none',
                    transition: 'all 0.18s',
                  }}>
                  {plan.cta} <ArrowRight size={13} />
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
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', minWidth: 560 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #edf2f7' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left' as const, fontSize: 12, fontWeight: 700, color: '#94a3b8', width: '35%' }} />
                  {plans.map((p, i) => (
                    <th key={p.id} style={{ padding: '12px 8px', textAlign: 'center' as const, fontSize: 12, fontWeight: 800, color: i === 1 ? '#2a7d9c' : '#0f172a', background: i === 1 ? 'rgba(42,125,156,0.04)' : 'transparent', borderLeft: '1px solid #f1f5f9' }}>
                      {p.name.replace('Analyse ', '')}
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 1 }}>{p.price}€</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < tableRows.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '11px 20px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{row.label}</td>
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
                            {typeof val === 'string' && <span style={{ fontSize: 12, fontWeight: 700, color: val === '—' ? '#e2e8f0' : '#16a34a' }}>{val}</span>}
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
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Notaires, agents, syndics — volumes illimités, tarif dédié.</div>
              </div>
            </div>
            <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
              <Mail size={12} /> Nous contacter
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '0 20px clamp(48px,6vw,80px)', maxWidth: 680, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 900, color: '#0f172a', marginBottom: 20, letterSpacing: '-0.02em' }}>
            Questions fréquentes
          </h2>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.03}>
              <div style={{ borderRadius: 12, border: `1.5px solid ${openFaq === i ? '#2a7d9c' : '#edf2f7'}`, overflow: 'hidden', background: '#fff', transition: 'border-color 0.18s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>{faq.q}</span>
                  <ChevronDown size={15} color={openFaq === i ? '#2a7d9c' : '#cbd5e1'} style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75, margin: 0, padding: '0 18px 14px', borderTop: '1px solid #f0f5f9' }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <p style={{ textAlign: 'center' as const, fontSize: 13, color: '#94a3b8', marginTop: 16 }}>
            Une autre question ?{' '}
            <a href="mailto:hello@verimo.fr" style={{ color: '#2a7d9c', fontWeight: 600, textDecoration: 'none' }}>hello@verimo.fr</a>
          </p>
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

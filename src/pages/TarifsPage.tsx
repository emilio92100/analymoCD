import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, Check, X, Shield, Zap, FileText, Crown, Mail, GitCompare, ChevronDown } from 'lucide-react';

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const plans = [
  {
    id: 'document',
    name: 'Simple',
    price: '4,90',
    badge: null,
    highlighted: false,
    desc: 'Un seul document à comprendre rapidement.',
    color: '#64748b',
    features: [
      "Analyse d'un seul document",
      'Points forts et vigilances détectés',
      'Recommandation adaptée au contenu',
      'Identification et explication du doc',
    ],
    missing: ['Score /20 global', 'Rapport PDF complet', 'Comparaison de biens'],
  },
  {
    id: 'complete',
    name: 'Complète',
    price: '19,90',
    badge: 'Recommandée',
    highlighted: true,
    desc: 'Tout comprendre avant de faire une offre.',
    color: '#2a7d9c',
    features: [
      'Documents illimités analysés ensemble',
      'Score global /20 avec recommandation',
      'Travaux votés + estimation financière',
      'Santé financière de la copropriété',
      'Procédures judiciaires détectées',
      'Pistes de négociation si score < 14',
      'Rapport PDF téléchargeable',
      'Compléter le dossier sous 7 jours',
    ],
    missing: ['Comparaison de biens (Pack 2+)'],
  },
  {
    id: 'pack2',
    name: 'Pack 2 biens',
    price: '29,90',
    badge: 'Économique',
    highlighted: false,
    desc: 'Hésitez entre deux biens ? Comparez-les.',
    color: '#0f2d3d',
    features: [
      '2 analyses complètes indépendantes',
      'Comparaison côte à côte débloquée',
      'Verdict Verimo : quel bien choisir ?',
      'Économisez 10€ vs 2 achats séparés',
    ],
    missing: [],
  },
  {
    id: 'pack3',
    name: 'Pack 3 biens',
    price: '39,90',
    badge: 'Meilleure valeur',
    highlighted: false,
    desc: '3 biens à analyser et comparer ensemble.',
    color: '#0f2d3d',
    features: [
      '3 analyses complètes indépendantes',
      'Comparaison de 2 ou 3 biens librement',
      'Classement final + verdict Verimo',
      'Économisez 20€ vs 3 achats séparés',
    ],
    missing: [],
  },
];

const tableRows = [
  { label: 'Documents analysés', simple: '1 doc', complete: 'Illimités', pack2: '2 × illimités', pack3: '3 × illimités' },
  { label: 'Score /20 du bien', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Rapport PDF complet', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Travaux + estimation', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Pistes de négociation', simple: false, complete: true, pack2: true, pack3: true },
  { label: 'Comparaison de biens', simple: false, complete: false, pack2: true, pack3: true },
  { label: 'Classement final', simple: false, complete: false, pack2: false, pack3: true },
  { label: 'Économie vs séparé', simple: '—', complete: '—', pack2: '−10€', pack3: '−20€' },
];

const faqs = [
  { q: 'Les crédits expirent-ils ?', a: 'Non, jamais. Vos crédits sont valables indéfiniment.' },
  { q: 'Puis-je comparer des biens achetés séparément ?', a: 'Oui. La comparaison se débloque dès que votre compte contient au minimum 2 analyses complètes, peu importe comment elles ont été achetées.' },
  { q: 'Mes documents sont-ils sécurisés ?', a: 'Vos fichiers sont chiffrés et supprimés automatiquement après traitement. Aucune donnée conservée.' },
  { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique, contactez-nous sous 48h à hello@verimo.fr.' },
];

/* ══════════════════════════════════════════
   COMPOSANTS
══════════════════════════════════════════ */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <div style={{ display: 'flex', justifyContent: 'center' }}><div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color="#16a34a" /></div></div>;
  if (value === false) return <div style={{ display: 'flex', justifyContent: 'center' }}><div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f8fafc', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} color="#cbd5e1" /></div></div>;
  return <div style={{ textAlign: 'center' as const, fontSize: 13, fontWeight: 600, color: value === '—' ? '#cbd5e1' : '#16a34a' }}>{value}</div>;
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function TarifsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fff', paddingTop: 72, minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(to bottom, #f8fafc, #fff)', borderBottom: '1px solid #edf2f7', padding: 'clamp(44px,7vw,88px) 20px clamp(36px,5vw,60px)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 12, fontWeight: 700, color: '#1a5e78', marginBottom: 20, letterSpacing: '0.06em' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse2 2s ease-in-out infinite' }} />
          TARIFICATION TRANSPARENTE
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          style={{ fontSize: 'clamp(30px,5vw,58px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 14 }}>
          Des tarifs simples,<br />
          <span style={{ color: '#2a7d9c' }}>sans surprise.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.13 }}
          style={{ fontSize: 16, color: '#64748b', maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.65 }}>
          Sans abonnement. Sans engagement. Payez une fois, gardez votre rapport.
        </motion.p>

        {/* Badges garantie */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[
            { icon: Shield, l: 'Paiement sécurisé' },
            { icon: Zap, l: 'Résultats en 30s*' },
            { icon: FileText, l: 'PDF inclus' },
            { icon: Crown, l: 'Crédits sans expiration' },
          ].map(({ icon: Icon, l }) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              <Icon size={14} style={{ color: '#2a7d9c', flexShrink: 0 }} /> {l}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── CARTES ── */}
      <section style={{ padding: 'clamp(32px,5vw,56px) 20px 0', maxWidth: 1080, margin: '0 auto' }}>
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'end' }}>
          {plans.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: plan.highlighted ? 'linear-gradient(160deg, #0f2d3d 0%, #1a4a60 100%)' : '#fff',
                borderRadius: 20,
                border: plan.highlighted ? 'none' : '1.5px solid #edf2f7',
                padding: plan.highlighted ? '32px 24px' : '24px',
                boxShadow: plan.highlighted ? '0 20px 60px rgba(15,45,61,0.25)' : '0 1px 4px rgba(0,0,0,0.05)',
                position: 'relative' as const,
                marginBottom: plan.highlighted ? 0 : 16,
              }}>

              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute' as const, top: -12, left: '50%', transform: 'translateX(-50%)',
                  padding: '4px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const,
                  background: plan.highlighted ? '#f0a500' : plan.id === 'pack2' ? '#2a7d9c' : '#0f2d3d',
                  color: '#fff',
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Nom */}
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: plan.highlighted ? 'rgba(255,255,255,0.5)' : '#94a3b8', marginBottom: 16 }}>
                {plan.name}
              </div>

              {/* Prix */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 2 }}>
                <span style={{ fontSize: 'clamp(38px,4vw,52px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: plan.highlighted ? '#fff' : '#0f172a' }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: 20, fontWeight: 700, color: plan.highlighted ? 'rgba(255,255,255,0.4)' : '#cbd5e1', marginBottom: 2 }}>€</span>
              </div>
              <div style={{ fontSize: 11, color: plan.highlighted ? 'rgba(255,255,255,0.4)' : '#94a3b8', marginBottom: 20 }}>
                TTC · paiement unique
              </div>

              {/* Description */}
              <div style={{ fontSize: 13, color: plan.highlighted ? 'rgba(255,255,255,0.7)' : '#64748b', lineHeight: 1.6, marginBottom: 22, minHeight: 40 }}>
                {plan.desc}
              </div>

              {/* Séparateur */}
              <div style={{ height: 1, background: plan.highlighted ? 'rgba(255,255,255,0.1)' : '#f1f5f9', marginBottom: 18 }} />

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 24 }}>
                {plan.features.map((f, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: plan.highlighted ? 'rgba(255,255,255,0.15)' : '#f0fdf4', border: `1px solid ${plan.highlighted ? 'rgba(255,255,255,0.2)' : '#d1fae5'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Check size={9} color={plan.highlighted ? '#fff' : '#16a34a'} />
                    </div>
                    <span style={{ fontSize: 12.5, color: plan.highlighted ? 'rgba(255,255,255,0.85)' : '#374151', lineHeight: 1.45 }}>{f}</span>
                  </div>
                ))}
                {plan.missing.map((f, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, opacity: 0.35 }}>
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
                  padding: '12px', borderRadius: 12, width: '100%', boxSizing: 'border-box' as const,
                  background: plan.highlighted ? '#f0a500' : plan.id === 'document' ? '#f4f7f9' : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)',
                  color: plan.highlighted ? '#0f2d3d' : plan.id === 'document' ? '#0f172a' : '#fff',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  border: plan.id === 'document' ? '1.5px solid #edf2f7' : 'none',
                  boxShadow: plan.highlighted ? '0 4px 16px rgba(240,165,0,0.35)' : 'none',
                }}>
                {plan.id === 'document' ? 'Analyser un document' : plan.id === 'complete' ? 'Analyser mon bien' : plan.id === 'pack2' ? 'Comparer 2 biens' : 'Comparer 3 biens'}
                <ArrowRight size={13} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TABLEAU COMPARATIF ── */}
      <section style={{ padding: 'clamp(40px,5vw,64px) 20px', maxWidth: 1080, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Comparaison détaillée</div>
            <h2 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Tout ce qui est inclus</h2>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            {/* En-tête */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr', borderBottom: '1.5px solid #edf2f7' }}>
              <div style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#94a3b8' }} />
              {['Simple', 'Complète', 'Pack 2', 'Pack 3'].map((n, i) => (
                <div key={n} style={{ padding: '14px 10px', textAlign: 'center' as const, fontSize: 12, fontWeight: 800, color: i === 1 ? '#2a7d9c' : '#0f172a', background: i === 1 ? 'rgba(42,125,156,0.04)' : 'transparent', borderLeft: '1px solid #f1f5f9' }}>
                  {n}
                </div>
              ))}
            </div>

            {/* Lignes */}
            {tableRows.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr', borderBottom: i < tableRows.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <div style={{ padding: '13px 20px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{row.label}</div>
                {[row.simple, row.complete, row.pack2, row.pack3].map((val, j) => (
                  <div key={j} style={{ padding: '13px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: j === 1 ? 'rgba(42,125,156,0.03)' : 'transparent', borderLeft: '1px solid #f1f5f9' }}>
                    <Cell value={val} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── COMPARAISON INFO ── */}
      <section style={{ padding: '0 20px clamp(40px,5vw,64px)', maxWidth: 1080, margin: '0 auto' }}>
        <Reveal>
          <div style={{ padding: '20px 24px', borderRadius: 16, background: '#f0f7fb', border: '1.5px solid #bae3f5', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', border: '1px solid #bae3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GitCompare size={18} color="#2a7d9c" />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', marginBottom: 4 }}>La comparaison de biens se débloque automatiquement</div>
              <p style={{ fontSize: 13, color: '#2a7d9c', margin: 0, lineHeight: 1.6 }}>
                Dès que votre compte contient <strong>au minimum 2 analyses complètes</strong> — via un Pack ou des achats séparés — l'onglet "Comparer mes biens" s'active dans votre tableau de bord.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── OFFRE PRO ── */}
      <section style={{ padding: '0 20px clamp(40px,5vw,64px)', maxWidth: 1080, margin: '0 auto' }}>
        <Reveal>
          <div style={{ padding: '22px 28px', borderRadius: 16, background: '#0f2d3d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Crown size={20} color="#f0a500" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Offre Professionnelle</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Notaires, agents, syndics — volumes illimités, support prioritaire, tarif dédié.</div>
              </div>
            </div>
            <Link to="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 11, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
              <Mail size={13} /> Nous contacter
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '0 20px clamp(48px,6vw,80px)', maxWidth: 680, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 20, textAlign: 'center' as const }}>Questions fréquentes</h2>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div style={{ borderRadius: 14, border: `1.5px solid ${openFaq === i ? '#2a7d9c' : '#edf2f7'}`, overflow: 'hidden', background: '#fff', transition: 'border-color 0.18s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{faq.q}</span>
                  <ChevronDown size={15} color={openFaq === i ? '#2a7d9c' : '#cbd5e1'} style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75, margin: 0, padding: '0 20px 16px', borderTop: '1px solid #f0f5f9' }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <p style={{ textAlign: 'center' as const, fontSize: 13, color: '#94a3b8', marginTop: 20 }}>
            Une autre question ? <a href="mailto:hello@verimo.fr" style={{ color: '#2a7d9c', fontWeight: 600, textDecoration: 'none' }}>hello@verimo.fr</a>
          </p>
        </Reveal>
      </section>

      <section style={{ padding: '0 20px 24px', textAlign: 'center' as const }}>
        <p style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>
          * Pour les documents PDF nativement numériques. Les documents scannés peuvent nécessiter un délai supplémentaire.
        </p>
      </section>

      <style>{`
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media (max-width: 860px) { .plans-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 520px) { .plans-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </main>
  );
}

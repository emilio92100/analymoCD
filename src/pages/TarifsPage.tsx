import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Check, Shield, Zap, FileText,
  Crown, Mail, GitCompare, Star,
} from 'lucide-react';

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const plans = [
  {
    id: 'document',
    name: 'Analyse Simple',
    price: '4,90',
    unit: '1 document',
    desc: 'Vous avez un seul document sous la main et vous voulez comprendre ce qu\'il dit avant d\'aller plus loin.',
    features: [
      { t: "Analyse d'un seul document", sub: "PV d'AG, DPE, règlement, appel de charges..." },
      { t: 'Identification et explication du document', sub: 'On vous dit ce que c\'est et ce qu\'il signifie' },
      { t: 'Points forts et points de vigilance', sub: 'Détectés automatiquement' },
      { t: 'Recommandation adaptée', sub: 'Positive ou prudente selon le contenu' },
    ],
    notIncluded: ['Score /20 global du bien', 'Comparaison de biens', 'Rapport PDF complet'],
    cta: 'Analyser un document',
    highlighted: false,
    badge: null,
    color: '#64748b',
    accent: '#f4f7f9',
  },
  {
    id: 'complete',
    name: 'Analyse Complète',
    price: '19,90',
    unit: 'Documents illimités',
    desc: 'Vous voulez comprendre un bien en profondeur avant de faire une offre. C\'est l\'analyse recommandée pour tout achat immobilier.',
    features: [
      { t: 'Tous vos documents analysés ensemble', sub: 'PV d\'AG, DPE, règlement, charges, diagnostics...' },
      { t: 'Score global /20 du bien', sub: 'Calculé sur 5 catégories : travaux, finances, procédures...' },
      { t: 'Recommandation d\'achat personnalisée', sub: 'Bien irréprochable, Bien sain, Bien risqué...' },
      { t: 'Travaux votés avec estimation financière', sub: 'Quote-part calculée pour votre lot' },
      { t: 'Santé financière de la copropriété', sub: 'Charges, fonds travaux, impayés, budget' },
      { t: 'Procédures judiciaires détectées', sub: 'Signalées avec niveau de gravité' },
      { t: 'Pistes de négociation si score < 14', sub: 'Arguments concrets pour revoir le prix' },
      { t: 'Rapport PDF complet téléchargeable', sub: 'Partageable avec votre notaire ou banquier' },
      { t: 'Compléter le dossier sous 7 jours', sub: 'Ajoutez des documents gratuitement après analyse' },
    ],
    notIncluded: ['Comparaison de biens (disponible dès le Pack 2)'],
    cta: 'Analyser mon bien',
    highlighted: true,
    badge: 'Le plus populaire',
    color: '#2a7d9c',
    accent: 'rgba(42,125,156,0.06)',
  },
  {
    id: 'pack2',
    name: 'Pack 2 Biens',
    price: '29,90',
    unit: '2 analyses complètes',
    desc: 'Vous hésitez entre deux biens ? Analysez-les tous les deux et comparez-les côte à côte pour faire le bon choix.',
    features: [
      { t: '2 analyses complètes indépendantes', sub: 'Tout ce que comprend l\'analyse à 19,90€ × 2' },
      { t: 'Comparaison côte à côte débloquée', sub: 'Score, travaux, finances, procédures des 2 biens' },
      { t: 'Verdict Verimo : quel bien choisir ?', sub: 'Recommandation claire basée sur les deux scores' },
      { t: 'Économisez 10€ vs 2 analyses séparées', sub: '29,90€ au lieu de 39,80€' },
    ],
    notIncluded: [],
    cta: 'Comparer 2 biens',
    highlighted: false,
    badge: 'Économique',
    color: '#0f2d3d',
    accent: '#f4f7f9',
  },
  {
    id: 'pack3',
    name: 'Pack 3 Biens',
    price: '39,90',
    unit: '3 analyses complètes',
    desc: 'Vous avez 3 biens en tête ? Obtenez 3 rapports complets et un classement final pour identifier le meilleur sans hésitation.',
    features: [
      { t: '3 analyses complètes indépendantes', sub: 'Tout ce que comprend l\'analyse à 19,90€ × 3' },
      { t: 'Comparaison côte à côte débloquée', sub: 'Comparez 2 ou 3 biens entre eux librement' },
      { t: 'Classement final + verdict Verimo', sub: 'Quel bien est le meilleur selon nos analyses ?' },
      { t: 'Économisez 20€ vs 3 analyses séparées', sub: '39,90€ au lieu de 59,70€' },
    ],
    notIncluded: [],
    cta: 'Comparer 3 biens',
    highlighted: false,
    badge: 'Meilleure valeur',
    color: '#0f2d3d',
    accent: '#f4f7f9',
  },
];

const garanties = [
  { icon: Shield, t: 'Paiement sécurisé', s: 'Via Stripe, chiffré SSL' },
  { icon: FileText, t: 'PDF inclus', s: 'Dans toutes les analyses complètes' },
  { icon: Zap, t: 'Résultats en 30s*', s: 'Pour les PDF natifs' },
  { icon: Crown, t: 'Sans abonnement', s: 'Payez une seule fois' },
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

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function TarifsPage() {
  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f4f7f9', paddingTop: 80, minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ textAlign: 'center', padding: 'clamp(40px,6vw,72px) 20px 36px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 12, fontWeight: 700, color: '#1a5e78', marginBottom: 20, letterSpacing: '0.06em' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse2 2s ease-in-out infinite', display: 'inline-block' }} />
          TARIFICATION TRANSPARENTE
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          style={{ fontSize: 'clamp(28px,4.5vw,56px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 16 }}>
          Des tarifs simples,<br />
          <span style={{ color: '#2a7d9c' }}>sans surprise.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.13 }}
          style={{ fontSize: 'clamp(15px,1.8vw,18px)', color: '#64748b', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Payez uniquement pour ce dont vous avez besoin. Sans abonnement, sans engagement.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
          {garanties.map(({ icon: Icon, t, s }) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              <Icon size={15} style={{ color: '#2a7d9c', flexShrink: 0 }} /> {t}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── CARTES ── */}
      <section style={{ padding: '0 20px 60px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Grille desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="plans-grid">
          {plans.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
              style={{
                background: '#fff', borderRadius: 20,
                border: plan.highlighted ? `2px solid #2a7d9c` : '1.5px solid #edf2f7',
                boxShadow: plan.highlighted ? '0 8px 32px rgba(42,125,156,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column' as const,
                position: 'relative' as const, overflow: 'hidden',
                transform: plan.highlighted ? 'scale(1.02)' : 'none',
              }}>

              {/* Barre top */}
              <div style={{ height: 4, background: plan.highlighted ? 'linear-gradient(90deg, #2a7d9c, #0f2d3d)' : '#edf2f7', flexShrink: 0 }} />

              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute' as const, top: 20, right: 16,
                  padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: plan.highlighted ? '#2a7d9c' : '#f0a500', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {plan.highlighted && <Star size={9} fill="white" />}
                  {plan.badge}
                </div>
              )}

              <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column' as const, flex: 1 }}>

                {/* Nom */}
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 16, paddingRight: plan.badge ? 80 : 0 }}>
                  {plan.name}
                </div>

                {/* Prix */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                  <span style={{ fontSize: 'clamp(36px,3.5vw,48px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#cbd5e1', marginBottom: 2 }}>€</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>{plan.unit} · paiement unique</div>

                {/* Description */}
                <div style={{ padding: '12px 14px', borderRadius: 12, background: plan.highlighted ? 'rgba(42,125,156,0.06)' : '#f8fafc', border: `1px solid ${plan.highlighted ? 'rgba(42,125,156,0.15)' : '#edf2f7'}`, marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>{plan.desc}</p>
                </div>

                {/* Features incluses */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: plan.highlighted ? 'rgba(42,125,156,0.12)' : '#f0fdf4', border: `1px solid ${plan.highlighted ? 'rgba(42,125,156,0.2)' : '#d1fae5'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <Check size={10} color={plan.highlighted ? '#2a7d9c' : '#16a34a'} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>{f.t}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.3, marginTop: 1 }}>{f.sub}</div>
                      </div>
                    </div>
                  ))}

                  {/* Non inclus */}
                  {plan.notIncluded.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, opacity: 0.45 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1, fontWeight: 700 }}>—</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{f}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link to={`/start?plan=${plan.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '13px', borderRadius: 13, marginTop: 24,
                    background: plan.highlighted ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#0f2d3d',
                    color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    boxShadow: plan.highlighted ? '0 6px 20px rgba(42,125,156,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  {plan.cta} <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Encart comparaison */}
        <Reveal delay={0.3}>
          <div style={{ marginTop: 20, padding: '18px 24px', borderRadius: 16, background: '#fff', border: '1.5px solid #bae3f5', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f0f7fb', border: '1px solid #bae3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GitCompare size={18} color="#2a7d9c" />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>La comparaison de biens se débloque automatiquement</div>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                Dès que votre compte contient <strong style={{ color: '#0f172a' }}>au minimum 2 analyses complètes</strong>, l'onglet "Comparer mes biens" s'active dans votre espace. Disponible avec le Pack 2 biens, le Pack 3 biens, ou en cumulant des analyses séparées.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Offre Pro */}
        <Reveal delay={0.1}>
          <div style={{ marginTop: 16, padding: '18px 24px', borderRadius: 16, background: '#fff', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Crown size={20} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Offre Professionnelle</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Notaires, agents immobiliers, syndics — volumes illimités, support prioritaire, tarification dédiée.</div>
              </div>
            </div>
            <Link to="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 11, background: '#0f2d3d', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
              <Mail size={13} /> Nous contacter
            </Link>
          </div>
        </Reveal>

        {/* Garanties */}
        <Reveal delay={0.15}>
          <div style={{ marginTop: 16, padding: '18px 24px', borderRadius: 16, background: '#fff', border: '1px solid #edf2f7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
              {garanties.map(({ icon: Icon, t, s }) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#2a7d9c" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Note bas de page */}
        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' as const, marginTop: 24, fontStyle: 'italic' }}>
          * Pour les documents PDF nativement numériques. Les documents scannés peuvent nécessiter un délai supplémentaire.
        </p>
      </section>

      <style>{`
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .plans-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

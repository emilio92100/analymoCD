import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight, ChevronDown, TrendingDown, TrendingUp,
  CheckCircle, AlertTriangle, FileText, Shield,
} from 'lucide-react';

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const categories = [
  {
    id: 'travaux', emoji: '🏗️', label: 'Travaux', pts: 5,
    color: '#f0a500', light: '#fffbeb', border: '#fde68a',
    desc: "Les travaux sont le premier risque financier d'un achat immobilier. Notre outil lit chaque PV d'AG pour détecter les travaux votés, évoqués à l'ordre du jour, ou identifiés comme urgents.",
    bad: [
      { l: 'Gros travaux évoqués non votés', v: '-2 à -3' },
      { l: 'Travaux urgents non anticipés', v: '-3 à -4' },
    ],
    good: [
      { l: 'Travaux votés — à la charge du vendeur', v: '+0,5 à +1' },
      { l: 'Garantie décennale sur travaux récents', v: '+0,5 à +1' },
    ],
  },
  {
    id: 'procedures', emoji: '⚖️', label: 'Procédures juridiques', pts: 4,
    color: '#dc2626', light: '#fef2f2', border: '#fecaca',
    desc: "Une procédure judiciaire en cours peut bloquer une vente, geler des fonds ou engager des frais imprévus pour l'acheteur. C'est un signal d'alarme majeur.",
    bad: [
      { l: 'Copropriété vs syndic', v: '-2 à -4' },
      { l: 'Copropriété vs copropriétaire', v: '-0,5 à -1' },
      { l: 'Copropriété en difficulté officielle', v: '-3 à -4' },
    ],
    good: [
      { l: 'Aucune procédure détectée dans les docs', v: 'Pas de pénalité ✓' },
    ],
  },
  {
    id: 'finances', emoji: '💰', label: 'Finances copropriété', pts: 4,
    color: '#2a7d9c', light: '#f0f7fb', border: '#bae3f5',
    desc: "La santé financière de la copropriété conditionne directement vos charges futures et votre capacité à faire face aux imprévus. Un fonds de travaux insuffisant peut coûter très cher.",
    bad: [
      { l: 'Écart budget réalisé > 30%', v: '-3' },
      { l: 'Écart budget réalisé 15–30%', v: '-2' },
      { l: 'Fonds travaux nul ou quasi nul', v: '-2' },
      { l: 'Impayés de charges détectés', v: '-1 à -2' },
    ],
    good: [
      { l: 'Fonds travaux conforme au minimum légal', v: '+0,5' },
      { l: 'Fonds travaux au-dessus du légal', v: '+1' },
    ],
  },
  {
    id: 'diags-prives', emoji: '🏠', label: 'Diagnostics privatifs', pts: 4,
    color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe',
    desc: "Les diagnostics de votre lot impactent directement sa valeur marchande, sa revente future et vos charges énergétiques. Un DPE G sur un investissement peut coûter jusqu'à 6 points.",
    bad: [
      { l: 'DPE F — résidence principale', v: '-2' },
      { l: 'DPE G — résidence principale', v: '-3' },
      { l: 'DPE F — investissement locatif', v: '-4' },
      { l: 'DPE G — investissement locatif', v: '-6' },
      { l: 'Électricité : anomalies majeures', v: '-2' },
      { l: 'Amiante accessible dégradé', v: '-2' },
      { l: 'Termites non traités', v: '-2' },
    ],
    good: [
      { l: 'DPE A', v: '+1' },
      { l: 'DPE B ou C', v: '+0,5' },
    ],
  },
  {
    id: 'diags-communs', emoji: '🏢', label: 'Diagnostics communs', pts: 3,
    color: '#16a34a', light: '#f0fdf4', border: '#bbf7d0',
    desc: "L'état des parties communes de l'immeuble conditionne la santé globale de la copropriété et vos futures charges collectives. Un immeuble bien entretenu est un bon signal.",
    bad: [
      { l: 'Amiante parties communes dégradé', v: '-2' },
      { l: 'Termites parties communes non traités', v: '-2' },
    ],
    good: [
      { l: 'Immeuble globalement bien entretenu', v: '+0,5' },
      { l: 'Certificat entretien chaudière / ramonage', v: '+0,5' },
    ],
  },
];

const levels = [
  { r: '17 – 20', l: 'Bien irréprochable', c: '#15803d', bar: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', pct: 100, desc: 'Achetez sereinement. Copropriété saine, aucun risque majeur détecté.' },
  { r: '14 – 16', l: 'Bien sain', c: '#16a34a', bar: '#22c55e', bg: '#f7fef9', border: '#d1fae5', pct: 80, desc: 'Quelques points de vigilance mineurs mais rien de bloquant. Bonne affaire.' },
  { r: '10 – 13', l: 'Bien correct avec réserves', c: '#d97706', bar: '#f59e0b', bg: '#fffbeb', border: '#fde68a', pct: 58, desc: 'Des vigilances identifiées. Négociez le prix avant de signer.' },
  { r: '7 – 9', l: 'Bien risqué', c: '#ea580c', bar: '#f97316', bg: '#fff7ed', border: '#fed7aa', pct: 40, desc: 'Risques significatifs détectés. Analyse approfondie vivement recommandée.' },
  { r: '0 – 6', l: 'Bien à éviter', c: '#dc2626', bar: '#ef4444', bg: '#fef2f2', border: '#fecaca', pct: 22, desc: 'Risques majeurs. Négociation forte ou abandon de l\'offre recommandé.' },
];

const faqs = [
  {
    q: 'Pourquoi partir de 20 et non de 0 ?',
    a: "Parce qu'on part du principe que votre bien est parfait — jusqu'à preuve du contraire. C'est plus intuitif : un 18/20 signifie quasi irréprochable, un 8/20 signifie risques sérieux détectés. Si on partait de 0, personne ne saurait si 12 est bon ou mauvais.",
  },
  {
    q: 'Peut-on dépasser 20/20 ?',
    a: "Non. Les bonus s'ajoutent mais la note est plafonnée à 20. Si les points positifs compensent largement les négatifs, vous atteignez le maximum — c'est déjà excellent.",
  },
  {
    q: "La note change-t-elle si j'ajoute des documents ?",
    a: "Oui, et c'est voulu. Plus vous fournissez de documents, plus la note est précise. Un DPE manquant ne pénalise pas — mais le révéler peut faire varier la note dans les deux sens. C'est pourquoi l'option de compléter son dossier dans les 7 jours après analyse existe.",
  },
  {
    q: 'Quelle différence entre analyse simple et complète ?',
    a: "L'analyse simple (4,90€) porte sur un seul document et ne génère pas de note /20. L'analyse complète (19,90€) accepte plusieurs documents, calcule le score /20 et produit le rapport complet avec recommandation d'achat.",
  },
  {
    q: 'La note Verimo remplace-t-elle un expert immobilier ?',
    a: "Non. Verimo est un outil d'aide à la lecture et à la décision. Il détecte les signaux présents dans vos documents — mais ne se substitue pas à une visite physique ou à l'avis d'un professionnel qualifié.",
  },
];

const docs = [
  { emoji: '📋', label: "PV d'Assemblée Générale", note: 'Travaux votés, budget, procédures', priority: 'Indispensable', pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5' },
  { emoji: '📑', label: 'Règlement de copropriété', note: 'Charges, droits, obligations légales', priority: 'Indispensable', pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5' },
  { emoji: '🔋', label: 'Diagnostic DPE', note: 'Performance énergétique A → G', priority: 'Recommandé', pc: '#d97706', pb: '#fffbeb', pb2: '#fde68a' },
  { emoji: '💸', label: 'Appels de charges', note: 'Charges réelles mensuelles exactes', priority: 'Recommandé', pc: '#d97706', pb: '#fffbeb', pb2: '#fde68a' },
  { emoji: '⚡', label: 'Diagnostic électricité', note: "Conformité de l'installation", priority: 'Utile', pc: '#2a7d9c', pb: '#f0f7fb', pb2: '#bae3f5' },
  { emoji: '🧱', label: 'Diagnostic amiante', note: 'État des matériaux à risque', priority: 'Utile', pc: '#2a7d9c', pb: '#f0f7fb', pb2: '#bae3f5' },
];

const sections = [
  { id: 'principe', label: 'Le principe' },
  { id: 'categories', label: 'Les 5 catégories' },
  { id: 'exemple', label: 'Exemple de calcul' },
  { id: 'echelle', label: "L'échelle des notes" },
  { id: 'documents', label: 'Documents acceptés' },
  { id: 'faq', label: 'Questions fréquentes' },
];

/* ══════════════════════════════════════════
   SOUS-COMPOSANTS
══════════════════════════════════════════ */
function ScoreBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: '#f0f7fb', border: '1px solid #bae3f5', fontSize: 11, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 16 }}>
      {children}
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function MethodePage() {
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('principe');

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom > 120) {
            setActiveSection(s.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fff', paddingTop: 72 }}>

      {/* ── HERO COMPACT ───────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(to bottom, #f8fafc, #fff)', borderBottom: '1px solid #edf2f7', padding: '40px 40px 36px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionLabel>Méthode de notation</SectionLabel>
          <h1 style={{ fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 12, maxWidth: 600 }}>
            Comment on calcule<br />votre score <span style={{ color: '#2a7d9c' }}>/20</span>
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.65, maxWidth: 520, margin: 0 }}>
            Transparent, objectif, reproductible — voici exactement notre méthode, sans formule magique.
          </p>
        </div>
      </section>

      {/* ── LAYOUT DEUX COLONNES ───────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '0 60px', padding: '0 40px', alignItems: 'start' }}>

        {/* SIDEBAR STICKY */}
        <aside style={{ position: 'sticky', top: 100, paddingTop: 48, paddingBottom: 48 }}>
          <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
            {sections.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', borderRadius: 10, border: 'none',
                  background: activeSection === s.id ? '#f0f7fb' : 'transparent',
                  cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s',
                }}>
                <div style={{ width: 3, height: 14, borderRadius: 99, background: activeSection === s.id ? '#2a7d9c' : 'transparent', flexShrink: 0, transition: 'all 0.15s' }} />
                <span style={{ fontSize: 13, fontWeight: activeSection === s.id ? 700 : 500, color: activeSection === s.id ? '#0f172a' : '#94a3b8', transition: 'all 0.15s' }}>
                  {s.label}
                </span>
              </button>
            ))}
          </nav>

          {/* CTA sidebar */}
          <div style={{ marginTop: 32, padding: '18px', borderRadius: 14, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1px solid #bae3f5' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2d3d', marginBottom: 6 }}>Prêt à analyser ?</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>Obtenez votre score /20 en moins de 2 minutes.</div>
            <Link to="/start" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Analyser <ArrowRight size={13} />
            </Link>
          </div>
        </aside>

        {/* CONTENU PRINCIPAL */}
        <div style={{ paddingTop: 48, paddingBottom: 80, display: 'flex', flexDirection: 'column' as const, gap: 80 }}>

          {/* ── 1. PRINCIPE ──────────────────────────────────────── */}
          <section id="principe">
            <Reveal>
              <SectionLabel>Le principe</SectionLabel>
              <h2 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 24 }}>
                Bonne nouvelle : vous partez de 20/20 🏆
              </h2>
            </Reveal>

            <Reveal delay={0.05}>
              <div style={{ background: '#f8fafc', borderRadius: 18, border: '1px solid #edf2f7', padding: '24px 28px', marginBottom: 24 }}>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: 0 }}>
                  Contrairement à votre prof de maths qui commençait à zéro,{' '}
                  <strong style={{ color: '#0f172a' }}>on part du principe que votre bien est parfait.</strong>{' '}
                  Puis on lit vos documents... et on retire des points pour chaque risque détecté. 😅
                  <br /><br />
                  Les bons éléments ? On en ajoute aussi. C'est ça, être fair-play.
                </p>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { icon: '20', bg: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', title: 'Départ : 20/20', sub: 'Votre bien est parfait par défaut' },
                { icon: '−', bg: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', title: 'Points négatifs', sub: 'Retirés selon les risques détectés' },
                { icon: '+', bg: '#f0fdf4', color: '#16a34a', border: '1.5px solid #d1fae5', title: 'Points positifs', sub: 'Ajoutés pour les bons éléments' },
              ].map((step, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '20px 18px', textAlign: 'center' as const }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: step.bg, border: (step as any).border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: step.color, margin: '0 auto 14px' }}>
                      {step.icon}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{step.sub}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── 2. CATÉGORIES ────────────────────────────────────── */}
          <section id="categories">
            <Reveal>
              <SectionLabel>5 catégories analysées</SectionLabel>
              <h2 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Ce qu'on examine dans vos documents
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28 }}>Cliquez sur une catégorie pour voir le détail des points attribués.</p>
            </Reveal>

            {/* Barre de répartition visuelle */}
            <Reveal delay={0.05}>
              <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', height: 10, marginBottom: 28, gap: 2 }}>
                {categories.map((cat) => (
                  <div key={cat.id} style={{ flex: cat.pts, background: cat.color, opacity: 0.75 }} title={`${cat.label} — ${cat.pts} pts`} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' as const }}>
                {categories.map((cat) => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: cat.color }} />
                    {cat.label} ({cat.pts} pts)
                  </div>
                ))}
              </div>
            </Reveal>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {categories.map((cat, idx) => (
                <Reveal key={cat.id} delay={idx * 0.04}>
                  <div style={{ borderRadius: 14, border: `1.5px solid ${openCat === cat.id ? cat.color : '#edf2f7'}`, overflow: 'hidden', transition: 'border-color 0.18s, box-shadow 0.18s', boxShadow: openCat === cat.id ? `0 4px 20px ${cat.color}20` : 'none', background: '#fff' }}>

                    <button onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: cat.light, border: `1px solid ${cat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {cat.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{cat.label}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
                          {openCat === cat.id ? cat.desc.slice(0, 55) + '…' : 'Sur ' + cat.pts + ' points maximum'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: cat.color }}>{cat.pts} pts</span>
                        <ChevronDown size={16} color="#cbd5e1" style={{ flexShrink: 0, transform: openCat === cat.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {openCat === cat.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                          <div style={{ borderTop: `1px solid ${cat.border}`, padding: '20px 22px', background: cat.light }}>
                            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.75, marginBottom: 20 }}>{cat.desc}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #fecaca', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                  <TrendingDown size={13} color="#dc2626" />
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Pénalités</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                                  {cat.bad.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 12, color: '#374151' }}>{item.l}</span>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: 5, flexShrink: 0 }}>{item.v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                  <TrendingUp size={13} color="#16a34a" />
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Bonus</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
                                  {cat.good.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 12, color: '#374151' }}>{item.l}</span>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 5, flexShrink: 0 }}>{item.v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── 3. EXEMPLE CONCRET ───────────────────────────────── */}
          <section id="exemple">
            <Reveal>
              <SectionLabel>Exemple concret</SectionLabel>
              <h2 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Un calcul réel, étape par étape
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28 }}>Appartement — 12 rue des Lilas, Lyon 6e · Résidence principale</p>
            </Reveal>

            <div style={{ border: '1.5px solid #edf2f7', borderRadius: 18, overflow: 'hidden' }}>
              {/* En-tête */}
              <div style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>🏠</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>12 rue des Lilas — Appartement 4B, Lyon 6e</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>PV d'AG 2024 + DPE + Règlement copropriété analysés</div>
                </div>
              </div>

              {/* Lignes de calcul */}
              <div style={{ padding: '8px 0' }}>
                {[
                  { label: 'Point de départ', note: 'Note maximale de base', pts: '+20', color: '#0f172a', bg: 'transparent', bold: true },
                  { label: 'Ravalement de façade évoqué non voté', note: 'Travaux · risque financier pour l\'acheteur', pts: '−2,5', color: '#dc2626', bg: '#fef9f9' },
                  { label: 'Fonds travaux sous-provisionné', note: 'Finances · budget inférieur au minimum légal', pts: '−2', color: '#dc2626', bg: '#fef9f9' },
                  { label: 'DPE classé C', note: 'Diagnostics privatifs · bonne performance énergétique', pts: '+0,5', color: '#16a34a', bg: '#f9fef9' },
                  { label: 'Aucune procédure judiciaire détectée', note: 'Procédures · situation juridique saine', pts: '±0', color: '#94a3b8', bg: 'transparent' },
                ].map((row, i) => (
                  <Reveal key={i} delay={i * 0.06}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '13px 22px', background: row.bg, borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: row.bold ? 700 : 600, color: '#0f172a' }}>{row.label}</div>
                        {!row.bold && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{row.note}</div>}
                      </div>
                      <span style={{ fontSize: row.bold ? 18 : 16, fontWeight: 900, color: row.color, flexShrink: 0 }}>{row.pts}</span>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Résultat */}
              <Reveal delay={0.35}>
                <div style={{ borderTop: '2px solid #edf2f7', padding: '18px 22px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Score final</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Arrondi au 0,5 près</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                      <span style={{ fontSize: 42, fontWeight: 900, color: '#16a34a', letterSpacing: '-0.03em' }}>16</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#cbd5e1' }}>/20</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #d1fae5', padding: '5px 14px', borderRadius: 10 }}>Bien sain ✓</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── 4. ÉCHELLE ───────────────────────────────────────── */}
          <section id="echelle">
            <Reveal>
              <SectionLabel>L'échelle des notes</SectionLabel>
              <h2 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 28 }}>
                5 niveaux, une recommandation claire
              </h2>
            </Reveal>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {levels.map((level, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <div style={{ borderRadius: 14, border: `1.5px solid ${level.border}`, background: level.bg, padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' as const }}>
                      <div style={{ minWidth: 80 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: level.c }}>{level.r}</span>
                        <span style={{ fontSize: 12, color: level.c, opacity: 0.6 }}>/20</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: level.c, marginBottom: 2 }}>{level.l}</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>{level.desc}</div>
                      </div>
                    </div>
                    <ScoreBar pct={level.pct} color={level.bar} delay={i * 0.1 + 0.2} />
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.5}>
              <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.65 }}>
                  <strong>Astuce :</strong> si votre score est entre 0 et 13, Verimo génère automatiquement des pistes de négociation pour vous aider à revoir le prix à la baisse.
                </p>
              </div>
            </Reveal>
          </section>

          {/* ── 5. DOCUMENTS ─────────────────────────────────────── */}
          <section id="documents">
            <Reveal>
              <SectionLabel>Documents acceptés</SectionLabel>
              <h2 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Plus vous en donnez, plus c'est précis
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28 }}>PDF, Word, JPG — tous les formats sont acceptés.</p>
            </Reveal>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {docs.map((doc, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, border: '1.5px solid #edf2f7', background: '#fff' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: doc.pb, border: `1px solid ${doc.pb2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {doc.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{doc.label}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{doc.note}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: doc.pc, background: doc.pb, border: `1px solid ${doc.pb2}`, padding: '4px 11px', borderRadius: 8, flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                      {doc.priority}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.3}>
              <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#15803d', fontWeight: 600, margin: 0 }}>
                  Vos documents sont supprimés immédiatement après traitement. RGPD — aucun stockage permanent.
                </p>
              </div>
            </Reveal>
          </section>

          {/* ── 6. FAQ ───────────────────────────────────────────── */}
          <section id="faq">
            <Reveal>
              <SectionLabel>Questions fréquentes</SectionLabel>
              <h2 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 28 }}>
                Tout ce qu'on nous demande souvent
              </h2>
            </Reveal>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {faqs.map((faq, i) => (
                <Reveal key={i} delay={i * 0.04}>
                  <div style={{ borderRadius: 14, border: `1.5px solid ${openFaq === i ? '#2a7d9c' : '#edf2f7'}`, overflow: 'hidden', background: '#fff', transition: 'border-color 0.18s' }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '17px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{faq.q}</span>
                      <ChevronDown size={16} color={openFaq === i ? '#2a7d9c' : '#cbd5e1'} style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                          <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.8, margin: 0, padding: '0 22px 18px', borderTop: '1px solid #f0f5f9' }}>{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── CTA FINAL ────────────────────────────────────────── */}
          <Reveal>
            <div style={{ borderRadius: 20, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5', padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' as const }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 6 }}>Prêt à noter votre bien ?</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>Score /20 + rapport complet en moins de 2 minutes.</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(42,125,156,0.28)' }}>
                  Analyser mon bien <ArrowRight size={14} />
                </Link>
                <Link to="/exemple" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 20px', borderRadius: 12, background: '#fff', border: '1.5px solid #d1e9f5', color: '#0f172a', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Voir un exemple
                </Link>
              </div>
            </div>
          </Reveal>

        </div>{/* fin contenu */}
      </div>{/* fin grid */}

      {/* CSS responsive — masquer sidebar sur mobile */}
      <style>{`
        @media (max-width: 768px) {
          main > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          main > div[style*="grid-template-columns"] > aside {
            display: none !important;
          }
          main > div[style*="grid-template-columns"] {
            padding: 0 16px !important;
            gap: 0 !important;
          }
        }
      `}</style>

    </main>
  );
}

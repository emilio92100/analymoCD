import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, ChevronDown, TrendingDown, TrendingUp, AlertTriangle, Shield, Check } from 'lucide-react';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isLowPerf = () => isIOS() || (typeof window !== 'undefined' && window.innerWidth <= 768);

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */

const docTypes = [
  {
    id: 'pvag',
    emoji: '📋',
    label: "PV d'Assemblée Générale",
    what: "Le compte-rendu officiel de la réunion annuelle des copropriétaires. C'est le document le plus riche — il contient toutes les décisions votées, le budget et les travaux approuvés.",
    extracts: [
      'Travaux votés ou évoqués (ravalement, toiture, ascenseur…)',
      'Budget annuel de la copropriété et écarts constatés',
      'Procédures judiciaires en cours',
      'État des impayés de charges',
      'Fonds de travaux disponible',
    ],
    priority: 'Indispensable',
    pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5',
  },
  {
    id: 'reglement',
    emoji: '📑',
    label: 'Règlement de copropriété',
    what: "Le document juridique qui définit les règles de vie dans l'immeuble, les parties communes, les restrictions d'usage et la répartition des charges entre copropriétaires.",
    extracts: [
      'Répartition des charges par lot (tantièmes)',
      "Restrictions d'usage (animaux, location, travaux…)",
      'Définition des parties communes et privatives',
      'Règles de modification du règlement',
    ],
    priority: 'Indispensable',
    pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5',
  },
  {
    id: 'dpe',
    emoji: '🔋',
    label: 'Diagnostic de Performance Énergétique (DPE)',
    what: "Classe le logement de A (très économe) à G (très énergivore) selon sa consommation d'énergie et ses émissions de CO₂. Un DPE F ou G peut impacter fortement la valeur et la revente.",
    extracts: [
      'Classe énergétique (A à G)',
      'Consommation estimée en kWh/an',
      'Émissions de gaz à effet de serre',
      'Recommandations de travaux d\'isolation',
    ],
    priority: 'Recommandé',
    pc: '#d97706', pb: '#fffbeb', pb2: '#fde68a',
  },
  {
    id: 'charges',
    emoji: '💸',
    label: 'Appels de charges',
    what: "Document envoyé par le syndic réclamant votre participation aux dépenses communes. Il reflète les charges réelles mensuelles ou trimestrielles du logement.",
    extracts: [
      'Montant exact des charges courantes',
      'Répartition par poste (gardien, entretien, eau…)',
      'Appels exceptionnels (travaux non prévus)',
      'Évolution des charges dans le temps',
    ],
    priority: 'Recommandé',
    pc: '#d97706', pb: '#fffbeb', pb2: '#fde68a',
  },
  {
    id: 'diags',
    emoji: '⚡',
    label: 'Diagnostics techniques (électricité, amiante, termites…)',
    what: "L'ensemble des diagnostics obligatoires du logement. Chacun analyse un risque spécifique : installation électrique, matériaux dangereux, parasites, risques naturels.",
    extracts: [
      'Conformité de l\'installation électrique',
      'Présence ou absence d\'amiante accessible',
      'Présence ou absence de termites',
      'Risques naturels et technologiques (ERRIAL)',
    ],
    priority: 'Utile',
    pc: '#2a7d9c', pb: '#f0f7fb', pb2: '#bae3f5',
  },
  {
    id: 'autres',
    emoji: '📂',
    label: 'Autres documents reconnus',
    what: "Verimo reconnaît aussi : Plan Pluriannuel de Travaux (PPT), Diagnostic Technique Global (DTG), état daté, carnet d'entretien, garantie décennale, compromis de vente, bail emphytéotique.",
    extracts: [
      'PPT : travaux planifiés sur 10 ans avec budget',
      'DTG : état général de l\'immeuble',
      'Garantie décennale : couverture des gros travaux récents',
      'État daté : situation financière du vendeur vis-à-vis de la copro',
    ],
    priority: 'Utile',
    pc: '#2a7d9c', pb: '#f0f7fb', pb2: '#bae3f5',
  },
];

const categories = [
  {
    id: 'travaux', emoji: '🏗️', label: 'Travaux', pts: 5,
    color: '#f0a500', light: '#fffbeb', border: '#fde68a',
    desc: "Les travaux sont le premier risque financier. On détecte tout ce qui est évoqué, voté ou urgent dans vos PV d'AG.",
    bad: [{ l: 'Gros travaux évoqués non votés', v: '-2 à -3' }, { l: 'Travaux urgents non anticipés', v: '-3 à -4' }],
    good: [{ l: 'Travaux votés (charge du vendeur)', v: '+0,5 à +1' }, { l: 'Garantie décennale récente', v: '+0,5 à +1' }],
  },
  {
    id: 'procedures', emoji: '⚖️', label: 'Procédures juridiques', pts: 4,
    color: '#dc2626', light: '#fef2f2', border: '#fecaca',
    desc: "Un litige peut bloquer la vente ou engager des frais imprévus.",
    bad: [{ l: 'Copropriété vs syndic', v: '-2 à -4' }, { l: 'Copropriété vs copropriétaire', v: '-0,5 à -1' }, { l: 'Copropriété en difficulté officielle', v: '-3 à -4' }],
    good: [{ l: 'Aucune procédure détectée', v: 'Pas de pénalité ✓' }],
  },
  {
    id: 'finances', emoji: '💰', label: 'Finances copropriété', pts: 4,
    color: '#2a7d9c', light: '#f0f7fb', border: '#bae3f5',
    desc: "La santé financière conditionne vos charges futures. Un fonds de travaux insuffisant peut coûter très cher.",
    bad: [{ l: 'Écart budget réalisé > 30%', v: '-3' }, { l: 'Fonds travaux nul', v: '-2' }, { l: 'Impayés de charges', v: '-1 à -2' }],
    good: [{ l: 'Fonds travaux conforme au légal', v: '+0,5' }, { l: 'Fonds travaux au-dessus du légal', v: '+1' }],
  },
  {
    id: 'diags-prives', emoji: '🏠', label: 'Diagnostics privatifs', pts: 4,
    color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe',
    desc: "DPE, électricité, amiante — ils impactent la valeur, la revente et les charges énergétiques.",
    bad: [{ l: 'DPE F (résidence principale)', v: '-2' }, { l: 'DPE G (résidence principale)', v: '-3' }, { l: 'DPE F ou G (investissement)', v: '-4 à -6' }, { l: 'Électricité : anomalies majeures', v: '-2' }],
    good: [{ l: 'DPE A', v: '+1' }, { l: 'DPE B ou C', v: '+0,5' }],
  },
  {
    id: 'diags-communs', emoji: '🏢', label: 'Diagnostics communs', pts: 3,
    color: '#16a34a', light: '#f0fdf4', border: '#bbf7d0',
    desc: "L'état des parties communes conditionne vos charges collectives futures.",
    bad: [{ l: 'Amiante parties communes dégradé', v: '-2' }, { l: 'Termites parties communes', v: '-2' }],
    good: [{ l: 'Immeuble bien entretenu', v: '+0,5' }, { l: 'Entretien chaudière certifié', v: '+0,5' }],
  },
];

const levels = [
  { r: '17 – 20', l: 'Bien irréprochable', c: '#15803d', bar: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', pct: 100, desc: 'Achetez sereinement. Aucun risque majeur détecté.' },
  { r: '14 – 16', l: 'Bien sain', c: '#16a34a', bar: '#22c55e', bg: '#f7fef9', border: '#d1fae5', pct: 80, desc: 'Quelques vigilances mineures, rien de bloquant.' },
  { r: '10 – 13', l: 'Bien correct avec réserves', c: '#d97706', bar: '#f59e0b', bg: '#fffbeb', border: '#fde68a', pct: 58, desc: 'Des vigilances identifiées. Négociez le prix.' },
  { r: '7 – 9', l: 'Bien risqué', c: '#ea580c', bar: '#f97316', bg: '#fff7ed', border: '#fed7aa', pct: 40, desc: 'Risques significatifs. Analyse approfondie recommandée.' },
  { r: '0 – 6', l: 'Bien à éviter', c: '#dc2626', bar: '#ef4444', bg: '#fef2f2', border: '#fecaca', pct: 22, desc: "Risques majeurs. Négociation forte ou abandon recommandé." },
];

const faqs = [
  { q: 'Pourquoi partir de 20 et non de 0 ?', a: "Parce qu'on part du principe que votre bien est parfait — jusqu'à preuve du contraire. C'est plus intuitif : un 18/20 signifie quasi irréprochable, un 8/20 signifie risques sérieux. Si on partait de 0, personne ne saurait si 12 est bon ou mauvais." },
  { q: 'La note change-t-elle si j\'ajoute des documents ?', a: "Oui, et c'est voulu. Plus vous fournissez de documents, plus la note est précise. Un document manquant ne pénalise pas — mais le révéler peut faire varier la note dans les deux sens. C'est pourquoi l'option de compléter son dossier dans les 7 jours après analyse existe." },
  { q: 'Peut-on dépasser 20/20 ?', a: "Non. Les bonus s'ajoutent mais la note est plafonnée à 20. Si les points positifs compensent largement les négatifs, vous atteignez le maximum — c'est déjà excellent." },
  { q: 'La note Verimo remplace-t-elle un expert immobilier ?', a: "Non. Verimo est un outil d'aide à la lecture et à la décision. Il détecte les signaux présents dans vos documents — mais ne se substitue pas à une visite physique ou à l'avis d'un professionnel qualifié." },
  { q: 'Que se passe-t-il si mon document n\'est pas reconnu ?', a: "Notre outil l'indique clairement dans le rapport en précisant qu'il ne s'agit pas d'un document immobilier reconnu. Aucune pénalité n'est appliquée pour un document non analysable." },
];

const navSections = [
  { id: 'types-analyses', label: 'Analyse simple vs complète' },
  { id: 'documents', label: 'Documents analysés' },
  { id: 'principe', label: 'Le score /20' },
  { id: 'categories', label: 'Les 5 catégories' },
  { id: 'exemple', label: 'Exemple concret' },
  { id: 'echelle', label: "L'échelle des notes" },
  { id: 'faq', label: 'Questions fréquentes' },
];

/* ══════════════════════════════════════════
   COMPOSANTS
══════════════════════════════════════════ */
function ScoreBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={inView ? { width: `${pct}%` } : {}} transition={{ duration: isLowPerf() ? 0.4 : 1, delay: isLowPerf() ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '100%', background: color, borderRadius: 99 }} />
    </div>
  );
}

function Tag({ children, color, bg, border }: { children: React.ReactNode; color: string; bg: string; border: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color, background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap' as const }}>
      {children}
    </span>
  );
}

function SectionHead({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>{label}</div>
      <h2 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: sub ? 10 : 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: isLowPerf() ? '0px' : '-30px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: isLowPerf() ? 6 : 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: isLowPerf() ? 0.18 : 0.45, delay: isLowPerf() ? Math.min(delay, 0.05) : delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function MethodePage() {
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('types-analyses');

  useEffect(() => {
    const handle = () => {
      for (const s of navSections) {
        const el = document.getElementById(s.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 130 && rect.bottom > 130) { setActiveSection(s.id); break; }
        }
      }
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fff', paddingTop: 72 }}>

      {/* ── HERO COMPACT ──────────────────────────────────────── */}
      <section style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7', padding: '52px 24px 44px', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <motion.p initial={{ opacity: 0, y: isLowPerf() ? 4 : 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isLowPerf() ? 0.18 : 0.4 }}
            style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.22em', textTransform: 'uppercase' as const, marginBottom: 16 }}>
            Notre méthode
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: isLowPerf() ? 6 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: isLowPerf() ? 0.04 : 0.07, duration: isLowPerf() ? 0.2 : 0.45 }}
            style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 20 }}>
            Comment Verimo analyse<br />
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ color: '#2a7d9c' }}>vos documents</span>
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: isLowPerf() ? 0.5 : 2.5, delay: isLowPerf() ? 0.1 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 4, background: 'rgba(42,125,156,0.25)', borderRadius: 99, transformOrigin: 'left', display: 'block' }} />
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: isLowPerf() ? 0.08 : 0.2 }}
            style={{ fontSize: 'clamp(14px,1.6vw,17px)', color: '#64748b', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
            Comprendre comment votre bien est noté, en toute transparence.
          </motion.p>
        </div>
      </section>

      {/* ── LAYOUT DEUX COLONNES ──────────────────────────────── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0 64px', padding: '0 40px', alignItems: 'start' }}>

        {/* SIDEBAR */}
        <aside style={{ position: 'sticky', top: 96, paddingTop: 44, paddingBottom: 44 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 12, paddingLeft: 4 }}>Sur cette page</div>
          <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
            {navSections.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', background: activeSection === s.id ? '#f0f7fb' : 'transparent', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}>
                <div style={{ width: 3, height: 16, borderRadius: 99, background: activeSection === s.id ? '#2a7d9c' : '#e2e8f0', flexShrink: 0, transition: 'all 0.15s' }} />
                <span style={{ fontSize: 14, fontWeight: activeSection === s.id ? 700 : 400, color: activeSection === s.id ? '#0f172a' : '#64748b', lineHeight: 1.4, transition: 'all 0.15s' }}>{s.label}</span>
              </button>
            ))}
          </nav>
          <div style={{ marginTop: 28, padding: '18px', borderRadius: 14, background: '#f8fafc', border: '1px solid #edf2f7' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', marginBottom: 6 }}>Analyser un bien</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14, lineHeight: 1.5 }}>Score /20 en moins de 30 secondes*</div>
            <Link to="/start" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Commencer <ArrowRight size={13} />
            </Link>
          </div>
        </aside>

        {/* CONTENU */}
        <div style={{ paddingTop: 44, paddingBottom: 80, display: 'flex', flexDirection: 'column' as const, gap: 72 }}>

          {/* ── 1. ANALYSE SIMPLE VS COMPLÈTE ─────────────────── */}
          <section id="types-analyses">
            <Reveal>
              <SectionHead label="Les deux types d'analyse" title="Analyse simple ou analyse complète ?" sub="Verimo propose deux niveaux d'analyse selon ce que vous souhaitez comprendre." />
            </Reveal>

            <div className="analyse-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Reveal>
                <div style={{ borderRadius: 16, border: '1.5px solid #edf2f7', padding: '22px 24px', background: '#fafbfc', height: '100%', boxSizing: 'border-box' as const }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Analyse simple</div>
                  <div style={{ fontSize: 14, color: '#64748b', marginBottom: 18, lineHeight: 1.6 }}>
                    Vous uploadez <strong style={{ color: '#0f172a' }}>un seul document</strong>. Notre outil l'identifie, en extrait les informations clés, et vous donne les points forts et les vigilances détectés.
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>⚠ Pas de note /20</div>
                    <div style={{ fontSize: 12, color: '#7f1d1d' }}>L'analyse simple porte sur un seul document, pas sur un bien complet.</div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.07}>
                <div style={{ borderRadius: 16, border: '1.5px solid #2a7d9c', padding: '22px 24px', background: '#f0f7fb', height: '100%', boxSizing: 'border-box' as const, boxShadow: '0 4px 18px rgba(42,125,156,0.1)' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Analyse complète</div>
                  <div style={{ fontSize: 14, color: '#374151', marginBottom: 18, lineHeight: 1.6 }}>
                    Vous uploadez <strong style={{ color: '#0f172a' }}>autant de documents que vous voulez</strong>. Notre outil les croise et génère un score /20 global du bien avec rapport complet.
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>✓ Score /20 + rapport PDF</div>
                    <div style={{ fontSize: 12, color: '#14532d' }}>Recommandation d'achat, travaux, charges, procédures — tout est inclus.</div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── 2. DOCUMENTS ANALYSÉS ─────────────────────────── */}
          <section id="documents">
            <Reveal>
              <SectionHead label="Documents analysés" title="Ce qu'on lit dans chaque document" sub="Cliquez sur un document pour voir ce qu'on en extrait exactement." />
            </Reveal>

            {/* Barre de priorité */}
            <Reveal delay={0.04}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' as const }}>
                {[{ l: 'Indispensable', c: '#16a34a', bg: '#f0fdf4', b: '#d1fae5' }, { l: 'Recommandé', c: '#d97706', bg: '#fffbeb', b: '#fde68a' }, { l: 'Utile', c: '#2a7d9c', bg: '#f0f7fb', b: '#bae3f5' }].map((t) => (
                  <Tag key={t.l} color={t.c} bg={t.bg} border={t.b}>{t.l}</Tag>
                ))}
                <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>— priorité recommandée pour l'analyse complète</span>
              </div>
            </Reveal>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {docTypes.map((doc, idx) => (
                <Reveal key={doc.id} delay={idx * 0.04}>
                  <div style={{ borderRadius: 14, border: `1.5px solid ${openDoc === doc.id ? doc.pb2 : '#edf2f7'}`, overflow: 'hidden', background: '#fff', transition: 'border-color 0.18s', boxShadow: openDoc === doc.id ? `0 4px 16px ${doc.pc}18` : 'none' }}>
                    <button onClick={() => setOpenDoc(openDoc === doc.id ? null : doc.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: doc.pb, border: `1px solid ${doc.pb2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {doc.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{doc.label}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                          {openDoc === doc.id ? 'Ce qu\'on extrait de ce document' : doc.what.slice(0, 60) + '…'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Tag color={doc.pc} bg={doc.pb} border={doc.pb2}>{doc.priority}</Tag>
                        <ChevronDown size={15} color="#cbd5e1" style={{ flexShrink: 0, transform: openDoc === doc.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {openDoc === doc.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                          <div style={{ borderTop: `1px solid ${doc.pb2}`, padding: '18px 20px', background: doc.pb }}>
                            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.75, marginBottom: 16 }}>{doc.what}</p>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 10 }}>Ce qu'on en extrait</div>
                            <div className="extracts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                              {doc.extracts.map((e, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#fff', border: `1px solid ${doc.pb2}` }}>
                                  <Check size={12} color={doc.pc} style={{ flexShrink: 0, marginTop: 2 }} />
                                  <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{e}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.3}>
              <div style={{ marginTop: 14, padding: '13px 18px', borderRadius: 11, background: '#f0fdf4', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#15803d', fontWeight: 600, margin: 0 }}>
                  Vos documents sont supprimés immédiatement après traitement. Aucun stockage permanent — RGPD complet.
                </p>
              </div>
            </Reveal>
          </section>

          {/* ── 3. PRINCIPE SCORE /20 ─────────────────────────── */}
          <section id="principe">
            <Reveal>
              <SectionHead label="Le score /20" title="Bonne nouvelle : vous partez de 20/20 🏆" />
            </Reveal>

            <Reveal delay={0.05}>
              <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 26px', marginBottom: 20 }}>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: 0 }}>
                  Contrairement à votre prof de maths qui commençait à zéro,{' '}
                  <strong style={{ color: '#0f172a' }}>on part du principe que votre bien est parfait.</strong>{' '}
                  Puis on lit vos documents et on retire des points pour chaque risque détecté. 😅
                  <br /><br />
                  Les bons éléments ? On en ajoute aussi. Fair-play.
                </p>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { icon: '20', bg: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', title: 'Départ : 20/20', sub: 'Votre bien est parfait par défaut' },
                { icon: '−', bg: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', title: 'Points retirés', sub: 'Pour chaque risque détecté' },
                { icon: '+', bg: '#f0fdf4', color: '#16a34a', border: '1.5px solid #d1fae5', title: 'Points ajoutés', sub: 'Pour les bons éléments' },
              ].map((s, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <div style={{ background: '#fff', borderRadius: 13, border: '1px solid #edf2f7', padding: '18px 16px', textAlign: 'center' as const }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: s.bg, border: (s as any).border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: s.color, margin: '0 auto 12px' }}>
                      {s.icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.sub}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── 4. CATÉGORIES ─────────────────────────────────── */}
          <section id="categories">
            <Reveal>
              <SectionHead label="5 catégories" title="Ce qu'on analyse pour calculer le score" sub="Cliquez sur une catégorie pour voir le détail des points." />
            </Reveal>

            <Reveal delay={0.04}>
              <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 20 }}>
                {categories.map((c) => (
                  <div key={c.id} style={{ flex: c.pts, background: c.color, opacity: 0.7 }} title={`${c.label} — ${c.pts} pts`} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' as const }}>
                {categories.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: c.color }} /> {c.label} ({c.pts} pts)
                  </div>
                ))}
              </div>
            </Reveal>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
              {categories.map((cat, idx) => (
                <Reveal key={cat.id} delay={idx * 0.04}>
                  <div style={{ borderRadius: 13, border: `1.5px solid ${openCat === cat.id ? cat.color : '#edf2f7'}`, overflow: 'hidden', background: '#fff', transition: 'all 0.18s', boxShadow: openCat === cat.id ? `0 4px 18px ${cat.color}18` : 'none' }}>
                    <button onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '15px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.light, border: `1px solid ${cat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cat.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{cat.label}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>Sur {cat.pts} points</div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: cat.color, marginRight: 8 }}>{cat.pts} pts</span>
                      <ChevronDown size={15} color="#cbd5e1" style={{ flexShrink: 0, transform: openCat === cat.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    <AnimatePresence>
                      {openCat === cat.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                          <div style={{ borderTop: `1px solid ${cat.border}`, padding: '16px 20px', background: cat.light }}>
                            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>{cat.desc}</p>
                            <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div style={{ background: '#fff', borderRadius: 11, border: '1px solid #fecaca', padding: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                  <TrendingDown size={12} color="#dc2626" />
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Pénalités</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                                  {cat.bad.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                      <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{item.l}</span>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{item.v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ background: '#fff', borderRadius: 11, border: '1px solid #d1fae5', padding: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                  <TrendingUp size={12} color="#16a34a" />
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Bonus</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                                  {cat.good.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                      <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{item.l}</span>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{item.v}</span>
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

          {/* ── 5. EXEMPLE ────────────────────────────────────── */}
          <section id="exemple">
            <Reveal>
              <SectionHead label="Exemple concret" title="Un calcul réel, étape par étape" sub="Appartement — 12 rue des Lilas, Lyon 6e · Résidence principale" />
            </Reveal>

            <div style={{ border: '1.5px solid #edf2f7', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🏠</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>12 rue des Lilas — Appartement 4B, Lyon 6e</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>PV d'AG 2024 + DPE + Règlement copropriété analysés</div>
                </div>
              </div>
              <div>
                {[
                  { label: 'Point de départ', note: '', pts: '+20', color: '#0f172a', sub: false },
                  { label: 'Ravalement de façade évoqué non voté', note: 'Travaux — risque financier pour l\'acheteur', pts: '−2,5', color: '#dc2626', sub: true },
                  { label: 'Fonds travaux sous-provisionné', note: 'Finances — budget inférieur au minimum légal', pts: '−2', color: '#dc2626', sub: true },
                  { label: 'DPE classé C', note: 'Diagnostics privatifs — bonne performance', pts: '+0,5', color: '#16a34a', sub: true },
                  { label: 'Aucune procédure judiciaire', note: 'Procédures — situation juridique saine', pts: '±0', color: '#94a3b8', sub: true },
                ].map((row, i) => (
                  <Reveal key={i} delay={i * 0.05}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '13px 20px', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: row.sub ? 500 : 700, color: '#0f172a' }}>{row.label}</div>
                        {row.sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{row.note}</div>}
                      </div>
                      <span style={{ fontSize: row.sub ? 15 : 17, fontWeight: 900, color: row.color, flexShrink: 0 }}>{row.pts}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.3}>
                <div style={{ borderTop: '2px solid #edf2f7', padding: '16px 20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Score final</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Arrondi au 0,5 près</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                      <span style={{ fontSize: 38, fontWeight: 900, color: '#16a34a', letterSpacing: '-0.03em' }}>16</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#cbd5e1' }}>/20</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #d1fae5', padding: '5px 14px', borderRadius: 10 }}>Bien sain ✓</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── 6. ÉCHELLE ────────────────────────────────────── */}
          <section id="echelle">
            <Reveal>
              <SectionHead label="L'échelle des notes" title="5 niveaux, une recommandation claire" />
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {levels.map((level, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <div style={{ borderRadius: 13, border: `1.5px solid ${level.border}`, background: level.bg, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' as const }}>
                      <div style={{ minWidth: 75 }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: level.c }}>{level.r}</span>
                        <span style={{ fontSize: 11, color: level.c, opacity: 0.6 }}>/20</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: level.c, marginBottom: 2 }}>{level.l}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{level.desc}</div>
                      </div>
                    </div>
                    <ScoreBar pct={level.pct} color={level.bar} delay={i * 0.1 + 0.2} />
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.5}>
              <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 11, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: 10 }}>
                <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                  <strong>Astuce :</strong> si votre score est entre 0 et 13, Verimo génère automatiquement des pistes de négociation pour vous aider à revoir le prix à la baisse.
                </p>
              </div>
            </Reveal>
          </section>

          {/* ── 7. FAQ ────────────────────────────────────────── */}
          <section id="faq">
            <Reveal>
              <SectionHead label="Questions fréquentes" title="Ce qu'on nous demande souvent" />
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
              {faqs.map((faq, i) => (
                <Reveal key={i} delay={i * 0.04}>
                  <div style={{ borderRadius: 13, border: `1.5px solid ${openFaq === i ? '#2a7d9c' : '#edf2f7'}`, overflow: 'hidden', background: '#fff', transition: 'border-color 0.18s' }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '15px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>{faq.q}</span>
                      <ChevronDown size={15} color={openFaq === i ? '#2a7d9c' : '#cbd5e1'} style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                          <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.8, margin: 0, padding: '0 20px 16px', borderTop: '1px solid #f0f5f9' }}>{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── CTA ───────────────────────────────────────────── */}
          <Reveal>
            <div style={{ borderRadius: 18, background: 'linear-gradient(135deg,#f0f7fb,#e8f4fa)', border: '1.5px solid #bae3f5', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' as const }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 5 }}>Prêt à analyser votre bien ?</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>Score /20 + rapport complet en moins de 30 secondes*.</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 11, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(42,125,156,0.25)' }}>
                  Analyser mon bien <ArrowRight size={14} />
                </Link>
                <Link to="/exemple" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 11, background: '#fff', border: '1.5px solid #d1e9f5', color: '#0f172a', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Voir un exemple
                </Link>
              </div>
            </div>
          </Reveal>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          main > div { grid-template-columns: 1fr !important; padding: 0 16px !important; }
          main > div > aside { display: none !important; }
        }
        @media (max-width: 600px) {
          .analyse-grid { grid-template-columns: 1fr !important; }
          .cat-grid { grid-template-columns: 1fr !important; }
          .extracts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight, CheckCircle, AlertTriangle, FileText,
  Euro, Wrench, Gavel,
  Download, ChevronDown, Shield, Star, Info,
} from 'lucide-react';

/* ══════════════════════════════════════════
   DONNÉES DU RAPPORT EXEMPLE
══════════════════════════════════════════ */
const rapport = {
  adresse: '24 rue des Lilas, Appartement 4B — Lyon 6e',
  date: '3 avril 2026',
  type_bien: 'Appartement en copropriété',
  profil: 'Résidence principale',
  pages: 104,
  duree: '1 min 42s',
  score: 14.8,
  score_label: 'Bien sain',
  score_color: '#16a34a',

  resume: "Appartement situé dans une copropriété globalement bien gérée. Le PV d'AG 2024 révèle une gestion financière saine, un syndic réactif et une absence de procédure judiciaire. Deux points de vigilance sont à surveiller avant toute offre : un ravalement évoqué non voté et un fonds de travaux légèrement sous-provisionné.",

  avis_verimo: "Ce bien présente un bilan sain pour une résidence principale à Lyon 6e. La copropriété est bien tenue, les charges sont maîtrisées et aucun litige n'est en cours. Le seul risque identifié concerne un ravalement de façade évoqué en AG 2024 sans avoir été voté — si ce vote intervient après votre acquisition, vous en supporterez une partie. Nous vous recommandons d'en parler avec votre agent immobilier avant de formuler une offre. Ce rapport est établi à partir des documents fournis et ne remplace pas l'avis d'un professionnel de l'immobilier.",

  points_positifs: [
    'Fonds de travaux conforme au minimum légal (42 000€)',
    'Charges mensuelles maîtrisées pour Lyon 6e (180€/mois)',
    'DPE classé C — bonne valeur à la revente',
    'Aucune procédure judiciaire en cours',
    'Aucun impayé de charges détecté',
    'Syndic professionnel, AG tenues régulièrement',
  ],
  points_vigilance: [
    { t: 'Ravalement façade évoqué non voté (2026)', niveau: 'orange', detail: 'Un ravalement a été évoqué lors de l\'AG 2024 sans avoir été mis au vote. Si le vote intervient après votre acquisition, vous en supporterez une part estimée à ~2 400€.' },
    { t: 'Fonds travaux : 42 000€ (minimum légal)', niveau: 'info', detail: 'Le fonds est conforme au minimum légal de 5% du budget annuel, mais sans marge. Un événement imprévu pourrait nécessiter un appel de fonds exceptionnel.' },
    { t: '2 lots en situation d\'impayé (< 6 mois)', niveau: 'info', detail: 'Deux copropriétaires présentent des retards de paiement inférieurs à 6 mois. La situation est surveillée par le syndic mais reste à confirmer.' },
  ],

  categories: [
    { label: 'Travaux', note: 4, max: 5, color: '#f0a500', icon: '🏗️', detail: 'Ravalement évoqué non voté — pénalité partielle appliquée.' },
    { label: 'Procédures', note: 4, max: 4, color: '#16a34a', icon: '⚖️', detail: 'Aucune procédure judiciaire détectée dans les documents.' },
    { label: 'Finances', note: 3, max: 4, color: '#2a7d9c', icon: '💰', detail: 'Fonds travaux conforme au légal (+0,5). Deux lots en léger impayé (-1).' },
    { label: 'Diags privatifs', note: 3, max: 4, color: '#7c3aed', icon: '🏠', detail: 'DPE C (+0,5). Amiante : absence confirmée. Électricité conforme.' },
    { label: 'Diags communs', note: 0.8, max: 3, color: '#16a34a', icon: '🏢', detail: 'Immeuble bien entretenu (+0,5). Aucun amiante commun détecté.' },
  ],

  finances: {
    charges_mensuelles: 180,
    fonds_travaux: 42000,
    tresorerie: 23400,
    impayes: 4200,
    budget_previsionnel: 810000,
    budget_realise: 795000,
    ecart_pct: 1.9,
  },

  travaux: [
    { label: 'Réfection de la toiture', annee: '2021', montant: 35000, statut: 'Réalisé', statut_color: '#16a34a', detail: 'Facture et garantie décennale disponibles.' },
    { label: 'Mise aux normes électriques parties communes', annee: '2022', montant: 12000, statut: 'Réalisé', statut_color: '#16a34a', detail: 'Travaux réalisés et certifiés conformes.' },
    { label: 'Ascenseur — mise aux normes', annee: '2027', montant: 4500, statut: 'Voté — charge du vendeur', statut_color: '#2a7d9c', detail: 'Travaux votés avant votre acquisition. Le vendeur en supporte normalement les coûts via acte notarié.' },
    { label: 'Ravalement de façade principale', annee: '2026 (estimé)', montant: null, statut: 'Évoqué non voté', statut_color: '#f0a500', detail: 'Évoqué en AG 2024 mais non mis au vote. Si voté après votre acquisition, votre part est estimée à ~2 400€.' },
  ],

  documents: [
    { nom: "PV d'Assemblée Générale 2024", pages: 24, infos: ["Budget voté : 45 000€", "Fonds travaux : 42 000€", "Aucune procédure en cours", "Ravalement évoqué"] },
    { nom: "PV d'Assemblée Générale 2023", pages: 18, infos: ["Budget voté : 42 000€", "Réfection toiture finalisée", "Bilan financier positif"] },
    { nom: "Appel de charges T1 2024", pages: 6, infos: ["Charges : 180€/mois", "Aucun appel exceptionnel"] },
    { nom: "Règlement de copropriété", pages: 42, infos: ["Conforme loi ALUR", "Tantièmes à jour", "Règles d'usage claires"] },
    { nom: "Diagnostic DPE", pages: 8, infos: ["Classe C", "114 kWh/m²/an", "Émissions : 25 kg CO₂/m²/an"] },
    { nom: "Diagnostic amiante (DAPP)", pages: 6, infos: ["Absence d'amiante accessible", "Contrôle 2023 — valide"] },
  ],

  documents_manquants: ["Diagnostics parties communes", "Carnet d'entretien de l'immeuble"],

  negociation: {
    applicable: false,
    message: "Avec un score de 14,8/20, ce bien ne justifie pas de négociation agressive. Toutefois, le ravalement évoqué peut être un argument pour demander une légère baisse ou une clause de garantie dans l'acte de vente.",
  },
};

/* ══════════════════════════════════════════
   COMPOSANTS
══════════════════════════════════════════ */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (score / 20) * circ;
  return (
    <svg width="130" height="130" style={{ flexShrink: 0 }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
      <motion.circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeLinecap="round" transform="rotate(-90 65 65)"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
      <text x="65" y="58" textAnchor="middle" fontSize="26" fontWeight="900" fill={color}>{score}</text>
      <text x="65" y="77" textAnchor="middle" fontSize="12" fill="#94a3b8" fontWeight="600">/20</text>
    </svg>
  );
}

const tabs = [
  { id: 0, label: 'Synthèse', icon: Star },
  { id: 1, label: 'Finances', icon: Euro },
  { id: 2, label: 'Travaux', icon: Wrench },
  { id: 3, label: 'Procédures', icon: Gavel },
  { id: 4, label: 'Documents', icon: FileText },
];

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function ExemplePage() {
  const [active, setActive] = useState(0);
  const [openVigilance, setOpenVigilance] = useState<number | null>(null);

  return (
    <main style={{ background: '#f4f7f9', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 72 }}>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(150deg, #eef7fb, #e4f2f8 50%, #f8fafc)', padding: '52px 24px 44px', textAlign: 'center', borderBottom: '1px solid #e2edf3' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 12, fontWeight: 700, color: '#1a5e78', marginBottom: 18, letterSpacing: '0.06em' }}>
          RAPPORT EXEMPLE
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ fontSize: 'clamp(26px,4.5vw,52px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          Voici ce que Verimo{' '}
          <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#2a7d9c' }}>vous produit.</span>
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 4, background: 'rgba(42,125,156,0.25)', borderRadius: 99, transformOrigin: 'left', display: 'block' }} />
          </span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          style={{ fontSize: 16, color: '#6b8a96', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Rapport généré à partir d'un dossier réel (données anonymisées) — PV d'AG, règlement de copropriété, diagnostics et appels de charges.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 13, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 7px 24px rgba(42,125,156,0.28)' }}>
            Analyser mon bien <ArrowRight size={16} />
          </Link>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 13, background: '#fff', border: '1.5px solid #d1e9f5', color: '#0f2d3d', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Voir les tarifs
          </Link>
        </motion.div>
      </section>

      {/* ── RAPPORT ────────────────────────────────────────────── */}
      <section style={{ padding: '36px 20px 80px', maxWidth: 980, margin: '0 auto' }}>

        {/* En-tête rapport */}
        <Reveal>
          <div style={{ borderRadius: 20, background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', padding: '28px 32px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>RAPPORT VERIMO · EXEMPLE · {rapport.date}</div>
              <h2 style={{ fontSize: 'clamp(15px,2.5vw,20px)', fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{rapport.adresse}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: 6 }}>{rapport.type_bien}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: 6 }}>{rapport.profil}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: 6 }}>{rapport.pages} pages · {rapport.duree}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ScoreGauge score={rapport.score} color={rapport.score_color} />
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Score global</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: rapport.score_color, background: `${rapport.score_color}20`, border: `1px solid ${rapport.score_color}40`, padding: '6px 16px', borderRadius: 10 }}>
                  {rapport.score_label} ✓
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Download size={12} /> Télécharger PDF
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Barres par catégorie */}
        <Reveal delay={0.05}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }} className="cat-score-grid">
            {rapport.categories.map((cat, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 13, border: '1px solid #edf2f7', padding: '14px 12px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{cat.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: cat.color, marginBottom: 2 }}>{cat.note}<span style={{ fontSize: 11, fontWeight: 600, opacity: 0.6 }}>/{cat.max}</span></div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{cat.label}</div>
                <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.note / cat.max) * 100}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: '100%', background: cat.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Onglets */}
        <Reveal delay={0.08}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActive(tab.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: active === tab.id ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : '#fff', color: active === tab.id ? '#fff' : '#64748b', fontSize: 13, fontWeight: active === tab.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: active === tab.id ? '0 4px 14px rgba(42,125,156,0.25)' : '0 1px 3px rgba(0,0,0,0.06)', border: active === tab.id ? 'none' : '1px solid #edf2f7' }}>
                  <Icon size={14} style={{ flexShrink: 0 }} /> {tab.label}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Contenu onglets */}
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>

            {/* ── SYNTHÈSE ── */}
            {active === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Résumé */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Résumé</div>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, margin: 0 }}>{rapport.resume}</p>
                </div>

                {/* Points positifs + vigilance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="synthese-grid">
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d1fae5', padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <CheckCircle size={15} color="#16a34a" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Points positifs</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {rapport.points_positifs.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', flexShrink: 0, marginTop: 6 }} />
                          <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #fde68a', padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <AlertTriangle size={15} color="#d97706" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Points de vigilance</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {rapport.points_vigilance.map((p, i) => (
                        <div key={i}>
                          <button onClick={() => setOpenVigilance(openVigilance === i ? null : i)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 12px', borderRadius: 9, background: p.niveau === 'orange' ? '#fffbeb' : '#f8fafc', border: `1px solid ${p.niveau === 'orange' ? '#fde68a' : '#edf2f7'}`, cursor: 'pointer', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <span style={{ fontSize: 14 }}>{p.niveau === 'orange' ? '⚠️' : 'ℹ️'}</span>
                              <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{p.t}</span>
                            </div>
                            <ChevronDown size={13} color="#94a3b8" style={{ flexShrink: 0, transform: openVigilance === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                          </button>
                          <AnimatePresence>
                            {openVigilance === i && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.65, margin: 0, padding: '8px 12px 4px' }}>{p.detail}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Avis Verimo */}
                <div style={{ background: 'linear-gradient(135deg,#f0f7fb,#e8f4fa)', borderRadius: 16, border: '1.5px solid #bae3f5', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Shield size={15} color="#2a7d9c" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a5e78', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Avis Verimo</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#0f2d3d', lineHeight: 1.8, margin: 0 }}>{rapport.avis_verimo}</p>
                </div>

                {/* Négociation */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Info size={14} color="#64748b" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pistes de négociation</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{rapport.negociation.message}</p>
                </div>
              </div>
            )}

            {/* ── FINANCES ── */}
            {active === 1 && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>État financier de la copropriété</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 24 }} className="fin-grid">
                  {[
                    { l: 'Charges mensuelles', v: '180 €/mois', sub: 'Dans la moyenne pour Lyon 6e', color: '#16a34a', good: true },
                    { l: 'Fonds de travaux', v: '42 000 €', sub: 'Conforme au minimum légal (5%)', color: '#2a7d9c', good: true },
                    { l: 'Trésorerie disponible', v: '23 400 €', sub: 'Situation saine', color: '#16a34a', good: true },
                    { l: 'Impayés copropriétaires', v: '4 200 €', sub: '2 lots en léger retard (< 6 mois)', color: '#f0a500', good: false },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '18px', borderRadius: 13, background: '#f8fafc', border: `1px solid ${item.good ? '#e2e8f0' : '#fde68a'}` }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: item.color, marginBottom: 4 }}>{item.v}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>{item.l}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '14px 18px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>📊 Budget 2024 : écart de {rapport.finances.ecart_pct}%</div>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>
                    Budget prévisionnel : {rapport.finances.budget_previsionnel.toLocaleString('fr-FR')}€ · Budget réalisé : {rapport.finances.budget_realise.toLocaleString('fr-FR')}€ — L'écart est inférieur à 5%, ce qui reflète une gestion financière rigoureuse.
                  </p>
                </div>
              </div>
            )}

            {/* ── TRAVAUX ── */}
            {active === 2 && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Travaux identifiés dans les documents</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Réalisés, votés ou évoqués — tout ce qui impacte votre budget.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rapport.travaux.map((t, i) => (
                    <div key={i} style={{ padding: '16px 18px', borderRadius: 13, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{t.label}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.annee}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: t.statut_color, background: `${t.statut_color}15`, padding: '2px 9px', borderRadius: 6 }}>{t.statut}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: t.montant ? t.statut_color : '#94a3b8', flexShrink: 0 }}>
                          {t.montant ? `~${t.montant.toLocaleString('fr-FR')}€` : 'Non chiffré'}
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5, padding: '8px 10px', background: '#fff', borderRadius: 8, border: '1px solid #edf2f7' }}>{t.detail}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: '13px 16px', borderRadius: 11, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                  💡 Pour calculer précisément votre quote-part des travaux votés, ajoutez votre dernier appel de charges (qui contient vos tantièmes) dans les 7 jours suivant ce rapport.
                </div>
              </div>
            )}

            {/* ── PROCÉDURES ── */}
            {active === 3 && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Situation juridique de la copropriété</h3>
                <div style={{ padding: '20px 22px', borderRadius: 14, background: '#f0fdf4', border: '1.5px solid #d1fae5', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <CheckCircle size={28} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#15803d', marginBottom: 4 }}>Aucune procédure judiciaire détectée</div>
                    <div style={{ fontSize: 13, color: '#374151' }}>Aucun litige n'est mentionné dans les PV d'AG 2023 et 2024 analysés.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Règlement de copropriété', statut: 'Conforme loi ALUR', ok: true },
                    { label: 'Syndic professionnel', statut: 'En exercice', ok: true },
                    { label: 'Assemblées générales', statut: 'Tenues régulièrement', ok: true },
                    { label: 'Procédures contre le syndic', statut: 'Aucune détectée', ok: true },
                    { label: 'Procédures contre copropriétaires', statut: 'Aucune détectée', ok: true },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: item.ok ? '#16a34a' : '#dc2626', background: item.ok ? '#f0fdf4' : '#fef2f2', padding: '3px 10px', borderRadius: 6 }}>
                        {item.ok ? '✓' : '✗'} {item.statut}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DOCUMENTS ── */}
            {active === 4 && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Documents analysés</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>{rapport.pages} pages analysées en {rapport.duree}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {rapport.documents.map((doc, i) => (
                    <div key={i} style={{ borderRadius: 12, border: '1px solid #edf2f7', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#f8fafc' }}>
                        <FileText size={16} color="#2a7d9c" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{doc.nom}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{doc.pages} pages</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #d1fae5', padding: '2px 9px', borderRadius: 6 }}>Analysé ✓</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', flexWrap: 'wrap' }}>
                        {doc.infos.map((info, j) => (
                          <span key={j} style={{ fontSize: 11, color: '#64748b', background: '#fff', border: '1px solid #edf2f7', padding: '3px 9px', borderRadius: 6 }}>
                            {info}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {rapport.documents_manquants.length > 0 && (
                  <div style={{ padding: '14px 18px', borderRadius: 11, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Documents non fournis (non pénalisés)</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {rapport.documents_manquants.map((d, i) => (
                        <span key={i} style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: 6 }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* CTA final */}
        <Reveal>
          <div style={{ marginTop: 36, borderRadius: 20, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', padding: '36px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Prêt à analyser votre bien ?</div>
            <h3 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>Obtenez un rapport comme celui-ci.</h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 28, lineHeight: 1.65 }}>Uploadez vos documents et recevez votre score /20 avec rapport complet en moins de 2 minutes.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 13, background: '#fff', color: '#0f2d3d', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                Analyser mon bien <ArrowRight size={16} />
              </Link>
              <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 13, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                Voir les tarifs
              </Link>
            </div>
          </div>
        </Reveal>

      </section>

      <style>{`
        @media (max-width: 600px) {
          .cat-score-grid { grid-template-columns: repeat(3,1fr) !important; }
          .synthese-grid { grid-template-columns: 1fr !important; }
          .fin-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .cat-score-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </main>
  );
}

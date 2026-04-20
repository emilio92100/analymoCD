import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle, FileText, Shield, Lock, Info, Eye,
} from 'lucide-react';
import { buildRapportExemple, RapportViewExemple } from './RapportPage';
import DocumentRenderer from './dashboard/DocumentRenderer';

/* ═══════════════════════════════════════════════════════════════
   DONNÉES MOCKÉES — ANALYSE COMPLÈTE — Lyon 6e, 14,8/20
   Structure conforme au schéma attendu par buildRapport()
═══════════════════════════════════════════════════════════════ */
const MOCK_COMPLETE_PAYLOAD = {
  titre: '24 rue des Lilas, Lyon 6e — Appartement 4B',
  type_bien: 'appartement',
  annee_construction: '1978',
  score: 14.8,
  score_niveau: 'Bien sain',
  resume: "Appartement T3 de 62 m² situé dans une copropriété de 42 lots globalement bien gérée. Le PV d'AG 2024 révèle une gestion financière saine, un syndic stable depuis 2019 et aucune procédure judiciaire en cours. Deux points de vigilance à surveiller avant toute offre : un ravalement de façade évoqué mais non voté, et un fonds de travaux juste au seuil légal.",
  points_forts: [
    'Fonds de travaux conforme au minimum légal ALUR (5% du budget annuel)',
    'Charges mensuelles maîtrisées pour Lyon 6e (180€/mois tout compris)',
    'DPE classé C — bonne performance, pas de risque réglementaire à horizon 2034',
    'Aucune procédure judiciaire en cours, aucun contentieux actif',
    'Syndic professionnel stable sur 3 AGs consécutives (Cabinet Immo Lyon Gestion)',
    'Toiture refaite en 2021 sous garantie décennale (35 000€)',
    'Mise aux normes électriques des parties communes en 2022',
  ],
  points_vigilance: [
    "Ravalement de façade évoqué en AG 2024 sans avoir été voté — si voté après votre acquisition, votre quote-part est estimée à environ 2 400€",
    "Fonds de travaux au seuil minimum légal (42 000€), sans marge pour imprévu",
    "2 copropriétaires en impayés inférieurs à 6 mois — situation surveillée par le syndic",
  ],
  avis_verimo: "Ce bien présente un bilan sain pour une résidence principale à Lyon 6e. La copropriété est bien tenue, les charges sont maîtrisées et aucun litige n'est en cours. Le seul risque identifié concerne un ravalement de façade évoqué en AG 2024 sans avoir été voté — si ce vote intervient après votre acquisition, vous en supporterez une part.\n\nNous vous recommandons d'en parler avec votre agent immobilier avant de formuler une offre, et de demander l'ajout d'une clause dans le compromis prévoyant que les travaux votés après la signature restent à la charge du vendeur.\n\nCe rapport est établi uniquement à partir des documents analysés et ne remplace pas l'avis d'un professionnel de l'immobilier.",
  travaux: {
    realises: [
      { label: 'Réfection complète de la toiture', annee: '2021', montant_estime: 35000, justificatif: true },
      { label: 'Mise aux normes électriques parties communes', annee: '2022', montant_estime: 12000, justificatif: true },
    ],
    votes: [
      { label: 'Mise aux normes ascenseur (norme 2018)', annee: '2024', montant_estime: 4500, charge_vendeur: true },
    ],
    evoques: [
      { label: 'Ravalement de façade principale', annee: null, montant_estime: null, precision: 'Évoqué en AG 2024 mais non mis au vote. Coût global estimé entre 85 000 et 120 000€ selon premiers devis.' },
    ],
    estimation_totale: null,
  },
  finances: {
    budget_total_copro: 45000,
    charges_annuelles_lot: 2160,
    fonds_travaux: 42000,
    fonds_travaux_statut: 'conforme',
    impayes: 4200,
    type_chauffage: 'Collectif gaz',
    budgets_historique: [
      { annee: '2024', montant: 45000 },
      { annee: '2023', montant: 42000 },
      { annee: '2022', montant: 41000 },
    ],
  },
  procedures: [],
  diagnostics_resume: "Diagnostics privatifs complets et conformes. Le DPE classe le bien en C avec 114 kWh/m²/an — bonne performance. Aucune anomalie majeure sur l'électricité ou le gaz. Diagnostics communs : immeuble bien entretenu, pas d'amiante accessible dans les parties communes.",
  diagnostics: [
    { type: 'DPE', label: 'Diagnostic de Performance Énergétique', perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: 'Classe C · 114 kWh/m²/an · GES classe D · 25 kg CO₂/m²/an', presence: 'detectee', alerte: null },
    { type: 'ELECTRICITE', label: 'Diagnostic électrique', perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: 'Aucune anomalie majeure détectée', presence: 'detectee', alerte: null },
    { type: 'GAZ', label: 'Diagnostic gaz', perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: 'Installation conforme', presence: 'detectee', alerte: null },
    { type: 'AMIANTE', label: "Diagnostic Amiante Parties Privatives", perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: "Absence d'amiante accessible", presence: 'absence', alerte: null },
    { type: 'PLOMB', label: 'CREP plomb', perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: 'Présence de plomb sous seuil réglementaire', presence: 'detectee', alerte: null },
    { type: 'AMIANTE', label: 'DAPP parties communes', perimetre: 'parties_communes', localisation: 'Immeuble', resultat: "Absence d'amiante accessible dans les parties communes", presence: 'absence', alerte: null },
    { type: 'ERP', label: "État des Risques et Pollutions", perimetre: 'lot_privatif', localisation: 'Lyon 6e', resultat: "Zone de sismicité 2 (faible). Aucun autre risque majeur.", presence: 'detectee', alerte: null },
  ],
  documents_analyses: [
    { type: 'PV_AG', annee: '2024', nom: "PV Assemblée Générale 2024" },
    { type: 'PV_AG', annee: '2023', nom: "PV Assemblée Générale 2023" },
    { type: 'PV_AG', annee: '2022', nom: "PV Assemblée Générale 2022" },
    { type: 'REGLEMENT_COPRO', annee: null, nom: "Règlement de copropriété" },
    { type: 'APPEL_CHARGES', annee: '2024', nom: "Appel de charges T1 2024" },
    { type: 'DPE', annee: '2023', nom: "Diagnostic DPE" },
    { type: 'DIAGNOSTIC', annee: '2023', nom: "Dossier de Diagnostics Techniques" },
    { type: 'CARNET_ENTRETIEN', annee: '2024', nom: "Carnet d'entretien de l'immeuble" },
  ],
  documents_manquants: [
    'Pré-état daté',
    "Attestation de surface Carrez signée du vendeur",
  ],
  negociation: {
    applicable: true,
    elements: [
      { label: 'Ravalement de façade évoqué non voté', impact_estime: 2400, justification: "Si ce ravalement est voté en AG après votre acquisition, votre quote-part sera d'environ 2 400€. C'est un argument légitime pour négocier une clause dans le compromis." },
    ],
  },
  vie_copropriete: {
    syndic: {
      nom: 'Cabinet Immo Lyon Gestion',
      type: 'professionnel',
      gestionnaire: 'Marie Dupont',
      fin_mandat: 'Juin 2026',
      tensions_detectees: false,
      tensions_detail: null,
      statut: 'stable',
      sortant: null,
      entrant: null,
      annee_changement: null,
      nb_ags_analysees: 3,
      historique_changements: [],
    },
    nb_lots_total: 42,
    nb_lots_detail: { logements: 28, parkings: 10, caves: 4, commerces: 0 },
    nb_batiments: 1,
    participation_ag: [
      { annee: '2024', copropietaires_presents_representes: '28 sur 42', taux_tantiemes_pct: '67%', quorum_note: null, quitus: { soumis: true, approuve: true, detail: null } },
      { annee: '2023', copropietaires_presents_representes: '26 sur 42', taux_tantiemes_pct: '64%', quorum_note: null, quitus: { soumis: true, approuve: true, detail: null } },
      { annee: '2022', copropietaires_presents_representes: '30 sur 42', taux_tantiemes_pct: '71%', quorum_note: null, quitus: { soumis: true, approuve: true, detail: null } },
    ],
    tendance_participation: 'Stable',
    analyse_participation: "La participation oscille autour de 65-70% des tantièmes sur 3 ans. Bon indicateur d'implication des copropriétaires et de bonne gestion démocratique de la copropriété.",
    travaux_votes_non_realises: [],
    appels_fonds_exceptionnels: [],
    questions_diverses_notables: [
      "Demande d'amélioration de l'éclairage du parking — en cours d'étude",
      "Proposition d'installation de bornes de recharge électrique — renvoyée à l'AG 2025",
    ],
    dtg: { present: false, etat_general: null, budget_urgent_3ans: null, budget_total_10ans: null, travaux_prioritaires: [] },
    regles_copro: [
      { label: 'Location courte durée (Airbnb)', statut: 'sous_conditions', impact_rp: false, impact_invest: true },
      { label: 'Animaux domestiques', statut: 'autorise', impact_rp: true, impact_invest: false },
      { label: 'Chiens de catégorie 1 et 2', statut: 'interdit', impact_rp: true, impact_invest: false },
    ],
  },
  lot_achete: {
    quote_part_tantiemes: '312 / 10 000',
    parties_privatives: ['Cave n°12', 'Parking n°8'],
    impayes_detectes: null,
    fonds_travaux_alur: 3200,
    travaux_votes_charge_vendeur: [
      { label: 'Mise aux normes ascenseur', montant: 4500, annee: '2024' },
    ],
    restrictions_usage: [
      "Location courte durée (Airbnb) soumise à autorisation préalable de l'AG",
      'Chiens de catégorie 1 et 2 interdits',
    ],
    points_specifiques: [],
  },
  pre_etat_date: { present: false },
  categories: {
    travaux: { note: 2, note_max: 5 },
    procedures: { note: 4, note_max: 4 },
    finances: { note: 3.5, note_max: 4 },
    diags_privatifs: { note: 4, note_max: 4 },
    diags_communs: { note: 1.3, note_max: 3 },
  },
};

/* ═══════════════════════════════════════════════════════════════
   DONNÉES MOCKÉES — ANALYSE SIMPLE — PV d'AG 2024
═══════════════════════════════════════════════════════════════ */
const MOCK_PVAG_SIMPLE = {
  document_type: 'PV_AG',
  titre: "PV d'Assemblée Générale — Résidence Les Lilas, 22 rue Mozart, Lyon 2e",
  resume: "Assemblée Générale Ordinaire du 14 mai 2024 réunissant 28 copropriétaires sur 42 (67% des tantièmes représentés). Le syndic Cabinet Immo Lyon Gestion a été reconduit pour 3 ans. Le budget 2024-2025 a été voté à 45 000€. Deux résolutions importantes : mise aux normes de l'ascenseur approuvée (4 500€) et ravalement de façade évoqué mais renvoyé à l'AG 2025 pour devis complémentaires.",
  date_ag: '2024-05-14',
  lieu_ag: 'Lyon 2e — Cabinet Immo Lyon Gestion',
  type_ag: 'ordinaire',
  syndic: 'Cabinet Immo Lyon Gestion',
  syndic_gestionnaire: 'Marie Dupont',
  president_seance: 'Jean-Pierre Martin',
  nb_resolutions: 8,
  syndic_reconduit: true,
  syndic_statut: 'reconduit',
  syndic_sortant: null,
  syndic_entrant: null,
  syndic_fin_mandat: 'Juin 2027',
  quorum: { presents: 28, total: 42, tantiemes_pct: '67%' },
  budget_vote: { annee: '2024-2025', montant: 45000, fonds_travaux: 2250 },
  budget_precedent: { annee: '2023-2024', montant: 42000 },
  travaux_votes: [
    { label: 'Mise aux normes ascenseur (conformité 2018)', montant: 4500, echeance: 'Avant fin 2024' },
  ],
  travaux_evoques: [
    { label: 'Ravalement de façade principale', precision: "Plusieurs devis demandés entre 85 000 et 120 000€. Vote renvoyé à l'AG 2025.", concerne_lot_prive: false },
  ],
  questions_diverses: [
    "Demande d'amélioration de l'éclairage du parking — étude en cours",
    "Proposition d'installation de bornes de recharge électrique — renvoyée à l'AG 2025",
    "Rappel des règles d'usage des parties communes",
  ],
  procedures: [],
  points_forts: [
    'Syndic professionnel reconduit à la majorité (quitus approuvé)',
    "Quorum confortable à 67% des tantièmes — bonne participation",
    'Budget maîtrisé, en légère hausse par rapport à 2023-2024 (+7%)',
    'Aucune procédure judiciaire mentionnée',
    "Décisions claires avec échéances précises sur l'ascenseur",
  ],
  points_vigilance: [
    "Ravalement de façade évoqué sans vote — si adopté après votre acquisition, une quote-part sera à votre charge",
    "2 copropriétaires en retard de paiement (< 6 mois) — situation surveillée par le syndic",
    "Fonds travaux reconduit au minimum légal sans effort complémentaire",
  ],
  avis_verimo: "Ce procès-verbal reflète une assemblée saine, bien tenue, dans une copropriété sans litige. Le point principal à surveiller est le ravalement de façade évoqué mais non voté : si un vote intervient après votre acquisition, vous supporterez une part estimée à environ 2 400€ sur la base d'un devis à 120 000€.\n\nNous vous recommandons de demander l'accès au PV d'AG 2025 dès sa publication pour vérifier si le ravalement est finalement adopté. Ce document ne remplace pas l'analyse complète d'un dossier d'acquisition — les autres documents (règlement, diagnostics, état daté…) restent à examiner pour une décision éclairée.",
};

/* ═══════════════════════════════════════════════════════════════
   COMPOSANTS UI
═══════════════════════════════════════════════════════════════ */
function ToggleMode({ mode, onChange }: { mode: 'complete' | 'simple'; onChange: (m: 'complete' | 'simple') => void }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 14, padding: 6, display: 'flex', gap: 6, maxWidth: 640, margin: '0 auto 18px' }}>
      <button
        onClick={() => onChange('complete')}
        style={{
          flex: 1, padding: '14px 18px', borderRadius: 10, border: 'none',
          background: mode === 'complete' ? '#2a7d9c' : 'transparent',
          color: mode === 'complete' ? '#fff' : '#64748b',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        }}
      >
        <span>Analyse complète</span>
        <span style={{ fontSize: 11, fontWeight: 500, opacity: mode === 'complete' ? 0.85 : 0.7 }}>19,90€ · jusqu'à 15 documents</span>
      </button>
      <button
        onClick={() => onChange('simple')}
        style={{
          flex: 1, padding: '14px 18px', borderRadius: 10, border: 'none',
          background: mode === 'simple' ? '#2a7d9c' : 'transparent',
          color: mode === 'simple' ? '#fff' : '#64748b',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        }}
      >
        <span>Analyse simple</span>
        <span style={{ fontSize: 11, fontWeight: 500, opacity: mode === 'simple' ? 0.85 : 0.7 }}>4,90€ · 1 document</span>
      </button>
    </div>
  );
}

function BandeauAnonymisation() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, background: '#fff7ed',
      border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 18px',
      maxWidth: 1250, margin: '0 auto 14px', flexWrap: 'wrap',
    }}>
      <Shield size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#9a3412', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Données anonymisées
        </div>
        <div style={{ fontSize: 13, color: '#7c2d12', lineHeight: 1.55, marginTop: 2 }}>
          Cet exemple est construit à partir d'un dossier réel — toutes les données personnelles et identifiantes ont été remplacées.
        </div>
      </div>
    </div>
  );
}

function Comparatif() {
  const lignesSimple = [
    'Décryptage d\'un seul document',
    'Résumé clair + points de vigilance',
    'Avis Verimo sur ce document',
    'Pas de score /20 global',
    'Idéal pour comprendre un PV, un DPE, un compromis…',
  ];
  const lignesComplete = [
    'Jusqu\'à 15 documents analysés ensemble',
    'Score /20 sur 5 catégories',
    'Avis Verimo global et pistes de négociation',
    'Synthèse, Copropriété, Logement, Procédures, Documents',
    'Délai de 7 jours pour compléter votre dossier',
  ];

  return (
    <section style={{ maxWidth: 1100, margin: '48px auto 0', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Deux formules, une promesse
        </h2>
        <p style={{ fontSize: 14, color: '#6b8a96', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          Choisissez selon vos besoins : une analyse ciblée sur un document, ou un décryptage global de votre dossier.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
        <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: '#f1f5f9', marginBottom: 12 }}>
            <FileText size={12} /> Analyse simple
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f2d3d', marginBottom: 4 }}>4,90 €</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>par document</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lignesSimple.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <CheckCircle size={15} style={{ color: '#2a7d9c', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.55 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(160deg, #0f2d3d, #1e4a5e)', borderRadius: 16, padding: '22px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 100, background: '#f0a500', color: '#0f2d3d' }}>
            RECOMMANDÉ
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', marginBottom: 12 }}>
            <Eye size={12} /> Analyse complète
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>19,90 €</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>pour votre dossier entier</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lignesComplete.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <CheckCircle size={15} style={{ color: '#7dd3fc', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.55 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTAFinal() {
  return (
    <section style={{ maxWidth: 900, margin: '48px auto 72px', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(150deg, #eef7fb, #e4f2f8 50%, #f8fafc)', border: '1px solid #e2edf3', borderRadius: 20, padding: 'clamp(32px,5vw,48px) clamp(22px,4vw,40px)' }}>
        <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 10, letterSpacing: '-0.02em' }}>
          Prêt à analyser votre bien ?
        </h2>
        <p style={{ fontSize: 15, color: '#4a6a78', maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.65 }}>
          Uploadez vos documents et recevez un rapport clair en moins de 2 minutes.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/dashboard/nouvelle-analyse"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px', borderRadius: 12, background: '#2a7d9c', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}
          >
            Analyser mon bien <ArrowRight size={16} />
          </Link>
          <Link
            to="/tarifs"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px', borderRadius: 12, background: '#fff', border: '1px solid #cbd5e1', color: '#0f2d3d', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
          >
            Voir les tarifs
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function ExemplePage() {
  const [searchParams] = useSearchParams();
  const paramMode = searchParams.get('mode');
  const initial: 'complete' | 'simple' = paramMode === 'simple' ? 'simple' : 'complete';
  const [mode, setMode] = useState<'complete' | 'simple'>(initial);

  // Construire le rapport complet une seule fois (cache par useMemo)
  const rapportComplet = useMemo(() => {
    return buildRapportExemple(MOCK_COMPLETE_PAYLOAD as Record<string, unknown>, {
      id: 'exemple-lyon-6e',
      type: 'complete',
      profil: 'rp',
      created_at: '2026-04-03T10:00:00Z',
      document_names: [
        "PV Assemblée Générale 2024",
        "PV Assemblée Générale 2023",
        "PV Assemblée Générale 2022",
        "Règlement de copropriété",
        "Appel de charges T1 2024",
        "Diagnostic DPE",
        "Dossier de Diagnostics Techniques",
        "Carnet d'entretien de l'immeuble",
      ],
      regeneration_deadline: null,
      complement_date: null,
      complement_doc_names: null,
      is_preview: false,
    });
  }, []);

  const docSimpleResult = useMemo(() => ({
    ...MOCK_PVAG_SIMPLE,
    _profil: 'rp',
  }), []);

  return (
    <main style={{ background: '#f4f7f9', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 72, minHeight: '100vh' }}>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(150deg, #eef7fb, #e4f2f8 50%, #f8fafc)', padding: '52px 24px 40px', textAlign: 'center', borderBottom: '1px solid #e2edf3' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 12, fontWeight: 700, color: '#1a5e78', marginBottom: 18, letterSpacing: '0.06em' }}
        >
          RAPPORT EXEMPLE
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          style={{ fontSize: 'clamp(26px,4.5vw,52px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          Voici ce que Verimo{' '}
          <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#2a7d9c' }}>vous produit.</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 4, background: 'rgba(42,125,156,0.25)', borderRadius: 99, transformOrigin: 'left', display: 'block' }}
            />
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          style={{ fontSize: 16, color: '#6b8a96', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}
        >
          Un exemple de rapport réel, anonymisé. Choisissez le mode pour voir le rendu complet ou le décryptage d'un document seul.
        </motion.p>
      </section>

      {/* ── TOGGLE ─────────────────────────────────────────── */}
      <section style={{ padding: '28px 16px 0' }}>
        <ToggleMode mode={mode} onChange={setMode} />
      </section>

      {/* ── BANDEAU ANONYMISATION ──────────────────────────── */}
      <section style={{ padding: '0 16px' }}>
        <BandeauAnonymisation />
      </section>

      {/* ── APERÇU RAPPORT ─────────────────────────────────── */}
      <section style={{ padding: '0 16px 40px' }}>
        <div style={{ maxWidth: 1250, margin: '0 auto', background: '#fff', borderRadius: 18, border: '1px solid #e2edf3', padding: '14px 18px', position: 'relative' }}>
          {/* Mini-bandeau "Démo" */}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: '#f0f7fb', color: '#1a5e78', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', border: '1px solid #d0e5ef', zIndex: 2 }}>
            <Info size={10} /> DÉMO
          </div>

          {mode === 'complete' ? (
            <RapportViewExemple rapport={rapportComplet} defaultTab="synthese" />
          ) : (
            <div style={{ padding: '12px 0' }}>
              <DocumentRenderer result={docSimpleResult as unknown as Record<string, unknown>} />
            </div>
          )}
        </div>

        {/* Note explicative sous l'aperçu */}
        <div style={{ maxWidth: 900, margin: '18px auto 0', padding: '12px 20px', background: '#f0f7fb', border: '1px solid #d0e5ef', borderRadius: 12, fontSize: 13, color: '#1a5e78', lineHeight: 1.6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Lock size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            {mode === 'complete' ? (
              <>Cet exemple est identique à ce que vous recevrez pour votre propre bien. Vos documents sont analysés par IA puis <strong>supprimés automatiquement</strong> conformément au RGPD — seul le rapport JSON est conservé.</>
            ) : (
              <>L'analyse simple décrypte un seul document à la fois. Idéale pour comprendre un PV d'AG avant la signature, un DPE, ou un compromis. <strong>Pas de score /20</strong> — juste un décryptage clair.</>
            )}
          </div>
        </div>
      </section>

      {/* ── COMPARATIF ─────────────────────────────────────── */}
      <Comparatif />

      {/* ── CTA FINAL ──────────────────────────────────────── */}
      <CTAFinal />
    </main>
  );
}

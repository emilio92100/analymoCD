import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Lock, Home as HomeIcon, FileText, CheckCircle, X, Sparkles,
} from 'lucide-react';
import { buildRapportExemple, RapportViewExemple } from './RapportPage';
import DocumentRenderer from './dashboard/DocumentRenderer';
import { useSEO } from '../hooks/useSEO';

/* ═══════════════════════════════════════════════════════════════
   DONNÉES MOCKÉES — ANALYSE COMPLÈTE — Lyon 6e, 14,8/20
   Structure 100% conforme au schéma attendu par buildRapport()
═══════════════════════════════════════════════════════════════ */
const MOCK_COMPLETE_PAYLOAD = {
  titre: '24 rue des Lilas, Lyon 6e — Appartement 4B',
  type_bien: 'appartement',
  annee_construction: '1978',
  score: 14.8,
  score_niveau: 'Bien sain',
  resume: {
    le_bien: "Appartement T3 de 62 m² Carrez situé dans une copropriété lyonnaise. Le lot comprend l'appartement principal, une cave et un emplacement de parking. Charges annuelles estimées à 2 400 € pour le lot.",
    la_copropriete: "Copropriété de 42 lots répartis sur un bâtiment unique, construite en 1978. Syndic Cabinet Immo Lyon Gestion en place depuis 2019. Budget annuel voté à 45 000 € en AG 2024.",
    performance_energetique: "DPE classé C (175 kWh/m²/an), GES classé B. Chauffage collectif gaz. Menuiseries double vitrage sur l'ensemble du logement.",
    diagnostics_privatifs: "Diagnostic électrique : 3 anomalies non majeures relevées (prise sans terre salle de bain, tableau vétuste). Diagnostics amiante et plomb négatifs. Pas de CREP applicable (construction post-1949).",
    gouvernance_finances: "Fonds de travaux ALUR constitué à 42 000 €. Procédure d'impayés en cours contre un copropriétaire (lot 12, 8 400 €). DTG réalisé en 2024 identifiant 65 000 € de travaux prioritaires sur 3 ans. Aucun changement de syndic documenté depuis 2019.",
  },
  points_forts: [
    'Fonds de travaux conforme au minimum légal ALUR (5% du budget annuel)',
    'Charges mensuelles maîtrisées pour Lyon 6e (180€/mois tout compris)',
    'DPE classé C — bonne performance, pas de risque réglementaire à horizon 2034',
    'Syndic professionnel stable sur 3 AGs consécutives (Cabinet Immo Lyon Gestion)',
    'Toiture refaite en 2021 sous garantie décennale (35 000€)',
    'Mise aux normes électriques des parties communes réalisée en 2022',
  ],
  points_vigilance: [
    "Ravalement de façade évoqué en AG 2024 sans avoir été voté — quote-part estimée à ~2 400€ si voté après votre acquisition",
    "Diagnostic électrique privatif : 3 anomalies non majeures (prise sans terre salle de bain, tableau vétuste)",
    "Procédure d'impayés en cours contre un copropriétaire (lot 12) — impayés cumulés : 8 400€",
    "Fonds de travaux au seuil minimum légal (42 000€), sans marge pour imprévu",
    "DTG obligatoire pour les copros de +15 ans mentionne 65 000€ de travaux prioritaires sur 3 ans",
  ],
  avis_verimo: {
    verdict: "Dossier globalement sain avec quelques points à clarifier avant de formuler une offre.",
    verdict_highlight: "globalement sain",
    contexte: "Lyon 6e reste un secteur très recherché, porté par un marché stable et une forte demande locative. Cette copropriété de taille moyenne (42 lots) construite en 1978 présente un profil patrimonial rassurant, d'autant que le syndic est en place depuis 2019 sans tension documentée. La trajectoire énergétique (DPE C) ne soulève pas d'enjeu réglementaire immédiat au regard de la loi Climat.",
    demarches: [
      {
        titre: "Obtenir le PV d'AG 2025 dès sa publication",
        description: "Le ravalement évoqué en 2024 sera potentiellement voté lors de cette prochaine AG. Connaître l'issue du vote est déterminant pour anticiper une quote-part estimée à 2 000 à 3 000 € selon le devis retenu.",
      },
      {
        titre: "Faire expertiser les anomalies du diagnostic électrique",
        description: "Les 3 anomalies non majeures relevées (prise, tableau) peuvent être traitées par un électricien certifié. Une remise en conformité partielle de ce type représente généralement entre 800 et 2 500 € selon l'ampleur.",
      },
      {
        titre: "Questionner le syndic sur le calendrier du PPT",
        description: "Le DTG identifie 65 000 € de travaux prioritaires sur 3 ans. Le Plan Pluriannuel de Travaux qui en découle conditionne la charge financière sur 10 ans. Demander le planning prévisionnel et les modalités d'appel de fonds.",
      },
    ],
  },
  travaux: {
    realises: [
      { label: 'Réfection complète de la toiture', annee: '2021', montant_estime: 35000, justificatif: true },
      { label: 'Mise aux normes électriques parties communes', annee: '2022', montant_estime: 12000, justificatif: true },
    ],
    votes: [
      { label: 'Mise aux normes ascenseur (conformité norme 2018)', annee: '2024', montant_estime: 4500, charge_vendeur: true },
    ],
    evoques: [
      { label: 'Ravalement de façade principale', annee: null, montant_estime: null, precision: "Évoqué en AG 2024 mais non mis au vote. Coût global estimé entre 85 000 et 120 000€ selon premiers devis. Vote renvoyé à l'AG 2025." },
      { label: 'Remplacement chaudière collective gaz', annee: null, montant_estime: null, precision: 'DTG 2024 identifie le remplacement de la chaudière collective comme prioritaire sous 3 ans (budget estimé : 45 000€).' },
    ],
    estimation_totale: null,
  },
  finances: {
    budget_total_copro: 45000,
    charges_annuelles_lot: 2160,
    fonds_travaux: 12000,
    fonds_travaux_statut: 'conforme',
    impayes: 8400,
    type_chauffage: 'Collectif gaz',
    nombre_lots: 42,
    taxe_fonciere: 1180,
    budgets_historique: [
      { annee: '2022', budget_total: 41000, fonds_travaux: 2050 },
      { annee: '2023', budget_total: 42000, fonds_travaux: 2100 },
      { annee: '2024', budget_total: 45000, fonds_travaux: 2250 },
    ],
  },
  procedures: [
    { label: "Procédure d'impayés de charges", type: 'impayes', gravite: 'moderee', message: "Une procédure de recouvrement est en cours contre le copropriétaire du lot 12 pour des impayés cumulés de 8 400€. Le syndic a saisi un huissier et un plan d'apurement a été proposé. Situation suivie par la prochaine AG." },
  ],
  diagnostics_resume: "Diagnostics privatifs complets. Le DPE classe le bien en C (bonne performance). Le diagnostic électrique relève 3 anomalies non majeures sur le tableau et une prise de salle de bain. Les diagnostics communs sont satisfaisants : pas d'amiante accessible ni de plomb dans les parties communes.",
  diagnostics: [
    { type: 'DPE', label: 'Diagnostic de Performance Énergétique', perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: 'Classe C · 114 kWh/m²/an · GES classe D · 25 kg CO₂/m²/an', presence: 'detectee', alerte: null },
    { type: 'ELECTRICITE', label: 'Diagnostic électrique privatif', perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: '3 anomalies non majeures : prise salle de bain sans terre, tableau électrique vétuste, protection différentielle partielle', presence: 'detectee', alerte: '3 anomalies mineures à régulariser — non bloquantes pour la vente mais à budgéter (~600€)' },
    { type: 'GAZ', label: 'Diagnostic gaz privatif', perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: 'Installation conforme, aucune anomalie', presence: 'detectee', alerte: null },
    { type: 'AMIANTE', label: "Diagnostic Amiante Parties Privatives (DAPP)", perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: "Absence d'amiante accessible détectée", presence: 'absence', alerte: null },
    { type: 'PLOMB', label: "CREP (Constat de Risque d'Exposition au Plomb)", perimetre: 'lot_privatif', localisation: 'Logement 4B', resultat: 'Présence de plomb sous seuil réglementaire — peintures anciennes couche profonde, classe 1', presence: 'detectee', alerte: null },
    { type: 'AMIANTE', label: 'DAPP parties communes', perimetre: 'parties_communes', localisation: 'Immeuble', resultat: "Absence d'amiante accessible dans les parties communes", presence: 'absence', alerte: null },
    { type: 'ERP', label: "État des Risques et Pollutions", perimetre: 'lot_privatif', localisation: 'Lyon 6e', resultat: 'Zone de sismicité 2 (faible). Aucun autre risque majeur.', presence: 'detectee', alerte: null },
  ],
  documents_analyses: [
    { type: 'PV_AG', annee: '2024', nom: 'PV Assemblée Générale 2024' },
    { type: 'PV_AG', annee: '2023', nom: 'PV Assemblée Générale 2023' },
    { type: 'PV_AG', annee: '2022', nom: 'PV Assemblée Générale 2022' },
    { type: 'REGLEMENT_COPRO', annee: null, nom: 'Règlement de copropriété' },
    { type: 'APPEL_CHARGES', annee: '2024', nom: 'Appel de charges T1 2024' },
    { type: 'DPE', annee: '2023', nom: 'Diagnostic DPE' },
    { type: 'DIAGNOSTIC', annee: '2023', nom: 'Dossier de Diagnostics Techniques (DDT)' },
    { type: 'CARNET_ENTRETIEN', annee: '2024', nom: "Carnet d'entretien de l'immeuble" },
  ],
  documents_manquants: [
    'Pré-état daté',
    'Attestation de surface Carrez signée du vendeur',
    "Procès-verbal de l'AG 2025",
  ],
  negociation: {
    applicable: true,
    elements: [
      { label: 'Ravalement de façade évoqué non voté', impact_estime: 2400, justification: "Si ce ravalement est voté en AG après votre acquisition, votre quote-part sera d'environ 2 400€ sur la base d'un devis à 120 000€. Argument légitime pour demander une clause de prise en charge dans le compromis." },
      { label: 'DTG — travaux prioritaires sous 3 ans', impact_estime: 1800, justification: "Le DTG 2024 chiffre 65 000€ de travaux prioritaires à voter. Votre quote-part estimée serait d'environ 1 800€ (sur la base de vos 312/10 000 tantièmes)." },
      { label: 'Anomalies électriques privatives à régulariser', impact_estime: 600, justification: "Le diagnostic électrique relève 3 anomalies mineures (prise SDB sans terre, tableau vétuste). Coût estimé de mise en conformité : ~600€." },
    ],
  },
  vie_copropriete: {
    syndic: {
      nom: 'Cabinet Immo Lyon Gestion',
      type: 'professionnel',
      gestionnaire: 'Marie Dupont',
      gestionnaire_fonction: 'Gestionnaire de copropriété',
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
    analyse_participation: "La participation oscille autour de 65-70% des tantièmes sur 3 ans. Bon indicateur d'implication des copropriétaires et de gestion démocratique saine de la copropriété.",
    travaux_votes_non_realises: [],
    appels_fonds_exceptionnels: [],
    questions_diverses_notables: [
      "Demande d'amélioration de l'éclairage du parking — en cours d'étude",
      "Proposition d'installation de bornes de recharge électrique — renvoyée à l'AG 2025 pour devis",
    ],
    dtg: {
      present: true,
      etat_general: 'moyen',
      budget_urgent_3ans: 65000,
      budget_total_10ans: 180000,
      travaux_prioritaires: [
        'Remplacement chaudière collective gaz (45 000€)',
        "Réfection étanchéité toiture-terrasse (12 000€)",
        "Mise en sécurité cage d'escalier (8 000€)",
      ],
    },
    regles_copro: [
      { label: 'Location courte durée (Airbnb)', statut: 'sous_conditions', impact_rp: false, impact_invest: true },
      { label: 'Animaux domestiques de compagnie', statut: 'autorise', impact_rp: true, impact_invest: false },
      { label: 'Chiens de catégorie 1 et 2', statut: 'interdit', impact_rp: true, impact_invest: false },
      { label: 'Travaux modifiant la façade ou les menuiseries', statut: 'sous_conditions', impact_rp: true, impact_invest: true },
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
      "Toute modification visible depuis l'extérieur soumise à autorisation",
    ],
    points_specifiques: [],
  },
  pre_etat_date: { present: false },
  categories: {
    travaux: { note: 2.5, note_max: 5 },
    procedures: { note: 2.5, note_max: 4 },
    finances: { note: 3, note_max: 4 },
    diags_privatifs: { note: 3, note_max: 4 },
    diags_communs: { note: 2, note_max: 3 },
  },
};

/* ═══════════════════════════════════════════════════════════════
   DONNÉES MOCKÉES — ANALYSE SIMPLE — PV d'AG 2024
═══════════════════════════════════════════════════════════════ */
const MOCK_PVAG_SIMPLE = {
  document_type: 'PV_AG',
  titre: "PV d'Assemblée Générale — Résidence Les Lilas, 22 rue Mozart, Lyon 2e",
  resume: "Assemblée Générale Ordinaire du 14 mai 2024 réunissant 28 copropriétaires sur 42 (67% des tantièmes représentés). Le syndic Cabinet Immo Lyon Gestion a été reconduit pour 3 ans. Budget 2024-2025 voté à 45 000€. Deux résolutions importantes : mise aux normes de l'ascenseur approuvée (4 500€) et ravalement de façade évoqué mais renvoyé à l'AG 2025 pour devis complémentaires. Une procédure d'impayés contre le lot 12 est en cours.",
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
  procedures: [
    { label: 'Procédure contre le copropriétaire du lot 12', detail: "Impayés cumulés de 8 400€. Le syndic a saisi un huissier, un plan d'apurement a été proposé." },
  ],
  points_forts: [
    'Syndic professionnel reconduit à la majorité avec quitus approuvé',
    "Quorum confortable à 67% des tantièmes — bonne participation",
    'Budget maîtrisé, en légère hausse par rapport à 2023-2024 (+7%)',
    "Décisions claires avec échéances précises sur l'ascenseur",
    "Situation des impayés identifiée et traitée activement par le syndic",
  ],
  points_vigilance: [
    "Ravalement de façade évoqué sans vote — si adopté après votre acquisition, une quote-part sera à votre charge",
    "Procédure d'impayés contre le lot 12 pour 8 400€ — pèse sur la trésorerie de la copropriété",
    "Fonds travaux reconduit au minimum légal sans effort complémentaire",
  ],
  avis_verimo: "Ce procès-verbal reflète une assemblée bien tenue, dans une copropriété sans litige majeur mais pas sans points d'attention. Deux éléments méritent votre vigilance : le ravalement de façade évoqué mais non voté (si adopté après votre acquisition, votre quote-part sera d'environ 2 400€ sur la base d'un devis à 120 000€), et la procédure d'impayés contre le lot 12 qui immobilise 8 400€ de trésorerie.\n\nNous vous recommandons de demander l'accès au PV d'AG 2025 dès sa publication pour vérifier si le ravalement est finalement adopté, et de questionner le syndic sur l'avancement de la procédure contre le lot 12.\n\nCe document ne remplace pas l'analyse complète d'un dossier d'acquisition — les autres documents (règlement, diagnostics, état daté…) restent à examiner pour une décision éclairée.",
};

/* ═══════════════════════════════════════════════════════════════
   TOGGLE PILL SEGMENTÉ — Option A
═══════════════════════════════════════════════════════════════ */
function SegmentedToggle({ mode, onChange }: { mode: 'complete' | 'simple'; onChange: (m: 'complete' | 'simple') => void }) {
  // Ordre : simple en premier, complète en second (par défaut)
  const options = [
    { id: 'simple' as const, icon: FileText, label: 'Analyse simple', price: '4,90 € · un document' },
    { id: 'complete' as const, icon: HomeIcon, label: 'Analyse complète', price: '19,90 € · dossier complet' },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        className="seg-toggle"
        style={{
          background: '#f1f5f9',
          borderRadius: 999,
          padding: 8,
          display: 'inline-flex',
          gap: 6,
          position: 'relative',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15,45,61,0.04), 0 4px 12px rgba(15,45,61,0.03)',
        }}
      >
        {options.map((opt) => {
          const active = mode === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`seg-toggle-btn${active ? ' seg-toggle-btn-active' : ''}`}
              style={{
                padding: '18px 36px',
                borderRadius: 999,
                border: 'none',
                background: 'transparent',
                color: active ? '#fff' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                minWidth: 260,
                position: 'relative',
                zIndex: 1,
                transition: 'color 0.3s ease',
              }}
            >
              {/* Pill bleue animée — un seul élément partagé entre les 2 boutons (desktop uniquement) */}
              {active && (
                <motion.span
                  layoutId="seg-toggle-pill"
                  className="seg-toggle-pill-anim"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 999,
                    background: '#2a7d9c',
                    boxShadow: '0 6px 20px rgba(42,125,156,0.35)',
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}

              {/* Carré icône (couleur adaptative) */}
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: active ? 'rgba(255,255,255,0.18)' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.3s ease',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Icon size={22} color={active ? '#fff' : '#64748b'} strokeWidth={2.2} />
              </div>

              {/* Texte */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.25, position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>{opt.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, opacity: active ? 0.92 : 0.75, marginTop: 3 }}>{opt.price}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   CTA FINAL — pleine largeur, immersif
═══════════════════════════════════════════════════════════════ */
function CTAFinal() {
  return (
    <section style={{ padding: '56px 16px 72px', maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #0f2d3d 0%, #1e4a5e 55%, #2a7d9c 100%)',
          borderRadius: 24,
          padding: 'clamp(40px,6vw,72px) clamp(24px,5vw,64px)',
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(125,211,252,0.15), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(42,125,156,0.3), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: 100,
              background: 'rgba(125,211,252,0.15)',
              border: '1px solid rgba(125,211,252,0.3)',
              fontSize: 11,
              fontWeight: 800,
              color: '#7dd3fc',
              letterSpacing: '0.1em',
              marginBottom: 22,
              textTransform: 'uppercase',
            }}
          >
            Lancez votre analyse
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px,4.5vw,48px)',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              marginBottom: 18,
            }}
          >
            Prêt à analyser{' '}
            <span style={{ color: '#7dd3fc' }}>votre bien ?</span>
          </h2>
          <p
            style={{
              fontSize: 'clamp(15px,2vw,18px)',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.65,
              marginBottom: 34,
              maxWidth: 580,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Uploadez vos documents et recevez un rapport clair en moins de 30 secondes<span style={{ color: '#7dd3fc' }}>*</span>.
            Vos données sont supprimées automatiquement après analyse.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/dashboard/nouvelle-analyse"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 32px',
                borderRadius: 14,
                background: '#fff',
                color: '#0f2d3d',
                fontSize: 16,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Analyser mon bien <ArrowRight size={18} />
            </Link>
            <Link
              to="/tarifs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 32px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              Voir les tarifs
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            {[
              'Résultat en 30 secondes*',
              'RGPD — documents supprimés',
              'Sans abonnement',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                <CheckCircle size={14} style={{ color: '#7dd3fc' }} />
                <span>{t}</span>
              </div>
            ))}
          </div>
          {/* Mention astérisque */}
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 20, lineHeight: 1.5 }}>
            * Pour les documents nativement numériques (PDF texte). Les documents scannés peuvent nécessiter un délai supplémentaire.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   POPUP DÉMO — fonction non disponible en version exemple
═══════════════════════════════════════════════════════════════ */
function DemoPopup({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 45, 61, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 'clamp(28px,4vw,40px) clamp(24px,4vw,40px)',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(15,45,61,0.25)',
          position: 'relative',
        }}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#f1f5f9',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
          aria-label="Fermer"
        >
          <X size={18} color="#64748b" />
        </button>

        {/* Icône hero */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #2a7d9c 0%, #1a5e78 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(42,125,156,0.35)',
          }}
        >
          <Sparkles size={36} color="#fff" strokeWidth={2} />
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 100,
            background: 'rgba(42,125,156,0.08)',
            border: '1px solid rgba(42,125,156,0.18)',
            fontSize: 11,
            fontWeight: 800,
            color: '#1a5e78',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Version démo
        </div>

        {/* Titre */}
        <h3
          style={{
            fontSize: 'clamp(20px,3vw,24px)',
            fontWeight: 900,
            color: '#0f2d3d',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Compléter mon dossier
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: 15,
            color: '#475569',
            lineHeight: 1.65,
            margin: '0 0 24px',
          }}
        >
          Cette fonctionnalité n'est pas disponible dans la version démo.
          Elle vous permet d'ajouter jusqu'à 5 documents supplémentaires dans les 7 jours suivant votre analyse — sans surcoût.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/dashboard/nouvelle-analyse"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: 12,
              background: '#2a7d9c',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(42,125,156,0.28)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Lancer ma vraie analyse <ArrowRight size={15} />
          </Link>
          <button
            onClick={onClose}
            style={{
              padding: '12px 22px',
              borderRadius: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
          >
            Continuer à explorer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function ExemplePage() {
  useSEO({
    title: 'Exemple de rapport Verimo — Appartement Lyon 6e analysé',
    description: "Découvrez un exemple concret de rapport Verimo : score /20, travaux détectés, santé financière de la copropriété et pistes de négociation sur un appartement réel.",
    canonical: '/exemple',
  });

  const [searchParams] = useSearchParams();
  const paramMode = searchParams.get('mode');
  const initial: 'complete' | 'simple' = paramMode === 'complete' ? 'complete' : 'simple';
  const [mode, setMode] = useState<'complete' | 'simple'>(initial);
  const [showDemoPopup, setShowDemoPopup] = useState(false);

  const rapportComplet = useMemo(() => {
    return buildRapportExemple(MOCK_COMPLETE_PAYLOAD as Record<string, unknown>, {
      id: 'exemple-lyon-6e',
      type: 'complete',
      profil: 'rp',
      created_at: '2026-04-03T10:00:00Z',
      document_names: [
        'PV Assemblée Générale 2024',
        'PV Assemblée Générale 2023',
        'PV Assemblée Générale 2022',
        'Règlement de copropriété',
        'Appel de charges T1 2024',
        'Diagnostic DPE',
        'Dossier de Diagnostics Techniques',
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

  const renderContenu = () => {
    if (mode === 'complete') {
      return <RapportViewExemple rapport={rapportComplet} defaultTab="synthese" onComplement={() => setShowDemoPopup(true)} />;
    }
    return <DocumentRenderer result={docSimpleResult as unknown as Record<string, unknown>} />;
  };

  return (
    <main style={{ background: '#f4f7f9', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 72, minHeight: '100vh' }}>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(150deg, #eef7fb, #e4f2f8 50%, #f8fafc)', padding: '64px 24px 48px', textAlign: 'center', borderBottom: '1px solid #e2edf3' }}>
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
          style={{ fontSize: 16, color: '#6b8a96', maxWidth: 920, margin: '0 auto 12px', lineHeight: 1.7 }}
        >
          Un exemple de rapport réel. Choisissez le mode pour voir le rendu complet ou le décryptage d'un document seul.
        </motion.p>
        {/* Ligne "Données anonymisées" — plus visible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#1a5e78',
            padding: '8px 18px',
            borderRadius: 100,
            background: 'rgba(42,125,156,0.08)',
            border: '1px solid rgba(42,125,156,0.18)',
          }}
        >
          <Lock size={14} />
          <span>Données anonymisées issues d'un dossier réel</span>
        </motion.div>
      </section>

      {/* TOGGLE */}
      <section style={{ padding: '44px 16px 32px' }}>
        <SegmentedToggle mode={mode} onChange={setMode} />
      </section>

      {/* APERÇU — ombre douce, pas de cadre laptop */}
      <section className="exemple-rapport-wrap" style={{ padding: '0 16px 8px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="exemple-rapport-card"
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(15,45,61,0.08), 0 1px 3px rgba(15,45,61,0.04)',
              background: '#fff',
              padding: 'clamp(10px,2vw,20px)',
              overflow: 'hidden',
            }}
          >
            {renderContenu()}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* CTA FINAL */}
      <CTAFinal />

      {/* POPUP DÉMO — fonctionnalité non disponible */}
      <AnimatePresence>
        {showDemoPopup && <DemoPopup onClose={() => setShowDemoPopup(false)} />}
      </AnimatePresence>
    </main>
  );
}

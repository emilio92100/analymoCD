import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, ChevronDown, TrendingDown, TrendingUp, AlertTriangle, Shield, Check, Info } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { VerimoConfetti, VERIMO_CONFETTI_COLORS } from '../components/VerimoConfetti';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isLowPerf = () => isIOS() || (typeof window !== 'undefined' && window.innerWidth <= 768);

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */

const docTypes = [
  {
    id: 'pvag',
    emoji: '📋',
    label: "PV d'Assemblée Générale (3 derniers)",
    what: "Le compte-rendu officiel des réunions annuelles des copropriétaires. C'est le document le plus riche — il contient toutes les décisions votées, le budget, les travaux approuvés et les procédures en cours. Fournir les 3 derniers PV permet de détecter les tendances sur plusieurs années.",
    extracts: [
      'Travaux votés ou évoqués (ravalement, toiture, ascenseur…)',
      'Budget annuel de la copropriété et écarts constatés',
      'Procédures judiciaires en cours',
      'État des impayés de charges',
      'Fonds de travaux disponible et évolution',
      'Participation des copropriétaires et quitus syndic',
    ],
    priority: 'Indispensable',
    pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5',
  },
  {
    id: 'ddt',
    emoji: '⚡',
    label: 'Dossier de Diagnostic Technique (DDT)',
    what: "L'ensemble des diagnostics obligatoires du logement : DPE, électricité, gaz, amiante, plomb, termites, ERP… Chacun analyse un risque spécifique. Le DDT complet est exigé pour toute vente — un dossier sans anomalie renforce votre score.",
    extracts: [
      'Classe énergétique DPE (A à G) et consommation kWh/an',
      'Conformité de l\'installation électrique',
      'État de l\'installation gaz',
      'Présence ou absence d\'amiante accessible',
      'Risques naturels et technologiques (ERP)',
      'Surface loi Carrez certifiée',
    ],
    priority: 'Indispensable',
    pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5',
  },
  {
    id: 'charges',
    emoji: '💸',
    label: 'Appels de charges',
    what: "Document envoyé par le syndic réclamant votre participation aux dépenses communes. Il reflète les charges réelles mensuelles ou trimestrielles du logement et permet de vérifier l'historique financier.",
    extracts: [
      'Montant exact des charges courantes annuelles',
      'Répartition par poste (gardien, entretien, eau…)',
      'Appels exceptionnels liés à des travaux imprévus',
      'Évolution des charges sur plusieurs exercices',
    ],
    priority: 'Indispensable',
    pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5',
  },
  {
    id: 'reglement',
    emoji: '📑',
    label: 'Règlement de copropriété (RCP)',
    what: "Le document juridique qui définit les règles de vie dans l'immeuble, les parties communes, les restrictions d'usage et la répartition des charges. Indispensable pour connaître les tantièmes, les restrictions d'usage et les règles de modification.",
    extracts: [
      'Répartition des charges par lot (tantièmes)',
      "Restrictions d'usage (animaux, location, Airbnb, travaux…)",
      'Définition des parties communes et privatives',
      'Règles applicables aux modifications du règlement',
    ],
    priority: 'Indispensable',
    pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5',
  },
  {
    id: 'pre-etat',
    emoji: '📄',
    label: 'Pré-état daté / État daté',
    what: "Document établi par le syndic avant la vente. Il récapitule la situation financière exacte du vendeur vis-à-vis de la copropriété : impayés, fonds de travaux ALUR à rembourser, charges futures et historique N-1/N-2. Très utile pour évaluer les sommes réelles à débourser.",
    extracts: [
      'Impayés du vendeur envers la copropriété',
      'Fonds travaux ALUR attaché au lot (à rembourser au vendeur)',
      'Charges futures trimestrielles à prévoir',
      'Historique des charges réelles N-1 et N-2',
      'Travaux votés à la charge du vendeur',
      'Dette fournisseurs et santé financière de la copro',
    ],
    priority: 'Complémentaire',
    pc: '#2a7d9c', pb: '#f0f7fb', pb2: '#bae3f5',
  },
  {
    id: 'dtg',
    emoji: '🏗️',
    label: 'DTG / Plan Pluriannuel de Travaux (PPT)',
    what: "Le Diagnostic Technique Global évalue l'état général de l'immeuble et planifie les travaux sur 10 ans. Obligatoire dans les copropriétés de plus de 10 ans, il permet d'anticiper les grosses dépenses futures.",
    extracts: [
      'État général de l\'immeuble (bon / moyen / mauvais)',
      'Budget travaux urgents à 3 ans',
      'Budget travaux total estimé sur 10 ans',
      'Travaux prioritaires identifiés',
    ],
    priority: 'Complémentaire',
    pc: '#2a7d9c', pb: '#f0f7fb', pb2: '#bae3f5',
  },
  {
    id: 'taxe',
    emoji: '🏛️',
    label: 'Taxe foncière',
    what: "L'avis de taxe foncière permet de connaître le montant exact de l'impôt local annuel dû par le propriétaire. Cette charge annuelle peut représenter plusieurs mois de loyer et est souvent sous-estimée par les acheteurs.",
    extracts: [
      'Montant exact de la taxe foncière annuelle',
      'Calcul du coût mensuel réel du bien',
      'Comparaison avec les charges de copropriété',
    ],
    priority: 'Complémentaire',
    pc: '#2a7d9c', pb: '#f0f7fb', pb2: '#bae3f5',
  },
  {
    id: 'compromis',
    emoji: '🤝',
    label: 'Compromis / Promesse de vente',
    what: "Le compromis de vente permet à Verimo d'extraire les informations clés de la transaction : prix, intervenants, dates, conditions suspensives et clauses particulières. Utile pour vérifier la cohérence avec les documents de copropriété.",
    extracts: [
      'Prix net vendeur et honoraires d\'agence',
      'Conditions suspensives (prêt, purge, diagnostics…)',
      'Dates clés (signature, acte authentique)',
      'Clauses particulières importantes',
    ],
    priority: 'Recommandé',
    pc: '#7c3aed', pb: '#f5f3ff', pb2: '#ddd6fe',
  },
  {
    id: 'carnet',
    emoji: '📒',
    label: 'Carnet d\'entretien',
    what: "Tenu par le syndic, le carnet d'entretien retrace l'historique des travaux réalisés, les contrats d'entretien en cours et les garanties décennales actives. Il permet de vérifier que l'immeuble a été correctement entretenu.",
    extracts: [
      'Historique des travaux réalisés avec dates',
      'Contrats d\'entretien en cours (ascenseur, chaudière…)',
      'Garanties décennales encore actives',
    ],
    priority: 'Recommandé',
    pc: '#7c3aed', pb: '#f5f3ff', pb2: '#ddd6fe',
  },
];

const categories = [
  {
    id: 'travaux', emoji: '🏗️', label: 'Travaux', pts: 5,
    color: '#f0a500', light: '#fffbeb', border: '#fde68a',
    desc: "Les travaux sont le premier risque financier. On détecte tout ce qui est évoqué ou voté dans vos PV d'AG, en distinguant les travaux lourds des travaux légers.",
    bad: [
      { l: 'Travaux lourds évoqués non votés', v: '-3', tip: 'Toiture, ravalement, chaudière collective, ascenseur, structure — évoqués en AG mais pas encore votés ni budgétés. Risque d\'appel de fonds important à prévoir.' },
      { l: 'Travaux légers évoqués non votés', v: '-1', tip: 'Peinture parties communes, interphones, petit entretien — évoqués sans vote. Impact financier limité.' },
    ],
    good: [
      { l: 'Travaux votés à charge du vendeur (petits/moyens)', v: '+2', tip: 'Des travaux ont été votés et seront payés par le vendeur avant la vente. L\'acheteur en bénéficie sans les financer.' },
      { l: 'Gros travaux votés à charge du vendeur', v: '+3', tip: 'Chaudière, ravalement, toiture — travaux lourds déjà votés et financés par le vendeur. Signal très positif.' },
      { l: 'Garantie décennale récente sur travaux', v: '+2', tip: 'Les travaux réalisés sont couverts par une garantie décennale en cours de validité — protection contre les malfaçons pendant 10 ans.' },
    ],
  },
  {
    id: 'procedures', emoji: '⚖️', label: 'Procédures juridiques', pts: 4,
    color: '#dc2626', light: '#fef2f2', border: '#fecaca',
    desc: "Un litige peut bloquer la vente ou engager des frais imprévus importants. On distingue les procédures selon leur gravité.",
    bad: [
      { l: 'Procédure significative', v: '-3', tip: 'Litige bloquant, administration provisoire, détournement syndic, impayés massifs — peut impacter la vente ou générer des coûts imprévus importants.' },
      { l: 'Procédure mineure', v: '-1,5', tip: 'Petit litige isolé, mise en demeure sans suite judiciaire, un seul copropriétaire en impayé — impact limité, situation généralement en cours de résolution.' },
      { l: 'Tensions avec syndic documentées', v: '-0,5', tip: 'Quitus refusé accompagné d\'un changement de syndic conflictuel — signe de tension dans la gouvernance de la copropriété.' },
    ],
    good: [
      { l: 'Aucune procédure détectée', v: '+1', tip: 'Aucun litige en cours dans les documents analysés — situation juridique saine.' },
    ],
  },
  {
    id: 'finances', emoji: '💰', label: 'Finances copropriété', pts: 4,
    color: '#2a7d9c', light: '#f0f7fb', border: '#bae3f5',
    desc: "La santé financière conditionne vos charges futures. Un fonds de travaux insuffisant peut coûter très cher en cas de travaux imprévus.",
    bad: [
      { l: 'Fonds travaux nul ou absent', v: '-1', tip: 'Aucun fonds de travaux provisionné — en cas de travaux importants, des appels de fonds exceptionnels seront inévitables.' },
      { l: 'Fonds travaux insuffisant (< 5%)', v: '-0,5', tip: 'Le fonds de travaux est en dessous du minimum légal de 5% imposé par la loi ALUR — la copropriété n\'anticipe pas suffisamment.' },
      { l: 'Impayés anormaux (> 15% du budget)', v: '-1', tip: 'Le niveau d\'impayés de charges dépasse 15% du budget annuel de la copropriété — signal de fragilité financière collective.' },
    ],
    good: [
      { l: 'Fonds travaux conforme au légal (5%)', v: '+0,5', tip: 'Le fonds de travaux respecte le minimum légal imposé par la loi ALUR — copropriété à jour de ses obligations.' },
      { l: 'Fonds travaux bien provisionné (6–9%)', v: '+1', tip: 'Le fonds de travaux dépasse le minimum légal — bonne anticipation des dépenses futures.' },
      { l: 'Fonds travaux excellent (≥ 10%)', v: '+1,5', tip: 'Fonds de travaux très bien provisionné — la copropriété est en excellente santé financière pour faire face aux travaux.' },
      { l: 'Vendeur à jour de ses charges', v: '+0,5', tip: 'Le pré-état daté ou l\'état daté confirme que le vendeur n\'a aucun impayé — transaction financièrement saine.' },
      { l: 'Budget stable sur plusieurs exercices', v: '+0,5', tip: 'Les charges restent stables ou en légère hausse sur plusieurs années — copropriété bien gérée sans dérapages budgétaires.' },
    ],
    info: [
      { l: 'Écart budget voté / charges réelles', tip: 'Affiché à titre informatif avec les deux montants si disponibles. Un écart peut être justifié par des travaux imprévus ou une dépense exceptionnelle.' },
      { l: 'Appels de fonds exceptionnels', tip: 'Mentionnés dans le rapport si détectés, sans pénalité si justifiés par des travaux votés.' },
    ],
  },
  {
    id: 'diags-prives', emoji: '🏠', label: 'Diagnostics privatifs', pts: 4,
    color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe',
    desc: "DPE, électricité, gaz, amiante — ils impactent la valeur du bien, sa revendabilité et vos charges énergétiques futures.",
    bad: [
      { l: 'DPE F (résidence principale)', v: '-2', tip: 'Passoire thermique — charges énergétiques élevées et restrictions locatives à venir.' },
      { l: 'DPE G (résidence principale)', v: '-3', tip: 'Passoire thermique sévère — interdiction de location en vigueur, travaux de rénovation incontournables.' },
      { l: 'DPE F (investissement locatif)', v: '-4', tip: 'Déjà soumis à restrictions locatives — impact direct sur la rentabilité.' },
      { l: 'DPE G (investissement locatif)', v: '-6', tip: 'Interdit à la location — investissement bloqué sans travaux lourds de rénovation énergétique.' },
      { l: 'Électricité : anomalies majeures', v: '-2', tip: 'Anomalies importantes sur l\'installation électrique nécessitant une mise en conformité — coût et délais à prévoir.' },
      { l: 'Électricité : anomalies mineures', v: '-0,3', tip: 'Anomalies légères sur l\'installation électrique — à surveiller mais sans urgence immédiate.' },
      { l: 'Gaz : anomalies A1 (risque immédiat)', v: '-1', tip: 'Danger immédiat sur l\'installation de gaz — intervention urgente obligatoire avant mise en service.' },
      { l: 'Gaz : anomalies A2 (réparation urgente)', v: '-0,5', tip: 'Anomalie nécessitant une réparation dans les délais prescrits — à corriger rapidement.' },
      { l: 'Amiante privatif : matériaux dégradés', v: '-1', tip: 'Matériaux contenant de l\'amiante en état dégradé dans les parties privatives — travaux de retrait ou confinement à prévoir.' },
      { l: 'Amiante privatif : matériaux suspects', v: '-0,3', tip: 'Matériaux contenant de l\'amiante non prélevés nécessitant une évaluation périodique — surveillance recommandée.' },
      { l: 'Plomb (CREP) : revêtements dégradés', v: '-1', tip: 'Présence de plomb dans des revêtements dégradés — travaux de mise en sécurité obligatoires, surtout en présence d\'enfants.' },
      { l: 'Diagnostic obligatoire manquant', v: '-0,75', tip: 'Un diagnostic réglementairement requis pour ce bien n\'a pas été fourni — information incomplète pour évaluer le bien.' },
    ],
    good: [
      { l: 'DPE A, B ou C', v: '+1,5', tip: 'Excellente performance énergétique — charges réduites, bien attractif à la revente, aucune contrainte réglementaire.' },
      { l: 'DPE D', v: '+1', tip: 'Bonne performance énergétique — aucune contrainte réglementaire immédiate, charges maîtrisées.' },
      { l: 'Diagnostics complets sans anomalie (hors ERP)', v: '+2', tip: 'Tous les diagnostics obligatoires présents sont conformes, sans aucune anomalie détectée. L\'ERP (risques naturels) est toujours informatif et n\'entre pas dans ce calcul.' },
    ],
  },
  {
    id: 'diags-communs', emoji: '🏢', label: 'Diagnostics communs', pts: 3,
    color: '#16a34a', light: '#f0fdf4', border: '#bbf7d0',
    desc: "L'état des parties communes conditionne vos futures charges collectives. Un immeuble bien entretenu, c'est moins de mauvaises surprises.",
    bad: [
      { l: 'Amiante parties communes dégradé', v: '-2', tip: 'Présence d\'amiante dégradé dans les parties communes — travaux de désamiantage obligatoires, coûteux et complexes.' },
      { l: 'Termites parties communes', v: '-2', tip: 'Infestation de termites détectée dans les parties communes — traitement et consolidation structurelle à prévoir.' },
      { l: 'DTG : état général dégradé', v: '-2', tip: 'Le Diagnostic Technique Global révèle un immeuble en mauvais état général — travaux lourds à anticiper sur plusieurs années.' },
      { l: 'DTG : budget urgent < 50 000 €', v: '-1', tip: 'Des travaux urgents sont identifiés dans le DTG pour un montant inférieur à 50 000 € — à surveiller.' },
      { l: 'DTG : budget urgent > 50 000 €', v: '-2', tip: 'Des travaux urgents importants sont identifiés dans le DTG — appels de fonds significatifs à prévoir à court terme.' },
    ],
    good: [
      { l: 'Immeuble bien entretenu', v: '+0,5', tip: 'Les documents montrent un immeuble correctement entretenu, sans signalement de dégradation notable.' },
      { l: 'Diagnostics parties communes complets sans alerte', v: '+0,5', tip: 'Tous les diagnostics des parties communes sont réalisés et ne révèlent aucune anomalie — immeuble sain.' },
      { l: 'Entretien chaudière certifié', v: '+0,5', tip: 'Contrat d\'entretien chaudière collective en règle — équipement suivi, risques réduits.' },
      { l: 'DTG : état général bon', v: '+1', tip: 'Le Diagnostic Technique Global confirme un immeuble en bon état général — rassurance sur les dépenses futures.' },
    ],
    info: [
      { l: 'PPT (Plan Pluriannuel de Travaux)', tip: 'Affiché à titre informatif — planification des travaux sur 10 ans. Permet d\'anticiper les dépenses futures sans impacter la note.' },
    ],
  },
];

// ════════ MAISON HORS COPRO / ASL ════════
const docTypesMaison = [
  {
    id: 'm-dpe', emoji: '⚡', label: 'DPE — Diagnostic de Performance Énergétique',
    what: "La classe énergétique de la maison (A à G). Pour une maison, c'est un poste de charges majeur et un enjeu réglementaire fort à la revente. La note de performance énergétique en découle directement.",
    extracts: ['Classe énergétique (A à G) et consommation', "Émissions de gaz à effet de serre", "Estimation des coûts annuels d'énergie"],
    priority: 'Indispensable', pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5',
  },
  {
    id: 'm-ddt', emoji: '🔍', label: 'Diagnostics (électricité, gaz, amiante, plomb, termites, ERP)',
    what: "L'ensemble des diagnostics de sécurité et de salubrité de la maison. Chacun couvre un risque précis. Un dossier complet sans anomalie renforce la note.",
    extracts: ["Conformité de l'installation électrique", "État de l'installation gaz", "Présence d'amiante ou de plomb", 'Présence de termites', 'Risques naturels et technologiques (ERP)'],
    priority: 'Indispensable', pc: '#16a34a', pb: '#f0fdf4', pb2: '#d1fae5',
  },
  {
    id: 'm-audit', emoji: '📊', label: 'Audit énergétique réglementaire',
    what: "Obligatoire à la vente d'une maison classée F ou G (depuis avril 2023) et E (depuis janvier 2025). Il détaille les scénarios de travaux de rénovation et leur coût estimé. Distinct du DPE.",
    extracts: ['Scénarios de travaux (Pack 1 / Pack 2)', 'Gain énergétique estimé', 'Coûts de rénovation', 'Aides mobilisables'],
    priority: 'Recommandé', pc: '#7c3aed', pb: '#f5f3ff', pb2: '#ddd6fe',
  },
  {
    id: 'm-spanc', emoji: '💧', label: "Contrôle d'assainissement (SPANC)",
    what: "Si la maison n'est pas raccordée au tout-à-l'égout, son installation autonome (fosse, micro-station) doit être contrôlée par le SPANC. Une installation non conforme implique une mise aux normes souvent obligatoire après la vente.",
    extracts: ["Type d'installation (fosse, micro-station…)", 'Conformité de l\'installation', 'Travaux de mise aux normes éventuels'],
    priority: 'Recommandé', pc: '#7c3aed', pb: '#f5f3ff', pb2: '#ddd6fe',
  },
  {
    id: 'm-travaux', emoji: '🛠️', label: 'Devis & factures de travaux',
    what: "L'historique des travaux réalisés sur la maison (toiture, chauffage, isolation, électricité…). Documentés par devis ou factures, ils rassurent sur l'entretien et peuvent ouvrir droit à une garantie décennale transmissible.",
    extracts: ["Entreprise (nom, SIRET, assurance décennale)", 'Nature et montant des travaux', 'Date des interventions', 'Garantie décennale éventuelle'],
    priority: 'Recommandé', pc: '#7c3aed', pb: '#f5f3ff', pb2: '#ddd6fe',
  },
  {
    id: 'm-compromis', emoji: '✍️', label: 'Compromis / promesse de vente',
    what: "Le contrat qui fixe le prix, les conditions et les particularités du bien. Pour une maison, il révèle notamment les servitudes (passage, réseau) et l'état général déclaré.",
    extracts: ['Prix, frais et conditions suspensives', 'Servitudes grevant le terrain', 'État général déclaré', "Origine de propriété"],
    priority: 'Complémentaire', pc: '#2a7d9c', pb: '#f0f7fb', pb2: '#bae3f5',
  },
  {
    id: 'm-taxe', emoji: '🏛️', label: 'Taxe foncière',
    what: "Le montant annuel de la taxe foncière — une charge fixe importante pour une maison, à intégrer dans votre budget.",
    extracts: ['Montant annuel', 'Évolution sur les dernières années', 'Décomposition par collectivité'],
    priority: 'Complémentaire', pc: '#2a7d9c', pb: '#f0f7fb', pb2: '#bae3f5',
  },
  {
    id: 'm-asl', emoji: '🏘️', label: "Documents ASL / lotissement (si concerné)",
    what: "Si la maison fait partie d'un lotissement géré par une ASL ou une AFUL : statuts, cahier des charges, appels de cotisations. Ils révèlent les règles privées, les charges et la conformité de la structure.",
    extracts: ['Cotisations annuelles', "Règles d'urbanisme privées (cahier des charges)", 'Conformité (ordonnance de 2004)', 'Voirie et équipements communs'],
    priority: 'Recommandé', pc: '#7c3aed', pb: '#f5f3ff', pb2: '#ddd6fe',
  },
];

const categoriesMaison = [
  {
    id: 'm-perf', emoji: '⚡', label: 'Performance énergétique', pts: 5,
    color: '#f0a500', light: '#fffbeb', border: '#fde68a',
    desc: "Pour une maison, l'énergie pèse lourd : chauffage, confort et obligations réglementaires à la revente. La note suit directement la classe du DPE.",
    bad: [
      { l: 'DPE E', v: '3/5', tip: "Performance moyenne. Un audit énergétique est obligatoire à la vente pour une maison classée E depuis janvier 2025." },
      { l: 'DPE F', v: '2/5', tip: "Passoire thermique. Audit énergétique obligatoire à la vente depuis avril 2023, restrictions de location en vigueur." },
      { l: 'DPE G', v: '1/5', tip: "Passoire thermique sévère. Location déjà interdite, rénovation énergétique incontournable." },
      { l: 'Audit énergétique manquant (E, F ou G)', v: '-1', tip: "Pour une maison classée E, F ou G, l'audit énergétique réglementaire est obligatoire à la vente. Absent, le dossier est incomplet sur un point clé." },
      { l: 'Aucun DPE fourni', v: '0/5', tip: "Sans DPE, la performance ne peut pas être évaluée — document obligatoire à réclamer au vendeur." },
    ],
    good: [
      { l: 'DPE A ou B', v: '5/5', tip: "Maison très performante : faibles charges de chauffage, aucune contrainte réglementaire, excellente revendabilité." },
      { l: 'DPE C', v: '4,5/5', tip: "Très bonne performance énergétique, sans contrainte particulière." },
      { l: 'DPE D', v: '4/5', tip: "Bonne performance, dans la moyenne — pas de contrainte réglementaire immédiate." },
    ],
  },
  {
    id: 'm-diags', emoji: '🔍', label: 'Diagnostics & sécurité', pts: 5,
    color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe',
    desc: "Électricité, gaz, amiante, plomb, termites : les diagnostics qui touchent à la sécurité et à la salubrité de la maison. On part de 5 et on retire selon les anomalies réelles.",
    bad: [
      { l: 'Anomalie grave', v: '-2', tip: "Installation électrique dangereuse, gaz A2, amiante dégradé, plomb dégradé — mise en sécurité à prévoir, par anomalie grave." },
      { l: 'Termites détectés', v: '-3', tip: "Présence de termites — traitement et parfois consolidation structurelle. Risque majeur pour une maison." },
      { l: 'Diagnostic obligatoire manquant', v: '-0,75', tip: "Un diagnostic requis selon l'âge de la maison n'a pas été fourni — par diagnostic manquant." },
      { l: 'Anomalie mineure', v: '-0,5', tip: "Anomalie électrique légère, gaz A1, amiante à surveiller — à corriger sans urgence immédiate." },
    ],
    good: [
      { l: 'Tous les diagnostics présents sans anomalie', v: '5/5', tip: "Dossier complet et conforme, sans aucune anomalie détectée — maison saine côté sécurité." },
    ],
    info: [
      { l: 'Plancher de la catégorie', tip: "La note ne descend jamais sous 1/5 dès qu'au moins un diagnostic est fourni. Elle n'est à 0 que si aucun diagnostic n'est présent." },
    ],
  },
  {
    id: 'm-assain', emoji: '💧', label: 'Assainissement & risques', pts: 4,
    color: '#2a7d9c', light: '#f0f7fb', border: '#bae3f5',
    desc: "Deux postes spécifiques à la maison : l'assainissement (raccordement collectif ou installation autonome) et l'état des risques naturels (ERP).",
    bad: [
      { l: 'Assainissement non collectif non conforme', v: '-1,5', tip: "Installation autonome jugée non conforme par le contrôle SPANC — mise aux normes généralement obligatoire sous 1 an après la vente, plusieurs milliers d'euros." },
      { l: 'Assainissement non collectif sans contrôle', v: '-0,5', tip: "Maison non raccordée au tout-à-l'égout mais sans rapport SPANC fourni — document à réclamer." },
      { l: 'ERP : travaux prescrits', v: '-0,5', tip: "L'état des risques mentionne des obligations de travaux (zone à risque avec prescriptions) — à chiffrer." },
    ],
    good: [
      { l: "Raccordement au tout-à-l'égout", v: '0', tip: "Maison raccordée au réseau collectif — aucune contrainte d'assainissement autonome, aucune pénalité." },
    ],
    info: [
      { l: 'ERP informatif', tip: "L'état des risques naturels et technologiques est toujours informatif : il ne pénalise pas la note, sauf si des travaux sont prescrits." },
      { l: 'Aucune donnée', tip: "Sans information d'assainissement ni ERP, la note reste neutre (2/4) en attendant les documents." },
    ],
  },
  {
    id: 'm-bati', emoji: '🏗️', label: 'Travaux & bâti', pts: 3,
    color: '#d97706', light: '#fffbeb', border: '#fde68a',
    desc: "Cette catégorie récompense l'entretien. Une maison dont les travaux récents sont documentés rassure sur son état. On part d'une base neutre (2/3).",
    bad: [
      { l: 'Maison en état dégradé déclaré', v: '-1', tip: "Le compromis ou les documents décrivent une maison en mauvais état ou nécessitant de gros travaux." },
    ],
    good: [
      { l: 'Travaux majeurs récents documentés', v: '+1', tip: "Toiture, chauffage, isolation, électricité… réalisés et justifiés par devis ou factures. Signal fort d'entretien." },
      { l: 'Travaux récents documentés (autres)', v: '+0,5', tip: "Des travaux d'entretien sont documentés, même hors gros œuvre." },
      { l: 'Garantie décennale possible', v: '+0,5', tip: "Si les travaux datent de moins de 10 ans, la garantie décennale peut encore courir et se transmettre à l'acheteur (à confirmer)." },
    ],
    info: [
      { l: 'Aucun document de travaux', tip: "La note reste neutre (2/3) et un encart vous invite à demander l'historique au vendeur. Aucune pénalité." },
    ],
  },
  {
    id: 'm-juridique', emoji: '⚖️', label: 'Juridique · ASL & lotissement', pts: 3,
    color: '#dc2626', light: '#fef2f2', border: '#fecaca',
    desc: "Servitudes, contraintes d'urbanisme et procédures éventuelles. Et si la maison fait partie d'une ASL (lotissement), on analyse aussi ses règles et sa conformité — la note devient « ASL & lotissement ».",
    bad: [
      { l: 'Statuts ASL non publiés (conformité 2004)', v: '-1', tip: "Une ASL/AFUL d'avant 2004 devait publier ses statuts mis en conformité. Sinon, le recouvrement des cotisations et l'action en justice sont fragilisés." },
      { l: 'Voirie de lotissement non rétrocédée', v: '-1', tip: "La voirie reste à la charge des colotis tant qu'elle n'est pas rétrocédée à la commune — entretien à perpétuité." },
      { l: 'Procédure en cours', v: '-1 à -2', tip: "Litige affectant le bien — la pénalité dépend de la gravité." },
      { l: 'Servitude contraignante', v: '-0,5', tip: "Droit de passage, canalisation, ligne électrique grevant le terrain — par servitude, plafonné à -1,5." },
      { l: 'Contrainte du cahier des charges', v: '-0,5', tip: "Règles privées du lotissement (hauteurs, clôtures, extensions) qui s'imposent au-delà du PLU." },
      { l: "Contrainte d'urbanisme forte", v: '-0,5', tip: "Zone protégée, secteur Architecte des Bâtiments de France, monument historique — règles strictes sur les travaux." },
    ],
    good: [
      { l: 'Aucune servitude ni procédure', v: '3/3', tip: "Situation juridique saine, terrain libre de contraintes notables." },
    ],
    info: [
      { l: 'Cotisation ASL', tip: "Affichée comme charge réelle à intégrer au budget annuel — mais elle ne pénalise jamais la note par son seul montant." },
    ],
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
  { q: 'Une maison est-elle notée comme un appartement ?', a: "Non. Une maison hors copropriété n'a ni parties communes, ni syndic, ni fonds de travaux. Verimo applique une grille dédiée — performance énergétique, diagnostics & sécurité, assainissement, état du bâti, et le volet juridique. Le score reste sur 20." },
  { q: 'Et si ma maison fait partie d\'un lotissement (ASL) ?', a: "Si une Association Syndicale Libre (ASL ou AFUL) gère le lotissement, on analyse ses règles, sa conformité (statuts publiés depuis l'ordonnance de 2004), la rétrocession de la voirie et les contraintes du cahier des charges. La catégorie juridique devient « ASL & lotissement ». Les cotisations sont affichées comme charge réelle, sans pénaliser la note par leur seul montant." },
];

const navSections: Array<{ id: string; label: string } | { group: string }> = [
  { id: 'types-analyses', label: 'Analyse simple vs complète' },
  { group: 'Appartement · Copropriété' },
  { id: 'documents', label: 'Documents analysés' },
  { id: 'principe', label: 'Le score /20' },
  { id: 'categories', label: 'Les 5 catégories' },
  { id: 'exemple', label: 'Exemple concret' },
  { group: 'Maison hors copro · ASL' },
  { id: 'documents-maison', label: 'Documents analysés' },
  { id: 'categories-maison', label: 'Les 5 catégories' },
  { id: 'exemple-maison', label: 'Exemple concret' },
  { id: 'echelle', label: "L'échelle des notes" },
  { id: 'faq', label: 'Questions fréquentes' },
];

/* ══════════════════════════════════════════
   COMPOSANTS
══════════════════════════════════════════ */
function ScoreBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
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
      <div ref={ref} style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, borderRadius: 99, width: visible ? `${pct}%` : '0%', transition: 'width 0.4s ease' }} />
      </div>
    );
  }

  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={inView ? { width: `${pct}%` } : {}} transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
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
      <div ref={ref} style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: `opacity 0.25s ease ${Math.min(delay, 0.05)}s, transform 0.25s ease ${Math.min(delay, 0.05)}s`,
      }}>
        {children}
      </div>
    );
  }

  const inView = useInView(ref, { once: true, margin: '-30px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function MethodePage() {
  useSEO({
    title: 'Comment analyser vos documents immobiliers avant un achat — Méthode Verimo',
    description: "Découvrez comment Verimo analyse vos documents d'achat immobilier : PV d'AG, DPE, diagnostics, règlement, appels de charges, compromis, etc. Score, risques et recommandations.",
    canonical: '/methode',
  });

  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('types-analyses');

  useEffect(() => {
    const handle = () => {
      for (const s of navSections) {
        if (!('id' in s)) continue;
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
      <section style={{
        background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)',
        padding: '52px 24px 44px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(180deg, transparent 0%, #ffffff 100%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* Confettis — desktop (6) + mobile allégé (3) */}
        <div className="confetti-desktop" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <VerimoConfetti items={[
            { top: '20%', left: '7%', size: 10, color: VERIMO_CONFETTI_COLORS.blue, shape: 'circle' },
            { top: '32%', right: '9%', size: 12, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 0.5 },
            { top: '58%', left: '5%', size: 8, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1 },
            { top: '68%', right: '6%', size: 10, color: VERIMO_CONFETTI_COLORS.blue, shape: 'square', delay: 1.3 },
            { bottom: '22%', left: '10%', size: 8, color: VERIMO_CONFETTI_COLORS.red, shape: 'circle', delay: 0.8 },
            { bottom: '34%', right: '11%', size: 12, color: VERIMO_CONFETTI_COLORS.green, shape: 'circle', delay: 1.5 },
          ]} />
        </div>
        <div className="confetti-mobile" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <VerimoConfetti items={[
            { top: '15%', left: '4%', size: 6, color: VERIMO_CONFETTI_COLORS.blue, shape: 'circle' },
            { top: '50%', right: '4%', size: 7, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 0.6 },
            { bottom: '15%', left: '5%', size: 6, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1.1 },
          ]} />
        </div>
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
            {navSections.map((s, idx) => (
              'group' in s ? (
                <div key={`g-${idx}`} style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d', letterSpacing: '0.04em', textTransform: 'uppercase' as const, margin: '14px 0 4px', paddingLeft: 14 }}>{s.group}</div>
              ) : (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', background: activeSection === s.id ? '#f0f7fb' : 'transparent', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}>
                  <div style={{ width: 3, height: 16, borderRadius: 99, background: activeSection === s.id ? '#2a7d9c' : '#e2e8f0', flexShrink: 0, transition: 'all 0.15s' }} />
                  <span style={{ fontSize: 15, fontWeight: activeSection === s.id ? 700 : 400, color: activeSection === s.id ? '#0f172a' : '#64748b', lineHeight: 1.4, transition: 'all 0.15s' }}>{s.label}</span>
                </button>
              )
            ))}
          </nav>
          <div style={{ marginTop: 28, padding: '18px', borderRadius: 14, background: '#f8fafc', border: '1px solid #edf2f7' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2d3d', marginBottom: 6 }}>Analyser un bien</div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 14, lineHeight: 1.5 }}>Score /20 en quelques minutes*</div>
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
                  <div style={{ fontSize: 14, color: '#64748b', marginBottom: 14, lineHeight: 1.6 }}>
                    Vous uploadez <strong style={{ color: '#0f172a' }}>un seul document</strong>. Verimo l'identifie, en extrait les informations clés, et vous donne les points forts et les vigilances détectés.
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 14 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e', marginBottom: 3 }}>ℹ️ Idéal pour vérifier un point précis</div>
                    <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>PV d'AG, règlement de copropriété, DPE, diagnostic amiante, appel de charges…</div>
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>⚠ Pas de note /20</div>
                    <div style={{ fontSize: 13, color: '#7f1d1d' }}>L'analyse simple porte sur un seul document, pas sur un bien complet.</div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.07}>
                <div style={{ borderRadius: 16, border: '1.5px solid #2a7d9c', padding: '22px 24px', background: '#f0f7fb', height: '100%', boxSizing: 'border-box' as const, boxShadow: '0 4px 18px rgba(42,125,156,0.1)' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Analyse complète</div>
                  <div style={{ fontSize: 14, color: '#374151', marginBottom: 14, lineHeight: 1.6 }}>
                    Vous uploadez <strong style={{ color: '#0f172a' }}>jusqu'à 15 documents</strong>. Verimo les croise et génère un score /20 global du bien avec un rapport complet.
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: '#e8f4fa', border: '1px solid #bae3f5', marginBottom: 14 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0c447c', marginBottom: 3 }}>🏠 Envoyez tous vos documents d'un coup</div>
                    <div style={{ fontSize: 12, color: '#0a2e4a', lineHeight: 1.5 }}>PV d'AG, DPE, charges, règlement, diagnostics, compromis… Verimo croise tout et génère votre score.</div>
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>✓ Score /20 + rapport PDF</div>
                    <div style={{ fontSize: 13, color: '#14532d' }}>Recommandation d'achat, travaux, charges, procédures, pistes de négociation — tout est inclus.</div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ════════ GROUPE APPARTEMENT / COPROPRIÉTÉ ════════ */}
          <Reveal>
            <div style={{ margin: '8px 0 4px', padding: '18px 22px', borderRadius: 16, background: 'linear-gradient(135deg,#1e3a5f,#2a7d9c)', color: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, opacity: 0.75, marginBottom: 4 }}>Appartement · Copropriété</div>
              <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.35 }}>Le cœur de l'analyse : la copropriété 🏢</div>
              <div style={{ fontSize: 14.5, opacity: 0.9, marginTop: 6, lineHeight: 1.6, maxWidth: 640 }}>
                PV d'assemblée générale, finances, travaux votés, diagnostics privatifs et communs : tout ce qui fait la santé d'un appartement en copropriété, noté sur 20.
              </div>
            </div>
          </Reveal>

          {/* ── 2. DOCUMENTS ANALYSÉS ─────────────────────────── */}
          <section id="documents">
            <Reveal>
              <SectionHead label="Documents analysés" title="Ce qu'on lit dans chaque document" sub="Cliquez sur un document pour voir ce qu'on en extrait exactement." />
            </Reveal>

            {/* Barre de priorité */}
            <Reveal delay={0.04}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' as const }}>
                {[{ l: '✓ Indispensable', c: '#16a34a', bg: '#f0fdf4', b: '#d1fae5' }, { l: '+ Complémentaire', c: '#2a7d9c', bg: '#f0f7fb', b: '#bae3f5' }, { l: '★ Recommandé', c: '#7c3aed', bg: '#f5f3ff', b: '#ddd6fe' }].map((t) => (
                  <Tag key={t.l} color={t.c} bg={t.bg} border={t.b}>{t.l}</Tag>
                ))}
                <span style={{ fontSize: 13, color: '#94a3b8', alignSelf: 'center' }}>— pour l'analyse complète</span>
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
                        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
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
                            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.85, marginBottom: 16 }}>{doc.what}</p>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 10 }}>Ce qu'on en extrait</div>
                            <div className="extracts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                              {doc.extracts.map((e, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#fff', border: `1px solid ${doc.pb2}` }}>
                                  <Check size={12} color={doc.pc} style={{ flexShrink: 0, marginTop: 2 }} />
                                  <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{e}</span>
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
                <p style={{ fontSize: 14, color: '#15803d', fontWeight: 600, margin: 0 }}>
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
                  <strong style={{ color: '#0f172a' }}>Votre bien démarre avec la note maximale.</strong>{' '}
                  Chaque risque détecté dans vos documents fait baisser le curseur. Mais chaque point positif le remonte.
                  <br /><br />
                  L'objectif : une note juste, pas une note pessimiste.
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
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{s.sub}</div>
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
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
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
                        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 1 }}>Sur {cat.pts} points</div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: cat.color, marginRight: 8 }}>{cat.pts} pts</span>
                      <ChevronDown size={15} color="#cbd5e1" style={{ flexShrink: 0, transform: openCat === cat.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    <AnimatePresence>
                      {openCat === cat.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                          <div style={{ borderTop: `1px solid ${cat.border}`, padding: '16px 20px', background: cat.light }}>
                            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.85, marginBottom: 16 }}>{cat.desc}</p>
                            <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div style={{ background: '#fff', borderRadius: 11, border: '1px solid #fecaca', padding: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                  <TrendingDown size={12} color="#dc2626" />
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Pénalités</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                                  {cat.bad.map((item, i) => (
                                    <div key={i}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <span style={{ fontSize: 16, color: '#374151', lineHeight: 1.5 }}>{item.l}</span>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{item.v}</span>
                                      </div>
                                      {(item as any).tip && <div style={{ fontSize: 15, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>{(item as any).tip}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                                <div style={{ background: '#fff', borderRadius: 11, border: '1px solid #d1fae5', padding: '14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                    <TrendingUp size={12} color="#16a34a" />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Bonus</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                                    {cat.good.map((item, i) => (
                                      <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                          <span style={{ fontSize: 16, color: '#374151', lineHeight: 1.5 }}>{item.l}</span>
                                          <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{item.v}</span>
                                        </div>
                                        {(item as any).tip && <div style={{ fontSize: 15, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>{(item as any).tip}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {(cat as any).info && (cat as any).info.length > 0 && (
                                  <div style={{ background: '#fff', borderRadius: 11, border: '1px solid #e2e8f0', padding: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                      <Info size={12} color="#64748b" />
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Informatif</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                                      {(cat as any).info.map((item: any, i: number) => (
                                        <div key={i}>
                                          <span style={{ fontSize: 16, color: '#64748b', lineHeight: 1.5 }}>{item.l}</span>
                                          {item.tip && <div style={{ fontSize: 15, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>{item.tip}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>12 rue des Lilas — Appartement 4B, Lyon 6e</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>PV d'AG 2024 + DPE + Règlement copropriété analysés</div>
                </div>
              </div>
              <div>
                {[
                  { label: 'Point de départ', note: '', pts: '+20', color: '#0f172a', sub: false },
                  { label: 'Ravalement de façade évoqué non voté', note: 'Travaux — travaux lourds évoqués sans vote ni budget', pts: '−3', color: '#dc2626', sub: true },
                  { label: 'Fonds travaux nul', note: 'Finances — aucun fonds de travaux provisionné', pts: '−1', color: '#dc2626', sub: true },
                  { label: 'DPE classé C', note: 'Diagnostics privatifs — excellente performance énergétique', pts: '+1,5', color: '#16a34a', sub: true },
                  { label: 'Aucune procédure judiciaire', note: 'Procédures — situation juridique saine', pts: '+1', color: '#16a34a', sub: true },
                ].map((row, i) => (
                  <Reveal key={i} delay={i * 0.05}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '13px 20px', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: row.sub ? 600 : 700, color: '#0f172a' }}>{row.label}</div>
                        {row.sub && <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 2 }}>{row.note}</div>}
                      </div>
                      <span style={{ fontSize: row.sub ? 16 : 18, fontWeight: 900, color: row.color, flexShrink: 0 }}>{row.pts}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.3}>
                <div style={{ borderTop: '2px solid #edf2f7', padding: '16px 20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Score final</div>
                    <div style={{ fontSize: 14, color: '#94a3b8' }}>Arrondi au 0,5 près</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                      <span style={{ fontSize: 38, fontWeight: 900, color: '#15803d', letterSpacing: '-0.03em' }}>18,5</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#cbd5e1' }}>/20</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#15803d', background: '#f0fdf4', border: '1px solid #d1fae5', padding: '5px 14px', borderRadius: 10 }}>Bien irréprochable ✓</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ════════ GROUPE MAISON HORS COPRO / ASL ════════ */}
          <Reveal>
            <div style={{ margin: '8px 0 4px', padding: '18px 22px', borderRadius: 16, background: 'linear-gradient(135deg,#0f2d3d,#2a7d9c)', color: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, opacity: 0.75, marginBottom: 4 }}>Maison hors copropriété · ASL</div>
              <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.35 }}>Une maison ne se note pas comme un appartement 🏡</div>
              <div style={{ fontSize: 14.5, opacity: 0.9, marginTop: 6, lineHeight: 1.6, maxWidth: 640 }}>
                Pas de copropriété, pas de parties communes, pas de syndic. À la place : performance énergétique, assainissement, état du bâti, et parfois une ASL de lotissement. Verimo applique une grille dédiée, sur 20 elle aussi.
              </div>
            </div>
          </Reveal>

          {/* ── MAISON · Documents ── */}
          <section id="documents-maison">
            <Reveal>
              <SectionHead label="Documents analysés · Maison" title="Ce qu'on lit pour une maison" sub="Cliquez sur un document pour voir ce qu'on en extrait." />
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {docTypesMaison.map((doc, idx) => (
                <Reveal key={doc.id} delay={idx * 0.04}>
                  <div style={{ borderRadius: 14, border: `1.5px solid ${openDoc === doc.id ? doc.pb2 : '#edf2f7'}`, overflow: 'hidden', background: '#fff', transition: 'border-color 0.18s', boxShadow: openDoc === doc.id ? `0 4px 16px ${doc.pc}18` : 'none' }}>
                    <button onClick={() => setOpenDoc(openDoc === doc.id ? null : doc.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: doc.pb, border: `1px solid ${doc.pb2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{doc.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{doc.label}</div>
                        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{openDoc === doc.id ? "Ce qu'on extrait de ce document" : doc.what.slice(0, 60) + '…'}</div>
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
                            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.85, marginBottom: 16 }}>{doc.what}</p>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 10 }}>Ce qu'on en extrait</div>
                            <div className="extracts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                              {doc.extracts.map((e, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#fff', border: `1px solid ${doc.pb2}` }}>
                                  <Check size={12} color={doc.pc} style={{ flexShrink: 0, marginTop: 2 }} />
                                  <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{e}</span>
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
          </section>

          {/* ── MAISON · Catégories ── */}
          <section id="categories-maison">
            <Reveal>
              <SectionHead label="5 catégories · Maison" title="Ce qu'on analyse pour noter une maison" sub="Cliquez sur une catégorie pour voir le détail des points." />
            </Reveal>
            <Reveal delay={0.03}>
              <div style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #edf2f7', padding: '16px 20px', marginBottom: 18, fontSize: 14.5, color: '#475569', lineHeight: 1.7 }}>
                Chaque catégorie a sa propre logique. La <strong>performance énergétique</strong> suit directement la classe du DPE. Les <strong>diagnostics</strong> partent de 5 et baissent selon les anomalies. <strong>Assainissement</strong> et <strong>travaux</strong> partent d'une base neutre et peuvent monter comme descendre. Le total fait toujours 20.
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 20 }}>
                {categoriesMaison.map((c) => (<div key={c.id} style={{ flex: c.pts, background: c.color, opacity: 0.7 }} title={`${c.label} — ${c.pts} pts`} />))}
              </div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' as const }}>
                {categoriesMaison.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: c.color }} /> {c.label} ({c.pts} pts)
                  </div>
                ))}
              </div>
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
              {categoriesMaison.map((cat, idx) => (
                <Reveal key={cat.id} delay={idx * 0.04}>
                  <div style={{ borderRadius: 13, border: `1.5px solid ${openCat === cat.id ? cat.color : '#edf2f7'}`, overflow: 'hidden', background: '#fff', transition: 'all 0.18s', boxShadow: openCat === cat.id ? `0 4px 18px ${cat.color}18` : 'none' }}>
                    <button onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '15px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.light, border: `1px solid ${cat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cat.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{cat.label}</div>
                        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 1 }}>Sur {cat.pts} points</div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: cat.color, marginRight: 8 }}>{cat.pts} pts</span>
                      <ChevronDown size={15} color="#cbd5e1" style={{ flexShrink: 0, transform: openCat === cat.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    <AnimatePresence>
                      {openCat === cat.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                          <div style={{ borderTop: `1px solid ${cat.border}`, padding: '16px 20px', background: cat.light }}>
                            <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.85, marginBottom: 16 }}>{cat.desc}</p>
                            <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div style={{ background: '#fff', borderRadius: 11, border: '1px solid #fecaca', padding: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                  <TrendingDown size={12} color="#dc2626" />
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Pénalités</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                                  {cat.bad.map((item, i) => (
                                    <div key={i}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <span style={{ fontSize: 16, color: '#374151', lineHeight: 1.5 }}>{item.l}</span>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{item.v}</span>
                                      </div>
                                      {(item as any).tip && <div style={{ fontSize: 15, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>{(item as any).tip}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                                <div style={{ background: '#fff', borderRadius: 11, border: '1px solid #d1fae5', padding: '14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                    <TrendingUp size={12} color="#16a34a" />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Bonus</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                                    {cat.good.map((item, i) => (
                                      <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                          <span style={{ fontSize: 16, color: '#374151', lineHeight: 1.5 }}>{item.l}</span>
                                          <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{item.v}</span>
                                        </div>
                                        {(item as any).tip && <div style={{ fontSize: 15, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>{(item as any).tip}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {(cat as any).info && (cat as any).info.length > 0 && (
                                  <div style={{ background: '#fff', borderRadius: 11, border: '1px solid #e2e8f0', padding: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                                      <Info size={12} color="#64748b" />
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Informatif</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                                      {(cat as any).info.map((item: any, i: number) => (
                                        <div key={i}>
                                          <span style={{ fontSize: 16, color: '#374151', lineHeight: 1.5 }}>{item.l}</span>
                                          {item.tip && <div style={{ fontSize: 15, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>{item.tip}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
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

          {/* ── MAISON · Exemple ── */}
          <section id="exemple-maison">
            <Reveal>
              <SectionHead label="Exemple concret · Maison" title="Un calcul réel, étape par étape" sub="Maison hors copro — Pavillon, périphérie de Nantes" />
            </Reveal>
            <div style={{ border: '1.5px solid #edf2f7', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🏡</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Pavillon 1985 — hors copropriété</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>DPE + diagnostics + contrôle SPANC + devis toiture analysés</div>
                </div>
              </div>
              <div>
                {[
                  { label: 'Performance énergétique', note: 'DPE classé D', pts: '4/5', color: '#0f172a', sub: true },
                  { label: 'Diagnostics & sécurité', note: 'Tous présents, aucune anomalie', pts: '5/5', color: '#16a34a', sub: true },
                  { label: 'Assainissement & risques', note: 'Fosse toutes eaux conforme · ERP informatif', pts: '4/4', color: '#16a34a', sub: true },
                  { label: 'Travaux & bâti', note: 'Réfection toiture 2021 documentée (garantie possible)', pts: '3/3', color: '#16a34a', sub: true },
                  { label: 'Juridique', note: 'Une servitude de passage', pts: '2,5/3', color: '#d97706', sub: true },
                ].map((row, i) => (
                  <Reveal key={i} delay={i * 0.05}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '13px 20px', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{row.label}</div>
                        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 2 }}>{row.note}</div>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 900, color: row.color, flexShrink: 0 }}>{row.pts}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.3}>
                <div style={{ borderTop: '2px solid #edf2f7', padding: '16px 20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Score final</div>
                    <div style={{ fontSize: 14, color: '#94a3b8' }}>Somme des 5 catégories</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                      <span style={{ fontSize: 38, fontWeight: 900, color: '#15803d', letterSpacing: '-0.03em' }}>18,5</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#cbd5e1' }}>/20</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#15803d', background: '#f0fdf4', border: '1px solid #d1fae5', padding: '5px 14px', borderRadius: 10 }}>Bien irréprochable ✓</span>
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
                        <span style={{ fontSize: 20, fontWeight: 900, color: level.c }}>{level.r}</span>
                        <span style={{ fontSize: 13, color: level.c, opacity: 0.6 }}>/20</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: level.c, marginBottom: 2 }}>{level.l}</div>
                        <div style={{ fontSize: 15, color: '#64748b' }}>{level.desc}</div>
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
                <p style={{ fontSize: 14, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                  <strong>Astuce :</strong> si votre score est inférieur à 17/20, Verimo génère automatiquement des pistes de négociation pour vous aider à revoir le prix à la baisse.
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
                          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.85, margin: 0, padding: '0 20px 16px', borderTop: '1px solid #f0f5f9' }}>{faq.a}</p>
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
                <div style={{ fontSize: 15, color: '#64748b' }}>Score /20 + rapport complet en quelques minutes*.</div>
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
        @media (max-width: 1023px) { .confetti-desktop { display: none !important; } }
        @media (min-width: 1024px) { .confetti-mobile { display: none !important; } }
      `}</style>
    </main>
  );
}

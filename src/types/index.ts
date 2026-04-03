export type AnalysisType = 'document' | 'complete' | 'pack2' | 'pack3';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TypeBien = 'appartement' | 'maison' | 'maison_copro' | 'indetermine';
export type ProfilAchat = 'rp' | 'invest';
export type ScoreCouleur = 'rouge' | 'orange' | 'jaune' | 'vert' | 'vert_fonce';

export type CategoryDetail = {
  label: string;
  impact: 'positif' | 'negatif' | 'neutre';
  message: string;
};

export type Category = {
  note: number;
  note_max: number;
  details: CategoryDetail[];
};

export type DocumentDetecte = {
  nom: string;
  explication: string;
  infos_cles: string[];
};

export type TravauxItem = {
  label: string;
  annee?: string;
  montant_estime?: number | null;
  statut?: string;
  justificatif?: boolean;
};

export type ProcedureItem = {
  label: string;
  type: string;
  gravite: 'faible' | 'moderee' | 'elevee';
};

export type Negociation = {
  applicable: boolean;
  elements: string[];
};

export type RapportComplet = {
  type_bien: TypeBien;
  profil: ProfilAchat;
  titre: string;
  score: number | null;
  score_niveau: string | null;
  score_couleur: ScoreCouleur | null;
  raison_absence_score: string | null;
  documents_detectes: DocumentDetecte[];
  synthese_points_positifs: string[];
  synthese_points_vigilance: string[];
  categories: {
    travaux: Category;
    procedures: Category;
    finances: Category;
    diags_privatifs: Category;
    diags_communs: Category;
  };
  travaux_realises: TravauxItem[];
  travaux_votes: TravauxItem[];
  travaux_a_prevoir: TravauxItem[];
  quote_part_travaux: string;
  charges_mensuelles: number | null;
  fonds_travaux: number | null;
  fonds_travaux_statut: 'conforme' | 'insuffisant' | 'absent' | 'non_mentionne';
  procedures_en_cours: boolean;
  procedures: ProcedureItem[];
  documents_manquants: string[];
  negociation: Negociation;
  avis_verimo: string;
};

export type Analysis = {
  id: string;
  type: AnalysisType;
  status: AnalysisStatus;
  title: string;
  address?: string;
  score?: number | null;
  score_couleur?: ScoreCouleur;
  profil?: ProfilAchat;
  type_bien?: TypeBien;
  price: string;
  date: string;
  is_preview?: boolean;
  paid?: boolean;
  document_names?: string[];
  regeneration_deadline?: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  price: number;
  idealFor: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
  badgeColor?: string;
  cta: string;
  icon: string;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'document', name: 'Analyse Document', price: 4.90,
    idealFor: 'Comprendre rapidement un document précis et lever un doute',
    features: ["Analyse détaillée d'un seul document", "PV d'AG, règlement, appel de charges ou diagnostic", 'Rapport PDF téléchargeable', 'Résultats en moins de 2 minutes'],
    highlighted: false, cta: 'Analyser un document', icon: '📄',
  },
  {
    id: 'complete', name: 'Analyse Complète', price: 19.90,
    idealFor: 'Prendre une décision avant de faire une offre',
    features: ["Analyse globale multi-documents d'un bien", 'Note /20, risques, travaux, charges, diagnostics', 'Conclusion claire + rapport PDF complet', "Conseils personnalisés selon votre profil"],
    highlighted: true, badge: 'Le plus populaire', badgeColor: 'teal', cta: 'Analyser un bien', icon: '🏠',
  },
  {
    id: 'pack2', name: 'Pack 2 Biens', price: 29.90,
    idealFor: 'Hésiter entre deux biens et choisir le meilleur',
    features: ['Analyse complète de 2 biens', 'Comparaison côte à côte', 'Économisez 10€ vs 2 analyses séparées', 'Rapport de comparaison détaillé'],
    highlighted: false, badge: 'Économique', badgeColor: 'gold', cta: 'Comparer 2 biens', icon: '🔄',
  },
  {
    id: 'pack3', name: 'Pack 3 Biens', price: 39.90,
    idealFor: 'Comparer plusieurs biens avant de choisir le bon',
    features: ['Analyse complète de 3 biens différents', 'Outil de comparaison avancé', 'Économisez 20€ vs 3 analyses séparées', 'Classement et recommandation finale'],
    highlighted: false, cta: 'Comparer 3 biens', icon: '📊',
  },
];

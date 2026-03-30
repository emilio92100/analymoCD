export type AnalysisType = 'document' | 'complete' | 'pack2' | 'pack3';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Analysis = {
  id: string;
  type: AnalysisType;
  status: AnalysisStatus;
  title: string;
  address?: string;
  score?: number;
  recommandation?: string;
  recommandationColor?: string;
  price: string;
  date: string;
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
    features: ["Analyse globale multi-documents d'un bien", 'Score global, risques, travaux, charges, diagnostics', 'Conclusion claire + rapport PDF complet', "Recommandation d'achat personnalisée"],
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

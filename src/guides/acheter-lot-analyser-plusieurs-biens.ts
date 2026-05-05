/**
 * Guide : Acheter en lot — comment analyser plusieurs biens rapidement
 * Catégorie : Professionnels > Investisseurs & Marchands de biens
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'acheter-lot-analyser-plusieurs-biens',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 6,

  seo: {
    title: `Acheter en lot : analyser plusieurs biens immobiliers rapidement — Guide Verimo`,
    description: `Comment analyser un portefeuille de biens immobiliers rapidement : méthode par scoring, documents prioritaires, outils. Guide investisseur et marchand de biens 2026.`,
  },

  title: `Acheter en lot : comment analyser plusieurs biens rapidement`,
  subtitle: `Méthode pour évaluer un portefeuille de biens sans passer des semaines sur chaque dossier.`,

  intro: `Acheter 3, 5 ou 10 biens en même temps — que ce soit un immeuble de rapport, un lot en copropriété ou un portefeuille de marchand de biens — implique de multiplier les documents par le nombre de lots.

50 pages par lot multiplié par 10 lots = 500 pages. Vous n'avez pas le temps de tout lire. Voici comment prioriser et analyser rapidement.`,

  sections: [
    {
      id: 'methode-scoring',
      title: `La méthode par scoring rapide`,
      content: `Pour chaque lot, attribuez un score sur 5 critères :`,
      numberedList: [
        `DPE — A/B/C = 3 pts, D/E = 2 pts, F/G = 0 pt`,
        `Charges au m² — dans la norme = 2 pts, élevées = 1 pt, très élevées = 0 pt`,
        `Travaux votés — aucun = 2 pts, modérés = 1 pt, lourds = 0 pt`,
        `Impayés copro — moins de 10 % = 2 pts, 10-20 % = 1 pt, plus de 20 % = 0 pt`,
        `État technique (diagnostics) — RAS = 1 pt, anomalies = 0 pt`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le tri rapide`,
        content: `Score 8-10 = feu vert, analysez en détail. Score 5-7 = à creuser, vérifiez les points faibles. Score 0-4 = probablement à écarter sauf si le prix compense largement.`,
      },
    },
    {
      id: 'documents-prioritaires',
      title: `Les documents à lire en premier`,
      content: `Quand vous avez 10 dossiers, ne lisez pas tout. Priorisez :`,
      numberedList: [
        `Le DPE de chaque lot — 30 secondes par lot, vous éliminez les G non rénovables`,
        `L'état daté (partie 3 uniquement) — les appels de fonds à venir. 1 minute par lot`,
        `Le dernier PV d'AG (résolutions travaux + impayés) — 3 minutes par lot`,
        `Les diagnostics critiques (amiante état 2-3, électricité sans terre) — 2 minutes par lot`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Le calcul`,
        content: `Total : 6 minutes par lot. Pour 10 lots = 1 heure de première passe. Ça vous donne un scoring et une shortlist des lots à analyser en profondeur.`,
      },
    },
    {
      id: 'outils-volume',
      title: `Les outils pour le volume`,
      content: `Au-delà de 5 lots, l'analyse manuelle n'est plus viable :`,
      bullets: [
        `Un tableur de scoring — avec les 5 critères ci-dessus, rempli au fur et à mesure de la lecture`,
        `Un outil d'analyse automatique — vous uploadez les documents, vous recevez un rapport par lot. Indispensable au-delà de 10 lots`,
        `Un assistant ou un collaborateur — qui fait la pré-analyse et vous remonte les alertes`,
        `Un architecte ou un BET — pour l'état technique des bâtiments si vous achetez un immeuble entier`,
      ],
    },
    {
      id: 'decision',
      title: `La décision : acheter ou pas`,
      content: `Après le scoring et l'analyse prioritaire, classez vos lots en 3 catégories :`,
      bullets: [
        `À acheter — score élevé, pas d'alerte majeure, prix cohérent`,
        `À négocier — score moyen, des points faibles identifiés mais compensables par une décote`,
        `À écarter — score bas, problèmes structurels ou financiers non compensables par le prix`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Ne tombez pas dans le piège du lot`,
        content: `Quand on achète en lot, il y a la tentation de prendre les mauvais biens avec les bons "parce que c'est le lot". Évaluez chaque bien individuellement. Un lot de 10 biens dont 3 sont toxiques n'est pas une bonne affaire — c'est 3 problèmes déguisés en opportunité.`,
      },
    },
  ],

  conclusion: `Acheter en lot, c'est un exercice de tri. Vous n'avez pas le temps de lire 500 pages — mais vous avez besoin des bonnes informations. La méthode par scoring, les documents prioritaires et les outils d'analyse vous permettent de décider en quelques heures au lieu de quelques semaines.`,

  cta: {
    title: `Analysez vos lots en volume`,
    description: `Verimo Pro analyse plusieurs dossiers en parallèle. Un rapport par lot, un scoring global, les alertes en un coup d'oeil.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'analyser-immeuble-rapport-documents',
    'due-diligence-checklist-investisseur',
    'marchand-biens-bonnes-affaires-pv-ag',
    'investissement-locatif-documents-rentabilite',
  ],
};

export default article;

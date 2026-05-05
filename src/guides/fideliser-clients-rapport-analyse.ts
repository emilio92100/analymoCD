/**
 * Guide : Fidéliser ses clients acquéreurs avec un rapport d'analyse clair
 * Catégorie : Professionnels > Agents & Mandataires
 * Dernière mise à jour : mai 2026
 */ 

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'fideliser-clients-rapport-analyse',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 5,

  seo: {
    title: `Fidéliser ses clients acquéreurs avec un rapport d'analyse — Guide Verimo`,
    description: `Comment un rapport d'analyse documentaire fidélise vos clients acquéreurs et génère des recommandations. Stratégie pour agents et mandataires. Guide 2026.`,
  },

  title: `Fidéliser ses clients acquéreurs avec un rapport d'analyse clair`,
  subtitle: `Offrir de la transparence documentaire pour bâtir la confiance et générer des recommandations.`,

  intro: `Un client satisfait recommande. Un client déçu critique. La différence entre les deux tient souvent à un détail : est-ce que l'agent a apporté une vraie valeur ajoutée au-delà de la visite et de la négociation ?

Un rapport d'analyse documentaire, c'est exactement ça. Un document concret que le client garde, qu'il montre à son entourage, et qui prouve que vous avez fait votre travail.`,

  sections: [
    {
      id: 'pourquoi-rapport',
      title: `Pourquoi un rapport fait la différence`,
      content: `Un rapport d'analyse, c'est tangible. L'acheteur peut le montrer :`,
      bullets: [
        `À son banquier — pour justifier le prix et les travaux à financer`,
        `À sa famille — pour rassurer sur la qualité de l'achat`,
        `À ses amis qui achètent — et qui vous appelleront`,
        `À son notaire — pour préparer le compromis en connaissance de cause`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le bouche-à-oreille`,
        content: `"Mon agent m'a remis un rapport sur la copro avec un score, les risques et les arguments de négo. C'est la première fois qu'un agent fait ça." — c'est le genre de phrase qui génère 2-3 contacts qualifiés par an.`,
      },
    },
    {
      id: 'contenu-rapport',
      title: `Que doit contenir le rapport`,
      content: `Un bon rapport pour un acquéreur contient :`,
      bullets: [
        `Un score ou une note globale — visuel, immédiat, compréhensible`,
        `Les points forts du bien — DPE correct, copro saine, pas de travaux prévus`,
        `Les points de vigilance — travaux votés, impayés, DPE dégradé, diagnostics avec anomalies`,
        `Les pistes de négociation — les arguments factuels pour discuter le prix`,
        `Les questions à poser — au vendeur, au syndic, au notaire`,
      ],
    },
    {
      id: 'quand-remettre',
      title: `Quand remettre le rapport`,
      content: `Le timing est important :`,
      bullets: [
        `Avant l'offre — l'acheteur décide en connaissance de cause. Moins de rétractations`,
        `Pendant le délai de rétractation — si le rapport n'était pas prêt avant le compromis, c'est le dernier moment utile`,
        `Jamais après le délai de rétractation — là c'est trop tard, le rapport perd sa valeur d'aide à la décision`,
      ],
    },
    {
      id: 'roi',
      title: `Le retour sur investissement`,
      content: `Calculez le ROI de ce service :`,
      bullets: [
        `Coût d'une analyse : quelques euros par dossier avec un outil automatisé`,
        `Gain en recommandations : 2-3 contacts qualifiés par client satisfait`,
        `Gain en rapidité : moins de rétractations = moins de ventes perdues`,
        `Gain en image : vous passez de "vendeur" à "conseiller". La perception change tout`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Le calcul simple`,
        content: `Un rapport à quelques euros qui évite une rétractation (et donc sauve une commission de 5 000 à 15 000 €), c'est le meilleur ROI de votre activité.`,
      },
    },
  ],

  conclusion: `Un rapport d'analyse, c'est un petit investissement en temps ou en outil qui génère de la confiance, de la recommandation et de la fidélité. C'est le genre de service que les clients n'oublient pas — et qu'ils racontent.`,

  cta: {
    title: `Proposez un service d'analyse à vos clients`,
    description: `Verimo Pro vous permet d'analyser les dossiers en quelques minutes et de transmettre des rapports professionnels à vos clients acquéreurs.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'agent-differencier-analyse-documentaire',
    'mandataire-analyser-dossier-10-minutes',
    'securiser-transactions-checklist-agent',
    'mandataires-iad-safti-capifrance-optimiser',
  ],
};

export default article;

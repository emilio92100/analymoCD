/**
 * Guide : Travaux votés en AG — un levier de négociation souvent ignoré
 * Catégorie : Acheteurs > Négociation
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'travaux-votes-ag-levier-negociation',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 6,

  seo: {
    title: `Travaux votés en AG : un levier de négociation à l'achat — Guide Verimo`,
    description: `Si des travaux ont été votés avant la vente, c'est l'acheteur qui paie les appels de fonds restants. Comment en tenir compte pour négocier le prix. Guide 2026.`,
  },

  title: `Travaux votés en AG : un levier de négociation souvent ignoré`,
  subtitle: `Si des travaux ont été votés avant la vente, l'acheteur paie les appels de fonds. Comment en tenir compte.`,

  intro: `Un ravalement voté en AG il y a 6 mois, avec 3 appels de fonds restants. Un changement de chaudière prévu sur 2 ans. Une mise aux normes d'ascenseur étalée sur 4 trimestres. Tous ces montants, c'est vous qui les paierez — même si vous n'avez jamais voté pour.

C'est la règle en copropriété : les appels de fonds émis après la date de vente sont à la charge de l'acheteur. Le vendeur paie ce qui a été appelé avant, vous payez le reste. Et la plupart des acheteurs ne le découvrent qu'après avoir signé.

Pourtant, c'est un levier de négociation redoutable — parce que les chiffres sont dans les documents, noir sur blanc.`,

  sections: [
    {
      id: 'regle-repartition',
      title: `La règle de répartition`,
      content: `Le principe est simple et ne souffre pas d'exception :`,
      bullets: [
        `Les appels de fonds déjà émis (envoyés par le syndic) avant la signature de l'acte de vente → le vendeur paie`,
        `Les appels de fonds émis après la signature → l'acheteur paie`,
        `C'est la date d'émission de l'appel qui compte, pas la date du vote en AG`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le piège`,
        content: `Un vote en AG de janvier 2026 avec des appels de fonds trimestriels en avril, juillet, octobre 2026 et janvier 2027. Si vous achetez en juin 2026, vous payez les 3 derniers appels — soit les trois quarts du montant total. Le vendeur n'a payé qu'un seul appel sur quatre.`,
      },
    },
    {
      id: 'trouver-montants',
      title: `Où trouver les montants exacts`,
      content: `Trois documents vous donnent l'information :`,
      bullets: [
        `L'état daté (partie 3) — c'est le document le plus fiable. Il liste précisément les sommes restant à appeler, avec les montants et l'échéancier`,
        `Le PV d'AG — cherchez les résolutions de travaux votées. Le montant total, le nombre d'appels et les dates y sont mentionnés`,
        `Le pré-état daté — si vous l'avez avant le compromis, il donne déjà une estimation des montants à venir`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le calcul à faire`,
        content: `Prenez le montant total des travaux votés, identifiez votre quote-part (vos tantièmes ÷ tantièmes totaux × montant), puis soustrayez les appels déjà émis. Le reste, c'est ce que vous paierez.`,
      },
    },
    {
      id: 'types-travaux',
      title: `Les travaux les plus courants et leurs montants`,
      content: `Pour un immeuble de 30 lots, voici les ordres de grandeur de votre quote-part :`,
      bullets: [
        `Ravalement de façade — 5 000 à 12 000 € par lot`,
        `Réfection de toiture — 2 500 à 7 000 € par lot`,
        `Remplacement de chaudière collective — 1 500 à 5 000 € par lot`,
        `Mise aux normes ascenseur — 1 000 à 3 000 € par lot`,
        `Réfection des parties communes — 500 à 2 000 € par lot`,
      ],
    },
    {
      id: 'negocier',
      title: `Comment négocier avec ces chiffres`,
      content: `La méthode en 4 étapes :`,
      numberedList: [
        `Identifiez tous les travaux votés dans les PV des 3 dernières années`,
        `Relevez dans l'état daté le montant exact des appels restants pour votre lot`,
        `Présentez le total au vendeur : "en plus du prix d'achat, je dois prévoir X € d'appels de fonds sur les travaux déjà votés"`,
        `Proposez soit une baisse de prix du même montant, soit une clause dans le compromis où le vendeur prend en charge une partie des appels`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `La formulation qui marche`,
        content: `"J'ai analysé les PV et l'état daté. Il reste 7 200 € d'appels de fonds sur le ravalement et la chaudière. C'est un coût que je dois intégrer à mon budget global. Je propose de baisser mon offre de 5 000 € pour en tenir compte." — factuel, raisonnable, difficile à contester.`,
      },
    },
    {
      id: 'travaux-prevus',
      title: `Et les travaux pas encore votés ?`,
      content: `Les travaux votés sont un argument factuel — les chiffres sont dans l'état daté. Les travaux prévus mais pas encore votés sont un argument plus souple mais tout aussi valable :`,
      bullets: [
        `Vérifiez le PPPT — il liste les travaux sur 10 ans avec des estimations`,
        `Regardez dans les PV si des sujets de travaux sont "mis à l'étude" ou "reportés à la prochaine AG"`,
        `Si le DPE collectif est mauvais (F ou G), des travaux de rénovation énergétique vont devenir inévitables`,
        `Présentez ces éléments comme un risque futur : "le PPPT prévoit un ravalement dans 2 ans estimé à 180 000 €. Le fonds de travaux ne contient que 12 000 €. Il faudra des appels de fonds importants"`,
      ],
    },
    {
      id: 'clause-compromis',
      title: `La clause à demander dans le compromis`,
      content: `En plus de la négociation sur le prix, vous pouvez demander une clause spécifique dans le compromis :`,
      bullets: [
        `"Les appels de fonds relatifs aux travaux votés en AG du [date] et émis dans les X mois suivant la vente restent à la charge du vendeur" — ça vous protège contre les appels qui tombent juste après la signature`,
        `Le vendeur n'est pas obligé d'accepter, mais beaucoup le font pour débloquer la vente`,
        `Le notaire peut vous conseiller sur la rédaction de cette clause`,
      ],
    },
  ],

  conclusion: `Les travaux votés en AG sont le levier de négociation le plus sous-utilisé par les acheteurs. Les chiffres sont dans les documents, ils sont factuels, et le vendeur ne peut pas les contester — c'est sa propre copropriété qui les a votés.

Prenez 5 minutes pour lire l'état daté et les PV d'AG. Chaque euro d'appel de fonds que vous repérez est un euro que vous pouvez déduire de votre offre.`,

  cta: {
    title: `Des travaux votés dans vos documents ?`,
    description: `Verimo détecte automatiquement les appels de fonds à venir et les intègre dans votre rapport avec le montant exact de votre quote-part.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'appels-fonds-exceptionnels-documents',
    'arguments-negociation-documents-copropriete',
    'etat-date-document-vendeur',
    'analyser-pv-ag-avant-achat',
  ],
};

export default article;

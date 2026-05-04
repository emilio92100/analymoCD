/**
 * Guide : 5 arguments de négociation cachés dans les documents de copropriété
 * Catégorie : Acheteurs > Négociation
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'arguments-negociation-documents-copropriete',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `5 arguments de négociation cachés dans les documents de copropriété — Guide Verimo`,
    description: `Travaux votés, charges en hausse, impayés, DPE dégradé — des leviers de négociation que la plupart des acheteurs ignorent. Guide pratique 2026.`,
  },

  title: `5 arguments de négociation cachés dans les documents de copropriété`,
  subtitle: `Travaux votés, charges en hausse, impayés, DPE dégradé — des leviers que la plupart des acheteurs ignorent.`,

  intro: `Négocier le prix d'un bien immobilier, ce n'est pas juste dire "je trouve ça trop cher". Les vendeurs et les agents entendent ça 10 fois par jour — ça ne marche pas.

Ce qui marche, c'est d'arriver avec des chiffres. Et ces chiffres, ils sont dans les documents de copropriété. Le PV d'AG, l'état daté, le DPE, le PPPT — ce sont des mines d'arguments concrets que le vendeur ne peut pas contester parce que ce sont ses propres documents.

Voici les 5 leviers les plus puissants — et comment les utiliser.`,

  sections: [
    {
      id: 'travaux-votes',
      title: `1. Les travaux votés que vous allez payer`,
      content: `C'est l'argument le plus puissant. Quand des travaux ont été votés en AG, les appels de fonds postérieurs à la vente sont à votre charge. Et ces montants sont chiffrés noir sur blanc dans l'état daté.

Comment l'utiliser :`,
      bullets: [
        `Relevez le montant exact des appels de fonds restants dans l'état daté (partie 3)`,
        `Présentez-le au vendeur : "il reste 6 800 € d'appels de fonds sur le ravalement. C'est de l'argent que je vais devoir sortir en plus du prix d'achat"`,
        `Demandez une baisse de prix équivalente ou proposez que le vendeur prenne en charge une partie via une clause dans le compromis`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Pourquoi ça marche`,
        content: `Le vendeur ne peut pas contester — c'est un fait comptable, pas une opinion. Et tous les acheteurs potentiels verront le même chiffre. Le vendeur sait que s'il refuse de baisser avec vous, le prochain acheteur fera le même calcul.`,
      },
    },
    {
      id: 'charges-elevees',
      title: `2. Des charges supérieures à la moyenne`,
      content: `Si les charges de la copropriété sont au-dessus de la moyenne du quartier, c'est un argument de négociation légitime. Des charges élevées réduisent la rentabilité pour un investisseur et le pouvoir d'achat pour un occupant.

Comment l'utiliser :`,
      bullets: [
        `Calculez les charges au m²/an (charges annuelles ÷ surface)`,
        `Comparez avec la moyenne de la ville ou du quartier (35-55 €/m²/an pour un immeuble standard)`,
        `Chiffrez le surcoût annuel par rapport à un bien comparable : "les charges sont 1 500 €/an au-dessus de la moyenne, soit 15 000 € sur 10 ans"`,
        `Proposez une décote proportionnelle`,
      ],
    },
    {
      id: 'dpe-mauvais',
      title: `3. Un DPE dégradé (E, F ou G)`,
      content: `Un mauvais DPE, c'est un triple argument :`,
      bullets: [
        `Des factures d'énergie plus élevées — chiffrez la différence annuelle entre la classe actuelle et un logement en D. Sur 10 ans, ça peut représenter 10 000 à 25 000 €`,
        `Des travaux de rénovation à prévoir — isolation, fenêtres, chauffage. Chiffrez avec les estimations de l'audit énergétique s'il existe`,
        `Des contraintes légales pour la location — un F ne pourra plus être loué en 2028, un G ne peut déjà plus l'être. Le bassin d'acheteurs-investisseurs se réduit chaque année`,
      ],
      highlight: {
        type: 'info' as const,
        title: `L'argument qui fait mouche`,
        content: `"Le DPE est en F. Pour le passer en D, l'audit estime 22 000 € de travaux. Même avec les aides (environ 10 000 €), il me reste 12 000 € à ma charge. Je baisse mon offre de 10 000 €." C'est concret, chiffré, et le vendeur voit que vous avez fait vos devoirs.`,
      },
    },
    {
      id: 'impayes',
      title: `4. Un taux d'impayés élevé`,
      content: `Un immeuble avec des impayés importants, c'est un immeuble fragile financièrement. Les charges risquent d'augmenter pour compenser, les travaux sont repoussés, et la valeur des lots baisse.

Comment l'utiliser :`,
      bullets: [
        `Relevez le taux d'impayés dans le PV d'AG ou la fiche synthétique`,
        `Montrez l'évolution sur 3 ans — si ça monte, le risque augmente`,
        `Argumentez : "le taux d'impayés est à 18 % et en hausse. Les charges vont probablement augmenter de 5 à 10 % par an pour compenser. Sur 10 ans, c'est un surcoût que je dois prendre en compte"`,
        `Demandez une décote pour compenser le risque financier`,
      ],
    },
    {
      id: 'pppt-travaux',
      title: `5. Le PPPT prévoit des travaux importants`,
      content: `Le PPPT liste les travaux sur 10 ans avec un chiffrage estimatif. Si le plan prévoit un ravalement à 250 000 € dans 3 ans et que le fonds de travaux ne contient que 15 000 €, la différence sera financée par des appels de fonds.

Comment l'utiliser :`,
      bullets: [
        `Listez les travaux prévus dans les 5 prochaines années du PPPT`,
        `Estimez votre quote-part en fonction de vos tantièmes`,
        `Soustrayez ce que le fonds de travaux couvre déjà`,
        `Le reste, c'est ce que vous allez payer — et c'est un argument de négociation`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Attention`,
        content: `Le PPPT contient des estimations, pas des montants définitifs. Les vrais devis seront votés en AG et peuvent différer. Mais le PPPT donne un ordre de grandeur fiable — et le vendeur ne peut pas nier son existence puisque c'est un document officiel de la copro.`,
      },
    },
    {
      id: 'methode',
      title: `La méthode complète`,
      content: `Pour maximiser votre négociation, combinez les arguments. Un seul point faible, ça se discute. Trois ou quatre points factuels combinés, ça devient difficile à contester.`,
      numberedList: [
        `Lisez tous les documents — PV d'AG, état daté, DPE, PPPT, fiche synthétique`,
        `Notez chaque point négatif avec un chiffre associé`,
        `Additionnez les montants : appels de fonds + surcoût charges + travaux DPE + risque impayés`,
        `Présentez le total au vendeur : "au-delà du prix, j'ai identifié X € de coûts supplémentaires dans les documents"`,
        `Proposez une baisse raisonnable — ne demandez pas 100 % du montant, visez 50 à 70 %. Le vendeur doit sentir que c'est juste, pas qu'il se fait arnaquer`,
      ],
    },
  ],

  conclusion: `La négociation immobilière se gagne dans les documents, pas dans la discussion. Un acheteur qui arrive avec des chiffres tirés des PV d'AG, de l'état daté et du DPE négocie en position de force. Le vendeur ne peut pas contester ses propres documents.

Prenez le temps de lire. Chiffrez. Et arrivez préparé.`,

  cta: {
    title: `Envie de négocier avec des arguments solides ?`,
    description: `Verimo analyse vos documents et identifie automatiquement les leviers de négociation : travaux votés, charges anormales, DPE dégradé, impayés.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'utiliser-dpe-negocier-prix',
    'appels-fonds-exceptionnels-documents',
    'charges-copropriete-trop-elevees',
    'analyser-pv-ag-avant-achat',
  ],
};

export default article;

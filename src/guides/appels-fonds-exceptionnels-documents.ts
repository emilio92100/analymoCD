/**
 * Guide : Appels de fonds exceptionnels — comment les repérer dans les documents
 * Catégorie : Copropriété > Finances & Charges
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'appels-fonds-exceptionnels-documents',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 7,

  seo: {
    title: `Appels de fonds copropriété : comment les repérer avant d'acheter — Guide Verimo`,
    description: `Travaux votés, ravalement, toiture — comment anticiper les appels de fonds exceptionnels qui viendront après votre achat en copropriété. Guide 2026.`,
  },

  title: `Appels de fonds exceptionnels : comment les repérer dans les documents`,
  subtitle: `Travaux votés, ravalement, toiture — comment anticiper les dépenses qui viendront après votre achat.`,

  intro: `Vous achetez un appartement à 250 000 €. Vous avez calculé les charges mensuelles, les frais de notaire, les mensualités du crédit. Tout rentre dans votre budget. Et puis, 3 mois après la signature, vous recevez un courrier du syndic : appel de fonds exceptionnel de 6 500 € pour le ravalement de façade voté il y a 18 mois.

Ce scénario arrive plus souvent qu'on ne croit. Et il est parfaitement légal : les appels de fonds postérieurs à la vente sont à la charge de l'acheteur, même si les travaux ont été votés avant l'achat.

La bonne nouvelle : tout est écrit dans les documents. Il suffit de savoir où chercher.`,

  sections: [
    {
      id: 'comment-ca-marche',
      title: `Comment fonctionnent les appels de fonds`,
      content: `Quand la copropriété vote des travaux en AG, le financement est étalé sur plusieurs appels de fonds — souvent 3 à 6 appels trimestriels ou semestriels.

Le principe de répartition entre vendeur et acheteur est simple :`,
      bullets: [
        `Les appels de fonds déjà émis avant la vente — c'est le vendeur qui les paie`,
        `Les appels de fonds émis après la date de vente — c'est l'acheteur qui les paie`,
        `La date qui compte, c'est celle de l'émission de l'appel, pas celle du vote des travaux en AG`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le piège classique`,
        content: `Des travaux votés en mars 2025 avec 4 appels de fonds trimestriels. Le premier appel est en avril 2025, le dernier en janvier 2026. Si vous achetez en septembre 2025, vous payez les 2 derniers appels — même si vous n'avez jamais voté pour ces travaux.`,
      },
    },
    {
      id: 'ou-chercher',
      title: `Où trouver l'information dans les documents`,
      content: `Trois documents vous donnent les appels de fonds à prévoir :`,
      subsections: [
        {
          title: `L'état daté (ou le pré-état daté)`,
          content: `C'est le document le plus fiable. La troisième partie de l'état daté liste précisément les sommes restant à appeler sur les travaux votés. Montant total, nombre d'appels restants, échéancier. C'est là que vous trouvez le chiffre exact.`,
        },
        {
          title: `Les PV d'assemblée générale`,
          content: `Cherchez toutes les résolutions de travaux votées dans les 2-3 derniers PV. Pour chaque travaux voté, notez : le montant total, le nombre d'appels prévus, et les dates. Croisez avec l'état daté pour savoir ce qui a déjà été payé par le vendeur et ce qui reste.`,
        },
        {
          title: `Le PPPT (Plan Pluriannuel de Travaux)`,
          content: `Le PPPT liste les travaux prévus sur 10 ans. Certains ne sont pas encore votés mais vont probablement l'être. Ce ne sont pas encore des appels de fonds, mais c'est une projection de ce qui vous attend.`,
        },
      ],
    },
    {
      id: 'types-travaux',
      title: `Les travaux qui génèrent les plus gros appels`,
      content: `Certains travaux de copropriété sont particulièrement coûteux. Voici les ordres de grandeur pour un immeuble de 30 lots :`,
      bullets: [
        `Ravalement de façade — 150 000 à 350 000 € pour l'immeuble, soit 5 000 à 12 000 € par lot`,
        `Réfection de toiture — 80 000 à 200 000 €, soit 2 500 à 7 000 € par lot`,
        `Remplacement de la chaudière collective — 50 000 à 150 000 €, soit 1 500 à 5 000 € par lot`,
        `Mise aux normes ou remplacement d'ascenseur — 30 000 à 80 000 €, soit 1 000 à 2 700 € par lot`,
        `Réfection des parties communes (hall, escaliers, couloirs) — 20 000 à 60 000 €, soit 700 à 2 000 € par lot`,
        `Mise en conformité électrique des parties communes — 10 000 à 30 000 €, soit 300 à 1 000 € par lot`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Votre quote-part dépend de vos tantièmes, pas du nombre de lots. Un grand appartement avec beaucoup de tantièmes paiera proportionnellement plus qu'un studio. Vérifiez vos tantièmes dans le règlement de copropriété.`,
      },
    },
    {
      id: 'travaux-pas-votes',
      title: `Les travaux pas encore votés mais qui arrivent`,
      content: `C'est la partie la plus difficile à anticiper. Certains signaux dans les documents indiquent que des travaux vont être votés prochainement :`,
      bullets: [
        `Le sujet est "mis à l'étude" dans le PV d'AG — le syndic a demandé des devis, la discussion est lancée`,
        `Le PPPT prévoit des travaux dans les 2-3 ans — le plan existe, il ne manque plus que le vote`,
        `Le DPE collectif est mauvais (F ou G) — des travaux de rénovation énergétique vont devenir inévitables`,
        `Un arrêté municipal de ravalement a été notifié — la copro a un délai (souvent 1 an) pour se mettre en conformité`,
        `Des désordres sont signalés dans le PV — infiltrations, fissures, problèmes structurels mentionnés par un copropriétaire ou le syndic`,
      ],
    },
    {
      id: 'negocier',
      title: `Comment utiliser ces infos pour négocier`,
      content: `Les appels de fonds à venir sont un argument de négociation puissant :`,
      numberedList: [
        `Listez tous les appels de fonds restants dans l'état daté — c'est de l'argent que vous allez sortir en plus du prix d'achat`,
        `Ajoutez les travaux prévus dans le PPPT pour les 3 prochaines années — estimez votre quote-part`,
        `Présentez le total au vendeur — "en plus du prix, je vais devoir payer X € de travaux. Je baisse mon offre d'autant"`,
        `Si le vendeur refuse de baisser, demandez une clause dans le compromis — par exemple que les appels de fonds émis dans les 6 mois suivant la vente restent à sa charge`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Astuce`,
        content: `Un vendeur pressé de vendre acceptera plus facilement une négociation sur les appels de fonds qu'une baisse de prix sèche. C'est psychologiquement plus facile pour lui de "prendre en charge les travaux" que de "baisser son prix".`,
      },
    },
    {
      id: 'checklist',
      title: `Votre checklist appels de fonds`,
      content: `Avant de signer, vérifiez ces points :`,
      numberedList: [
        `Y a-t-il des travaux votés dans les PV des 3 dernières années ?`,
        `Combien d'appels de fonds restent à émettre ? (état daté, partie 3)`,
        `Quel est le montant total de votre quote-part restante ?`,
        `Le PPPT prévoit-il des travaux dans les 3 ans ?`,
        `Y a-t-il des sujets de travaux "mis à l'étude" dans le dernier PV ?`,
        `Le fonds de travaux est-il suffisant pour absorber une partie ?`,
        `Avez-vous intégré ces montants dans votre budget d'achat ?`,
      ],
    },
  ],

  conclusion: `Les appels de fonds exceptionnels, c'est la surprise financière n°1 des acheteurs en copropriété. Pourtant, l'information est toujours dans les documents — état daté, PV d'AG, PPPT. Il suffit de regarder.

Demandez ces documents, repérez les montants, et intégrez-les dans votre calcul. Un appartement qui "coûte" 250 000 € mais qui vient avec 10 000 € de travaux à payer, ça coûte en réalité 260 000 €.`,

  cta: {
    title: `Des travaux votés dans vos documents ?`,
    description: `Verimo détecte automatiquement les appels de fonds à venir dans vos PV d'AG et votre état daté, et les intègre dans votre rapport d'analyse.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'etat-date-document-vendeur',
    'pre-etat-date-avant-compromis',
    'analyser-pv-ag-avant-achat',
    'charges-copropriete-trop-elevees',
  ],
};

export default article;

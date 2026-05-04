/**
 * Guide : Comment utiliser le DPE pour négocier le prix d'achat
 * Catégorie : Acheteurs > Négociation
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'utiliser-dpe-negocier-prix',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 6,

  seo: {
    title: `Comment utiliser le DPE pour négocier le prix d'achat immobilier — Guide Verimo`,
    description: `Un DPE F ou G peut justifier une décote de 5 à 15 %. Comment chiffrer les travaux, calculer le surcoût énergétique et argumenter face au vendeur. Guide 2026.`,
  },

  title: `Comment utiliser le DPE pour négocier le prix d'achat`,
  subtitle: `Un DPE F ou G peut justifier une décote de 5 à 15 %. Comment argumenter face au vendeur.`,

  intro: `Le DPE est devenu l'un des critères les plus importants du marché immobilier. Les études montrent qu'un logement classé F ou G se vend en moyenne 5 à 15 % moins cher qu'un bien équivalent classé D ou C. Et plus les réglementations se durcissent (interdiction de location, audit obligatoire), plus cette décote s'accentue.

Mais beaucoup d'acheteurs n'osent pas utiliser le DPE comme argument de négociation. Soit parce qu'ils ne savent pas comment, soit parce qu'ils ont peur de "braquer" le vendeur. Ce guide vous donne la méthode, les chiffres, et les formulations.`,

  sections: [
    {
      id: 'decote-marche',
      title: `La décote liée au DPE : ce que disent les chiffres`,
      content: `Les notaires et les observatoires immobiliers publient régulièrement des données sur l'impact du DPE sur les prix. En 2026, les tendances sont claires :`,
      bullets: [
        `Classe G — décote moyenne de 10 à 20 % par rapport à un bien en D dans la même zone. Plus on approche de 2028 (interdiction de location des F), plus la décote des G s'accentue`,
        `Classe F — décote de 5 à 15 %. Le marché anticipe l'interdiction de location de 2028`,
        `Classe E — décote de 2 à 8 %. Moins marquée car l'échéance est lointaine (2034), mais le marché commence à intégrer le signal`,
        `Classe D — pas de décote significative. C'est le seuil de confort pour les investisseurs`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `La décote varie fortement selon les marchés. Dans les zones tendues (Paris, Lyon, Bordeaux), la demande reste forte même pour les passoires thermiques — la décote est plus faible. Dans les zones moins tendues, un DPE G peut rester des mois sans acheteur et la décote atteint 20 %.`,
      },
    },
    {
      id: 'argument-1',
      title: `Argument 1 : le coût des travaux de rénovation`,
      content: `C'est l'argument le plus direct. Pour passer d'un DPE F à un DPE D, il faut des travaux — et ces travaux ont un coût chiffrable.

La méthode :`,
      numberedList: [
        `Si un audit énergétique existe (obligatoire pour les E, F, G en monopropriété), prenez les scénarios de travaux proposés`,
        `Si vous n'avez que le DPE, utilisez les recommandations de travaux qu'il contient`,
        `Chiffrez le coût brut des travaux (isolation, fenêtres, chauffage)`,
        `Déduisez les aides (MaPrimeRénov, CEE, éco-PTZ) pour obtenir le reste à charge`,
        `Présentez le reste à charge au vendeur comme base de négociation`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Exemple`,
        content: `"L'audit prévoit 28 000 € de travaux pour passer en D. Avec les aides, il me reste 14 000 € à charge. Je propose de baisser le prix de 10 000 € pour en tenir compte." Le vendeur peut contester le montant exact, mais pas le principe.`,
      },
    },
    {
      id: 'argument-2',
      title: `Argument 2 : le surcoût énergétique annuel`,
      content: `Un logement classé F ou G coûte bien plus cher en énergie qu'un logement en D. Et cette différence se chiffre.

Prenez les estimations de consommation du DPE (en kWh/m²/an) et comparez :`,
      bullets: [
        `Classe D — environ 180-250 kWh/m²/an. Pour un 60 m² chauffé au gaz, comptez 1 000 à 1 500 €/an`,
        `Classe F — environ 330-420 kWh/m²/an. Même logement : 2 000 à 3 000 €/an`,
        `Différence — 1 000 à 1 500 €/an. Sur 10 ans, c'est 10 000 à 15 000 €`,
      ],
      content: `Présentez ce chiffre au vendeur : "sur 10 ans, le surcoût énergétique par rapport à un bien en D représente 12 000 €. C'est un coût que l'acheteur doit intégrer."`,
    },
    {
      id: 'argument-3',
      title: `Argument 3 : les contraintes légales`,
      content: `Si le vendeur vise un investisseur (location), les contraintes DPE sont un argument massif :`,
      bullets: [
        `Un bien en G ne peut plus être loué depuis janvier 2025 — le bassin d'acheteurs-investisseurs est déjà réduit`,
        `Un bien en F ne pourra plus être loué à partir de 2028 — dans 2 ans, même contrainte`,
        `Les loyers des F et G sont gelés — aucune augmentation possible tant que le bien n'est pas rénové`,
        `L'acheteur qui veut louer devra rénover avant de toucher un loyer — c'est un investissement supplémentaire avec un délai de rentabilité`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `L'argument qui pique`,
        content: `"En l'état, ce bien ne peut pas être loué (classe G). Le seul acheteur possible est un occupant ou quelqu'un prêt à investir dans des travaux. Ça réduit la demande — et la demande, c'est ce qui fait le prix."`,
      },
    },
    {
      id: 'argument-4',
      title: `Argument 4 : la comparaison avec le marché`,
      content: `Comparez le prix au m² du bien avec des biens similaires mieux classés dans le même quartier. Les annonces sur SeLoger, LeBonCoin ou les bases notariales donnent des prix au m² par classe DPE.

Si un bien en D se vend 5 500 €/m² dans le quartier et que le vendeur demande 5 200 €/m² pour un bien en F, la décote est de 5 % — ce qui est le minimum. Vous pouvez argumenter pour 10 à 15 %.`,
    },
    {
      id: 'formulations',
      title: `Comment formuler la négociation`,
      content: `Le ton compte. Voici des formulations qui fonctionnent :`,
      bullets: [
        `"J'ai analysé le DPE et les travaux nécessaires. Pour passer en D, il faut environ X €. Je souhaite en tenir compte dans mon offre" — factuel, pas agressif`,
        `"Le bien me plaît, mais le DPE en F implique des contraintes que je dois intégrer dans mon budget. Je propose X € au lieu de Y €" — montre que vous êtes intéressé mais réaliste`,
        `"Je suis prêt à m'engager rapidement à X €, travaux inclus dans mon calcul. C'est une offre sérieuse qui tient compte de l'état énergétique" — montre que vous êtes un acheteur concret, pas un touriste`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le ton juste`,
        content: `Ne dites jamais "c'est une passoire thermique, personne n'en veut". Le vendeur se braquera. Restez factuel et montrez que vous voulez acheter — mais au juste prix.`,
      },
    },
  ],

  conclusion: `Le DPE n'est pas juste une étiquette colorée — c'est un outil de négociation. Les travaux à prévoir, le surcoût énergétique, les contraintes légales et la comparaison au marché sont quatre arguments factuels que le vendeur ne peut pas ignorer.

Arrivez préparé, avec des chiffres. Un vendeur face à un acheteur qui a fait ses calculs négocie. Un vendeur face à un acheteur qui dit "c'est trop cher" sans argument ne bouge pas.`,

  cta: {
    title: `Besoin de chiffres pour négocier ?`,
    description: `Verimo analyse votre DPE avec tous vos documents et identifie les leviers de négociation concrets : travaux, surcoût, contraintes légales.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'dpe-comment-lire-avant-achat',
    'passoire-thermique-fuir-negocier',
    'arguments-negociation-documents-copropriete',
    'audit-energetique-difference-dpe',
  ],
};

export default article;

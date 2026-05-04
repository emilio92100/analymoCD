/**
 * Guide : DPE — comment le lire et quoi en tirer avant d'acheter
 * Catégorie : Diagnostics > Performance énergétique
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'dpe-comment-lire-avant-achat',
  category: 'diagnostics',
  categoryLabel: 'Diagnostics',
  categoryIcon: '🔍',
  categoryColor: '#d97706',
  tag: 'Essentiel',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 8,

  seo: {
    title: `DPE : comment le lire et quoi en tirer avant d'acheter — Guide Verimo`,
    description: `Classe énergétique, consommation, GES, recommandations de travaux : tout comprendre du DPE pour acheter en connaissance de cause. Guide pratique 2026.`,
  },

  title: `DPE : comment le lire et quoi en tirer avant d'acheter`,
  subtitle: `Classes énergétiques, consommation estimée, recommandations de travaux — tout comprendre du DPE pour ne pas acheter à l'aveugle.`,

  docInfo: {
    emoji: '⚡',
    label: `DPE`,
    definition: `Le Diagnostic de Performance Énergétique évalue la consommation d'énergie et les émissions de gaz à effet de serre d'un logement. Il attribue une classe de A (très performant) à G (passoire thermique). Obligatoire pour toute vente ou mise en location.`,
  },

  intro: `Le DPE, tout le monde en a entendu parler. C'est la petite étiquette colorée sur les annonces immobilières, de A (en vert) à G (en rouge). Mais entre voir la lettre et comprendre ce qu'elle implique vraiment pour votre achat, il y a un fossé.

Un DPE E, ça veut dire quoi concrètement ? Combien ça va vous coûter en chauffage ? Est-ce que vous pourrez louer le bien un jour ? Et surtout : est-ce que c'est un levier pour négocier le prix ?

Ce guide vous explique comment lire un DPE, quoi en tirer, et ce qui a changé en 2026.`,

  sections: [
    {
      id: 'deux-etiquettes',
      title: `Les deux étiquettes du DPE`,
      content: `Le DPE contient deux classements distincts, et beaucoup de gens ne regardent que le premier :`,
      subsections: [
        {
          title: `L'étiquette énergie (A à G)`,
          content: `C'est celle qu'on voit partout. Elle mesure la consommation d'énergie primaire du logement en kWh/m²/an. Un logement classé A consomme moins de 70 kWh/m²/an, un logement classé G dépasse les 420 kWh/m²/an.

Pour vous donner un ordre d'idée : un appartement de 60 m² classé D (entre 180 et 250 kWh/m²/an) coûte environ 1 000 à 1 500 € de chauffage par an. Le même en classe G, c'est facilement 2 500 à 4 000 €.`,
        },
        {
          title: `L'étiquette climat (émissions de CO2)`,
          content: `Moins connue mais tout aussi importante. Elle mesure les émissions de gaz à effet de serre en kg CO2/m²/an. Depuis la refonte du DPE en 2021, c'est le pire des deux classements qui détermine la classe finale du logement.

Concrètement, un logement peut être correct en consommation mais mauvais en émissions (chauffage au fioul par exemple) — et se retrouver classé F quand même.`,
        },
      ],
      highlight: {
        type: 'tip' as const,
        title: `Astuce`,
        content: `Regardez toujours les deux étiquettes. Un logement chauffé au gaz ou au fioul peut avoir une mauvaise étiquette climat même avec une consommation raisonnable. Passer à une pompe à chaleur ou au bois peut changer la classe sans gros travaux d'isolation.`,
      },
    },
    {
      id: 'comprendre-chiffres',
      title: `Ce que les chiffres du DPE veulent dire`,
      content: `Au-delà de la lettre, le DPE donne des chiffres concrets qui méritent votre attention :`,
      bullets: [
        `La consommation estimée en kWh/m²/an — c'est le chiffre brut. Multipliez-le par la surface et par le prix du kWh de votre énergie pour avoir une idée du budget chauffage annuel`,
        `Le montant estimé des factures — depuis 2021, le DPE affiche une fourchette de coût annuel en euros. C'est une estimation, pas une garantie, mais ça donne un repère`,
        `Les déperditions thermiques — le DPE indique par où la chaleur s'échappe : toiture, murs, fenêtres, plancher, ventilation. C'est une info précieuse pour savoir quels travaux prioriser`,
        `Les recommandations de travaux — le diagnostiqueur propose des améliorations avec une estimation des gains. Ce n'est pas contraignant, mais ça vous donne une base pour chiffrer`,
      ],
    },
    {
      id: 'impact-achat',
      title: `Ce que le DPE change pour votre achat en 2026`,
      content: `Le DPE n'est plus juste un document informatif. Depuis la loi Climat et Résilience de 2021, il a des conséquences directes :`,
      bullets: [
        `Les logements classés G sont interdits à la location depuis le 1er janvier 2025. Si vous achetez pour louer, un G ne peut plus être mis en location sans travaux`,
        `Les logements classés F seront interdits à la location à partir du 1er janvier 2028`,
        `Les logements classés E seront interdits à la location à partir du 1er janvier 2034`,
        `Pour vendre une maison ou un immeuble classé E, F ou G, le vendeur doit fournir un audit énergétique en plus du DPE depuis janvier 2025`,
        `Les loyers des logements F et G sont gelés — aucune augmentation possible tant que le bien n'est pas rénové`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Si vous achetez un appartement classé F pour le louer, vous avez jusqu'au 1er janvier 2028 pour le rénover. Après cette date, vous ne pourrez plus signer de bail ni renouveler un bail existant. Intégrez le coût des travaux dans votre calcul.`,
      },
    },
    {
      id: 'dpe-collectif',
      title: `DPE collectif : ce qui change en 2026`,
      content: `En plus du DPE individuel de chaque logement, les copropriétés doivent maintenant disposer d'un DPE collectif qui évalue la performance de l'immeuble entier.

Depuis le 1er janvier 2026, cette obligation concerne toutes les copropriétés, y compris celles de moins de 50 lots. Avant, seules les grosses copros (plus de 200 lots depuis 2024, 50-200 lots depuis 2025) étaient concernées.

Le DPE collectif ne remplace pas le DPE individuel — les deux coexistent. Mais le DPE collectif donne une vision de la performance de l'immeuble dans son ensemble et sert de base au PPPT (le plan de travaux sur 10 ans).`,
      highlight: {
        type: 'info' as const,
        title: `Ce que ça change pour vous`,
        content: `Demandez au vendeur ou au syndic le DPE collectif. Si l'immeuble est classé E, F ou G au niveau collectif, des travaux de rénovation vont probablement être votés — isolation des façades, changement de chaudière, etc. Ça veut dire des appels de fonds à prévoir.`,
      },
    },
    {
      id: 'negocier-dpe',
      title: `Utiliser le DPE pour négocier le prix`,
      content: `Un mauvais DPE, c'est un levier de négociation. Les études montrent qu'un logement classé F ou G se vend en moyenne 5 à 15 % moins cher qu'un logement équivalent bien classé. Et c'est logique : l'acheteur va devoir investir dans des travaux.

Pour négocier efficacement :`,
      bullets: [
        `Chiffrez les travaux nécessaires pour passer au moins en classe D — demandez des devis ou utilisez les estimations de l'audit énergétique si le vendeur en a un`,
        `Calculez le surcoût énergétique annuel — la différence de facture entre la classe actuelle et la classe D sur 10 ans, c'est un argument concret`,
        `Rappelez les contraintes légales — si le bien est en F ou G, le vendeur sait que son bassin d'acheteurs-investisseurs se réduit chaque année`,
        `Comparez avec des biens similaires mieux classés dans le quartier — les prix au m² parlent d'eux-mêmes`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Bon à savoir`,
        content: `Un mauvais DPE n'est pas forcément rédhibitoire. Si le prix est ajusté et que les travaux sont faisables (changement de fenêtres, isolation des combles, pompe à chaleur), vous pouvez faire une très bonne affaire — surtout avec les aides type MaPrimeRénov.`,
      },
    },
    {
      id: 'pieges-dpe',
      title: `Les pièges à connaître`,
      content: `Le DPE n'est pas parfait. Quelques points à garder en tête :`,
      bullets: [
        `C'est une estimation théorique — le DPE se base sur un calcul conventionnel, pas sur votre consommation réelle. Deux familles dans le même logement n'auront pas la même facture`,
        `Le mode de calcul a changé en 2021 — les DPE réalisés avant juillet 2021 ne sont plus valables. Si le vendeur vous montre un ancien DPE, exigez un nouveau`,
        `La qualité du diagnostic varie — tous les diagnostiqueurs ne sont pas aussi rigoureux. Un DPE bâclé peut surévaluer ou sous-évaluer la performance réelle du logement`,
        `Un DPE individuel peut différer du DPE collectif — votre appartement peut être en D alors que l'immeuble est en F, ou l'inverse. Les deux informations comptent`,
      ],
    },
    {
      id: 'checklist-dpe',
      title: `Votre checklist DPE`,
      content: `Avant de faire une offre, vérifiez ces points sur le DPE :`,
      numberedList: [
        `Quelle est la classe énergie ET la classe climat ? Regardez les deux`,
        `Quel est le montant estimé des factures annuelles ?`,
        `Par où s'échappe la chaleur ? Toiture, murs, fenêtres, ventilation ?`,
        `Si c'est un F ou G : êtes-vous prêt à faire les travaux ? Avez-vous chiffré le budget ?`,
        `Si c'est pour louer : le bien respecte-t-il les seuils de décence énergétique ?`,
        `Le DPE date-t-il de moins de 10 ans ? A-t-il été réalisé après juillet 2021 ?`,
        `Le DPE collectif de l'immeuble existe-t-il ? Quelle est sa classe ?`,
      ],
    },
  ],

  conclusion: `Le DPE est devenu bien plus qu'une simple étiquette. C'est un outil qui impacte directement la valeur du bien, votre capacité à le louer, et votre budget énergie pour les années à venir.

Ne vous arrêtez pas à la lettre. Lisez les chiffres, comprenez les déperditions, et surtout utilisez-le comme levier dans votre négociation. Un mauvais DPE bien compris vaut parfois mieux qu'un bon DPE qu'on n'a pas regardé.`,

  cta: {
    title: `Un DPE dans votre dossier ?`,
    description: `Verimo analyse votre DPE avec tous vos documents de copropriété et vous donne un rapport complet : score, risques et pistes de négociation.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'passoire-thermique-fuir-negocier',
    'dpe-collectif-2026-obligations',
    'audit-energetique-difference-dpe',
    'utiliser-dpe-negocier-prix',
  ],
};

export default article;

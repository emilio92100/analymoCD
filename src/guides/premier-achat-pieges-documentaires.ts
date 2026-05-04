/**
 * Guide : Premier achat immobilier — les pièges documentaires à éviter
 * Catégorie : Acheteurs > Avant de signer
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'premier-achat-pieges-documentaires',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  tag: 'Primo-accédant',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 8,

  seo: {
    title: `Premier achat immobilier : 8 pièges documentaires à éviter — Guide Verimo`,
    description: `Primo-accédant ? Les erreurs les plus fréquentes sur les documents immobiliers et comment les éviter. DPE, charges, travaux, compromis. Guide pratique 2026.`,
  },

  title: `Premier achat immobilier : les pièges documentaires à éviter`,
  subtitle: `Guide spécial primo-accédants. Les erreurs les plus fréquentes et comment les éviter.`,

  intro: `Votre premier achat immobilier, c'est un mélange d'excitation et de stress. Vous visitez des appartements, vous comparez les prix, vous calculez vos mensualités. Et au milieu de tout ça, on vous donne des centaines de pages de documents que vous n'avez jamais vus de votre vie.

PV d'AG, DDT, DPE, ERP, loi Carrez, état daté, PPPT… Les acronymes s'accumulent et vous ne savez pas ce qui est important, ce qui est normal, et ce qui devrait vous alerter.

Ce guide est fait pour vous. Pas de jargon, pas de théorie. Juste les 8 pièges dans lesquels tombent les primo-accédants — et comment les éviter.`,

  sections: [
    {
      id: 'piege-1',
      title: `1. Se fier aux charges annoncées par l'agent`,
      content: `L'agent immobilier vous dit "les charges sont de 180 € par mois". Vous notez le chiffre et vous passez à autre chose.

Le problème : ce chiffre est souvent incomplet. Il correspond aux charges courantes (les provisions trimestrielles), mais ne prend pas en compte les appels de fonds exceptionnels pour les travaux votés en AG.

Résultat : vous pensiez payer 180 €/mois de charges, et en réalité vous payez 180 € + 150 €/mois d'appels de fonds pour un ravalement. Soit 330 €/mois.`,
      highlight: {
        type: 'tip' as const,
        title: `Le bon réflexe`,
        content: `Demandez l'état daté et les derniers appels de charges. Le montant réel, c'est les charges courantes + les appels de fonds en cours. Et vérifiez dans les PV d'AG si d'autres travaux sont prévus.`,
      },
    },
    {
      id: 'piege-2',
      title: `2. Ignorer le DPE en pensant que "c'est juste une lettre"`,
      content: `Un DPE F ou G, ce n'est plus juste une étiquette. Depuis 2025, un logement classé G ne peut plus être loué. Les F seront interdits en 2028, les E en 2034.

Si vous achetez votre résidence principale, ça impacte surtout votre facture énergétique. Mais si un jour vous voulez louer le bien (mutation, achat d'un second logement), un mauvais DPE vous bloquera.

Et dans tous les cas, un DPE F ou G signifie des travaux de rénovation à prévoir — isolation, fenêtres, chauffage. Ce sont des milliers d'euros à intégrer dans votre budget.`,
    },
    {
      id: 'piege-3',
      title: `3. Ne pas lire les PV d'assemblée générale`,
      content: `C'est le piège n°1 des primo-accédants. Les PV font 30 à 50 pages chacun, c'est écrit en jargon juridique, et personne ne vous explique quoi chercher.

Résultat : vous découvrez 6 mois après l'achat qu'un ravalement à 200 000 € a été voté, que la copro a 3 procédures judiciaires en cours, et que le fonds de travaux est vide.

Tout était écrit dans le PV. Vous ne l'avez juste pas lu.`,
      highlight: {
        type: 'warning' as const,
        title: `Ce que ça coûte`,
        content: `Un ravalement non anticipé, c'est 5 000 à 12 000 € par lot. Des procédures judiciaires, c'est 500 à 2 000 € par an en frais d'avocat répartis entre tous les copropriétaires. Des surprises qui ne seraient pas arrivées avec 30 minutes de lecture.`,
      },
    },
    {
      id: 'piege-4',
      title: `4. Confondre surface habitable et surface Carrez`,
      content: `L'annonce dit "65 m²". Le diagnostic Carrez dit "61 m²". Vous avez perdu 4 m² ?

Non. La surface Carrez (obligatoire en copropriété) exclut certaines surfaces : les murs, les cloisons, les marches d'escalier, les surfaces sous 1,80 m de hauteur. La surface habitable peut inclure des espaces que le Carrez ne compte pas.

Le piège : vous calculez le prix au m² sur la surface annoncée (65 m²), alors que la surface juridique est de 61 m². Votre prix au m² réel est 6,5 % plus élevé que ce que vous pensiez.`,
      highlight: {
        type: 'info' as const,
        title: `Votre droit`,
        content: `Si la surface Carrez réelle est inférieure de plus de 5 % à celle indiquée dans le compromis, vous avez 1 an après la signature pour demander une réduction de prix proportionnelle. C'est automatique, le vendeur ne peut pas refuser.`,
      },
    },
    {
      id: 'piege-5',
      title: `5. Oublier la taxe foncière dans le budget`,
      content: `Vous avez calculé : prix d'achat + frais de notaire + mensualités crédit + charges de copro. Vous êtes dans les clous.

Sauf que vous avez oublié la taxe foncière. Selon la commune, ça peut aller de 500 à 3 000 € par an pour un appartement. C'est une charge annuelle fixe, non négociable, qui ne fait que monter.

Le vendeur a le dernier avis de taxe foncière. Demandez-le. Et renseignez-vous sur les augmentations récentes de taux dans la commune.`,
    },
    {
      id: 'piege-6',
      title: `6. Signer le compromis sans lire les conditions suspensives`,
      content: `Le compromis contient des conditions suspensives — des clauses qui vous protègent. La plus importante : la condition de prêt. Si la banque refuse votre crédit, la vente est annulée et vous récupérez votre dépôt de garantie.

Le piège : certains compromis rédigés par les agents contiennent des conditions suspensives trop restrictives. Par exemple, un montant de prêt inférieur à ce dont vous avez besoin, un taux maximum trop bas, ou un délai trop court pour obtenir votre financement.

Si la condition ne correspond pas à votre situation réelle, elle ne vous protège pas.`,
      highlight: {
        type: 'warning' as const,
        title: `Ne faites jamais ça`,
        content: `Ne renoncez jamais à la condition suspensive de prêt, même si vous êtes "sûr" d'avoir le crédit. Un refus surprise de la banque arrive plus souvent qu'on ne croit — changement de situation professionnelle, hausse des taux, bien jugé trop cher par l'expert.`,
      },
    },
    {
      id: 'piege-7',
      title: `7. Ne pas demander le règlement de copropriété`,
      content: `Le règlement de copropriété, personne ne le demande avant l'achat. C'est long, c'est dense, et on se dit que "ça doit être standard".

Sauf que chaque copropriété a son propre règlement, avec ses propres restrictions. Et certaines peuvent tuer vos projets :`,
      bullets: [
        `Vous comptiez louer en Airbnb ? Le règlement interdit la location meublée de courte durée`,
        `Vous vouliez installer un bureau professionnel ? L'immeuble est à destination "exclusivement bourgeoise"`,
        `Vous pensiez aménager les combles ? Le règlement prévoit que les combles sont des parties communes`,
        `Vous vouliez changer les fenêtres ? Elles sont parties communes, il faut un vote en AG`,
      ],
    },
    {
      id: 'piege-8',
      title: `8. Ne pas utiliser les 10 jours de rétractation`,
      content: `Après la signature du compromis, vous avez 10 jours pour changer d'avis. Sans motif. Sans pénalité. C'est un droit absolu.

Le piège : beaucoup de primo-accédants ne font rien pendant ces 10 jours. Ils pensent que "c'est fait" et qu'il n'y a plus qu'à attendre le prêt.

En réalité, ces 10 jours sont votre dernière chance de vérifier les documents, de découvrir les problèmes, et de sortir gratuitement si quelque chose ne va pas. Après le 10e jour, la seule sortie possible est un refus de prêt.`,
      highlight: {
        type: 'tip' as const,
        title: `Le bon plan`,
        content: `Faites analyser vos documents pendant le délai de rétractation. Pas après. 10 jours, c'est suffisant pour tout vérifier — ou pour faire appel à un service d'analyse qui fera le travail pour vous.`,
      },
    },
  ],

  conclusion: `Acheter pour la première fois, c'est normal de ne pas tout savoir. Mais les erreurs documentaires sont les plus faciles à éviter : il suffit de lire, de demander, et de vérifier. Les 8 pièges de ce guide représentent à eux seuls des dizaines de milliers d'euros de mauvaises surprises potentielles.

Prenez le temps. Demandez les documents. Et si vous ne savez pas par où commencer, faites-les analyser.`,

  cta: {
    title: `Premier achat ? On vous aide à tout vérifier`,
    description: `Envoyez vos documents sur Verimo. En quelques minutes, vous savez exactement ce que contient votre dossier : risques, travaux à prévoir, et pistes de négociation.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    '10-documents-avant-offre-achat',
    'compromis-vente-clauses-lire',
    'verifier-10-jours-retractation',
    'charges-copropriete-trop-elevees',
  ],
};

export default article;

/**
 * Guide : Acheter sans agence — les documents à vérifier vous-même
 * Catégorie : Acheteurs > Avant de signer
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'acheter-sans-agence-documents-verifier',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Acheter sans agence : les documents à vérifier vous-même — Guide Verimo`,
    description: `Achat entre particuliers : pas d'agent pour vous guider. Les documents à exiger, les pièges à éviter et comment sécuriser votre achat seul. Guide 2026.`,
  },

  title: `Acheter sans agence : les documents à vérifier vous-même`,
  subtitle: `Pas d'agent pour vous guider ? Voici les documents à exiger et les pièges à éviter quand vous achetez en direct.`,

  intro: `Acheter en direct au vendeur, c'est économiser les frais d'agence — entre 3 et 8 % du prix. Sur un bien à 300 000 €, ça représente 9 000 à 24 000 €. C'est tentant.

Mais sans agent, personne ne vérifie les documents pour vous. Personne ne vous dit "attention, il y a un ravalement voté" ou "le DPE est périmé". C'est à vous de faire le travail — ou de vous faire accompagner autrement.

Ce guide vous donne la méthode pour acheter en direct sans prendre de risque.`,

  sections: [
    {
      id: 'ce-que-lagent-fait',
      title: `Ce que fait normalement l'agent (et que vous devez faire)`,
      content: `Un bon agent immobilier fait 4 choses que vous devez compenser :`,
      bullets: [
        `Collecter les documents auprès du vendeur et du syndic — PV d'AG, diagnostics, état daté, règlement de copropriété. Sans agent, c'est à vous de les demander`,
        `Vérifier la cohérence des informations — la surface annoncée correspond-elle au Carrez ? Les charges annoncées correspondent-elles à la réalité ?`,
        `Alerter sur les points de vigilance — travaux votés, impayés, DPE dégradé, restrictions du règlement`,
        `Coordonner avec le notaire — transmission des documents, planification du compromis`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Soyons honnêtes`,
        content: `Beaucoup d'agents ne font pas ce travail correctement non plus. Ils transmettent les documents sans les lire. L'avantage d'acheter sans agence, c'est que vous savez que personne ne vérifie à votre place — ça vous pousse à le faire vous-même.`,
      },
    },
    {
      id: 'documents-exiger',
      title: `Les documents à exiger au vendeur`,
      content: `Avant de faire une offre, demandez au vendeur :`,
      numberedList: [
        `Les 3 derniers PV d'assemblée générale — le vendeur les a reçus du syndic. S'il dit qu'il ne les a pas, demandez-lui de les demander au syndic`,
        `Le DDT complet — DPE, amiante, plomb, électricité, gaz, ERP, Carrez. Tous doivent être à jour`,
        `L'état daté ou le pré-état daté — situation financière du lot dans la copropriété`,
        `Le règlement de copropriété avec modificatifs`,
        `La fiche synthétique de copropriété`,
        `Le carnet d'entretien de l'immeuble`,
        `Le PPPT si la copro en a un`,
        `Le dernier avis de taxe foncière`,
        `L'audit énergétique — si c'est une maison classée E, F ou G`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Si le vendeur refuse de fournir un document`,
        content: `C'est un signal d'alerte. Un vendeur qui n'a "rien à cacher" fournit ses documents sans problème. Un vendeur qui traîne ou refuse a peut-être une raison. Ne faites pas d'offre sans avoir les pièces essentielles — au minimum les PV d'AG, le DPE et l'état daté.`,
      },
    },
    {
      id: 'pieges-direct',
      title: `Les pièges spécifiques à l'achat entre particuliers`,
      content: `Sans agent pour filtrer, certains risques sont amplifiés :`,
      bullets: [
        `Le vendeur sous-estime les charges — il annonce 150 €/mois mais oublie les appels de fonds en cours. Vérifiez avec l'état daté`,
        `Le vendeur minimise les travaux — "il y a juste un petit ravalement prévu". Regardez le PV d'AG et le montant voté`,
        `Le DPE est ancien — un vendeur particulier ne sait pas toujours que les DPE d'avant 2021 ne sont plus valables. Vérifiez la date`,
        `Le prix est déconnecté du marché — sans agent pour faire une estimation, le vendeur peut demander trop cher. Comparez avec les prix au m² sur MeilleursAgents ou les bases notariales`,
        `Le compromis est mal rédigé — entre particuliers, le compromis est souvent rédigé par le notaire seul, sans pré-négociation. Vérifiez les conditions suspensives, le dépôt de garantie et les clauses`,
      ],
    },
    {
      id: 'notaire',
      title: `Le rôle du notaire dans l'achat direct`,
      content: `Sans agent, le notaire devient votre principal interlocuteur. Mais attention à un malentendu courant :`,
      bullets: [
        `Le notaire du vendeur n'est pas votre notaire — il rédige l'acte mais il ne vous conseille pas spécifiquement. Si vous voulez un avis indépendant, prenez votre propre notaire (ça ne coûte pas plus cher, les frais sont partagés entre les deux)`,
        `Le notaire vérifie la conformité juridique, pas la qualité du bien — il s'assure que les documents sont là et que l'acte est régulier, mais il ne vous dit pas si les charges sont trop élevées ou si le DPE est un problème`,
        `Le notaire ne négocie pas à votre place — c'est à vous de discuter le prix et les conditions avec le vendeur`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le bon réflexe`,
        content: `Prenez votre propre notaire. C'est gratuit (les deux notaires se partagent les émoluments, vous ne payez pas plus). Et vous avez un interlocuteur qui vous conseille, vous, pas le vendeur.`,
      },
    },
    {
      id: 'methode',
      title: `La méthode en 5 étapes`,
      content: `Pour acheter en direct sans se planter :`,
      numberedList: [
        `Visitez le bien et prenez des notes — état général, travaux visibles, environnement, nuisances`,
        `Demandez tous les documents avant de faire une offre — pas après, pas au compromis. Avant`,
        `Analysez les documents ou faites-les analyser — PV d'AG, état daté, DPE, diagnostics. Si vous ne savez pas quoi chercher, utilisez un service d'analyse`,
        `Faites une offre argumentée — basée sur les prix du marché et les éléments trouvés dans les documents (travaux, charges, DPE)`,
        `Prenez votre propre notaire et relisez le compromis avant de signer — conditions suspensives, dépôt de garantie, délai`,
      ],
    },
  ],

  conclusion: `Acheter sans agence, c'est économiser des milliers d'euros. Mais c'est aussi prendre sur vous le travail de vérification que l'agent est censé faire. Les documents sont les mêmes, les risques sont les mêmes — il n'y a juste personne pour vous alerter.

Demandez les documents, lisez-les, et faites-les analyser si vous n'êtes pas sûr de vous. Le coût d'une analyse est dérisoire par rapport aux risques d'un achat à l'aveugle.`,

  cta: {
    title: `Vous achetez sans agence ?`,
    description: `Verimo remplace l'œil de l'agent sur vos documents. Score /20, risques identifiés et pistes de négociation — en quelques minutes.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    '10-documents-avant-offre-achat',
    'compromis-vente-clauses-lire',
    'premier-achat-pieges-documentaires',
    'verifier-10-jours-retractation',
  ],
};

export default article;

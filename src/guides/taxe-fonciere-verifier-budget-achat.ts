/**
 * Guide : Taxe foncière — comment la vérifier et l'intégrer dans votre budget
 * Catégorie : Acheteurs > Négociation
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'taxe-fonciere-verifier-budget-achat',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 5,

  seo: {
    title: `Taxe foncière achat immobilier : comment la vérifier et la budgéter — Guide Verimo`,
    description: `La taxe foncière peut varier de 500 à 3 000 € par an pour un même bien selon la commune. Comment la vérifier et l'intégrer dans votre budget d'achat. Guide 2026.`,
  },

  title: `Taxe foncière : comment la vérifier et l'intégrer dans votre budget`,
  subtitle: `Montant, évolution, calcul — la taxe foncière oubliée qui peut changer votre budget de 500 à 3 000 € par an.`,

  intro: `Vous avez calculé vos mensualités de crédit, vos charges de copropriété, vos factures d'énergie. Tout rentre dans votre budget. Et puis, en octobre, vous recevez l'avis de taxe foncière : 2 400 €. Surprise.

La taxe foncière, c'est la charge annuelle que beaucoup d'acheteurs oublient — ou sous-estiment. Elle varie énormément d'une commune à l'autre, et elle ne fait qu'augmenter. Sur 10 ans, c'est un budget de 5 000 à 30 000 € selon où vous achetez.`,

  sections: [
    {
      id: 'comment-ca-marche',
      title: `Comment la taxe foncière est calculée`,
      content: `La taxe foncière est calculée par les impôts sur la base de deux éléments :`,
      bullets: [
        `La valeur locative cadastrale — c'est la valeur théorique du loyer annuel de votre bien, fixée par le cadastre. Elle est souvent très éloignée de la réalité du marché (datant de 1970, révisée à la hausse chaque année par des coefficients)`,
        `Le taux voté par la commune et le département — c'est ce taux qui varie fortement d'une ville à l'autre. Certaines communes ont un taux de 20 %, d'autres de 50 %. C'est ce qui explique les écarts énormes`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Pourquoi ça augmente`,
        content: `La valeur locative cadastrale est revalorisée chaque année par un coefficient national (environ 3 à 7 % ces dernières années). En plus, les communes peuvent voter des hausses de taux. Les deux se cumulent — d'où des augmentations de 5 à 10 % par an dans certaines villes.`,
      },
    },
    {
      id: 'verifier-avant',
      title: `Comment vérifier avant d'acheter`,
      content: `La méthode est simple :`,
      numberedList: [
        `Demandez au vendeur son dernier avis de taxe foncière — c'est un document d'une page avec le montant exact`,
        `Comparez avec les années précédentes si possible — demandez les 2-3 derniers avis pour voir la tendance`,
        `Renseignez-vous sur les taux de la commune — les taux sont publics et consultables sur impots.gouv.fr`,
        `Vérifiez s'il y a eu une révision cadastrale récente — certaines communes ont fait réévaluer les valeurs locatives, ce qui fait bondir la taxe`,
      ],
    },
    {
      id: 'ordres-grandeur',
      title: `Ordres de grandeur en 2026`,
      content: `La taxe foncière varie énormément selon la commune et le bien :`,
      bullets: [
        `Studio ou 2 pièces en ville moyenne — 300 à 800 €/an`,
        `Appartement 3-4 pièces en grande ville — 800 à 2 000 €/an`,
        `Maison individuelle en banlieue — 1 200 à 3 000 €/an`,
        `Maison avec grand terrain en zone rurale — 500 à 1 500 €/an (les taux sont souvent plus bas)`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le piège des communes "pas chères"`,
        content: `Un bien moins cher dans une commune voisine peut avoir une taxe foncière beaucoup plus élevée. Un appartement à 250 000 € avec 2 500 €/an de taxe foncière coûte plus cher sur 10 ans qu'un appartement à 260 000 € avec 800 €/an de taxe. Faites le calcul global.`,
      },
    },
    {
      id: 'exonerations',
      title: `Les exonérations possibles`,
      content: `Certaines situations ouvrent droit à une réduction ou une exonération :`,
      bullets: [
        `Logement neuf — exonération de 2 ans après l'achèvement (sur la part communale, parfois aussi sur la part départementale)`,
        `Travaux de rénovation énergétique — certaines communes accordent une exonération temporaire (3 à 5 ans) après des travaux importants. Renseignez-vous en mairie`,
        `Personnes âgées ou handicapées sous conditions de revenus — exonération totale ou partielle`,
        `Logement vacant — pas d'exonération. Vous payez même si le bien est vide`,
      ],
    },
    {
      id: 'prorata-vente',
      title: `Le prorata à la vente`,
      content: `La taxe foncière est due pour l'année entière par celui qui est propriétaire au 1er janvier. Mais en pratique, le notaire fait un prorata entre le vendeur et l'acheteur.

Si vous achetez le 1er septembre, le vendeur paie les 8 premiers mois (janvier à août) et vous payez les 4 derniers (septembre à décembre). Ce prorata est calculé par le notaire et déduit du prix de vente.

Pour l'année suivante, vous recevrez l'avis complet en octobre — c'est votre première taxe foncière "pleine". Anticipez-la dans votre budget.`,
    },
    {
      id: 'integrer-budget',
      title: `Intégrer la taxe foncière dans votre budget`,
      content: `Ramenez la taxe foncière à un montant mensuel pour voir son impact réel :`,
      bullets: [
        `Taxe de 1 200 €/an = 100 €/mois en plus de votre crédit et vos charges`,
        `Taxe de 2 400 €/an = 200 €/mois — l'équivalent d'un petit crédit auto`,
        `Taxe de 3 000 €/an = 250 €/mois — ça peut faire la différence entre un budget tenable et un budget trop serré`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `N'oubliez pas la hausse`,
        content: `La taxe foncière augmente chaque année. Si elle est à 1 500 € aujourd'hui et qu'elle augmente de 5 % par an, dans 10 ans elle sera à 2 450 €. Sur la durée de votre crédit (20-25 ans), c'est un budget cumulé de 40 000 à 60 000 €. Ça mérite 2 minutes de réflexion.`,
      },
    },
  ],

  conclusion: `La taxe foncière, c'est le coût invisible de la propriété. Elle ne figure dans aucune annonce immobilière, aucun agent ne la mentionne spontanément, et la plupart des acheteurs la découvrent après la signature.

Demandez le dernier avis au vendeur, vérifiez la tendance sur 3 ans, et intégrez le montant dans votre calcul mensuel. C'est la différence entre un budget confortable et un budget qui craque.`,

  cta: {
    title: `Calculez le vrai coût de votre achat`,
    description: `Verimo analyse vos documents et vous donne le coût total : prix + frais + charges + travaux. Pour acheter en connaissance de cause.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'frais-notaire-calcul-achat',
    'charges-copropriete-trop-elevees',
    '10-documents-avant-offre-achat',
    'arguments-negociation-documents-copropriete',
  ],
};

export default article;

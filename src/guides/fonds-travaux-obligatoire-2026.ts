/**
 * Guide : Fonds de travaux obligatoire — ce que ça change pour l'acheteur en 2026
 * Catégorie : Copropriété > Finances & Charges
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'fonds-travaux-obligatoire-2026',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 6,

  seo: {
    title: `Fonds de travaux copropriété : obligations et impact acheteur 2026 — Guide Verimo`,
    description: `Le fonds de travaux est obligatoire dans toutes les copropriétés. Montant minimum, impact sur les charges, ce que l'acheteur doit vérifier. Guide 2026.`,
  },

  title: `Fonds de travaux obligatoire : ce que ça change pour l'acheteur en 2026`,
  subtitle: `Depuis la loi ALUR, chaque copropriété doit constituer un fonds de travaux. Impact concret sur votre achat.`,

  intro: `Le fonds de travaux, c'est la tirelire de la copropriété. Chaque copropriétaire cotise un minimum chaque année pour anticiper les gros travaux à venir : ravalement, toiture, chaudière, ascenseur.

C'est obligatoire depuis la loi ALUR de 2014 pour toutes les copropriétés de plus de 10 lots, et depuis 2017 pour toutes les copropriétés sans exception. Pourtant, beaucoup de copros cotisent au strict minimum — ou ne respectent même pas l'obligation.

En tant qu'acheteur, le niveau du fonds de travaux vous dit si la copro anticipe ses dépenses ou si elle les repousse. Et ça change tout.`,

  sections: [
    {
      id: 'regles',
      title: `Les règles en 2026`,
      content: `Le cadre légal est simple :`,
      bullets: [
        `Toutes les copropriétés doivent cotiser au fonds de travaux — il n'y a plus d'exception depuis 2017`,
        `Le montant minimum est de 2,5 % du budget prévisionnel par an — si le budget annuel est de 100 000 €, le fonds reçoit au minimum 2 500 € par an, répartis entre tous les copropriétaires`,
        `L'AG peut voter un montant supérieur — et c'est recommandé pour les immeubles anciens avec de gros travaux à prévoir`,
        `Le fonds est placé sur un compte séparé — il ne se mélange pas avec le compte courant de la copropriété`,
        `Seule exception : un DTG (Diagnostic Technique Global) qui ne révèle aucun besoin de travaux sur 10 ans peut dispenser la copro. En pratique, c'est très rare`,
      ],
    },
    {
      id: 'impact-acheteur',
      title: `Ce que ça change pour vous en tant qu'acheteur`,
      content: `Le fonds de travaux a plusieurs conséquences directes sur votre achat :`,
      subsections: [
        {
          title: `Le vendeur ne récupère pas sa part`,
          content: `C'est le point que beaucoup ignorent. Quand le vendeur quitte la copropriété, il ne récupère pas les sommes qu'il a versées au fonds de travaux. L'argent reste dans le pot commun.

Concrètement : si le vendeur a cotisé pendant 8 ans et que le fonds contient 15 000 €, cet argent profite à tous les copropriétaires — y compris vous. C'est un avantage pour l'acheteur.`,
        },
        {
          title: `Vous cotisez dès le premier jour`,
          content: `Dès la signature de l'acte de vente, vous devenez copropriétaire et vous cotisez au fonds de travaux via vos charges trimestrielles. Le montant est proportionnel à vos tantièmes.

Pour un lot qui représente 5 % des tantièmes dans une copro avec un budget de 80 000 € et un fonds à 2,5 %, ça fait environ 100 € par an. C'est inclus dans vos charges.`,
        },
        {
          title: `Un fonds bien rempli vous protège`,
          content: `Si le fonds de travaux est conséquent (par exemple 50 000 à 100 000 € pour une copro de 30 lots), ça veut dire que la copro peut financer les premières tranches de travaux sans appels de fonds exceptionnels. Moins de surprises, moins de tensions en AG.`,
        },
      ],
    },
    {
      id: 'que-verifier',
      title: `Ce qu'il faut vérifier dans les documents`,
      content: `Pour évaluer le fonds de travaux, regardez ces éléments :`,
      bullets: [
        `Le montant actuel du fonds — vous le trouverez dans la fiche synthétique, l'état daté ou les annexes comptables du PV d'AG`,
        `Le pourcentage de cotisation — est-ce le minimum de 2,5 % ou plus ? Une copro qui cotise à 5 ou 10 % anticipe mieux`,
        `L'ancienneté de l'immeuble — un immeuble de 1970 avec un fonds de travaux de 5 000 € pour 40 lots, c'est insuffisant. Les travaux vont arriver et il faudra des appels de fonds massifs`,
        `Le PPPT — le plan de travaux sur 10 ans vous dit combien la copro va dépenser. Comparez avec le fonds disponible : si le PPPT prévoit 200 000 € de travaux et que le fonds contient 20 000 €, il manque 180 000 € — qui seront appelés aux copropriétaires`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le bon réflexe`,
        content: `Divisez le montant du fonds de travaux par le nombre de lots. En dessous de 1 000 € par lot pour un immeuble de plus de 30 ans, c'est faible. Au-dessus de 3 000 € par lot, la copro est bien gérée.`,
      },
    },
    {
      id: 'fonds-vide',
      title: `Que faire si le fonds est vide ou insuffisant`,
      content: `Un fonds de travaux quasi vide dans un immeuble ancien, c'est un signal d'alerte. Ça veut dire que :`,
      bullets: [
        `La copro n'a pas anticipé les travaux — quand ils arriveront (et ils arriveront), ce sera des appels de fonds exceptionnels. 3 000, 5 000, 10 000 € d'un coup, en plus de vos charges courantes`,
        `La copro ne respecte peut-être pas la loi — si elle ne cotise pas le minimum de 2,5 %, le syndic est en faute`,
        `Les copropriétaires rechignent à payer — mauvais signe pour les futures AG où il faudra voter des travaux`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Un fonds vide combiné à un PPPT qui prévoit des travaux importants, c'est la pire combinaison. Ça veut dire que tout le montant des travaux sera financé par des appels de fonds supplémentaires — et ça peut représenter plusieurs milliers d'euros par lot et par an.`,
      },
    },
    {
      id: 'negociation',
      title: `Utiliser le fonds de travaux dans votre négociation`,
      content: `Le niveau du fonds de travaux peut jouer en votre faveur dans la négociation :`,
      subsections: [
        {
          title: `Fonds faible = argument de négociation`,
          content: `Si le fonds est insuffisant et que des travaux sont prévus dans le PPPT, vous pouvez chiffrer les appels de fonds à venir et les déduire de votre offre. "Le PPPT prévoit 150 000 € de travaux sur 5 ans, le fonds ne contient que 10 000 €, ma quote-part sera d'environ 7 000 € — je baisse mon offre d'autant."`,
        },
        {
          title: `Fonds bien rempli = argument de valeur`,
          content: `À l'inverse, un fonds de travaux conséquent est un atout. La copro est bien gérée, les travaux à venir sont déjà partiellement financés, et vos charges futures seront plus stables. Ça ne justifie pas un prix plus élevé, mais ça rassure.`,
        },
      ],
    },
  ],

  conclusion: `Le fonds de travaux, c'est l'indicateur de santé financière d'une copropriété. Un fonds bien alimenté dans un immeuble bien entretenu, c'est le signe d'une copro qui anticipe. Un fonds vide dans un immeuble de 40 ans, c'est la promesse d'appels de fonds douloureux.

Vérifiez le montant, comparez avec les travaux prévus dans le PPPT, et intégrez le tout dans votre budget. C'est le genre de détail qui fait la différence entre un bon achat et un achat qu'on regrette.`,

  cta: {
    title: `Fonds de travaux, PPPT, charges : tout analyser d'un coup`,
    description: `Verimo croise vos documents de copropriété et vous alerte sur les risques financiers. Score, travaux à prévoir et charges à anticiper.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'charges-copropriete-trop-elevees',
    'analyser-pv-ag-avant-achat',
    'dpe-collectif-2026-obligations',
    'impayes-copropriete-detecter-risque',
  ],
};

export default article;

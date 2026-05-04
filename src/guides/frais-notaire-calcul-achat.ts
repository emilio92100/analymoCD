/**
 * Guide : Frais de notaire — ce que vous payez vraiment et comment les calculer
 * Catégorie : Acheteurs > Avant de signer
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'frais-notaire-calcul-achat',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 6,

  seo: {
    title: `Frais de notaire achat immobilier : calcul et détail complet — Guide Verimo`,
    description: `Droits de mutation, émoluments, débours — le détail de ce que contiennent les frais de notaire et comment les estimer pour votre achat. Guide 2026.`,
  },

  title: `Frais de notaire : ce que vous payez vraiment et comment les calculer`,
  subtitle: `Droits de mutation, émoluments, débours — le détail de ce que contiennent les frais de notaire et comment les estimer.`,

  intro: `"Comptez 7 à 8 % de frais de notaire dans l'ancien." Tout le monde vous le dit, mais personne ne vous explique ce que ça contient. Sur un achat à 300 000 €, ça représente 21 000 à 24 000 € — une somme énorme dont plus de 80 % ne va pas au notaire.

Ce guide vous explique ce que vous payez, à qui ça va, et comment estimer le montant exact pour votre achat.`,

  sections: [
    {
      id: 'composition',
      title: `Ce que contiennent les "frais de notaire"`,
      content: `L'expression "frais de notaire" est trompeuse. En réalité, ces frais se décomposent en 3 parties :`,
      subsections: [
        {
          title: `Les droits de mutation (environ 5,8 % du prix)`,
          content: `C'est la partie la plus importante — et elle ne va pas au notaire mais à l'État et au département. Les droits de mutation comprennent la taxe départementale (environ 4,5 %), la taxe communale (1,2 %) et le prélèvement pour l'État (0,1 %). Ce sont des taxes, pas des honoraires. Le notaire les collecte et les reverse.`,
        },
        {
          title: `Les émoluments du notaire (environ 1 % du prix)`,
          content: `C'est la rémunération du notaire pour son travail : rédaction de l'acte, vérifications juridiques, formalités. Les émoluments sont réglementés par un barème national — tous les notaires appliquent le même tarif. Ils sont dégressifs : le pourcentage baisse quand le prix augmente.`,
        },
        {
          title: `Les débours et frais divers (environ 0,5 à 1 %)`,
          content: `Ce sont les frais que le notaire avance pour vous : extraits cadastraux, état hypothécaire, timbres fiscaux, frais de publication. Le notaire vous les facture au réel.`,
        },
      ],
      highlight: {
        type: 'info' as const,
        title: `En résumé`,
        content: `Sur 24 000 € de "frais de notaire" pour un bien à 300 000 €, environ 17 400 € vont au fisc (droits de mutation), 3 000 € au notaire (émoluments), et 3 600 € en frais administratifs (débours). Le notaire ne touche que 12 % du total.`,
      },
    },
    {
      id: 'ancien-vs-neuf',
      title: `Ancien vs neuf : la grosse différence`,
      content: `Les frais de notaire ne sont pas les mêmes selon que vous achetez dans l'ancien ou dans le neuf :`,
      bullets: [
        `Dans l'ancien — 7 à 8 % du prix de vente. C'est le cas le plus courant`,
        `Dans le neuf (VEFA ou moins de 5 ans) — 2 à 3 % du prix. Les droits de mutation sont réduits car le vendeur a déjà payé la TVA sur la construction`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `L'astuce des frais d'agence`,
        content: `Les frais de notaire se calculent sur le prix "net vendeur" (hors frais d'agence) si le mandat prévoit que les frais d'agence sont à la charge de l'acquéreur et sont détaillés séparément. Concrètement, si le bien est à 300 000 € dont 15 000 € de frais d'agence, les droits de mutation se calculent sur 285 000 € — soit une économie d'environ 900 €.`,
      },
    },
    {
      id: 'calcul-rapide',
      title: `Comment calculer rapidement`,
      content: `Pour un achat dans l'ancien, la formule simplifiée :`,
      bullets: [
        `Prix × 8 % = estimation haute des frais de notaire`,
        `Prix × 7,5 % = estimation moyenne (la plus courante)`,
        `Pour un calcul précis, utilisez un simulateur en ligne (notaires.fr en propose un gratuit)`,
      ],
      subsections: [
        {
          title: `Exemples concrets`,
          content: `Bien à 200 000 € dans l'ancien : environ 15 000 à 16 000 € de frais. Bien à 350 000 € dans l'ancien : environ 26 000 à 28 000 €. Bien à 250 000 € dans le neuf : environ 5 000 à 7 500 €.`,
        },
      ],
    },
    {
      id: 'negocier-frais',
      title: `Peut-on négocier les frais de notaire ?`,
      content: `Les droits de mutation (80 % du total) sont des taxes — pas négociables. Mais il y a quelques marges :`,
      bullets: [
        `Les émoluments du notaire — depuis 2021, le notaire peut accorder une remise de 20 % maximum sur ses émoluments pour les transactions supérieures à 100 000 €. Demandez-le — certains notaires l'accordent automatiquement, d'autres non`,
        `Les frais d'agence séparés — comme mentionné plus haut, si les frais d'agence sont clairement séparés du prix net vendeur, les droits de mutation baissent`,
        `Le mobilier inclus dans la vente — si le vendeur laisse des meubles (cuisine équipée, dressing), leur valeur peut être déduite du prix immobilier pour le calcul des droits. Maximum raisonnable : 2 à 5 % du prix. Le notaire et le fisc vérifient`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Attention au mobilier surévalué`,
        content: `Certains vendeurs gonflent la valeur du mobilier pour réduire les frais de notaire de l'acheteur. Le fisc connaît cette pratique et contrôle. Un mobilier estimé à 15 000 € dans un appartement vide à part une cuisine IKEA, ça ne passe pas. Restez raisonnable : liste détaillée, valeur réaliste.`,
      },
    },
    {
      id: 'budget-total',
      title: `Intégrer les frais dans votre budget total`,
      content: `Les frais de notaire font partie du coût total de votre achat. Votre budget réel, c'est :`,
      numberedList: [
        `Prix d'achat net vendeur`,
        `+ Frais d'agence (si à votre charge)`,
        `+ Frais de notaire (7 à 8 % dans l'ancien)`,
        `+ Appels de fonds pour travaux votés (état daté)`,
        `+ Travaux privatifs à prévoir (diagnostics, DPE)`,
        `+ Taxe foncière annuelle`,
        `+ Charges de copropriété mensuelles`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le piège classique`,
        content: `La banque finance le prix d'achat + les frais de notaire. Mais les appels de fonds copropriété, la taxe foncière et les travaux privatifs, c'est sur vos fonds propres. Si vous avez 0 € d'apport après les frais de notaire, vous n'avez plus de marge pour les imprévus.`,
      },
    },
  ],

  conclusion: `Les frais de notaire, c'est 7 à 8 % du prix dans l'ancien dont 80 % va au fisc. Vous ne pouvez pas y échapper, mais vous pouvez les optimiser : demander la remise sur les émoluments, séparer les frais d'agence, et déduire le mobilier quand c'est justifié.

Surtout, intégrez-les dans votre budget total dès le début — pas comme une surprise à la signature.`,

  cta: {
    title: `Calculez votre budget total avant d'acheter`,
    description: `Verimo analyse vos documents et vous donne le coût réel de votre achat : prix + frais + travaux + charges. Pas de surprise après la signature.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    '10-documents-avant-offre-achat',
    'compromis-vente-clauses-lire',
    'taxe-fonciere-verifier-budget-achat',
    'charges-copropriete-trop-elevees',
  ],
};

export default article;

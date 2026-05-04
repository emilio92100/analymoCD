/**
 * Guide : Fiche synthétique de copropriété — à quoi ça sert
 * Catégorie : Copropriété > Documents de copropriété
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'fiche-synthetique-copropriete',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 5,

  seo: {
    title: `Fiche synthétique copropriété : à quoi ça sert et quoi vérifier — Guide Verimo`,
    description: `La fiche synthétique résume en une page la santé financière et technique de la copropriété. Ce qu'elle contient et comment la lire. Guide 2026.`,
  },

  title: `Fiche synthétique de copropriété : à quoi ça sert`,
  subtitle: `Ce résumé annuel obligatoire donne un aperçu rapide de la santé de votre future copropriété.`,

  docInfo: {
    emoji: '📄',
    label: `Fiche synthétique`,
    definition: `Document obligatoire établi chaque année par le syndic, regroupant les données financières et techniques essentielles de la copropriété en une ou deux pages. Elle doit être remise à tout copropriétaire qui en fait la demande.`,
  },

  intro: `La fiche synthétique, c'est le résumé exécutif de la copropriété. En une ou deux pages, elle vous donne les chiffres clés : nombre de lots, budget, charges, fonds de travaux, dettes, contrats. C'est le document le plus rapide à lire de tout le dossier — et un excellent point de départ pour savoir si la copro est bien gérée.

Le problème : beaucoup de syndics ne la produisent pas, et beaucoup d'acheteurs ne la demandent pas. Pourtant, c'est obligatoire depuis la loi ALUR de 2014.`,

  sections: [
    {
      id: 'contenu',
      title: `Ce que contient la fiche synthétique`,
      content: `La fiche synthétique regroupe les informations clés en quelques rubriques :`,
      bullets: [
        `L'identification de la copropriété — adresse, date de construction, nombre de lots (habitation, commerce, parking), nombre de bâtiments`,
        `Le syndic en place — nom, type (professionnel ou bénévole), date de fin de mandat`,
        `Les données financières — budget prévisionnel, montant des charges courantes, provisions pour travaux, fonds de travaux, dettes des copropriétaires (impayés)`,
        `L'état des équipements — ascenseur, chauffage collectif, parking, espaces verts`,
        `Les contrats en cours — assurance, maintenance, entretien`,
        `Les procédures judiciaires éventuelles`,
        `La performance énergétique — classe DPE collectif si réalisé`,
      ],
    },
    {
      id: 'lecture-rapide',
      title: `Comment la lire en 2 minutes`,
      content: `Concentrez-vous sur 4 chiffres :`,
      numberedList: [
        `Le budget annuel — divisez-le par le nombre de lots pour avoir le coût moyen par lot. Au-dessus de 3 000 €/lot/an pour un immeuble sans chauffage collectif ni gardien, c'est élevé`,
        `Le taux d'impayés — montant des dettes copropriétaires divisé par le budget. Au-dessus de 15 %, c'est un signal d'alerte`,
        `Le fonds de travaux — est-il alimenté ? Quel montant ? Divisez par le nombre de lots : en dessous de 1 000 €/lot pour un immeuble de plus de 30 ans, c'est faible`,
        `Les procédures en cours — combien et depuis quand. Zéro procédure, c'est l'idéal. Plus de 2, ça mérite une investigation dans les PV d'AG`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le test express`,
        content: `Si les 4 indicateurs sont au vert (budget maîtrisé, impayés bas, fonds correct, pas de procédures), la copro est probablement bien gérée. Si 2 ou plus sont au rouge, creusez dans les PV d'AG pour comprendre pourquoi.`,
      },
    },
    {
      id: 'comparaison',
      title: `Comparer avec les autres documents`,
      content: `La fiche synthétique est un résumé — elle ne remplace pas les documents détaillés. Mais elle permet de détecter rapidement les incohérences :`,
      bullets: [
        `Les charges annoncées par l'agent vs le budget de la fiche — si l'agent dit "200 €/mois" et que la fiche montre un budget de 3 500 €/lot/an (soit 290 €/mois), il y a un écart`,
        `Le fonds de travaux de la fiche vs les PV d'AG — si la fiche affiche 50 000 € de fonds mais que le PV montre un ravalement voté à 200 000 €, le fonds ne couvrira qu'un quart`,
        `Les impayés de la fiche vs l'état daté — l'état daté donne le détail pour votre lot, la fiche donne la vue globale. Les deux doivent être cohérents`,
      ],
    },
    {
      id: 'pas-de-fiche',
      title: `Si la fiche synthétique n'existe pas`,
      content: `C'est un signal sur la qualité du syndic. La fiche synthétique est obligatoire depuis 2014, et tout copropriétaire peut la demander. Un syndic qui ne la produit pas est en faute.

Dans la pratique :`,
      bullets: [
        `Demandez-la directement au syndic — il ne peut pas refuser`,
        `Si le syndic ne répond pas, c'est un mauvais signe sur sa réactivité et sa gestion`,
        `En l'absence de fiche, reportez-vous sur les PV d'AG et les annexes comptables pour retrouver les mêmes informations — mais c'est plus long`,
        `Signalez l'absence de fiche en AG — les copropriétaires peuvent voter une mise en demeure au syndic`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `L'absence de fiche synthétique n'empêche pas la vente. Mais c'est un indicateur de gestion défaillante qui doit vous inciter à examiner les autres documents avec encore plus d'attention.`,
      },
    },
  ],

  conclusion: `La fiche synthétique, c'est 2 minutes de lecture et 4 chiffres à retenir. C'est le document le plus simple du dossier, et pourtant il vous donne une vision d'ensemble immédiate de la copropriété.

Demandez-la en premier. Si les chiffres sont bons, vous êtes sur la bonne piste. S'ils sont mauvais, vous savez où creuser.`,

  cta: {
    title: `Fiche synthétique + PV + état daté : le trio essentiel`,
    description: `Envoyez vos documents sur Verimo pour un rapport complet. Score /20, santé financière de la copro et alertes en un seul rapport.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'analyser-pv-ag-avant-achat',
    'charges-copropriete-trop-elevees',
    'impayes-copropriete-detecter-risque',
    'carnet-entretien-immeuble',
  ],
};

export default article;

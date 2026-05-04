/**
 * Guide : Carnet d'entretien de l'immeuble — ce qu'il faut y chercher
 * Catégorie : Copropriété > Documents de copropriété
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'carnet-entretien-immeuble',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 5,

  seo: {
    title: `Carnet d'entretien copropriété : que vérifier avant d'acheter — Guide Verimo`,
    description: `Le carnet d'entretien liste les travaux réalisés et les contrats en cours de l'immeuble. Ce qu'il faut y chercher avant d'acheter. Guide pratique 2026.`,
  },

  title: `Carnet d'entretien de l'immeuble : ce qu'il faut y chercher`,
  subtitle: `Historique des travaux, maintenance des équipements, conformité réglementaire — un document souvent négligé.`,

  docInfo: {
    emoji: '🔧',
    label: `Carnet d'entretien`,
    definition: `Document tenu par le syndic qui liste l'historique des travaux réalisés dans l'immeuble, les contrats d'entretien en cours et les équipements communs. Obligatoire dans toutes les copropriétés depuis 2001.`,
  },

  intro: `Le carnet d'entretien, c'est le carnet de santé de l'immeuble. Il liste ce qui a été fait, ce qui est sous contrat, et ce qui existe comme équipements. C'est un document court (souvent 5 à 15 pages), facile à lire, et pourtant personne ne le demande.

C'est dommage, parce qu'il répond à une question simple : l'immeuble est-il bien entretenu ? Un immeuble dont la toiture a été refaite il y a 5 ans et dont l'ascenseur est sous contrat, c'est pas pareil qu'un immeuble où rien n'a été touché depuis 20 ans.`,

  sections: [
    {
      id: 'contenu',
      title: `Ce que contient le carnet d'entretien`,
      content: `Le carnet d'entretien est obligatoire depuis le décret du 30 mai 2001. Il doit contenir au minimum :`,
      bullets: [
        `L'adresse de l'immeuble et l'identité du syndic`,
        `Les contrats d'assurance (multirisque immeuble)`,
        `Les contrats d'entretien en cours — ascenseur, chaudière, VMC, espaces verts, ménage, portail, interphone`,
        `L'historique des travaux importants — avec les dates, la nature des travaux et l'entreprise qui les a réalisés`,
        `Les diagnostics techniques réalisés — amiante, plomb, DTG, DPE collectif`,
        `Les équipements de sécurité — extincteurs, désenfumage, alarme incendie, colonnes sèches`,
      ],
    },
    {
      id: 'travaux-historique',
      title: `L'historique des travaux : ce que ça vous dit`,
      content: `La partie la plus utile du carnet, c'est l'historique des travaux. Il vous permet de savoir ce qui a été fait — et surtout ce qui ne l'a pas été.

Les travaux les plus importants à repérer :`,
      bullets: [
        `Ravalement de façade — date du dernier ? S'il remonte à plus de 15-20 ans, un nouveau ravalement approche`,
        `Réfection de toiture — une toiture dure 25 à 40 ans selon les matériaux. Si elle n'a jamais été refaite sur un immeuble de 1970, ça urge`,
        `Remplacement de la chaudière — une chaudière collective dure 15 à 25 ans. Regardez la date d'installation`,
        `Mise aux normes de l'ascenseur — les normes évoluent régulièrement. Un ascenseur ancien non mis aux normes peut être arrêté`,
        `Réfection des parties communes — hall, escaliers, peintures. Pas critique mais ça donne une idée de l'entretien général`,
        `Travaux de canalisations — les colonnes montantes anciennes (plomb, fonte) finissent par fuir. Si elles n'ont jamais été changées sur un immeuble de plus de 50 ans, c'est à prévoir`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le bon réflexe`,
        content: `Croisez le carnet d'entretien avec le PPPT. Si le carnet montre que la toiture n'a pas été touchée depuis 30 ans et que le PPPT prévoit sa réfection dans 2 ans, vous savez qu'un gros appel de fonds arrive.`,
      },
    },
    {
      id: 'contrats-entretien',
      title: `Les contrats d'entretien en cours`,
      content: `Le carnet liste les contrats actifs. Ce qu'il faut vérifier :`,
      bullets: [
        `Ascenseur — y a-t-il un contrat de maintenance ? De quel type (minimal ou complet) ? Un contrat complet coûte plus cher mais couvre les pièces et la main d'œuvre`,
        `Chaudière — contrat d'entretien annuel obligatoire pour les chaudières collectives. Vérifiez qu'il est à jour`,
        `Espaces verts — si l'immeuble a un jardin ou des espaces extérieurs, un contrat régulier évite la dégradation`,
        `Ménage des parties communes — sous contrat ou assuré par le gardien ? La qualité d'entretien impacte votre quotidien`,
      ],
    },
    {
      id: 'carnet-absent',
      title: `Si le carnet n'existe pas ou est incomplet`,
      content: `Le carnet d'entretien est obligatoire, mais dans la pratique beaucoup de syndics le tiennent mal — ou pas du tout. Un carnet vide ou absent, ça veut dire :`,
      bullets: [
        `Le syndic ne fait pas son travail — c'est une de ses obligations légales. Si même ça n'est pas tenu, qu'en est-il du reste ?`,
        `Aucune traçabilité des travaux — impossible de savoir quand la toiture a été refaite, si les canalisations ont été changées, ou si l'ascenseur est aux normes`,
        `Difficulté à planifier — sans historique, le PPPT est fait à l'aveugle. Les priorités de travaux sont mal évaluées`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Un carnet d'entretien vide dans un immeuble de 40 ans, c'est un mauvais signal. Ça ne veut pas dire que l'immeuble est en mauvais état, mais que personne ne suit. Croisez avec les PV d'AG et le PPPT pour avoir une vision plus complète.`,
      },
    },
    {
      id: 'checklist',
      title: `Votre checklist carnet d'entretien`,
      content: `En 5 minutes, vérifiez ces points :`,
      numberedList: [
        `Le carnet existe-t-il ? Est-il à jour ?`,
        `Quand a été fait le dernier ravalement de façade ?`,
        `La toiture a-t-elle été refaite ou réparée récemment ?`,
        `L'ascenseur est-il sous contrat de maintenance ?`,
        `La chaudière collective a quel âge ?`,
        `Y a-t-il des contrats d'entretien actifs (ménage, espaces verts, VMC) ?`,
        `Les diagnostics obligatoires (amiante, DPE collectif) ont-ils été réalisés ?`,
      ],
    },
  ],

  conclusion: `Le carnet d'entretien, c'est 5 minutes de lecture pour savoir si l'immeuble est entretenu ou laissé à l'abandon. Un immeuble bien suivi avec des travaux réguliers, c'est moins de surprises et des charges plus stables.

Demandez-le. Si le syndic ne l'a pas, c'est déjà une information en soi.`,

  cta: {
    title: `Un carnet d'entretien dans votre dossier ?`,
    description: `Verimo croise le carnet d'entretien avec vos PV d'AG et le PPPT pour identifier les travaux à venir et leur impact sur vos charges.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'analyser-pv-ag-avant-achat',
    'fonds-travaux-obligatoire-2026',
    'appels-fonds-exceptionnels-documents',
    'fiche-synthetique-copropriete',
  ],
};

export default article;

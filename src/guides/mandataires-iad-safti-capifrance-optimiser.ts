/**
 * Guide : Mandataires IAD, SAFTI, Capifrance — optimiser son temps sur les dossiers
 * Catégorie : Professionnels > Agents & Mandataires
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'mandataires-iad-safti-capifrance-optimiser',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 6,

  seo: {
    title: `Mandataires IAD, SAFTI, Capifrance : optimiser son temps sur les dossiers — Guide Verimo`,
    description: `En tant que mandataire indépendant, chaque minute compte. Comment pré-analyser vos dossiers rapidement et apporter plus de valeur à vos clients. Guide pro 2026.`,
  },

  title: `Mandataires IAD, SAFTI, Capifrance : optimiser son temps sur les dossiers`,
  subtitle: `En tant qu'indépendant, chaque minute compte. Comment automatiser la pré-analyse.`,

  intro: `Vous êtes mandataire chez IAD, SAFTI, Capifrance ou un autre réseau. Vous gérez tout : prospection, visites, négociation, administratif. Le temps passé à lire des PV d'AG et des diagnostics, c'est du temps en moins pour trouver des mandats et accompagner vos clients.

Pourtant, le devoir de conseil est le même que pour un agent en agence. Et vos clients attendent la même qualité de service. La solution : systématiser la pré-analyse pour qu'elle prenne 10 minutes au lieu de 2 heures.`,

  sections: [
    {
      id: 'realite-mandataire',
      title: `La réalité du mandataire indépendant`,
      content: `En réseau de mandataires, vous n'avez pas d'assistant, pas de service juridique, pas de back-office dédié. Tout repose sur vous :`,
      bullets: [
        `La collecte des documents — vous relancez le vendeur, le syndic, le diagnostiqueur`,
        `La lecture des documents — 200 pages par dossier en moyenne`,
        `L'explication au client — traduire le jargon en langage clair`,
        `La gestion des alertes — repérer les problèmes et les signaler avant le compromis`,
      ],
    },
    {
      id: 'methode-systematique',
      title: `La méthode systématique en 4 étapes`,
      content: `Pour chaque nouveau mandat, suivez toujours le même processus :`,
      numberedList: [
        `Collecte immédiate — dès la signature du mandat, demandez tous les documents au vendeur. PV d'AG, diagnostics, état daté, règlement. Ne lancez pas les visites sans avoir au minimum le DPE et les charges`,
        `Pré-analyse en 10 minutes — utilisez la méthode express : DPE (3 min), PV d'AG mots-clés (3 min), état daté partie 3 (2 min), bilan alertes (2 min)`,
        `Fiche résumé — créez une fiche d'une page par bien avec les infos clés : prix, surface, charges, DPE, travaux votés, alertes. Transmettez-la à chaque acquéreur potentiel`,
        `Analyse approfondie si offre — quand un acheteur fait une offre, approfondissez l'analyse ou faites-la faire par un outil spécialisé`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le template qui fait gagner du temps`,
        content: `Créez un template de fiche résumé que vous réutilisez pour chaque bien. Même format, mêmes rubriques. En 5 minutes, c'est rempli. Et ça donne une image professionnelle à vos clients.`,
      },
    },
    {
      id: 'gagner-mandats',
      title: `Comment l'analyse documentaire vous aide à gagner des mandats`,
      content: `En rendez-vous vendeur, proposez un service que les autres ne proposent pas :`,
      bullets: [
        `"Je fais une analyse documentaire de votre bien avant la mise en vente" — ça impressionne le vendeur et ça montre votre sérieux`,
        `"Je prépare un dossier complet pour les acquéreurs" — le vendeur comprend que vous allez faciliter la vente`,
        `"Je repère les points faibles pour fixer le bon prix" — le vendeur voit que vous êtes honnête et compétent`,
        `"Je fournis un rapport d'analyse à chaque acquéreur" — le vendeur sait que ses acheteurs seront informés et décideront plus vite`,
      ],
    },
    {
      id: 'outils',
      title: `Les outils pour gagner du temps`,
      content: `Plusieurs solutions existent pour automatiser la pré-analyse :`,
      bullets: [
        `Les outils d'analyse documentaire en ligne — vous uploadez les documents, vous recevez un rapport en quelques minutes. Idéal pour les mandataires qui gèrent 5 à 15 mandats en parallèle`,
        `Les checklists standardisées — une liste de 15 points à vérifier systématiquement. Moins précis qu'un outil, mais mieux que rien`,
        `La formation continue — les réseaux (IAD, SAFTI, Capifrance) proposent des formations sur l'analyse documentaire. Profitez-en pour monter en compétence`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Le calcul économique`,
        content: `Un outil d'analyse coûte quelques euros par dossier. Un mandat perdu parce que vous n'avez pas repéré un problème coûte des milliers d'euros de commission. Le choix est vite fait.`,
      },
    },
  ],

  conclusion: `Le mandataire qui systématise sa pré-analyse documentaire gagne sur tous les tableaux : il protège ses clients, il sécurise ses commissions, et il se démarque de la concurrence. 10 minutes par dossier, c'est un investissement qui rapporte.`,

  cta: {
    title: `Optimisez vos dossiers avec Verimo Pro`,
    description: `Analyse en quelques minutes, rapport professionnel, partage client. Verimo Pro est conçu pour les mandataires qui veulent gagner du temps sans sacrifier la qualité.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'mandataire-analyser-dossier-10-minutes',
    'securiser-transactions-checklist-agent',
    'agent-differencier-analyse-documentaire',
    'fideliser-clients-rapport-analyse',
  ],
};

export default article;

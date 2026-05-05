/**
 * Guide : Marchand de biens — détecter les bonnes affaires dans les PV d'AG
 * Catégorie : Professionnels > Investisseurs & Marchands de biens
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'marchand-biens-bonnes-affaires-pv-ag',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Marchand de biens : détecter les opportunités dans les PV d'AG — Guide Verimo`,
    description: `Comment un marchand de biens repère les bonnes affaires dans les PV d'assemblée générale. Travaux refusés, copros en difficulté, décotes. Guide pro 2026.`,
  },

  title: `Marchand de biens : détecter les bonnes affaires dans les PV d'AG`,
  subtitle: `Travaux refusés, copropriété en difficulté — transformer les problèmes en opportunités.`,

  intro: `En tant que marchand de biens, vous ne cherchez pas un appartement parfait — vous cherchez un appartement sous-évalué. Et les PV d'AG sont votre meilleur outil de détection.

Un immeuble avec des travaux repoussés depuis 3 ans, des impayés en hausse, un syndic qui change tout le temps — pour un particulier, c'est un signal de fuite. Pour vous, c'est une opportunité si le prix est bon.`,

  sections: [
    {
      id: 'signaux-opportunite',
      title: `Les signaux d'opportunité dans les PV`,
      content: `Ce que les autres fuient, vous le cherchez :`,
      bullets: [
        `Des travaux votés mais financièrement lourds — les copropriétaires vendent pour éviter de payer. Le prix baisse`,
        `Des travaux refusés en AG depuis 2-3 ans — l'immeuble se dégrade, les prix baissent, mais le potentiel de valorisation est intact`,
        `Un DPE collectif en F ou G — décote importante, mais les aides à la rénovation (MaPrimeRénov Copro) peuvent couvrir une partie`,
        `Des impayés élevés — les lots des copropriétaires en difficulté se vendent souvent en dessous du marché`,
        `Un syndic provisoire ou un administrateur judiciaire — signe d'une copro en crise, mais aussi de prix cassés`,
      ],
    },
    {
      id: 'calcul-marchand',
      title: `Le calcul du marchand de biens`,
      content: `Pour chaque opportunité, votre calcul est :`,
      numberedList: [
        `Prix d'achat (décoté par rapport au marché)`,
        `+ Frais d'acquisition (frais de notaire réduits en régime marchand)`,
        `+ Coût des travaux (rénovation lot + quote-part travaux copro)`,
        `+ Coût de portage (intérêts crédit, charges pendant la détention)`,
        `= Coût de revient total`,
        `Prix de revente estimé après travaux - Coût de revient = Marge brute`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `La règle des 20 %`,
        content: `Visez une marge brute minimum de 20 % pour couvrir les aléas (travaux plus chers que prévu, délai de revente plus long, marché qui baisse). En dessous de 15 %, le risque est trop élevé par rapport au gain.`,
      },
    },
    {
      id: 'documents-croiser',
      title: `Les documents à croiser`,
      content: `Pour valider une opportunité, croisez :`,
      bullets: [
        `Les PV d'AG — travaux, impayés, procédures, ambiance`,
        `L'état daté — dettes du vendeur, appels de fonds à venir`,
        `Le DPE individuel et collectif — travaux énergétiques à prévoir`,
        `Le PPPT — les travaux copro sur 10 ans (votre coût de portage)`,
        `Le règlement de copropriété — vérifiez que votre projet (division, changement d'usage) est autorisé`,
        `Le PLU — si vous prévoyez une extension ou un changement de destination`,
      ],
    },
    {
      id: 'pieges-marchand',
      title: `Les pièges à éviter`,
      content: `Même pour un marchand expérimenté, certains dossiers sont toxiques :`,
      bullets: [
        `Copropriété avec plus de 40 % d'impayés — même à prix cassé, le risque de procédure collective est trop élevé`,
        `Amiante en état 3 dans les parties communes — le coût de désamiantage peut exploser votre budget`,
        `Arrêté de péril ou d'insalubrité — les obligations de travaux sont imposées par la mairie, pas par vous`,
        `Règlement de copropriété très restrictif — si vous prévoyez de diviser un lot et que le règlement l'interdit, vous êtes bloqué`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `La ligne rouge`,
        content: `Un immeuble en procédure de carence (l'administration a pris la main) ou avec un arrêté de péril imminent est un dossier pour des spécialistes avec un budget juridique conséquent. Si c'est votre première opération, passez votre chemin.`,
      },
    },
  ],

  conclusion: `Les PV d'AG sont le radar du marchand de biens. Chaque problème mentionné est une opportunité potentielle — à condition de chiffrer correctement les travaux, de vérifier les contraintes réglementaires, et de garder une marge de sécurité suffisante.`,

  cta: {
    title: `Analysez vos opportunités rapidement`,
    description: `Verimo Pro analyse les documents de copropriété en quelques minutes. Identifiez les opportunités et les risques avant la concurrence.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'due-diligence-checklist-investisseur',
    'analyser-immeuble-rapport-documents',
    'coproprietes-difficulte-signaux-documents',
    'analyser-pv-ag-avant-achat',
  ],
};

export default article;

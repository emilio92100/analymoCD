/**
 * Guide : Vendre en copropriété — les documents spécifiques à fournir
 * Catégorie : Vendeurs > Préparer sa vente
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'vendre-copropriete-documents-specifiques',
  category: 'vendeurs',
  categoryLabel: 'Vendeurs',
  categoryIcon: '🤝',
  categoryColor: '#7c3aed',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 6,

  seo: {
    title: `Vendre en copropriété : les documents spécifiques à fournir — Guide Verimo`,
    description: `Au-delà du DDT, la vente en copropriété impose des documents supplémentaires. PV d'AG, état daté, PPPT, règlement — liste complète 2026.`,
  },

  title: `Vendre en copropriété : les documents spécifiques à fournir`,
  subtitle: `Au-delà du DDT, la vente en copropriété impose des documents supplémentaires. Liste complète.`,

  intro: `Vendre un appartement en copropriété, c'est plus de paperasse que vendre une maison. En plus du DDT classique, vous devez fournir tout un ensemble de documents de copropriété — PV d'AG, état daté, règlement, fiche synthétique, PPPT.

Depuis 2026, la liste s'est encore allongée avec l'obligation de fournir le PPPT au notaire. Si votre dossier est incomplet, le délai de rétractation de l'acheteur ne démarre pas — et il peut se rétracter à tout moment.`,

  sections: [
    {
      id: 'documents-loi-alur',
      title: `Les documents imposés par la loi ALUR`,
      content: `La loi ALUR de 2014 a considérablement allongé la liste des documents à fournir lors d'une vente en copropriété :`,
      bullets: [
        `Le règlement de copropriété et l'état descriptif de division — le document fondateur, avec tous les modificatifs successifs`,
        `Les PV des 3 dernières AG — pas juste le dernier, les trois derniers`,
        `La fiche synthétique de copropriété — résumé annuel produit par le syndic`,
        `Le carnet d'entretien de l'immeuble — historique des travaux et contrats`,
        `Le montant des charges courantes du budget prévisionnel — et les charges payées par le vendeur sur les 2 derniers exercices`,
        `Les sommes pouvant rester dues par l'acquéreur — les appels de fonds à venir sur les travaux votés`,
        `L'état global des impayés de la copropriété — et les procédures en cours`,
      ],
    },
    {
      id: 'etat-date',
      title: `L'état daté : le document clé`,
      content: `L'état daté est le document comptable que le syndic produit à l'occasion de la vente. Il détaille la situation financière de votre lot :`,
      bullets: [
        `Vos dettes éventuelles envers la copro — charges impayées, provisions non versées`,
        `Les provisions que vous avez versées — qui seront prises en compte dans le prorata`,
        `Les appels de fonds à venir — que l'acheteur devra payer`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Anticipez la commande`,
        content: `L'état daté coûte jusqu'à 380 € TTC (plafond légal). Commandez-le au syndic dès que le compromis est imminent — pas le jour de la signature. Certains syndics mettent 2 à 3 semaines pour le produire. Le pré-état daté (gratuit chez certains syndics) peut servir de document préparatoire.`,
      },
    },
    {
      id: 'pppt-2026',
      title: `Le PPPT : nouvelle obligation 2026`,
      content: `Depuis le 1er janvier 2026, le syndic doit fournir au notaire le PPPT (Projet de Plan Pluriannuel de Travaux) ou le PPT voté lors de toute vente en copropriété.

Si votre copropriété n'a pas encore réalisé son PPPT, c'est un manquement. Le syndic est en faute et les copropriétaires peuvent le mettre en demeure.

En pratique, l'absence de PPPT ne bloque pas la vente — mais le notaire le signalera, et un acheteur informé posera des questions.`,
      highlight: {
        type: 'warning' as const,
        title: `Si votre copro n'a pas de PPPT`,
        content: `Contactez votre syndic et demandez où en est la procédure. Si rien n'a été fait, proposez en AG de lancer la démarche. Ça coûte entre 2 000 et 8 000 € pour la copro, mais ça facilite les ventes de tous les lots.`,
      },
    },
    {
      id: 'comment-obtenir',
      title: `Comment obtenir ces documents`,
      content: `Le syndic est votre interlocuteur principal :`,
      bullets: [
        `Les PV d'AG — vous les avez reçus après chaque AG. Si vous les avez perdus, demandez des copies au syndic`,
        `Le règlement de copropriété — vous l'avez reçu à l'achat. Sinon, le syndic ou le notaire peut le fournir`,
        `La fiche synthétique — demandez-la au syndic. Il est obligé de la produire`,
        `Le carnet d'entretien — détenu par le syndic`,
        `L'état daté — commandez-le au syndic (formulaire ou courrier). Délai moyen : 2-3 semaines`,
        `Le PPPT — détenu par le syndic ou le conseil syndical`,
      ],
    },
    {
      id: 'erreurs-frequentes',
      title: `Les erreurs fréquentes des vendeurs`,
      content: `Les erreurs qui retardent ou compliquent les ventes en copropriété :`,
      bullets: [
        `Ne pas commander l'état daté assez tôt — le syndic prend du temps, et sans état daté le notaire ne peut pas finaliser l'acte`,
        `Fournir un seul PV d'AG au lieu de trois — l'acheteur a le droit d'en demander trois, et un dossier incomplet bloque le délai de rétractation`,
        `Oublier les modificatifs du règlement — le règlement d'origine ne suffit pas si des modifications ont été votées`,
        `Ne pas informer l'acheteur des travaux votés — les appels de fonds à venir sont dans l'état daté, mais si l'acheteur les découvre tardivement, il peut se rétracter ou renégocier`,
        `Cacher des procédures en cours — les procédures judiciaires doivent être mentionnées. Les dissimuler expose à un recours pour vice du consentement`,
      ],
    },
  ],

  conclusion: `Vendre en copropriété demande un dossier plus lourd que vendre une maison. Mais un dossier complet et bien préparé accélère la vente, rassure l'acheteur, et vous protège contre les litiges.

Commandez vos documents au syndic dès que vous décidez de vendre. Plus votre dossier est prêt tôt, moins vous risquez de retards.`,

  cta: {
    title: `Vous préparez une vente en copro ?`,
    description: `Verimo analyse votre dossier vendeur et vérifie que tout est en ordre : documents complets, cohérence financière, points à anticiper.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'documents-obligatoires-vendre-2026',
    'ddt-dossier-diagnostics-techniques',
    'etat-date-document-vendeur',
    'presenter-documents-rassurer-acheteur',
  ],
};

export default article;

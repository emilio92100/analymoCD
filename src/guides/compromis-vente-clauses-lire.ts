/**
 * Guide : Compromis de vente — les clauses à lire avant de signer
 * Catégorie : Acheteurs > Avant de signer
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'compromis-vente-clauses-lire',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 8,

  seo: {
    title: `Compromis de vente : les clauses à lire absolument avant de signer — Guide Verimo`,
    description: `Conditions suspensives, délai de rétractation, clauses pénales, annexes obligatoires : tout ce que vous devez vérifier dans un compromis de vente. Guide 2026.`,
  },

  title: `Compromis de vente : les clauses à lire avant de signer`,
  subtitle: `Conditions suspensives, délai de rétractation, clauses pénales — ce que vous devez comprendre avant de vous engager.`,

  docInfo: {
    emoji: '📝',
    label: `Compromis de vente`,
    definition: `Le compromis de vente (ou promesse synallagmatique) est l'avant-contrat qui engage vendeur et acheteur. Il fixe le prix, les conditions de la vente et ouvre un délai de rétractation de 10 jours pour l'acheteur.`,
  },

  intro: `Signer un compromis de vente, c'est la première étape concrète de votre achat immobilier. À partir de ce moment, les choses deviennent sérieuses : vous versez un dépôt de garantie (souvent 5 à 10 % du prix), vous vous engagez sous conditions, et un chrono de 10 jours commence à tourner.

Le problème, c'est que la plupart des acheteurs signent le compromis sans vraiment le lire. C'est long (30 à 50 pages avec les annexes), c'est écrit en jargon juridique, et le notaire va vite. Vous hochez la tête, vous signez, et vous croisez les doigts.

Ce guide vous explique ce qu'il faut lire, ce qu'il faut comprendre, et ce qu'il faut vérifier — avant de signer.`,

  sections: [
    {
      id: 'conditions-suspensives',
      title: `1. Les conditions suspensives — votre filet de sécurité`,
      content: `Les conditions suspensives, c'est ce qui vous protège. Si une condition n'est pas remplie dans le délai prévu, la vente est annulée et vous récupérez votre dépôt de garantie intégralement.

Les conditions suspensives standard :`,
      bullets: [
        `L'obtention du prêt — la plus courante. Si la banque refuse votre crédit, la vente est annulée. Vérifiez que le montant, le taux maximum et la durée correspondent bien à votre projet de financement`,
        `L'absence de servitude d'urbanisme — si la mairie révèle un projet de route ou de construction qui impacte le bien`,
        `L'absence de droit de préemption — si la mairie décide d'acheter le bien à votre place (droit de préemption urbain)`,
        `L'absence de vice caché révélé par les diagnostics`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Ne laissez jamais le vendeur ou l'agent supprimer la condition suspensive de prêt — même si vous êtes "sûr" d'avoir votre crédit. En cas de refus surprise de la banque, vous perdriez votre dépôt de garantie (5 à 10 % du prix). C'est arrivé à des milliers d'acheteurs.`,
      },
    },
    {
      id: 'delai-retractation',
      title: `2. Le délai de rétractation de 10 jours`,
      content: `Après la signature du compromis, vous avez exactement 10 jours calendaires pour changer d'avis. Sans motif. Sans pénalité. Vous envoyez une lettre recommandée et c'est terminé.

Ce délai commence le lendemain de la notification du compromis (envoi par recommandé ou remise en main propre).

Pendant ces 10 jours, faites tout le travail que vous n'avez pas fait avant :`,
      bullets: [
        `Lisez tous les documents annexés (PV d'AG, diagnostics, règlement de copropriété)`,
        `Faites vos calculs financiers complets (charges + taxe foncière + mensualités crédit + travaux éventuels)`,
        `Vérifiez les informations données par l'agent ou le vendeur — surface, charges annoncées, travaux à venir`,
        `Posez toutes les questions que vous n'avez pas posées pendant la signature`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Le délai de rétractation ne concerne que l'acheteur, pas le vendeur. Le vendeur est engagé dès la signature du compromis. Et attention : le délai est de 10 jours calendaires, pas ouvrés. Les week-ends et jours fériés comptent.`,
      },
    },
    {
      id: 'depot-garantie',
      title: `3. Le dépôt de garantie`,
      content: `Le compromis prévoit un dépôt de garantie versé par l'acheteur, généralement entre 5 et 10 % du prix de vente. Cet argent est séquestré chez le notaire ou l'agent immobilier — il ne va pas directement au vendeur.

Ce qu'il faut vérifier :`,
      bullets: [
        `Le montant — 5 % est standard. Au-dessus de 10 %, négociez à la baisse`,
        `Le séquestre — l'argent doit être déposé chez le notaire ou sur un compte séquestre de l'agent. Jamais directement au vendeur`,
        `Les conditions de restitution — en cas de rétractation dans les 10 jours ou de non-réalisation d'une condition suspensive, vous récupérez tout. Vérifiez que c'est bien écrit noir sur blanc`,
        `Le délai de versement — le compromis prévoit un délai (souvent 5 à 10 jours après la signature). Ne versez pas avant d'avoir signé`,
      ],
    },
    {
      id: 'clauses-penales',
      title: `4. La clause pénale — ce que vous risquez`,
      content: `La clause pénale prévoit ce qui se passe si l'une des deux parties ne respecte pas ses engagements. Typiquement : si vous renoncez à l'achat en dehors du délai de rétractation et sans condition suspensive valable, vous perdez le dépôt de garantie.

En pratique, la clause pénale fixe un montant forfaitaire (souvent 10 % du prix) que la partie défaillante doit verser à l'autre.

Ce qu'il faut vérifier :`,
      bullets: [
        `Le montant de la pénalité — il doit être le même pour les deux parties (vendeur et acheteur)`,
        `Les cas d'exonération — rétractation dans les 10 jours, non-réalisation d'une condition suspensive, force majeure`,
        `La clause de substitution — certains compromis permettent à l'acheteur de se "substituer" à un tiers (SCI, société). Vérifiez si c'est prévu`,
      ],
    },
    {
      id: 'prix-frais',
      title: `5. Le prix et les frais`,
      content: `Ça paraît évident, mais vérifiez que le prix écrit dans le compromis correspond bien à celui que vous avez négocié. Vérifiez aussi :`,
      bullets: [
        `"Frais d'agence inclus" ou "en sus" — ça change le calcul. Les frais de notaire se calculent sur le prix hors frais d'agence (le prix "net vendeur")`,
        `Qui paie les frais d'agence — par défaut c'est l'acheteur, mais c'est négociable`,
        `Le montant estimé des frais de notaire — environ 7 à 8 % dans l'ancien, 2 à 3 % dans le neuf`,
        `La répartition des charges de copropriété — les charges de l'année en cours sont réparties entre vendeur et acheteur au prorata temporis (calculé par le notaire)`,
      ],
    },
    {
      id: 'annexes',
      title: `6. Les annexes — la mine d'or cachée`,
      content: `Le compromis est accompagné d'annexes obligatoires. C'est là que se trouvent les vrais documents à lire :`,
      bullets: [
        `Le DDT complet (DPE, amiante, plomb, électricité, gaz, ERP, Carrez)`,
        `Les 3 derniers PV d'assemblée générale`,
        `Le règlement de copropriété et l'état descriptif de division`,
        `L'état daté (situation financière du lot)`,
        `Le carnet d'entretien de l'immeuble`,
        `La fiche synthétique de copropriété`,
        `Le PPPT ou PPT s'il existe`,
        `Le DPE collectif de l'immeuble`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Si des annexes manquent au moment de la signature, le délai de rétractation de 10 jours ne commence pas. Il démarre uniquement quand le dossier est complet. Certains notaires font signer avec des documents manquants — le délai repartira quand ils seront fournis.`,
      },
    },
    {
      id: 'date-signature',
      title: `7. La date de signature de l'acte définitif`,
      content: `Le compromis fixe une date prévisionnelle pour la signature de l'acte authentique chez le notaire. En général, c'est 3 à 4 mois après le compromis — le temps d'obtenir le prêt et de purger les droits de préemption.

Ce qu'il faut vérifier :`,
      bullets: [
        `Le délai est-il suffisant pour obtenir votre prêt ? Si vous avez un dossier complexe (indépendant, revenus variables), demandez 4 mois minimum`,
        `Y a-t-il une clause de prorogation ? En cas de retard (banque lente, notaire débordé), le compromis doit prévoir un mécanisme pour décaler la date sans annuler la vente`,
        `La date de remise des clés — elle peut différer de la signature. Certains vendeurs négocient de rester quelques semaines après la vente`,
      ],
    },
  ],

  conclusion: `Le compromis de vente n'est pas une formalité. C'est un contrat qui vous engage financièrement, et chaque clause compte. Prenez le temps de le lire — ou au minimum de lire les conditions suspensives, le dépôt de garantie et les annexes.

Et rappelez-vous : vous avez 10 jours pour changer d'avis. Si quelque chose ne colle pas dans les documents, c'est le moment d'en sortir.`,

  cta: {
    title: `Des documents de copropriété dans les annexes ?`,
    description: `Envoyez-les sur Verimo pendant votre délai de rétractation. Vous recevez un rapport avec score, risques et pistes de négociation — avant qu'il soit trop tard.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'verifier-10-jours-retractation',
    '10-documents-avant-offre-achat',
    'analyser-pv-ag-avant-achat',
    'premier-achat-pieges-documentaires',
  ],
};

export default article;

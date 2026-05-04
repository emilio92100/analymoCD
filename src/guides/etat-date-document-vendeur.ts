/**
 * Guide : État daté — ce que ce document révèle sur le vendeur
 * Catégorie : Copropriété > Finances & Charges
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'etat-date-document-vendeur',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 6,

  seo: {
    title: `État daté copropriété : ce qu'il révèle sur le vendeur — Guide Verimo`,
    description: `Dettes du vendeur, provisions versées, appels de fonds à venir : tout comprendre de l'état daté pour acheter en copropriété sans mauvaise surprise. Guide 2026.`,
  },

  title: `État daté : ce que ce document révèle sur le vendeur`,
  subtitle: `Dettes du vendeur, provisions versées, situation financière du lot — tout ce que l'état daté contient.`,

  docInfo: {
    emoji: '📊',
    label: `État daté`,
    definition: `Document comptable fourni par le syndic lors de la vente d'un lot en copropriété. Il détaille la situation financière du lot : charges dues par le vendeur, provisions versées, et sommes restant à appeler sur les travaux votés.`,
  },

  intro: `L'état daté est un document que beaucoup d'acheteurs ignorent. Il arrive tard dans le processus (souvent au moment du compromis), il est dense, et il ne fait pas rêver. Pourtant, c'est lui qui vous dit combien le vendeur doit à la copropriété — et surtout combien vous allez devoir payer après l'achat.

En copropriété, quand des travaux sont votés, les appels de fonds postérieurs à la vente sont à la charge de l'acheteur. L'état daté est le seul document qui vous donne ce chiffre noir sur blanc.`,

  sections: [
    {
      id: 'trois-parties',
      title: `Les 3 parties de l'état daté`,
      content: `L'état daté est structuré en trois volets obligatoires :`,
      subsections: [
        {
          title: `1. Les sommes dues par le vendeur à la copropriété`,
          content: `C'est la dette du vendeur envers le syndic. Si le vendeur a des impayés de charges, ils seront retenus sur le prix de vente par le notaire. Vous ne les paierez pas directement, mais ça vous dit quelque chose sur la situation financière du vendeur — et de la copropriété en général.

Si les impayés sont importants, demandez-vous pourquoi. Un vendeur qui ne paie pas ses charges depuis 2 ans, c'est un signal.`,
        },
        {
          title: `2. Les sommes dues par le vendeur au syndicat des copropriétaires`,
          content: `Ça inclut les provisions du budget prévisionnel déjà appelées et non payées, et les provisions pour travaux votés. Le notaire fait le prorata au jour de la vente : le vendeur paie sa part jusqu'à la date de vente, vous prenez le relais après.`,
        },
        {
          title: `3. Les sommes qui pourraient être dues par l'acquéreur`,
          content: `C'est la partie qui vous concerne le plus. Elle liste les appels de fonds à venir sur les travaux déjà votés en AG. Ces montants seront à votre charge dès la signature.

C'est souvent là que la surprise arrive : vous découvrez qu'un ravalement à 180 000 € a été voté, qu'il reste 3 appels de fonds, et que votre quote-part est de 4 500 €.`,
        },
      ],
    },
    {
      id: 'ce-que-verifier',
      title: `Ce que vous devez vérifier`,
      content: `Quand vous recevez l'état daté, concentrez-vous sur ces points :`,
      bullets: [
        `Le montant des appels de fonds à venir — c'est l'argent que vous devrez sortir en plus du prix d'achat. Intégrez-le dans votre budget`,
        `Le vendeur a-t-il des impayés — si oui, le notaire les retiendra sur le prix de vente. Mais si le vendeur est en difficulté financière, ça peut compliquer la transaction`,
        `Le fonds de travaux — quel est son montant ? Il a été constitué par les anciens copropriétaires, et il profite à tous. Mais le vendeur ne récupère pas sa part en partant`,
        `Les avances et provisions — le vendeur a-t-il payé d'avance certaines charges ? Le notaire fera les comptes, mais vérifiez que tout est cohérent avec les PV d'AG`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `L'état daté ne mentionne que les travaux déjà votés en AG. Les travaux simplement évoqués ou prévus dans le PPPT mais pas encore votés n'y figurent pas. Pour avoir une vision complète, croisez l'état daté avec les PV d'AG et le PPPT.`,
      },
    },
    {
      id: 'cout-etat-date',
      title: `Combien coûte un état daté`,
      content: `L'état daté est à la charge du vendeur. Le syndic le facture, et le prix est encadré depuis la loi ALUR.

En 2026, le plafond légal est de 380 € TTC. Dans la pratique, beaucoup de syndics facturent ce maximum, et certains ajoutent des frais annexes (frais de mutation, frais de dossier) qui peuvent faire monter la note à 500-600 €.

Ces frais sont parfois un point de friction : le vendeur rechigne à les payer tant que la vente n'est pas sûre. D'où le fait que l'état daté arrive souvent tard — au compromis plutôt qu'avant l'offre.`,
      highlight: {
        type: 'tip' as const,
        title: `Astuce`,
        content: `Demandez l'état daté avant de signer le compromis, pas au moment de la signature. Si le vendeur refuse, vous avez le droit de le demander directement au syndic — mais il vous facturera. Ça vaut le coup : mieux vaut payer 380 € pour savoir que renoncer à un achat après avoir signé.`,
      },
    },
    {
      id: 'prorata-charges',
      title: `Le prorata des charges : qui paie quoi`,
      content: `Le jour de la vente, le notaire fait un calcul de répartition des charges entre vendeur et acheteur :`,
      bullets: [
        `Les charges courantes — réparties au prorata temporis. Si la vente a lieu le 1er juillet et que le budget annuel est de 3 600 €, le vendeur paie 1 800 € (janvier-juin) et vous payez 1 800 € (juillet-décembre)`,
        `Les provisions pour travaux votés — les appels de fonds déjà payés par le vendeur restent acquis. Les appels de fonds à venir sont à votre charge`,
        `Le fonds de travaux — le vendeur ne récupère pas sa part. Elle reste dans le fonds pour l'immeuble`,
      ],
    },
    {
      id: 'checklist-etat-date',
      title: `Votre checklist état daté`,
      content: `Avant de signer le compromis, vérifiez ces points dans l'état daté :`,
      numberedList: [
        `Quel montant d'appels de fonds reste à appeler sur les travaux votés ?`,
        `Le vendeur a-t-il des impayés de charges ? Si oui, combien ?`,
        `Quel est le montant du fonds de travaux ?`,
        `Les provisions trimestrielles correspondent-elles à ce qu'on vous a annoncé ?`,
        `Y a-t-il des avances ou provisions spéciales ?`,
        `Le notaire a-t-il bien prévu le prorata des charges dans le compromis ?`,
      ],
    },
  ],

  conclusion: `L'état daté n'est pas sexy, mais c'est le thermomètre financier de votre futur lot. Il vous dit ce que le vendeur doit, ce que vous allez devoir, et dans quel état financier se trouve la copropriété.

Ne le lisez pas le jour de la signature du compromis entre deux paraphes. Demandez-le avant, prenez 15 minutes pour le décortiquer, et intégrez les montants dans votre budget d'achat.`,

  cta: {
    title: `Un état daté à comprendre ?`,
    description: `Verimo analyse votre état daté avec l'ensemble de vos documents de copropriété et vous alerte sur les montants à prévoir après l'achat.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'charges-copropriete-trop-elevees',
    'analyser-pv-ag-avant-achat',
    'appels-fonds-exceptionnels-documents',
    '10-documents-avant-offre-achat',
  ],
};

export default article;

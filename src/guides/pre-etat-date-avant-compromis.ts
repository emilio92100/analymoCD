/**
 * Guide : Pré-état daté — ce qu'il contient et pourquoi le demander avant le compromis
 * Catégorie : Copropriété > Finances & Charges
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'pre-etat-date-avant-compromis',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 6,

  seo: {
    title: `Pré-état daté : à quoi ça sert et quoi vérifier avant le compromis — Guide Verimo`,
    description: `Le pré-état daté vous informe sur la situation financière de la copropriété avant de signer. Différence avec l'état daté, contenu, prix. Guide pratique 2026.`,
  },

  title: `Pré-état daté : ce qu'il contient et pourquoi le demander avant le compromis`,
  subtitle: `Avant même de signer, ce document vous donne une première photo financière de la copropriété.`,

  docInfo: {
    emoji: '📋',
    label: `Pré-état daté`,
    definition: `Document d'information fourni par le syndic avant la signature du compromis de vente. Il donne un aperçu de la situation financière du lot et de la copropriété, sans avoir la valeur juridique de l'état daté officiel.`,
  },

  intro: `Vous avez fait une offre, elle a été acceptée. Le compromis approche. L'agent vous dit que tout est en ordre. Mais est-ce que vous savez combien de travaux ont été votés ? Est-ce que le vendeur a des dettes envers la copro ? Est-ce qu'il y a des appels de fonds à venir ?

Le pré-état daté est là pour ça. C'est un document que le syndic peut fournir rapidement, avant même que le notaire demande l'état daté officiel. Il vous donne les premières informations financières dont vous avez besoin pour signer en connaissance de cause — ou pour renégocier.`,

  sections: [
    {
      id: 'difference-etat-date',
      title: `Pré-état daté vs état daté : quelle différence ?`,
      content: `Les deux documents parlent de la même chose — la situation financière du lot dans la copropriété — mais ils n'ont pas le même statut :`,
      subsections: [
        {
          title: `Le pré-état daté`,
          content: `C'est un document d'information, pas une obligation légale. Il est fourni par le syndic à la demande du vendeur ou de l'agent, généralement avant ou au moment de la signature du compromis. Il donne un aperçu rapide : charges dues, provisions, travaux votés, fonds de travaux.

Son avantage : il arrive tôt dans le processus. Vous avez l'info avant de vous engager.

Son inconvénient : il n'a pas de valeur juridique officielle. Les chiffres peuvent bouger entre le pré-état daté et l'état daté définitif (si une AG a lieu entre-temps par exemple).`,
        },
        {
          title: `L'état daté`,
          content: `C'est le document officiel, encadré par la loi (article 20 de la loi du 10 juillet 1965). Il est obligatoire pour toute vente en copropriété et doit être fourni au notaire. Il est plus complet, plus précis, et fait foi pour le calcul du prorata des charges entre vendeur et acheteur.

Le problème : il arrive souvent tard (au moment de la signature chez le notaire), parfois trop tard pour changer d'avis.`,
        },
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le bon réflexe`,
        content: `Demandez le pré-état daté avant de signer le compromis, et l'état daté sera fourni ensuite pour la signature définitive chez le notaire. Les deux se complètent : le premier vous informe, le second vous protège juridiquement.`,
      },
    },
    {
      id: 'contenu',
      title: `Ce que contient le pré-état daté`,
      content: `Le contenu n'est pas encadré par la loi (contrairement à l'état daté), mais un bon pré-état daté fournit au minimum :`,
      bullets: [
        `Le montant des charges courantes du lot — charges trimestrielles ou mensuelles, budget prévisionnel en cours`,
        `Les éventuels impayés du vendeur — s'il doit de l'argent à la copropriété`,
        `Les travaux votés en AG et les appels de fonds restants — c'est le point crucial. Si un ravalement a été voté, combien reste-t-il à payer ?`,
        `Le montant du fonds de travaux — la réserve financière de la copropriété`,
        `Les procédures judiciaires en cours — si la copro est en contentieux`,
        `Le montant des provisions versées par le vendeur — pour le calcul du prorata à la vente`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Certains syndics fournissent des pré-états datés très légers — juste les charges trimestrielles et c'est tout. Si le document ne mentionne pas les travaux votés et le fonds de travaux, demandez des précisions. Ces informations sont dans les PV d'AG que vous pouvez aussi demander directement.`,
      },
    },
    {
      id: 'quand-demander',
      title: `Quand et comment le demander`,
      content: `Le pré-état daté se demande au syndic, généralement par le vendeur ou l'agent immobilier. Voici le bon timing :`,
      bullets: [
        `Idéalement, dès que votre offre est acceptée — avant la signature du compromis`,
        `Au plus tard, le jour du compromis — vous devez avoir ces infos sous les yeux quand vous signez`,
        `C'est le vendeur qui demande au syndic — mais vous pouvez insister auprès de l'agent pour qu'il accélère la démarche`,
      ],
      subsections: [
        {
          title: `Si le vendeur refuse ou traîne`,
          content: `Le pré-état daté n'étant pas obligatoire, certains vendeurs ne le demandent pas. Dans ce cas, vous avez deux options : demander directement les PV d'AG et la fiche synthétique au syndic (vous y avez accès en tant qu'acheteur potentiel), ou conditionner la signature du compromis à la réception du document.

Un vendeur qui refuse de fournir un pré-état daté, c'est un signal. Soit il ne connaît pas le document (ça arrive), soit il a quelque chose à cacher.`,
        },
      ],
    },
    {
      id: 'cout',
      title: `Combien ça coûte`,
      content: `Le prix du pré-état daté varie selon les syndics :`,
      bullets: [
        `Certains syndics le fournissent gratuitement — c'est de plus en plus courant, surtout chez les syndics en ligne`,
        `D'autres le facturent entre 150 et 300 € — c'est à la charge du vendeur, pas de l'acheteur`,
        `Attention aux syndics qui facturent un "forfait mutation" global — pré-état daté + état daté + questionnaire notaire. Le total peut atteindre 600 à 900 €. Le vendeur peut négocier ou mettre en concurrence`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Contrairement à l'état daté (plafonné à 380 € TTC par la loi ALUR), le pré-état daté n'a pas de plafond légal. Le prix est libre. Mais beaucoup de syndics l'incluent dans leurs prestations courantes sans frais supplémentaires.`,
      },
    },
    {
      id: 'que-verifier',
      title: `Les 5 points à vérifier dans le pré-état daté`,
      content: `Une fois le document en main, concentrez-vous sur ces points :`,
      numberedList: [
        `Les travaux votés et appels de fonds restants — c'est la surprise n°1 des acheteurs. Un ravalement à 200 000 € avec 3 appels de fonds restants, c'est plusieurs milliers d'euros qui s'ajoutent au prix d'achat`,
        `Le montant du fonds de travaux — comparez avec l'ancienneté de l'immeuble et les travaux prévus dans le PPPT. Un fonds vide pour un immeuble de 40 ans, c'est un problème`,
        `Les impayés du vendeur — s'ils sont importants, le notaire les retiendra sur le prix. Mais ça peut aussi indiquer une copro en difficulté financière`,
        `Le montant réel des charges — comparez avec ce que l'agent vous a annoncé. Si l'annonce dit "200 €/mois" et que le pré-état daté montre 280 €/mois avec les provisions travaux, il y a un écart`,
        `Les procédures en cours — des frais d'avocat en cours signifient des charges supplémentaires pour tous les copropriétaires`,
      ],
    },
    {
      id: 'transition-etat-date',
      title: `Et après ? La transition vers l'état daté`,
      content: `Le pré-état daté est votre premier niveau d'information. Il vous permet de signer le compromis en connaissance de cause — ou de renégocier si les chiffres ne collent pas avec ce qu'on vous a dit.

Ensuite, le notaire demandera l'état daté officiel au syndic pour la signature de l'acte définitif. L'état daté sera plus précis (arrêté à une date comptable exacte) et fera foi pour le prorata des charges.

Si les chiffres de l'état daté diffèrent significativement du pré-état daté (par exemple, de nouveaux travaux votés entre-temps), vous pouvez encore réagir pendant le délai de rétractation si le compromis vient d'être signé, ou demander un ajustement au notaire.`,
    },
  ],

  conclusion: `Le pré-état daté, c'est votre première ligne de défense financière quand vous achetez en copropriété. Il ne remplace pas l'état daté officiel, mais il arrive au bon moment — avant que vous ne soyez engagé.

Demandez-le systématiquement. C'est un document qui prend 5 minutes à lire et qui peut vous éviter de signer un compromis les yeux fermés sur un bien avec 8 000 € d'appels de fonds à venir.`,

  cta: {
    title: `Pré-état daté en main ?`,
    description: `Envoyez-le sur Verimo avec vos PV d'AG et vos diagnostics. Vous recevez un rapport complet qui croise toutes les informations financières de la copropriété.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'etat-date-document-vendeur',
    'charges-copropriete-trop-elevees',
    'analyser-pv-ag-avant-achat',
    '10-documents-avant-offre-achat',
  ],
};

export default article;

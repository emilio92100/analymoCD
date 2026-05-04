/**
 * Guide : Que vérifier dans les 10 jours de rétractation
 * Catégorie : Acheteurs > Avant de signer
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'verifier-10-jours-retractation',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 7,

  seo: {
    title: `Délai de rétractation 10 jours : que vérifier après le compromis — Guide Verimo`,
    description: `Vous avez signé le compromis, vous avez 10 jours. Voici exactement quoi vérifier dans les documents, les diagnostics et les finances avant qu'il soit trop tard.`,
  },

  title: `Que vérifier dans les 10 jours de rétractation`,
  subtitle: `Vous avez signé le compromis. Voici exactement quoi vérifier pendant le délai légal.`,

  intro: `Vous venez de signer le compromis. Les clés ne sont pas encore à vous, mais le chrono a commencé : vous avez 10 jours calendaires pour changer d'avis sans motif et sans pénalité. Passé ce délai, vous êtes engagé — et la seule sortie possible sera une condition suspensive non réalisée (comme un refus de prêt).

Ces 10 jours ne sont pas faits pour célébrer. Ce sont 10 jours de travail. C'est le moment de lire tout ce que vous n'avez pas lu avant, de poser toutes les questions que vous n'avez pas posées, et de vérifier que ce qu'on vous a dit correspond à la réalité des documents.`,

  sections: [
    {
      id: 'jour-1-2',
      title: `Jours 1-2 : vérifier les documents annexés`,
      content: `Le compromis est accompagné d'annexes. Vérifiez d'abord qu'elles sont toutes là :`,
      bullets: [
        `Le DDT complet (DPE, amiante, plomb, électricité, gaz, ERP, Carrez) — s'il manque un diagnostic, le délai de rétractation ne court pas tant qu'il n'est pas fourni`,
        `Les 3 derniers PV d'AG — pas juste le dernier`,
        `Le règlement de copropriété avec ses modificatifs`,
        `L'état daté ou le pré-état daté`,
        `La fiche synthétique de copropriété`,
        `Le carnet d'entretien`,
        `Le PPPT s'il existe`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Important`,
        content: `Si des documents manquent, signalez-le immédiatement au notaire par écrit (email ou recommandé). Le délai de rétractation ne démarre que quand le dossier est complet. C'est la loi.`,
      },
    },
    {
      id: 'jour-3-4',
      title: `Jours 3-4 : analyser les finances de la copropriété`,
      content: `C'est le cœur du travail. Prenez les PV d'AG et l'état daté, et vérifiez :`,
      numberedList: [
        `Les travaux votés — y a-t-il des appels de fonds à venir que vous allez payer ? Quel montant ?`,
        `Le taux d'impayés — est-il en hausse ? Au-dessus de 15 %, c'est un signal`,
        `Le fonds de travaux — est-il alimenté au minimum légal (2,5 % du budget) ? Quel est son montant ?`,
        `L'évolution des charges sur 3 ans — augmentent-elles de plus de 5 % par an ?`,
        `Les procédures judiciaires — combien, depuis quand, pour quel montant ?`,
        `Les dettes du vendeur — l'état daté montre s'il a des impayés envers la copro`,
      ],
    },
    {
      id: 'jour-5-6',
      title: `Jours 5-6 : vérifier les diagnostics techniques`,
      content: `Reprenez chaque diagnostic du DDT et vérifiez les points suivants :`,
      bullets: [
        `DPE — la classe correspond-elle à ce qui était annoncé ? Vérifiez la date : un DPE d'avant juillet 2021 n'est plus valable`,
        `Amiante — si le diagnostic est positif, évaluez l'impact : travaux de désamiantage à prévoir, restrictions sur les rénovations futures`,
        `Électricité et gaz — des anomalies détectées ? Chiffrez les mises aux normes (un tableau électrique à refaire coûte 1 500 à 3 000 €)`,
        `Surface Carrez — comparez avec la surface annoncée. Si l'écart dépasse 5 %, vous pouvez demander une réduction de prix proportionnelle dans l'année qui suit la vente`,
        `ERP — votre futur logement est-il en zone inondable, en zone sismique, sur un sol pollué ? Ce n'est pas rédhibitoire, mais ça impacte l'assurance et la revente`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Astuce`,
        content: `Si la surface Carrez diffère de plus de 5 % par rapport à ce qui est indiqué dans le compromis, ne vous rétractez pas tout de suite. Vous disposez d'un an après la vente pour demander une réduction de prix proportionnelle. C'est un droit prévu par la loi.`,
      },
    },
    {
      id: 'jour-7-8',
      title: `Jours 7-8 : vérifier le règlement de copropriété`,
      content: `Lisez au minimum les clauses suivantes :`,
      bullets: [
        `La destination de l'immeuble — habitation, mixte, bourgeoise ? Si vous comptez louer en Airbnb ou exercer une activité pro, vérifiez que c'est autorisé`,
        `La répartition des charges — vos tantièmes sont-ils cohérents avec votre lot ?`,
        `Les restrictions d'usage — animaux, travaux, activités professionnelles`,
        `Les parties privatives vs communes — vos fenêtres, votre balcon, votre cave sont-ils bien privatifs ?`,
        `Les servitudes — droit de passage, vue, surélévation`,
      ],
    },
    {
      id: 'jour-9',
      title: `Jour 9 : faire le bilan et décider`,
      content: `Posez-vous ces questions :`,
      numberedList: [
        `Le prix est-il justifié au regard de tout ce que j'ai découvert ?`,
        `Y a-t-il des coûts cachés que l'agent ne m'a pas mentionnés ? (appels de fonds, travaux à venir, charges réelles vs annoncées)`,
        `Les diagnostics révèlent-ils des travaux importants dans mon lot ? (électricité, amiante, isolation)`,
        `La copropriété est-elle bien gérée ? (syndic stable, budget maîtrisé, fonds de travaux suffisant)`,
        `Mon budget total (prix + frais + travaux + charges) reste-t-il dans mes capacités ?`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Si vous hésitez`,
        content: `Un doute n'est pas une raison suffisante pour se rétracter — mais un problème financier ou technique non résolu, si. Si vous découvrez un élément majeur (gros travaux non mentionnés, impayés importants, diagnostic inquiétant), vous pouvez vous rétracter sans aucune pénalité. Mieux vaut perdre un bien que perdre de l'argent.`,
      },
    },
    {
      id: 'jour-10',
      title: `Jour 10 : agir si nécessaire`,
      content: `Si vous décidez de vous rétracter, vous devez envoyer une lettre recommandée avec accusé de réception au vendeur (ou au notaire) avant la fin du 10e jour. La date qui compte, c'est la date d'envoi (le cachet de la Poste), pas la date de réception.

Si vous ne vous rétractez pas, le processus continue normalement vers la signature de l'acte définitif (généralement 3 à 4 mois plus tard).

Et si vous avez trouvé des éléments de négociation (travaux à prévoir, diagnostics défavorables, écart de surface), vous pouvez encore demander un avenant au compromis pour ajuster le prix — même après le délai de rétractation. Le vendeur n'est pas obligé d'accepter, mais la discussion est légitime.`,
    },
  ],

  conclusion: `10 jours, c'est court. Mais c'est suffisant si vous êtes organisé. Les jours 1-2 pour vérifier que tout est là, 3-6 pour analyser les finances et les diagnostics, 7-8 pour le règlement, 9 pour décider, 10 pour agir.

Ne perdez pas ces jours à choisir la couleur de la cuisine. Utilisez-les pour vérifier que vous ne faites pas une erreur à 250 000 €.`,

  cta: {
    title: `10 jours pour tout vérifier ?`,
    description: `Envoyez vos documents sur Verimo le jour de la signature. Vous recevez votre rapport avant la fin du délai de rétractation.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'compromis-vente-clauses-lire',
    '10-documents-avant-offre-achat',
    'analyser-pv-ag-avant-achat',
    'dpe-comment-lire-avant-achat',
  ],
};

export default article;

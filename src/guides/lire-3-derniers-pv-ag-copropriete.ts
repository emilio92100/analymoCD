/**
 * Guide : Pourquoi lire les 3 derniers PV d'AG avant d'acheter en copropriété
 * Catégorie : Copropriété > Documents de copropriété
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'lire-3-derniers-pv-ag-copropriete',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 6,

  seo: {
    title: `Pourquoi lire les 3 derniers PV d'AG avant d'acheter — Guide Verimo`,
    description: `Un seul PV d'AG ne suffit pas. Comparer 3 années de procès-verbaux révèle les tendances, les travaux reportés et les tensions récurrentes. Guide 2026.`,
  },

  title: `Pourquoi lire les 3 derniers PV d'AG avant d'acheter en copropriété`,
  subtitle: `Un seul PV ne suffit pas. Comparer trois années révèle les tendances, les travaux reportés et les tensions récurrentes.`,

  intro: `On vous donne un PV d'AG, celui de la dernière assemblée. Vous le lisez, tout semble normal : budget voté, quitus au syndic, pas de gros travaux. Parfait, on signe ?

Non. Un seul PV, c'est une photo instantanée. Trois PV, c'est un film. Et c'est dans le film que vous voyez les problèmes arriver.

Un ravalement reporté depuis 3 ans ? Ça ne se voit que si vous comparez. Des charges qui augmentent de 8 % chaque année ? Pareil. Un syndic qui change tous les ans ? Vous ne le saurez qu'en regardant la séquence.`,

  sections: [
    {
      id: 'tendances-budget',
      title: `Repérer les tendances budgétaires`,
      content: `Le budget d'une copropriété évolue chaque année. Un seul PV vous donne le budget voté pour l'année en cours, mais pas la dynamique.

En comparant 3 ans, vous pouvez voir :`,
      bullets: [
        `Si les charges augmentent régulièrement — une hausse de 3-4 % par an, c'est l'inflation. Au-dessus de 6-8 %, il y a un problème de fond (énergie, entretien différé, mauvaise gestion)`,
        `Si le budget prévisionnel est réaliste — comparez le budget voté avec les dépenses réelles de l'année suivante. Si la copro dépense systématiquement 15 % de plus que prévu, les charges vont encore augmenter`,
        `Si certains postes explosent — le chauffage a doublé en 3 ans ? L'assurance a pris 30 % ? Ce sont des signaux concrets`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Comment faire`,
        content: `Prenez les 3 PV, notez le budget voté et les dépenses réelles de chaque année. Mettez-les côte à côte. En 5 minutes, vous voyez la tendance. Si les dépenses réelles dépassent le budget chaque année, les charges vont monter.`,
      },
    },
    {
      id: 'travaux-reportes',
      title: `Détecter les travaux reportés`,
      content: `C'est le piège classique. Un copropriétaire propose des travaux en AG, le vote est repoussé "à l'année prochaine". L'année suivante, même scénario. Et la troisième année, le problème a empiré et le devis a doublé.

Les travaux reportés les plus courants :`,
      bullets: [
        `Le ravalement de façade — obligatoire dans certaines communes (tous les 10 ans à Paris), souvent repoussé parce que le budget est lourd. Plus on attend, plus c'est cher`,
        `La réfection de toiture — une fuite repérée et non traitée finit par causer des dégâts dans les appartements du dernier étage`,
        `Le remplacement de la chaudière collective — une chaudière de 25 ans qui "tient encore" va finir par lâcher. Et le remplacement en urgence coûte plus cher qu'un remplacement planifié`,
        `La mise aux normes de l'ascenseur — les normes évoluent, et un ascenseur non conforme peut être arrêté par un contrôleur`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Si vous voyez le même sujet de travaux apparaître dans les 3 PV sans être voté, c'est que la copro repousse le problème. Attendez-vous à ce que le vote finisse par passer — et prévoyez le budget correspondant.`,
      },
    },
    {
      id: 'impayes-evolution',
      title: `Suivre l'évolution des impayés`,
      content: `Le taux d'impayés dans une copropriété, c'est comme la fièvre chez un patient. Un PV vous donne la température du jour. Trois PV vous disent si ça monte ou si ça descend.

Ce qui compte :`,
      bullets: [
        `Impayés stables autour de 5-8 % — situation normale, la copro gère`,
        `Impayés en hausse constante (8 % → 12 % → 18 %) — la copro se fragilise. Des copropriétaires décrochent, le budget se tend, les travaux sont repoussés`,
        `Impayés au-dessus de 25 % — seuil d'alerte légal. Le syndic doit signaler la situation à l'administration. La copro est officiellement en difficulté`,
      ],
    },
    {
      id: 'syndic-stabilite',
      title: `Évaluer la stabilité du syndic`,
      content: `Un bon syndic, c'est un syndic qui reste. Si vous voyez dans les 3 PV que le syndic a changé deux fois, posez-vous des questions :`,
      bullets: [
        `Pourquoi les copropriétaires ont-ils changé ? Mauvaise gestion, manque de réactivité, comptes opaques ?`,
        `Le nouveau syndic fait-il mieux ? Comparez les budgets et la gestion entre les deux mandats`,
        `Le quitus a-t-il été refusé ? Un refus de quitus, c'est un vote de défiance. Deux refus en 3 ans, c'est un immeuble avec des problèmes de gestion sérieux`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Un changement de syndic n'est pas toujours négatif. Parfois, c'est signe que les copropriétaires s'impliquent et veulent améliorer la gestion. Mais un changement tous les ans, c'est de l'instabilité.`,
      },
    },
    {
      id: 'procedures',
      title: `Identifier les contentieux récurrents`,
      content: `Les procédures judiciaires en copropriété peuvent durer des années. Un seul PV vous dit qu'il y a une procédure "en cours". Trois PV vous montrent depuis combien de temps et si ça s'aggrave.

Les cas typiques :`,
      bullets: [
        `Procédure contre un copropriétaire pour impayés — si ça dure depuis 3 ans, c'est que le recouvrement est compliqué (copropriétaire insolvable). Les frais d'avocat s'accumulent`,
        `Procédure contre un ancien syndic — souvent pour mauvaise gestion ou comptes non rendus. Ça peut traîner et les honoraires d'avocat sont partagés entre tous`,
        `Procédure avec un voisin ou un prestataire — travaux mal faits, dégât des eaux non réglé. Si ça traîne sur 3 PV, c'est que le problème est complexe`,
      ],
    },
    {
      id: 'methode-lecture',
      title: `La méthode de lecture rapide en 15 minutes`,
      content: `Vous n'avez pas besoin de lire les 3 PV intégralement. Voici la méthode express :`,
      numberedList: [
        `Ouvrez les 3 PV côte à côte (ou sur 3 onglets)`,
        `Allez directement aux résolutions de travaux — cherchez les mots "travaux", "ravalement", "toiture", "chaudière", "ascenseur"`,
        `Notez le budget voté et les dépenses réelles de chaque année`,
        `Cherchez la résolution "impayés" ou "recouvrement" — notez le montant`,
        `Regardez le vote du quitus au syndic — unanimité ou contesté ?`,
        `Repérez les sujets qui reviennent d'un PV à l'autre sans être résolus`,
        `Vérifiez si le DPE collectif et le PPPT ont été mis à l'ordre du jour`,
      ],
    },
  ],

  conclusion: `Trois PV d'AG, c'est 15 minutes de lecture ciblée et des milliers d'euros d'informations. Ne vous contentez jamais d'un seul PV. La vraie histoire de la copropriété, c'est dans la comparaison qu'elle se raconte.

Demandez les 3 derniers — le vendeur est tenu de les fournir. S'il n'a que le dernier, demandez au syndic.`,

  cta: {
    title: `3 PV d'AG à analyser ?`,
    description: `Verimo croise les informations de vos 3 PV et détecte les tendances, les travaux reportés et les alertes financières que vous pourriez manquer.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'analyser-pv-ag-avant-achat',
    'charges-copropriete-trop-elevees',
    'fonds-travaux-obligatoire-2026',
    'etat-date-document-vendeur',
  ],
};

export default article;

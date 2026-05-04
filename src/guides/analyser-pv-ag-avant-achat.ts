/**
 * Guide : Comment analyser un PV d'AG avant d'acheter un appartement
 * Catégorie : Copropriété > Documents de copropriété
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'analyser-pv-ag-avant-achat',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  tag: 'Essentiel',
  publishedAt: '2026-05-04',
  updatedAt: '2026-05-04',
  readingTime: 9,

  seo: {
    title: "Comment analyser un PV d'AG avant d'acheter — Guide Verimo",
    description: "Apprenez à lire un procès-verbal d'assemblée générale de copropriété. Les 5 points à vérifier absolument avant de signer un compromis. Guide pratique 2026.",
  },

  title: "Comment analyser un PV d'AG avant d'acheter un appartement",
  subtitle: "Les 5 points clés à vérifier dans un procès-verbal d'assemblée générale pour éviter les mauvaises surprises.",

  docInfo: {
    emoji: '💡',
    label: "PV d'AG",
    definition: "Le procès-verbal d'assemblée générale est le compte-rendu officiel des décisions votées par les copropriétaires. Il est rédigé par le syndic après chaque réunion annuelle.",
  },

  intro: `Vous avez trouvé l'appartement parfait. Le prix est bon, le quartier vous plaît, les photos sont belles. Mais avant de signer quoi que ce soit, il y a un document que beaucoup d'acheteurs survolent — voire ignorent complètement — et c'est une erreur coûteuse.

Le procès-verbal d'assemblée générale (PV d'AG) est probablement le document le plus révélateur de l'état réel d'une copropriété. C'est là que se cachent les travaux à venir, les tensions entre copropriétaires, les problèmes d'argent et les décisions qui vont directement impacter votre portefeuille.

Vous avez le droit de demander les 3 derniers PV d'AG au vendeur ou à l'agent immobilier. Et vous devriez le faire systématiquement.`,

  sections: [
    {
      id: 'pourquoi-lire-pv',
      title: "Pourquoi le PV d'AG est le document n°1 à lire",
      content: `Le PV d'AG, c'est le journal de bord de la copropriété. Chaque année, les copropriétaires se réunissent pour voter le budget, décider des travaux, changer (ou garder) le syndic, et régler les problèmes.

Tout est consigné dans le PV : les décisions prises, les montants votés, les résolutions rejetées, et même les débats houleux. C'est une mine d'or pour un acheteur.

Le problème, c'est que la plupart des gens ne le lisent pas — ou le lisent en diagonale. Le PV fait souvent 30 à 50 pages, c'est dense, et le vocabulaire juridique n'aide pas.

Mais si vous passez à côté, vous risquez d'acheter un appartement dans un immeuble où :`,
      bullets: [
        'Un ravalement de façade à 300 000 € a été voté — et votre quote-part arrive dans 6 mois',
        'Le syndic est en procédure judiciaire contre un copropriétaire pour impayés',
        'La toiture fuit depuis 2 ans et personne ne veut voter les travaux',
        'Le fonds de travaux est vide alors que l'immeuble a 40 ans',
      ],
    },
    {
      id: 'travaux-votes',
      title: '1. Les travaux votés (et ceux qui arrivent)',
      content: `C'est le point le plus important. Ouvrez le PV et cherchez toutes les résolutions qui mentionnent des travaux.

Il y a deux cas de figure :`,
      subsections: [
        {
          title: 'Les travaux déjà votés',
          content: `Si des travaux ont été votés avant la vente, les appels de fonds restants sont à la charge de l'acheteur — c'est-à-dire vous. Concrètement, si un ravalement a été voté en 2024 pour 250 000 € avec des appels de fonds étalés sur 2025-2026, vous devrez payer votre part dès la signature.

Ce n'est pas une arnaque, c'est la loi. Mais si l'agent immobilier ne vous le dit pas clairement, ça peut faire très mal.`,
        },
        {
          title: 'Les travaux évoqués mais pas encore votés',
          content: `Parfois, le syndic ou un copropriétaire signale un problème (infiltration, ascenseur vieillissant, mise aux normes électrique) sans que le vote ait lieu. Le sujet est "mis à l'ordre du jour de la prochaine AG".

Traduction : les travaux arrivent, la facture aussi. Ce n'est pas encore officiel, mais c'est un signal fort.`,
        },
      ],
      highlight: {
        type: 'warning' as const,
        title: 'Point de vigilance',
        content: "Regardez si les mêmes travaux reviennent d'un PV à l'autre sans être votés. Ça veut dire que la copro repousse un problème — et que la facture grossit chaque année.",
      },
    },
    {
      id: 'budget-charges',
      title: '2. Le budget et les charges',
      content: `Chaque PV contient le vote du budget prévisionnel pour l'année à venir, et souvent l'approbation des comptes de l'année passée.

Ce qui doit attirer votre attention :`,
      bullets: [
        "L'écart entre le budget prévisionnel et les dépenses réelles — si la copro dépense systématiquement plus que prévu, les charges vont augmenter",
        "Le montant du fonds de travaux — depuis la loi ALUR, chaque copropriété doit cotiser au moins 2,5 % du budget prévisionnel par an dans un fonds de travaux. Si le fonds est faible alors que l'immeuble est ancien, c'est un signal d'alerte",
        "Les postes qui explosent — chauffage collectif, gardien, assurance, entretien courant. Comparez d'une année sur l'autre",
        "Les charges de votre lot spécifiquement — demandez au syndic le décompte individuel si ce n'est pas dans le PV",
      ],
      highlight: {
        type: 'tip' as const,
        title: 'Astuce',
        content: "Pour savoir si les charges sont normales, divisez le budget annuel par la surface totale de la copropriété. En 2026, la moyenne nationale tourne autour de 35 à 55 €/m²/an pour un immeuble avec ascenseur et gardien. Au-dessus de 60 €/m², posez des questions.",
      },
    },
    {
      id: 'procedures-judiciaires',
      title: '3. Les procédures judiciaires',
      content: `C'est le point que personne ne veut voir. Pourtant, il est systématiquement mentionné dans le PV — cherchez la résolution "Procédures en cours" ou "Actions judiciaires".

Une copropriété qui a des procédures en cours, ça veut dire des frais d'avocat répartis entre tous les copropriétaires. Et ces frais peuvent durer des années.

Les cas les plus fréquents :`,
      bullets: [
        "Procédure contre un copropriétaire pour impayés de charges — le syndic engage un recouvrement judiciaire. Si les impayés sont importants, c'est la copro entière qui en souffre (le budget est déséquilibré)",
        "Procédure contre un prestataire ou un voisin — travaux mal réalisés, dégât des eaux non résolu, responsabilité civile",
        "Procédure contre le syndic lui-même — mauvaise gestion, comptes opaques, manquement au devoir de conseil",
      ],
      highlight: {
        type: 'warning' as const,
        title: 'Point de vigilance',
        content: "Un immeuble avec 3 ou 4 procédures en parallèle est un signal sérieux. Les provisions pour litiges viennent gonfler les charges, et l'ambiance dans la copro est rarement au beau fixe.",
      },
    },
    {
      id: 'impayes',
      title: '4. Les impayés de charges',
      content: `Le PV mentionne souvent le taux d'impayés de la copropriété — c'est-à-dire le pourcentage de charges non payées par les copropriétaires.

Pourquoi c'est important pour vous ? Parce que quand un copropriétaire ne paie pas, la copro doit quand même payer les prestataires (syndic, gardien, entretien, assurance). L'argent manquant est compensé soit par des appels de fonds complémentaires, soit par un report sur le budget suivant.

En résumé : les impayés des autres, c'est vous qui les payez indirectement.`,
      bullets: [
        "Moins de 10 % d'impayés : situation normale pour une grande copro",
        "Entre 10 % et 25 % : attention, le budget est sous tension",
        "Plus de 25 % : copropriété en difficulté — risque de procédure d'alerte ou de mise sous administration judiciaire",
      ],
      highlight: {
        type: 'tip' as const,
        title: 'Bon à savoir',
        content: "Depuis la loi ALUR, le syndic doit signaler à l'administration les copropriétés dont le taux d'impayés dépasse 25 %. Si votre copro est dans ce cas, le PV le mentionne obligatoirement.",
      },
    },
    {
      id: 'syndic-quitus',
      title: '5. Le syndic et le quitus',
      content: `Le PV contient systématiquement le vote du quitus au syndic — c'est-à-dire l'approbation de sa gestion par les copropriétaires.

Si le quitus est refusé, c'est un signe que les copropriétaires ne sont pas satisfaits. Et si le syndic change fréquemment (tous les 1 à 2 ans), c'est souvent synonyme de problèmes de gestion récurrents.

Ce qu'il faut vérifier :`,
      bullets: [
        "Le quitus est-il voté à une large majorité, ou de justesse ?",
        "Y a-t-il un changement de syndic en cours ou récent ?",
        "Le syndic actuel est-il un professionnel ou un bénévole (syndic non-professionnel) ?",
        "Les honoraires du syndic sont-ils dans la moyenne (entre 150 et 250 €/lot/an en 2026 pour un syndic professionnel) ?",
      ],
    },
    {
      id: 'dpe-collectif-ppt',
      title: 'Bonus 2026 : DPE collectif et plan de travaux',
      content: `Depuis le 1er janvier 2026, toutes les copropriétés (y compris celles de moins de 50 lots) doivent disposer d'un DPE collectif. Ce diagnostic évalue la performance énergétique de l'immeuble dans son ensemble.

En parallèle, le PPPT (Projet de Plan Pluriannuel de Travaux) est obligatoire depuis 2025 pour toutes les copropriétés de plus de 15 ans. Ce document planifie les travaux à réaliser sur 10 ans.

Concrètement, vérifiez dans le PV :`,
      bullets: [
        "Le DPE collectif a-t-il été réalisé ? Si non, c'est un manquement à la réglementation",
        "Quelle est la classe énergétique de l'immeuble ? Un immeuble classé F ou G va nécessiter des travaux de rénovation importants",
        "Le PPPT a-t-il été présenté en AG ? Si oui, quels travaux sont prévus et à quel horizon ?",
        "Le fonds de travaux est-il suffisant pour couvrir les premières échéances du plan ?",
      ],
      highlight: {
        type: 'info' as const,
        title: 'Réglementation 2026',
        content: "Depuis le 1er janvier 2026, le syndic doit fournir le PPPT (ou le PPT voté) au notaire lors de toute vente. Si votre vendeur ne vous fournit pas ce document, demandez-le — c'est votre droit.",
      },
    },
    {
      id: 'checklist',
      title: 'Votre checklist rapide',
      content: "Avant de faire une offre, passez chaque PV d'AG au crible de ces questions :",
      numberedList: [
        "Des travaux ont-ils été votés ? Si oui, quel montant reste à appeler ?",
        "Des travaux sont-ils évoqués sans être votés ? Si oui, à quel horizon ?",
        "Le budget est-il maîtrisé ? Les dépenses réelles collent-elles au prévisionnel ?",
        "Y a-t-il des procédures judiciaires en cours ? Combien, et pour quel montant ?",
        "Quel est le taux d'impayés ? Est-il en hausse d'une année sur l'autre ?",
        "Le quitus au syndic a-t-il été voté facilement ?",
        "Le DPE collectif et le PPPT sont-ils à jour ?",
        "Le fonds de travaux est-il alimenté correctement (minimum 2,5 %/an) ?",
      ],
    },
  ],

  conclusion: `Le PV d'AG n'est pas un document sexy. C'est long, c'est technique, et ça donne rarement envie de le lire un dimanche soir. Mais c'est le document qui peut vous éviter d'acheter un appartement dans un immeuble en difficulté — ou vous donner un levier de négociation solide si vous repérez des points faibles.

Demandez les 3 derniers PV. Lisez-les. Et si vous n'avez pas le temps ou pas l'envie de le faire, faites-les analyser.`,

  cta: {
    title: 'Pas envie de lire 150 pages de PV ?',
    description: "Verimo analyse vos documents de copropriété et vous donne un rapport clair avec score /20, risques identifiés et pistes de négociation.",
    buttonText: 'Faire analyser mes documents',
    buttonLink: '/start',
  },

  relatedSlugs: [
    'lire-3-derniers-pv-ag-copropriete',
    'charges-copropriete-trop-elevees',
    'reglement-copropriete-clauses-verifier',
    '10-documents-avant-offre-achat',
  ],
};

export default article;

/**
 * Guide : Impayés en copropriété — comment détecter le risque avant d'acheter
 * Catégorie : Copropriété > Finances & Charges
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'impayes-copropriete-detecter-risque',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Impayés de copropriété : comment détecter le risque avant d'acheter — Guide Verimo`,
    description: `Des copropriétaires qui ne paient pas leurs charges fragilisent tout l'immeuble. Comment repérer les impayés dans les documents et évaluer le risque. Guide 2026.`,
  },

  title: `Impayés en copropriété : comment détecter le risque avant d'acheter`,
  subtitle: `Des copropriétaires qui ne paient pas leurs charges fragilisent tout l'immeuble. Comment repérer les signaux.`,

  intro: `Dans une copropriété, quand un copropriétaire ne paie pas ses charges, c'est tout l'immeuble qui trinque. Le syndic doit quand même payer les prestataires — gardien, entretien, assurance, chauffage. L'argent manquant est compensé par des appels de fonds complémentaires ou un report sur le budget suivant.

Résultat : vous payez indirectement pour les autres. Et si le taux d'impayés est élevé, la copro entre dans un cercle vicieux : budget déséquilibré, travaux repoussés, immeuble qui se dégrade, charges qui augmentent, nouveaux impayés.

Avant d'acheter, vous pouvez repérer ce risque dans les documents. Voici comment.`,

  sections: [
    {
      id: 'ou-trouver',
      title: `Où trouver le taux d'impayés`,
      content: `L'information est dans plusieurs documents :`,
      bullets: [
        `Le PV d'AG — cherchez la résolution "approbation des comptes" ou "recouvrement des impayés". Le montant total des impayés y est souvent mentionné`,
        `La fiche synthétique — elle résume la situation financière de la copro, y compris les dettes des copropriétaires`,
        `L'état daté — la première partie montre les dettes du vendeur. Mais ça ne vous dit pas le taux global d'impayés de la copro`,
        `Les annexes comptables — si elles sont jointes au PV, elles détaillent les créances de la copro sur les copropriétaires`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le calcul rapide`,
        content: `Prenez le montant total des impayés mentionné dans le PV, divisez-le par le budget annuel de la copro. Ça vous donne le taux d'impayés. Exemple : 15 000 € d'impayés pour un budget de 100 000 € = 15 % d'impayés.`,
      },
    },
    {
      id: 'seuils',
      title: `Les seuils à connaître`,
      content: `Tous les immeubles ont un peu d'impayés — c'est normal. Ce qui compte, c'est le niveau et la tendance :`,
      bullets: [
        `Moins de 10 % — situation saine. Quelques retards de paiement, le syndic gère`,
        `Entre 10 % et 15 % — vigilance. Le budget commence à se tendre, certains postes risquent d'être reportés`,
        `Entre 15 % et 25 % — signal d'alerte sérieux. La copro a du mal à boucler ses comptes, les travaux sont repoussés, les prestataires risquent de ne plus être payés à temps`,
        `Au-dessus de 25 % — copropriété en difficulté. Le syndic doit signaler la situation au registre national des copropriétés. L'administration peut intervenir`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le seuil légal`,
        content: `Depuis la loi ALUR, quand les impayés dépassent 25 % du budget, le syndic est obligé de saisir le registre national des copropriétés et peut alerter le maire ou le préfet. La copro peut être placée sous administration provisoire dans les cas graves.`,
      },
    },
    {
      id: 'consequences',
      title: `Les conséquences concrètes pour vous`,
      content: `Un taux d'impayés élevé a des effets en cascade sur votre quotidien de copropriétaire :`,
      bullets: [
        `Les charges augmentent — pour compenser le manque à gagner, le budget de l'année suivante est gonflé. Les copropriétaires qui paient compensent ceux qui ne paient pas`,
        `Les travaux sont repoussés — sans budget suffisant, la copro repousse l'entretien et les réparations. L'immeuble se dégrade`,
        `Les prestataires partent — un syndic, un gardien ou un prestataire de ménage non payé finit par résilier son contrat. La qualité de service baisse`,
        `L'ambiance se détériore — les AG deviennent tendues, les copropriétaires solvables se sentent lésés, les procédures de recouvrement s'accumulent`,
        `La valeur des lots baisse — un immeuble mal entretenu avec des problèmes financiers se revend moins bien`,
      ],
    },
    {
      id: 'evolution',
      title: `Regarder l'évolution sur 3 ans`,
      content: `Un taux d'impayés à un instant T ne suffit pas. Ce qui compte, c'est la tendance.

Comparez les 3 derniers PV d'AG :`,
      bullets: [
        `Impayés stables — la situation est maîtrisée, le syndic gère le recouvrement efficacement`,
        `Impayés en baisse — bon signe. Le syndic agit, les copropriétaires en difficulté régularisent`,
        `Impayés en hausse — mauvais signe. De plus en plus de copropriétaires décrochent, la spirale est enclenchée`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Un pic d'impayés ponctuel peut s'expliquer par un gros appel de fonds (ravalement) que certains copropriétaires ont du mal à payer. Ce n'est pas forcément alarmant si ça se résorbe l'année suivante. C'est la tendance sur 3 ans qui compte.`,
      },
    },
    {
      id: 'recouvrement',
      title: `Vérifier les procédures de recouvrement`,
      content: `Le PV d'AG mentionne les actions du syndic pour récupérer les impayés. Ce qu'il faut regarder :`,
      bullets: [
        `Le syndic engage-t-il des procédures ? — relances, mises en demeure, assignations. Un syndic qui ne fait rien face aux impayés est un mauvais syndic`,
        `Les procédures aboutissent-elles ? — si les mêmes copropriétaires sont en impayés depuis 3 ans sans avancée, le recouvrement est inefficace`,
        `Le coût des procédures — les frais d'avocat et d'huissier sont à la charge de la copro (et donc de tous les copropriétaires). Des procédures multiples, ça chiffre`,
        `Y a-t-il des copropriétaires en faillite personnelle ? — dans ce cas, la créance est souvent irrécouvrable. La copro doit passer la perte en charges`,
      ],
    },
    {
      id: 'copro-difficulte',
      title: `Les signes d'une copropriété en difficulté`,
      content: `Au-delà du taux d'impayés, certains signaux montrent qu'une copro est en difficulté financière :`,
      bullets: [
        `Le syndic provisoire — si un mandataire ad hoc ou un administrateur provisoire a été nommé par le tribunal, la copro est officiellement en crise`,
        `Les fournisseurs résilient — le contrat d'ascenseur ou de ménage a été résilié pour impayés`,
        `Le fonds de travaux est vide — la copro puise dans ses réserves pour payer les charges courantes`,
        `Les AG sont désertées — moins de 30 % de participation aux AG, les copropriétaires ont abandonné`,
        `L'immeuble se dégrade visiblement — parties communes sales, ascenseur en panne, boîtes aux lettres cassées, graffitis non nettoyés`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Alerte rouge`,
        content: `Si vous voyez 3 ou plus de ces signaux combinés, c'est une copropriété en difficulté. L'achat n'est pas impossible, mais le prix doit être très fortement décoté et vous devez être prêt à vous impliquer activement en AG pour redresser la situation.`,
      },
    },
    {
      id: 'checklist',
      title: `Votre checklist impayés`,
      content: `Avant de faire une offre, vérifiez ces points :`,
      numberedList: [
        `Quel est le taux d'impayés actuel ? (PV d'AG ou fiche synthétique)`,
        `Comment évolue-t-il sur les 3 dernières années ?`,
        `Le syndic engage-t-il des procédures de recouvrement ?`,
        `Combien coûtent ces procédures à la copro ?`,
        `Le vendeur lui-même a-t-il des impayés ? (état daté)`,
        `Le fonds de travaux est-il intact ou a-t-il été ponctionné ?`,
        `Y a-t-il eu une nomination d'administrateur provisoire ?`,
      ],
    },
  ],

  conclusion: `Les impayés en copropriété, c'est le problème des autres — jusqu'à ce que ça devienne le vôtre. Un immeuble avec 20 % d'impayés, c'est un immeuble où vos charges vont augmenter, où les travaux seront repoussés, et où la valeur de votre bien va baisser.

L'info est dans les documents. Prenez 10 minutes pour vérifier le taux d'impayés et son évolution. Si ça monte, réfléchissez-y à deux fois.`,

  cta: {
    title: `Des doutes sur la santé financière de la copro ?`,
    description: `Verimo analyse vos PV d'AG et votre état daté pour évaluer le risque d'impayés et la solidité financière de la copropriété.`,
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

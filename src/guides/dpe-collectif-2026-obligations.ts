/**
 * Guide : DPE collectif 2026 — nouvelles obligations et impact sur votre achat
 * Catégorie : Diagnostics > Performance énergétique
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'dpe-collectif-2026-obligations',
  category: 'diagnostics',
  categoryLabel: 'Diagnostics',
  categoryIcon: '🔍',
  categoryColor: '#d97706',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 7,

  seo: {
    title: `DPE collectif 2026 : obligations et impact sur votre achat — Guide Verimo`,
    description: `Depuis janvier 2026, toutes les copropriétés doivent avoir un DPE collectif. Ce que ça change pour les acheteurs, les travaux à prévoir et les signaux d'alerte.`,
  },

  title: `DPE collectif 2026 : nouvelles obligations et impact sur votre achat`,
  subtitle: `Les nouvelles règles du DPE collectif et ce qu'elles changent pour les acheteurs en copropriété.`,

  docInfo: {
    emoji: '🏢',
    label: `DPE collectif`,
    definition: `Le DPE collectif évalue la performance énergétique d'un immeuble dans son ensemble : parties communes, équipements collectifs, enveloppe du bâtiment. Il attribue une classe de A à G à l'immeuble, distincte du DPE individuel de chaque logement.`,
  },

  intro: `Depuis le 1er janvier 2026, toutes les copropriétés en France doivent disposer d'un DPE collectif — y compris les petites copros de moins de 50 lots qui étaient jusque-là épargnées.

Ce n'est pas juste un papier administratif de plus. Le DPE collectif détermine si votre futur immeuble va devoir engager des travaux de rénovation importants dans les années à venir. Et ces travaux, c'est vous qui les financerez via vos charges.

Voici ce que vous devez savoir avant d'acheter en copropriété en 2026.`,

  sections: [
    {
      id: 'calendrier',
      title: `Le calendrier : qui est concerné et depuis quand`,
      content: `L'obligation de DPE collectif a été mise en place progressivement par la loi Climat et Résilience :`,
      bullets: [
        `Depuis le 1er janvier 2024 — copropriétés de plus de 200 lots et immeubles en monopropriété`,
        `Depuis le 1er janvier 2025 — copropriétés de 50 à 200 lots`,
        `Depuis le 1er janvier 2026 — toutes les copropriétés, y compris celles de moins de 50 lots`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Sont concernés tous les immeubles d'habitation dont le permis de construire a été déposé avant le 1er janvier 2013. Les immeubles récents (après 2013) sont exemptés. Le DPE collectif est valable 10 ans, sauf si des travaux modifient la performance énergétique de l'immeuble.`,
      },
    },
    {
      id: 'difference-individuel',
      title: `DPE collectif vs DPE individuel : quelle différence ?`,
      content: `Les deux coexistent et se complètent :`,
      subsections: [
        {
          title: `Le DPE individuel`,
          content: `Il évalue votre logement seul : votre isolation, vos fenêtres, votre chauffage. C'est celui qui figure sur l'annonce immobilière et qui détermine si vous pouvez louer le bien.`,
        },
        {
          title: `Le DPE collectif`,
          content: `Il évalue l'immeuble entier : l'enveloppe du bâtiment (façades, toiture, planchers), les équipements collectifs (chaudière, VMC, réseaux) et les parties communes. Il donne une vision globale de la performance énergétique.`,
        },
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Votre appartement peut être classé D en individuel alors que l'immeuble est classé F en collectif. Ça veut dire que vos travaux privatifs (fenêtres, isolation intérieure) sont bons, mais que les parties communes (façade, toiture, chaudière) tirent l'immeuble vers le bas. Des travaux collectifs vont probablement arriver.`,
      },
    },
    {
      id: 'lien-pppt',
      title: `Le lien avec le PPPT`,
      content: `Le DPE collectif ne vit pas seul. Il est directement lié au PPPT (Projet de Plan Pluriannuel de Travaux), obligatoire depuis 2025 pour toutes les copropriétés de plus de 15 ans.

Le PPPT s'appuie sur le DPE collectif pour définir les travaux à engager sur 10 ans. Concrètement :`,
      numberedList: [
        `Le DPE collectif identifie les faiblesses du bâtiment (mauvaise isolation des façades, chaudière vétuste, déperditions par la toiture)`,
        `Le PPPT transforme ce diagnostic en plan d'action chiffré : quels travaux, dans quel ordre, à quel coût`,
        `L'AG vote (ou non) le plan de travaux et les appels de fonds correspondants`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Si la copro a un DPE collectif en F ou G mais n'a pas encore de PPPT, les travaux vont quand même arriver — c'est juste que personne n'a encore chiffré le montant. Ça veut dire que vous achetez sans visibilité sur les futures dépenses.`,
      },
    },
    {
      id: 'impact-acheteur',
      title: `Ce que ça change concrètement pour vous`,
      content: `En tant qu'acheteur en copropriété, le DPE collectif vous donne des informations précieuses :`,
      bullets: [
        `La classe énergétique de l'immeuble — si c'est E, F ou G, attendez-vous à des travaux collectifs importants (isolation façade, changement de chaudière, réfection toiture)`,
        `Les déperditions principales — le DPE collectif identifie par où la chaleur s'échappe au niveau de l'immeuble. Murs mal isolés ? Toiture passoire ? Simple vitrage partout ?`,
        `Les recommandations de travaux — le diagnostiqueur propose des scénarios d'amélioration avec des estimations de coût et de gain énergétique`,
        `La cohérence avec votre DPE individuel — si l'immeuble est en F mais votre appartement en D, vos travaux privatifs sont bons. Si les deux sont en F, tout est à faire`,
      ],
    },
    {
      id: 'pas-de-dpe',
      title: `Si la copropriété n'a pas de DPE collectif`,
      content: `Depuis le 1er janvier 2026, ne pas avoir de DPE collectif est une infraction à la loi Climat et Résilience. En pratique, il n'y a pas de sanction financière directe, mais les conséquences sont réelles :`,
      bullets: [
        `Le syndic engage sa responsabilité — en cas de préjudice lié à l'absence d'information, les copropriétaires peuvent se retourner contre lui`,
        `Le PPPT ne peut pas être élaboré correctement — sans DPE collectif, pas de base technique fiable pour le plan de travaux`,
        `La vente peut être compliquée — le notaire peut signaler le manquement, et un acheteur informé hésitera`,
        `L'accès aux aides est bloqué — MaPrimeRénov Copropriété et d'autres dispositifs exigent un DPE collectif comme prérequis`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Que faire`,
        content: `Si la copro n'a pas encore fait son DPE collectif, vérifiez dans le dernier PV d'AG si le sujet a été mis à l'ordre du jour. Si oui, c'est en cours. Si non, c'est un signal sur la qualité de gestion du syndic.`,
      },
    },
    {
      id: 'cout-dpe-collectif',
      title: `Combien ça coûte`,
      content: `Le DPE collectif est payé par la copropriété, réparti entre tous les copropriétaires au titre des charges communes.

Les prix varient selon la taille de l'immeuble :`,
      bullets: [
        `Petite copro (10-20 lots) — entre 1 000 et 3 000 €, soit 50 à 150 € par lot`,
        `Copro moyenne (30-50 lots) — entre 2 000 et 5 000 €, soit 40 à 100 € par lot`,
        `Grande copro (100+ lots) — entre 4 000 et 10 000 €, soit 40 à 100 € par lot`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `À retenir`,
        content: `Ce n'est pas un montant énorme rapporté à chaque copropriétaire. Ce qui coûte cher, ce sont les travaux qui en découlent — pas le diagnostic lui-même.`,
      },
    },
  ],

  conclusion: `Le DPE collectif est devenu un document incontournable pour tout acheteur en copropriété. Il vous dit dans quel état énergétique se trouve l'immeuble, quels travaux vont arriver, et combien ça va coûter.

Avant d'acheter, demandez le DPE collectif au vendeur ou au syndic. S'il n'existe pas encore, c'est un signal d'alerte. S'il existe et que l'immeuble est mal classé, chiffrez les travaux à venir et intégrez-les dans votre négociation.`,

  cta: {
    title: `DPE collectif + PV d'AG + charges : le trio gagnant`,
    description: `Envoyez vos documents sur Verimo pour avoir une vision claire de la copropriété. Score, risques financiers et travaux à prévoir dans un seul rapport.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'dpe-comment-lire-avant-achat',
    'passoire-thermique-fuir-negocier',
    'analyser-pv-ag-avant-achat',
    'fonds-travaux-obligatoire-2026',
  ],
};

export default article;

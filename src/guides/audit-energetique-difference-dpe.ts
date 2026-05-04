/**
 * Guide : Audit énergétique — différence avec le DPE et quand il est obligatoire
 * Catégorie : Diagnostics > Performance énergétique
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'audit-energetique-difference-dpe',
  category: 'diagnostics',
  categoryLabel: 'Diagnostics',
  categoryIcon: '🔍',
  categoryColor: '#d97706',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 7,

  seo: {
    title: `Audit énergétique vs DPE : différences et obligations 2026 — Guide Verimo`,
    description: `Audit énergétique obligatoire pour vendre un logement E, F ou G depuis 2025. Ce qu'il contient de plus que le DPE, son coût et son impact sur l'achat. Guide 2026.`,
  },

  title: `Audit énergétique : différence avec le DPE et quand il est obligatoire`,
  subtitle: `Depuis 2023, l'audit est requis pour les passoires thermiques. Ce qu'il contient de plus que le DPE.`,

  docInfo: {
    emoji: '🔎',
    label: `Audit énergétique`,
    definition: `Étude approfondie de la performance énergétique d'un logement, obligatoire pour la vente de maisons et immeubles en monopropriété classés E, F ou G. Il propose des scénarios de travaux chiffrés avec estimation des gains et des aides disponibles.`,
  },

  intro: `Le DPE vous donne une lettre (A à G) et une estimation de consommation. L'audit énergétique va beaucoup plus loin : il analyse le bâtiment en détail, identifie les déperditions, et vous propose des scénarios concrets de rénovation avec les coûts, les gains et les aides.

Depuis janvier 2025, l'audit est obligatoire pour vendre une maison ou un immeuble entier classé E, F ou G. Et pour l'acheteur, c'est un document précieux : il vous dit exactement combien coûtera la rénovation et combien vous économiserez.`,

  sections: [
    {
      id: 'dpe-vs-audit',
      title: `DPE et audit : deux documents différents`,
      content: `On confond souvent les deux. Voici ce qui les distingue :`,
      subsections: [
        {
          title: `Le DPE`,
          content: `Le DPE évalue et classe votre logement (A à G). Il donne une estimation de consommation en kWh/m²/an, des émissions de CO2, et des recommandations générales de travaux. Il est obligatoire pour toute vente ou location. C'est un constat, pas un plan d'action.`,
        },
        {
          title: `L'audit énergétique`,
          content: `L'audit va plus loin. Il analyse le bâtiment en profondeur (murs, toiture, fenêtres, ventilation, chauffage, eau chaude) et propose au minimum deux scénarios de travaux détaillés. Chaque scénario inclut les travaux à réaliser, le coût estimé, le gain de classe DPE, les économies d'énergie et les aides financières mobilisables. C'est un plan d'action chiffré.`,
        },
      ],
      highlight: {
        type: 'info' as const,
        title: `En résumé`,
        content: `Le DPE vous dit "votre logement est en F". L'audit vous dit "pour passer en D, faites l'isolation des combles + changez les fenêtres + installez une PAC, ça coûtera 28 000 € avant aides et 14 000 € après aides, et vous économiserez 1 200 €/an de chauffage".`,
      },
    },
    {
      id: 'quand-obligatoire',
      title: `Quand l'audit est-il obligatoire ?`,
      content: `L'obligation d'audit énergétique concerne uniquement la vente, et uniquement les monopropriétés (maisons individuelles et immeubles détenus par un seul propriétaire). Les appartements en copropriété ne sont pas concernés.

Le calendrier :`,
      bullets: [
        `Depuis le 1er avril 2023 — obligatoire pour la vente de logements classés F ou G`,
        `Depuis le 1er janvier 2025 — étendu aux logements classés E`,
        `À partir du 1er janvier 2034 — extension aux logements classés D`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Attention`,
        content: `L'audit doit être remis à l'acheteur dès la première visite, pas au compromis. Si le vendeur ne vous le fournit pas et que le bien est classé E, F ou G en monopropriété, il est en infraction. Vous pouvez l'exiger.`,
      },
    },
    {
      id: 'contenu-audit',
      title: `Ce que contient un audit énergétique`,
      content: `Un audit réglementaire doit contenir au minimum :`,
      bullets: [
        `Un état des lieux énergétique complet — performance de l'enveloppe (murs, toiture, plancher, fenêtres), des systèmes (chauffage, eau chaude, ventilation) et des consommations`,
        `Un schéma des déperditions thermiques — qui montre visuellement par où la chaleur s'échappe`,
        `Au moins deux scénarios de travaux — un parcours par étapes (minimum 2 classes de gain dès la première étape) et un parcours en une seule fois vers une rénovation performante`,
        `Le coût estimé de chaque scénario — matériaux et main d'œuvre`,
        `Les aides financières mobilisables — MaPrimeRénov, CEE, éco-PTZ, aides locales`,
        `L'estimation des économies d'énergie — en kWh et en euros par an`,
        `La classe DPE visée après travaux — au minimum un des scénarios doit viser la classe B`,
      ],
    },
    {
      id: 'impact-acheteur',
      title: `Ce que ça change pour vous en tant qu'acheteur`,
      content: `L'audit énergétique est un outil de décision et de négociation puissant :`,
      bullets: [
        `Vous savez exactement combien coûtent les travaux — pas de devinette, les scénarios sont chiffrés par un professionnel`,
        `Vous pouvez négocier le prix sur une base concrète — "l'audit dit 25 000 € de travaux pour passer en D, je baisse mon offre de 15 000 €" (en tenant compte des aides)`,
        `Vous pouvez planifier votre financement — intégrer le coût des travaux dans votre prêt immobilier ou solliciter un éco-PTZ en complément`,
        `Vous avez une feuille de route de rénovation — l'audit vous dit dans quel ordre faire les travaux pour maximiser les gains`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Bon à savoir`,
        content: `L'audit n'oblige pas le vendeur à faire les travaux. Il informe l'acheteur. Mais un audit qui montre 30 000 € de travaux est un argument de négociation redoutable — le vendeur sait que tous les acheteurs verront le même chiffre.`,
      },
    },
    {
      id: 'cout-validite',
      title: `Combien ça coûte et combien de temps c'est valable`,
      content: `L'audit est à la charge du vendeur :`,
      bullets: [
        `Le prix varie entre 800 et 1 500 € selon la taille du bien et sa complexité`,
        `Il est valable 5 ans — si le bien ne se vend pas dans les 5 ans, il faut en refaire un`,
        `Il doit être réalisé par un professionnel certifié — diagnostiqueur immobilier certifié, bureau d'études qualifié ou architecte formé`,
        `Il ne peut pas être sous-traité — le professionnel qui signe doit être celui qui a réalisé l'audit`,
      ],
    },
    {
      id: 'maprimerenov',
      title: `Le lien avec MaPrimeRénov`,
      content: `L'audit énergétique n'est pas seulement un document de vente. C'est aussi un prérequis pour accéder aux aides les plus généreuses.

Depuis 2025, pour bénéficier de MaPrimeRénov "Parcours Accompagné" (rénovation d'ampleur), un audit énergétique est obligatoire. Il sert de base pour définir les travaux éligibles et calculer le montant de l'aide.

Pour une maison classée F ou G, les aides peuvent couvrir jusqu'à 90 % du coût des travaux (selon les revenus), dans la limite de 63 000 €. L'audit est le point de départ de tout le parcours.`,
      highlight: {
        type: 'tip' as const,
        title: `Si vous achetez une passoire thermique`,
        content: `Vérifiez si l'audit fourni par le vendeur est compatible avec une demande MaPrimeRénov. Un audit réalisé avant janvier 2026 peut encore être utilisé, mais les méthodes de calcul évoluent. Renseignez-vous auprès de France Rénov avant de vous lancer.`,
      },
    },
  ],

  conclusion: `L'audit énergétique est un document bien plus utile que le DPE pour prendre votre décision d'achat. Il vous donne les travaux, les coûts, les aides et les économies — tout ce dont vous avez besoin pour savoir si le bien vaut le coup.

Si vous achetez une maison classée E, F ou G, l'audit est obligatoire et doit vous être remis avant la visite. Lisez-le attentivement : c'est votre meilleur outil de négociation.`,

  cta: {
    title: `Un audit énergétique dans votre dossier ?`,
    description: `Verimo analyse votre audit avec tous vos documents et intègre les coûts de travaux dans votre rapport. Score, risques et budget global en un seul rapport.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'dpe-comment-lire-avant-achat',
    'passoire-thermique-fuir-negocier',
    'dpe-collectif-2026-obligations',
    '10-documents-avant-offre-achat',
  ],
};

export default article;

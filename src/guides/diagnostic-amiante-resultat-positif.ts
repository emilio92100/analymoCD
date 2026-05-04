/**
 * Guide : Diagnostic amiante — que faire si le résultat est positif
 * Catégorie : Diagnostics > Sécurité & Conformité
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'diagnostic-amiante-resultat-positif',
  category: 'diagnostics',
  categoryLabel: 'Diagnostics',
  categoryIcon: '🔍',
  categoryColor: '#d97706',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Diagnostic amiante positif : que faire avant d'acheter — Guide Verimo`,
    description: `Amiante détecté dans le diagnostic ? Obligations du vendeur, risques pour l'acheteur, coût du désamiantage et impact sur le prix. Guide pratique 2026.`,
  },

  title: `Diagnostic amiante : que faire si le résultat est positif`,
  subtitle: `Obligations du vendeur, risques pour l'acheteur, coût du désamiantage — tout savoir avant de signer.`,

  docInfo: {
    emoji: '⚠️',
    label: `Diagnostic amiante`,
    definition: `Obligatoire pour tout immeuble dont le permis de construire a été déposé avant le 1er juillet 1997. Il repère la présence d'amiante dans les matériaux de construction : flocages, calorifugeages, dalles de sol, toiture, canalisations.`,
  },

  intro: `Vous lisez le diagnostic et vous voyez "présence d'amiante détectée". Premier réflexe : panique. Deuxième réflexe : appeler l'agent pour annuler.

Mais un diagnostic amiante positif ne veut pas forcément dire danger immédiat. L'amiante est dangereux quand il est dégradé et que les fibres se libèrent dans l'air. Quand il est en bon état et non accessible, il peut rester en place — sous surveillance.

Ce qui compte, c'est de comprendre ce que le diagnostic dit exactement, quelles sont les obligations, et combien ça va coûter si des travaux sont nécessaires.`,

  sections: [
    {
      id: 'comprendre-resultat',
      title: `Comprendre le résultat du diagnostic`,
      content: `Le diagnostiqueur classe les matériaux amiantés selon leur état de conservation. Il y a 3 niveaux :`,
      bullets: [
        `État 1 — bon état de conservation. L'amiante est intact, non dégradé. Pas de travaux obligatoires, mais un contrôle périodique tous les 3 ans est requis`,
        `État 2 — état intermédiaire. Des signes de dégradation apparaissent. Le propriétaire doit faire mesurer la concentration de fibres dans l'air. Si elle dépasse 5 fibres/litre, des travaux de confinement ou de retrait sont obligatoires`,
        `État 3 — matériau dégradé. L'amiante libère des fibres. Des travaux de retrait ou de confinement sont obligatoires dans un délai de 36 mois`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `La majorité des diagnostics amiante positifs sont en état 1 — c'est-à-dire que l'amiante est présent mais en bon état. Ça ne nécessite pas de travaux immédiats. Mais ça reste une information importante pour votre achat.`,
      },
    },
    {
      id: 'ou-se-cache',
      title: `Où se cache l'amiante dans un immeuble`,
      content: `L'amiante a été massivement utilisé dans la construction entre les années 1950 et 1997. On le trouve dans :`,
      bullets: [
        `Les flocages — isolation thermique et acoustique projetée sur les structures métalliques, les plafonds ou les murs. C'est le cas le plus dangereux car le flocage se dégrade facilement`,
        `Les calorifugeages — isolation des tuyaux de chauffage et d'eau chaude. Fréquent dans les sous-sols et les gaines techniques`,
        `Les dalles de sol en vinyle-amiante — les fameux carreaux de sol gris ou beige de 30x30 cm. Très courants dans les appartements des années 60-70`,
        `Les plaques de toiture en fibrociment — les toitures ondulées grises. Courantes sur les garages, les annexes et certains immeubles`,
        `Les conduits de ventilation et de cheminée — en fibrociment`,
        `Les joints de fenêtres et les mastics — moins dangereux car en faible quantité, mais présents`,
      ],
    },
    {
      id: 'obligations-vendeur',
      title: `Les obligations du vendeur`,
      content: `Le vendeur doit fournir le diagnostic amiante dans le DDT. S'il ne le fait pas :`,
      bullets: [
        `Il ne peut pas s'exonérer de la garantie des vices cachés liés à l'amiante — vous pouvez vous retourner contre lui après l'achat`,
        `Le notaire doit le signaler — en principe, il ne devrait pas laisser passer une vente sans diagnostic amiante pour un immeuble d'avant 1997`,
        `Si l'amiante est en état 2 ou 3, le vendeur doit avoir fait réaliser les mesures ou les travaux — sinon c'est une obligation non respectée`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Vérifiez la date du diagnostic. Un diagnostic amiante négatif (pas d'amiante) est valable sans limite de durée. Mais un diagnostic positif avec un état 1 doit être suivi d'un contrôle tous les 3 ans. Si le dernier contrôle date de plus de 3 ans, demandez une mise à jour.`,
      },
    },
    {
      id: 'cout-travaux',
      title: `Combien coûte le désamiantage`,
      content: `Si des travaux sont nécessaires (état 2 ou 3), voici les ordres de grandeur :`,
      bullets: [
        `Retrait de dalles de sol amiantées — 30 à 80 €/m². Pour un appartement de 60 m², comptez 1 800 à 4 800 €`,
        `Retrait de flocage ou calorifugeage — 100 à 300 €/m² de surface traitée. C'est le poste le plus cher car il nécessite un confinement complet de la zone`,
        `Retrait de toiture en fibrociment — 30 à 60 €/m² de toiture. Pour un pavillon, 3 000 à 8 000 €`,
        `Confinement (encapsulage) — alternative moins chère au retrait, entre 20 et 60 €/m². L'amiante reste en place mais est recouvert d'un matériau étanche`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Important`,
        content: `Le désamiantage doit obligatoirement être réalisé par une entreprise certifiée. Ne faites jamais de travaux vous-même sur des matériaux amiantés — c'est dangereux pour votre santé et illégal.`,
      },
    },
    {
      id: 'copropriete',
      title: `Amiante en copropriété : qui paie ?`,
      content: `En copropriété, la question de qui paie dépend de l'emplacement de l'amiante :`,
      bullets: [
        `Parties communes (flocage des plafonds de parking, calorifugeage des colonnes, toiture) — les travaux sont votés en AG et payés par tous les copropriétaires au prorata des tantièmes`,
        `Parties privatives (dalles de sol dans votre appartement, joints de fenêtres) — c'est à votre charge`,
        `Le DTA (Dossier Technique Amiante) — obligatoire pour les parties communes. Demandez-le au syndic. Il liste tous les matériaux amiantés repérés dans l'immeuble et leur état`,
      ],
    },
    {
      id: 'negocier',
      title: `Impact sur le prix et négociation`,
      content: `Un diagnostic amiante positif est un levier de négociation — surtout si des travaux sont nécessaires :`,
      bullets: [
        `État 1 sans travaux — faible impact sur le prix, mais vous pouvez mentionner la contrainte future (contrôle tous les 3 ans, travaux si dégradation)`,
        `État 2 ou 3 avec travaux obligatoires — chiffrez le coût des travaux et déduisez-le de votre offre. C'est un argument factuel que le vendeur ne peut pas contester`,
        `Dalles de sol amiantées — très courant et relativement peu cher à traiter. Mais ça complique toute rénovation future (vous ne pouvez pas casser les dalles sans désamiantage préalable)`,
      ],
    },
  ],

  conclusion: `Un diagnostic amiante positif, ce n'est pas la fin du monde. Dans la majorité des cas, l'amiante est en bon état et ne nécessite pas de travaux immédiats. Mais c'est une information qui pèse sur votre décision et votre budget — surtout si vous prévoyez des travaux de rénovation.

Lisez le diagnostic en détail, vérifiez l'état de conservation, et chiffrez les éventuels travaux. C'est un argument de négociation légitime.`,

  cta: {
    title: `Un diagnostic amiante dans votre dossier ?`,
    description: `Verimo analyse votre diagnostic amiante avec l'ensemble de vos documents et évalue l'impact sur votre achat : risques, travaux et coûts.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'dpe-comment-lire-avant-achat',
    '10-documents-avant-offre-achat',
    'diagnostic-electricite-gaz-risques',
    'achat-maison-diagnostics-documents',
  ],
};

export default article;

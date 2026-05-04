/**
 * Guide : Loi Carrez — que faire si la surface ne correspond pas
 * Catégorie : Diagnostics > Sécurité & Conformité
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'loi-carrez-surface-ne-correspond-pas',
  category: 'diagnostics',
  categoryLabel: 'Diagnostics',
  categoryIcon: '🔍',
  categoryColor: '#d97706',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 6,

  seo: {
    title: `Loi Carrez : que faire si la surface ne correspond pas — Guide Verimo`,
    description: `Écart de surface Carrez : tolérance de 5 %, recours possibles, impact sur le prix. Vos droits en cas d'erreur de mesurage. Guide pratique 2026.`,
  },

  title: `Loi Carrez : que faire si la surface ne correspond pas`,
  subtitle: `Tolérance de 5 %, recours possibles, impact sur le prix — vos droits en cas d'écart de surface.`,

  docInfo: {
    emoji: '📐',
    label: `Mesurage loi Carrez`,
    definition: `Attestation obligatoire en copropriété qui certifie la superficie privative exacte du lot, en excluant les murs, cloisons, marches, embrasures et surfaces sous 1,80 m de hauteur. Une erreur de plus de 5 % ouvre droit à une réduction de prix.`,
  },

  intro: `L'annonce dit 72 m². Le diagnostic Carrez dit 67 m². Vous venez de "perdre" 5 m² — et au prix du m² dans votre quartier, ça peut représenter 15 000 à 40 000 €.

Ce n'est pas rare. Les erreurs de surface sont fréquentes, surtout dans les appartements anciens avec des murs épais, des sous-pentes ou des recoins. Et la loi vous protège : si l'écart dépasse 5 %, vous avez droit à une réduction de prix.`,

  sections: [
    {
      id: 'ce-que-mesure-carrez',
      title: `Ce que mesure (et ne mesure pas) la loi Carrez`,
      content: `La surface Carrez, c'est la surface de plancher des locaux clos et couverts, après déduction de :`,
      bullets: [
        `Les murs, cloisons, marches et cages d'escalier`,
        `Les embrasures de portes et fenêtres`,
        `Toute surface dont la hauteur sous plafond est inférieure à 1,80 m`,
        `Les caves, garages, parkings, boxes — même s'ils sont des lots privatifs`,
        `Les balcons, terrasses et loggias (espaces ouverts)`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Attention à la confusion`,
        content: `La surface Carrez n'est pas la surface habitable. La surface habitable (loi Boutin) exclut en plus les combles non aménagés, les sous-sols, les remises et les vérandas non chauffées. En général, la surface habitable est légèrement inférieure à la surface Carrez.`,
      },
    },
    {
      id: 'ecart-5-pourcent',
      title: `La règle des 5 %`,
      content: `La loi est claire : si la surface réelle est inférieure de plus de 5 % à celle mentionnée dans l'acte de vente, l'acheteur peut demander une réduction de prix proportionnelle.

Exemple concret :`,
      bullets: [
        `Surface annoncée dans le compromis : 70 m²`,
        `Surface réelle mesurée : 66 m² (écart de 5,7 %, donc supérieur à 5 %)`,
        `Prix d'achat : 350 000 €`,
        `Réduction possible : 350 000 × (4/70) = 20 000 € (on déduit les m² manquants au prorata)`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le délai`,
        content: `Vous avez exactement 1 an à partir de la signature de l'acte authentique (chez le notaire) pour engager l'action en réduction de prix. Passé ce délai, c'est trop tard — même si l'erreur est flagrante.`,
      },
    },
    {
      id: 'quand-verifier',
      title: `Quand vérifier la surface`,
      content: `Idéalement avant de signer le compromis, mais au minimum pendant le délai de rétractation de 10 jours :`,
      bullets: [
        `Comparez la surface Carrez du diagnostic avec celle de l'annonce — si elles diffèrent, c'est déjà un signal`,
        `Comparez avec la surface indiquée dans le règlement de copropriété — c'est souvent une surface différente (surface utile ou surface au sol)`,
        `Si vous avez un doute, faites mesurer vous-même — un mètre laser coûte 30 € et vous donne une mesure fiable en 10 minutes`,
        `Vérifiez les pièces atypiques — sous-pentes, mezzanines, placards intégrés. Ce sont les zones où les erreurs sont les plus fréquentes`,
      ],
    },
    {
      id: 'erreurs-frequentes',
      title: `Les erreurs de mesurage les plus fréquentes`,
      content: `Les diagnostiqueurs ne font pas tous le même travail. Les erreurs les plus courantes :`,
      bullets: [
        `Compter les surfaces sous 1,80 m — sous les toits, dans les mezzanines, sous les escaliers. Elles ne doivent pas être comptées`,
        `Inclure un placard mural — si le placard a un plancher et une hauteur supérieure à 1,80 m, il est compté. Sinon non. La règle est floue et source d'erreurs`,
        `Oublier de déduire les cloisons épaisses — dans les immeubles anciens, les murs peuvent faire 30 à 50 cm d'épaisseur. Ça change le résultat`,
        `Compter un balcon fermé — un balcon vitré non chauffé n'est normalement pas Carrez. Mais certains diagnostiqueurs l'incluent`,
        `Erreur de mesure simple — le diagnostiqueur a pris ses mesures rapidement et s'est trompé de quelques centimètres sur chaque pièce. Cumulé, ça fait des m² en plus ou en moins`,
      ],
    },
    {
      id: 'recours',
      title: `Vos recours en cas d'erreur`,
      content: `Si vous découvrez une erreur après l'achat :`,
      numberedList: [
        `Faites mesurer par un diagnostiqueur certifié — pas vous-même, il faut un rapport officiel pour le tribunal`,
        `Si l'écart dépasse 5 %, envoyez une lettre recommandée au vendeur pour demander la réduction de prix`,
        `Si le vendeur refuse, saisissez le tribunal judiciaire dans le délai d'un an`,
        `Si l'écart est inférieur à 5 %, vous n'avez pas de recours légal — la loi prévoit une tolérance`,
        `Vous pouvez aussi vous retourner contre le diagnostiqueur si son rapport était erroné — il a une assurance professionnelle pour ça`,
      ],
    },
    {
      id: 'impact-prix',
      title: `Impact sur le prix au m²`,
      content: `L'erreur de surface change votre prix au m² réel — et donc la pertinence de votre achat :`,
      bullets: [
        `Un appartement annoncé à 5 000 €/m² sur 70 m² = 350 000 €. Si la surface réelle est 66 m², le vrai prix au m² est 5 303 €/m². Soit 6 % plus cher que ce que vous pensiez`,
        `Comparez ce prix au m² corrigé avec les biens similaires du quartier. Si la moyenne est à 5 000 €/m², vous surpayez`,
        `Utilisez cet argument pour négocier — même si l'écart est inférieur à 5 % (pas de recours légal mais argument commercial)`,
      ],
    },
  ],

  conclusion: `La surface Carrez, c'est du concret : chaque m² perdu, c'est de l'argent en trop. Vérifiez la surface avant de signer, comparez les sources (annonce, diagnostic, règlement de copropriété), et n'hésitez pas à mesurer vous-même si quelque chose ne colle pas.

Et si vous découvrez une erreur de plus de 5 % après la vente, vous avez 1 an pour agir. Ne laissez pas passer ce délai.`,

  cta: {
    title: `Un doute sur la surface ?`,
    description: `Verimo analyse votre diagnostic Carrez avec l'ensemble de vos documents et détecte les incohérences de surface entre les différentes pièces du dossier.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    '10-documents-avant-offre-achat',
    'compromis-vente-clauses-lire',
    'diagnostic-amiante-resultat-positif',
    'erp-etat-risques-pollutions',
  ],
};

export default article;

/**
 * Guide : Due diligence documentaire — la checklist de l'investisseur immobilier
 * Catégorie : Professionnels > Investisseurs & Marchands de biens
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'due-diligence-checklist-investisseur',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  tag: 'Essentiel',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 8,

  seo: {
    title: `Due diligence immobilier : checklist documentaire investisseur — Guide Verimo`,
    description: `Les documents à analyser avant un investissement immobilier : PV d'AG, DPE, charges, état daté, PPPT. Checklist complète pour investisseurs. Guide 2026.`,
  },

  title: `Due diligence documentaire : la checklist de l'investisseur immobilier`,
  subtitle: `Les documents à analyser méthodiquement avant tout investissement. Risques, rentabilité, conformité.`,

  intro: `Investir dans l'immobilier, ce n'est pas acheter un appartement. C'est acheter un flux de revenus — et les documents vous disent si ce flux est solide ou fragile.

Un investisseur qui ne fait pas sa due diligence documentaire, c'est comme un trader qui achète une action sans lire le bilan. Ça peut marcher. Mais quand ça ne marche pas, ça coûte très cher.`,

  sections: [
    {
      id: 'rentabilite-reelle',
      title: `Calculer la rentabilité réelle`,
      content: `L'annonce dit "rentabilité 7 %". La réalité est souvent différente. Pour calculer la vraie rentabilité, vous avez besoin de :`,
      bullets: [
        `Les charges réelles — pas les charges annoncées, les appels de charges des 12 derniers mois`,
        `La taxe foncière — demandez le dernier avis`,
        `Les travaux votés — appels de fonds à venir (état daté partie 3)`,
        `Les travaux prévus — PPPT sur les 5 prochaines années`,
        `Le DPE — un F ou G ne peut plus être loué (G depuis 2025, F en 2028). Travaux obligatoires avant de louer`,
        `Les charges de gestion — si vous passez par une agence, comptez 7 à 10 % des loyers`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `La formule`,
        content: `Rentabilité nette = (loyer annuel - charges - taxe foncière - travaux annualisés - gestion - vacance locative) / (prix d'achat + frais de notaire + travaux d'entrée). C'est rarement au-dessus de 4-5 % net en zone tendue.`,
      },
    },
    {
      id: 'risques-copro',
      title: `Évaluer les risques de copropriété`,
      content: `Les documents de copro révèlent le risque de votre investissement :`,
      numberedList: [
        `Taux d'impayés — au-dessus de 15 %, la copro est fragile`,
        `Procédures judiciaires — des frais partagés qui grèvent la rentabilité`,
        `Fonds de travaux — vide = gros appels de fonds à prévoir`,
        `DPE collectif — F ou G = travaux de rénovation collectifs inévitables`,
        `PPPT — les travaux prévus sur 10 ans vous donnent la projection des dépenses`,
      ],
    },
    {
      id: 'contraintes-location',
      title: `Vérifier les contraintes de location`,
      content: `Avant d'acheter pour louer, vérifiez :`,
      bullets: [
        `Le DPE individuel — G interdit à la location, F en 2028, E en 2034`,
        `Le règlement de copropriété — location meublée autorisée ? Airbnb autorisé ?`,
        `L'encadrement des loyers — votre commune est-elle concernée ? Quel plafond ?`,
        `Le marché locatif local — demande forte ou faible ? Vacance locative moyenne ?`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le piège du DPE`,
        content: `Un bien en F acheté pour louer vous laisse 2 ans (jusqu'en 2028) pour rénover. Si les travaux prennent du retard ou si la copro bloque le vote en AG, vous vous retrouvez avec un bien non louable. Intégrez ce risque dans votre calcul.`,
      },
    },
    {
      id: 'checklist-investisseur',
      title: `Votre checklist due diligence`,
      content: `Avant de faire une offre, cochez chaque point :`,
      numberedList: [
        `Rentabilité nette calculée avec les vrais chiffres (charges, taxe foncière, travaux, gestion)`,
        `DPE compatible avec la location (minimum E pour être tranquille jusqu'en 2034)`,
        `Charges au m² dans la norme (pas de surcoût injustifié)`,
        `Impayés copro sous les 15 %`,
        `Pas de gros travaux votés ou prévus dans les 3 ans (ou intégrés dans le calcul)`,
        `Règlement copro compatible avec votre projet locatif`,
        `État daté sans alerte (pas de dette vendeur, appels de fonds intégrés)`,
      ],
    },
  ],

  conclusion: `La due diligence documentaire, c'est ce qui sépare l'investisseur qui calcule de l'investisseur qui espère. Les documents contiennent toutes les informations dont vous avez besoin pour calculer la vraie rentabilité et évaluer les vrais risques. Prenez le temps de les lire — ou faites-les analyser.`,

  cta: {
    title: `Analysez vos dossiers d'investissement`,
    description: `Verimo Pro analyse les documents de copropriété en quelques minutes et vous donne la vraie photo financière du bien.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'investissement-locatif-documents-rentabilite',
    'analyser-immeuble-rapport-documents',
    'charges-copropriete-trop-elevees',
    'analyser-pv-ag-avant-achat',
  ],
};

export default article;

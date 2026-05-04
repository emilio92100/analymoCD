/**
 * Guide : Charges de copropriété — comment savoir si elles sont trop élevées
 * Catégorie : Copropriété > Finances & Charges
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'charges-copropriete-trop-elevees',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 7,

  seo: {
    title: `Charges de copropriété trop élevées : comment vérifier avant d'acheter — Guide Verimo`,
    description: `Comment savoir si les charges de copropriété sont normales avant d'acheter. Comparaison au m², postes à vérifier, signaux d'alerte. Guide pratique 2026.`,
  },

  title: `Charges de copropriété : comment savoir si elles sont trop élevées`,
  subtitle: `Comparer les charges au m², analyser le budget prévisionnel et repérer les postes anormaux.`,

  intro: `"Les charges sont de 250 € par mois." L'agent immobilier vous balance le chiffre, vous hochez la tête, et vous passez à autre chose. Sauf que 250 € par mois, selon la taille de l'appartement, les équipements de l'immeuble et la ville, ça peut être normal — ou complètement excessif.

Les charges de copropriété, c'est un budget récurrent qui pèse chaque mois pendant toute la durée de votre propriété. Elles ne baissent quasiment jamais. Et si elles sont déjà élevées au moment de l'achat, elles vont probablement continuer à monter.

Voici comment vérifier si les charges sont dans la norme — et quoi faire si elles ne le sont pas.`,

  sections: [
    {
      id: 'charges-au-m2',
      title: `Le test rapide : les charges au m²`,
      content: `La méthode la plus simple pour savoir si les charges sont normales, c'est de les ramener au m² par an.

Prenez le montant annuel total des charges courantes (hors travaux exceptionnels) et divisez-le par la surface du logement.

Les moyennes en France en 2026 :`,
      bullets: [
        `20 à 35 €/m²/an — immeuble sans ascenseur, sans gardien, peu d'équipements. C'est la fourchette basse`,
        `35 à 55 €/m²/an — immeuble avec ascenseur et/ou gardien, espaces verts, chauffage collectif. C'est la norme pour beaucoup de copropriétés`,
        `55 à 75 €/m²/an — immeuble avec piscine, gardien, ascenseur, chauffage collectif, parking avec barrière. C'est élevé mais peut se justifier`,
        `Au-dessus de 75 €/m²/an — sauf résidence de standing avec services premium, c'est un signal d'alerte`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Exemple concret`,
        content: `Un appartement de 50 m² avec 3 000 € de charges annuelles = 60 €/m²/an. C'est au-dessus de la moyenne. Pour un immeuble avec juste un ascenseur et un gardien, c'est trop. Pour un immeuble avec chauffage collectif au gaz et piscine, ça peut passer.`,
      },
    },
    {
      id: 'postes-analyser',
      title: `Les postes à analyser un par un`,
      content: `Un montant global ne suffit pas. Demandez le détail du budget prévisionnel et regardez poste par poste :`,
      subsections: [
        {
          title: `Le chauffage collectif`,
          content: `C'est souvent le poste le plus lourd, surtout dans les immeubles anciens avec une chaudière au gaz ou au fioul. Avec la hausse des prix de l'énergie, ce poste peut représenter 30 à 50 % des charges totales.

Si l'immeuble a un chauffage collectif, vérifiez le type d'énergie (gaz, fioul, réseau de chaleur), le DPE collectif et si un changement de système est prévu dans le PPPT.`,
        },
        {
          title: `Le gardien / concierge`,
          content: `Un gardien à temps plein coûte entre 40 000 et 60 000 € par an charges patronales comprises. Réparti sur 30 lots, ça fait 1 300 à 2 000 € par lot et par an. C'est un vrai poste budgétaire.

Posez-vous la question : le gardien apporte-t-il un service qui justifie ce coût ? Dans certains immeubles, le gardien a été remplacé par un service de ménage et une boîte aux lettres sécurisée — avec une économie de 50 %.`,
        },
        {
          title: `L'ascenseur`,
          content: `Contrat de maintenance (entre 2 000 et 5 000 € par an selon le type), plus les réparations ponctuelles. Un ascenseur vieillissant peut coûter très cher en pannes. Vérifiez dans le PV d'AG si des mises aux normes sont prévues.`,
        },
        {
          title: `L'assurance de l'immeuble`,
          content: `Elle augmente chaque année et peut exploser si l'immeuble a eu des sinistres (dégâts des eaux, incendie). Comparez avec les années précédentes dans les PV d'AG. Une hausse de 20 % en un an, c'est anormal.`,
        },
      ],
    },
    {
      id: 'charges-exceptionnelles',
      title: `Charges courantes vs charges exceptionnelles`,
      content: `Ne confondez pas les deux :`,
      subsections: [
        {
          title: `Les charges courantes`,
          content: `Ce sont les dépenses récurrentes : entretien, gardien, ascenseur, assurance, eau, électricité des communs, ménage, espaces verts. Elles sont votées chaque année dans le budget prévisionnel et appelées chaque trimestre.`,
        },
        {
          title: `Les charges exceptionnelles`,
          content: `Ce sont les travaux ponctuels : ravalement, toiture, remplacement de chaudière, mise aux normes ascenseur. Elles sont votées séparément en AG et appelées en plus des charges courantes.

L'agent immobilier vous annonce souvent les charges courantes uniquement. Mais si un ravalement de 200 000 € a été voté, votre quote-part (par exemple 5 000 €) va s'ajouter. Demandez toujours : "Y a-t-il des appels de fonds en cours ou à venir ?"`,
        },
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Regardez l'état daté pour connaître les sommes restant à appeler sur les travaux votés. C'est vous, l'acheteur, qui paierez les appels de fonds postérieurs à la date de vente — même si les travaux ont été votés avant votre achat.`,
      },
    },
    {
      id: 'signaux-alerte',
      title: `Les signaux d'alerte`,
      content: `Certains indices doivent vous mettre la puce à l'oreille :`,
      bullets: [
        `Les charges augmentent de plus de 5 % par an depuis 3 ans — ça veut dire que le budget n'est pas maîtrisé ou que les coûts (énergie, assurance) explosent`,
        `Le budget prévisionnel est systématiquement dépassé — si la copro dépense 15 ou 20 % de plus que prévu chaque année, les charges vont encore augmenter`,
        `Le fonds de travaux est quasiment vide — depuis la loi ALUR, chaque copro doit cotiser au moins 2,5 % du budget par an dans un fonds de travaux. Si le fonds est vide après 10 ans, soit la copro ne respecte pas la loi, soit elle a tout dépensé en travaux`,
        `Des postes inhabituels apparaissent — frais d'avocat récurrents, honoraires exceptionnels du syndic, régularisations de charges importantes`,
        `Le syndic change tous les 2 ans — instabilité dans la gestion = risque de dérapages budgétaires`,
      ],
    },
    {
      id: 'que-faire',
      title: `Que faire si les charges sont trop élevées`,
      content: `Deux cas de figure :`,
      subsections: [
        {
          title: `Avant l'achat : négociez`,
          content: `Des charges élevées, c'est un argument pour baisser le prix. Chiffrez le surcoût par rapport à un immeuble comparable : si vous payez 1 500 € de charges en plus par an que la moyenne du quartier, c'est 15 000 € sur 10 ans. Ça se déduit du prix.`,
        },
        {
          title: `Après l'achat : agissez en AG`,
          content: `Une fois propriétaire, vous pouvez proposer en assemblée générale de renégocier les contrats (syndic, ascenseur, assurance, ménage), de mettre en concurrence les prestataires, ou de remplacer un gardien par un prestataire de ménage. C'est long, mais ça marche.`,
        },
      ],
    },
  ],

  conclusion: `Les charges de copropriété, ça se vérifie avant d'acheter, pas après. Un écart de 100 € par mois par rapport à la normale, c'est 1 200 € par an, 12 000 € sur 10 ans. Ça vaut le coup de passer 30 minutes sur le budget prévisionnel.

Demandez le détail, comparez au m², regardez l'évolution sur 3 ans. Et si les charges sont hautes, utilisez-les pour négocier.`,

  cta: {
    title: `Des appels de charges dans votre dossier ?`,
    description: `Verimo analyse vos documents financiers de copropriété et vous dit si les charges sont dans la norme, quels postes sont anormaux et combien ça va vous coûter.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'analyser-pv-ag-avant-achat',
    'appels-fonds-exceptionnels-documents',
    'etat-date-document-vendeur',
    'fonds-travaux-obligatoire-2026',
  ],
};

export default article;

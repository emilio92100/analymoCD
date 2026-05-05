/**
 * Guide : Comment présenter ses documents pour rassurer l'acheteur
 * Catégorie : Vendeurs > Valoriser son bien
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'presenter-documents-rassurer-acheteur',
  category: 'vendeurs',
  categoryLabel: 'Vendeurs',
  categoryIcon: '🤝',
  categoryColor: '#7c3aed',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 5,

  seo: {
    title: `Vente immobilière : comment présenter ses documents pour rassurer l'acheteur — Guide Verimo`,
    description: `Un dossier complet et bien organisé accélère la vente et justifie votre prix. Comment préparer et présenter vos documents efficacement. Guide 2026.`,
  },

  title: `Comment présenter ses documents pour rassurer l'acheteur`,
  subtitle: `Un dossier complet et bien organisé accélère la vente et justifie votre prix.`,

  intro: `Vous avez un bien à vendre, un prix en tête, et un dossier documentaire quelque part dans vos tiroirs. L'acheteur visite, pose des questions, et vous répondez "je vais chercher" ou "je demande au syndic". Ça ne rassure personne.

Un vendeur qui arrive avec un dossier organisé, complet et transparent inspire confiance. L'acheteur se dit : "ce vendeur n'a rien à cacher." Et un acheteur rassuré négocie moins et décide plus vite.`,

  sections: [
    {
      id: 'pourquoi-ca-compte',
      title: `Pourquoi la présentation du dossier change tout`,
      content: `Un acheteur qui reçoit un dossier complet dès la première visite réagit différemment d'un acheteur qui doit réclamer les documents pendant 3 semaines :`,
      bullets: [
        `La confiance s'installe — un vendeur transparent donne le signal qu'il n'y a pas de squelette dans le placard`,
        `La décision est plus rapide — l'acheteur a toutes les infos pour faire une offre, pas besoin d'attendre`,
        `La négociation est plus raisonnable — un acheteur qui découvre les problèmes dans un dossier bien présenté négocie moins durement qu'un acheteur qui les découvre par surprise`,
        `Le compromis avance plus vite — le notaire a tous les documents dès le début, pas besoin de relancer`,
      ],
    },
    {
      id: 'organiser-dossier',
      title: `Comment organiser votre dossier`,
      content: `Préparez un dossier structuré en 4 parties :`,
      numberedList: [
        `Le DDT complet — tous les diagnostics dans un seul PDF, dans l'ordre. DPE en premier (c'est ce que l'acheteur regarde en premier)`,
        `Les documents de copropriété — PV d'AG (3 derniers), règlement, fiche synthétique, carnet d'entretien, PPPT. Classés par type`,
        `Les documents financiers — état daté ou pré-état daté, appels de charges des 12 derniers mois, taxe foncière`,
        `Les documents du bien — titre de propriété, plans, factures de travaux réalisés, garanties en cours`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le format idéal`,
        content: `Scannez tout en PDF, nommez chaque fichier clairement ("PV-AG-2024.pdf", "DPE-2025.pdf", "Etat-date-mai-2026.pdf") et mettez-le sur une clé USB ou un lien de partage (Google Drive, WeTransfer). L'acheteur peut consulter chez lui, à son rythme.`,
      },
    },
    {
      id: 'anticiper-questions',
      title: `Anticiper les questions de l'acheteur`,
      content: `Un acheteur bien informé va poser des questions sur :`,
      bullets: [
        `Les travaux votés — combien, quand, quel montant. Ayez le PV d'AG et l'état daté prêts`,
        `Les charges — montant réel, évolution, chauffage. Ayez les appels de charges des 12 derniers mois`,
        `Le DPE — classe, travaux recommandés, estimation des factures. Si c'est un E, F ou G, préparez-vous à la discussion sur le prix`,
        `Le PPPT — quels travaux sont prévus dans les 5 ans. Si vous ne l'avez pas, dites-le honnêtement et expliquez pourquoi`,
        `La copropriété — ambiance en AG, qualité du syndic, projets en cours. Ce sont des questions légitimes`,
      ],
    },
    {
      id: 'transparence',
      title: `La transparence comme stratégie`,
      content: `Certains vendeurs cachent les problèmes en espérant que l'acheteur ne les verra pas. C'est une mauvaise stratégie :`,
      bullets: [
        `L'acheteur finit toujours par trouver — les PV d'AG, l'état daté et les diagnostics sont obligatoires. Les problèmes sortiront`,
        `La découverte tardive tue la confiance — un acheteur qui découvre un ravalement de 200 000 € au compromis, après avoir fait une offre, est furieux. Il renégocie ou se rétracte`,
        `La transparence précoce protège votre prix — si vous annoncez dès le départ "il y a un ravalement prévu, j'en ai tenu compte dans mon prix", l'acheteur intègre l'info dans sa réflexion au lieu de la découvrir comme une mauvaise surprise`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Le bon réflexe`,
        content: `Si votre bien a des points faibles (DPE moyen, travaux votés, charges élevées), ne les cachez pas — expliquez-les. "Les charges sont de 300 €/mois parce qu'il y a un gardien et un chauffage collectif. C'est au-dessus de la moyenne, mais le service est là." Un vendeur qui explique inspire plus confiance qu'un vendeur qui minimise.`,
      },
    },
    {
      id: 'mise-en-valeur',
      title: `Mettre en valeur les points forts documentaires`,
      content: `Votre dossier contient aussi des points positifs — mettez-les en avant :`,
      bullets: [
        `Un DPE en A, B ou C — c'est un argument de vente. Peu de biens anciens sont bien classés. Mettez-le en avant dans l'annonce`,
        `Un fonds de travaux bien rempli — la copro est bien gérée, pas de mauvaises surprises à prévoir`,
        `Des travaux récents — toiture refaite, façade ravalée, chaudière neuve. Ça rassure et ça justifie le prix`,
        `Pas d'impayés — un taux d'impayés bas montre une copro saine`,
        `Un PPPT sans gros travaux à court terme — les 5 prochaines années sont tranquilles`,
      ],
    },
  ],

  conclusion: `Un dossier bien présenté ne fait pas monter le prix de votre bien. Mais il accélère la vente, réduit la négociation et vous évite les mauvaises surprises en cours de route.

Préparez-le avant la première visite, organisez-le clairement, et jouez la transparence. Un vendeur préparé vend plus vite — et au meilleur prix.`,

  cta: {
    title: `Préparez votre dossier vendeur`,
    description: `Verimo analyse vos documents et identifie les points forts et les points faibles de votre dossier. Soyez prêt avant le premier acheteur.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'documents-obligatoires-vendre-2026',
    'vendre-copropriete-documents-specifiques',
    'vendre-passoire-thermique-strategies',
    'ddt-dossier-diagnostics-techniques',
  ],
};

export default article;

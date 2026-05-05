/**
 * Guide : Liste complète des documents obligatoires pour vendre en 2026
 * Catégorie : Vendeurs > Préparer sa vente
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'documents-obligatoires-vendre-2026',
  category: 'vendeurs',
  categoryLabel: 'Vendeurs',
  categoryIcon: '🤝',
  categoryColor: '#7c3aed',
  tag: 'Essentiel',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 8,

  seo: {
    title: `Documents obligatoires pour vendre en 2026 : liste complète — Guide Verimo`,
    description: `DDT, état daté, fiche synthétique, DPE, PPPT — tout ce que le vendeur doit fournir à l'acheteur et au notaire en 2026. Guide complet.`,
  },

  title: `Liste complète des documents obligatoires pour vendre en 2026`,
  subtitle: `DDT, état daté, fiche synthétique, DPE — tout ce que le vendeur doit fournir et à quel moment.`,

  intro: `Vendre un bien immobilier en 2026, c'est fournir un dossier documentaire complet à l'acheteur et au notaire. La liste s'est allongée ces dernières années avec le DPE collectif, le PPPT, l'audit énergétique pour les passoires thermiques.

Un document manquant, c'est un risque : retard de vente, litige post-vente, ou annulation du compromis. Voici la liste complète, classée par moment de la vente.`,

  sections: [
    {
      id: 'avant-annonce',
      title: `Avant la mise en vente`,
      content: `Certains documents doivent être prêts avant même de publier l'annonce :`,
      bullets: [
        `Le DPE — obligatoire dans l'annonce immobilière. Classe énergie et classe climat doivent y figurer. Un DPE réalisé après juillet 2021 est requis`,
        `L'audit énergétique — obligatoire dès la première visite si le bien est une maison ou un immeuble en monopropriété classé E, F ou G`,
        `Le mesurage Carrez — obligatoire en copropriété. La surface doit figurer dans l'annonce`,
      ],
    },
    {
      id: 'ddt',
      title: `Le DDT (Dossier de Diagnostics Techniques)`,
      content: `Le DDT regroupe tous les diagnostics obligatoires. Selon le type de bien, il contient :`,
      bullets: [
        `DPE — obligatoire pour tous les biens. Valable 10 ans`,
        `Diagnostic amiante — si le permis de construire date d'avant juillet 1997. Valable sans limite si négatif`,
        `Diagnostic plomb (CREP) — si le bien a été construit avant 1949. Valable 1 an si positif, sans limite si négatif`,
        `Diagnostic électricité — si l'installation a plus de 15 ans. Valable 3 ans`,
        `Diagnostic gaz — si l'installation a plus de 15 ans. Valable 3 ans`,
        `Diagnostic termites — si la commune est en zone déclarée. Valable 6 mois`,
        `ERP (État des Risques et Pollutions) — obligatoire partout. Valable 6 mois`,
        `Mesurage loi Carrez — obligatoire en copropriété. Valable sans limite (sauf travaux modifiant la surface)`,
        `Diagnostic assainissement — si le bien n'est pas raccordé au tout-à-l'égout. Valable 3 ans`,
        `Diagnostic bruit — si le bien est dans une zone d'exposition au bruit des aérodromes`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Vérifiez les dates de validité`,
        content: `Un diagnostic expiré le jour de la signature du compromis doit être refait. L'erreur la plus fréquente : le diagnostic termites (6 mois) et l'ERP (6 mois) qui expirent entre le compromis et l'acte de vente. Anticipez.`,
      },
    },
    {
      id: 'documents-copro',
      title: `Les documents de copropriété`,
      content: `Si vous vendez un lot en copropriété, vous devez fournir en plus du DDT :`,
      bullets: [
        `Le règlement de copropriété et l'état descriptif de division — avec tous les modificatifs`,
        `Les PV des 3 dernières AG — obligatoires depuis la loi ALUR`,
        `La fiche synthétique de copropriété — résumé annuel établi par le syndic`,
        `Le carnet d'entretien de l'immeuble`,
        `L'état daté — document comptable du syndic détaillant la situation financière du lot. Plafonné à 380 € TTC`,
        `Le PPPT ou le PPT voté — obligatoire depuis le 1er janvier 2026 (à fournir au notaire)`,
        `Le DPE collectif — si la copropriété en dispose`,
        `Le diagnostic technique global (DTG) — s'il a été réalisé`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Nouveau en 2026`,
        content: `Depuis le 1er janvier 2026, le syndic doit fournir le PPPT (ou le PPT voté) au notaire lors de toute vente en copropriété. Si votre copro n'a pas encore réalisé son PPPT, signalez-le au syndic — c'est une obligation.`,
      },
    },
    {
      id: 'quand-fournir',
      title: `Quand fournir chaque document`,
      content: `Le timing est important — certains documents sont requis à des moments précis :`,
      subsections: [
        {
          title: `Dès la mise en vente`,
          content: `Le DPE (dans l'annonce) et l'audit énergétique (dès la première visite pour les E, F, G en monopropriété).`,
        },
        {
          title: `Au compromis`,
          content: `Le DDT complet, les PV d'AG, le règlement de copropriété, la fiche synthétique, le carnet d'entretien. Le délai de rétractation de 10 jours ne commence que quand tous ces documents sont remis à l'acheteur.`,
        },
        {
          title: `À l'acte de vente`,
          content: `L'état daté (version définitive), le PPPT/PPT, et tous les documents dont la validité doit être vérifiée à la date de signature (ERP, termites — valables 6 mois).`,
        },
      ],
    },
    {
      id: 'cout-documents',
      title: `Combien ça coûte au vendeur`,
      content: `Le coût total des documents est à la charge du vendeur :`,
      bullets: [
        `DDT complet (tous les diagnostics) — 300 à 700 € selon le nombre de diagnostics et la surface`,
        `Audit énergétique (si requis) — 800 à 1 500 €`,
        `État daté — plafonné à 380 € TTC (facturé par le syndic)`,
        `Pré-état daté — 0 à 300 € selon le syndic`,
        `Mesurage Carrez — souvent inclus dans le DDT ou 100 à 200 € séparément`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Astuce`,
        content: `Faites réaliser tous les diagnostics en une seule fois par le même diagnostiqueur — c'est moins cher qu'un par un. Et commandez-les dès que vous décidez de vendre, pas au dernier moment.`,
      },
    },
    {
      id: 'risques-absence',
      title: `Les risques si un document manque`,
      content: `Un dossier incomplet peut avoir des conséquences sérieuses :`,
      bullets: [
        `Le délai de rétractation ne court pas — l'acheteur peut se rétracter gratuitement tant que le dossier n'est pas complet, même après les 10 jours habituels`,
        `L'acheteur peut invoquer un vice de consentement — s'il découvre après la vente une information qui aurait dû être fournie`,
        `Le vendeur ne peut pas s'exonérer des vices cachés — l'absence de diagnostic (amiante, plomb) supprime la clause de non-garantie`,
        `Le notaire peut refuser de signer — un acte sans DDT complet est un risque juridique que le notaire ne prend pas`,
      ],
    },
    {
      id: 'checklist',
      title: `Votre checklist vendeur`,
      content: `Avant de mettre en vente, vérifiez que vous avez :`,
      numberedList: [
        `DPE à jour (après juillet 2021) — pour l'annonce`,
        `Audit énergétique — si maison E, F ou G`,
        `DDT complet — tous les diagnostics selon le type de bien`,
        `Mesurage Carrez — si copropriété`,
        `Règlement de copropriété + modificatifs`,
        `3 derniers PV d'AG`,
        `Fiche synthétique + carnet d'entretien`,
        `État daté commandé au syndic`,
        `PPPT/PPT disponible`,
        `Titre de propriété + dernière taxe foncière`,
      ],
    },
  ],

  conclusion: `La liste est longue, mais chaque document a une raison d'être. Un dossier complet rassure l'acheteur, accélère la vente, et vous protège contre les litiges. Un dossier incomplet retarde tout, fait fuir les acheteurs sérieux, et vous expose à des recours.

Préparez votre dossier avant la première visite. Un vendeur organisé inspire confiance — et vend plus vite.`,

  cta: {
    title: `Vous vendez un bien ?`,
    description: `Verimo analyse aussi les documents côté vendeur. Vérifiez que votre dossier est complet et identifiez les points que l'acheteur va soulever.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'ddt-dossier-diagnostics-techniques',
    'vendre-copropriete-documents-specifiques',
    'presenter-documents-rassurer-acheteur',
    'vendre-passoire-thermique-strategies',
  ],
};

export default article;

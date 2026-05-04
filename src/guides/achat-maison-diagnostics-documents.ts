/**
 * Guide : Achat maison — les diagnostics et documents spécifiques à vérifier
 * Catégorie : Diagnostics > Sécurité & Conformité
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'achat-maison-diagnostics-documents',
  category: 'diagnostics',
  categoryLabel: 'Diagnostics',
  categoryIcon: '🔍',
  categoryColor: '#d97706',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Achat maison : diagnostics et documents spécifiques à vérifier — Guide Verimo`,
    description: `Assainissement, termites, mérule, audit énergétique, permis de construire — ce qui change quand on achète une maison plutôt qu'un appartement. Guide 2026.`,
  },

  title: `Achat maison : les diagnostics et documents spécifiques à vérifier`,
  subtitle: `Assainissement, termites, mérule, audit énergétique — ce qui change quand on achète une maison plutôt qu'un appartement.`,

  intro: `Acheter une maison, ce n'est pas comme acheter un appartement. Pas de copropriété, pas de syndic, pas de PV d'AG. Mais d'autres documents et diagnostics entrent en jeu — et certains sont spécifiques aux maisons individuelles.

L'assainissement, les termites, l'audit énergétique obligatoire, le bornage du terrain, le permis de construire des extensions… Autant de sujets que les acheteurs d'appartements ne voient jamais, et que les acheteurs de maisons découvrent souvent trop tard.`,

  sections: [
    {
      id: 'diagnostics-communs',
      title: `Les diagnostics communs avec l'appartement`,
      content: `Certains diagnostics sont les mêmes que pour un appartement :`,
      bullets: [
        `DPE — obligatoire, même classe A à G`,
        `Diagnostic amiante — si le permis de construire date d'avant juillet 1997`,
        `Diagnostic plomb (CREP) — si la maison a été construite avant 1949`,
        `Diagnostic électricité — si l'installation a plus de 15 ans`,
        `Diagnostic gaz — si l'installation a plus de 15 ans`,
        `ERP (État des Risques et Pollutions) — obligatoire partout`,
      ],
    },
    {
      id: 'audit-energetique',
      title: `L'audit énergétique : obligatoire pour les maisons E, F et G`,
      content: `C'est la grosse différence avec l'appartement. Depuis janvier 2025, si vous achetez une maison classée E, F ou G au DPE, le vendeur doit fournir un audit énergétique en plus du DPE.

L'audit va beaucoup plus loin que le DPE : il propose au minimum deux scénarios de travaux chiffrés, avec les coûts, les gains et les aides disponibles.

Pour un appartement en copropriété, cet audit n'est pas obligatoire — parce que les travaux sur l'enveloppe (façade, toiture) dépendent de la copro, pas du propriétaire seul. Pour une maison, c'est vous qui décidez tout — donc l'audit est pertinent.`,
      highlight: {
        type: 'warning' as const,
        title: `Important`,
        content: `L'audit doit vous être remis dès la première visite, pas au compromis. Si le vendeur ne l'a pas, il est en infraction. Et si la maison est en F ou G, c'est un outil de négociation puissant — les scénarios de travaux sont chiffrés par un professionnel.`,
      },
    },
    {
      id: 'assainissement',
      title: `Le diagnostic assainissement`,
      content: `En ville, les maisons sont raccordées au tout-à-l'égout (assainissement collectif). Mais en zone rurale ou périurbaine, beaucoup de maisons ont un assainissement individuel — une fosse septique.

Le diagnostic assainissement est obligatoire pour toute vente de maison en assainissement non collectif. Il est réalisé par le SPANC (Service Public d'Assainissement Non Collectif) de la commune.

Ce qu'il faut vérifier :`,
      bullets: [
        `Le système est-il conforme aux normes ? — un système non conforme doit être mis aux normes dans l'année qui suit la vente. Coût : 5 000 à 15 000 € selon le type d'installation`,
        `Le système est-il fonctionnel ? — une fosse septique pleine ou défaillante peut causer des problèmes sanitaires et des odeurs`,
        `La vidange est-elle à jour ? — une fosse doit être vidangée tous les 3 à 4 ans en moyenne`,
        `Le terrain est-il adapté ? — certains terrains (argileux, en pente, nappe phréatique haute) compliquent l'installation d'un système conforme`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Astuce`,
        content: `Si le diagnostic conclut "non conforme", négociez le prix. Le vendeur sait que l'acheteur devra faire les travaux dans l'année. Un devis de mise aux normes (5 000 à 15 000 €) est un argument de négociation direct.`,
      },
    },
    {
      id: 'termites',
      title: `Le diagnostic termites`,
      content: `Le diagnostic termites est obligatoire dans les zones déclarées infestées par arrêté préfectoral. Ça concerne principalement le sud-ouest, la côte atlantique, la vallée du Rhône et certaines zones d'Île-de-France.

Les termites s'attaquent au bois de structure (charpente, poutres, planchers). Les dégâts peuvent être catastrophiques — et invisibles à l'œil nu.

Ce qu'il faut vérifier :`,
      bullets: [
        `Votre commune est-elle en zone termites ? — consultez la carte sur termite.com.fr ou en mairie`,
        `Le diagnostic est-il récent ? — il n'est valable que 6 mois. Un diagnostic de plus de 6 mois doit être refait`,
        `Si des termites sont détectés — le vendeur doit déclarer l'infestation en mairie. Les travaux de traitement coûtent entre 2 000 et 10 000 € selon l'étendue`,
        `Vérifiez aussi la mérule — un champignon qui attaque le bois humide. Le diagnostic mérule n'est pas obligatoire au niveau national, mais il l'est dans certains départements (Bretagne, Nord, Finistère)`,
      ],
    },
    {
      id: 'terrain-bornage',
      title: `Le terrain : bornage et limites de propriété`,
      content: `Quand vous achetez une maison, vous achetez aussi le terrain. Et les limites du terrain sont parfois floues — surtout dans les zones rurales ou les lotissements anciens.

Ce qu'il faut vérifier :`,
      bullets: [
        `Le terrain est-il borné ? — le bornage est un document établi par un géomètre-expert qui fixe officiellement les limites. S'il n'existe pas, vous risquez des conflits de voisinage`,
        `La surface du terrain correspond-elle à l'acte de propriété ? — comparez avec le cadastre, mais attention : le cadastre n'a pas de valeur juridique pour les limites, seul le bornage fait foi`,
        `Y a-t-il des servitudes sur le terrain ? — droit de passage, servitude de vue, canalisation souterraine. Vérifiez dans l'acte de propriété et le certificat d'urbanisme`,
        `Le terrain est-il constructible ? — si vous prévoyez une extension, vérifiez le PLU (Plan Local d'Urbanisme) en mairie`,
      ],
    },
    {
      id: 'urbanisme',
      title: `Permis de construire et conformité`,
      content: `Si la maison a été agrandie, une véranda ajoutée, un garage transformé en pièce de vie ou des combles aménagés, vérifiez que les travaux ont été déclarés :`,
      bullets: [
        `Demandez les permis de construire et déclarations préalables — le vendeur doit pouvoir les fournir`,
        `Vérifiez la conformité — un agrandissement sans permis peut être sanctionné par la mairie (obligation de démolir dans le pire des cas)`,
        `Comparez la surface taxable avec la réalité — si le vendeur a aménagé des combles sans déclaration, la surface taxable est fausse et la taxe foncière a été sous-évaluée. La régularisation peut vous retomber dessus`,
        `Le certificat d'urbanisme — demandez-le en mairie. Il vous dit ce que vous pouvez faire sur le terrain et s'il y a des projets publics prévus (route, expropriation, zone protégée)`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le piège classique`,
        content: `Une véranda ou un garage transformé sans déclaration, c'est très courant. Le vendeur vous dit "tout est en règle" mais aucun document ne le prouve. Demandez les autorisations. Si elles n'existent pas, vous achetez un risque — et c'est un argument de négociation.`,
      },
    },
    {
      id: 'checklist-maison',
      title: `Votre checklist achat maison`,
      content: `En plus des diagnostics classiques (DPE, amiante, plomb, électricité, gaz, ERP), vérifiez :`,
      numberedList: [
        `L'audit énergétique est-il fourni ? (obligatoire si E, F ou G)`,
        `Quel type d'assainissement ? Si individuel, le diagnostic SPANC est-il conforme ?`,
        `La commune est-elle en zone termites ? Le diagnostic est-il à jour (moins de 6 mois) ?`,
        `Le terrain est-il borné ? Les limites sont-elles claires ?`,
        `Y a-t-il des extensions ou aménagements ? Les permis existent-ils ?`,
        `Le certificat d'urbanisme a-t-il été demandé ?`,
        `Y a-t-il des servitudes sur le terrain ?`,
        `La toiture, la charpente et les fondations sont-elles en bon état ? (visite visuelle)`,
      ],
    },
  ],

  conclusion: `Acheter une maison, c'est plus de liberté — mais aussi plus de responsabilité. Pas de syndic pour gérer les travaux, pas de copro pour partager les coûts. Chaque problème est le vôtre.

Les diagnostics spécifiques à la maison (assainissement, termites, audit énergétique, bornage) sont là pour vous protéger. Lisez-les, vérifiez les conformités, et utilisez les anomalies pour négocier. Une maison avec un assainissement non conforme et un DPE en F, c'est 20 000 à 40 000 € de travaux à prévoir — et autant d'arguments pour baisser le prix.`,

  cta: {
    title: `Vous achetez une maison ?`,
    description: `Verimo analyse vos diagnostics, votre audit énergétique et tous vos documents pour un rapport complet : score, risques et travaux à prévoir.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'dpe-comment-lire-avant-achat',
    'audit-energetique-difference-dpe',
    'diagnostic-amiante-resultat-positif',
    'erp-etat-risques-pollutions',
  ],
};

export default article;

/**
 * Guide : Diagnostic électricité et gaz — quels risques pour l'acheteur
 * Catégorie : Diagnostics > Sécurité & Conformité
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'diagnostic-electricite-gaz-risques',
  category: 'diagnostics',
  categoryLabel: 'Diagnostics',
  categoryIcon: '🔍',
  categoryColor: '#d97706',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 6,

  seo: {
    title: `Diagnostic électricité et gaz : quels risques pour l'acheteur — Guide Verimo`,
    description: `Installations de plus de 15 ans, anomalies détectées, travaux à prévoir — comment lire les diagnostics électricité et gaz avant d'acheter. Guide 2026.`,
  },

  title: `Diagnostic électricité et gaz : quels risques pour l'acheteur`,
  subtitle: `Installations de plus de 15 ans, anomalies détectées, travaux à prévoir — comment interpréter ces diagnostics.`,

  intro: `Les diagnostics électricité et gaz sont obligatoires quand l'installation a plus de 15 ans. Et dans la plupart des appartements anciens, c'est le cas. Le diagnostiqueur inspecte l'installation, note les anomalies, et classe le risque.

Le problème : ces diagnostics listent souvent 5, 10, voire 15 anomalies — et la plupart des acheteurs ne savent pas lesquelles sont graves et lesquelles sont mineures. Résultat : soit ils paniquent pour rien, soit ils passent à côté d'un vrai problème.`,

  sections: [
    {
      id: 'quand-obligatoire',
      title: `Quand ces diagnostics sont-ils obligatoires`,
      content: `Les deux diagnostics suivent la même règle :`,
      bullets: [
        `Diagnostic électricité — obligatoire si l'installation a plus de 15 ans. Valable 3 ans pour une vente, 6 ans pour une location`,
        `Diagnostic gaz — obligatoire si l'installation a plus de 15 ans. Mêmes durées de validité`,
        `Si l'installation a moins de 15 ans — pas de diagnostic obligatoire. Mais le vendeur peut fournir une attestation de conformité délivrée par un organisme agréé (Consuel pour l'électricité, Qualigaz pour le gaz)`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Le diagnostic ne porte que sur les parties privatives (votre logement). Les parties communes (colonnes montantes, tableau général) sont la responsabilité de la copropriété. Mais une anomalie sur la colonne montante peut impacter votre installation — vérifiez dans le PV d'AG si des travaux électriques sont prévus.`,
      },
    },
    {
      id: 'anomalies-electricite',
      title: `Les anomalies électriques les plus courantes`,
      content: `Le diagnostiqueur vérifie 87 points de contrôle. Les anomalies les plus fréquentes dans les logements anciens :`,
      bullets: [
        `Absence de prise de terre — très courante dans les immeubles d'avant 1970. Sans prise de terre, vos appareils ne sont pas protégés contre les défauts d'isolement. Risque d'électrocution`,
        `Tableau électrique vétuste — fusibles au lieu de disjoncteurs, absence de différentiel 30 mA. Le différentiel coupe le courant en cas de fuite — sans lui, le risque d'électrocution est réel`,
        `Fils non protégés ou hors gaine — câbles apparents, boîtes de dérivation ouvertes, fils volants. Risque d'incendie`,
        `Prises non conformes — prises sans terre dans les pièces d'eau (cuisine, salle de bain), prises trop proches d'un point d'eau`,
        `Section de câbles insuffisante — les câbles sont trop fins pour la puissance utilisée. Risque de surchauffe et d'incendie`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Les 2 anomalies à prendre au sérieux`,
        content: `L'absence de différentiel 30 mA et l'absence de prise de terre sont les deux anomalies les plus dangereuses. Elles ne sont pas "un détail" — elles exposent les occupants à un risque réel d'électrocution. Chiffrez la mise aux normes dans votre budget.`,
      },
    },
    {
      id: 'anomalies-gaz',
      title: `Les anomalies gaz les plus courantes`,
      content: `Le diagnostic gaz est plus court (30 points de contrôle) mais les anomalies sont potentiellement plus graves :`,
      bullets: [
        `Tuyaux de raccordement non conformes — tuyaux souples périmés (les tuyaux caoutchouc ont une date de péremption), raccords non étanches`,
        `Ventilation insuffisante — les appareils à gaz (chaudière, chauffe-eau) ont besoin d'air frais pour fonctionner. Une ventilation bouchée ou absente crée un risque d'intoxication au monoxyde de carbone`,
        `Chaudière ou chauffe-eau non entretenu — pas de contrat d'entretien annuel, appareil vétuste, combustion incomplète`,
        `Absence de VMC ou de grilles de ventilation — dans les logements anciens, la ventilation naturelle a parfois été bouchée lors de travaux de rénovation`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Danger immédiat (DGI)`,
        content: `Si le diagnostiqueur détecte un Danger Grave et Immédiat (DGI), il est obligé de couper l'alimentation en gaz immédiatement et de prévenir le distributeur (GRDF). Le logement ne peut plus être alimenté en gaz tant que l'anomalie n'est pas corrigée. C'est rare mais ça arrive — et ça bloque la vente.`,
      },
    },
    {
      id: 'cout-travaux',
      title: `Combien coûte la mise aux normes`,
      content: `Les travaux électriques et gaz ont des coûts variables selon l'ampleur :`,
      subsections: [
        {
          title: `Électricité`,
          content: `Remplacement du tableau électrique (avec disjoncteurs et différentiel) : 800 à 2 000 €. Mise à la terre complète : 500 à 1 500 €. Mise aux normes complète d'un appartement ancien (refaire tout le circuit) : 5 000 à 12 000 € selon la surface. Si vous faites juste les anomalies critiques (tableau + terre + différentiel), comptez 1 500 à 3 500 €.`,
        },
        {
          title: `Gaz`,
          content: `Remplacement d'un tuyau de raccordement : 50 à 150 €. Installation d'une VMC : 1 500 à 3 000 €. Remplacement d'une chaudière gaz vétuste : 3 000 à 7 000 € (hors aides). Mise en conformité des ventilations : 200 à 800 €.`,
        },
      ],
    },
    {
      id: 'negocier',
      title: `Utiliser les anomalies pour négocier`,
      content: `Les anomalies détectées dans les diagnostics sont des arguments de négociation factuels :`,
      bullets: [
        `Listez les anomalies critiques (absence de terre, pas de différentiel, ventilation insuffisante)`,
        `Chiffrez les travaux de mise aux normes — demandez un devis à un électricien ou utilisez les fourchettes ci-dessus`,
        `Présentez le montant au vendeur — "le diagnostic électrique relève 8 anomalies dont 3 critiques. La mise aux normes coûte environ 3 000 €. J'en tiens compte dans mon offre"`,
        `Le vendeur ne peut pas contester — les anomalies sont dans son propre diagnostic, réalisé par un professionnel certifié`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Rappel important`,
        content: `Le diagnostic ne crée pas d'obligation de travaux pour le vendeur. Il informe l'acheteur. Mais les anomalies détectées justifient une négociation — et un acheteur informé qui chiffre ses travaux est en position de force.`,
      },
    },
  ],

  conclusion: `Les diagnostics électricité et gaz sont techniques, mais pas compliqués à lire. Concentrez-vous sur les anomalies graves (pas de terre, pas de différentiel, ventilation insuffisante, DGI gaz) et chiffrez la mise aux normes.

Un appartement ancien avec 10 anomalies électriques, ça arrive dans quasiment tous les immeubles d'avant 1980. Ce n'est pas rédhibitoire. Mais c'est un coût à intégrer — et un argument pour négocier.`,

  cta: {
    title: `Des diagnostics techniques dans votre dossier ?`,
    description: `Verimo analyse vos diagnostics électricité, gaz et tous vos documents pour évaluer les travaux à prévoir et leur impact sur votre budget.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'diagnostic-amiante-resultat-positif',
    '10-documents-avant-offre-achat',
    'erp-etat-risques-pollutions',
    'achat-maison-diagnostics-documents',
  ],
};

export default article;

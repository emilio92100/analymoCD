/**
 * Guide : Les 10 documents à exiger avant de faire une offre d'achat
 * Catégorie : Acheteurs > Avant de signer
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: '10-documents-avant-offre-achat',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  tag: 'Essentiel',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 10,

  seo: {
    title: `Les 10 documents à exiger avant une offre d'achat immobilier — Guide Verimo`,
    description: `La checklist complète des documents à demander au vendeur ou à l'agent avant de faire une offre. PV d'AG, DPE, diagnostics, charges, compromis. Guide 2026.`,
  },

  title: `Les 10 documents à exiger avant de faire une offre d'achat`,
  subtitle: `La checklist complète des pièces à demander au vendeur ou à l'agent avant de vous engager.`,

  intro: `Vous avez visité un appartement, il vous plaît, et l'agent vous pousse à faire une offre rapidement. "Il y a d'autres acheteurs intéressés", "le vendeur veut conclure vite"… On connaît la chanson.

Mais faire une offre sans avoir lu les documents, c'est comme signer un contrat sans le lire. Vous vous engagez sur un prix alors que vous ne savez pas encore si l'immeuble a 300 000 € de travaux à venir, si les charges vont doubler, ou si le vendeur a des dettes envers la copropriété.

Voici les 10 documents à demander systématiquement — et ce qu'il faut y chercher.`,

  sections: [
    {
      id: 'pv-ag',
      title: `1. Les 3 derniers PV d'assemblée générale`,
      content: `C'est le document le plus important. Le PV d'AG contient toutes les décisions votées par les copropriétaires : travaux, budget, procédures judiciaires, changement de syndic, impayés.

Demandez les 3 derniers — pas juste le dernier. Comparer trois années permet de repérer les tendances : des charges qui montent, des travaux repoussés, des impayés qui s'aggravent.`,
      highlight: {
        type: 'tip' as const,
        title: `Ce qu'il faut chercher en priorité`,
        content: `Les travaux votés (vous paierez les appels de fonds restants), les procédures en cours (frais d'avocat répartis entre tous), le taux d'impayés et le montant du fonds de travaux.`,
      },
    },
    {
      id: 'dpe',
      title: `2. Le DPE (Diagnostic de Performance Énergétique)`,
      content: `Obligatoire pour toute vente. Il donne la classe énergie (A à G) et la classe climat du logement.

Depuis 2025, les logements classés G sont interdits à la location. Les F le seront en 2028, les E en 2034. Si vous achetez pour louer, c'est un critère décisif.

Le DPE doit avoir été réalisé après juillet 2021 (les anciens ne sont plus valables) et par un diagnostiqueur certifié.`,
      highlight: {
        type: 'warning' as const,
        title: `Attention`,
        content: `Si le bien est classé E, F ou G en monopropriété (maison), le vendeur doit aussi fournir un audit énergétique depuis janvier 2025. Ce document est plus détaillé que le DPE et propose des scénarios de travaux chiffrés.`,
      },
    },
    {
      id: 'ddt',
      title: `3. Le DDT (Dossier de Diagnostics Techniques)`,
      content: `Le DDT regroupe tous les diagnostics obligatoires du logement. Selon le type de bien et sa localisation, il peut contenir :`,
      bullets: [
        `Le DPE (vu juste au-dessus)`,
        `Le diagnostic amiante — obligatoire si l'immeuble a été construit avant 1997`,
        `Le diagnostic plomb (CREP) — obligatoire si l'immeuble date d'avant 1949`,
        `Le diagnostic électricité — si l'installation a plus de 15 ans`,
        `Le diagnostic gaz — si l'installation a plus de 15 ans`,
        `Le diagnostic termites — selon la zone géographique`,
        `L'ERP (État des Risques et Pollutions) — risques naturels, industriels, pollution des sols`,
        `Le mesurage loi Carrez — surface privative exacte en copropriété`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Le vendeur est tenu de fournir tous ces diagnostics. S'il en manque un, vous pouvez le demander. Et si un diagnostic révèle un vice caché (amiante, plomb), le vendeur en est responsable.`,
      },
    },
    {
      id: 'reglement-copro',
      title: `4. Le règlement de copropriété`,
      content: `C'est le document fondateur de la copropriété. Il définit les règles de vie, la répartition des charges, la destination des lots (habitation, commerce, mixte) et les parties communes.

Pourquoi le lire ? Parce qu'il peut contenir des restrictions qui changent tout :`,
      bullets: [
        `Interdiction de louer en meublé de courte durée (Airbnb)`,
        `Interdiction d'exercer une activité professionnelle dans le lot`,
        `Restriction sur les animaux`,
        `Répartition des charges qui vous défavorise (un RDC qui paie l'ascenseur, par exemple)`,
        `Servitudes ou droits de passage`,
      ],
    },
    {
      id: 'etat-date',
      title: `5. L'état daté`,
      content: `Document comptable fourni par le syndic qui fait la photo financière du lot au moment de la vente. Il contient trois catégories d'informations :`,
      bullets: [
        `Les charges dues par le vendeur — s'il a des impayés, ça vous impacte indirectement (budget copro déséquilibré)`,
        `Les provisions versées par le vendeur — pour savoir ce qui a été payé sur les travaux votés`,
        `Les sommes qui restent à appeler — les futurs appels de fonds sur les travaux déjà votés. C'est vous qui les paierez`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `L'état daté coûte entre 380 et 600 € au vendeur (facturé par le syndic). Certains vendeurs traînent à le demander. Si l'agent vous dit "on le fera au compromis", insistez pour l'avoir avant votre offre. C'est ce document qui vous dit combien vous allez vraiment payer.`,
      },
    },
    {
      id: 'appels-charges',
      title: `6. Les appels de charges (12 derniers mois)`,
      content: `Les appels de charges, c'est ce que vous allez payer chaque trimestre au syndic. Demandez les 4 derniers trimestriels (ou les 12 derniers mensuels) pour avoir une vision claire.

Ce qui compte :`,
      bullets: [
        `Le montant total annuel — divisez-le par 12 pour avoir votre charge mensuelle réelle`,
        `La part charges courantes vs charges exceptionnelles — les charges courantes (entretien, gardien, assurance) sont récurrentes. Les charges exceptionnelles (travaux) sont ponctuelles mais peuvent être lourdes`,
        `L'évolution d'une année sur l'autre — des charges qui augmentent de 10 % par an, c'est un signal`,
      ],
    },
    {
      id: 'fiche-synthetique',
      title: `7. La fiche synthétique de copropriété`,
      content: `Document obligatoire établi chaque année par le syndic. C'est un résumé d'une ou deux pages qui donne les infos clés de la copropriété : nombre de lots, budget, fonds de travaux, dettes, contrats en cours.

C'est le document le plus rapide à lire et il vous donne une vue d'ensemble en 2 minutes. Si le syndic ne l'a pas produit, c'est un manquement — et un mauvais signe sur la gestion.`,
    },
    {
      id: 'carnet-entretien',
      title: `8. Le carnet d'entretien de l'immeuble`,
      content: `Le carnet d'entretien liste les travaux réalisés dans l'immeuble, les contrats d'entretien en cours (ascenseur, chaudière, espaces verts) et les équipements communs.

Pourquoi c'est utile : si la toiture a été refaite il y a 3 ans, vous savez que ce poste est tranquille pour un moment. Si elle n'a pas été touchée depuis 25 ans, un ravalement ou une réfection arrive probablement.`,
    },
    {
      id: 'pppt',
      title: `9. Le PPPT ou le PPT (Plan de travaux)`,
      content: `Depuis 2025, toutes les copropriétés de plus de 15 ans doivent avoir un Projet de Plan Pluriannuel de Travaux (PPPT). Et depuis le 1er janvier 2026, le syndic doit le fournir au notaire lors de la vente.

Ce document liste les travaux prévus sur 10 ans avec un chiffrage estimatif. C'est votre boule de cristal : il vous dit combien la copro va dépenser dans les années à venir — et donc combien vous allez payer.

Si le PPPT n'a pas été réalisé, la copro est en infraction. C'est un signal d'alerte sur la gestion du syndic.`,
      highlight: {
        type: 'info' as const,
        title: `Réglementation 2026`,
        content: `Le PPPT est obligatoire pour toutes les copropriétés de plus de 15 ans depuis le 1er janvier 2025. Seul un DTG (Diagnostic Technique Global) concluant à zéro travaux sur 10 ans peut en dispenser la copro.`,
      },
    },
    {
      id: 'taxe-fonciere',
      title: `10. La taxe foncière`,
      content: `On l'oublie souvent, mais la taxe foncière est une charge annuelle fixe qui pèse sur votre budget. Demandez le dernier avis au vendeur.

Deux choses à vérifier :`,
      bullets: [
        `Le montant — il varie énormément selon les communes. Pour un même bien, la taxe foncière peut aller du simple au triple entre deux villes`,
        `L'évolution récente — certaines communes ont fortement augmenté leur taux ces dernières années. Renseignez-vous sur la tendance locale`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Astuce`,
        content: `La taxe foncière est rarement négociable, mais elle doit rentrer dans votre calcul global. Un appartement "pas cher" avec 3 000 € de taxe foncière par an, ça change la donne.`,
      },
    },
  ],

  conclusion: `Demander ces 10 documents, ça prend du temps. L'agent immobilier va peut-être lever les yeux au ciel. Le vendeur va peut-être trouver que vous êtes difficile. Tant pis.

C'est votre argent, probablement le plus gros achat de votre vie. Chaque document vous protège contre une mauvaise surprise — ou vous donne un argument pour négocier le prix. Les deux sont bons.`,

  cta: {
    title: `Vous avez les documents, mais pas le temps de tout lire ?`,
    description: `Envoyez vos documents sur Verimo. Vous recevez un rapport clair avec score /20, tous les risques identifiés et des pistes de négociation concrètes.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'analyser-pv-ag-avant-achat',
    'compromis-vente-clauses-lire',
    'charges-copropriete-trop-elevees',
    'dpe-comment-lire-avant-achat',
  ],
};

export default article;

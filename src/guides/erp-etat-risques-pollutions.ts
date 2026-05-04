/**
 * Guide : ERP — comment décrypter l'État des Risques et Pollutions
 * Catégorie : Diagnostics > Sécurité & Conformité
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'erp-etat-risques-pollutions',
  category: 'diagnostics',
  categoryLabel: 'Diagnostics',
  categoryIcon: '🔍',
  categoryColor: '#d97706',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 6,

  seo: {
    title: `ERP État des Risques et Pollutions : comment le lire avant d'acheter — Guide Verimo`,
    description: `Zones inondables, risques sismiques, pollution des sols, radon — comment lire l'ERP et évaluer les risques avant un achat immobilier. Guide 2026.`,
  },

  title: `ERP : comment décrypter l'État des Risques et Pollutions`,
  subtitle: `Zones inondables, risques industriels, pollution des sols — ce que ce document vous apprend.`,

  docInfo: {
    emoji: '🌍',
    label: `ERP`,
    definition: `L'État des Risques et Pollutions est un document obligatoire qui informe l'acheteur sur les risques naturels (inondation, séisme, mouvement de terrain), miniers, technologiques (usine Seveso), le radon et la pollution des sols auxquels le bien est exposé.`,
  },

  intro: `L'ERP est souvent le diagnostic qu'on regarde le moins. C'est un formulaire avec des cases cochées, des numéros de plans et des noms de zones que personne ne comprend. Du coup, on le survole et on passe au DPE.

Pourtant, l'ERP vous dit des choses concrètes : est-ce que votre futur logement est en zone inondable ? À côté d'une usine Seveso ? Sur un sol pollué ? Dans une zone sismique ? Ce sont des informations qui impactent votre assurance, votre confort, et la revente.`,

  sections: [
    {
      id: 'contenu-erp',
      title: `Ce que contient l'ERP`,
      content: `L'ERP regroupe plusieurs catégories de risques. Pour chacune, le formulaire indique si le bien est concerné ou non :`,
      subsections: [
        {
          title: `Risques naturels`,
          content: `Inondation (débordement de cours d'eau, remontée de nappe, submersion marine), mouvement de terrain (glissement, effondrement, retrait-gonflement des argiles), avalanche, feu de forêt, séisme, volcanisme. C'est la partie la plus courante — beaucoup de communes françaises sont concernées par au moins un risque naturel.`,
        },
        {
          title: `Risques technologiques`,
          content: `Proximité d'une installation classée Seveso (usine chimique, dépôt pétrolier, entrepôt de matières dangereuses). Le périmètre de risque est défini par un PPRT (Plan de Prévention des Risques Technologiques). Si votre bien est dans ce périmètre, ça impacte les assurances et peut imposer des travaux de renforcement.`,
        },
        {
          title: `Radon`,
          content: `Le radon est un gaz radioactif naturel qui remonte du sol. Certaines zones de France sont classées à potentiel radon élevé (zone 3). Ce n'est pas un danger immédiat dans la plupart des cas, mais dans les zones à risque, des mesures de ventilation peuvent être recommandées.`,
        },
        {
          title: `Pollution des sols`,
          content: `Depuis 2023, l'ERP doit mentionner si le bien se situe dans un Secteur d'Information sur les Sols (SIS) — c'est-à-dire un terrain où une pollution des sols est connue ou suspectée (ancienne usine, station-service, décharge). Si c'est le cas, des études de sol complémentaires peuvent être nécessaires avant certains travaux.`,
        },
      ],
    },
    {
      id: 'zone-inondable',
      title: `Zone inondable : ce que ça change`,
      content: `C'est le risque le plus fréquent et le plus impactant. Si votre bien est en zone inondable (PPRI — Plan de Prévention du Risque Inondation) :`,
      bullets: [
        `L'assurance habitation sera plus chère — les surprimes pour risque d'inondation peuvent atteindre 30 à 50 % du tarif normal`,
        `Certains travaux sont interdits ou encadrés — dans les zones les plus exposées (zone rouge), vous ne pouvez pas agrandir, surélever ou créer de nouvelles ouvertures en sous-sol`,
        `La revente peut être compliquée — les acheteurs suivants verront le même ERP et poseront les mêmes questions`,
        `Les sinistres répétés font baisser la valeur — un bien inondé deux fois perd 10 à 20 % de sa valeur`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Un bien en zone bleue (risque modéré) et un bien en zone rouge (risque fort) ne sont pas du tout la même chose. Regardez le zonage exact sur le plan de prévention de la commune — le formulaire ERP seul ne donne pas le niveau de risque, juste la présence ou non.`,
      },
    },
    {
      id: 'argiles',
      title: `Retrait-gonflement des argiles`,
      content: `C'est un risque méconnu mais très courant en France, surtout pour les maisons individuelles. Les sols argileux gonflent quand ils sont humides et se rétractent quand ils sèchent. Ce mouvement crée des fissures dans les fondations et les murs.

Ce qu'il faut savoir :`,
      bullets: [
        `Le risque est classé de faible à fort selon la zone — les cartes sont disponibles sur georisques.gouv.fr`,
        `Les maisons individuelles sont beaucoup plus concernées que les immeubles — les fondations d'un immeuble sont plus profondes et plus stables`,
        `Les dégâts peuvent être coûteux — fissures structurelles, portes qui ne ferment plus, canalisations qui cassent. Les réparations vont de 10 000 à 50 000 € dans les cas graves`,
        `Depuis 2020, une étude de sol (étude G1) est obligatoire pour la vente de terrains constructibles en zone d'exposition moyenne ou forte`,
      ],
    },
    {
      id: 'comment-lire',
      title: `Comment lire l'ERP en 3 minutes`,
      content: `L'ERP est un formulaire standardisé. Voici comment le lire rapidement :`,
      numberedList: [
        `Regardez les cases cochées "Oui" — chaque ligne correspond à un type de risque. Si c'est "Non" partout, le bien est dans une zone sans risque identifié`,
        `Pour chaque "Oui", identifiez le type de risque — inondation, séisme, argiles, technologique, radon, pollution`,
        `Vérifiez si le bien a déjà subi un sinistre — le vendeur doit déclarer les indemnisations reçues au titre de catastrophes naturelles ou technologiques. C'est en bas du formulaire`,
        `Consultez le plan de prévention correspondant — le formulaire donne les références. Vous pouvez les consulter en mairie ou sur georisques.gouv.fr`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le site à connaître`,
        content: `georisques.gouv.fr — tapez l'adresse du bien et vous obtenez instantanément tous les risques identifiés avec les cartes détaillées. C'est gratuit et c'est la source officielle.`,
      },
    },
    {
      id: 'sinistres-passes',
      title: `Les sinistres passés : l'info que le vendeur doit donner`,
      content: `Le vendeur est obligé de déclarer si le bien a fait l'objet d'une indemnisation au titre d'une catastrophe naturelle ou technologique. C'est une obligation légale inscrite dans l'ERP.

Si le bien a été inondé, fissuré par la sécheresse, ou endommagé par une explosion industrielle, vous devez le savoir avant d'acheter. Un sinistre passé ne signifie pas que ça se reproduira — mais ça augmente la probabilité et ça impacte les assurances.`,
      highlight: {
        type: 'warning' as const,
        title: `Si le vendeur omet un sinistre`,
        content: `La non-déclaration d'un sinistre passé est un motif d'annulation de la vente ou de réduction de prix. Si vous découvrez après l'achat que le bien a été inondé et que le vendeur ne l'a pas déclaré, vous avez un recours juridique.`,
      },
    },
  ],

  conclusion: `L'ERP n'est pas le diagnostic le plus excitant du dossier. Mais 5 minutes passées dessus peuvent vous éviter d'acheter un bien en zone inondable, sur un sol pollué ou à côté d'une usine classée Seveso — des informations qui changent tout pour votre quotidien, votre assurance et votre revente.

Cochez les "Oui", identifiez les risques, et allez vérifier sur georisques.gouv.fr. C'est rapide et ça peut vous éviter une très mauvaise surprise.`,

  cta: {
    title: `Un ERP dans votre dossier ?`,
    description: `Verimo analyse votre ERP avec tous vos diagnostics et vous alerte sur les risques identifiés et leur impact concret sur votre achat.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    '10-documents-avant-offre-achat',
    'diagnostic-amiante-resultat-positif',
    'diagnostic-electricite-gaz-risques',
    'achat-maison-diagnostics-documents',
  ],
};

export default article;

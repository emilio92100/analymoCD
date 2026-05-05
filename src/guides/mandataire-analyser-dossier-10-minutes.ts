/**
 * Guide : Mandataire immobilier — comment analyser un dossier en 10 minutes
 * Catégorie : Professionnels > Agents & Mandataires
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'mandataire-analyser-dossier-10-minutes',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Mandataire immobilier : analyser un dossier copro en 10 minutes — Guide Verimo`,
    description: `Méthode rapide pour pré-analyser les documents d'un bien en copropriété et identifier les points bloquants. PV d'AG, charges, DPE, travaux. Guide pro 2026.`,
  },

  title: `Mandataire immobilier : comment analyser un dossier en 10 minutes`,
  subtitle: `Méthode rapide pour pré-analyser les documents d'un bien et identifier les points bloquants.`,

  intro: `En tant que mandataire, vous gérez plusieurs dossiers en parallèle. Chaque bien a son lot de documents — PV d'AG, diagnostics, état daté, règlement. Lire 200 pages par dossier, c'est impossible quand vous avez 10 mandats en cours.

Pourtant, vos clients comptent sur vous pour les alerter. Un acheteur qui découvre un ravalement de 8 000 € après le compromis, c'est votre crédibilité qui prend un coup. Un vendeur dont le DPE est périmé, c'est une vente qui se bloque.

Voici la méthode express pour pré-analyser un dossier copro en 10 minutes et repérer les points critiques.`,

  sections: [
    {
      id: 'minute-1-3',
      title: `Minutes 1-3 : le DPE et les diagnostics`,
      content: `Ouvrez le DDT et vérifiez en priorité :`,
      bullets: [
        `La classe DPE — E, F ou G ? Ça change la donne pour la location, la négociation et l'audit obligatoire`,
        `La date du DPE — avant juillet 2021 = plus valable. Il faut en refaire un`,
        `Les anomalies critiques en électricité — pas de terre, pas de différentiel 30 mA. Ce sont les 2 points que les acheteurs soulèvent le plus`,
        `L'amiante — positif en état 2 ou 3 ? Travaux obligatoires à chiffrer`,
        `La surface Carrez — correspond-elle à la surface annoncée ? Écart de plus de 5 % = problème`,
      ],
    },
    {
      id: 'minute-4-6',
      title: `Minutes 4-6 : le dernier PV d'AG`,
      content: `Pas besoin de tout lire. Cherchez ces 4 mots-clés dans le PV :`,
      bullets: [
        `"Travaux" — des travaux ont-ils été votés ? Montant ? Appels de fonds restants ?`,
        `"Impayés" ou "recouvrement" — quel taux ? En hausse ou en baisse ?`,
        `"Procédure" ou "judiciaire" — des contentieux en cours ? Combien ?`,
        `"Quitus" — le syndic a-t-il été approuvé ? Refusé = problème de gestion`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `L'astuce du Ctrl+F`,
        content: `Si le PV est en PDF, utilisez Ctrl+F et tapez "travaux", "impayés", "procédure". Vous trouvez les passages critiques en 30 secondes au lieu de lire 40 pages.`,
      },
    },
    {
      id: 'minute-7-8',
      title: `Minutes 7-8 : l'état daté ou le pré-état daté`,
      content: `Allez directement à la partie 3 — les sommes restant dues par l'acquéreur :`,
      bullets: [
        `Y a-t-il des appels de fonds à venir ? Combien ?`,
        `Le vendeur a-t-il des impayés ? (partie 1)`,
        `Le fonds de travaux — quel montant ? Est-ce cohérent avec l'ancienneté de l'immeuble ?`,
      ],
    },
    {
      id: 'minute-9-10',
      title: `Minutes 9-10 : les alertes à signaler`,
      content: `En 2 minutes, faites votre bilan. Notez les alertes à transmettre à votre client :`,
      numberedList: [
        `DPE dégradé (E, F, G) — impact sur le prix et la location`,
        `Travaux votés avec appels de fonds — montant exact pour l'acheteur`,
        `Impayés élevés (>15 %) — copro fragile financièrement`,
        `Procédures en cours — frais d'avocat à partager`,
        `Diagnostics avec anomalies graves — électricité, amiante, gaz`,
        `Surface Carrez différente de l'annonce — risque de recours`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Votre responsabilité`,
        content: `En tant que mandataire, vous avez un devoir de conseil. Si vous repérez un point critique et que vous ne le signalez pas à votre client, votre responsabilité peut être engagée. 10 minutes de pré-analyse vous protègent autant que votre client.`,
      },
    },
    {
      id: 'approfondir',
      title: `Quand approfondir l'analyse`,
      content: `La pré-analyse en 10 minutes repère les signaux forts. Mais certains dossiers méritent une analyse plus poussée :`,
      bullets: [
        `Plus de 2 alertes détectées — croisez les PV d'AG sur 3 ans pour voir la tendance`,
        `Gros montant de travaux votés — vérifiez l'échéancier exact dans l'état daté`,
        `DPE F ou G en investissement locatif — chiffrez les travaux nécessaires pour passer en D`,
        `Copro avec plus de 20 % d'impayés — regardez les 3 derniers PV pour l'évolution`,
        `Dossier complexe ou client exigeant — faites analyser le dossier par un outil spécialisé pour gagner du temps et apporter de la valeur`,
      ],
    },
  ],

  conclusion: `10 minutes par dossier, c'est suffisant pour repérer les problèmes majeurs et protéger votre client — et votre réputation. DPE, travaux votés, impayés, diagnostics critiques : 4 points à vérifier systématiquement.

Pour les dossiers complexes ou quand vous manquez de temps, un outil d'analyse automatique vous fait gagner des heures et vous donne un rapport professionnel à transmettre à votre client.`,

  cta: {
    title: `Gagnez du temps sur vos dossiers`,
    description: `Verimo Pro analyse les documents de copropriété en quelques minutes et vous fournit un rapport professionnel à partager avec vos clients.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'securiser-transactions-checklist-agent',
    'mandataires-iad-safti-capifrance-optimiser',
    'agent-differencier-analyse-documentaire',
    'analyser-pv-ag-avant-achat',
  ],
};

export default article;

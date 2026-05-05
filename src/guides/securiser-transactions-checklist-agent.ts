/**
 * Guide : Sécuriser ses transactions — la checklist documentaire de l'agent
 * Catégorie : Professionnels > Agents & Mandataires
 * Dernière mise à jour : mai 2026
 */  

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'securiser-transactions-checklist-agent',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  tag: 'Essentiel',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Checklist documentaire agent immobilier : sécuriser ses transactions — Guide Verimo`,
    description: `Les documents à vérifier systématiquement pour chaque transaction et éviter les litiges post-vente. Checklist complète pour agents immobiliers. Guide pro 2026.`,
  },

  title: `Sécuriser ses transactions : la checklist documentaire de l'agent`,
  subtitle: `Les documents à vérifier systématiquement pour éviter les litiges post-vente.`,

  intro: `Un litige post-vente, c'est une commission perdue, une réputation abîmée et des mois de stress. La plupart des litiges auraient pu être évités si les documents avaient été vérifiés correctement avant la signature.

Cette checklist est votre filet de sécurité. 15 points à vérifier sur chaque dossier, systématiquement. Ça prend 20 minutes et ça vous protège pendant des années.`,

  sections: [
    {
      id: 'avant-mandat',
      title: `Avant la prise de mandat`,
      content: `Vérifiez ces points dès le premier rendez-vous vendeur :`,
      numberedList: [
        `Le titre de propriété correspond-il au vendeur ? Vérifiez l'identité et la situation matrimoniale (divorce, indivision, SCI)`,
        `Le DPE est-il à jour (après juillet 2021) ? Si non, faites-le refaire avant la mise en vente`,
        `Le DDT est-il complet ? Listez les diagnostics obligatoires selon le type de bien`,
        `En copropriété : le syndic est-il identifié ? Avez-vous les coordonnées pour commander l'état daté ?`,
        `Y a-t-il des travaux votés ou des procédures en cours ? Demandez au vendeur directement`,
      ],
    },
    {
      id: 'avant-compromis',
      title: `Avant le compromis`,
      content: `Les documents à avoir impérativement avant la signature :`,
      bullets: [
        `DDT complet avec tous les diagnostics à jour`,
        `3 derniers PV d'AG (copropriété)`,
        `Règlement de copropriété + modificatifs`,
        `Fiche synthétique + carnet d'entretien`,
        `Pré-état daté ou état daté`,
        `PPPT si disponible`,
        `Taxe foncière du vendeur`,
        `Audit énergétique si maison E, F ou G`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le point critique`,
        content: `Si un document manque au compromis, le délai de rétractation ne court pas. L'acheteur peut se rétracter à tout moment. Vérifiez que le dossier est complet AVANT la signature.`,
      },
    },
    {
      id: 'coherence',
      title: `Les vérifications de cohérence`,
      content: `Croisez les informations entre les documents :`,
      bullets: [
        `Surface annoncée vs surface Carrez — écart de plus de 5 % ?`,
        `Charges annoncées vs charges réelles (appels de charges) — l'agent annonce souvent les charges courantes sans les appels de fonds`,
        `DPE de l'annonce vs DPE du diagnostic — même classe ?`,
        `Travaux mentionnés dans le PV vs état daté — les montants correspondent ?`,
        `Destination du lot dans le règlement vs usage prévu par l'acheteur — location meublée autorisée ?`,
      ],
    },
    {
      id: 'apres-vente',
      title: `Après la vente : se protéger`,
      content: `Gardez une trace de tout :`,
      bullets: [
        `Conservez une copie de tous les documents transmis à l'acheteur — avec la date de transmission`,
        `Gardez les échanges écrits (emails, SMS) où vous alertez sur des points de vigilance`,
        `Si vous avez fait faire une analyse documentaire, conservez le rapport`,
        `En cas de réclamation ultérieure, ces preuves démontrent que vous avez rempli votre devoir de conseil`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Votre devoir de conseil`,
        content: `L'agent immobilier a une obligation de conseil envers l'acheteur ET le vendeur. Un document transmis sans explication ne suffit pas — vous devez alerter sur les points importants. Gardez les preuves que vous l'avez fait.`,
      },
    },
  ],

  conclusion: `La checklist documentaire, c'est votre assurance professionnelle au quotidien. 15 points, 20 minutes par dossier. C'est la différence entre un agent qui espère que tout ira bien et un agent qui sait que tout est en ordre.`,

  cta: {
    title: `Automatisez votre checklist`,
    description: `Verimo Pro vérifie automatiquement la cohérence de vos dossiers et vous alerte sur les points manquants ou incohérents.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'mandataire-analyser-dossier-10-minutes',
    'agent-differencier-analyse-documentaire',
    'fideliser-clients-rapport-analyse',
    'mandataires-iad-safti-capifrance-optimiser',
  ],
};

export default article;

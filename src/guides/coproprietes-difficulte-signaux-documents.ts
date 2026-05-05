/**
 * Guide : Copropriétés en difficulté — repérer les signaux dans les documents
 * Catégorie : Professionnels > Investisseurs & Marchands de biens
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'coproprietes-difficulte-signaux-documents',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Copropriété en difficulté : signaux d'alerte dans les documents — Guide Verimo`,
    description: `Comment repérer une copropriété en difficulté dans les documents : impayés, procédures, syndic provisoire, fonds vide. Guide investisseur 2026.`,
  },

  title: `Copropriétés en difficulté : repérer les signaux dans les documents`,
  subtitle: `Impayés chroniques, procédures judiciaires, syndic provisoire — les red flags à identifier.`,

  intro: `Une copropriété en difficulté, c'est un investissement à haut risque — mais aussi, parfois, à haut rendement. Les lots se vendent 20 à 40 % en dessous du marché. Mais si la copro s'enfonce, votre investissement s'enfonce avec.

Les documents vous disent tout. Voici les signaux à repérer.`,

  sections: [
    {
      id: 'signaux-financiers',
      title: `Les signaux financiers`,
      content: `Dans les PV d'AG et la fiche synthétique, cherchez :`,
      bullets: [
        `Impayés supérieurs à 25 % du budget — seuil légal de signalement`,
        `Impayés en hausse constante sur 3 ans — la spirale est enclenchée`,
        `Fonds de travaux vide ou ponctionné pour les charges courantes`,
        `Budget prévisionnel systématiquement dépassé`,
        `Prestataires non payés ou contrats résiliés (ménage, ascenseur)`,
      ],
    },
    {
      id: 'signaux-juridiques',
      title: `Les signaux juridiques`,
      content: `Des signes que la copro est en crise :`,
      bullets: [
        `Nomination d'un mandataire ad hoc — le tribunal a été saisi`,
        `Nomination d'un administrateur provisoire — la gestion est retirée au syndic`,
        `Multiples procédures de recouvrement — le syndic poursuit les copropriétaires en impayés`,
        `Procédure pour plan de sauvegarde — la copro est officiellement en difficulté`,
        `Arrêté de péril ou d'insalubrité sur certains lots — la mairie intervient`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le seuil critique`,
        content: `Quand un administrateur provisoire est nommé, c'est que la situation est grave. Les décisions sont prises par le tribunal, plus par les copropriétaires. Le redressement peut prendre 3 à 10 ans.`,
      },
    },
    {
      id: 'signaux-gestion',
      title: `Les signaux de gestion`,
      content: `La qualité de gestion se lit dans les PV :`,
      bullets: [
        `Syndic qui change tous les ans — instabilité chronique`,
        `Quitus refusé 2 années de suite — les copropriétaires ne font plus confiance`,
        `AG avec moins de 25 % de participation — les copropriétaires ont abandonné`,
        `Pas de PPPT ni de DPE collectif réalisé — le syndic ne respecte pas ses obligations`,
        `Travaux reportés 3 ans de suite — personne ne veut payer`,
      ],
    },
    {
      id: 'opportunite-ou-piege',
      title: `Opportunité ou piège ?`,
      content: `Pour un investisseur, une copro en difficulté peut être les deux :`,
      subsections: [
        {
          title: `Une opportunité si`,
          content: `Le bien est bien situé, la copro est petite (facile à redresser), les problèmes sont identifiés et chiffrables, et le prix reflète les risques. Un investisseur actif qui s'implique en AG peut retourner la situation en 2-3 ans.`,
        },
        {
          title: `Un piège si`,
          content: `La copro est grande (50+ lots) avec des impayés massifs, un administrateur provisoire, et des lots en arrêté de péril. Le redressement peut prendre 5 à 10 ans — et vous payez les charges pendant tout ce temps sans garantie de résultat.`,
        },
      ],
      highlight: {
        type: 'tip' as const,
        title: `La règle d'or`,
        content: `N'achetez dans une copro en difficulté que si vous êtes prêt à vous impliquer activement : participer aux AG, rejoindre le conseil syndical, pousser les décisions. Un investisseur passif dans une copro en crise perd de l'argent.`,
      },
    },
  ],

  conclusion: `Les copropriétés en difficulté sont un terrain de jeu pour les investisseurs aguerris — mais un piège pour les novices. Les documents vous disent tout : le niveau de risque, le coût de portage, et le potentiel de redressement. Lisez-les avant de signer — pas après.`,

  cta: {
    title: `Évaluez le risque avant d'investir`,
    description: `Verimo Pro analyse les documents de copropriété et vous donne un diagnostic clair : santé financière, risques identifiés, projection des charges.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'impayes-copropriete-detecter-risque',
    'due-diligence-checklist-investisseur',
    'marchand-biens-bonnes-affaires-pv-ag',
    'analyser-pv-ag-avant-achat',
  ],
};

export default article;

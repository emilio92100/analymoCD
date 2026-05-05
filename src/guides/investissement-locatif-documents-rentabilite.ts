/**
 * Guide : Investissement locatif — ce que les documents révèlent sur la rentabilité réelle
 * Catégorie : Professionnels > Investisseurs & Marchands de biens
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'investissement-locatif-documents-rentabilite',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Investissement locatif : calculer la vraie rentabilité avec les documents — Guide Verimo`,
    description: `Les documents immobiliers révèlent la rentabilité réelle d'un investissement locatif. Charges, travaux, DPE, vacance. Comment calculer le vrai rendement. Guide 2026.`,
  },

  title: `Investissement locatif : ce que les documents révèlent sur la rentabilité réelle`,
  subtitle: `Charges réelles, travaux à venir, DPE contraignant — calculer le vrai rendement.`,

  intro: `L'annonce dit "rentabilité brute 8 %". L'agent dit "c'est une affaire". Mais quand vous regardez les documents — charges réelles, travaux votés, DPE en F, taxe foncière de 2 200 € — la rentabilité nette tombe à 3,5 %.

Les documents ne mentent pas. Ils contiennent toutes les informations pour calculer le vrai rendement. Voici comment.`,

  sections: [
    {
      id: 'brut-vs-net',
      title: `Rentabilité brute vs nette : la différence qui change tout`,
      content: `La rentabilité brute, c'est juste le loyer divisé par le prix d'achat. Ça ne sert à rien — personne ne touche le loyer brut. La rentabilité nette intègre toutes les charges :`,
      bullets: [
        `Charges de copropriété non récupérables sur le locataire (environ 20 à 30 % des charges totales)`,
        `Taxe foncière — 500 à 3 000 €/an selon la commune`,
        `Assurance PNO (propriétaire non occupant) — 100 à 250 €/an`,
        `Frais de gestion locative — 7 à 10 % des loyers si vous déléguez`,
        `Vacance locative — comptez 1 mois de vacance par an en moyenne (8 %)`,
        `Travaux d'entretien courant — 500 à 1 000 €/an en moyenne`,
        `Travaux copro votés — les appels de fonds de l'état daté`,
      ],
    },
    {
      id: 'documents-rentabilite',
      title: `Les documents qui révèlent le vrai rendement`,
      content: `Pour chaque poste, un document vous donne le chiffre exact :`,
      bullets: [
        `Charges réelles — appels de charges des 12 derniers mois (pas le montant annoncé par l'agent)`,
        `Taxe foncière — dernier avis du vendeur`,
        `Travaux votés — état daté partie 3`,
        `Travaux à venir — PPPT sur 5-10 ans`,
        `DPE — classe et estimation des factures. Un F ou G = travaux obligatoires avant location`,
        `Historique locatif — si le bien est déjà loué, demandez les quittances et l'historique de vacance`,
      ],
    },
    {
      id: 'dpe-location',
      title: `DPE et location : le calendrier à connaître`,
      content: `Les contraintes DPE impactent directement votre rentabilité :`,
      bullets: [
        `Classe G — interdit à la location depuis janvier 2025. Pas de revenus sans travaux`,
        `Classe F — interdit en 2028. Vous avez 2 ans pour rénover`,
        `Classe E — interdit en 2034. Le marché commence à décoter`,
        `Loyers gelés pour les F et G — aucune augmentation possible, même entre deux locataires`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le calcul à faire`,
        content: `Si le bien est en F et que les travaux pour passer en D coûtent 18 000 € (après aides), intégrez ce montant dans votre prix de revient. La rentabilité se calcule sur (prix d'achat + frais de notaire + travaux), pas juste sur le prix d'achat.`,
      },
    },
    {
      id: 'exemple-calcul',
      title: `Exemple de calcul complet`,
      content: `Bien à 180 000 € + 14 000 € frais de notaire. DPE E, loyer 750 €/mois :`,
      bullets: [
        `Loyer annuel brut : 9 000 €`,
        `Rentabilité brute : 9 000 / 180 000 = 5 %`,
        `Charges non récupérables : -600 €/an`,
        `Taxe foncière : -1 200 €/an`,
        `Gestion locative (8 %) : -720 €/an`,
        `Vacance (1 mois) : -750 €/an`,
        `Entretien : -500 €/an`,
        `Revenu net : 9 000 - 3 770 = 5 230 €/an`,
        `Rentabilité nette : 5 230 / 194 000 = 2,7 %`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Du 5 % brut au 2,7 % net`,
        content: `Presque la moitié du rendement disparaît avec les charges réelles. Et si des travaux copro de 4 000 € arrivent la première année, le rendement tombe à 1,6 %. C'est pour ça que les documents sont indispensables.`,
      },
    },
  ],

  conclusion: `La rentabilité d'un investissement locatif se calcule avec les documents, pas avec les promesses. Les charges, la taxe foncière, les travaux, le DPE — tout est dans le dossier. Faites le calcul complet avant de signer. Un investissement à 2,7 % net n'est pas forcément mauvais — mais c'est différent du 5 % brut qu'on vous a vendu.`,

  cta: {
    title: `Calculez la vraie rentabilité`,
    description: `Verimo Pro analyse les documents et calcule l'impact financier réel : charges, travaux, DPE. Pour investir en connaissance de cause.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'due-diligence-checklist-investisseur',
    'charges-copropriete-trop-elevees',
    'dpe-comment-lire-avant-achat',
    'passoire-thermique-fuir-negocier',
  ],
};

export default article;

/**
 * Guide : Analyser un immeuble de rapport — les documents clés
 * Catégorie : Professionnels > Investisseurs & Marchands de biens
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'analyser-immeuble-rapport-documents',
  category: 'professionnels',
  categoryLabel: 'Professionnels',
  categoryIcon: '💼',
  categoryColor: '#be123c',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Analyser un immeuble de rapport : documents clés et méthode — Guide Verimo`,
    description: `Comment analyser les documents d'un immeuble de rapport avant d'investir. PV d'AG, DPE collectif, baux, charges, travaux. Guide investisseur 2026.`,
  },

  title: `Analyser un immeuble de rapport : les documents clés`,
  subtitle: `PV d'AG, état daté, DPE collectif, baux en cours — la méthode pour évaluer un immeuble entier.`,

  intro: `Acheter un immeuble de rapport, c'est acheter une copropriété entière — ou un bâtiment en monopropriété avec plusieurs logements. L'enjeu documentaire est plus lourd que pour un simple appartement : vous devez analyser les documents de chaque lot ET ceux de l'immeuble dans son ensemble.

Voici les documents clés et la méthode pour les analyser efficacement.`,

  sections: [
    {
      id: 'documents-immeuble',
      title: `Les documents à demander`,
      content: `Pour un immeuble de rapport, vous avez besoin de :`,
      bullets: [
        `Le DPE collectif (ou les DPE individuels de chaque lot)`,
        `Les baux en cours — durée restante, loyer, type de bail (nu, meublé, commercial)`,
        `L'historique des loyers — évolution sur 3 ans, vacance locative`,
        `Les charges de copropriété (si copro) ou les charges d'exploitation (si monopropriété)`,
        `Les PV d'AG (si copropriété)`,
        `Le PPPT ou un diagnostic technique`,
        `Les diagnostics de chaque lot — amiante, plomb, électricité, gaz`,
        `La taxe foncière de l'ensemble`,
        `Les comptes de gestion si l'immeuble est géré par un administrateur de biens`,
      ],
    },
    {
      id: 'analyse-financiere',
      title: `L'analyse financière lot par lot`,
      content: `Pour chaque lot, calculez :`,
      bullets: [
        `Le loyer annuel encaissé (pas le loyer théorique — le réel)`,
        `Les charges imputables au propriétaire`,
        `La vacance locative des 3 dernières années`,
        `Les travaux réalisés et à prévoir dans le lot`,
        `Le DPE individuel — un lot en G devra être rénové pour rester louable`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le piège du rendement global`,
        content: `Le vendeur vous annonce un rendement global de 8 %. Mais si 2 lots sur 6 sont vacants, si 3 lots sont en G (interdits à la location sans travaux), et si la toiture fuit, le rendement réel est de 3 % — voire négatif.`,
      },
    },
    {
      id: 'etat-technique',
      title: `L'état technique du bâtiment`,
      content: `Pour un immeuble entier, l'état du bâti est crucial :`,
      bullets: [
        `Toiture — date de dernière réfection, état actuel, devis si besoin`,
        `Façades — ravalement fait ou à faire, arrêté municipal éventuel`,
        `Réseaux — électricité (colonnes montantes), plomberie (colonnes, évacuations), gaz`,
        `Structure — fissures, tassement, humidité en sous-sol`,
        `Parties communes — état des escaliers, des halls, des caves`,
      ],
    },
    {
      id: 'methode-rapide',
      title: `La méthode d'analyse rapide`,
      content: `Pour évaluer un immeuble de rapport en 1 heure :`,
      numberedList: [
        `Listez tous les lots avec loyer, DPE, état du bail (30 min)`,
        `Calculez le revenu net réel : loyers - charges - taxe foncière - vacance - gestion (15 min)`,
        `Identifiez les lots à problème : DPE G, vacants, travaux lourds (10 min)`,
        `Estimez les travaux immeuble (toiture, façade, réseaux) à partir du PPPT ou d'une visite (5 min)`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le tableau de synthèse`,
        content: `Créez un tableau avec une ligne par lot : loyer, DPE, état du bail, travaux à prévoir. En un coup d'oeil, vous voyez quels lots tirent la rentabilité vers le bas et lesquels la portent.`,
      },
    },
  ],

  conclusion: `Un immeuble de rapport, c'est un investissement qui se gagne ou se perd dans les documents. Les baux, les charges, les DPE, l'état technique — tout est vérifiable. Le vendeur qui affiche 8 % de rendement n'a pas forcément tort — mais les documents vous disent si c'est 8 % ou 3 %.`,

  cta: {
    title: `Un immeuble de rapport à analyser ?`,
    description: `Verimo Pro analyse tous les documents lot par lot et vous donne une vision consolidée : rentabilité, risques, travaux.`,
    buttonText: `Découvrir Verimo Pro`,
    buttonLink: '/pro',
  },

  relatedSlugs: [
    'due-diligence-checklist-investisseur',
    'investissement-locatif-documents-rentabilite',
    'coproprietes-difficulte-signaux-documents',
    'acheter-lot-analyser-plusieurs-biens',
  ],
};

export default article;

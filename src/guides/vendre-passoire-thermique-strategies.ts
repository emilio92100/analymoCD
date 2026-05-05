/**
 * Guide : Vendre une passoire thermique — stratégies pour ne pas brader
 * Catégorie : Vendeurs > Valoriser son bien
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'vendre-passoire-thermique-strategies',
  category: 'vendeurs',
  categoryLabel: 'Vendeurs',
  categoryIcon: '🤝',
  categoryColor: '#7c3aed',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Vendre une passoire thermique DPE F ou G : stratégies pour ne pas brader — Guide Verimo`,
    description: `DPE F ou G ne signifie pas vendre à perte. Comment fixer le bon prix, cibler les bons acheteurs et valoriser malgré un mauvais DPE. Guide 2026.`,
  },

  title: `Vendre une passoire thermique : stratégies pour ne pas brader`,
  subtitle: `DPE F ou G ne signifie pas vendre à perte. Comment valoriser malgré un mauvais diagnostic.`,

  intro: `Votre bien est classé F ou G au DPE. L'agent vous dit de baisser le prix. Les acheteurs négocient dur. Et vous lisez partout que les passoires thermiques ne se vendent plus.

La réalité est plus nuancée. Oui, un DPE F ou G impacte le prix — en moyenne 5 à 20 % de décote selon les marchés. Mais non, ça ne veut pas dire vendre à perte. Avec la bonne stratégie, vous pouvez limiter la décote et trouver le bon acheteur.`,

  sections: [
    {
      id: 'realite-marche',
      title: `La réalité du marché en 2026`,
      content: `Le marché des passoires thermiques a changé ces dernières années :`,
      bullets: [
        `Les logements G sont interdits à la location depuis janvier 2025 — les investisseurs qui achetaient pour louer sans travaux sont sortis du marché`,
        `Les logements F seront interdits en 2028 — les investisseurs anticipent et négocient encore plus fort`,
        `L'audit énergétique est obligatoire pour les maisons E, F et G — l'acheteur sait exactement combien coûtent les travaux avant de faire une offre`,
        `Les aides à la rénovation sont généreuses — MaPrimeRénov, éco-PTZ, CEE. Les acheteurs-rénovateurs sont de plus en plus nombreux`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Le point positif`,
        content: `Un nouveau profil d'acheteur émerge : le rénovateur. Il cherche spécifiquement les passoires thermiques, il a chiffré les travaux et les aides, et il est prêt à acheter — au bon prix. C'est votre cible principale.`,
      },
    },
    {
      id: 'fixer-prix',
      title: `Comment fixer le bon prix`,
      content: `La règle d'or : fixez votre prix en tenant compte de la décote DPE, pas en l'ignorant. Un bien affiché au prix du marché "normal" avec un DPE F ne recevra aucune offre — ou que des offres très basses.

La méthode :`,
      numberedList: [
        `Estimez la valeur du bien s'il était en classe D — c'est votre prix de référence. Utilisez les prix au m² du quartier pour des biens comparables bien classés`,
        `Soustrayez le coût des travaux pour passer en D — utilisez l'audit énergétique si vous l'avez. Sinon, estimez entre 15 000 et 40 000 € selon le bien`,
        `Ajoutez la valeur des aides disponibles — l'acheteur pourra bénéficier de MaPrimeRénov, CEE, éco-PTZ. Ça réduit son reste à charge. Vous pouvez récupérer une partie de cette valeur dans votre prix`,
        `Le résultat est votre prix cible — il sera inférieur au marché "normal" mais supérieur à ce que certains agents vous proposent`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Exemple`,
        content: `Bien comparable en D : 280 000 €. Travaux pour passer en D : 25 000 €. Aides estimées pour l'acheteur : 12 000 €. Prix cible : 280 000 - 25 000 + 12 000 = 267 000 €. Soit une décote de 5 % par rapport au marché — pas 15 %.`,
      },
    },
    {
      id: 'cibler-acheteurs',
      title: `Cibler les bons acheteurs`,
      content: `Tous les acheteurs ne sont pas les mêmes face à un DPE F ou G :`,
      bullets: [
        `Le rénovateur — il cherche spécifiquement un bien à rénover pour faire une plus-value ou habiter un logement refait à neuf. C'est votre meilleur acheteur. Il connaît les aides et a déjà chiffré les travaux`,
        `Le primo-accédant avec peu de budget — il accepte un mauvais DPE parce que le prix est plus bas. Il rénove progressivement. Il est sensible au prix mais aussi aux aides disponibles`,
        `L'investisseur qui anticipe — il achète un F maintenant, rénove, et le loue en D. C'est un calcul de rentabilité. Il négocie sec mais il est sérieux`,
        `L'acheteur émotionnel — il a un coup de cœur pour le bien (emplacement, charme, volume). Le DPE est un frein mais pas un deal-breaker. Il a besoin d'être rassuré sur le coût des travaux`,
      ],
    },
    {
      id: 'valoriser-annonce',
      title: `Comment valoriser dans l'annonce`,
      content: `Un bien classé F ou G a besoin d'une annonce différente :`,
      bullets: [
        `Mentionnez le potentiel après rénovation — "appartement de 80 m² à rénover, potentiel classe D après travaux"`,
        `Chiffrez les aides disponibles — "éligible MaPrimeRénov Parcours Accompagné, jusqu'à 40 000 € d'aides"`,
        `Mettez en avant les points forts du bien — emplacement, surface, luminosité, étage, vue. Le DPE ne fait pas tout`,
        `Soyez transparent sur le DPE — ne le cachez pas (c'est obligatoire dans l'annonce de toute façon). Présentez-le comme une opportunité, pas comme un défaut`,
        `Joignez l'audit énergétique si vous l'avez — les scénarios de travaux rassurent l'acheteur qui voit que c'est faisable`,
      ],
    },
    {
      id: 'renover-avant',
      title: `Faut-il rénover avant de vendre ?`,
      content: `La question que tous les vendeurs de passoires thermiques se posent. La réponse dépend de votre situation :`,
      subsections: [
        {
          title: `Quand rénover avant de vendre`,
          content: `Si les travaux sont simples et peu coûteux (changement de chaudière, isolation des combles) et que ça fait passer le DPE d'une ou deux classes, le retour sur investissement est souvent positif. Passer de G à E peut valoir le coup si ça débloque le marché locatif et attire plus d'acheteurs.`,
        },
        {
          title: `Quand ne pas rénover`,
          content: `Si les travaux sont lourds (isolation par l'extérieur, réfection complète) et que le bien est en copropriété (il faut un vote en AG), ne rénovez pas. Vendez en l'état à un prix ajusté. L'acheteur fera ses propres travaux selon ses goûts et bénéficiera lui-même des aides.`,
        },
      ],
      highlight: {
        type: 'warning' as const,
        title: `Le piège`,
        content: `Ne faites pas un "DPE de complaisance" en changeant juste la chaudière pour gagner une classe. L'acheteur verra que le reste (isolation, fenêtres) n'a pas été touché et négociera quand même. Et un diagnostiqueur sérieux ne se laissera pas influencer.`,
      },
    },
    {
      id: 'negociation-vendeur',
      title: `Comment gérer la négociation`,
      content: `L'acheteur va négocier sur le DPE — c'est inévitable. Préparez-vous :`,
      bullets: [
        `Connaissez les chiffres — coût des travaux (audit), aides disponibles, décote moyenne dans votre quartier. Si vous êtes préparé, vous contrôlez la discussion`,
        `Fixez votre prix plancher — en dessous duquel vous ne descendez pas. Calculez-le à l'avance`,
        `Acceptez une décote raisonnable — 5 à 10 % par rapport au marché pour un F, 10 à 15 % pour un G. Au-delà, vous bradez`,
        `Mettez en avant les aides — "l'acheteur peut toucher 15 000 € de MaPrimeRénov, le reste à charge réel des travaux est de 10 000 €, pas de 25 000 €"`,
        `Refusez les offres insultantes — un acheteur qui propose 30 % en dessous du marché n'est pas sérieux. Passez au suivant`,
      ],
    },
  ],

  conclusion: `Vendre une passoire thermique en 2026, c'est possible — à condition d'accepter la réalité du DPE, de fixer un prix réaliste, et de cibler les bons acheteurs. Le rénovateur, le primo-accédant malin, l'investisseur qui calcule : ils existent, et ils cherchent exactement votre type de bien.

Ne bradez pas. Mais ne surestimez pas non plus. Le bon prix, c'est celui qui tient compte du DPE, des travaux, des aides — et qui attire un acheteur sérieux en moins de 3 mois.`,

  cta: {
    title: `Vous vendez un bien mal classé ?`,
    description: `Verimo analyse votre dossier vendeur et vous donne une vision claire des points forts et points faibles. Préparez-vous avant les premières visites.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'passoire-thermique-fuir-negocier',
    'dpe-comment-lire-avant-achat',
    'documents-obligatoires-vendre-2026',
    'presenter-documents-rassurer-acheteur',
  ],
};

export default article;

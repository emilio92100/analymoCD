/**
 * Guide : Passoire thermique (DPE F ou G) — faut-il fuir ou négocier ?
 * Catégorie : Diagnostics > Performance énergétique
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'passoire-thermique-fuir-negocier',
  category: 'diagnostics',
  categoryLabel: 'Diagnostics',
  categoryIcon: '🔍',
  categoryColor: '#d97706',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 8,

  seo: {
    title: `Passoire thermique DPE F ou G : acheter ou pas ? — Guide Verimo`,
    description: `Un logement classé F ou G au DPE n'est pas toujours un mauvais plan. Comment estimer les travaux, négocier le prix et profiter des aides. Guide pratique 2026.`,
  },

  title: `Passoire thermique (DPE F ou G) : faut-il fuir ou négocier ?`,
  subtitle: `Un mauvais DPE n'est pas toujours rédhibitoire. Comment estimer le coût réel et en faire un levier.`,

  intro: `Vous tombez sur un appartement qui coche toutes vos cases — quartier, surface, luminosité, prix. Et puis vous voyez l'étiquette : DPE F. Ou pire, DPE G. Votre premier réflexe, c'est de passer votre chemin. Et dans certains cas, c'est la bonne décision.

Mais pas toujours. Une passoire thermique bien achetée — au bon prix, avec les bons travaux, et les bonnes aides — peut être une excellente affaire. Le tout, c'est de savoir dans quel cas vous êtes.`,

  sections: [
    {
      id: 'quand-fuir',
      title: `Quand faut-il vraiment fuir ?`,
      content: `Certaines situations rendent un achat F ou G trop risqué :`,
      bullets: [
        `Vous achetez pour louer et vous n'avez pas le budget travaux — les logements G sont déjà interdits à la location depuis janvier 2025, les F le seront en 2028. Sans travaux, votre bien ne rapportera rien`,
        `L'immeuble est en copropriété et rien n'est prévu — si le DPE collectif est mauvais mais que la copro refuse de voter les travaux, vous ne pourrez pas isoler les façades ou changer la chaudière tout seul`,
        `Les travaux nécessaires sont structurels — isolation par l'extérieur sur un immeuble classé, remplacement complet du système de chauffage collectif, reprise de toiture. Le budget peut dépasser 30 000 à 50 000 € pour votre seul lot`,
        `Le prix n'est pas ajusté — un vendeur qui demande le prix du marché pour un DPE G, c'est non. La décote doit refléter le coût réel des travaux`,
      ],
    },
    {
      id: 'quand-negocier',
      title: `Quand c'est une opportunité`,
      content: `Un DPE F ou G peut devenir un bon plan si les conditions sont réunies :`,
      bullets: [
        `Le prix est déjà décoté — les passoires thermiques se vendent 5 à 20 % moins cher selon les marchés. Si la décote est suffisante pour couvrir les travaux, c'est intéressant`,
        `Les travaux sont simples et chiffrables — changer les fenêtres, isoler les combles, installer une pompe à chaleur. Ce sont des postes bien connus avec des coûts prévisibles`,
        `Vous pouvez bénéficier des aides — MaPrimeRénov, CEE, éco-PTZ (jusqu'à 50 000 €), TVA à 5,5 %. Sur un projet de rénovation globale, les aides peuvent couvrir 40 à 60 % du coût`,
        `C'est une maison individuelle — vous décidez seul des travaux, pas besoin de voter en AG. C'est beaucoup plus simple qu'en copropriété`,
        `Vous achetez votre résidence principale — pas de contrainte de location, vous rénovez à votre rythme`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Le calcul à faire`,
        content: `Prenez le prix demandé + le coût estimé des travaux (après aides). Comparez avec le prix d'un bien équivalent en classe D dans le même quartier. Si c'est moins cher, vous faites une bonne affaire — et en plus vous avez un logement rénové à neuf.`,
      },
    },
    {
      id: 'estimer-travaux',
      title: `Comment estimer le coût des travaux`,
      content: `Sans devis précis, voici les ordres de grandeur pour passer de F/G à D :`,
      bullets: [
        `Isolation des combles ou du toit — 40 à 80 €/m² de surface à isoler. Souvent le meilleur rapport qualité-prix`,
        `Isolation des murs par l'intérieur — 60 à 120 €/m² de paroi. Vous perdez un peu de surface habitable`,
        `Isolation des murs par l'extérieur — 120 à 200 €/m² de façade. Plus efficace mais nécessite un vote en copro`,
        `Changement de fenêtres — 500 à 1 200 € par fenêtre (double vitrage). En copro, il faut souvent un vote en AG`,
        `Pompe à chaleur air-eau — 8 000 à 15 000 € installée. Remplace une chaudière fioul ou gaz`,
        `Ventilation VMC double flux — 4 000 à 8 000 € installée. Améliore le confort et réduit les pertes`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Ordre de grandeur global`,
        content: `Pour une maison de 100 m² passant de G à D, comptez entre 25 000 et 50 000 € avant aides, et entre 10 000 et 25 000 € après aides (selon vos revenus et le type de travaux). Pour un appartement, c'est souvent moins car les murs et la toiture sont gérés par la copro.`,
      },
    },
    {
      id: 'aides-2026',
      title: `Les aides disponibles en 2026`,
      content: `Le gouvernement veut éradiquer les passoires thermiques. Du coup, les aides sont généreuses — surtout pour les rénovations globales :`,
      bullets: [
        `MaPrimeRénov Parcours Accompagné — pour les rénovations d'ampleur avec un gain minimum de 2 classes DPE. Jusqu'à 63 000 € selon les revenus et le gain énergétique. Un accompagnateur Rénov est obligatoire`,
        `Les CEE (Certificats d'Économies d'Énergie) — primes versées par les fournisseurs d'énergie. Cumulables avec MaPrimeRénov`,
        `L'éco-PTZ — prêt à taux zéro jusqu'à 50 000 € pour une rénovation globale, remboursable sur 20 ans`,
        `TVA à 5,5 % — sur les travaux de rénovation énergétique (au lieu de 20 %)`,
        `Aides locales — certaines régions, départements ou communes ajoutent des primes. Consultez France Rénov pour votre situation`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Attention`,
        content: `Depuis 2025, pour bénéficier de MaPrimeRénov sur une maison classée F ou G, vous devez obligatoirement passer par le parcours "rénovation d'ampleur" avec un audit énergétique préalable. Les gestes isolés (juste des fenêtres, juste une chaudière) ne suffisent plus pour avoir les aides.`,
      },
    },
    {
      id: 'negocier-prix',
      title: `Comment négocier le prix`,
      content: `Votre meilleur outil de négociation, c'est le DPE lui-même — et l'audit énergétique si le vendeur en a un. Voici comment argumenter :`,
      numberedList: [
        `Chiffrez les travaux nécessaires pour atteindre la classe D — utilisez l'audit énergétique ou demandez des devis`,
        `Soustrayez les aides auxquelles vous avez droit — le reste à charge, c'est votre argument`,
        `Calculez le surcoût énergétique — la différence de facture entre un F et un D sur 10 ans, c'est concret (souvent 10 000 à 20 000 €)`,
        `Rappelez les contraintes légales — un F ne pourra plus être loué en 2028, un G ne peut déjà plus l'être. Le vendeur le sait, son bassin d'acheteurs se réduit chaque année`,
        `Comparez avec les prix au m² de biens similaires en classe D dans le quartier — la différence est votre marge de négociation`,
      ],
    },
    {
      id: 'copro-vs-maison',
      title: `En copropriété : le cas particulier`,
      content: `Acheter une passoire thermique en copropriété, c'est plus compliqué qu'en maison. Vous ne décidez pas seul des travaux sur les parties communes (façades, toiture, chaudière collective).

Ce qu'il faut vérifier :`,
      bullets: [
        `Le DPE collectif de l'immeuble — si l'immeuble est en F ou G, des travaux collectifs vont être nécessaires`,
        `Le PPPT — le plan de travaux sur 10 ans vous dit quels travaux sont prévus et quand`,
        `L'ambiance en AG — les copropriétaires sont-ils prêts à voter des travaux ? Ou est-ce qu'ils repoussent depuis des années ?`,
        `Le fonds de travaux — s'il est bien alimenté, la copro a les moyens de lancer les chantiers. S'il est vide, ce sera compliqué`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Bon à savoir`,
        content: `En copropriété, vous pouvez quand même améliorer votre DPE individuel avec des travaux privatifs : changer vos fenêtres (si le règlement le permet), isoler par l'intérieur, remplacer votre chauffage individuel. Ça ne résout pas tout, mais ça peut suffire pour passer de G à E.`,
      },
    },
  ],

  conclusion: `Un DPE F ou G, ce n'est pas automatiquement une mauvaise affaire. C'est une affaire qui demande du calcul. Si le prix est ajusté, si les travaux sont faisables, et si les aides couvrent une bonne partie du coût, vous pouvez acheter un logement rénové à neuf pour moins cher qu'un bien en D.

Mais si le prix n'est pas décoté, si la copro bloque les travaux, ou si le budget rénovation explose votre capacité financière — passez votre chemin.`,

  cta: {
    title: `Un bien classé F ou G vous intéresse ?`,
    description: `Verimo analyse tous les documents du bien et de la copropriété pour vous dire si c'est un bon plan ou un piège. Score, risques et leviers de négociation.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'dpe-comment-lire-avant-achat',
    'utiliser-dpe-negocier-prix',
    'dpe-collectif-2026-obligations',
    'charges-copropriete-trop-elevees',
  ],
};

export default article;

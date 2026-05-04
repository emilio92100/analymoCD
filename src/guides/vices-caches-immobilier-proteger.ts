/**
 * Guide : Vices cachés immobilier — comment se protéger avant d'acheter
 * Catégorie : Acheteurs > Avant de signer
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'vices-caches-immobilier-proteger',
  category: 'acheteurs',
  categoryLabel: 'Acheteurs',
  categoryIcon: '🧑‍💼',
  categoryColor: '#059669',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `Vices cachés immobilier : comment se protéger avant d'acheter — Guide Verimo`,
    description: `Fissures, humidité, toiture, canalisations — comment repérer les vices cachés dans les documents et les visites, et vos recours après l'achat. Guide 2026.`,
  },

  title: `Vices cachés immobilier : comment se protéger avant d'acheter`,
  subtitle: `Fissures, humidité, toiture, canalisations — comment repérer les vices cachés dans les documents et les visites.`,

  intro: `Vous avez acheté. Trois mois plus tard, l'eau s'infiltre par le toit, les murs du salon sont humides, et le plombier vous annonce que les canalisations sont pourries. Le vendeur "ne savait pas". L'agent "n'a rien vu". Et vous êtes coincé avec la facture.

Les vices cachés, c'est le cauchemar de l'acheteur immobilier. Un défaut grave que le vendeur connaissait (ou aurait dû connaître) et qu'il n'a pas déclaré. La loi vous protège — mais les procédures sont longues, coûteuses, et le résultat n'est jamais garanti.

La meilleure protection, c'est la prévention : repérer les indices avant d'acheter.`,

  sections: [
    {
      id: 'definition',
      title: `Qu'est-ce qu'un vice caché en droit`,
      content: `Pour être qualifié de vice caché au sens juridique (article 1641 du Code civil), un défaut doit remplir 3 conditions :`,
      bullets: [
        `Il est caché — il n'était pas visible lors de la visite et n'a pas été signalé par le vendeur. Un problème évident (fissure visible, tache d'humidité apparente) n'est pas un vice caché`,
        `Il est grave — il rend le bien impropre à l'usage auquel il est destiné, ou diminue tellement cet usage que l'acheteur ne l'aurait pas acheté (ou aurait payé moins cher) s'il l'avait su`,
        `Il existait avant la vente — un problème apparu après la vente (dégât des eaux du voisin, tempête) n'est pas un vice caché`,
      ],
      highlight: {
        type: 'info' as const,
        title: `La clause d'exonération`,
        content: `La plupart des compromis et actes de vente contiennent une clause de non-garantie des vices cachés. Le vendeur se décharge de sa responsabilité. Mais cette clause ne fonctionne pas si le vendeur est un professionnel (marchand de biens) ou s'il connaissait le vice et l'a dissimulé intentionnellement.`,
      },
    },
    {
      id: 'indices-visite',
      title: `Les indices à repérer pendant la visite`,
      content: `Les vices cachés laissent souvent des traces visibles — si vous savez où regarder :`,
      bullets: [
        `Traces d'humidité — auréoles au plafond, peinture qui cloque, moisissures dans les angles, odeur de moisi. Demandez depuis quand et quelle est la cause`,
        `Fissures — fissures en escalier sur les murs extérieurs, fissures au-dessus des fenêtres, fissures sur le carrelage. Les fissures structurelles sont un signe de mouvement du bâtiment`,
        `Peinture ou papier peint fraîchement refait — un vendeur qui repeint juste avant la vente peut cacher des traces d'humidité ou des fissures`,
        `Portes et fenêtres qui ne ferment plus bien — signe que le bâtiment bouge (tassement, argiles, fondations)`,
        `Odeur de renfermé dans la cave ou le sous-sol — possible infiltration ou remontée capillaire`,
        `Dalles de sol qui sonnent creux — possible problème de plancher ou de canalisations en dessous`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `La visite stratégique`,
        content: `Visitez après un jour de pluie — les infiltrations se voient mieux. Visitez le sous-sol et les combles, pas seulement les pièces de vie. Et n'hésitez pas à ouvrir les placards, regarder derrière les meubles, et inspecter les angles bas des murs.`,
      },
    },
    {
      id: 'indices-documents',
      title: `Les indices dans les documents`,
      content: `Les documents de copropriété peuvent révéler des problèmes que le vendeur tait :`,
      bullets: [
        `Les PV d'AG mentionnent des "infiltrations", "dégâts des eaux récurrents", "problèmes d'étanchéité" — si le sujet revient sur 2-3 PV, c'est un problème chronique`,
        `Des procédures en cours pour malfaçons ou dégâts — le vendeur est peut-être en litige avec un voisin ou un prestataire pour un problème structurel`,
        `Le carnet d'entretien montre des réparations répétées au même endroit — une toiture réparée 3 fois en 5 ans, c'est un problème non résolu`,
        `Le diagnostic amiante ou plomb révèle des matériaux dégradés — le vendeur est censé en informer l'acheteur`,
        `Le diagnostic électricité note des anomalies graves — une installation dangereuse peut être considérée comme un vice si le vendeur la connaissait`,
      ],
    },
    {
      id: 'se-proteger',
      title: `Comment se protéger avant l'achat`,
      content: `La meilleure protection, c'est la prévention :`,
      numberedList: [
        `Visitez au moins 2 fois, dont une fois après la pluie — les infiltrations et l'humidité se voient mieux`,
        `Lisez tous les PV d'AG — cherchez les mots "infiltration", "fissure", "dégât des eaux", "étanchéité", "fondation"`,
        `Demandez au vendeur s'il y a eu des sinistres déclarés à l'assurance — il doit le mentionner dans l'ERP`,
        `Faites faire un état des lieux technique si vous avez un doute — un architecte ou un expert bâtiment peut inspecter le bien pour 500 à 1 500 €`,
        `Vérifiez que la clause de non-garantie des vices cachés dans le compromis est standard — si le vendeur insiste pour une clause renforcée, demandez-vous pourquoi`,
        `Gardez toutes les annonces et photos — si le vendeur a caché un défaut visible sur les photos mais pas en vrai, c'est un indice de dissimulation`,
      ],
    },
    {
      id: 'recours-apres',
      title: `Vos recours après l'achat`,
      content: `Si vous découvrez un vice caché après la vente :`,
      bullets: [
        `Vous avez 2 ans à partir de la découverte du vice pour agir en justice (pas 2 ans après l'achat)`,
        `Faites constater le problème par un expert — huissier de justice ou expert judiciaire. Ne faites pas les réparations avant le constat`,
        `Envoyez une lettre recommandée au vendeur décrivant le problème et demandant une solution amiable`,
        `Si pas d'accord amiable, saisissez le tribunal judiciaire — vous pouvez demander une réduction de prix (action estimatoire) ou l'annulation de la vente (action rédhibitoire)`,
        `Conservez toutes les preuves — photos, rapports d'experts, factures, échanges avec le vendeur, annonces immobilières d'avant la vente`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `En pratique`,
        content: `Les procédures pour vice caché durent souvent 2 à 4 ans et coûtent entre 5 000 et 15 000 € en frais d'expert et d'avocat. Le résultat n'est jamais garanti — surtout si le vendeur est un particulier insolvable. La prévention est toujours moins chère que le procès.`,
      },
    },
  ],

  conclusion: `Les vices cachés, c'est le risque que tous les acheteurs redoutent. La bonne nouvelle : dans la plupart des cas, les indices sont détectables avant l'achat — dans les visites et dans les documents. Traces d'humidité, fissures, PV d'AG qui mentionnent des problèmes récurrents, diagnostics avec anomalies.

Prenez le temps de chercher. Chaque indice repéré avant la signature vous évite un procès après.`,

  cta: {
    title: `Un doute sur l'état du bien ?`,
    description: `Verimo analyse vos documents et détecte les signaux de problèmes récurrents : infiltrations mentionnées en AG, diagnostics avec anomalies, travaux reportés.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    '10-documents-avant-offre-achat',
    'verifier-10-jours-retractation',
    'diagnostic-amiante-resultat-positif',
    'diagnostic-electricite-gaz-risques',
  ],
};

export default article;

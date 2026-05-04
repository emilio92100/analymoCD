/**
 * Guide : Règlement de copropriété — les 7 clauses à vérifier absolument
 * Catégorie : Copropriété > Documents de copropriété
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'reglement-copropriete-clauses-verifier',
  category: 'copropriete',
  categoryLabel: 'Copropriété',
  categoryIcon: '🏢',
  categoryColor: '#2a7d9c',
  tag: 'Essentiel',
  publishedAt: '2026-05-05',
  updatedAt: '2026-05-05',
  readingTime: 8,

  seo: {
    title: `Règlement de copropriété : 7 clauses à vérifier avant d'acheter — Guide Verimo`,
    description: `Usage du lot, répartition des charges, parties privatives et communes, restrictions : les 7 clauses du règlement de copropriété à lire avant de signer. Guide 2026.`,
  },

  title: `Règlement de copropriété : les 7 clauses à vérifier absolument`,
  subtitle: `Usage du lot, répartition des charges, parties privatives et communes — ce que cache ce document fondateur.`,

  docInfo: {
    emoji: '📘',
    label: `Règlement de copropriété`,
    definition: `Document juridique qui définit les règles de vie de l'immeuble, la destination des lots et la répartition des charges entre copropriétaires. Il est établi lors de la mise en copropriété et s'impose à tous les propriétaires.`,
  },

  intro: `Le règlement de copropriété, c'est la constitution de l'immeuble. Tout ce qui est autorisé, interdit, partagé ou privé y est écrit. Et contrairement aux PV d'AG qui changent chaque année, le règlement est souvent le même depuis la construction de l'immeuble — parfois depuis 40 ou 50 ans.

Le problème : personne ne le lit. C'est un document de 30 à 80 pages, rédigé en langage notarial, et la plupart des acheteurs le découvrent après avoir signé. Sauf que certaines clauses peuvent ruiner vos projets — louer en Airbnb, exercer une activité professionnelle, aménager un comble, ou même installer une clim.

Voici les 7 clauses à vérifier avant d'acheter.`,

  sections: [
    {
      id: 'destination-immeuble',
      title: `1. La destination de l'immeuble`,
      content: `C'est la clause la plus importante. Elle définit à quoi l'immeuble est destiné : habitation, usage mixte (habitation + commerce), ou professionnel.

Pourquoi c'est crucial :`,
      bullets: [
        `Si l'immeuble est "exclusivement bourgeois" ou "à usage d'habitation uniquement", vous ne pouvez pas y exercer une activité professionnelle ni louer en meublé de tourisme`,
        `Si l'immeuble est "à usage mixte", les lots commerciaux en rez-de-chaussée peuvent accueillir des activités bruyantes (restaurant, bar, salle de sport) — vérifiez lesquelles`,
        `Certains règlements distinguent "profession libérale autorisée" et "activité commerciale interdite" — la nuance est importante si vous êtes indépendant`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `La clause "habitation bourgeoise" interdit souvent la location meublée de courte durée (Airbnb). Si vous comptez louer votre bien sur des plateformes, vérifiez cette clause — et le règlement municipal en plus. La double contrainte (règlement copro + mairie) bloque beaucoup de projets.`,
      },
    },
    {
      id: 'repartition-charges',
      title: `2. La répartition des charges`,
      content: `Le règlement fixe les tantièmes de chaque lot — c'est-à-dire la part de charges que chaque copropriétaire paie. Les tantièmes sont calculés en fonction de la surface, de l'étage et de l'exposition du lot.

Mais il y a deux types de charges avec des répartitions différentes :`,
      subsections: [
        {
          title: `Les charges générales`,
          content: `Entretien des parties communes, assurance, syndic, ménage. Réparties selon les tantièmes généraux. Tous les copropriétaires paient.`,
        },
        {
          title: `Les charges spéciales`,
          content: `Ascenseur, chauffage collectif, eau chaude. Réparties selon l'utilité pour chaque lot. Un rez-de-chaussée ne devrait pas payer l'ascenseur — mais vérifiez, certains anciens règlements l'imposent quand même.`,
        },
      ],
      highlight: {
        type: 'tip' as const,
        title: `Astuce`,
        content: `Comparez vos tantièmes avec ceux des lots similaires dans l'immeuble. Si votre lot de 60 m² au 3e étage a plus de tantièmes qu'un lot de 70 m² au 2e, il y a peut-être une erreur historique dans le règlement — ça se conteste en AG.`,
      },
    },
    {
      id: 'parties-privatives-communes',
      title: `3. Les parties privatives et communes`,
      content: `Le règlement définit précisément ce qui vous appartient (privatif) et ce qui appartient à la copropriété (commun). Et la frontière n'est pas toujours où on le pense.

Les surprises les plus fréquentes :`,
      bullets: [
        `Les fenêtres et volets — souvent parties communes. Vous ne pouvez pas les changer sans vote en AG`,
        `Les balcons et terrasses — la dalle est souvent commune, le revêtement est privatif. Les réparations de structure sont à la charge de la copro, mais pas l'étanchéité de votre terrasse privative`,
        `Les canalisations — les colonnes montantes sont communes, les raccordements dans votre lot sont privatifs. En cas de fuite, ça détermine qui paie`,
        `Les combles et caves — vérifiez si votre cave est bien un lot privatif avec des tantièmes, ou un simple droit de jouissance (moins de droits)`,
        `Les places de parking — lot privatif avec tantièmes, ou simple droit d'usage ?`,
      ],
    },
    {
      id: 'restrictions-usage',
      title: `4. Les restrictions d'usage`,
      content: `Le règlement peut contenir des interdictions qui limitent ce que vous pouvez faire chez vous :`,
      bullets: [
        `Interdiction de changer l'affectation du lot — transformer un commerce en logement ou l'inverse`,
        `Interdiction de certains animaux — chiens de certaines catégories, nombre d'animaux limité`,
        `Restrictions sur les travaux — interdiction de percer les murs porteurs (logique), mais aussi parfois interdiction de modifier les cloisons intérieures sans autorisation`,
        `Interdiction d'étendre du linge aux fenêtres — fréquent dans les copropriétés de standing`,
        `Restrictions sur les activités bruyantes — horaires de bricolage, musique, instruments`,
        `Interdiction de poser une parabole en façade`,
      ],
      highlight: {
        type: 'info' as const,
        title: `Bon à savoir`,
        content: `Certaines clauses anciennes sont devenues illégales avec le temps. Par exemple, une clause interdisant totalement les animaux domestiques est réputée non écrite depuis 1970. Mais elle reste souvent dans le texte. Un règlement non mis à jour ne veut pas dire que toutes ses clauses s'appliquent.`,
      },
    },
    {
      id: 'modificatifs',
      title: `5. Les modificatifs au règlement`,
      content: `Le règlement d'origine peut avoir été modifié au fil des années par des votes en AG. Ces modifications s'appellent des "modificatifs" et sont annexés au règlement.

Exemples courants :`,
      bullets: [
        `Division d'un lot en deux (un grand appartement coupé en deux) — ça change les tantièmes et la répartition des charges`,
        `Changement d'affectation d'un lot (cave transformée en local commercial, chambre de service transformée en studio)`,
        `Modification de la répartition des charges suite à des travaux (ascenseur ajouté, chauffage individuel remplaçant le collectif)`,
        `Ajout de parties communes (local vélos, local poubelles)`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Demandez toujours le règlement avec tous ses modificatifs. Le règlement d'origine seul ne suffit pas — les modificatifs peuvent avoir changé les tantièmes, les charges, ou les droits d'usage.`,
      },
    },
    {
      id: 'servitudes',
      title: `6. Les servitudes`,
      content: `Le règlement peut mentionner des servitudes qui affectent votre lot ou les parties communes :`,
      bullets: [
        `Servitude de passage — un voisin ou un tiers a le droit de passer par votre lot ou par les parties communes`,
        `Servitude de vue — restriction sur les ouvertures que vous pouvez créer pour ne pas voir chez le voisin`,
        `Servitude de canalisation — des tuyaux d'un autre lot passent chez vous`,
        `Droit de surélévation — la copro ou un tiers a le droit de construire au-dessus de l'immeuble`,
      ],
      highlight: {
        type: 'warning' as const,
        title: `Point de vigilance`,
        content: `Les servitudes sont souvent oubliées mais peuvent impacter votre confort ou vos projets de travaux. Un droit de surélévation, par exemple, veut dire que quelqu'un pourra construire un étage au-dessus de chez vous.`,
      },
    },
    {
      id: 'checklist-reglement',
      title: `Votre checklist règlement de copropriété`,
      content: `Avant de signer, passez le règlement au crible de ces questions :`,
      numberedList: [
        `Quelle est la destination de l'immeuble ? Habitation pure, mixte, ou bourgeoise ?`,
        `La location meublée de courte durée est-elle autorisée ?`,
        `Combien de tantièmes a votre lot ? Comment se répartissent les charges ?`,
        `Qu'est-ce qui est privatif et qu'est-ce qui est commun (fenêtres, balcon, cave) ?`,
        `Y a-t-il des restrictions d'usage qui vous gênent ?`,
        `Le règlement a-t-il été modifié ? Avez-vous tous les modificatifs ?`,
        `Y a-t-il des servitudes sur votre lot ?`,
      ],
    },
  ],

  conclusion: `Le règlement de copropriété n'est pas un document qu'on lit pour le plaisir. Mais 30 minutes passées dessus peuvent vous éviter de découvrir, après l'achat, que vous ne pouvez pas louer en meublé, que vos charges sont anormalement élevées, ou que le voisin a un droit de passage dans votre cave.

Lisez au moins les clauses de destination, de répartition des charges et de restrictions d'usage. Le reste, vous pouvez le faire analyser.`,

  cta: {
    title: `Un règlement de copropriété à décrypter ?`,
    description: `Verimo analyse votre règlement avec tous vos documents et vous signale les clauses à risque, les restrictions et les répartitions de charges anormales.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'analyser-pv-ag-avant-achat',
    'charges-copropriete-trop-elevees',
    '10-documents-avant-offre-achat',
    'etat-date-document-vendeur',
  ],
};

export default article;

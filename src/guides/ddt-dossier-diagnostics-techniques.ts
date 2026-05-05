/**
 * Guide : DDT — tout ce que le Dossier de Diagnostics Techniques doit contenir
 * Catégorie : Vendeurs > Préparer sa vente
 * Dernière mise à jour : mai 2026
 */

import type { GuideArticle } from './types';

const article: GuideArticle = {
  slug: 'ddt-dossier-diagnostics-techniques',
  category: 'vendeurs',
  categoryLabel: 'Vendeurs',
  categoryIcon: '🤝',
  categoryColor: '#7c3aed',
  publishedAt: '2026-05-06',
  updatedAt: '2026-05-06',
  readingTime: 7,

  seo: {
    title: `DDT Dossier de Diagnostics Techniques : contenu complet et validité — Guide Verimo`,
    description: `Les diagnostics obligatoires selon le type de bien, leur durée de validité et les sanctions en cas d'absence. Tout savoir sur le DDT en 2026.`,
  },

  title: `DDT : tout ce que le Dossier de Diagnostics Techniques doit contenir`,
  subtitle: `Les diagnostics obligatoires selon le type de bien, leur durée de validité et les sanctions en cas d'absence.`,

  docInfo: {
    emoji: '📂',
    label: `DDT`,
    definition: `Le Dossier de Diagnostics Techniques regroupe l'ensemble des diagnostics obligatoires à fournir à l'acheteur lors d'une vente immobilière. Son contenu varie selon le type de bien, sa date de construction et sa localisation.`,
  },

  intro: `Le DDT, c'est le dossier que le vendeur doit remettre à l'acheteur au plus tard le jour du compromis. Il contient tous les diagnostics immobiliers obligatoires — et leur nombre varie selon le bien.

Un appartement récent dans une zone sans risque particulier aura un DDT léger (DPE, Carrez, ERP). Une maison ancienne en zone termites avec assainissement individuel aura un DDT de 10 diagnostics. Voici comment s'y retrouver.`,

  sections: [
    {
      id: 'liste-complete',
      title: `La liste complète des diagnostics`,
      content: `Voici tous les diagnostics qui peuvent figurer dans un DDT, avec les conditions qui les rendent obligatoires :`,
      numberedList: [
        `DPE — tous les biens, sans exception. Valable 10 ans`,
        `Diagnostic amiante — permis de construire avant le 1er juillet 1997. Sans limite si négatif`,
        `Diagnostic plomb (CREP) — construction avant le 1er janvier 1949. 1 an si positif, sans limite si négatif`,
        `Diagnostic électricité — installation de plus de 15 ans. Valable 3 ans`,
        `Diagnostic gaz — installation de plus de 15 ans. Valable 3 ans`,
        `Diagnostic termites — commune avec arrêté préfectoral. Valable 6 mois`,
        `ERP — tous les biens. Valable 6 mois`,
        `Mesurage loi Carrez — lots en copropriété. Sans limite sauf travaux`,
        `Diagnostic assainissement non collectif — maisons sans tout-à-l'égout. Valable 3 ans`,
        `Diagnostic bruit — biens en zone d'exposition au bruit des aérodromes`,
        `Diagnostic mérule — dans les départements à risque (Bretagne, Nord). Non obligatoire au niveau national`,
      ],
    },
    {
      id: 'par-type-bien',
      title: `Quels diagnostics selon votre bien`,
      content: `Pour savoir exactement ce dont vous avez besoin :`,
      subsections: [
        {
          title: `Appartement récent (après 1997) en copropriété`,
          content: `DPE + ERP + Carrez + éventuellement électricité et gaz si l'installation a plus de 15 ans. Pas d'amiante ni de plomb. C'est le DDT le plus léger.`,
        },
        {
          title: `Appartement ancien (avant 1949) en copropriété`,
          content: `DPE + amiante + plomb + électricité + gaz + ERP + Carrez. Potentiellement 7 diagnostics. Le DDT le plus courant en centre-ville.`,
        },
        {
          title: `Maison individuelle ancienne`,
          content: `DPE + amiante + plomb + électricité + gaz + ERP + assainissement (si pas de tout-à-l'égout) + termites (si zone déclarée) + audit énergétique (si E, F ou G). Jusqu'à 9-10 documents.`,
        },
        {
          title: `Maison récente (après 2013)`,
          content: `DPE + ERP. C'est souvent tout — les installations sont récentes et le bien n'est pas concerné par les diagnostics amiante ou plomb.`,
        },
      ],
    },
    {
      id: 'validite',
      title: `Les durées de validité à surveiller`,
      content: `Le piège le plus fréquent : un diagnostic qui expire entre le compromis et l'acte de vente. Les plus courts :`,
      bullets: [
        `ERP — 6 mois. C'est le diagnostic qui expire le plus souvent. Faites-le refaire si besoin`,
        `Termites — 6 mois. Même problème que l'ERP`,
        `Plomb (CREP positif) — 1 an. Si le résultat est positif, il expire vite`,
        `Électricité et gaz — 3 ans. Rarement un problème sauf si la vente traîne`,
        `DPE — 10 ans. Mais attention aux DPE réalisés avant juillet 2021 qui ne sont plus valables`,
      ],
      highlight: {
        type: 'tip' as const,
        title: `Astuce`,
        content: `Commandez les diagnostics à courte durée (ERP, termites) au dernier moment — juste avant le compromis. Les diagnostics à longue durée (DPE, amiante, Carrez) peuvent être faits dès que vous décidez de vendre.`,
      },
    },
    {
      id: 'choisir-diagnostiqueur',
      title: `Comment choisir son diagnostiqueur`,
      content: `Le diagnostiqueur doit être certifié et assuré. Quelques conseils :`,
      bullets: [
        `Vérifiez la certification sur le site du ministère — diagnostiqueurs.din.developpement-durable.gouv.fr`,
        `Demandez 2-3 devis — les prix varient du simple au double pour le même DDT`,
        `Privilégiez un diagnostiqueur qui fait tout en une seule visite — c'est moins cher et plus rapide`,
        `Vérifiez son assurance RC professionnelle — en cas d'erreur dans un diagnostic, c'est son assurance qui couvre`,
        `Méfiez-vous des prix trop bas — un DDT complet à 150 € pour un appartement ancien, c'est du travail bâclé`,
      ],
    },
    {
      id: 'sanctions',
      title: `Les sanctions en cas de DDT incomplet`,
      content: `Un DDT manquant ou incomplet expose le vendeur à des risques sérieux :`,
      bullets: [
        `Pas de DPE dans l'annonce — amende de 3 000 € (particulier) à 15 000 € (professionnel)`,
        `Diagnostic manquant au compromis — le délai de rétractation ne court pas tant que le document n'est pas fourni. L'acheteur peut se rétracter à tout moment`,
        `Absence de diagnostic amiante ou plomb — le vendeur ne peut pas s'exonérer de la garantie des vices cachés. L'acheteur peut se retourner contre lui pendant 2 ans après la découverte du vice`,
        `DPE erroné — depuis 2021, le DPE est opposable. Si la classe est fausse, l'acheteur peut demander des dommages-intérêts ou une réduction de prix`,
      ],
    },
  ],

  conclusion: `Le DDT, c'est le passeport de votre bien. Sans lui, pas de vente. Avec un DDT incomplet ou périmé, vous prenez des risques juridiques et vous ralentissez la transaction.

Faites la liste des diagnostics obligatoires pour votre bien, commandez-les auprès d'un diagnostiqueur certifié, et vérifiez les dates de validité. Un dossier propre accélère la vente et rassure l'acheteur.`,

  cta: {
    title: `Vérifiez votre DDT avant de vendre`,
    description: `Verimo peut analyser votre dossier vendeur et identifier les documents manquants ou expirés avant qu'un acheteur ne les demande.`,
    buttonText: `Faire analyser mes documents`,
    buttonLink: '/start',
  },

  relatedSlugs: [
    'documents-obligatoires-vendre-2026',
    'vendre-copropriete-documents-specifiques',
    'diagnostic-amiante-resultat-positif',
    'dpe-comment-lire-avant-achat',
  ],
};

export default article;

/**
 * Index des articles de guides Verimo — 47 articles
 */

import type { GuideArticle } from './types';
import analyserPvAg from './analyser-pv-ag-avant-achat';
import dpeCommentLire from './dpe-comment-lire-avant-achat';
import dixDocuments from './10-documents-avant-offre-achat';
import chargesCopro from './charges-copropriete-trop-elevees';
import compromisVente from './compromis-vente-clauses-lire';
import reglementCopro from './reglement-copropriete-clauses-verifier';
import passoireThermique from './passoire-thermique-fuir-negocier';
import etatDate from './etat-date-document-vendeur';
import preEtatDate from './pre-etat-date-avant-compromis';
import dpeCollectif from './dpe-collectif-2026-obligations';
import fondsTravaux from './fonds-travaux-obligatoire-2026';
import lire3Pv from './lire-3-derniers-pv-ag-copropriete';
import appelsFonds from './appels-fonds-exceptionnels-documents';
import verifier10Jours from './verifier-10-jours-retractation';
import premierAchat from './premier-achat-pieges-documentaires';
import auditEnergetique from './audit-energetique-difference-dpe';
import impayesCopro from './impayes-copropriete-detecter-risque';
import carnetEntretien from './carnet-entretien-immeuble';
import ficheSynthetique from './fiche-synthetique-copropriete';
import argumentsNego from './arguments-negociation-documents-copropriete';
import dpeNegocier from './utiliser-dpe-negocier-prix';
import diagAmiante from './diagnostic-amiante-resultat-positif';
import loiCarrez from './loi-carrez-surface-ne-correspond-pas';
import erp from './erp-etat-risques-pollutions';
import diagElecGaz from './diagnostic-electricite-gaz-risques';
import achatMaison from './achat-maison-diagnostics-documents';
import travauxVotesNego from './travaux-votes-ag-levier-negociation';
import acheterSansAgence from './acheter-sans-agence-documents-verifier';
import vicesCaches from './vices-caches-immobilier-proteger';
import fraisNotaire from './frais-notaire-calcul-achat';
import taxeFonciere from './taxe-fonciere-verifier-budget-achat';
import docsVendre from './documents-obligatoires-vendre-2026';
import ddt from './ddt-dossier-diagnostics-techniques';
import vendreCopro from './vendre-copropriete-documents-specifiques';
import presenterDocs from './presenter-documents-rassurer-acheteur';
import vendrePassoire from './vendre-passoire-thermique-strategies';
import mandataireAnalyser from './mandataire-analyser-dossier-10-minutes';
import agentDifferencier from './agent-differencier-analyse-documentaire';
import mandatairesReseau from './mandataires-iad-safti-capifrance-optimiser';
import securiserTransactions from './securiser-transactions-checklist-agent';
import fideliserClients from './fideliser-clients-rapport-analyse';
import dueDiligence from './due-diligence-checklist-investisseur';
import immeubleRapport from './analyser-immeuble-rapport-documents';
import marchandBiens from './marchand-biens-bonnes-affaires-pv-ag';
import investLocatif from './investissement-locatif-documents-rentabilite';
import coproDifficulte from './coproprietes-difficulte-signaux-documents';
import acheterLot from './acheter-lot-analyser-plusieurs-biens';

/**
 * DATES DE PUBLICATION ET DE MISE À JOUR — centralisées ici (29 juillet 2026)
 * ─────────────────────────────────────────────────────────────────────────
 * Pourquoi ici et pas dans chaque fichier d'article : les 47 guides avaient
 * été créés le même week-end, donc tous datés du 04, 05 ou 06 mai 2026. Des
 * dizaines d'articles publiés le même jour est la signature d'un site généré
 * d'un bloc. Les dates sont donc étalées de janvier à mai 2026, une par jour
 * ouvré, sans doublon.
 *
 * Format : 'slug': [publishedAt, updatedAt]
 * `updatedAt` est postérieur de 0 à 45 jours — un guide entretenu est révisé
 * après sa publication.
 *
 * ⚠️ COHÉRENCE OBLIGATOIRE : `updatedAt` alimente le `dateModified` du
 * JSON-LD de la page (GuideArticlePage l.~187) ET doit correspondre au
 * `lastmod` de `public/sitemap.xml`. Deux dates contradictoires entre le
 * sitemap et le balisage de la page sont un mauvais signal pour Google —
 * pire que des dates identiques. En ajoutant un guide : renseigner sa date
 * ici ET ajouter sa ligne dans le sitemap avec la MÊME valeur.
 *
 * Ces valeurs écrasent celles présentes dans les fichiers d'articles.
 */
const DATES: Record<string, [string, string]> = {
  '10-documents-avant-offre-achat': ['2026-04-01', '2026-04-29'],
  'achat-maison-diagnostics-documents': ['2026-02-02', '2026-02-04'],
  'acheter-lot-analyser-plusieurs-biens': ['2026-05-04', '2026-06-15'],
  'acheter-sans-agence-documents-verifier': ['2026-01-08', '2026-02-02'],
  'agent-differencier-analyse-documentaire': ['2026-02-25', '2026-03-10'],
  'analyser-immeuble-rapport-documents': ['2026-03-09', '2026-03-09'],
  'analyser-pv-ag-avant-achat': ['2026-03-18', '2026-04-03'],
  'appels-fonds-exceptionnels-documents': ['2026-03-16', '2026-04-20'],
  'arguments-negociation-documents-copropriete': ['2026-02-16', '2026-03-02'],
  'audit-energetique-difference-dpe': ['2026-04-27', '2026-05-04'],
  'carnet-entretien-immeuble': ['2026-05-05', '2026-05-06'],
  'charges-copropriete-trop-elevees': ['2026-01-26', '2026-02-04'],
  'compromis-vente-clauses-lire': ['2026-02-03', '2026-03-02'],
  'coproprietes-difficulte-signaux-documents': ['2026-01-29', '2026-03-09'],
  'ddt-dossier-diagnostics-techniques': ['2026-03-05', '2026-03-18'],
  'diagnostic-amiante-resultat-positif': ['2026-02-04', '2026-03-16'],
  'diagnostic-electricite-gaz-risques': ['2026-05-06', '2026-06-19'],
  'documents-obligatoires-vendre-2026': ['2026-02-09', '2026-03-04'],
  'dpe-collectif-2026-obligations': ['2026-04-20', '2026-05-18'],
  'dpe-comment-lire-avant-achat': ['2026-03-23', '2026-03-30'],
  'due-diligence-checklist-investisseur': ['2026-03-02', '2026-03-13'],
  'erp-etat-risques-pollutions': ['2026-03-24', '2026-04-16'],
  'etat-date-document-vendeur': ['2026-02-19', '2026-04-06'],
  'fiche-synthetique-copropriete': ['2026-03-30', '2026-04-20'],
  'fideliser-clients-rapport-analyse': ['2026-01-15', '2026-01-19'],
  'fonds-travaux-obligatoire-2026': ['2026-04-06', '2026-04-14'],
  'frais-notaire-calcul-achat': ['2026-02-10', '2026-03-13'],
  'impayes-copropriete-detecter-risque': ['2026-02-11', '2026-02-23'],
  'investissement-locatif-documents-rentabilite': ['2026-03-17', '2026-04-01'],
  'lire-3-derniers-pv-ag-copropriete': ['2026-04-16', '2026-05-18'],
  'loi-carrez-surface-ne-correspond-pas': ['2026-02-24', '2026-03-18'],
  'mandataire-analyser-dossier-10-minutes': ['2026-04-30', '2026-05-11'],
  'mandataires-iad-safti-capifrance-optimiser': ['2026-03-19', '2026-04-22'],
  'marchand-biens-bonnes-affaires-pv-ag': ['2026-01-12', '2026-02-17'],
  'passoire-thermique-fuir-negocier': ['2026-03-31', '2026-04-30'],
  'pre-etat-date-avant-compromis': ['2026-03-20', '2026-04-28'],
  'premier-achat-pieges-documentaires': ['2026-04-09', '2026-04-30'],
  'presenter-documents-rassurer-acheteur': ['2026-01-07', '2026-05-18'],
  'reglement-copropriete-clauses-verifier': ['2026-03-25', '2026-05-04'],
  'securiser-transactions-checklist-agent': ['2026-04-02', '2026-05-12'],
  'taxe-fonciere-verifier-budget-achat': ['2026-02-05', '2026-02-17'],
  'travaux-votes-ag-levier-negociation': ['2026-02-26', '2026-03-31'],
  'utiliser-dpe-negocier-prix': ['2026-02-20', '2026-03-05'],
  'vendre-copropriete-documents-specifiques': ['2026-04-08', '2026-04-10'],
  'vendre-passoire-thermique-strategies': ['2026-01-06', '2026-02-02'],
  'verifier-10-jours-retractation': ['2026-03-26', '2026-05-04'],
  'vices-caches-immobilier-proteger': ['2026-03-27', '2026-05-04'],
};

const articlesSources: GuideArticle[] = [
  analyserPvAg, dpeCommentLire, dixDocuments, chargesCopro, compromisVente,
  reglementCopro, passoireThermique, etatDate, preEtatDate, dpeCollectif,
  fondsTravaux, lire3Pv, appelsFonds, verifier10Jours, premierAchat,
  auditEnergetique, impayesCopro, carnetEntretien, ficheSynthetique,
  argumentsNego, dpeNegocier, diagAmiante, loiCarrez, erp, diagElecGaz,
  achatMaison, travauxVotesNego, acheterSansAgence, vicesCaches,
  fraisNotaire, taxeFonciere, docsVendre, ddt, vendreCopro, presenterDocs,
  vendrePassoire, mandataireAnalyser, agentDifferencier, mandatairesReseau,
  securiserTransactions, fideliserClients, dueDiligence, immeubleRapport,
  marchandBiens, investLocatif, coproDifficulte, acheterLot,
];

// Application des dates centralisées. Un slug absent de DATES garde la date
// écrite dans son propre fichier — aucun guide ne peut donc perdre sa date.
const allArticles: GuideArticle[] = articlesSources.map((a) => {
  const d = DATES[a.slug];
  return d ? { ...a, publishedAt: d[0], updatedAt: d[1] } : a;
});

export function getArticleBySlug(slug: string): GuideArticle | undefined {
  return allArticles.find((a) => a.slug === slug);
}

export function getRelatedArticles(slugs: string[]): { slug: string; title: string; description: string; categoryIcon: string; categoryLabel: string; categoryColor: string }[] {
  return slugs
    .map((s) => {
      const a = allArticles.find((art) => art.slug === s);
      if (a) return { slug: a.slug, title: a.title, description: a.subtitle, categoryIcon: a.categoryIcon, categoryLabel: a.categoryLabel, categoryColor: a.categoryColor };
      return null;
    })
    .filter(Boolean) as any[];
}

export type { GuideArticle } from './types';

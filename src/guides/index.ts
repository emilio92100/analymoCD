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

const allArticles: GuideArticle[] = [
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

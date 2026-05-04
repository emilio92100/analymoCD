/**
 * Index des articles de guides Verimo
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

const allArticles: GuideArticle[] = [
  analyserPvAg,
  dpeCommentLire,
  dixDocuments,
  chargesCopro,
  compromisVente,
  reglementCopro,
  passoireThermique,
  etatDate,
  preEtatDate,
  dpeCollectif,
  fondsTravaux,
  lire3Pv,
  appelsFonds,
  verifier10Jours,
  premierAchat,
  auditEnergetique,
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

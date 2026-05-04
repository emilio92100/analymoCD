/**
 * Index des articles de guides Verimo
 * Importer ici chaque article individuellement
 */

import type { GuideArticle } from './types';
import analyserPvAg from './analyser-pv-ag-avant-achat';
import dpeCommentLire from './dpe-comment-lire-avant-achat';
import dixDocuments from './10-documents-avant-offre-achat';
import chargesCopro from './charges-copropriete-trop-elevees';
import compromisVente from './compromis-vente-clauses-lire';

const allArticles: GuideArticle[] = [
  analyserPvAg,
  dpeCommentLire,
  dixDocuments,
  chargesCopro,
  compromisVente,
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

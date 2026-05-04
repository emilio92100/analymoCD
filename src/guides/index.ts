/**
 * Index des articles de guides Verimo
 * Importer ici chaque article individuellement
 */

import type { GuideArticle } from './types';
import analyserPvAg from './analyser-pv-ag-avant-achat';

// Ajouter chaque article ici au fur et à mesure
const allArticles: GuideArticle[] = [
  analyserPvAg,
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

/**
 * Types pour les articles de guides Verimo
 */

export interface GuideDocInfo {
  emoji: string;
  label: string;
  definition: string;
}

export interface GuideHighlight {
  type: 'warning' | 'tip' | 'info';
  title: string;
  content: string;
}

export interface GuideSubsection {
  title: string;
  content: string;
}

export interface GuideSection {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
  numberedList?: string[];
  subsections?: GuideSubsection[];
  highlight?: GuideHighlight;
}

export interface GuideCTA {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

export interface GuideSEO {
  title: string;
  description: string;
}

export interface GuideArticle {
  slug: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  tag?: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  seo: GuideSEO;
  title: string;
  subtitle: string;
  docInfo?: GuideDocInfo;
  intro: string;
  sections: GuideSection[];
  conclusion: string;
  cta: GuideCTA;
  relatedSlugs: string[];
}

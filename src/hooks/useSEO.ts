import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description: string;
  canonical?: string;
}

const DEFAULT_TITLE = 'Verimo — Vos documents décryptés, votre décision éclairée';
const DEFAULT_DESCRIPTION =
  'Verimo décrypte vos documents immobiliers en quelques secondes. Vos documents décryptés, votre décision éclairée.';
const BASE_URL = 'https://www.verimo.fr';

/**
 * Updates the document title, meta description, and canonical URL for SEO.
 * Restores defaults on unmount so navigation between pages stays clean.
 */
export function useSEO({ title, description, canonical }: SEOOptions) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    // Canonical
    const canonicalUrl = canonical
      ? canonical.startsWith('http')
        ? canonical
        : `${BASE_URL}${canonical}`
      : `${BASE_URL}${window.location.pathname}`;

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;

    // Open Graph (helps social shares + some search engines)
    const setMetaProperty = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMetaProperty('og:title', title);
    setMetaProperty('og:description', description);
    setMetaProperty('og:url', canonicalUrl);
    setMetaProperty('og:type', 'website');
    setMetaProperty('og:site_name', 'Verimo');

    // Twitter card
    const setMetaName = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:title', title);
    setMetaName('twitter:description', description);

    return () => {
      document.title = DEFAULT_TITLE;
      if (meta) meta.content = DEFAULT_DESCRIPTION;
    };
  }, [title, description, canonical]);
}

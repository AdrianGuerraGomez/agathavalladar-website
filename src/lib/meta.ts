import { useEffect } from 'react';
import { SITE, absoluteUrl } from './site';

export interface PageMeta {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: Record<string, unknown> | null;
}

function setMeta(attr: 'name' | 'property', key: string, value: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (value === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Metadatos por página en el cliente. Los rastreadores sociales reciben además
 * los metadatos de cada artículo inyectados en servidor (api/articulo.ts).
 */
export function usePageMeta(meta: PageMeta) {
  const key = JSON.stringify(meta);
  useEffect(() => {
    const title = meta.title ? `${meta.title} — ${SITE.name}` : SITE.defaultTitle;
    const description = meta.description || SITE.defaultDescription;
    const url = absoluteUrl(meta.path ?? window.location.pathname);
    const image = absoluteUrl(meta.image || SITE.defaultOgImage);

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', meta.noindex ? 'noindex, nofollow' : null);
    setLink('canonical', url);
    setMeta('property', 'og:title', meta.title ?? SITE.defaultTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', meta.type ?? 'website');
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('property', 'article:published_time', meta.publishedTime ?? null);
    setMeta('property', 'article:modified_time', meta.modifiedTime ?? null);

    const id = 'page-jsonld';
    document.getElementById(id)?.remove();
    if (meta.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.textContent = JSON.stringify(meta.jsonLd);
      document.head.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/**
 * GET /publicaciones/:slug  (reescrito a /api/articulo?slug=…)
 *
 * Devuelve el index.html de la SPA con los metadatos del artículo ya
 * inyectados (título, descripción, Open Graph, Twitter Card, canónica y
 * JSON-LD). Así LinkedIn, X o WhatsApp muestran la tarjeta correcta aunque
 * no ejecuten JavaScript. El navegador recibe la SPA de siempre.
 */
import { escapeHtml, getEnv, imagePublicUrl, socialImagePath, supabaseSelect } from './_shared';

export const config = { runtime: 'edge' };

interface Row {
  slug: string;
  title: string;
  excerpt: string;
  seo_title: string | null;
  seo_description: string | null;
  cover_image: { path: string; alt?: string; width?: number; height?: number } | null;
  published_at: string;
  updated_at: string;
  category: { name: string } | null;
}

const SITE_NAME = 'Agatha Valladar';

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const slug = (url.searchParams.get('slug') ?? '').toLowerCase();
  const { siteUrl: envSite } = getEnv();
  const siteUrl = envSite || url.origin;

  const shellRes = await fetch(new URL('/index.html', url.origin));
  let html = await shellRes.text();

  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    const now = new Date().toISOString();
    const rows = await supabaseSelect<Row[]>(
      `articles?select=slug,title,excerpt,seo_title,seo_description,cover_image,published_at,updated_at,category:categories(name)` +
        `&slug=eq.${encodeURIComponent(slug)}&status=eq.published&published_at=lte.${encodeURIComponent(now)}&limit=1`,
    );
    const a = rows?.[0];

    if (a) {
      const title = a.seo_title || a.title;
      const description = (a.seo_description || a.excerpt).slice(0, 300);
      const canonical = `${siteUrl}/publicaciones/${a.slug}`;
      const socialPath = socialImagePath(a.cover_image?.path);
      const image = imagePublicUrl(socialPath, siteUrl) ?? `${siteUrl}/og-default.png`;
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.title,
        description,
        image: [image],
        datePublished: a.published_at,
        dateModified: a.updated_at,
        inLanguage: 'es',
        articleSection: a.category?.name,
        author: { '@type': 'Person', name: SITE_NAME, url: `${siteUrl}/sobre-mi` },
        publisher: { '@type': 'Person', name: SITE_NAME },
        mainEntityOfPage: canonical,
      };
      const e = escapeHtml;
      const meta = [
        `<link rel="canonical" href="${e(canonical)}" />`,
        `<meta property="og:site_name" content="${SITE_NAME}" />`,
        `<meta property="og:locale" content="es_ES" />`,
        `<meta property="og:type" content="article" />`,
        `<meta property="og:title" content="${e(title)}" />`,
        `<meta property="og:description" content="${e(description)}" />`,
        `<meta property="og:url" content="${e(canonical)}" />`,
        `<meta property="og:image" content="${e(image)}" />`,
        a.cover_image?.alt ? `<meta property="og:image:alt" content="${e(a.cover_image.alt)}" />` : '',
        socialPath && a.cover_image?.width ? `<meta property="og:image:width" content="${a.cover_image.width}" />` : '',
        socialPath && a.cover_image?.height ? `<meta property="og:image:height" content="${a.cover_image.height}" />` : '',
        `<meta property="article:published_time" content="${e(a.published_at)}" />`,
        `<meta property="article:modified_time" content="${e(a.updated_at)}" />`,
        `<meta property="article:author" content="${SITE_NAME}" />`,
        a.category ? `<meta property="article:section" content="${e(a.category.name)}" />` : '',
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${e(title)}" />`,
        `<meta name="twitter:description" content="${e(description)}" />`,
        `<meta name="twitter:image" content="${e(image)}" />`,
        `<script type="application/ld+json" id="page-jsonld">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
      ]
        .filter(Boolean)
        .join('\n    ');

      html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${e(title)} — ${SITE_NAME}</title>`)
        .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${e(description)}" />`)
        .replace(/<!--app-meta-->[\s\S]*?<!--\/app-meta-->/, meta);

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
        },
      });
    }
  }

  // Artículo inexistente o no publicado: la SPA muestra su página 404.
  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=60' },
  });
}

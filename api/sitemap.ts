/** GET /sitemap.xml — páginas estáticas, categorías y artículos publicados. */
import { escapeHtml, getEnv, supabaseSelect } from './_shared';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const { siteUrl: envSite } = getEnv();
  const siteUrl = envSite || new URL(request.url).origin;
  const now = new Date().toISOString();

  const [articles, categories] = await Promise.all([
    supabaseSelect<{ slug: string; updated_at: string }[]>(
      `articles?select=slug,updated_at&status=eq.published&published_at=lte.${encodeURIComponent(now)}&order=published_at.desc&limit=5000`,
    ),
    supabaseSelect<{ slug: string }[]>('categories?select=slug'),
  ]);

  const latest = articles?.[0]?.updated_at ?? now;
  const urls = [
    { loc: '/', lastmod: latest, priority: '1.0' },
    { loc: '/publicaciones', lastmod: latest, priority: '0.9' },
    { loc: '/sobre-mi', priority: '0.7' },
    ...(categories ?? []).map((c) => ({ loc: `/publicaciones?categoria=${c.slug}`, priority: '0.5' })),
    ...(articles ?? []).map((a) => ({ loc: `/publicaciones/${a.slug}`, lastmod: a.updated_at, priority: '0.8' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escapeHtml(siteUrl + u.loc)}</loc>${'lastmod' in u && u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

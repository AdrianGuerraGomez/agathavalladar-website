/** GET /robots.txt — usa la URL del sitio configurada. */
import { getEnv } from './_shared';

export const config = { runtime: 'edge' };

export default function handler(request: Request): Response {
  const { siteUrl: envSite } = getEnv();
  const siteUrl = envSite || new URL(request.url).origin;
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=86400' },
  });
}

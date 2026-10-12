import type { APIRoute } from 'astro';

export const prerender = true;

// /admin also sends X-Robots-Tag: noindex (src/middleware.ts); this keeps crawlers off it entirely.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nDisallow: /admin\n\nSitemap: ${new URL('/sitemap.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

import type { APIRoute } from 'astro';

export const prerender = true;

// Every public page; each EN route has an ES twin under /es.
const paths = ['/', '/projects'];
const langs = [['en', ''], ['es', '/es']] as const;

export const GET: APIRoute = ({ site }) => {
  const url = (prefix: string, path: string) => new URL(prefix + path, site).href;
  const entries = paths.flatMap((path) =>
    langs.map(([, prefix]) => {
      const alts = langs
        .map(([l, pre]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${url(pre, path)}"/>`)
        .join('');
      return `<url><loc>${url(prefix, path)}</loc>${alts}<xhtml:link rel="alternate" hreflang="x-default" href="${url('', path)}"/></url>`;
    }),
  );
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};

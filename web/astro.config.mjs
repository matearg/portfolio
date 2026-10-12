import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4321 },
  // Behind Railway's TLS proxy: trust its Host/X-Forwarded-Proto, else request URLs fall back to
  // http://localhost and checkOrigin rejects every admin form POST. Read at build time.
  security: {
    allowedDomains: process.env.RAILWAY_PUBLIC_DOMAIN
      ? [{ hostname: process.env.RAILWAY_PUBLIC_DOMAIN, protocol: 'https' }]
      : [],
  },
  // lightningcss folds animation-timeline into the shorthand, which older browsers drop.
  vite: { build: { cssMinify: 'esbuild' } },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: { prefixDefaultLocale: false },
  },
});

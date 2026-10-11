# Handoff

## State (branch `Feat/project-setup`, commit `021fda3`)
Phase 1 is done: public site + read-only API.
- `api/`: NestJS 12 + Prisma 7.10 (pg adapter). `GET /projects` returns published projects ordered by `order`. Schema, migration and seed in `api/prisma/`.
- `web/`: Astro 7 SSR (Node adapter). `/` and `/projects` in EN, `/es/` and `/es/projects` in ES. Hero canvas, filter chips, reveal animations ported from `design/`.
- Local DB: `docker compose up -d` (Postgres 18 on :5432). Run steps are in `README.md`.

## Gotchas
- `prisma generate` must run before the API builds (the client is generated into `api/src/generated`, which is gitignored). `pnpm build` in `api/` does it.
- Astro's CSS minifier is set to esbuild in `web/astro.config.mjs`; the default one breaks the scroll progress bar.
- If the API is down, the pages render the empty state instead of erroring.

## Next steps
1. **Push**: add a remote (none is configured yet) and open a PR into `main`.
2. **Content**: replace the placeholder project text and `[Year]`/experience entries; real projects go through the admin once it exists.
3. **Phase 2 — admin**: `/admin` page (noindex) from `design/Admin.dc.html`; auth guard on every write endpoint (session cookie or JWT); `POST/PATCH/DELETE /projects` with DTO validation (`ValidationPipe`); a `year` input in the form; cover-image upload and storage; return drafts to admins only.
4. **Polish**: real `og:image`/favicon, sitemap, accent color option if wanted, e2e test against a test database.
5. **Deploy**: Node server for `web/`, `api/`, managed Postgres; set `API_URL` for the web app and `DATABASE_URL` for the API; run `prisma migrate deploy`.

# AGENTS.md

This file provides guidance to agents when working with code in this repository.

Personal portfolio, pnpm workspace with two packages: `web/` (Astro 7 SSR, Node adapter) and `api/` (NestJS 12 + Prisma 7 on PostgreSQL). The roadmap lives in GitHub issues (`gh issue list`); check it before starting feature work.

## Commands

Root (runs across both packages): `pnpm dev` (api :3000, web :4321), `pnpm build`, `pnpm test`.

First-time setup:
```bash
docker compose up -d                                  # Postgres 18 on :5432 (dev only)
cp api/.env.example api/.env; cp web/.env.example web/.env
pnpm install
cd api && pnpm exec prisma generate && pnpm exec prisma migrate dev && pnpm exec prisma db seed
```

In `api/`:
- `pnpm test` — Vitest (globals on, `*.spec.ts`). Single file: `pnpm exec vitest run src/projects/projects.service.spec.ts`; single test: add `-t "<name>"`.
- `pnpm lint` — oxlint (type-aware). `pnpm format` — prettier.
- `pnpm build` — runs `prisma generate` then `nest build`.
- Schema change: edit `prisma/schema.prisma`, then `pnpm exec prisma migrate dev --name <name>`.

In `web/`: `pnpm dev`, `pnpm build`, `pnpm preview`. `web/AGENTS.md` covers Astro specifics (background dev server: `astro dev --background`). There are no web tests.

## Architecture

- **Data flow**: Astro pages render server-side and call the API via `web/src/lib/api.ts` (`API_URL` env). `getProjects()` swallows errors and returns `[]`, so an API outage shows the empty state rather than a 500 — keep that behavior for new public fetchers. `API_URL` is read through `import.meta.env`, so it is baked in at `astro build` time, not read at runtime.
- **Shared shape is duplicated**: the `Project` interface in `web/src/lib/api.ts` is hand-written to match the Prisma model in `api/prisma/schema.prisma`. Update both when the model changes.
- **API**: ESM (`"type": "module"`), so relative imports need the `.js` suffix. `PrismaService` (global `PrismaModule`) extends the generated client with the `@prisma/adapter-pg` driver adapter. The client is generated into `api/src/generated/prisma` (gitignored), so run `prisma generate` before builds/typechecks on a fresh checkout. Prisma config (schema path, migrations, seed via `tsx`) lives in `api/prisma.config.ts`, not in `package.json`. Public endpoint: `GET /projects` (published only, ordered by `order`, then `id`). Admin endpoints live in `AdminProjectsController` (`admin/projects`), guarded at class level by `AdminGuard` (JWT from `POST /auth/login`, single admin from env); put new admin routes there so they inherit the guard. Global `ValidationPipe` (whitelist, forbidNonWhitelisted). Cover images go to Cloudinary via `CloudinaryService` (plain `fetch`, no SDK); `CLOUDINARY_URL` is only needed for uploads, the rest of the admin works without it. Login lockout (5 failures / 15 min) is in memory and global, since every login reaches the API from the Astro server; a restart clears it.
- **Admin web**: `/admin` pages are SSR forms posting to themselves; Astro calls the API server-side via `adminFetch` (throws `ApiError`) with the token from the httpOnly `admin` cookie. `src/middleware.ts` sets `X-Robots-Tag` and redirects to login on a missing cookie or an API 401. EN only, own light theme in `layouts/Admin.astro`. CSRF protection is Astro's default `security.checkOrigin` plus the SameSite=strict cookie: don't turn `checkOrigin` off.
- **i18n**: EN at `/`, ES at `/es/` (Astro i18n, default locale unprefixed). Each route has a thin page file per locale (`src/pages/projects.astro`, `src/pages/es/projects.astro`) that renders a shared component with a `lang` prop. All UI strings live in `web/src/i18n.ts` (`copy.en` / `copy.es`); project summaries come from the DB as `summaryEn` / `summaryEs`.
- **Styling**: plain CSS in `web/src/styles/global.css` plus inline styles ported from the design. Design tokens (colors, fonts) are listed in `README.md`.
- **CSS minifier is deliberately `esbuild`** in `web/astro.config.mjs`: lightningcss folds `animation-timeline` into the shorthand and breaks the scroll progress bar. Don't switch it back.

## Design source

`design/*.dc.html` are canvas exports (gitignored, local only) used as read-only reference, not runnable pages. `README.md` maps each file to the page it becomes. The admin page (`/admin`, from `Admin.dc.html`) must be served `noindex`, and every admin/write endpoint must be protected in the API, not only the page.

# Portfolio — Mateo Arcidiacono

Personal portfolio: a landing page (3D hero, scroll animations, a background that reacts to the mouse), a projects page, and a private admin panel for managing projects.

## Stack

| Part | Tech | Folder |
|---|---|---|
| Frontend | Astro | `web/` |
| Backend | NestJS | `api/` |
| Database | PostgreSQL + Prisma | `api/prisma/` |

## Layout

```
design/   design source (read-only reference)
web/      Astro app (SSR, Node adapter; EN at /, ES at /es/)
api/      NestJS app; Prisma schema and seed in api/prisma/
```

## Run locally

```bash
docker compose up -d                       # Postgres on :5432
cp api/.env.example api/.env; cp web/.env.example web/.env
pnpm install
cd api && pnpm exec prisma generate && pnpm exec prisma migrate dev && pnpm exec prisma db seed && cd ..
pnpm dev                                   # api :3000, web :4321
```

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET` and `CLOUDINARY_URL` in `api/.env` (see `api/.env.example`), then sign in at http://localhost:4321/admin.

The landing's GitHub activity section needs `GITHUB_TOKEN` in `api/.env` (a fine-grained token with public read-only access); without it the section is hidden.

The API exposes `GET /projects` (published only, ordered), `POST /auth/login`, and the JWT-guarded `admin/projects` routes (CRUD plus `POST admin/projects/cover`, which uploads to Cloudinary).

## Design

Live canvas: https://claude.ai/artifact/AJjY9EQonToaHd8NPkWfXq (private).

The files in `design/` are canvas source, not runnable pages. Each one is HTML with inline styles plus a `Component` class whose `copy()` holds the EN/ES text.

| File | Becomes |
|---|---|
| `Main.dc.html` | Landing page. `icosphere`, `drawSphere` and `drawField` are the hero sphere and the dot background, ready to move into an Astro `<script>`. The `<style>` block holds the scroll animations, written in plain CSS. |
| `Mobile.dc.html` | The landing page at 390px wide. Use it only to check the mobile layout; it doesn't become a page. |
| `Projects.dc.html` | `/projects`, with filter chips by technology. |
| `Admin.dc.html` | `/admin`: sign-in, projects table, create/edit form. Nothing public links to it. Serve it with `noindex`, and protect every admin endpoint in the API, not only the page. |

**Design tokens**

| Role | Value |
|---|---|
| Background | `#0a0a0b` |
| Text | `#ededee` |
| Muted text | `#8f8f98` |
| Border | `#232327` |
| Accent | `#c6ff3d` |
| Fonts | Geist (body and display), JetBrains Mono (labels) |

The `Project` model's fields come from the admin form: `title`, `slug` (unique), `summaryEn`, `summaryEs`, `tags`, `repoUrl`, `liveUrl`, `imageUrl`, `featured`, `order`, `published`, `updatedAt`.

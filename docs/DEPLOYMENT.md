# Deployment

## Providers

| Concern | Provider | Notes |
| --- | --- | --- |
| Hosting | Vercel, existing project `booksncafe` (`booksncafe.vercel.app`) | `vercel.json` sets the framework to Next.js and the build command to `npm run vercel-build`, overriding the project's old Vite settings (`npm run build:prod`, framework `vite`). |
| Database | Neon Postgres via the Vercel Marketplace | Free plan as of 2026-10-19: 1 GB storage per project, 100 CU-hours per month, scale-to-zero after 5 min, 10 branches, 6-hour restore window, 5 GB egress per month. |
| Images | Remote URLs on allow-listed hosts (`images.unsplash.com` plus `NEXT_PUBLIC_IMAGE_HOSTS`) or files in `public/` | Optimized by `next/image`. Vercel Hobby includes a monthly image-optimization quota; check usage if traffic grows. |

## Environment variables

See [`.env.example`](../.env.example). All are set per environment in Vercel → Project → Settings → Environment Variables.

| Variable | Production | Preview | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Set by the Neon integration (pooled) | Set per preview branch by the integration | Server-only. Never prefix with `NEXT_PUBLIC_`. |
| `DATABASE_URL_UNPOOLED` | Set by the integration | Set by the integration | Used by migration scripts. |
| `NEXT_PUBLIC_SITE_URL` | `https://<your domain>` | Leave unset (falls back to the production hostname so canonicals never point at previews) | Rebuild after changing. |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Optional | Optional | Comma-separated extra image hosts. |
| `SESSION_TTL_HOURS` | Optional (default 12) | Optional | |
| `RUN_MIGRATIONS_ON_BUILD` | **Leave unset** | `1` | Previews migrate and seed their own disposable Neon branch. The build refuses to migrate production. |

## First-time setup

1. Vercel → `booksncafe` → Storage → **Create Database** → Neon (Free). Connect it to Production, Preview and Development, and enable **Create database branch for deployment** for Preview.
2. Set `NEXT_PUBLIC_SITE_URL` for Production and `RUN_MIGRATIONS_ON_BUILD=1` for Preview.
3. Pull production variables locally (`vercel env pull .env.production.local`), then follow the production procedure in [DATA_MIGRATION.md](DATA_MIGRATION.md): migrate, seed, create the owner account, verify.
4. Merge the PR. Vercel builds with the migrated production database and deploys.
5. Smoke test: `/`, `/books`, `/books/1984`, `/menu`, `/events`, `/about`, `/sitemap.xml`, `/robots.txt`, a missing URL (should be 404), `/admin/login`.
6. Submit `https://<domain>/sitemap.xml` in Google Search Console.

## Ongoing schema changes

1. Edit `src/server/db/schema.ts`, run `npm run db:generate`, commit the new SQL file.
2. The PR's preview deployment applies it to its own Neon branch.
3. Before merging: `npm run db:backup` against production, then `npm run db:migrate`, then merge. Migrations must stay backward-compatible with the running deployment (add columns before using them; remove columns in a later release).

## How edits reach the public site

Public pages are statically generated with a 5-minute ISR window. Every successful admin save calls `revalidatePath("/", "layout")`, so the next request after an edit regenerates the affected pages. The 5-minute window is only a safety net for time-based changes, such as an announcement's start time or an event moving from upcoming to past.

## Security checklist

- [x] Secrets are only in Vercel environment variables. `.env*` is git-ignored except `.env.example`.
- [x] Database code is imported only by `server-only` modules, so the build fails if it is pulled into a client bundle.
- [x] Admin accounts are created only with `npm run admin:create`. There is no sign-up route, and the dashboard cannot change roles.
- [x] Passwords are hashed with scrypt (N=2¹⁵, r=8, p=1, 16-byte salt), and timing is uniform for unknown accounts.
- [x] Sessions are 256-bit random tokens stored as SHA-256 hashes, in an HttpOnly, Secure, SameSite=Lax `__Host-` cookie that expires after 12 hours. Logout deletes the session row.
- [x] Every admin page and Server Action checks the session and role on the server. Layouts are not relied on for security.
- [x] Server Actions use Next.js' Origin/Host CSRF check, plus SameSite cookies.
- [x] Login is rate-limited (5 per email and 20 per IP per 15 minutes), as are coupon checks (20 per IP per 10 minutes) and newsletter sign-ups (5 per IP per hour), all in Postgres.
- [x] All admin input is validated with Zod on the server. Image and link fields reject `javascript:`, `data:` and protocol-relative URLs, and image hosts are allow-listed.
- [x] Cart prices and coupons are computed on the server. The browser sends only item ids and quantities.
- [x] Security headers: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` and HSTS. `/admin` responses carry `X-Robots-Tag: noindex` and `Cache-Control: no-store`.
- [x] Errors shown to users are generic, and details are logged server-side only.
- [x] The subscriber CSV export neutralizes spreadsheet formula injection.
- [ ] **Owner action:** turn on Vercel Deployment Protection for Preview deployments if previews should not be public.

The CSP allows `'unsafe-inline'` for scripts because statically generated Next.js pages inline their bootstrap data. Removing it requires nonce-based dynamic rendering for every page, which would give up ISR caching. Every other directive is restrictive.

## Rollback

Vercel → Deployments → choose the last good production deployment → **Instant Rollback**. For data, see [DATA_MIGRATION.md](DATA_MIGRATION.md#rollback).

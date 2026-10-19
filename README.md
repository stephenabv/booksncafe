# Books ’n Cafe

Website and admin dashboard for Books ’n Cafe: a server-rendered Next.js site backed by PostgreSQL.

- **Public site:** home, books (with `/books/<slug>` detail pages), cafe menu, events, about, cart.
- **Admin (sign in at `/syscon/login/admin`, dashboard at `/syscon/admin`):** business details, opening and holiday hours, page copy and SEO, announcements, FAQs, team, navigation, social links, books, menu, events, coupons and newsletter subscribers.

| Stack | |
| --- | --- |
| Framework | Next.js 16 App Router (Server Components, ISR, Server Actions), React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4, self-hosted Inter and Fraunces via `next/font` |
| Data | PostgreSQL (Neon in production) with Drizzle ORM and versioned SQL migrations |
| Validation | Zod, on the server for every write |
| Tests | Vitest (unit and integration), Playwright (end-to-end) |
| Hosting | Vercel |

## Local development

Requirements: Node 20.9+ (22 recommended) and PostgreSQL 14+.

```bash
npm ci
cp .env.example .env.local        # then point DATABASE_URL at your local database
npm run db:migrate                # create tables
npm run db:seed                   # import the original site content
npm run admin:create -- --email you@example.com --role admin --name "Your Name"
npm run dev                       # http://localhost:3000, admin sign-in at /syscon/login/admin
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js development, production build, production server |
| `npm run lint` / `typecheck` | ESLint (zero warnings), TypeScript |
| `npm run test:unit` | Pure logic: pricing, hours, time zones, validation, hashing, structured data |
| `npm run test:integration` | Against `TEST_DATABASE_URL` (default `postgres://postgres:postgres@localhost:5432/booksncafe_test`; the name must contain "test") |
| `npm run test:e2e` | Builds and serves the app against `E2E_DATABASE_URL` (default `…/booksncafe_e2e`, rebuilt every run). Set `PLAYWRIGHT_CHROMIUM_PATH` to use a preinstalled Chromium. |
| `npm run db:migrate` / `db:seed` / `db:verify` / `db:backup` / `db:generate` | See [docs/DATABASE.md](docs/DATABASE.md) |
| `npm run admin:create` | Create an admin, or reset an admin's password or role |
| `npm run admin:bootstrap` | Create the first admin from `ADMIN_BOOTSTRAP_*` if no active admin exists (used by the Vercel build) |

## Project layout

```
src/
  app/(site)/        public pages (Server Components, ISR)
  app/syscon/        admin sign-in (login/admin) and dashboard (admin), dynamic, role-checked
  app/sitemap.ts     robots.ts, icons
  components/site    public UI     components/admin  dashboard UI
  lib/               framework-free helpers: pricing, hours, time zones, validation, structured data
  server/            server-only code: db, auth, repositories, admin registry, Server Actions
drizzle/             versioned SQL migrations
scripts/             migrate, seed, verify, backup, create-admin, vercel-build
tests/               unit, integration, e2e
docs/                audit, database, data migration, deployment, owner confirmations, report
```

## Documentation

- [Audit and architecture decision](docs/AUDIT.md)
- [Database schema](docs/DATABASE.md)
- [Data migration, verification and rollback](docs/DATA_MIGRATION.md)
- [Deployment, environment and security](docs/DEPLOYMENT.md)
- [Information needed from the owner](docs/OWNER_CONFIRMATIONS.md)
- [Implementation report and measurements](docs/IMPLEMENTATION_REPORT.md)

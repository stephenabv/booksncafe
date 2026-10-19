# Database

PostgreSQL 16 (Neon in production). Schema source of truth: [`src/server/db/schema.ts`](../src/server/db/schema.ts). Versioned SQL migrations live in [`drizzle/`](../drizzle) and are generated with `npm run db:generate` after editing the schema; never edit an applied migration.

## Responsibilities

| Data | Where it lives |
| --- | --- |
| Business details, hours, page copy and SEO, navigation, catalog, events, announcements, FAQs, team, coupons, newsletter sign-ups | Postgres |
| Admin accounts, sessions, rate-limit buckets, audit log | Postgres |
| Images | Remote URLs (allow-listed hosts) or files committed under `public/`. No upload storage yet. |
| Secrets (`DATABASE_URL`, etc.) | Vercel environment variables, never in the repository |

## Tables

| Table | Purpose | Key constraints |
| --- | --- | --- |
| `site_settings` | Single row (`id = 1`): name, tagline, contact, address, geo, map link, time zone, currency, default OG image | `check (id = 1)` |
| `opening_hours` | Weekly hours, one row per day (0 = Sunday) | PK `day_of_week`, `check 0..6`, times required unless closed |
| `special_hours` | Holiday/one-off overrides | unique `date`, times required unless closed |
| `nav_links` | Header and footer links | enum `location`, index `(location, sort_order)` |
| `social_links` | Social profiles (footer + `sameAs`) | |
| `pages` | Heading, intro and SEO metadata for fixed routes | PK `slug` |
| `announcements` | Site-wide banner with optional schedule window | `ends_at > starts_at` |
| `books` | Book collection | unique `slug`, `price >= 0`, index `(is_published, sort_order)` |
| `menu_items` | Cafe menu | unique `slug`, `price >= 0` |
| `events` | Events | unique `slug`, `ends_at > starts_at`, index `(is_published, starts_at)` |
| `faqs`, `team_members` | About/FAQ content | |
| `coupons` | Cart discount codes | unique upper-case `code`, `percent_off between 1 and 100` |
| `newsletter_subscribers` | Footer sign-ups | unique `lower(email)` |
| `admin_users` | Administrators | unique `lower(email)`, enum `role` (`admin`, `editor`) |
| `admin_sessions` | Server-side sessions, keyed by SHA-256 of the cookie token | FK → `admin_users` on delete cascade |
| `rate_limit_buckets` | Fixed-window counters for login, coupon and newsletter endpoints | |
| `audit_log` | Who changed what and when | FK → `admin_users` on delete set null |

Conventions: public content has `is_published` (drafts never reach the site), money is `numeric(10,2)`, timestamps are `timestamptz`, and `created_at`/`updated_at` are maintained automatically.

## Commands

```bash
npm run db:migrate   # apply pending migrations (uses DATABASE_URL_UNPOOLED when set)
npm run db:seed      # idempotent: fills only empty tables with the legacy site content
npm run db:verify    # integrity checks; exits non-zero on failure
npm run db:backup    # JSON snapshot of all content into ./backups (git-ignored)
npm run db:generate  # create a new migration after changing schema.ts
npx drizzle-kit check  # confirm migrations and schema are consistent (run in CI)
```

## Access rules

- Database access happens only on the server (`server-only` modules). No database URL or client is ever bundled for the browser.
- The application connects through Neon's pooled endpoint with prepared statements disabled (PgBouncer transaction mode). Migrations use the direct endpoint.
- All queries go through Drizzle's parameterized builder; the two raw SQL fragments (`lower(email)` lookups and the rate-limit upsert) use bound parameters.

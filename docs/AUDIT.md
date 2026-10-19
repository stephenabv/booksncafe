# Repository audit and architecture decision

Audited on 2026-10-19 at commit `1ef498d` ("Fix build error"), before any changes.

## 1. Current architecture (before)

| Area | Finding |
| --- | --- |
| Framework | React 19 SPA built with Vite 7, React Router 7 (`BrowserRouter`), Tailwind CSS 4, Framer Motion page transitions. |
| Rendering | Client-side only. `index.html` ships an empty `<div id="root">`; all content is rendered by a 378 KB (121 KB gzip) bundle. |
| Routes | `/`, `/books`, `/menu`, `/events`, `/about`, `/cart`, catch-all 404 (client-rendered, HTTP 200). |
| Data | **Hardcoded in components.** Books, menu items, events and the team list are literal arrays in `src/components/*.tsx`. |
| Firebase | **Not used.** No `firebase` dependency, no config, no SDK calls, no env vars. The Vercel project (`booksncafe`) has zero environment variables. |
| Auth / admin | None. |
| Cart | React context, in-memory only (lost on reload). `removeFromCart(id)` removed every line with that id, across books and menu items. The coupon code `SAVE10` was hardcoded in the client bundle. Checkout was an `alert()`. |
| Newsletter | Form called `alert()`; nothing was stored. |
| Media | One 2.3 MB PNG banner (`src/assets/banner.png`, 1536×1024) used as a 64 px logo. All other images are Unsplash URLs; several menu photo IDs could not be verified. |
| SEO | Static `<title>`/description in `index.html` for every route, empty `canonical`/`og:url`/`og:image`, no `robots.txt`, no sitemap, no structured data. |
| Tests / CI | None. `npm run build` failed type-checking (`tsc -b`), so the live site was built with `vite build` only. ESLint reported 7 errors. |
| Deployment | Vercel project `booksncafe` → `booksncafe.vercel.app`, no SPA rewrite configured. |

## 2. Existing features that must be preserved

- All six public URLs and their content.
- Book catalog with category, availability, price and a details view.
- Cafe menu with prices (₱) and add-to-cart.
- Events with upcoming/ongoing/past status.
- About page copy and team member.
- Cart with VAT-inclusive (12 %) breakdown and the `SAVE10` 10 % coupon.
- Newsletter sign-up form in the footer.
- Brand: name "Books ’n Cafe", the coffee-cup-and-books illustration, dark espresso + amber palette.

## 3. Problems identified

**Technical / SEO**
1. Deep links 404 in production: `GET https://booksncafe.vercel.app/books` returned Vercel `NOT_FOUND` (verified 2026-10-19). Crawlers and shared links could only reach the homepage.
2. Empty initial HTML; every route shares one title and description; no canonical, robots or sitemap.
3. A fake 2-second full-screen loader on every first load delayed LCP.
4. 2.3 MB banner image served at 64 px.
5. Unknown routes returned HTTP 200.
6. Build broken under `tsc`; lint failing; no tests.

**User experience / accessibility**
1. Icon-only buttons with no accessible name (cart, mobile menu toggle).
2. `<select>` filters without labels; contrast failures (Lighthouse).
3. Modals without focus management or Escape handling; mobile menu not keyboard-closable.
4. Placeholder content visible to customers: "Sample Book 1–15", "Community Event 1–15", a keyboard-mash event description, and a broken team photo URL.

**Baseline Lighthouse (mobile, local `vite preview`, which also served deep links)**

| Page | Perf | A11y | Best practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 60 | 89 | 96 | 92 | 13.8 s | 520 ms | 0 |
| `/books` | 66 | 85 | 96 | 92 | 13.7 s | 350 ms | 0 |
| `/menu` | 73 | 85 | 96 | 92 | 14.0 s | 80 ms | 0 |
| `/events` | 73 | 85 | 96 | 92 | 13.9 s | 110 ms | 0 |
| `/about` | 74 | 89 | 96 | 92 | 13.5 s | 20 ms | 0 |

## 4. Framework recommendation: Next.js App Router

| Criterion | Vite + SSR | Next.js App Router |
| --- | --- | --- |
| Migration effort | Custom server entry, hydration wiring, data loaders and metadata plumbing to write by hand. | ~1,500 lines of components; React Router maps 1:1 onto the `app/` directory. Low. |
| Coupling to Vite | None of significance (no Vite plugins beyond React and Tailwind). | — |
| SEO features | Hand-rolled head management, sitemap and robots. | Built-in Metadata API, `sitemap.ts`, `robots.ts`, streaming SSR, real 404 status. |
| Content delivery | Needs a custom caching layer. | ISR with on-demand `revalidatePath` after admin edits. |
| Admin writes | Separate API server needed. | Server Actions with built-in Origin checks. |
| Hosting | Needs a Node server or adapter on Vercel. | First-class on Vercel; preview deployments work unchanged. |

**Decision:** migrate to Next.js 16 (App Router, Server Components by default). The application is small and not tied to Vite, so the move is low-risk and directly fixes the deep-link 404s, empty HTML and metadata problems.

## 5. Database recommendation: Neon Postgres via the Vercel Marketplace

Vercel no longer offers a first-party Postgres product; databases are provisioned through Marketplace integrations. Neon's Free plan (checked 2026-10-19 at neon.com/faqs/free-plan-limits-and-quotas): 1 GB storage per project, 100 CU-hours per project per month, autoscaling up to 2 CU, scale-to-zero after 5 minutes (not configurable on Free), 10 branches per project, 6-hour point-in-time restore (capped at 1 GB of history), 5 GB egress per month. The site's data is a few hundred rows, well within limits.

Why Neon: native Vercel integration that injects `DATABASE_URL`/`DATABASE_URL_UNPOOLED`, a PgBouncer pooled endpoint for serverless functions, and automatic database branches for preview deployments. Supabase's free tier was the alternative; it pauses projects after a week of inactivity and bundles auth/storage the site does not need.

**Firebase:** there is nothing to migrate because the application never used Firebase. The "migration" is moving the hardcoded content into Postgres (see [DATA_MIGRATION.md](DATA_MIGRATION.md)). No Firebase services are added.

## 6. Main risks

| Risk | Mitigation |
| --- | --- |
| Builds need a reachable database (pages are prerendered from it). | Neon integration supplies per-environment URLs; CI runs Postgres as a service. |
| Neon scale-to-zero adds a cold-start delay to the first query after idle. | Public pages are ISR-cached, so visitors rarely hit the database directly. |
| Remote Unsplash images (unverified IDs) may 404. | Listed for owner replacement; `next/image` placeholders keep layout stable. |
| Admin accounts are a new attack surface. | CLI-only account creation, scrypt hashes, DB-backed sessions, rate-limited login, server-side role checks on every page and action. |
| Business facts are missing (address, hours, phone). | Sections render only when data exists; structured data stays truthful; see [OWNER_CONFIRMATIONS.md](OWNER_CONFIRMATIONS.md). |

## 7. Implementation sequence (as executed)

1. Baseline measurements and live-site checks.
2. Next.js scaffold, Tailwind 4, design tokens.
3. Drizzle schema, versioned SQL migration, idempotent seed from legacy content, backup and verification scripts.
4. Auth: password hashing, sessions, rate limiting, role guards.
5. Public pages as Server Components with ISR, metadata, sitemap, robots, JSON-LD.
6. Admin dashboard with a resource registry and generic CRUD.
7. Unit, integration and Playwright end-to-end tests; Lighthouse re-measurement; documentation.

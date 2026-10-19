# Implementation report

Branch `claude/booksncafe-modernization-f2lac7`, 2026-10-19.

## Delivered

| # | Deliverable | Where |
| --- | --- | --- |
| 1 | Audit and architecture decision | [AUDIT.md](AUDIT.md) |
| 2 | SSR/ISR architecture (Next.js 16 App Router, Server Components) | `src/app` |
| 3 | Restructured source code | `src/app`, `src/components`, `src/lib`, `src/server` |
| 4 | Schema and versioned migrations | `src/server/db/schema.ts`, `drizzle/`, [DATABASE.md](DATABASE.md) |
| 5 | Data migration and verification | `scripts/seed*.ts`, `scripts/verify.ts`, `scripts/backup.ts`, [DATA_MIGRATION.md](DATA_MIGRATION.md) |
| 6 | Admin authentication and authorization | `src/server/auth`, `scripts/create-admin.ts` |
| 7 | Admin dashboard | `/admin`: business details, opening and holiday hours, pages and SEO, announcements, FAQs, team, navigation, social links, books, menu, events, coupons, newsletter subscribers (with CSV export) |
| 8 | Redesigned public site | `src/app/(site)`, `src/components/site` |
| 9 | Customer-facing content | Existing copy preserved; placeholder content removed; sections hidden until real data exists |
| 10 | SEO | Per-page metadata from the database, canonical URLs, Open Graph/Twitter, `sitemap.xml`, `robots.txt`, JSON-LD (WebSite, Organization or CafeOrCoffeeShop/BookStore, BreadcrumbList, Book with Offer, Event, FAQPage), real 404s, `noindex` on admin, cart and filtered listings |
| 11 | Performance and accessibility | See measurements below |
| 12 | Automated tests | `tests/unit`, `tests/integration`, `tests/e2e`; CI in `.github/workflows/ci.yml` |
| 13 | Environment template | [`.env.example`](../.env.example) |
| 14 | Setup and deployment docs | [README](../README.md), [DEPLOYMENT.md](DEPLOYMENT.md) |
| 15 | This report and owner confirmations | [OWNER_CONFIRMATIONS.md](OWNER_CONFIRMATIONS.md) |

### Preserved functionality and replacements

| Old behaviour | Now |
| --- | --- |
| Six public routes | Same URLs, now server-rendered with real HTTP status codes. `/index.html` redirects to `/`. |
| Book filters: search, category, A–E letter ranges | Search (title/author) and category as a plain GET form that works without JavaScript and is paginated server-side. **The letter-range filter was dropped**: search covers the use case and it added clutter. |
| Book details modal | Dedicated, indexable `/books/<slug>` pages |
| Menu search and letter filter | Removed for an 11-item menu; items can be grouped by category instead |
| Event search and status filter | "Upcoming & happening now" and "Past events" sections; `/events/<slug>` pages |
| In-memory cart | Persisted in `localStorage`; per-line quantities; prices, VAT and coupons computed on the server |
| `SAVE10` checked in browser code | Stored in `coupons` and checked on the server with rate limiting |
| Newsletter `alert()` | Stored in Postgres (rate-limited, no account enumeration), managed in admin |
| 2-second fake loader, Framer Motion page transitions | Removed. CSS-only motion that respects `prefers-reduced-motion`. |

## Test results (run locally in this branch)

| Suite | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | pass, 0 warnings |
| Types | `npm run typecheck` | pass (strict, `noUncheckedIndexedAccess`) |
| Unit | `npm run test:unit` | 27 passed |
| Integration (Postgres 16) | `npm run test:integration` | 13 passed |
| End-to-end (Playwright, production build) | `npm run test:e2e` | 33 passed (31 desktop, 2 mobile) |
| Migration consistency | `npx drizzle-kit check` | pass |
| Data verification | `npm run db:verify` | 8/8 checks passed |
| Production dependency audit | `npm audit --omit=dev` | 0 vulnerabilities |

End-to-end coverage includes: content present in raw HTML for every public route; unique titles, canonicals and descriptions; 404 status codes; sitemap and robots contents; valid and truthful JSON-LD; security headers; navigation and active states; cart pricing and coupon validation; the newsletter; anonymous redirects; the export endpoint returning 401/403; identical errors for wrong, unknown and disabled accounts; HttpOnly cookies and server-side logout (a replayed cookie is rejected); editors blocked from admin-only areas; field validation keeping typed input; duplicate slug errors; create, edit and delete reflected on the public site; hours and business details producing structured data; page SEO edits changing `<title>`; the unsaved-changes guard; the mobile menu with keyboard Escape; no horizontal scroll at phone width.

## Measurements

Lighthouse 12.8, mobile emulation with simulated throttling, local production server (`next start`) and seeded data. Before: single run of the old build under `vite preview`. After: median of three runs.

| Page | Perf before → after | A11y | Best practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 60 → **91** | 89 → **100** | 96 → 96 | 92 → **100** | 13.8 s → **3.4 s** | 520 → **70 ms** | 0 → 0 |
| `/books` | 66 → **96** | 85 → **100** | 96 → 96 | 92 → **100** | 13.7 s → **2.7 s** | 350 → **50 ms** | 0 → 0 |
| `/menu` | 73 → **92** | 85 → **100** | 96 → 96 | 92 → **100** | 14.0 s → **3.3 s** | 80 → **40 ms** | 0 → 0 |
| `/events` | 73 → **95** | 85 → **100** | 96 → **100** | 92 → **100** | 13.9 s → **2.9 s** | 110 → **50 ms** | 0 → 0 |
| `/about` | 74 → **96** | 89 → **100** | 96 → **100** | 92 → **100** | 13.5 s → **2.8 s** | 20 → 60 ms | 0 → 0 |
| `/books/1984` (new) | — → 92 | 100 | 96 | 100 | 3.3 s | 60 ms | 0 |
| `/cart` | — → 94 | 100 | 100 | 69 (intentional `noindex`) | 3.1 s | 60 ms | 0 |

Other observations:

- Page weight on `/` dropped from 2,411 KiB to 266 KiB, mostly from replacing the 2.3 MB PNG with an optimized WebP served by `next/image`.
- JavaScript transferred on `/` rose from 119 KiB (one bundle) to 160 KiB (Next.js runtime plus React in 12 chunks). The difference is that content no longer waits for that JavaScript: it is in the HTML, so FCP and LCP no longer depend on it.
- **INP** cannot be measured in a lab run. TBT, its lab proxy, is 40–70 ms after the change. Field INP should be read from Vercel Speed Insights or the Chrome UX Report after launch.
- The live production site was not reachable from the build sandbox, so "before" was measured on a local build. On the live site, deep links currently return 404, which is worse than this baseline shows.
- The remaining Best Practices deduction (96) comes from console errors when images fail to load. `images.unsplash.com` is blocked in the sandbox, so every remote image returned 500 from the optimizer during measurement. This should not happen in production if the URLs are valid. Some legacy photo IDs could not be verified (see owner confirmations).

## Known issues and limitations

1. **Not deployed yet.** Production needs the Neon database created, environment variables set, and the migrate/seed/verify steps run. These are production changes and are waiting for the owner's go-ahead ([DEPLOYMENT.md](DEPLOYMENT.md)).
2. Remote images were not visible in this environment; production rendering of the Unsplash URLs is unverified.
3. No image upload. Admins paste image URLs (with a live preview). Vercel Blob could be added later if staff need to upload photos.
4. No in-dashboard user management. Accounts and roles are managed with `npm run admin:create`. This is deliberate, so that nobody can raise their own privileges through the web.
5. No password reset by email. An owner resets passwords with the same CLI command.
6. CSP permits inline scripts (required for statically generated Next.js pages without nonces).
7. Dev-only dependency advisories remain (`drizzle-kit`'s bundled esbuild dev server and `braces` via `eslint-config-next`). Neither ships to production.
8. Business information is incomplete. See [OWNER_CONFIRMATIONS.md](OWNER_CONFIRMATIONS.md).

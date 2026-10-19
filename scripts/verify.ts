import { sql } from "drizzle-orm";
import { createDatabase } from "../src/server/db/connection";
import { directDatabaseUrl, loadLocalEnv } from "./_env";
import { SEED_BOOKS, SEED_MENU_ITEMS, SEED_PAGES } from "./seed-data";

/**
 * Post-migration integrity checks. Exits non-zero when any check fails so it
 * can gate a production cut-over.
 */
interface Check {
  name: string;
  query: ReturnType<typeof sql>;
  /** Passes when the single numeric result satisfies this predicate. */
  expect: (n: number) => boolean;
  describe: string;
}

const REQUIRED_PAGES = SEED_PAGES.map((p) => p.slug);

const checks: Check[] = [
  { name: "site settings row", query: sql`select count(*)::int as n from site_settings where id = 1`, expect: (n) => n === 1, describe: "= 1" },
  {
    name: "required page records",
    query: sql`select count(*)::int as n from pages where slug in ${REQUIRED_PAGES}`,
    expect: (n) => n === REQUIRED_PAGES.length,
    describe: `= ${REQUIRED_PAGES.length}`,
  },
  {
    name: "migrated books present",
    query: sql`select count(*)::int as n from books where slug in ${SEED_BOOKS.map((b) => b.slug)}`,
    expect: (n) => n === SEED_BOOKS.length,
    describe: `= ${SEED_BOOKS.length}`,
  },
  {
    name: "migrated menu items present",
    query: sql`select count(*)::int as n from menu_items where slug in ${SEED_MENU_ITEMS.map((m) => m.slug)}`,
    expect: (n) => n === SEED_MENU_ITEMS.length,
    describe: `= ${SEED_MENU_ITEMS.length}`,
  },
  {
    name: "Espresso price preserved",
    query: sql`select count(*)::int as n from menu_items where slug = 'espresso' and price = 120.00`,
    expect: (n) => n === 1,
    describe: "= 1",
  },
  {
    name: "published items missing required fields",
    query: sql`select (
      (select count(*) from books where is_published and (trim(title) = '' or trim(author) = '')) +
      (select count(*) from menu_items where is_published and trim(name) = '') +
      (select count(*) from events where is_published and trim(title) = '')
    )::int as n`,
    expect: (n) => n === 0,
    describe: "= 0",
  },
  {
    name: "sessions pointing at missing users",
    query: sql`select count(*)::int as n from admin_sessions s left join admin_users u on u.id = s.user_id where u.id is null`,
    expect: (n) => n === 0,
    describe: "= 0",
  },
  {
    name: "active administrators",
    query: sql`select count(*)::int as n from admin_users where is_active and role = 'admin'`,
    expect: (n) => n >= 1,
    describe: ">= 1",
  },
];

async function main(): Promise<void> {
  loadLocalEnv();
  const { client, db } = createDatabase(directDatabaseUrl(), { max: 1 });
  let failures = 0;
  try {
    for (const check of checks) {
      const [row] = await db.execute<{ n: number }>(check.query);
      const n = Number(row?.n ?? NaN);
      const ok = check.expect(n);
      if (!ok) failures += 1;
      console.log(`${ok ? "PASS" : "FAIL"}  ${check.name.padEnd(42)} got ${n}, expected ${check.describe}`);
    }
  } finally {
    await client.end();
  }
  if (failures > 0) {
    console.error(`${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("All checks passed.");
}

main().catch((error: unknown) => {
  console.error("Verification failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

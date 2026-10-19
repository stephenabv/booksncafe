import { count } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Database } from "../src/server/db/connection";
import { createDatabase } from "../src/server/db/connection";
import * as schema from "../src/server/db/schema";
import { directDatabaseUrl, loadLocalEnv } from "./_env";
import {
  SEED_BOOKS,
  SEED_COUPONS,
  SEED_EVENTS,
  SEED_MENU_ITEMS,
  SEED_NAV_LINKS,
  SEED_PAGES,
  SEED_SETTINGS,
  SEED_TEAM,
} from "./seed-data";

/**
 * Idempotent seed. Each table is only populated when it is empty, so running
 * the seed again never resurrects records an administrator deleted and never
 * overwrites edited content.
 */
export async function seed(db: Database): Promise<Record<string, number>> {
  const inserted: Record<string, number> = {};

  await db.transaction(async (tx) => {
    const seedIfEmpty = async <T extends PgTable>(name: string, table: T, rows: T["$inferInsert"][]) => {
      const [existing] = await tx.select({ n: count() }).from(table as PgTable);
      if ((existing?.n ?? 0) > 0 || rows.length === 0) {
        inserted[name] = 0;
        return;
      }
      await tx.insert(table).values(rows);
      inserted[name] = rows.length;
    };

    await seedIfEmpty("site_settings", schema.siteSettings, [{ id: 1, ...SEED_SETTINGS }]);
    await seedIfEmpty("nav_links", schema.navLinks, SEED_NAV_LINKS);
    await seedIfEmpty("pages", schema.pages, SEED_PAGES);
    await seedIfEmpty("books", schema.books, SEED_BOOKS);
    await seedIfEmpty("menu_items", schema.menuItems, SEED_MENU_ITEMS);
    await seedIfEmpty("events", schema.events, SEED_EVENTS);
    await seedIfEmpty("team_members", schema.teamMembers, SEED_TEAM);
    await seedIfEmpty("coupons", schema.coupons, SEED_COUPONS);
  });

  return inserted;
}

async function main(): Promise<void> {
  loadLocalEnv();
  const { client, db } = createDatabase(directDatabaseUrl(), { max: 1 });
  try {
    const inserted = await seed(db);
    console.table(inserted);
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

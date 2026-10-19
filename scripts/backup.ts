import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDatabase } from "../src/server/db/connection";
import * as schema from "../src/server/db/schema";
import { directDatabaseUrl, loadLocalEnv } from "./_env";

/**
 * Writes a JSON snapshot of all business content to ./backups (git-ignored).
 * Admin password hashes, sessions and rate-limit buckets are intentionally
 * excluded. Use alongside Neon's point-in-time restore, not instead of it.
 */
export const CONTENT_TABLES = {
  site_settings: schema.siteSettings,
  opening_hours: schema.openingHours,
  special_hours: schema.specialHours,
  nav_links: schema.navLinks,
  social_links: schema.socialLinks,
  pages: schema.pages,
  announcements: schema.announcements,
  books: schema.books,
  menu_items: schema.menuItems,
  events: schema.events,
  faqs: schema.faqs,
  team_members: schema.teamMembers,
  coupons: schema.coupons,
  newsletter_subscribers: schema.newsletterSubscribers,
} as const;

async function main(): Promise<void> {
  loadLocalEnv();
  const { client, db } = createDatabase(directDatabaseUrl(), { max: 1 });
  try {
    const snapshot: Record<string, unknown[]> = {};
    for (const [name, table] of Object.entries(CONTENT_TABLES)) {
      snapshot[name] = await db.select().from(table);
    }
    mkdirSync("backups", { recursive: true });
    const file = join("backups", `content-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    writeFileSync(file, JSON.stringify({ createdAt: new Date().toISOString(), tables: snapshot }, null, 2), { mode: 0o600 });
    for (const [name, rows] of Object.entries(snapshot)) console.log(`${name.padEnd(24)} ${rows.length}`);
    console.log(`Backup written to ${file}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Backup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

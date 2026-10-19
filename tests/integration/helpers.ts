import { sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";

/** Empties every application table between tests. */
export async function resetDatabase(): Promise<void> {
  await getDb().execute(sql`
    truncate table site_settings, opening_hours, special_hours, nav_links, social_links, pages, announcements,
      books, menu_items, events, faqs, team_members, coupons, newsletter_subscribers,
      admin_sessions, admin_users, rate_limit_buckets, audit_log restart identity cascade
  `);
}

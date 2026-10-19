import "server-only";
import { sql } from "drizzle-orm";
import type { Database } from "@/server/db/client";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Fixed-window rate limiter backed by Postgres so limits hold across
 * serverless instances. A single atomic upsert increments the bucket or
 * starts a new window when the previous one expired.
 */
export async function consumeRateLimit(
  db: Database,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const rows = await db.execute<{ count: number; reset_at: Date | string }>(sql`
    insert into rate_limit_buckets as b (key, count, reset_at)
    values (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    on conflict (key) do update set
      count    = case when b.reset_at <= now() then 1 else b.count + 1 end,
      reset_at = case when b.reset_at <= now() then now() + make_interval(secs => ${windowSeconds}) else b.reset_at end
    returning count, reset_at
  `);
  const row = rows[0];
  if (!row) throw new Error("Rate limiter returned no row");
  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: new Date(row.reset_at),
  };
}

export async function resetRateLimit(db: Database, key: string): Promise<void> {
  await db.execute(sql`delete from rate_limit_buckets where key = ${key}`);
}

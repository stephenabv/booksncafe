import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

export interface DatabaseHandle {
  client: postgres.Sql;
  db: Database;
}

/**
 * Creates a Drizzle instance. Kept free of `server-only` so CLI scripts and
 * tests can share it with the application.
 */
export function createDatabase(url: string, options: { max?: number } = {}): DatabaseHandle {
  const client = postgres(url, {
    max: options.max ?? 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // Neon's pooled endpoint runs PgBouncer in transaction mode, which does not
    // support named prepared statements.
    prepare: false,
    onnotice: () => undefined,
  });
  return { client, db: drizzle(client, { schema }) };
}

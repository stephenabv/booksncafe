import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "../src/server/db/connection";
import { directDatabaseUrl, loadLocalEnv } from "./_env";

/**
 * Applies pending versioned migrations from ./drizzle. Drizzle records applied
 * migrations in drizzle.__drizzle_migrations and runs each file in a transaction.
 */
async function main(): Promise<void> {
  loadLocalEnv();
  const { client, db } = createDatabase(directDatabaseUrl(), { max: 1 });
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migrations applied.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

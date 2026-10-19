import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "../../src/server/db/connection";

/** Rebuilds the throwaway test database schema from the versioned migrations. */
export default async function setup(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/booksncafe_test";
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error(`Refusing to run integration tests against a database whose name lacks "test": ${new URL(url).pathname}`);
  }
  const { client, db } = createDatabase(url, { max: 1 });
  try {
    await client.unsafe("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
    await migrate(db, { migrationsFolder: "drizzle" });
  } finally {
    await client.end();
  }
}

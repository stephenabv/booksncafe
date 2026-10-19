import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { seed } from "../../scripts/seed";
import { hashPassword } from "../../src/server/auth/password";
import { createDatabase } from "../../src/server/db/connection";
import { adminUsers } from "../../src/server/db/schema";
import { E2E_ACCOUNTS, E2E_DATABASE_URL } from "./accounts";

/** Recreates the e2e database: schema from migrations, legacy seed content and two test accounts. */
async function main(): Promise<void> {
  if (!/e2e|test/i.test(new URL(E2E_DATABASE_URL).pathname)) throw new Error("Refusing to reset a non-test database.");
  const { client, db } = createDatabase(E2E_DATABASE_URL, { max: 1 });
  try {
    await client.unsafe("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
    await migrate(db, { migrationsFolder: "drizzle" });
    await seed(db);
    for (const account of Object.values(E2E_ACCOUNTS)) {
      await db.insert(adminUsers).values({ email: account.email, role: account.role, passwordHash: await hashPassword(account.password) });
    }
    await db.insert(adminUsers).values({ email: "disabled@example.test", role: "admin", isActive: false, passwordHash: await hashPassword("disabled-account-pw") });
    await db.update(adminUsers).set({ displayName: "E2E Owner" }).where(eq(adminUsers.email, E2E_ACCOUNTS.admin.email));
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

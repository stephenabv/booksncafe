import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../src/server/db/connection";
import { createDatabase } from "../src/server/db/connection";
import { adminUsers } from "../src/server/db/schema";
import { hashPassword } from "../src/server/auth/password";
import { directDatabaseUrl, loadLocalEnv } from "./_env";

/**
 * Creates the first administrator from ADMIN_BOOTSTRAP_EMAIL and
 * ADMIN_BOOTSTRAP_PASSWORD when the database has no active administrator.
 *
 * This lets a hosted build set up a fresh database without anyone running the
 * CLI. It never modifies existing accounts: once any active administrator
 * exists it does nothing, so the variables can stay set (or be removed)
 * without resetting a password the owner has since changed.
 */
const bootstrapSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string(),
  name: z.string().trim().max(100).optional(),
});

export type BootstrapResult = "created" | "skipped-existing-admin";

export async function bootstrapAdmin(db: Database, input: z.input<typeof bootstrapSchema>): Promise<BootstrapResult> {
  const { email, password, name } = bootstrapSchema.parse(input);
  const passwordHash = await hashPassword(password);

  return db.transaction(async (tx) => {
    const [active] = await tx
      .select({ n: count() })
      .from(adminUsers)
      .where(and(eq(adminUsers.isActive, true), eq(adminUsers.role, "admin")));
    if ((active?.n ?? 0) > 0) return "skipped-existing-admin";

    await tx.insert(adminUsers).values({
      email,
      passwordHash,
      role: "admin",
      isActive: true,
      ...(name ? { displayName: name } : {}),
    });
    return "created";
  });
}

async function main(): Promise<void> {
  loadLocalEnv();
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) {
    console.log("Admin bootstrap skipped: ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are not both set.");
    return;
  }

  const { client, db } = createDatabase(directDatabaseUrl(), { max: 1 });
  try {
    const result = await bootstrapAdmin(db, { email, password, name: process.env.ADMIN_BOOTSTRAP_NAME });
    console.log(
      result === "created"
        ? "Admin bootstrap: created the first administrator."
        : "Admin bootstrap skipped: an active administrator already exists.",
    );
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    // Zod and password errors never echo the password itself.
    console.error("Admin bootstrap failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

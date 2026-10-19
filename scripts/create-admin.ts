import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createDatabase } from "../src/server/db/connection";
import { adminUsers } from "../src/server/db/schema";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/server/auth/password";
import { directDatabaseUrl, loadLocalEnv } from "./_env";

/**
 * Creates an administrator, or resets the password/role of an existing one.
 * This is deliberately CLI-only: there is no public registration endpoint and
 * the dashboard cannot grant roles, so nobody can elevate their own account.
 *
 *   npm run admin:create -- --email owner@example.com --role admin [--name "Owner"]
 *
 * The password is read from ADMIN_PASSWORD or prompted for interactively.
 */
const argsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["admin", "editor"]).default("editor"),
  name: z.string().trim().max(100).optional(),
});

async function readPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (!process.stdin.isTTY) throw new Error("Set ADMIN_PASSWORD when running non-interactively.");
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  // Suppress echo of typed characters.
  const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
    if (s.includes("Password")) write.call(rl, s);
  };
  const password = await rl.question(`Password (min ${MIN_PASSWORD_LENGTH} chars): `);
  rl.close();
  process.stdout.write("\n");
  return password;
}

async function main(): Promise<void> {
  loadLocalEnv();
  const { values } = parseArgs({
    options: { email: { type: "string" }, role: { type: "string" }, name: { type: "string" } },
  });
  const args = argsSchema.parse(values);
  const passwordHash = await hashPassword(await readPassword());

  const { client, db } = createDatabase(directDatabaseUrl(), { max: 1 });
  try {
    const user = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .where(sql`lower(${adminUsers.email}) = ${args.email}`)
        .limit(1);
      const values = { passwordHash, role: args.role, isActive: true, ...(args.name ? { displayName: args.name } : {}) };
      const [row] = existing
        ? await tx.update(adminUsers).set(values).where(eq(adminUsers.id, existing.id)).returning()
        : await tx.insert(adminUsers).values({ email: args.email, ...values }).returning();
      return row;
    });
    console.log(`Administrator ready: ${user?.email} (${user?.role})`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

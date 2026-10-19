import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { bootstrapAdmin } from "../../scripts/bootstrap-admin";
import { verifyPassword } from "@/server/auth/password";
import { getDb } from "@/server/db/client";
import { adminUsers } from "@/server/db/schema";
import { resetDatabase } from "./helpers";

beforeEach(resetDatabase);

const PASSWORD = "bootstrap-password-123";

describe("admin bootstrap", () => {
  it("creates the first administrator on an empty database", async () => {
    const db = getDb();
    expect(await bootstrapAdmin(db, { email: " Owner@Example.test ", password: PASSWORD, name: "Owner" })).toBe("created");

    const [admin] = await db.select().from(adminUsers);
    expect(admin).toMatchObject({ email: "owner@example.test", role: "admin", isActive: true, displayName: "Owner" });
    expect(await verifyPassword(PASSWORD, admin!.passwordHash)).toBe(true);
  });

  it("never changes accounts once an active administrator exists", async () => {
    const db = getDb();
    await bootstrapAdmin(db, { email: "owner@example.test", password: PASSWORD });
    const [before] = await db.select().from(adminUsers);

    expect(await bootstrapAdmin(db, { email: "owner@example.test", password: "a-different-password-456" })).toBe(
      "skipped-existing-admin",
    );
    expect(await bootstrapAdmin(db, { email: "intruder@example.test", password: PASSWORD })).toBe("skipped-existing-admin");

    const after = await db.select().from(adminUsers);
    expect(after).toHaveLength(1);
    expect(after[0]?.passwordHash).toBe(before?.passwordHash);
  });

  it("still bootstraps when only editors or disabled admins exist", async () => {
    const db = getDb();
    await bootstrapAdmin(db, { email: "first@example.test", password: PASSWORD });
    await db.update(adminUsers).set({ isActive: false }).where(eq(adminUsers.email, "first@example.test"));

    expect(await bootstrapAdmin(db, { email: "second@example.test", password: PASSWORD })).toBe("created");
  });

  it("rejects weak passwords and invalid emails without writing", async () => {
    const db = getDb();
    await expect(bootstrapAdmin(db, { email: "owner@example.test", password: "short" })).rejects.toThrow();
    await expect(bootstrapAdmin(db, { email: "not-an-email", password: PASSWORD })).rejects.toThrow();
    expect(await db.select().from(adminUsers)).toHaveLength(0);
  });
});

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/server/db/client";
import { adminSessions, adminUsers } from "@/server/db/schema";
import { serverEnv } from "@/server/env";
import type { AdminRole } from "./roles";

const isProduction = process.env.NODE_ENV === "production";

/**
 * `__Host-` cookies must be Secure, host-only and Path=/, which browsers enforce.
 * Plain HTTP local development cannot set Secure cookies, so it uses a bare name.
 */
export const SESSION_COOKIE = isProduction ? "__Host-bnc_session" : "bnc_session";

export interface AdminIdentity {
  id: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, meta: { ip: string; userAgent: string | null }): Promise<void> {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const ttlMs = serverEnv().SESSION_TTL_HOURS * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs);

  await db.insert(adminSessions).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });
  // Opportunistic cleanup keeps the table small without a cron job.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Resolves the signed-in administrator for this request, or null. Memoised per request. */
export const getCurrentAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;

  const [row] = await getDb()
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(
      and(
        eq(adminSessions.tokenHash, hashToken(token)),
        gt(adminSessions.expiresAt, new Date()),
        eq(adminUsers.isActive, true),
      ),
    )
    .limit(1);

  return row ?? null;
});

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
}

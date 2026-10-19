import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { AuthorizationError, requireAdminAction } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { newsletterSubscribers } from "@/server/db/schema";

export const dynamic = "force-dynamic";

/** Neutralises spreadsheet formula injection and quotes CSV fields. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(): Promise<Response> {
  try {
    await requireAdminAction("admin");
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const rows = await getDb().select().from(newsletterSubscribers).orderBy(asc(newsletterSubscribers.createdAt));
  const body = ["email,subscribed_at", ...rows.map((r) => `${csvCell(r.email)},${csvCell(r.createdAt.toISOString())}`)].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

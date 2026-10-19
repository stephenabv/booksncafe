import "server-only";
import { eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { FieldDef, FormValues } from "@/lib/admin-fields";
import { utcToZonedLocal } from "@/lib/timezone";
import type { Database } from "@/server/db/client";
import { auditLog } from "@/server/db/schema";
import type { ResourceDefinition } from "./resources";

/**
 * Generic persistence for registry resources. Drizzle's table generics cannot
 * express "any registered table" precisely, so rows are typed as records here;
 * every write has already passed the resource's Zod schema.
 */
type Row = Record<string, unknown>;

export async function listRecords(db: Database, resource: ResourceDefinition): Promise<Row[]> {
  return (await db
    .select()
    .from(resource.table)
    .orderBy(...resource.orderBy)
    .limit(500)) as Row[];
}

export async function getRecord(db: Database, resource: ResourceDefinition, id: number): Promise<Row | null> {
  const [row] = (await db.select().from(resource.table).where(eq(resource.idColumn, id)).limit(1)) as Row[];
  return row ?? null;
}

export async function insertRecord(db: Database, resource: ResourceDefinition, data: Row): Promise<number> {
  const [row] = (await db
    .insert(resource.table as PgTable)
    .values(data as never)
    .returning({ id: resource.idColumn })) as Array<{ id: number }>;
  if (!row) throw new Error("Insert returned no row");
  return row.id;
}

export async function updateRecord(db: Database, resource: ResourceDefinition, id: number, data: Row): Promise<boolean> {
  const rows = await db
    .update(resource.table as PgTable)
    .set(data as never)
    .where(eq(resource.idColumn, id))
    .returning({ id: resource.idColumn });
  return rows.length > 0;
}

export async function deleteRecord(db: Database, resource: ResourceDefinition, id: number): Promise<boolean> {
  const rows = await db.delete(resource.table).where(eq(resource.idColumn, id)).returning({ id: resource.idColumn });
  return rows.length > 0;
}

export async function writeAudit(
  db: Database,
  entry: { userId: string | null; action: string; entity: string; entityId?: string | number | null; details?: unknown },
): Promise<void> {
  await db.insert(auditLog).values({
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId != null ? String(entry.entityId) : null,
    details: entry.details ?? null,
  });
}

/** Converts a stored row into the string/boolean values an HTML form expects. */
export function toFormValues(fields: readonly FieldDef[], row: Row | null, timeZone: string): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const raw = row?.[field.name];
    if (field.type === "checkbox") {
      values[field.name] = typeof raw === "boolean" ? raw : field.name === "isAvailable" || field.name === "isVisible" || field.name === "isActive";
    } else if (raw instanceof Date) {
      values[field.name] = utcToZonedLocal(raw, timeZone);
    } else if (field.type === "time" && typeof raw === "string") {
      values[field.name] = raw.slice(0, 5);
    } else {
      values[field.name] = raw == null ? "" : String(raw);
    }
  }
  return values;
}

/** Postgres unique-violation details, used to report friendly field errors. */
export function uniqueViolation(error: unknown): { constraint: string } | null {
  const e = (error as { cause?: unknown })?.cause ?? error;
  if (e && typeof e === "object" && (e as { code?: string }).code === "23505") {
    return { constraint: String((e as { constraint_name?: string; constraint?: string }).constraint_name ?? (e as { constraint?: string }).constraint ?? "") };
  }
  return null;
}

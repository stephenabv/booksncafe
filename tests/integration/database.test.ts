import { count, eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { seed } from "../../scripts/seed";
import { SEED_BOOKS, SEED_EVENTS, SEED_MENU_ITEMS } from "../../scripts/seed-data";
import { getRecord, insertRecord, listRecords, uniqueViolation, updateRecord } from "@/server/admin/records";
import { getResource } from "@/server/admin/resources";
import { getDb } from "@/server/db/client";
import { books, events, menuItems } from "@/server/db/schema";
import { consumeRateLimit } from "@/server/rate-limit";
import { searchBooks } from "@/server/repositories/site";
import { resetDatabase } from "./helpers";

beforeEach(resetDatabase);

describe("seed migration", () => {
  it("imports the legacy content and is idempotent", async () => {
    const db = getDb();
    const first = await seed(db);
    expect(first).toMatchObject({ books: SEED_BOOKS.length, menu_items: SEED_MENU_ITEMS.length, events: SEED_EVENTS.length });

    const second = await seed(db);
    expect(Object.values(second).every((n) => n === 0)).toBe(true);

    const [bookCount] = await db.select({ n: count() }).from(books);
    expect(bookCount?.n).toBe(SEED_BOOKS.length);
    const [espresso] = await db.select().from(menuItems).where(eq(menuItems.slug, "espresso"));
    expect(espresso?.price).toBe("120.00");
  });

  it("does not resurrect records an admin deleted", async () => {
    const db = getDb();
    await seed(db);
    await db.delete(books).where(eq(books.slug, "1984"));
    await seed(db);
    expect(await db.select().from(books).where(eq(books.slug, "1984"))).toHaveLength(0);
  });

  it("imports unverifiable events unpublished", async () => {
    const db = getDb();
    await seed(db);
    const rows = await db.select().from(events);
    expect(rows.every((e) => !e.isPublished)).toBe(true);
  });
});

describe("schema constraints", () => {
  it("rejects an event that ends before it starts", async () => {
    await expect(
      getDb().insert(events).values({ slug: "bad", title: "Bad", startsAt: new Date("2026-01-02"), endsAt: new Date("2026-01-01") }),
    ).rejects.toThrow();
  });

  it("rejects negative prices and lower-case coupon codes", async () => {
    await expect(getDb().insert(books).values({ slug: "x", title: "X", author: "Y", price: "-1" })).rejects.toThrow();
    await expect(getDb().execute(sql`insert into coupons (code, percent_off) values ('save5', 5)`)).rejects.toThrow();
  });
});

describe("generic admin records", () => {
  it("creates, reads and updates through the registry", async () => {
    const db = getDb();
    const resource = getResource("books")!;
    const parsed = resource.schema({ timeZone: "Asia/Manila" }).parse({
      title: "Noli Me Tángere",
      author: "José Rizal",
      category: "",
      description: "",
      price: "450",
      slug: "",
      imageUrl: "",
      imageAlt: "",
      isAvailable: true,
      isFeatured: false,
      isPublished: true,
      sortOrder: "5",
    });
    const id = await insertRecord(db, resource, resource.finalize!(parsed));
    const row = await getRecord(db, resource, id);
    expect(row).toMatchObject({ slug: "noli-me-tangere", price: "450.00", category: null, sortOrder: 5 });

    await updateRecord(db, resource, id, { ...resource.finalize!(parsed), title: "Noli Me Tangere" });
    expect((await getRecord(db, resource, id))?.title).toBe("Noli Me Tangere");
    expect(await listRecords(db, resource)).toHaveLength(1);
  });

  it("reports unique slug violations", async () => {
    const db = getDb();
    const resource = getResource("books")!;
    const data = { slug: "dup", title: "A", author: "B" };
    await insertRecord(db, resource, data);
    const error = await insertRecord(db, resource, data).catch((e: unknown) => e);
    expect(uniqueViolation(error)?.constraint).toContain("books_slug_key");
  });

  it("validates event schedules in the business time zone", () => {
    const schema = getResource("events")!.schema({ timeZone: "Asia/Manila" });
    const base = { title: "Reading", description: "", location: "", slug: "", imageUrl: "", imageAlt: "", isPublished: true };
    const ok = schema.parse({ ...base, startsAt: "2026-11-01T18:00", endsAt: "2026-11-01T20:00" });
    expect((ok.startsAt as Date).toISOString()).toBe("2026-11-01T10:00:00.000Z");
    expect(schema.safeParse({ ...base, startsAt: "2026-11-01T18:00", endsAt: "2026-11-01T17:00" }).success).toBe(false);
  });

  it("returns null for unknown resource keys including prototype names", () => {
    expect(getResource("constructor")).toBeNull();
    expect(getResource("__proto__")).toBeNull();
    expect(getResource("admin_users")).toBeNull();
  });
});

describe("public queries", () => {
  it("only returns published books and treats LIKE wildcards literally", async () => {
    const db = getDb();
    await db.insert(books).values([
      { slug: "a", title: "100% Coffee", author: "Barista", isPublished: true },
      { slug: "b", title: "Draft Book", author: "Someone", isPublished: false },
      { slug: "c", title: "Other", author: "Writer", isPublished: true },
    ]);
    expect((await searchBooks({})).total).toBe(2);
    expect((await searchBooks({ q: "%" })).items.map((b) => b.slug)).toEqual(["a"]);
    expect((await searchBooks({ q: "draft" })).total).toBe(0);
    expect((await searchBooks({ q: "_" })).total).toBe(0);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit within a window, then blocks", async () => {
    const db = getDb();
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push(await consumeRateLimit(db, "test:key", 3, 60));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
  });

  it("is atomic under concurrent requests", async () => {
    const db = getDb();
    const results = await Promise.all(Array.from({ length: 10 }, () => consumeRateLimit(db, "test:concurrent", 5, 60)));
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("starts a new window once the previous one expires", async () => {
    const db = getDb();
    await consumeRateLimit(db, "test:expiry", 1, 60);
    await db.execute(sql`update rate_limit_buckets set reset_at = now() - interval '1 second' where key = 'test:expiry'`);
    expect((await consumeRateLimit(db, "test:expiry", 1, 60)).allowed).toBe(true);
  });
});

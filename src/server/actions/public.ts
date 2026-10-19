"use server";

import { and, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { MAX_CART_LINES, MAX_LINE_QUANTITY, type CartQuote, type QuotedLine } from "@/lib/cart-types";
import { computeCartTotals } from "@/lib/pricing";
import { getDb } from "@/server/db/client";
import { books, coupons, menuItems, newsletterSubscribers } from "@/server/db/schema";
import { consumeRateLimit } from "@/server/rate-limit";
import { getSiteSettings } from "@/server/repositories/site";
import { clientIp } from "@/server/request-context";

export interface FormState {
  status: "idle" | "success" | "error";
  message: string;
}

const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254);

export async function subscribeToNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid email." };

  try {
    const db = getDb();
    const limit = await consumeRateLimit(db, `newsletter:${await clientIp()}`, 5, 60 * 60);
    if (!limit.allowed) return { status: "error", message: "Too many attempts. Please try again later." };

    await db
      .insert(newsletterSubscribers)
      .values({ email: parsed.data })
      .onConflictDoNothing();
    // Same response whether or not the address already existed, so the form
    // cannot be used to discover who is subscribed.
    return { status: "success", message: "Thanks! You’re on the list for news about books, events and specials." };
  } catch (error) {
    console.error("newsletter.subscribe failed", error);
    return { status: "error", message: "We couldn’t save your email right now. Please try again." };
  }
}

const cartSchema = z
  .array(
    z.object({
      type: z.enum(["book", "menu"]),
      id: z.number().int().positive(),
      quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
    }),
  )
  .max(MAX_CART_LINES);

const couponSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{1,32}$/)
  .optional()
  .or(z.literal(""));

/**
 * Prices the cart from the database. Client-supplied prices are never trusted:
 * only item ids and quantities come from the browser.
 */
export async function quoteCart(rawLines: unknown, rawCoupon?: unknown): Promise<CartQuote> {
  const lines = cartSchema.parse(rawLines);
  const couponInput = couponSchema.safeParse(rawCoupon);
  const db = getDb();
  const settings = await getSiteSettings();

  const bookIds = lines.filter((l) => l.type === "book").map((l) => l.id);
  const menuIds = lines.filter((l) => l.type === "menu").map((l) => l.id);

  const [bookRows, menuRows] = await Promise.all([
    bookIds.length
      ? db
          .select({ id: books.id, name: books.title, slug: books.slug, price: books.price, imageUrl: books.imageUrl, imageAlt: books.imageAlt, available: books.isAvailable })
          .from(books)
          .where(and(inArray(books.id, bookIds), eq(books.isPublished, true)))
      : Promise.resolve([]),
    menuIds.length
      ? db
          .select({ id: menuItems.id, name: menuItems.name, slug: menuItems.slug, price: menuItems.price, imageUrl: menuItems.imageUrl, imageAlt: menuItems.imageAlt, available: menuItems.isAvailable })
          .from(menuItems)
          .where(and(inArray(menuItems.id, menuIds), eq(menuItems.isPublished, true)))
      : Promise.resolve([]),
  ]);
  type Row = (typeof bookRows)[number] & { href: string };
  const lookup = new Map<string, Row>([
    ...bookRows.map((r): [string, Row] => [`book:${r.id}`, { ...r, href: `/books/${r.slug}` }]),
    ...menuRows.map((r): [string, Row] => [`menu:${r.id}`, { ...r, href: "/menu" }]),
  ]);

  const quoted: QuotedLine[] = lines.map((line) => {
    const row = lookup.get(`${line.type}:${line.id}`);
    const purchasable = Boolean(row && row.available && row.price !== null);
    const unitPrice = row?.price != null ? Number(row.price) : null;
    return {
      ...line,
      name: row?.name ?? "Item no longer available",
      href: row?.href ?? null,
      imageUrl: row?.imageUrl ?? null,
      imageAlt: row?.imageAlt ?? null,
      unitPrice,
      lineTotal: purchasable && unitPrice !== null ? unitPrice * line.quantity : 0,
      purchasable,
    };
  });

  let coupon: CartQuote["coupon"] = null;
  let couponError: string | null = null;
  const code = couponInput.success ? couponInput.data : undefined;
  if (rawCoupon && !couponInput.success) couponError = "That coupon code isn’t valid.";
  if (code) {
    const limit = await consumeRateLimit(db, `coupon:${await clientIp()}`, 20, 10 * 60);
    if (!limit.allowed) {
      couponError = "Too many coupon attempts. Please try again later.";
    } else {
      const [row] = await db
        .select({ code: coupons.code, percentOff: coupons.percentOff })
        .from(coupons)
        .where(
          and(
            eq(coupons.code, code),
            eq(coupons.isActive, true),
            or(isNull(coupons.expiresAt), gt(coupons.expiresAt, sql`now()`)),
          ),
        )
        .limit(1);
      if (row) coupon = row;
      else couponError = "That coupon code isn’t valid.";
    }
  }

  const totals = computeCartTotals(
    quoted.filter((l) => l.purchasable && l.unitPrice !== null).map((l) => ({ unitPrice: l.unitPrice!, quantity: l.quantity })),
    coupon?.percentOff ?? 0,
  );

  return { lines: quoted, currency: settings.currency, ...totals, coupon, couponError };
}

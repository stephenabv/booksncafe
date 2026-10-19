import "server-only";
import { and, asc, count, desc, eq, gt, gte, ilike, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/server/db/client";
import {
  announcements,
  books,
  events,
  faqs,
  menuItems,
  navLinks,
  openingHours,
  pages,
  siteSettings,
  socialLinks,
  specialHours,
  teamMembers,
} from "@/server/db/schema";

/**
 * Read-only queries for the public website. Every query filters on
 * `is_published` / `is_visible` so drafts never reach visitors. Functions are
 * wrapped in React `cache` to dedupe calls within a single render.
 */

export type SiteSettings = typeof siteSettings.$inferSelect;
export type Book = typeof books.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type EventRecord = typeof events.$inferSelect;
export type PageContent = typeof pages.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;

export const FALLBACK_SETTINGS: SiteSettings = {
  id: 1,
  businessName: "Books ’n Cafe",
  tagline: null,
  description: null,
  email: null,
  phone: null,
  streetAddress: null,
  locality: null,
  region: null,
  postalCode: null,
  countryCode: null,
  mapUrl: null,
  directions: null,
  latitude: null,
  longitude: null,
  timezone: "Asia/Manila",
  currency: "PHP",
  priceRange: null,
  logoUrl: null,
  defaultOgImageUrl: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const [row] = await getDb().select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row ?? FALLBACK_SETTINGS;
});

export const getOpeningHours = cache(async () =>
  getDb()
    .select({
      dayOfWeek: openingHours.dayOfWeek,
      isClosed: openingHours.isClosed,
      opensAt: openingHours.opensAt,
      closesAt: openingHours.closesAt,
    })
    .from(openingHours)
    .orderBy(asc(openingHours.dayOfWeek)),
);

/** Special hours from yesterday onward (covers time-zone edges); past entries are history. */
export const getUpcomingSpecialHours = cache(async () =>
  getDb()
    .select({
      date: specialHours.date,
      label: specialHours.label,
      isClosed: specialHours.isClosed,
      opensAt: specialHours.opensAt,
      closesAt: specialHours.closesAt,
    })
    .from(specialHours)
    .where(gte(specialHours.date, sql`current_date - 1`))
    .orderBy(asc(specialHours.date))
    .limit(10),
);

export const getNavLinks = cache(async (location: "header" | "footer") =>
  getDb()
    .select({ id: navLinks.id, label: navLinks.label, href: navLinks.href })
    .from(navLinks)
    .where(and(eq(navLinks.location, location), eq(navLinks.isVisible, true)))
    .orderBy(asc(navLinks.sortOrder), asc(navLinks.id)),
);

export const getSocialLinks = cache(async () =>
  getDb()
    .select({ id: socialLinks.id, platform: socialLinks.platform, url: socialLinks.url })
    .from(socialLinks)
    .where(eq(socialLinks.isVisible, true))
    .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.id)),
);

export const getPage = cache(async (slug: string): Promise<PageContent | null> => {
  const [row] = await getDb().select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return row ?? null;
});

export const getActiveAnnouncements = cache(async () => {
  const now = new Date();
  return getDb()
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.isPublished, true),
        or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
        or(isNull(announcements.endsAt), gt(announcements.endsAt, now)),
      ),
    )
    .orderBy(asc(announcements.sortOrder), desc(announcements.id))
    .limit(3);
});

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

export interface BookQuery {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

/** Escapes LIKE wildcards so user search text is matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function searchBooks({ q, category, page = 1, pageSize = 12 }: BookQuery) {
  const filters: SQL[] = [eq(books.isPublished, true)];
  const term = q?.trim().slice(0, 100);
  if (term) {
    const pattern = `%${escapeLike(term)}%`;
    filters.push(or(ilike(books.title, pattern), ilike(books.author, pattern))!);
  }
  if (category) filters.push(eq(books.category, category));
  const where = and(...filters);

  const db = getDb();
  const [items, [totals]] = await Promise.all([
    db
      .select()
      .from(books)
      .where(where)
      .orderBy(asc(books.sortOrder), asc(books.title))
      .limit(pageSize)
      .offset((Math.max(1, page) - 1) * pageSize),
    db.select({ total: count() }).from(books).where(where),
  ]);
  const total = totals?.total ?? 0;
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export const getBookCategories = cache(async (): Promise<string[]> => {
  const rows = await getDb()
    .selectDistinct({ category: books.category })
    .from(books)
    .where(and(eq(books.isPublished, true), sql`${books.category} is not null`))
    .orderBy(asc(books.category));
  return rows.map((r) => r.category!).filter(Boolean);
});

export const getBookBySlug = cache(async (slug: string): Promise<Book | null> => {
  const [row] = await getDb()
    .select()
    .from(books)
    .where(and(eq(books.slug, slug), eq(books.isPublished, true)))
    .limit(1);
  return row ?? null;
});

export const listFeaturedBooks = cache(async (limit = 4) =>
  getDb()
    .select()
    .from(books)
    .where(and(eq(books.isPublished, true), eq(books.isFeatured, true)))
    .orderBy(asc(books.sortOrder), asc(books.title))
    .limit(limit),
);

export const listPublishedBookSlugs = cache(async () =>
  getDb()
    .select({ slug: books.slug, updatedAt: books.updatedAt })
    .from(books)
    .where(eq(books.isPublished, true)),
);

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export const listPublishedMenuItems = cache(async () =>
  getDb()
    .select()
    .from(menuItems)
    .where(eq(menuItems.isPublished, true))
    .orderBy(asc(menuItems.category), asc(menuItems.sortOrder), asc(menuItems.name)),
);

export const listFeaturedMenuItems = cache(async (limit = 3) =>
  getDb()
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.isPublished, true), eq(menuItems.isFeatured, true)))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.name))
    .limit(limit),
);

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const listPublishedEvents = cache(async () =>
  getDb().select().from(events).where(eq(events.isPublished, true)).orderBy(asc(events.startsAt)),
);

export const listUpcomingEvents = cache(async (limit = 3) =>
  getDb()
    .select()
    .from(events)
    .where(and(eq(events.isPublished, true), gt(events.endsAt, new Date())))
    .orderBy(asc(events.startsAt))
    .limit(limit),
);

export const getEventBySlug = cache(async (slug: string): Promise<EventRecord | null> => {
  const [row] = await getDb()
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isPublished, true)))
    .limit(1);
  return row ?? null;
});

// ---------------------------------------------------------------------------
// About / FAQ
// ---------------------------------------------------------------------------

export const listPublishedFaqs = cache(async () =>
  getDb()
    .select({ id: faqs.id, question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(eq(faqs.isPublished, true))
    .orderBy(asc(faqs.sortOrder), asc(faqs.id)),
);

export const listPublishedTeamMembers = cache(async () =>
  getDb()
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isPublished, true))
    .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.id)),
);

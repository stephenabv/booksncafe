import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Database schema for Books 'n Cafe.
 *
 * Conventions:
 *  - Public content tables carry `is_published` so drafts never leak to the public site.
 *  - Money is stored as numeric(10,2) and surfaced as a string by the driver to avoid float drift.
 *  - All timestamps are timestamptz.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const adminRole = pgEnum("admin_role", ["admin", "editor"]);
export const navLocation = pgEnum("nav_location", ["header", "footer"]);

// ---------------------------------------------------------------------------
// Site configuration (singleton row, id = 1)
// ---------------------------------------------------------------------------

export const siteSettings = pgTable(
  "site_settings",
  {
    id: smallint("id").primaryKey().default(1),
    businessName: text("business_name").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    email: text("email"),
    phone: text("phone"),
    streetAddress: text("street_address"),
    locality: text("locality"),
    region: text("region"),
    postalCode: text("postal_code"),
    countryCode: text("country_code"),
    mapUrl: text("map_url"),
    directions: text("directions"),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    timezone: text("timezone").notNull().default("Asia/Manila"),
    currency: text("currency").notNull().default("PHP"),
    priceRange: text("price_range"),
    logoUrl: text("logo_url"),
    defaultOgImageUrl: text("default_og_image_url"),
    ...timestamps,
  },
  (t) => [check("site_settings_singleton", sql`${t.id} = 1`)],
);

export const openingHours = pgTable(
  "opening_hours",
  {
    // 0 = Sunday … 6 = Saturday (matches JS Date#getDay and schema.org ordering helpers)
    dayOfWeek: smallint("day_of_week").primaryKey(),
    isClosed: boolean("is_closed").notNull().default(false),
    opensAt: time("opens_at"),
    closesAt: time("closes_at"),
    ...timestamps,
  },
  (t) => [
    check("opening_hours_day_range", sql`${t.dayOfWeek} between 0 and 6`),
    check(
      "opening_hours_times_present",
      sql`${t.isClosed} or (${t.opensAt} is not null and ${t.closesAt} is not null)`,
    ),
  ],
);

export const specialHours = pgTable(
  "special_hours",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    label: text("label").notNull(),
    isClosed: boolean("is_closed").notNull().default(true),
    opensAt: time("opens_at"),
    closesAt: time("closes_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("special_hours_date_key").on(t.date),
    check(
      "special_hours_times_present",
      sql`${t.isClosed} or (${t.opensAt} is not null and ${t.closesAt} is not null)`,
    ),
  ],
);

export const navLinks = pgTable(
  "nav_links",
  {
    id: serial("id").primaryKey(),
    location: navLocation("location").notNull(),
    label: text("label").notNull(),
    href: text("href").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("nav_links_location_order_idx").on(t.location, t.sortOrder)],
);

export const socialLinks = pgTable("social_links", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  ...timestamps,
});

/** Per-page copy and SEO metadata for fixed public routes (home, books, menu, …). */
export const pages = pgTable("pages", {
  slug: text("slug").primaryKey(),
  seoTitle: text("seo_title").notNull(),
  seoDescription: text("seo_description").notNull(),
  heading: text("heading").notNull(),
  intro: text("intro"),
  ogImageUrl: text("og_image_url"),
  noIndex: boolean("no_index").notNull().default(false),
  ...timestamps,
});

export const announcements = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body"),
    linkLabel: text("link_label"),
    linkUrl: text("link_url"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isPublished: boolean("is_published").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check(
      "announcements_window",
      sql`${t.startsAt} is null or ${t.endsAt} is null or ${t.endsAt} > ${t.startsAt}`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const books = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    category: text("category"),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    isAvailable: boolean("is_available").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("books_slug_key").on(t.slug),
    index("books_published_idx").on(t.isPublished, t.sortOrder),
    check("books_price_non_negative", sql`${t.price} is null or ${t.price} >= 0`),
  ],
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    category: text("category"),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    isAvailable: boolean("is_available").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("menu_items_slug_key").on(t.slug),
    index("menu_items_published_idx").on(t.isPublished, t.sortOrder),
    check("menu_items_price_non_negative", sql`${t.price} is null or ${t.price} >= 0`),
  ],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    isPublished: boolean("is_published").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("events_slug_key").on(t.slug),
    index("events_published_start_idx").on(t.isPublished, t.startsAt),
    check("events_window", sql`${t.endsAt} > ${t.startsAt}`),
  ],
);

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  ...timestamps,
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  ...timestamps,
});

export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    percentOff: integer("percent_off").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("coupons_code_key").on(t.code),
    check("coupons_code_upper", sql`${t.code} = upper(${t.code})`),
    check("coupons_percent_range", sql`${t.percentOff} between 1 and 100`),
  ],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("newsletter_subscribers_email_key").on(sql`lower(${t.email})`)],
);

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    passwordHash: text("password_hash").notNull(),
    role: adminRole("role").notNull().default("editor"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("admin_users_email_key").on(sql`lower(${t.email})`)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    // SHA-256 of the opaque session token; the raw token only ever lives in the cookie.
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (t) => [index("admin_sessions_user_idx").on(t.userId), index("admin_sessions_expiry_idx").on(t.expiresAt)],
);

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

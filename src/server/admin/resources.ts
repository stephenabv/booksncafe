import "server-only";
import { asc, desc, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import type { FieldDef } from "@/lib/admin-fields";
import { slugify } from "@/lib/slug";
import { zonedLocalToUtc } from "@/lib/timezone";
import {
  checkbox,
  dateField,
  httpsUrlField,
  imageUrlField,
  linkField,
  moneyField,
  optionalText,
  requiredText,
  slugField,
  sortOrderField,
  timeField,
} from "@/lib/validation";
import type { AdminRole } from "@/server/auth/roles";
import {
  announcements,
  books,
  coupons,
  events,
  faqs,
  menuItems,
  navLinks,
  socialLinks,
  specialHours,
  teamMembers,
} from "@/server/db/schema";

/**
 * Registry of record types editable through the generic admin CRUD screens.
 * Each entry declares its table, form fields, server-side validation schema,
 * list columns and the minimum role allowed to change it. Adding a new
 * content type means adding one entry here; routes and actions are generic.
 */

export interface SchemaContext {
  timeZone: string;
}

export type ColumnKind = "text" | "bool" | "money" | "datetime" | "date";

export interface ResourceDefinition {
  key: string;
  label: string;
  singular: string;
  description: string;
  minRole: AdminRole;
  table: PgTable;
  idColumn: PgColumn;
  fields: FieldDef[];
  schema: (ctx: SchemaContext) => z.ZodType<Record<string, unknown>>;
  /** Fills derived values (e.g. slug from title) after validation. */
  finalize?: (data: Record<string, unknown>) => Record<string, unknown>;
  listColumns: Array<{ key: string; label: string; kind?: ColumnKind }>;
  orderBy: SQL[];
  titleKey: string;
  /** Field names that carry a unique constraint, mapped to a friendly error. */
  uniqueFields?: Record<string, string>;
}

const datetimeField = (ctx: SchemaContext, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform((value, issue) => {
      const date = zonedLocalToUtc(value, ctx.timeZone);
      if (!date) {
        issue.addIssue({ code: "custom", message: "Enter a valid date and time." });
        return z.NEVER;
      }
      return date;
    });

const optionalDatetimeField = (ctx: SchemaContext) =>
  z
    .string()
    .trim()
    .transform((value, issue) => {
      if (value === "") return null;
      const date = zonedLocalToUtc(value, ctx.timeZone);
      if (!date) {
        issue.addIssue({ code: "custom", message: "Enter a valid date and time." });
        return z.NEVER;
      }
      return date;
    });

const withSlug = (source: string) => (data: Record<string, unknown>) => ({
  ...data,
  slug: (data.slug as string) || slugify(String(data[source] ?? "")),
});

const imageFields = (section = "Image"): FieldDef[] => [
  { name: "imageUrl", label: "Image URL", type: "image", section, help: "A site path like /images/photo.jpg or an https image URL from an approved host." },
  { name: "imageAlt", label: "Image description (alt text)", type: "text", maxLength: 200, section, help: "Describe the photo for screen readers and search engines." },
];

const publishFields = (extra: FieldDef[] = []): FieldDef[] => [
  ...extra,
  { name: "isPublished", label: "Published on the website", type: "checkbox", section: "Visibility" },
  { name: "sortOrder", label: "Sort order", type: "number", section: "Visibility", help: "Lower numbers appear first." },
];

export const RESOURCES: Record<string, ResourceDefinition> = {
  books: {
    key: "books",
    label: "Books",
    singular: "Book",
    description: "The book collection shown on /books and the homepage.",
    minRole: "editor",
    table: books,
    idColumn: books.id,
    titleKey: "title",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, maxLength: 200, section: "Details" },
      { name: "author", label: "Author", type: "text", required: true, maxLength: 200, section: "Details" },
      { name: "category", label: "Category", type: "text", maxLength: 60, section: "Details" },
      { name: "description", label: "Description", type: "textarea", maxLength: 2000, section: "Details" },
      { name: "price", label: "Price (₱, VAT inclusive)", type: "money", section: "Details", help: "Leave empty if the book is not for sale online." },
      { name: "slug", label: "URL slug", type: "slug", maxLength: 80, section: "Details", help: "Used in /books/<slug>. Generated from the title when empty. Changing it changes the page address." },
      ...imageFields(),
      ...publishFields([
        { name: "isAvailable", label: "Available (not checked out)", type: "checkbox", section: "Visibility" },
        { name: "isFeatured", label: "Feature on the homepage", type: "checkbox", section: "Visibility" },
      ]),
    ],
    schema: () =>
      z.object({
        title: requiredText(200, "Title"),
        author: requiredText(200, "Author"),
        category: optionalText(60),
        description: optionalText(2000),
        price: moneyField,
        slug: slugField,
        imageUrl: imageUrlField,
        imageAlt: optionalText(200),
        isAvailable: checkbox,
        isFeatured: checkbox,
        isPublished: checkbox,
        sortOrder: sortOrderField,
      }),
    finalize: withSlug("title"),
    listColumns: [
      { key: "title", label: "Title" },
      { key: "author", label: "Author" },
      { key: "price", label: "Price", kind: "money" },
      { key: "isAvailable", label: "Available", kind: "bool" },
      { key: "isPublished", label: "Published", kind: "bool" },
    ],
    orderBy: [asc(books.sortOrder), asc(books.title)],
    uniqueFields: { slug: "Another book already uses this URL slug." },
  },

  menu: {
    key: "menu",
    label: "Menu items",
    singular: "Menu item",
    description: "Drinks and food on /menu. Featured items also appear on the homepage.",
    minRole: "editor",
    table: menuItems,
    idColumn: menuItems.id,
    titleKey: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, maxLength: 120, section: "Details" },
      { name: "category", label: "Category", type: "text", maxLength: 60, section: "Details", help: "Optional heading to group items, e.g. Coffee or Pastries." },
      { name: "description", label: "Description", type: "textarea", maxLength: 1000, section: "Details" },
      { name: "price", label: "Price (₱, VAT inclusive)", type: "money", section: "Details" },
      { name: "slug", label: "Identifier", type: "slug", maxLength: 80, section: "Details", help: "Generated from the name when empty." },
      ...imageFields(),
      ...publishFields([
        { name: "isAvailable", label: "Available today", type: "checkbox", section: "Visibility" },
        { name: "isFeatured", label: "Feature on the homepage", type: "checkbox", section: "Visibility" },
      ]),
    ],
    schema: () =>
      z.object({
        name: requiredText(120, "Name"),
        category: optionalText(60),
        description: optionalText(1000),
        price: moneyField,
        slug: slugField,
        imageUrl: imageUrlField,
        imageAlt: optionalText(200),
        isAvailable: checkbox,
        isFeatured: checkbox,
        isPublished: checkbox,
        sortOrder: sortOrderField,
      }),
    finalize: withSlug("name"),
    listColumns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "price", label: "Price", kind: "money" },
      { key: "isAvailable", label: "Available", kind: "bool" },
      { key: "isPublished", label: "Published", kind: "bool" },
    ],
    orderBy: [asc(menuItems.category), asc(menuItems.sortOrder), asc(menuItems.name)],
    uniqueFields: { slug: "Another menu item already uses this identifier." },
  },

  events: {
    key: "events",
    label: "Events",
    singular: "Event",
    description: "Readings, workshops and gatherings on /events.",
    minRole: "editor",
    table: events,
    idColumn: events.id,
    titleKey: "title",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, maxLength: 200, section: "Details" },
      { name: "description", label: "Description", type: "textarea", maxLength: 4000, section: "Details" },
      { name: "location", label: "Location within the venue", type: "text", maxLength: 200, section: "Details" },
      { name: "startsAt", label: "Starts", type: "datetime", required: true, section: "Schedule", help: "In the business time zone set under Business details." },
      { name: "endsAt", label: "Ends", type: "datetime", required: true, section: "Schedule" },
      { name: "slug", label: "URL slug", type: "slug", maxLength: 80, section: "Details", help: "Used in /events/<slug>. Generated from the title and date when empty." },
      ...imageFields(),
      { name: "isPublished", label: "Published on the website", type: "checkbox", section: "Visibility" },
    ],
    schema: (ctx) =>
      z
        .object({
          title: requiredText(200, "Title"),
          description: optionalText(4000),
          location: optionalText(200),
          startsAt: datetimeField(ctx, "Start"),
          endsAt: datetimeField(ctx, "End"),
          slug: slugField,
          imageUrl: imageUrlField,
          imageAlt: optionalText(200),
          isPublished: checkbox,
        })
        .refine((d) => d.endsAt > d.startsAt, { path: ["endsAt"], message: "The end must be after the start." }),
    finalize: (data) => ({
      ...data,
      slug:
        (data.slug as string) ||
        slugify(`${String(data.title)} ${(data.startsAt as Date).toISOString().slice(0, 10)}`),
    }),
    listColumns: [
      { key: "title", label: "Title" },
      { key: "startsAt", label: "Starts", kind: "datetime" },
      { key: "isPublished", label: "Published", kind: "bool" },
    ],
    orderBy: [desc(events.startsAt)],
    uniqueFields: { slug: "Another event already uses this URL slug." },
  },

  announcements: {
    key: "announcements",
    label: "Announcements",
    singular: "Announcement",
    description: "A banner across the top of every public page. The first active one is shown.",
    minRole: "editor",
    table: announcements,
    idColumn: announcements.id,
    titleKey: "title",
    fields: [
      { name: "title", label: "Headline", type: "text", required: true, maxLength: 120, section: "Message" },
      { name: "body", label: "Details", type: "text", maxLength: 240, section: "Message" },
      { name: "linkLabel", label: "Link text", type: "text", maxLength: 40, section: "Message" },
      { name: "linkUrl", label: "Link address", type: "url", maxLength: 2048, section: "Message", placeholder: "/events" },
      { name: "startsAt", label: "Show from", type: "datetime", section: "Schedule", help: "Optional. Leave empty to show immediately." },
      { name: "endsAt", label: "Show until", type: "datetime", section: "Schedule", help: "Optional. Leave empty to show until unpublished." },
      ...publishFields(),
    ],
    schema: (ctx) =>
      z
        .object({
          title: requiredText(120, "Headline"),
          body: optionalText(240),
          linkLabel: optionalText(40),
          linkUrl: linkField.transform((v) => (v === "" ? null : v)),
          startsAt: optionalDatetimeField(ctx),
          endsAt: optionalDatetimeField(ctx),
          isPublished: checkbox,
          sortOrder: sortOrderField,
        })
        .refine((d) => !d.startsAt || !d.endsAt || d.endsAt > d.startsAt, {
          path: ["endsAt"],
          message: "“Show until” must be after “Show from”.",
        }),
    listColumns: [
      { key: "title", label: "Headline" },
      { key: "startsAt", label: "From", kind: "datetime" },
      { key: "endsAt", label: "Until", kind: "datetime" },
      { key: "isPublished", label: "Published", kind: "bool" },
    ],
    orderBy: [asc(announcements.sortOrder), desc(announcements.id)],
  },

  faqs: {
    key: "faqs",
    label: "FAQs",
    singular: "FAQ",
    description: "Questions and answers shown on the homepage (with FAQ structured data).",
    minRole: "editor",
    table: faqs,
    idColumn: faqs.id,
    titleKey: "question",
    fields: [
      { name: "question", label: "Question", type: "text", required: true, maxLength: 200, section: "Content" },
      { name: "answer", label: "Answer", type: "textarea", required: true, maxLength: 2000, section: "Content" },
      ...publishFields(),
    ],
    schema: () =>
      z.object({
        question: requiredText(200, "Question"),
        answer: requiredText(2000, "Answer"),
        isPublished: checkbox,
        sortOrder: sortOrderField,
      }),
    listColumns: [
      { key: "question", label: "Question" },
      { key: "isPublished", label: "Published", kind: "bool" },
    ],
    orderBy: [asc(faqs.sortOrder), asc(faqs.id)],
  },

  team: {
    key: "team",
    label: "Team",
    singular: "Team member",
    description: "People shown on the About page.",
    minRole: "editor",
    table: teamMembers,
    idColumn: teamMembers.id,
    titleKey: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, maxLength: 120, section: "Profile" },
      { name: "role", label: "Role", type: "text", required: true, maxLength: 120, section: "Profile" },
      { name: "bio", label: "Bio", type: "textarea", maxLength: 2000, section: "Profile" },
      { name: "imageUrl", label: "Photo URL", type: "image", section: "Profile" },
      ...publishFields(),
    ],
    schema: () =>
      z.object({
        name: requiredText(120, "Name"),
        role: requiredText(120, "Role"),
        bio: optionalText(2000),
        imageUrl: imageUrlField,
        isPublished: checkbox,
        sortOrder: sortOrderField,
      }),
    listColumns: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "isPublished", label: "Published", kind: "bool" },
    ],
    orderBy: [asc(teamMembers.sortOrder), asc(teamMembers.id)],
  },

  navigation: {
    key: "navigation",
    label: "Navigation links",
    singular: "Navigation link",
    description: "Links in the header menu and the footer.",
    minRole: "admin",
    table: navLinks,
    idColumn: navLinks.id,
    titleKey: "label",
    fields: [
      {
        name: "location",
        label: "Where",
        type: "select",
        required: true,
        options: [
          { value: "header", label: "Header menu" },
          { value: "footer", label: "Footer" },
        ],
      },
      { name: "label", label: "Link text", type: "text", required: true, maxLength: 40 },
      { name: "href", label: "Link address", type: "url", required: true, maxLength: 2048, placeholder: "/menu" },
      { name: "isVisible", label: "Visible", type: "checkbox" },
      { name: "sortOrder", label: "Sort order", type: "number", help: "Lower numbers appear first." },
    ],
    schema: () =>
      z.object({
        location: z.enum(["header", "footer"], { message: "Choose where the link appears." }),
        label: requiredText(40, "Link text"),
        href: linkField.refine((v) => v !== "", "Link address is required."),
        isVisible: checkbox,
        sortOrder: sortOrderField,
      }),
    listColumns: [
      { key: "location", label: "Where" },
      { key: "label", label: "Text" },
      { key: "href", label: "Address" },
      { key: "isVisible", label: "Visible", kind: "bool" },
    ],
    orderBy: [asc(navLinks.location), asc(navLinks.sortOrder), asc(navLinks.id)],
  },

  social: {
    key: "social",
    label: "Social links",
    singular: "Social link",
    description: "Profiles listed in the footer and in the business structured data (sameAs).",
    minRole: "admin",
    table: socialLinks,
    idColumn: socialLinks.id,
    titleKey: "platform",
    fields: [
      { name: "platform", label: "Platform name", type: "text", required: true, maxLength: 40, placeholder: "Facebook" },
      { name: "url", label: "Profile address", type: "url", required: true, maxLength: 2048, placeholder: "https://…" },
      { name: "isVisible", label: "Visible", type: "checkbox" },
      { name: "sortOrder", label: "Sort order", type: "number" },
    ],
    schema: () =>
      z.object({
        platform: requiredText(40, "Platform name"),
        url: httpsUrlField.refine((v) => v !== null, "Profile address is required."),
        isVisible: checkbox,
        sortOrder: sortOrderField,
      }),
    listColumns: [
      { key: "platform", label: "Platform" },
      { key: "url", label: "Address" },
      { key: "isVisible", label: "Visible", kind: "bool" },
    ],
    orderBy: [asc(socialLinks.sortOrder), asc(socialLinks.id)],
  },

  "special-hours": {
    key: "special-hours",
    label: "Holiday & special hours",
    singular: "Special hours entry",
    description: "One-off dates that override the weekly opening hours, such as holidays.",
    minRole: "editor",
    table: specialHours,
    idColumn: specialHours.id,
    titleKey: "label",
    fields: [
      { name: "date", label: "Date", type: "date", required: true },
      { name: "label", label: "Reason", type: "text", required: true, maxLength: 80, placeholder: "Christmas Day" },
      { name: "isClosed", label: "Closed all day", type: "checkbox" },
      { name: "opensAt", label: "Opens", type: "time", help: "Required unless closed all day." },
      { name: "closesAt", label: "Closes", type: "time" },
    ],
    schema: () =>
      z
        .object({
          date: dateField,
          label: requiredText(80, "Reason"),
          isClosed: checkbox,
          opensAt: timeField,
          closesAt: timeField,
        })
        .refine((d) => d.isClosed || (d.opensAt && d.closesAt), {
          path: ["opensAt"],
          message: "Enter opening and closing times, or tick “Closed all day”.",
        })
        .transform((d) => (d.isClosed ? { ...d, opensAt: null, closesAt: null } : d)),
    listColumns: [
      { key: "date", label: "Date", kind: "date" },
      { key: "label", label: "Reason" },
      { key: "isClosed", label: "Closed", kind: "bool" },
    ],
    orderBy: [desc(specialHours.date)],
    uniqueFields: { date: "There is already an entry for this date." },
  },

  coupons: {
    key: "coupons",
    label: "Coupons",
    singular: "Coupon",
    description: "Discount codes accepted in the cart. Codes are checked on the server.",
    minRole: "admin",
    table: coupons,
    idColumn: coupons.id,
    titleKey: "code",
    fields: [
      { name: "code", label: "Code", type: "text", required: true, maxLength: 32, help: "Letters, numbers and hyphens. Stored in upper case." },
      { name: "percentOff", label: "Percent off", type: "number", required: true },
      { name: "expiresAt", label: "Expires", type: "datetime", help: "Optional." },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
    schema: (ctx) =>
      z.object({
        code: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z0-9-]{3,32}$/, "Use 3–32 letters, numbers or hyphens."),
        percentOff: z.coerce.number().int("Must be a whole number.").min(1, "At least 1%.").max(100, "At most 100%."),
        expiresAt: optionalDatetimeField(ctx),
        isActive: checkbox,
      }),
    listColumns: [
      { key: "code", label: "Code" },
      { key: "percentOff", label: "% off" },
      { key: "expiresAt", label: "Expires", kind: "datetime" },
      { key: "isActive", label: "Active", kind: "bool" },
    ],
    orderBy: [asc(coupons.code)],
    uniqueFields: { code: "That code already exists." },
  },
};

export function getResource(key: string): ResourceDefinition | null {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key) ? RESOURCES[key]! : null;
}

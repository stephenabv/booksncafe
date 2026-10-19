"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { readFormValues, type ActionResult } from "@/lib/admin-fields";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH } from "@/lib/admin-routes";
import { isValidTimeZone } from "@/lib/timezone";
import { httpsUrlField, imageUrlField, optionalText, requiredText, timeField } from "@/lib/validation";
import { getResource } from "@/server/admin/resources";
import { deleteRecord, insertRecord, uniqueViolation, updateRecord, writeAudit } from "@/server/admin/records";
import { revalidatePublicSite } from "@/server/admin/revalidate";
import { PAGE_FIELDS, SETTINGS_FIELDS } from "@/server/admin/singletons";
import { fieldErrorsFrom } from "@/server/admin/zod-errors";
import { AuthorizationError, requireAdminAction } from "@/server/auth/guard";
import { getDummyHash, MAX_PASSWORD_LENGTH, verifyPassword } from "@/server/auth/password";
import { createSession, destroyCurrentSession } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { adminUsers, newsletterSubscribers, openingHours, pages, siteSettings } from "@/server/db/schema";
import { consumeRateLimit, resetRateLimit } from "@/server/rate-limit";
import { getSiteSettings } from "@/server/repositories/site";
import { clientIp, userAgent } from "@/server/request-context";

/**
 * Every exported function here is a public HTTP endpoint (Server Actions can
 * be invoked directly), so each one authorizes the caller itself before
 * touching data. CSRF protection comes from Next.js' Origin/Host check on
 * Server Actions plus SameSite=Lax session cookies.
 */

function failure(error: unknown, fallback: string): ActionResult {
  if (error instanceof AuthorizationError) return { ok: false, message: error.message };
  console.error(fallback, error);
  return { ok: false, message: `${fallback} Please try again.` };
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

const LOGIN_FAILED = "Incorrect email or password.";

export async function login(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: LOGIN_FAILED };
  const { email, password } = parsed.data;
  const db = getDb();
  const ip = await clientIp();

  try {
    const [byIp, byEmail] = await Promise.all([
      consumeRateLimit(db, `login:ip:${ip}`, 20, 15 * 60),
      consumeRateLimit(db, `login:email:${email}`, 5, 15 * 60),
    ]);
    if (!byIp.allowed || !byEmail.allowed) {
      return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
    }

    const [user] = await db
      .select({ id: adminUsers.id, passwordHash: adminUsers.passwordHash, isActive: adminUsers.isActive })
      .from(adminUsers)
      .where(sql`lower(${adminUsers.email}) = ${email}`)
      .limit(1);

    // Always run one hash verification so response time does not reveal whether the account exists.
    const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
    if (!user || !user.isActive || !valid) {
      await writeAudit(db, { userId: user?.id ?? null, action: "login_failed", entity: "admin_session", details: { ip } }).catch(() => undefined);
      return { ok: false, message: LOGIN_FAILED };
    }

    await resetRateLimit(db, `login:email:${email}`);
    await createSession(user.id, { ip, userAgent: await userAgent() });
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
    await writeAudit(db, { userId: user.id, action: "login", entity: "admin_session", details: { ip } });
  } catch (error) {
    return failure(error, "Sign-in failed.");
  }
  redirect(ADMIN_HOME_PATH);
}

export async function logout(): Promise<void> {
  await destroyCurrentSession();
  redirect(ADMIN_LOGIN_PATH);
}

// ---------------------------------------------------------------------------
// Generic registry resources
// ---------------------------------------------------------------------------

export async function saveRecord(resourceKey: string, id: number | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const resource = getResource(resourceKey);
  if (!resource) return { ok: false, message: "Unknown content type." };
  if (id !== null && (!Number.isInteger(id) || id <= 0)) return { ok: false, message: "Invalid record." };

  let savedId: number;
  try {
    const admin = await requireAdminAction(resource.minRole);
    const settings = await getSiteSettings();
    const parsed = resource.schema({ timeZone: settings.timezone }).safeParse(readFormValues(resource.fields, formData));
    if (!parsed.success) {
      return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
    }
    const data = resource.finalize ? resource.finalize(parsed.data) : parsed.data;
    const db = getDb();

    try {
      if (id === null) {
        savedId = await insertRecord(db, resource, data);
      } else {
        const found = await updateRecord(db, resource, id, data);
        if (!found) return { ok: false, message: "This record no longer exists. It may have been deleted." };
        savedId = id;
      }
    } catch (error) {
      const unique = uniqueViolation(error);
      if (unique && resource.uniqueFields) {
        const field = Object.keys(resource.uniqueFields).find((f) => unique.constraint.includes(f.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`))) ?? Object.keys(resource.uniqueFields)[0]!;
        return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: { [field]: resource.uniqueFields[field]! } };
      }
      throw error;
    }

    await writeAudit(db, { userId: admin.id, action: id === null ? "create" : "update", entity: resource.key, entityId: savedId });
    revalidatePublicSite();
  } catch (error) {
    return failure(error, `Could not save the ${resource.singular.toLowerCase()}.`);
  }
  redirect(`${ADMIN_HOME_PATH}/r/${resource.key}?saved=${savedId}`);
}

export async function deleteRecordAction(resourceKey: string, id: number): Promise<ActionResult> {
  const resource = getResource(resourceKey);
  if (!resource || !Number.isInteger(id) || id <= 0) return { ok: false, message: "Invalid request." };
  try {
    const admin = await requireAdminAction(resource.minRole);
    const db = getDb();
    const deleted = await deleteRecord(db, resource, id);
    if (!deleted) return { ok: false, message: "This record was already deleted." };
    await writeAudit(db, { userId: admin.id, action: "delete", entity: resource.key, entityId: id });
    revalidatePublicSite();
  } catch (error) {
    return failure(error, `Could not delete the ${resource.singular.toLowerCase()}.`);
  }
  redirect(`${ADMIN_HOME_PATH}/r/${resource.key}?deleted=1`);
}

// ---------------------------------------------------------------------------
// Business details (singleton)
// ---------------------------------------------------------------------------

const optionalNumberInRange = (min: number, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^-?\d{1,3}(\.\d{1,6})?$/.test(v) && Number(v) >= min && Number(v) <= max), `Enter a number between ${min} and ${max}.`)
    .transform((v) => (v === "" ? null : v))
    .nullable();

const settingsSchema = z.object({
  businessName: requiredText(120, "Business name"),
  tagline: optionalText(160),
  description: optionalText(500),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address.")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[+\d][\d\s()-]{5,24}$/.test(v), "Enter a phone number using digits, spaces, +, ( ) or -.")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  streetAddress: optionalText(200),
  locality: optionalText(100),
  region: optionalText(100),
  postalCode: optionalText(20),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-Z]{2}$/.test(v), "Use a two-letter country code such as PH.")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  mapUrl: httpsUrlField,
  directions: optionalText(1000),
  latitude: optionalNumberInRange(-90, 90),
  longitude: optionalNumberInRange(-180, 180),
  timezone: z.string().trim().refine(isValidTimeZone, "Enter an IANA time zone such as Asia/Manila."),
  priceRange: optionalText(10),
  defaultOgImageUrl: imageUrlField,
});

export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdminAction("admin");
    const parsed = settingsSchema.safeParse(readFormValues(SETTINGS_FIELDS, formData));
    if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
    const db = getDb();
    await db
      .insert(siteSettings)
      .values({ id: 1, ...parsed.data })
      .onConflictDoUpdate({ target: siteSettings.id, set: parsed.data });
    await writeAudit(db, { userId: admin.id, action: "update", entity: "site_settings", entityId: 1 });
    revalidatePublicSite();
    return { ok: true, message: "Business details saved. The website has been updated." };
  } catch (error) {
    return failure(error, "Could not save business details.");
  }
}

// ---------------------------------------------------------------------------
// Weekly opening hours
// ---------------------------------------------------------------------------

const dayHoursSchema = z
  .object({ day: z.number().int().min(0).max(6), listed: z.boolean(), isClosed: z.boolean(), opensAt: timeField, closesAt: timeField })
  .refine((d) => !d.listed || d.isClosed || (d.opensAt && d.closesAt), {
    path: ["opensAt"],
    message: "Enter opening and closing times, or mark the day closed.",
  });

export async function saveOpeningHours(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdminAction("editor");
    const fieldErrors: Record<string, string> = {};
    const days: Array<z.infer<typeof dayHoursSchema>> = [];
    for (let day = 0; day <= 6; day += 1) {
      const parsed = dayHoursSchema.safeParse({
        day,
        listed: formData.get(`listed-${day}`) === "on",
        isClosed: formData.get(`closed-${day}`) === "on",
        opensAt: String(formData.get(`opens-${day}`) ?? ""),
        closesAt: String(formData.get(`closes-${day}`) ?? ""),
      });
      if (!parsed.success) fieldErrors[`day-${day}`] = parsed.error.issues[0]?.message ?? "Invalid hours.";
      else days.push(parsed.data);
    }
    if (Object.keys(fieldErrors).length > 0) return { ok: false, message: "Please correct the highlighted days.", fieldErrors };

    const db = getDb();
    await db.transaction(async (tx) => {
      for (const d of days) {
        if (!d.listed) {
          await tx.delete(openingHours).where(eq(openingHours.dayOfWeek, d.day));
          continue;
        }
        const values = { isClosed: d.isClosed, opensAt: d.isClosed ? null : d.opensAt, closesAt: d.isClosed ? null : d.closesAt };
        await tx
          .insert(openingHours)
          .values({ dayOfWeek: d.day, ...values })
          .onConflictDoUpdate({ target: openingHours.dayOfWeek, set: values });
      }
    });
    await writeAudit(db, { userId: admin.id, action: "update", entity: "opening_hours" });
    revalidatePublicSite();
    return { ok: true, message: "Opening hours saved. The website has been updated." };
  } catch (error) {
    return failure(error, "Could not save opening hours.");
  }
}

// ---------------------------------------------------------------------------
// Page copy & SEO
// ---------------------------------------------------------------------------

const pageSchema = z.object({
  heading: requiredText(160, "Heading"),
  intro: optionalText(3000),
  seoTitle: requiredText(70, "Search title"),
  seoDescription: requiredText(300, "Search description"),
  ogImageUrl: imageUrlField,
  noIndex: z.boolean(),
});

export async function savePage(slug: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdminAction("editor");
    const parsed = pageSchema.safeParse(readFormValues(PAGE_FIELDS, formData));
    if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
    const db = getDb();
    const rows = await db.update(pages).set(parsed.data).where(eq(pages.slug, slug)).returning({ slug: pages.slug });
    if (rows.length === 0) return { ok: false, message: "Unknown page." };
    await writeAudit(db, { userId: admin.id, action: "update", entity: "pages", entityId: slug });
    revalidatePublicSite();
    return { ok: true, message: "Page saved. The website has been updated." };
  } catch (error) {
    return failure(error, "Could not save the page.");
  }
}

// ---------------------------------------------------------------------------
// Newsletter subscribers
// ---------------------------------------------------------------------------

export async function deleteSubscriber(id: number): Promise<ActionResult> {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Invalid request." };
  try {
    const admin = await requireAdminAction("admin");
    const db = getDb();
    const rows = await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id)).returning({ id: newsletterSubscribers.id });
    if (rows.length === 0) return { ok: false, message: "This subscriber was already removed." };
    await writeAudit(db, { userId: admin.id, action: "delete", entity: "newsletter_subscribers", entityId: id });
    return { ok: true, message: "Subscriber removed." };
  } catch (error) {
    return failure(error, "Could not remove the subscriber.");
  }
}

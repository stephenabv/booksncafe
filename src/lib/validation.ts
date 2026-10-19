import { z } from "zod";
import { ALLOWED_IMAGE_HOSTS } from "./site-config";
import { SLUG_PATTERN } from "./slug";

/**
 * Shared field validators for admin input. Every admin write is validated on
 * the server with these schemas; client-side checks are only a convenience.
 */

/** Empty form strings become null so optional columns store NULL, not "". */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters.`)
    .transform((v) => (v === "" ? null : v))
    .nullable();

export const requiredText = (max: number, label = "This field") =>
  z.string().trim().min(1, `${label} is required.`).max(max, `Must be at most ${max} characters.`);

export const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .refine((v) => v === "" || SLUG_PATTERN.test(v), "Use lowercase letters, numbers and single hyphens only.");

export const moneyField = z
  .string()
  .trim()
  .transform((v) => v.replace(/[,₱\s]/g, ""))
  .refine((v) => v === "" || /^\d{1,8}(\.\d{1,2})?$/.test(v), "Enter an amount like 150 or 150.50.")
  .transform((v) => (v === "" ? null : Number(v).toFixed(2)))
  .nullable();

export const sortOrderField = z.coerce.number().int("Must be a whole number.").min(-10000).max(10000).default(0);

function isSafeRelativePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

/** Image references: site-relative paths or https URLs on an allow-listed host. */
export const imageUrlField = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    if (v === "") return true;
    if (isSafeRelativePath(v)) return true;
    try {
      const url = new URL(v);
      return url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.includes(url.hostname.toLowerCase());
    } catch {
      return false;
    }
  }, `Use a site path like /images/photo.jpg or an https image URL from: ${ALLOWED_IMAGE_HOSTS.join(", ")}.`)
  .transform((v) => (v === "" ? null : v))
  .nullable();

/** Links shown on the site: site-relative paths or http(s) URLs. Blocks javascript: and data: URLs. */
export const linkField = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    if (v === "" || isSafeRelativePath(v)) return true;
    try {
      const url = new URL(v);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Use a site path like /menu or a full https:// address.");

export const httpsUrlField = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    if (v === "") return true;
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a full https:// address.")
  .transform((v) => (v === "" ? null : v))
  .nullable();

export const timeField = z
  .string()
  .trim()
  .refine((v) => v === "" || /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v), "Enter a time like 08:00.")
  .transform((v) => (v === "" ? null : v.slice(0, 5)))
  .nullable();

export const dateField = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date.");

export const checkbox = z.boolean().default(false);

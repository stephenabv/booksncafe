/**
 * Build-time public configuration. Values here are safe to expose to the browser.
 */
const DEFAULT_SITE_URL = "http://localhost:3000";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // Vercel exposes the production hostname on every deployment; fall back to it
  // so canonical URLs never point at ephemeral preview hosts.
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return `https://${vercelProduction}`;
  return DEFAULT_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();

/** Hosts that next/image and the admin image fields accept for remote images. */
export const ALLOWED_IMAGE_HOSTS: readonly string[] = [
  "images.unsplash.com",
  ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
];

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

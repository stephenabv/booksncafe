import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  // Only the production deployment should be indexed; previews stay private.
  // The admin is intentionally not listed: robots.txt is public, so naming it
  // here would advertise its address. Admin pages send noindex headers instead.
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  return {
    rules: isProduction ? [{ userAgent: "*", allow: "/", disallow: ["/cart"] }] : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

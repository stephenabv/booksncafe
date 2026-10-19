import "server-only";
import type { Metadata } from "next";
import { getPage, getSiteSettings } from "@/server/repositories/site";

const DEFAULT_OG_IMAGE = "/images/og-default.jpg";

interface PageMetadataOptions {
  /** Key of the `pages` record holding editable SEO copy. */
  slug: string;
  path: string;
  fallbackTitle: string;
  fallbackDescription: string;
  /** Use the title verbatim instead of applying the "%s | Books ’n Cafe" template. */
  absoluteTitle?: boolean;
}

/** Metadata for fixed public routes, sourced from the editable `pages` table. */
export async function buildPageMetadata(options: PageMetadataOptions): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage(options.slug), getSiteSettings()]);
  const title = page?.seoTitle ?? options.fallbackTitle;
  const description = page?.seoDescription ?? options.fallbackDescription;
  const image = page?.ogImageUrl ?? settings.defaultOgImageUrl ?? DEFAULT_OG_IMAGE;
  return {
    title: options.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: options.path },
    robots: page?.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: options.path,
      siteName: settings.businessName,
      title,
      description,
      images: [{ url: image }],
      locale: "en_PH",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** Metadata for detail pages (books, events) whose copy comes from the record itself. */
export async function buildDetailMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
}): Promise<Metadata> {
  const settings = await getSiteSettings();
  const image = input.image ?? settings.defaultOgImageUrl ?? DEFAULT_OG_IMAGE;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: "website",
      url: input.path,
      siteName: settings.businessName,
      title: input.title,
      description: input.description,
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: [image] },
  };
}

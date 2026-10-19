import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-config";
import { getPage, listPublishedBookSlugs, listPublishedEvents } from "@/server/repositories/site";

export const revalidate = 3600;

const STATIC_ROUTES: Array<{ slug: string; path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { slug: "home", path: "/", priority: 1, changeFrequency: "weekly" },
  { slug: "books", path: "/books", priority: 0.9, changeFrequency: "weekly" },
  { slug: "menu", path: "/menu", priority: 0.9, changeFrequency: "monthly" },
  { slug: "events", path: "/events", priority: 0.8, changeFrequency: "weekly" },
  { slug: "about", path: "/about", priority: 0.6, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, events, pageRecords] = await Promise.all([
    listPublishedBookSlugs(),
    listPublishedEvents(),
    Promise.all(STATIC_ROUTES.map((r) => getPage(r.slug))),
  ]);

  const staticEntries = STATIC_ROUTES.filter((_, i) => !pageRecords[i]?.noIndex).map((route, i) => ({
    url: absoluteUrl(route.path),
    lastModified: pageRecords[i]?.updatedAt,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  return [
    ...staticEntries,
    ...books.map((b) => ({ url: absoluteUrl(`/books/${b.slug}`), lastModified: b.updatedAt, priority: 0.7 })),
    ...events.map((e) => ({ url: absoluteUrl(`/events/${e.slug}`), lastModified: e.updatedAt, priority: 0.6 })),
  ];
}

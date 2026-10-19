import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ADMIN_HOME_PATH } from "@/lib/admin-routes";
import { requireAdminPage } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { books, events, menuItems, newsletterSubscribers, openingHours, socialLinks } from "@/server/db/schema";
import { getSiteSettings } from "@/server/repositories/site";

export const metadata: Metadata = { title: "Overview" };

type SearchParams = Promise<{ denied?: string }>;

export default async function AdminHome({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdminPage("editor");
  const { denied } = await searchParams;
  const db = getDb();
  const total = async (table: typeof books | typeof menuItems | typeof events, published = false) => {
    const q = db.select({ n: count() }).from(table);
    const [row] = await (published ? q.where(eq(table.isPublished, true)) : q);
    return row?.n ?? 0;
  };
  const [settings, bookTotal, bookPublished, menuTotal, menuPublished, eventTotal, eventPublished, [hours], [social], [subs]] = await Promise.all([
    getSiteSettings(),
    total(books),
    total(books, true),
    total(menuItems),
    total(menuItems, true),
    total(events),
    total(events, true),
    db.select({ n: count() }).from(openingHours),
    db.select({ n: count() }).from(socialLinks),
    db.select({ n: count() }).from(newsletterSubscribers),
  ]);

  const missing = [
    !settings.streetAddress && "Street address",
    !settings.locality && "City",
    !settings.phone && "Phone number",
    !settings.email && "Email address",
    !settings.mapUrl && "Map link",
    (hours?.n ?? 0) === 0 && "Opening hours",
    (social?.n ?? 0) === 0 && "Social media links",
  ].filter(Boolean) as string[];

  const cards = [
    { label: "Books", value: `${bookPublished} / ${bookTotal}`, hint: "published / total", href: `${ADMIN_HOME_PATH}/r/books` },
    { label: "Menu items", value: `${menuPublished} / ${menuTotal}`, hint: "published / total", href: `${ADMIN_HOME_PATH}/r/menu` },
    { label: "Events", value: `${eventPublished} / ${eventTotal}`, hint: "published / total", href: `${ADMIN_HOME_PATH}/r/events` },
    { label: "Subscribers", value: String(subs?.n ?? 0), hint: "newsletter sign-ups", href: `${ADMIN_HOME_PATH}/subscribers` },
  ];

  return (
    <>
      <AdminPageTitle title={`Welcome${admin.displayName ? `, ${admin.displayName}` : ""}`} description="Manage the information customers see on the Books ’n Cafe website." />
      {denied && (
        <p role="alert" className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          Your account doesn’t have permission to open that page.
        </p>
      )}
      {missing.length > 0 && (
        <section aria-labelledby="missing" className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 id="missing" className="font-semibold text-amber-900">
            Business information still missing
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            Customers and search engines can’t see these yet. Sections without data stay hidden on the public site.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {missing.map((m) => (
              <li key={m} className="rounded-full bg-white px-3 py-1 text-sm text-amber-900 ring-1 ring-amber-300">
                {m}
              </li>
            ))}
          </ul>
          {admin.role === "admin" && (
            <Link href={`${ADMIN_HOME_PATH}/settings`} className="mt-4 inline-block text-sm font-semibold text-amber-900 underline">
              Add business details
            </Link>
          )}
        </section>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.filter((c) => c.href !== `${ADMIN_HOME_PATH}/subscribers` || admin.role === "admin").map((c) => (
          <li key={c.label}>
            <Link href={c.href} className="block rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-400">
              <p className="text-sm text-stone-500">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold">{c.value}</p>
              <p className="text-xs text-stone-500">{c.hint}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

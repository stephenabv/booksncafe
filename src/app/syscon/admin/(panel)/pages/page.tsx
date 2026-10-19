import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ADMIN_HOME_PATH } from "@/lib/admin-routes";
import { EDITABLE_PAGES } from "@/server/admin/singletons";
import { requireAdminPage } from "@/server/auth/guard";
import { getPage } from "@/server/repositories/site";

export const metadata: Metadata = { title: "Pages & SEO" };

export default async function PagesIndex() {
  await requireAdminPage("editor");
  const records = await Promise.all(EDITABLE_PAGES.map((p) => getPage(p.slug)));
  return (
    <>
      <AdminPageTitle title="Pages & SEO" description="Headings, introductions and the titles and descriptions search engines show for each page." />
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {EDITABLE_PAGES.map((p, i) => (
          <li key={p.slug}>
            <Link href={`${ADMIN_HOME_PATH}/pages/${p.slug}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50">
              <span>
                <span className="font-medium">{p.label}</span>
                <span className="ml-2 text-sm text-stone-500">{p.path}</span>
                <span className="block text-sm text-stone-600">{records[i]?.seoTitle ?? "Not set up yet"}</span>
              </span>
              <span className="text-sm font-semibold text-amber-700">Edit</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

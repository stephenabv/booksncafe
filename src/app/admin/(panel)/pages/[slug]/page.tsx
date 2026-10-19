import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ResourceForm } from "@/components/admin/resource-form";
import { savePage } from "@/server/actions/admin";
import { toFormValues } from "@/server/admin/records";
import { EDITABLE_PAGES, PAGE_FIELDS } from "@/server/admin/singletons";
import { requireAdminPage } from "@/server/auth/guard";
import { getPage, getSiteSettings } from "@/server/repositories/site";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPage({ params }: { params: Params }) {
  const { slug } = await params;
  const meta = EDITABLE_PAGES.find((p) => p.slug === slug);
  if (!meta) notFound();
  await requireAdminPage("editor");
  const [page, settings] = await Promise.all([getPage(slug), getSiteSettings()]);
  if (!page) notFound();

  return (
    <>
      <AdminPageTitle
        title={meta.label}
        back={{ href: "/admin/pages", label: "Pages & SEO" }}
        actions={
          <a href={meta.path} target="_blank" rel="noopener" className="text-sm font-semibold text-amber-700 underline">
            View page
          </a>
        }
      />
      <ResourceForm fields={PAGE_FIELDS} initialValues={toFormValues(PAGE_FIELDS, page, settings.timezone)} action={savePage.bind(null, slug)} submitLabel="Save page" />
    </>
  );
}

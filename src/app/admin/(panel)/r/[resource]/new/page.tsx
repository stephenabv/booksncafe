import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ResourceForm } from "@/components/admin/resource-form";
import { saveRecord } from "@/server/actions/admin";
import { toFormValues } from "@/server/admin/records";
import { getResource } from "@/server/admin/resources";
import { requireAdminPage } from "@/server/auth/guard";
import { getSiteSettings } from "@/server/repositories/site";

type Params = Promise<{ resource: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resource = getResource((await params).resource);
  return { title: resource ? `New ${resource.singular.toLowerCase()}` : "Not found" };
}

export default async function NewRecordPage({ params }: { params: Params }) {
  const resource = getResource((await params).resource);
  if (!resource) notFound();
  await requireAdminPage(resource.minRole);
  const settings = await getSiteSettings();

  return (
    <>
      <AdminPageTitle title={`New ${resource.singular.toLowerCase()}`} back={{ href: `/admin/r/${resource.key}`, label: resource.label }} />
      <ResourceForm
        fields={resource.fields}
        initialValues={toFormValues(resource.fields, null, settings.timezone)}
        action={saveRecord.bind(null, resource.key, null)}
        submitLabel={`Create ${resource.singular.toLowerCase()}`}
        cancelHref={`/admin/r/${resource.key}`}
      />
    </>
  );
}

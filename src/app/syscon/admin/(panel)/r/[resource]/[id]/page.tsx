import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ResourceForm } from "@/components/admin/resource-form";
import { ADMIN_HOME_PATH } from "@/lib/admin-routes";
import { saveRecord } from "@/server/actions/admin";
import { getRecord, toFormValues } from "@/server/admin/records";
import { getResource } from "@/server/admin/resources";
import { requireAdminPage } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { getSiteSettings } from "@/server/repositories/site";
import { DeleteRecordButton } from "./delete-record-button";

type Params = Promise<{ resource: string; id: string }>;

export const metadata: Metadata = { title: "Edit" };

const PUBLIC_PATHS: Record<string, (row: Record<string, unknown>) => string | null> = {
  books: (r) => (r.isPublished ? `/books/${String(r.slug)}` : null),
  events: (r) => (r.isPublished ? `/events/${String(r.slug)}` : null),
  menu: (r) => (r.isPublished ? "/menu" : null),
};

export default async function EditRecordPage({ params }: { params: Params }) {
  const { resource: key, id: rawId } = await params;
  const resource = getResource(key);
  const id = Number(rawId);
  if (!resource || !Number.isInteger(id) || id <= 0) notFound();
  await requireAdminPage(resource.minRole);

  const [row, settings] = await Promise.all([getRecord(getDb(), resource, id), getSiteSettings()]);
  if (!row) notFound();
  const title = String(row[resource.titleKey] ?? resource.singular);
  const publicPath = PUBLIC_PATHS[resource.key]?.(row) ?? null;

  return (
    <>
      <AdminPageTitle
        title={title}
        back={{ href: `${ADMIN_HOME_PATH}/r/${resource.key}`, label: resource.label }}
        actions={
          publicPath ? (
            <a href={publicPath} target="_blank" rel="noopener" className="text-sm font-semibold text-amber-700 underline">
              View on website
            </a>
          ) : undefined
        }
      />
      <ResourceForm
        fields={resource.fields}
        initialValues={toFormValues(resource.fields, row, settings.timezone)}
        action={saveRecord.bind(null, resource.key, id)}
        submitLabel="Save changes"
        cancelHref={`${ADMIN_HOME_PATH}/r/${resource.key}`}
        secondaryActions={<DeleteRecordButton resourceKey={resource.key} id={id} title={title} singular={resource.singular} />}
      />
    </>
  );
}

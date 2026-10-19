import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cell } from "@/components/admin/cell";
import { AdminPageTitle, Flash } from "@/components/admin/page-title";
import { ADMIN_HOME_PATH } from "@/lib/admin-routes";
import { listRecords } from "@/server/admin/records";
import { getResource } from "@/server/admin/resources";
import { requireAdminPage } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { getSiteSettings } from "@/server/repositories/site";

type Params = Promise<{ resource: string }>;
type SearchParams = Promise<{ saved?: string; deleted?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: getResource((await params).resource)?.label ?? "Not found" };
}

export default async function ResourceListPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const resource = getResource((await params).resource);
  if (!resource) notFound();
  await requireAdminPage(resource.minRole);
  const [rows, settings, flags] = await Promise.all([listRecords(getDb(), resource), getSiteSettings(), searchParams]);
  const flash = flags.saved ? `${resource.singular} saved. The website has been updated.` : flags.deleted ? `${resource.singular} deleted.` : null;

  return (
    <>
      <AdminPageTitle
        title={resource.label}
        description={resource.description}
        actions={
          <Link href={`${ADMIN_HOME_PATH}/r/${resource.key}/new`} className="inline-flex min-h-11 items-center rounded-full bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-700">
            Add {resource.singular.toLowerCase()}
          </Link>
        }
      />
      <Flash message={flash} />
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
          <p className="font-medium">No {resource.label.toLowerCase()} yet.</p>
          <Link href={`${ADMIN_HOME_PATH}/r/${resource.key}/new`} className="mt-2 inline-block text-sm font-semibold text-amber-700 underline">
            Add the first one
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                {resource.listColumns.map((c) => (
                  <th key={c.key} scope="col" className="px-4 py-3 font-semibold">
                    {c.label}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((row) => {
                const id = Number(row.id);
                const highlight = flags.saved === String(id);
                return (
                  <tr key={id} className={highlight ? "bg-emerald-50/60" : "hover:bg-stone-50"}>
                    {resource.listColumns.map((c, i) => (
                      <td key={c.key} className="max-w-xs truncate px-4 py-3">
                        {i === 0 ? (
                          <Link href={`${ADMIN_HOME_PATH}/r/${resource.key}/${id}`} className="font-medium text-stone-900 hover:underline">
                            <Cell value={row[c.key]} kind={c.kind} timeZone={settings.timezone} />
                          </Link>
                        ) : (
                          <Cell value={row[c.key]} kind={c.kind} timeZone={settings.timezone} />
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <Link href={`${ADMIN_HOME_PATH}/r/${resource.key}/${id}`} className="text-sm font-semibold text-amber-700 hover:underline" aria-label={`Edit ${String(row[resource.titleKey])}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminPageTitle } from "@/components/admin/page-title";
import { requireAdminPage } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { newsletterSubscribers } from "@/server/db/schema";
import { RemoveSubscriberButton } from "./remove-subscriber-button";

export const metadata: Metadata = { title: "Newsletter subscribers" };

export default async function SubscribersPage() {
  await requireAdminPage("admin");
  const rows = await getDb().select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(1000);
  return (
    <>
      <AdminPageTitle
        title="Newsletter subscribers"
        description="Emails collected by the footer sign-up form. Treat this list as personal data: export it only to send the newsletter, and remove people who ask to unsubscribe."
        actions={
          rows.length > 0 ? (
            // A file download from a Route Handler needs a full request, not client-side navigation.
            <a href="/admin/subscribers/export" download className="inline-flex min-h-11 items-center rounded-full border border-stone-300 bg-white px-5 text-sm font-semibold hover:bg-stone-50">
              Download CSV
            </a>
          ) : undefined
        }
      />
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-stone-600">No subscribers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Subscribed</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{r.createdAt.toLocaleDateString("en-PH", { dateStyle: "medium" })}</td>
                  <td className="px-4 py-3 text-right">
                    <RemoveSubscriberButton id={r.id} email={r.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

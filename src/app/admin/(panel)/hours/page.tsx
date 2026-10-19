import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/page-title";
import { requireAdminPage } from "@/server/auth/guard";
import { getOpeningHours } from "@/server/repositories/site";
import { HoursForm } from "./hours-form";

export const metadata: Metadata = { title: "Opening hours" };

export default async function HoursPage() {
  await requireAdminPage("editor");
  const hours = await getOpeningHours();
  return (
    <>
      <AdminPageTitle
        title="Opening hours"
        description="Regular weekly hours. Days you leave unlisted are not shown on the website. For holidays and one-off changes use Holiday hours."
        actions={
          <Link href="/admin/r/special-hours" className="text-sm font-semibold text-amber-700 underline">
            Holiday hours
          </Link>
        }
      />
      <HoursForm hours={hours.map((h) => ({ ...h, opensAt: h.opensAt?.slice(0, 5) ?? "", closesAt: h.closesAt?.slice(0, 5) ?? "" }))} />
    </>
  );
}

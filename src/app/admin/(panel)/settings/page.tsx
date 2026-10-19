import type { Metadata } from "next";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ResourceForm } from "@/components/admin/resource-form";
import { saveSettings } from "@/server/actions/admin";
import { toFormValues } from "@/server/admin/records";
import { SETTINGS_FIELDS } from "@/server/admin/singletons";
import { requireAdminPage } from "@/server/auth/guard";
import { getSiteSettings } from "@/server/repositories/site";

export const metadata: Metadata = { title: "Business details" };

export default async function SettingsPage() {
  await requireAdminPage("admin");
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageTitle
        title="Business details"
        description="Name, contact information and location. Empty fields stay hidden on the website and are left out of search-engine data."
      />
      <ResourceForm fields={SETTINGS_FIELDS} initialValues={toFormValues(SETTINGS_FIELDS, settings, settings.timezone)} action={saveSettings} submitLabel="Save business details" />
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminThemeToggle } from "@/components/admin/theme-toggle";
import { ADMIN_HOME_PATH } from "@/lib/admin-routes";
import { getCurrentAdmin } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect(ADMIN_HOME_PATH);
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <AdminThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Books ’n Cafe admin</h1>
        <p className="mt-1 text-sm text-stone-600">Sign in to manage the website.</p>
        <LoginForm />
      </div>
    </div>
  );
}

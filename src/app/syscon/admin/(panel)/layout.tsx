import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNavLink } from "@/components/admin/admin-nav";
import { AdminThemeToggle } from "@/components/admin/theme-toggle";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH } from "@/lib/admin-routes";
import { ADMIN_NAV } from "@/server/admin/navigation";
import { logout } from "@/server/actions/admin";
import { hasRole } from "@/server/auth/roles";
import { getCurrentAdmin } from "@/server/auth/session";

/**
 * Admin chrome. This layout redirects anonymous visitors for convenience, but
 * it is NOT the security boundary: every page and Server Action re-checks the
 * session and role itself.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect(ADMIN_LOGIN_PATH);

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-stone-200 bg-white lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <Link href={ADMIN_HOME_PATH} className="whitespace-nowrap font-display text-lg font-semibold leading-tight">
            Books ’n Cafe <span className="block text-sm font-sans font-normal text-stone-500">Admin</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" className="whitespace-nowrap text-xs text-stone-500 underline hover:text-stone-800" target="_blank">
              View site
            </Link>
            <AdminThemeToggle />
          </div>
        </div>
        <details className="group px-3 pb-4 lg:open" open>
          <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-stone-600 lg:hidden">Menu</summary>
          <nav aria-label="Admin" className="space-y-5 pt-2">
            <AdminNavLink href={ADMIN_HOME_PATH} label="Overview" exact />
            {ADMIN_NAV.map((group) => {
              const items = group.items.filter((i) => hasRole(admin.role, i.minRole));
              if (items.length === 0) return null;
              return (
                <div key={group.heading}>
                  <p className="px-3 text-xs font-semibold uppercase tracking-wider text-stone-400">{group.heading}</p>
                  <ul className="mt-1 space-y-0.5">
                    {items.map((item) => (
                      <li key={item.href}>
                        <AdminNavLink href={item.href} label={item.label} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </details>
        <div className="border-t border-stone-200 px-5 py-4 text-sm">
          <p className="truncate font-medium">{admin.displayName ?? admin.email}</p>
          <p className="text-xs capitalize text-stone-500">{admin.role}</p>
          <form action={logout} className="mt-3">
            <button type="submit" className="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:bg-stone-100">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main id="admin-main" className="min-w-0 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

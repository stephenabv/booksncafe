"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** `exact` stops a parent link (the overview) from looking active on every child page. */
export function AdminNavLink({ href, label, exact = false }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || (!exact && pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-lg px-3 py-2 text-sm ${active ? "bg-stone-900 font-semibold text-white" : "text-stone-700 hover:bg-stone-200"}`}
    >
      {label}
    </Link>
  );
}

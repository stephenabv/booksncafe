"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
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

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Books ’n Cafe" },
  robots: { index: false, follow: false, nocache: true },
};

// Admin pages read the session cookie and must never be statically cached.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-stone-100 font-sans text-stone-900">{children}</div>;
}

import type { AdminRole } from "@/server/auth/roles";

export interface AdminNavItem {
  href: string;
  label: string;
  minRole: AdminRole;
}

export const ADMIN_NAV: Array<{ heading: string; items: AdminNavItem[] }> = [
  {
    heading: "Business",
    items: [
      { href: "/admin/settings", label: "Business details", minRole: "admin" },
      { href: "/admin/hours", label: "Opening hours", minRole: "editor" },
      { href: "/admin/r/special-hours", label: "Holiday hours", minRole: "editor" },
    ],
  },
  {
    heading: "Website content",
    items: [
      { href: "/admin/pages", label: "Pages & SEO", minRole: "editor" },
      { href: "/admin/r/announcements", label: "Announcements", minRole: "editor" },
      { href: "/admin/r/faqs", label: "FAQs", minRole: "editor" },
      { href: "/admin/r/team", label: "Team", minRole: "editor" },
      { href: "/admin/r/navigation", label: "Navigation", minRole: "admin" },
      { href: "/admin/r/social", label: "Social links", minRole: "admin" },
    ],
  },
  {
    heading: "Catalog",
    items: [
      { href: "/admin/r/books", label: "Books", minRole: "editor" },
      { href: "/admin/r/menu", label: "Menu items", minRole: "editor" },
      { href: "/admin/r/events", label: "Events", minRole: "editor" },
      { href: "/admin/r/coupons", label: "Coupons", minRole: "admin" },
    ],
  },
  {
    heading: "Audience",
    items: [{ href: "/admin/subscribers", label: "Newsletter subscribers", minRole: "admin" }],
  },
];

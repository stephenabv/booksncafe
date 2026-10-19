import { ADMIN_HOME_PATH } from "@/lib/admin-routes";
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
      { href: `${ADMIN_HOME_PATH}/settings`, label: "Business details", minRole: "admin" },
      { href: `${ADMIN_HOME_PATH}/hours`, label: "Opening hours", minRole: "editor" },
      { href: `${ADMIN_HOME_PATH}/r/special-hours`, label: "Holiday hours", minRole: "editor" },
    ],
  },
  {
    heading: "Website content",
    items: [
      { href: `${ADMIN_HOME_PATH}/pages`, label: "Pages & SEO", minRole: "editor" },
      { href: `${ADMIN_HOME_PATH}/r/announcements`, label: "Announcements", minRole: "editor" },
      { href: `${ADMIN_HOME_PATH}/r/faqs`, label: "FAQs", minRole: "editor" },
      { href: `${ADMIN_HOME_PATH}/r/team`, label: "Team", minRole: "editor" },
      { href: `${ADMIN_HOME_PATH}/r/navigation`, label: "Navigation", minRole: "admin" },
      { href: `${ADMIN_HOME_PATH}/r/social`, label: "Social links", minRole: "admin" },
    ],
  },
  {
    heading: "Catalog",
    items: [
      { href: `${ADMIN_HOME_PATH}/r/books`, label: "Books", minRole: "editor" },
      { href: `${ADMIN_HOME_PATH}/r/menu`, label: "Menu items", minRole: "editor" },
      { href: `${ADMIN_HOME_PATH}/r/events`, label: "Events", minRole: "editor" },
      { href: `${ADMIN_HOME_PATH}/r/coupons`, label: "Coupons", minRole: "admin" },
    ],
  },
  {
    heading: "Audience",
    items: [{ href: `${ADMIN_HOME_PATH}/subscribers`, label: "Newsletter subscribers", minRole: "admin" }],
  },
];

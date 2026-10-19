import { ThemeToggle } from "@/components/site/theme-toggle";

/** The site's light/dark switch, coloured for the admin's stone surfaces. */
export function AdminThemeToggle() {
  return <ThemeToggle className="text-stone-600 hover:bg-stone-100 hover:text-stone-900" />;
}

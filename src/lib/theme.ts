/** Colour theme for the site and admin, persisted per browser. */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "bnc-theme";

/**
 * Runs inline in <head> before first paint so the stored (or system) theme is
 * applied without a flash of the wrong colours. Kept dependency-free and
 * wrapped in try/catch because storage can be unavailable (private mode).
 */
export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t}catch(e){d.dataset.theme="light"}})();`;

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

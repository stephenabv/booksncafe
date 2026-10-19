"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { isTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : "light";
}

const SITE_HEADER_STYLE = "text-paper-100 hover:bg-paper-50/10 hover:text-amber-brand-light";

/**
 * Light/dark switch. The current theme lives on <html data-theme>, set before
 * paint. Styled for the dark site header by default; pass `className` to
 * restyle its colours for another surface (e.g. the admin).
 */
export function ThemeToggle({ className = SITE_HEADER_STYLE }: { className?: string }) {
  // Null during SSR: the theme is only known in the browser.
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice then lasts for this page view only.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex size-11 items-center justify-center rounded-full transition-colors ${className}`}
      aria-label={theme ? `Switch to ${next} mode` : "Toggle colour theme"}
      title={theme ? `Switch to ${next} mode` : undefined}
    >
      {theme === "dark" ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
    </button>
  );
}

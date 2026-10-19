"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

/** Distance scrolled before the overlay header turns solid. */
const SOLID_AFTER_PX = 24;

function subscribe(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const isScrolled = () => window.scrollY > SOLID_AFTER_PX;

/**
 * Sticky header shell. On the homepage it starts transparent over the
 * full-screen hero (which is pulled up beneath it) and turns solid once the
 * visitor scrolls; elsewhere it is always solid.
 */
export function HeaderFrame({ children }: { children: React.ReactNode }) {
  const overlay = usePathname() === "/";
  const scrolled = useSyncExternalStore(subscribe, isScrolled, () => false);
  const clear = overlay && !scrolled;

  return (
    <header
      data-clear={clear || undefined}
      className={`sticky top-0 z-40 text-paper-50 transition-[background-color,box-shadow] duration-300 ${
        clear
          ? "bg-gradient-to-b from-night-950/60 to-transparent"
          : "bg-night-900/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-night-900/85"
      }`}
    >
      {children}
    </header>
  );
}

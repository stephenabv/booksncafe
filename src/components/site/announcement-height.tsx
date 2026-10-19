"use client";

import { useEffect } from "react";

/**
 * Publishes the announcement bar's rendered height as --announcement-h on the
 * site wrapper, so the full-screen hero can subtract it and end exactly at the
 * bottom of the screen even when the announcement wraps onto two lines.
 * globals.css supplies a one-line estimate until this runs.
 */
export function AnnouncementHeight() {
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>("[data-announcement]");
    const scope = bar?.closest<HTMLElement>(".site-theme");
    if (!bar || !scope) return;
    const update = () => scope.style.setProperty("--announcement-h", `${bar.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      scope.style.removeProperty("--announcement-h");
    };
  }, []);
  return null;
}

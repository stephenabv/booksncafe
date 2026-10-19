import Link from "next/link";
import type { Announcement } from "@/server/repositories/site";

export function AnnouncementBar({ items }: { items: Announcement[] }) {
  const first = items[0];
  if (!first) return null;
  const external = first.linkUrl ? /^https?:\/\//.test(first.linkUrl) : false;
  return (
    <aside aria-label="Announcement" className="bg-amber-brand text-night-950">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-sm">
        <strong className="font-semibold">{first.title}</strong>
        {first.body && <span>{first.body}</span>}
        {first.linkUrl && (
          <Link
            href={first.linkUrl}
            className="font-semibold underline underline-offset-4"
            {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
          >
            {first.linkLabel ?? "Learn more"}
          </Link>
        )}
      </div>
    </aside>
  );
}

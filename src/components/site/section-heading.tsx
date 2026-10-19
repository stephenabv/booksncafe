import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, action, id }: { eyebrow?: string; title: ReactNode; action?: { href: string; label: string }; id?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className="mt-1 text-3xl font-semibold text-espresso-900 sm:text-4xl">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="link text-sm">
          {action.label}
        </Link>
      )}
    </div>
  );
}

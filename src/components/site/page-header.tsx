import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

export function PageHeader({ title, intro, crumbs, children }: { title: string; intro?: string | null; crumbs: Crumb[]; children?: ReactNode }) {
  return (
    <div className="border-b border-cream-200 bg-cream-100/70">
      <div className="container-page py-10 sm:py-14">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-espresso-700">{intro}</p>}
        {children}
      </div>
    </div>
  );
}

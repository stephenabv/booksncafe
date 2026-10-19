import { EmptyState, MenuItemCard } from "@/components/site/cards";
import { PageHeader } from "@/components/site/page-header";
import { getPage, getSiteSettings, listPublishedMenuItems, type MenuItem } from "@/server/repositories/site";
import { buildPageMetadata } from "@/server/seo";

export const revalidate = 300;

export function generateMetadata() {
  return buildPageMetadata({ slug: "menu", path: "/menu", fallbackTitle: "Cafe Menu", fallbackDescription: "The Books ’n Cafe menu." });
}

function groupByCategory(items: MenuItem[]): Array<[string, MenuItem[]]> {
  const groups = new Map<string, MenuItem[]>();
  for (const item of items) {
    const key = item.category ?? "";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
}

export default async function MenuPage() {
  const [content, settings, items] = await Promise.all([getPage("menu"), getSiteSettings(), listPublishedMenuItems()]);
  const groups = groupByCategory(items);

  return (
    <>
      <PageHeader
        title={content?.heading ?? "Cafe Menu"}
        intro={content?.intro}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Cafe Menu", path: "/menu" },
        ]}
      />
      <div className="container-page space-y-14 py-10">
        {items.length === 0 && <EmptyState title="Our menu is being updated">Please check back soon.</EmptyState>}
        {groups.map(([category, groupItems]) => (
          <section key={category || "menu"} aria-labelledby={`cat-${category || "menu"}`}>
            <h2 id={`cat-${category || "menu"}`} className={category ? "mb-6 text-2xl font-semibold" : "sr-only"}>
              {category || "Menu items"}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {groupItems.map((item) => (
                <MenuItemCard key={item.id} item={item} currency={settings.currency} />
              ))}
            </div>
          </section>
        ))}
        {items.length > 0 && <p className="text-sm text-espresso-600">Prices are in Philippine pesos and include VAT.</p>}
      </div>
    </>
  );
}

import { PageHeader } from "@/components/site/page-header";
import { getPage } from "@/server/repositories/site";
import { buildPageMetadata } from "@/server/seo";
import { CartView } from "./cart-view";

export const revalidate = 300;

export async function generateMetadata() {
  const meta = await buildPageMetadata({ slug: "cart", path: "/cart", fallbackTitle: "Your Cart", fallbackDescription: "Your cart." });
  // A per-visitor cart has no value in search results.
  return { ...meta, robots: { index: false, follow: true } };
}

export default async function CartPage() {
  const content = await getPage("cart");
  return (
    <>
      <PageHeader
        title={content?.heading ?? "Your Cart"}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Cart", path: "/cart" },
        ]}
      />
      <div className="container-page min-h-[28rem] py-10">
        {/* Reserved height keeps the footer from jumping while the stored cart loads. */}
        <CartView />
      </div>
    </>
  );
}

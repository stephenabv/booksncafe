import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { AvailabilityBadge } from "@/components/site/cards";
import { CatalogImage } from "@/components/site/catalog-image";
import { JsonLd } from "@/components/site/json-ld";
import { formatPrice } from "@/lib/money";
import { bookJsonLd } from "@/lib/structured-data";
import { getBookBySlug, getSiteSettings, listPublishedBookSlugs } from "@/server/repositories/site";
import { buildDetailMetadata } from "@/server/seo";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const rows = await listPublishedBookSlugs();
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const book = await getBookBySlug((await params).slug);
  if (!book) return { title: "Book not found", robots: { index: false } };
  return buildDetailMetadata({
    title: `${book.title} by ${book.author}`,
    description: book.description ?? `${book.title} by ${book.author}, available at Books ’n Cafe.`,
    path: `/books/${book.slug}`,
    image: book.imageUrl,
  });
}

export default async function BookPage({ params }: { params: Params }) {
  const [book, settings] = await Promise.all([getBookBySlug((await params).slug), getSiteSettings()]);
  if (!book) notFound();
  const price = formatPrice(book.price, settings.currency);

  return (
    <div className="container-page py-10">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Books", path: "/books" },
          { name: book.title, path: `/books/${book.slug}` },
        ]}
      />
      <article className="mt-8 grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <CatalogImage
          src={book.imageUrl}
          alt={book.imageAlt ?? `Photo for ${book.title}`}
          kind="book"
          sizes="(min-width: 768px) 40vw, 100vw"
          className="aspect-[3/4] rounded-2xl"
          priority
        />
        <div>
          {book.category && <p className="eyebrow">{book.category}</p>}
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{book.title}</h1>
          <p className="mt-2 text-lg text-espresso-700">by {book.author}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {price && <p className="text-2xl font-semibold text-amber-ink">{price}</p>}
            <AvailabilityBadge available={book.isAvailable} />
          </div>
          {book.description && <p className="mt-6 max-w-prose text-lg leading-relaxed text-espresso-800">{book.description}</p>}
          <div className="mt-8 max-w-xs">
            <AddToCartButton
              type="book"
              id={book.id}
              name={book.title}
              disabled={!book.isAvailable || !book.price}
              disabledLabel={!book.isAvailable ? "Checked out" : "Ask in store"}
            />
          </div>
          <p className="mt-8">
            <Link href="/books" className="link">
              ← Back to all books
            </Link>
          </p>
        </div>
      </article>
      <JsonLd data={bookJsonLd(book, settings.currency)} />
    </div>
  );
}

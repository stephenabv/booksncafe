import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { BookCard, EmptyState } from "@/components/site/cards";
import { PageHeader } from "@/components/site/page-header";
import { Pagination } from "@/components/site/pagination";
import { getBookCategories, getPage, getSiteSettings, searchBooks } from "@/server/repositories/site";
import { buildPageMetadata } from "@/server/seo";

const PAGE_SIZE = 12;

const querySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().trim().max(60).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const meta = await buildPageMetadata({
    slug: "books",
    path: "/books",
    fallbackTitle: "Books Collection",
    fallbackDescription: "Browse the Books ’n Cafe collection.",
  });
  const params = await searchParams;
  // Filtered and paginated variants canonicalise to the main listing and stay out of the index.
  const filtered = Object.keys(params).length > 0;
  return filtered ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function BooksPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = querySchema.parse({ q: first(raw.q), category: first(raw.category), page: first(raw.page) });
  const page = query.page ?? 1;

  const [content, settings, categories, result] = await Promise.all([
    getPage("books"),
    getSiteSettings(),
    getBookCategories(),
    searchBooks({ q: query.q, category: query.category, page, pageSize: PAGE_SIZE }),
  ]);

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.category) params.set("category", query.category);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/books?${qs}` : "/books";
  };
  const isFiltered = Boolean(query.q || query.category);

  return (
    <>
      <PageHeader
        title={content?.heading ?? "Books Collection"}
        intro={content?.intro}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Books", path: "/books" },
        ]}
      />
      <div className="container-page py-10">
        <form role="search" action="/books" method="get" className="grid gap-3 rounded-2xl border border-cream-200 bg-white p-4 sm:grid-cols-[1fr_220px_auto] sm:items-end">
          <div>
            <label htmlFor="book-q" className="mb-1 block text-sm font-medium">
              Search by title or author
            </label>
            <input id="book-q" name="q" type="search" defaultValue={query.q} maxLength={100} className="field" placeholder="e.g. Austen" />
          </div>
          <div>
            <label htmlFor="book-category" className="mb-1 block text-sm font-medium">
              Category
            </label>
            <select id="book-category" name="category" defaultValue={query.category ?? ""} className="field">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              Search
            </button>
            {isFiltered && (
              <Link href="/books" className="btn-secondary">
                Clear
              </Link>
            )}
          </div>
        </form>

        <p className="mt-6 text-sm text-espresso-700" role="status">
          {result.total} {result.total === 1 ? "book" : "books"}
          {isFiltered ? " match your search" : " in the collection"}
        </p>

        {result.items.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No books found">
              Try a different title or author, or <Link href="/books" className="link">view the whole collection</Link>.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((book) => (
              <BookCard key={book.id} book={book} currency={settings.currency} />
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={result.pageCount} hrefFor={hrefFor} />
      </div>
    </>
  );
}

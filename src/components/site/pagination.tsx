import Link from "next/link";

/** Crawlable prev/next pagination built from plain links. */
export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="btn-secondary" rel="prev">
          Previous
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-50" aria-disabled="true">
          Previous
        </span>
      )}
      <span className="text-sm text-espresso-700">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className="btn-secondary" rel="next">
          Next
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-50" aria-disabled="true">
          Next
        </span>
      )}
    </nav>
  );
}

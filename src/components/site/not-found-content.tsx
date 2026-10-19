import Link from "next/link";

export function NotFoundContent() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">This page isn’t on our shelves</h1>
      <p className="mt-4 max-w-md text-espresso-700">
        The page you’re looking for doesn’t exist or has moved. Perhaps you’d like to browse our books or grab a cup of coffee instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/books" className="btn-secondary">
          Browse books
        </Link>
        <Link href="/menu" className="btn-secondary">
          Cafe menu
        </Link>
      </div>
    </div>
  );
}

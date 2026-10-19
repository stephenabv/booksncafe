import Link from "next/link";

export function AdminPageTitle({ title, description, back, actions }: { title: string; description?: string; back?: { href: string; label: string }; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link href={back.href} className="text-sm text-stone-500 hover:text-stone-800">
            ← {back.label}
          </Link>
        )}
        <h1 className="mt-1 font-display text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-stone-600">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Flash({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
      {message}
    </p>
  );
}

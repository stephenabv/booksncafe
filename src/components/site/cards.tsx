import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { EVENT_STATUS_LABEL, formatEventDateRange, getEventStatus } from "@/lib/events";
import { formatPrice } from "@/lib/money";
import type { Book, EventRecord, MenuItem } from "@/server/repositories/site";
import { AddToCartButton } from "./add-to-cart-button";
import { CatalogImage } from "./catalog-image";

const GRID_SIZES = "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw";

export function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        available ? "bg-leaf/10 text-leaf" : "bg-berry/10 text-berry"
      }`}
    >
      {available ? "Available" : "Checked out"}
    </span>
  );
}

export function BookCard({ book, currency, headingLevel = "h2" }: { book: Book; currency: string; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const price = formatPrice(book.price, currency);
  return (
    <article className="card group flex flex-col">
      <Link href={`/books/${book.slug}`} tabIndex={-1} aria-hidden>
        <CatalogImage src={book.imageUrl} alt="" kind="book" sizes={GRID_SIZES} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2 text-xs">
          {book.category ? <span className="eyebrow">{book.category}</span> : <span />}
          <AvailabilityBadge available={book.isAvailable} />
        </div>
        <Heading className="text-lg font-semibold leading-snug">
          <Link href={`/books/${book.slug}`} className="hover:text-amber-ink focus-visible:text-amber-ink">
            {book.title}
          </Link>
        </Heading>
        <p className="text-sm text-espresso-600">{book.author}</p>
        {price && <p className="font-semibold text-amber-ink">{price}</p>}
        <div className="mt-auto pt-3">
          <AddToCartButton
            type="book"
            id={book.id}
            name={book.title}
            disabled={!book.isAvailable || !book.price}
            disabledLabel={!book.isAvailable ? "Checked out" : "Ask in store"}
          />
        </div>
      </div>
    </article>
  );
}

export function MenuItemCard({ item, currency }: { item: MenuItem; currency: string }) {
  const price = formatPrice(item.price, currency);
  return (
    <article className="card group flex flex-col">
      <CatalogImage src={item.imageUrl} alt={item.imageAlt ?? item.name} kind="menu" sizes={GRID_SIZES} />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          {price && <span className="shrink-0 font-semibold text-amber-ink">{price}</span>}
        </div>
        {item.description && <p className="text-sm leading-relaxed text-espresso-700">{item.description}</p>}
        <div className="mt-auto pt-3">
          <AddToCartButton
            type="menu"
            id={item.id}
            name={item.name}
            disabled={!item.isAvailable || !item.price}
            disabledLabel={!item.isAvailable ? "Sold out today" : "Ask at the counter"}
          />
        </div>
      </div>
    </article>
  );
}

export function EventCard({ event, timeZone, now }: { event: EventRecord; timeZone: string; now: Date }) {
  const status = getEventStatus(event.startsAt, event.endsAt, now);
  return (
    <article className="card group flex flex-col">
      <Link href={`/events/${event.slug}`} tabIndex={-1} aria-hidden>
        <CatalogImage src={event.imageUrl} alt="" kind="event" sizes={GRID_SIZES} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span
          className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            status === "past" ? "bg-cream-200 text-espresso-700" : "bg-amber-brand/20 text-amber-ink"
          }`}
        >
          {EVENT_STATUS_LABEL[status]}
        </span>
        <h3 className="text-lg font-semibold leading-snug">
          <Link href={`/events/${event.slug}`} className="hover:text-amber-ink">
            {event.title}
          </Link>
        </h3>
        <p className="flex items-start gap-2 text-sm text-espresso-700">
          <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-ink" />
          <time dateTime={event.startsAt.toISOString()}>{formatEventDateRange(event.startsAt, event.endsAt, timeZone)}</time>
        </p>
        {event.location && (
          <p className="flex items-start gap-2 text-sm text-espresso-700">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-ink" />
            {event.location}
          </p>
        )}
        {event.description && <p className="line-clamp-3 text-sm text-espresso-700">{event.description}</p>}
      </div>
    </article>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-100/60 px-6 py-12 text-center">
      <p className="font-display text-xl font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-espresso-700">{children}</div>}
    </div>
  );
}

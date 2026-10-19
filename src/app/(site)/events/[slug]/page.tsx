import { CalendarDays, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { CatalogImage } from "@/components/site/catalog-image";
import { JsonLd } from "@/components/site/json-ld";
import { EVENT_STATUS_LABEL, formatEventDateRange, getEventStatus } from "@/lib/events";
import { eventJsonLd } from "@/lib/structured-data";
import { getEventBySlug, getSiteSettings, listPublishedEvents } from "@/server/repositories/site";
import { buildDetailMetadata } from "@/server/seo";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await listPublishedEvents()).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const event = await getEventBySlug((await params).slug);
  if (!event) return { title: "Event not found", robots: { index: false } };
  return buildDetailMetadata({
    title: event.title,
    description: event.description ?? `${event.title} at Books ’n Cafe.`,
    path: `/events/${event.slug}`,
    image: event.imageUrl,
  });
}

export default async function EventPage({ params }: { params: Params }) {
  const [event, settings] = await Promise.all([getEventBySlug((await params).slug), getSiteSettings()]);
  if (!event) notFound();
  const status = getEventStatus(event.startsAt, event.endsAt);

  return (
    <div className="container-page py-10">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Events", path: "/events" },
          { name: event.title, path: `/events/${event.slug}` },
        ]}
      />
      <article className="mt-8 grid gap-10 lg:grid-cols-2">
        <CatalogImage
          src={event.imageUrl}
          alt={event.imageAlt ?? `Photo for ${event.title}`}
          kind="event"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/3] rounded-2xl"
          priority
        />
        <div>
          <p className="eyebrow">{EVENT_STATUS_LABEL[status]}</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{event.title}</h1>
          <p className="mt-6 flex items-start gap-2 text-espresso-800">
            <CalendarDays aria-hidden className="mt-1 size-5 shrink-0 text-amber-ink" />
            <time dateTime={event.startsAt.toISOString()}>{formatEventDateRange(event.startsAt, event.endsAt, settings.timezone)}</time>
          </p>
          {event.location && (
            <p className="mt-2 flex items-start gap-2 text-espresso-800">
              <MapPin aria-hidden className="mt-1 size-5 shrink-0 text-amber-ink" />
              {event.location}
            </p>
          )}
          {event.description && <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-espresso-800">{event.description}</p>}
          <p className="mt-8">
            <Link href="/events" className="link">
              ← Back to all events
            </Link>
          </p>
        </div>
      </article>
      <JsonLd data={eventJsonLd(event, settings)} />
    </div>
  );
}

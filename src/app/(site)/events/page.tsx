import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, EventCard } from "@/components/site/cards";
import { PageHeader } from "@/components/site/page-header";
import { getEventStatus } from "@/lib/events";
import { getPage, getSiteSettings, listPublishedEvents } from "@/server/repositories/site";
import { buildPageMetadata } from "@/server/seo";

export const revalidate = 300;

export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    slug: "events",
    path: "/events",
    fallbackTitle: "Events & Gatherings",
    fallbackDescription: "Events at Books ’n Cafe.",
  });
}

export default async function EventsPage() {
  const [content, settings, all] = await Promise.all([getPage("events"), getSiteSettings(), listPublishedEvents()]);
  const now = new Date();
  const current = all.filter((e) => getEventStatus(e.startsAt, e.endsAt, now) !== "past");
  const past = all.filter((e) => getEventStatus(e.startsAt, e.endsAt, now) === "past").reverse().slice(0, 12);

  return (
    <>
      <PageHeader
        title={content?.heading ?? "Events & Gatherings"}
        intro={content?.intro}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Events", path: "/events" },
        ]}
      />
      <div className="container-page space-y-16 py-10">
        <section aria-labelledby="upcoming">
          <h2 id="upcoming" className="mb-6 text-2xl font-semibold">
            Upcoming & happening now
          </h2>
          {current.length === 0 ? (
            <EmptyState title="No upcoming events right now">
              New readings and gatherings are announced here first. You can also{" "}
              <Link href="#newsletter-email" className="link">
                subscribe for updates
              </Link>
              .
            </EmptyState>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {current.map((e) => (
                <EventCard key={e.id} event={e} timeZone={settings.timezone} now={now} />
              ))}
            </div>
          )}
        </section>
        {past.length > 0 && (
          <section aria-labelledby="past">
            <h2 id="past" className="mb-6 text-2xl font-semibold">
              Past events
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => (
                <EventCard key={e.id} event={e} timeZone={settings.timezone} now={now} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

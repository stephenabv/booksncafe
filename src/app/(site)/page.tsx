import { ChevronDown, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import banner from "@/assets/banner.webp";
import { BookCard, EventCard, MenuItemCard } from "@/components/site/cards";
import { HoursTable } from "@/components/site/hours-table";
import { JsonLd } from "@/components/site/json-ld";
import { SectionHeading } from "@/components/site/section-heading";
import { resolveToday } from "@/lib/hours";
import { faqJsonLd } from "@/lib/structured-data";
import {
  getOpeningHours,
  getPage,
  getSiteSettings,
  getUpcomingSpecialHours,
  listFeaturedBooks,
  listFeaturedMenuItems,
  listPublishedFaqs,
  listUpcomingEvents,
} from "@/server/repositories/site";
import { buildPageMetadata } from "@/server/seo";

export const revalidate = 300;

export function generateMetadata() {
  return buildPageMetadata({
    slug: "home",
    path: "/",
    fallbackTitle: "Books ’n Cafe | Books, Coffee & Cozy Reading Space",
    fallbackDescription: "A cozy place where books and coffee come together.",
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const [page, settings, hours, special, featuredBooks, menuHighlights, upcoming, faqs] = await Promise.all([
    getPage("home"),
    getSiteSettings(),
    getOpeningHours(),
    getUpcomingSpecialHours(),
    listFeaturedBooks(4),
    listFeaturedMenuItems(3),
    listUpcomingEvents(3),
    listPublishedFaqs(),
  ]);
  const today = resolveToday(hours, special, settings.timezone);
  const address = [settings.streetAddress, settings.locality, settings.region].filter(Boolean).join(", ");
  const hasVisitInfo = Boolean(address || hours.length > 0 || settings.directions);
  const now = new Date();

  return (
    <>
      {/* Full-screen hero: pulled up 4rem (-mt-16) beneath the transparent sticky header so it fills the viewport. */}
      <section className="relative isolate flex -mt-16 min-h-svh items-end overflow-hidden bg-night-950 text-paper-50">
        <Image
          src={banner}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          quality={80}
          className="-z-10 object-cover object-center"
        />
        {/* Two scrims keep the copy legible over the bright illustration: bottom-up everywhere, left-to-right from sm. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950/95 via-night-950/50 to-night-950/10" aria-hidden />
        <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-night-950/85 via-night-950/35 to-transparent sm:block" aria-hidden />
        <div className="container-page w-full pb-20 pt-32 sm:pb-24">
          <div className="max-w-3xl motion-safe:animate-fade-up">
            {settings.tagline && <p className="eyebrow text-amber-brand-light">{settings.tagline}</p>}
            <h1 className="mt-3 text-5xl font-semibold leading-[1.05] sm:text-7xl">{page?.heading ?? settings.businessName}</h1>
            {page?.intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper-100 sm:text-xl">{page.intro}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/books" className="btn-primary">
                Explore books
              </Link>
              <Link href="/menu" className="btn-on-dark">
                View cafe menu
              </Link>
            </div>
            {today && (
              <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-paper-50/10 px-4 py-2 text-sm">
                <Clock aria-hidden className="size-4 text-amber-brand-light" />
                <span className="font-semibold">{today.isOpen ? "Open now" : "Closed now"}</span>
                <span className="text-paper-200">· {today.label}</span>
                {today.note && <span className="text-paper-200">({today.note})</span>}
              </p>
            )}
          </div>
        </div>
        <a
          href="#home-content"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-medium uppercase tracking-widest text-paper-200 hover:text-amber-brand-light sm:flex"
        >
          Scroll
          <ChevronDown aria-hidden className="size-5 motion-safe:animate-bounce" />
        </a>
      </section>

      <div id="home-content" className="scroll-mt-16" />

      {featuredBooks.length > 0 && (
        <section aria-labelledby="featured-books" className="container-page pt-20">
          <SectionHeading id="featured-books" eyebrow="From our shelves" title="Featured books" action={{ href: "/books", label: "Browse the full collection" }} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} currency={settings.currency} headingLevel="h3" />
            ))}
          </div>
        </section>
      )}

      {menuHighlights.length > 0 && (
        <section aria-labelledby="menu-highlights" className="container-page pt-20">
          <SectionHeading id="menu-highlights" eyebrow="At the counter" title="Cafe favorites" action={{ href: "/menu", label: "See the full menu" }} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {menuHighlights.map((item) => (
              <MenuItemCard key={item.id} item={item} currency={settings.currency} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-events" className="container-page pt-20">
          <SectionHeading id="upcoming-events" eyebrow="Join us" title="Upcoming events" action={{ href: "/events", label: "All events" }} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} timeZone={settings.timezone} now={now} />
            ))}
          </div>
        </section>
      )}

      {hasVisitInfo && (
        <section aria-labelledby="visit-us" className="container-page pt-20">
          <div className="grid gap-8 rounded-3xl bg-cream-100 p-8 sm:p-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Visit us</p>
              <h2 id="visit-us" className="mt-1 text-3xl font-semibold sm:text-4xl">
                Find {settings.businessName}
              </h2>
              {address && (
                <p className="mt-4 flex gap-2 text-espresso-800">
                  <MapPin aria-hidden className="mt-1 size-5 shrink-0 text-amber-ink" />
                  <span>{address}</span>
                </p>
              )}
              {settings.directions && <p className="mt-4 whitespace-pre-line leading-relaxed text-espresso-700">{settings.directions}</p>}
              {settings.mapUrl && (
                <a href={settings.mapUrl} className="btn-primary mt-6" rel="noopener noreferrer" target="_blank">
                  Get directions
                </a>
              )}
            </div>
            {hours.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold">Opening hours</h3>
                <div className="mt-4">
                  <HoursTable hours={hours} special={special} />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section aria-labelledby="faq" className="container-page pt-20">
          <SectionHeading id="faq" eyebrow="Good to know" title="Frequently asked questions" />
          <div className="divide-y divide-cream-200 rounded-2xl border border-cream-200 bg-white">
            {faqs.map((f) => (
              <details key={f.id} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.question}
                  <span aria-hidden className="text-amber-ink transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 whitespace-pre-line text-espresso-700">{f.answer}</p>
              </details>
            ))}
          </div>
          <JsonLd data={faqJsonLd(faqs)} />
        </section>
      )}
    </>
  );
}

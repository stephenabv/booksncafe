import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { resolveToday } from "@/lib/hours";
import {
  getNavLinks,
  getOpeningHours,
  getSiteSettings,
  getSocialLinks,
  getUpcomingSpecialHours,
} from "@/server/repositories/site";
import { HoursTable } from "./hours-table";
import { NewsletterForm } from "./newsletter-form";

export async function SiteFooter() {
  const [settings, links, social, hours, special] = await Promise.all([
    getSiteSettings(),
    getNavLinks("footer"),
    getSocialLinks(),
    getOpeningHours(),
    getUpcomingSpecialHours(),
  ]);
  const address = [settings.streetAddress, settings.locality, settings.region, settings.postalCode].filter(Boolean).join(", ");
  const year = new Date().getFullYear();
  // Pages revalidate every few minutes, so "today" is at most that stale.
  const today = resolveToday(hours, special, settings.timezone);

  return (
    <footer className="mt-24 bg-night-950 text-paper-100">
      {/* Newsletter band: full width so the email field has room for a whole address. */}
      <div className="border-b border-paper-50/10">
        <div className="container-page grid gap-6 py-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center lg:gap-12">
          <div>
            <h2 className="font-display text-2xl font-semibold text-paper-50">Stay in the loop</h2>
            <p className="mt-2 text-sm text-paper-300">Get updates on new books, events, and coffee specials.</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,4fr)] lg:gap-12">
        <div className="space-y-3">
          <p className="font-display text-xl font-semibold text-paper-50">{settings.businessName}</p>
          {settings.tagline && <p className="text-sm text-paper-300">{settings.tagline}</p>}
          <ul className="space-y-2 text-sm">
            {address && (
              <li className="flex gap-2">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-brand" />
                {settings.mapUrl ? (
                  <a href={settings.mapUrl} className="hover:text-amber-brand-light hover:underline" rel="noopener noreferrer" target="_blank">
                    {address}
                  </a>
                ) : (
                  <span>{address}</span>
                )}
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-2">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-brand" />
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="hover:text-amber-brand-light hover:underline">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li className="flex min-w-0 gap-2">
                <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-brand" />
                <a href={`mailto:${settings.email}`} className="break-all hover:text-amber-brand-light hover:underline">
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-amber-brand">Explore</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {links.map((l) => (
              <li key={l.id}>
                <Link href={l.href} className="inline-block py-1 hover:text-amber-brand-light hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {social.length > 0 && (
            <>
              <h2 className="mt-6 font-sans text-sm font-semibold uppercase tracking-widest text-amber-brand">Follow us</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {social.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} rel="noopener noreferrer me" target="_blank" className="inline-block py-1 hover:text-amber-brand-light hover:underline">
                      {s.platform}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {hours.length > 0 && (
          // Native <details>: collapsible without JavaScript and announced as expandable by screen readers.
          <details className="group sm:col-span-2 lg:col-span-1">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-brand [&::-webkit-details-marker]:hidden">
              {/* <summary> only allows phrasing content alongside a heading, so the label is a span. */}
              <span>
                <span className="block font-sans text-sm font-semibold uppercase tracking-widest text-amber-brand">Opening hours</span>
                {today && (
                  <span className="mt-2 block text-sm text-paper-100">
                    {today.label}
                    {today.note && <span className="text-paper-300"> ({today.note})</span>}
                  </span>
                )}
                <span className="mt-1 block text-xs text-paper-300 group-open:hidden">Show all days</span>
                <span className="mt-1 hidden text-xs text-paper-300 group-open:block">Hide</span>
              </span>
              <ChevronDown aria-hidden className="mt-0.5 size-5 shrink-0 text-amber-brand transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3">
              <HoursTable hours={hours} special={special} tone="dark" />
            </div>
          </details>
        )}
      </div>
      <div className="border-t border-paper-50/10">
        <p className="container-page py-6 text-center text-xs text-paper-300">
          © {year} {settings.businessName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

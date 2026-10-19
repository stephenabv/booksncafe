import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
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

  return (
    <footer className="mt-24 bg-night-950 text-paper-100">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
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
              <li className="flex gap-2">
                <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-brand" />
                <a href={`mailto:${settings.email}`} className="hover:text-amber-brand-light hover:underline">
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
          <div>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-amber-brand">Opening hours</h2>
            <div className="mt-3">
              <HoursTable hours={hours} special={special} tone="dark" />
            </div>
          </div>
        )}

        <div className={hours.length > 0 ? "" : "lg:col-span-2"}>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-amber-brand">Stay in the loop</h2>
          <p className="mt-3 text-sm text-paper-300">Get updates on new books, events, and coffee specials.</p>
          <div className="mt-3">
            <NewsletterForm />
          </div>
        </div>
      </div>
      <div className="border-t border-paper-50/10">
        <p className="container-page py-6 text-center text-xs text-paper-300">
          © {year} {settings.businessName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

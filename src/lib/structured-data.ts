import { toOpeningHoursSpecification, type DailyHours } from "./hours";
import { absoluteUrl, SITE_URL } from "./site-config";

/**
 * schema.org builders. Each one only emits properties backed by stored
 * business data; nothing is filled in with defaults or guesses.
 */

type Json = Record<string, unknown>;

export interface BusinessFacts {
  businessName: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  streetAddress: string | null;
  locality: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string | null;
  latitude: string | null;
  longitude: string | null;
  mapUrl: string | null;
  priceRange: string | null;
  currency: string;
}

function compact<T extends Json>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0))) as T;
}

export function hasPostalAddress(b: BusinessFacts): boolean {
  return Boolean(b.streetAddress && b.locality);
}

export function postalAddress(b: BusinessFacts): Json | undefined {
  if (!hasPostalAddress(b)) return undefined;
  return compact({
    "@type": "PostalAddress",
    streetAddress: b.streetAddress,
    addressLocality: b.locality,
    addressRegion: b.region,
    postalCode: b.postalCode,
    addressCountry: b.countryCode,
  });
}

/**
 * CafeOrCoffeeShop requires a physical address to be meaningful; without one
 * we fall back to a plain Organization so the markup stays truthful.
 */
export function businessJsonLd(b: BusinessFacts, hours: readonly DailyHours[], sameAs: readonly string[]): Json {
  const base = compact({
    "@id": `${SITE_URL}/#business`,
    name: b.businessName,
    url: SITE_URL,
    logo: absoluteUrl("/icon.png"),
    image: absoluteUrl("/images/og-default.jpg"),
    description: b.description,
    email: b.email,
    telephone: b.phone,
    sameAs: [...sameAs],
  });
  if (!hasPostalAddress(b)) {
    return { "@context": "https://schema.org", "@type": "Organization", ...base };
  }
  return compact({
    "@context": "https://schema.org",
    "@type": ["CafeOrCoffeeShop", "BookStore"],
    ...base,
    address: postalAddress(b),
    geo:
      b.latitude && b.longitude
        ? { "@type": "GeoCoordinates", latitude: Number(b.latitude), longitude: Number(b.longitude) }
        : undefined,
    hasMap: b.mapUrl,
    priceRange: b.priceRange,
    currenciesAccepted: b.currency,
    openingHoursSpecification: toOpeningHoursSpecification(hours),
  });
}

export function websiteJsonLd(name: string): Json {
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE_URL}/#website`, name, url: SITE_URL };
}

export function breadcrumbJsonLd(items: ReadonlyArray<{ name: string; path: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function bookJsonLd(book: {
  title: string;
  author: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  isAvailable: boolean;
  slug: string;
  category: string | null;
}, currency: string): Json {
  return compact({
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author },
    description: book.description,
    image: book.imageUrl,
    genre: book.category,
    url: absoluteUrl(`/books/${book.slug}`),
    offers: book.price
      ? {
          "@type": "Offer",
          price: book.price,
          priceCurrency: currency,
          availability: book.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: { "@id": `${SITE_URL}/#business` },
        }
      : undefined,
  });
}

export function eventJsonLd(
  event: { title: string; description: string | null; startsAt: Date; endsAt: Date; imageUrl: string | null; slug: string; location: string | null },
  business: BusinessFacts,
): Json | null {
  // Google requires a location with an address for Event rich results; skip
  // the markup rather than publishing an incomplete or invented place.
  const address = postalAddress(business);
  if (!address) return null;
  return compact({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt.toISOString(),
    endDate: event.endsAt.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: event.imageUrl ? [event.imageUrl] : undefined,
    url: absoluteUrl(`/events/${event.slug}`),
    location: { "@type": "Place", name: event.location ?? business.businessName, address },
    organizer: { "@type": "Organization", name: business.businessName, url: SITE_URL },
  });
}

export function faqJsonLd(faqs: ReadonlyArray<{ question: string; answer: string }>): Json | null {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

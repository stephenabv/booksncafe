import type { FieldDef } from "@/lib/admin-fields";

export const SETTINGS_FIELDS: FieldDef[] = [
  { name: "businessName", label: "Business name", type: "text", required: true, maxLength: 120, section: "Business" },
  { name: "tagline", label: "Tagline", type: "text", maxLength: 160, section: "Business", help: "Short line shown above the homepage heading and in the footer." },
  { name: "description", label: "Short description", type: "textarea", maxLength: 500, section: "Business", help: "Used in structured data for search engines." },
  { name: "priceRange", label: "Price range", type: "text", maxLength: 10, section: "Business", placeholder: "₱₱", help: "Optional, shown to search engines only." },
  { name: "email", label: "Email", type: "email", maxLength: 254, section: "Contact" },
  { name: "phone", label: "Phone", type: "tel", maxLength: 25, section: "Contact" },
  { name: "streetAddress", label: "Street address", type: "text", maxLength: 200, section: "Location" },
  { name: "locality", label: "City / municipality", type: "text", maxLength: 100, section: "Location" },
  { name: "region", label: "Province / region", type: "text", maxLength: 100, section: "Location" },
  { name: "postalCode", label: "Postal code", type: "text", maxLength: 20, section: "Location" },
  { name: "countryCode", label: "Country code", type: "text", maxLength: 2, section: "Location", placeholder: "PH" },
  { name: "mapUrl", label: "Map link", type: "url", maxLength: 2048, section: "Location", help: "A Google Maps (or similar) https link for the “Get directions” button." },
  { name: "directions", label: "Directions & parking", type: "textarea", maxLength: 1000, section: "Location" },
  { name: "latitude", label: "Latitude", type: "text", maxLength: 12, section: "Location", help: "Optional, for search engines." },
  { name: "longitude", label: "Longitude", type: "text", maxLength: 13, section: "Location" },
  { name: "timezone", label: "Time zone", type: "text", required: true, maxLength: 60, section: "Advanced", help: "IANA name used for hours and event times, e.g. Asia/Manila." },
  { name: "defaultOgImageUrl", label: "Default social sharing image", type: "image", section: "Advanced", help: "Used when a page has no image of its own. 1200×630 works best." },
];

export const PAGE_FIELDS: FieldDef[] = [
  { name: "heading", label: "Page heading (H1)", type: "text", required: true, maxLength: 160, section: "Content" },
  { name: "intro", label: "Introduction", type: "textarea", maxLength: 3000, section: "Content", help: "Separate paragraphs with a blank line." },
  { name: "seoTitle", label: "Search title", type: "text", required: true, maxLength: 70, section: "Search & sharing", help: "Shown in browser tabs and search results. Aim for under 60 characters." },
  { name: "seoDescription", label: "Search description", type: "textarea", required: true, maxLength: 300, section: "Search & sharing", help: "Aim for 120–160 characters." },
  { name: "ogImageUrl", label: "Social sharing image", type: "image", section: "Search & sharing" },
  { name: "noIndex", label: "Hide this page from search engines", type: "checkbox", section: "Search & sharing" },
];

export const EDITABLE_PAGES: ReadonlyArray<{ slug: string; label: string; path: string }> = [
  { slug: "home", label: "Homepage", path: "/" },
  { slug: "books", label: "Books", path: "/books" },
  { slug: "menu", label: "Cafe Menu", path: "/menu" },
  { slug: "events", label: "Events", path: "/events" },
  { slug: "about", label: "About", path: "/about" },
  { slug: "cart", label: "Cart", path: "/cart" },
];

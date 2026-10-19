/**
 * Initial content migrated from the hardcoded React components of the
 * previous Vite site (src/components/*.tsx at commit 1ef498d).
 *
 * Rules applied during migration:
 *  - Content that was visibly published on the old site is carried over as-is.
 *  - Generated demo filler ("Sample Book 1–15", "Community Event 1–15") is NOT
 *    migrated. It was produced by Array.from() loops and is not business data.
 *  - Items whose accuracy cannot be verified (past events, a garbled event
 *    description) are imported as unpublished drafts for the owner to review.
 *  - No business details (address, hours, phone, socials) existed anywhere in
 *    the repository, so none are invented here. See docs/OWNER_CONFIRMATIONS.md.
 */

export const SEED_SETTINGS = {
  businessName: "Books ’n Cafe",
  tagline: "Books, coffee & a cozy reading space",
  description:
    "Books ’n Cafe offers a curated book collection and quality coffee in a cozy café setting. Discover books, coffee, and comfort in one place.",
  timezone: "Asia/Manila",
  currency: "PHP",
};

const NAV = [
  { label: "Home", href: "/" },
  { label: "Books", href: "/books" },
  { label: "Cafe Menu", href: "/menu" },
  { label: "Events", href: "/events" },
  { label: "About", href: "/about" },
];

export const SEED_NAV_LINKS = [
  ...NAV.map((l, i) => ({ ...l, location: "header" as const, sortOrder: i })),
  ...NAV.map((l, i) => ({ ...l, location: "footer" as const, sortOrder: i })),
];

export const SEED_PAGES = [
  {
    slug: "home",
    seoTitle: "Books ’n Cafe | Books, Coffee & Cozy Reading Space",
    seoDescription:
      "Books ’n Cafe offers a curated book collection and quality coffee in a cozy café setting. Discover books, coffee, and comfort in one place.",
    heading: "Welcome to Books ’n Cafe",
    intro:
      "Discover amazing books while sipping handcrafted coffee in a cozy, relaxing atmosphere. Explore our collection, attend events, or just unwind with your favorite drink.",
  },
  {
    slug: "books",
    seoTitle: "Books Collection",
    seoDescription: "Browse the Books ’n Cafe book collection by title, author and category, and check what is available.",
    heading: "Books Collection",
    intro: null,
  },
  {
    slug: "menu",
    seoTitle: "Cafe Menu",
    seoDescription: "Coffee, espresso drinks and freshly baked treats from the Books ’n Cafe menu, with prices.",
    heading: "Cafe Menu",
    intro: "Enjoy our freshly brewed coffee, teas, and freshly baked treats.",
  },
  {
    slug: "events",
    seoTitle: "Events & Gatherings",
    seoDescription: "Upcoming events, readings and community gatherings at Books ’n Cafe.",
    heading: "Events & Gatherings",
    intro: null,
  },
  {
    slug: "about",
    seoTitle: "About Us",
    seoDescription: "Books ’n Cafe is a cozy corner where stories, coffee, and community meet.",
    heading: "About Us",
    intro:
      "Books ’n Cafe is a cozy corner where stories, coffee, and community meet. We provide a space for book lovers and coffee enthusiasts to relax, connect, and be inspired. Our mission: nurture the love for reading while enjoying handcrafted coffee. Every event, every cup, and every recommendation is thoughtfully crafted to make your experience memorable.",
  },
  {
    slug: "cart",
    seoTitle: "Your Cart",
    seoDescription: "Review the books and cafe items in your cart.",
    heading: "Your Cart",
    intro: null,
    noIndex: true,
  },
];

const unsplash = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const SEED_BOOKS = [
  {
    slug: "the-great-gatsby",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Classic",
    description: "A tragic tale of wealth, love, and the American Dream.",
    price: "2500.00",
    imageUrl: unsplash("photo-1528207776546-365bb710ee93"),
    isAvailable: true,
    isFeatured: true,
    isPublished: true,
    sortOrder: 1,
  },
  {
    slug: "pride-and-prejudice",
    title: "Pride & Prejudice",
    author: "Jane Austen",
    category: "Romance",
    description: "Love and misunderstandings in Regency-era England.",
    price: "1500.00",
    imageUrl: unsplash("photo-1531219432768-0a1201bda3b1"),
    isAvailable: false,
    isFeatured: true,
    isPublished: true,
    sortOrder: 2,
  },
  {
    slug: "1984",
    title: "1984",
    author: "George Orwell",
    category: "Dystopian",
    description: "A chilling vision of surveillance and authoritarianism.",
    price: "1500.00",
    imageUrl: unsplash("photo-1524995997946-a1c2e315a42f"),
    isAvailable: true,
    isFeatured: true,
    isPublished: true,
    sortOrder: 3,
  },
  {
    // Shown under "Featured Books" on the old homepage but absent from the
    // catalog, so it has no price, category or description.
    slug: "to-kill-a-mockingbird",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: null,
    description: null,
    price: null,
    imageUrl: unsplash("photo-1532012197267-da84d127e765"),
    isAvailable: true,
    isFeatured: true,
    isPublished: true,
    sortOrder: 4,
  },
];

const menu = (
  sortOrder: number,
  name: string,
  price: string,
  photo: string,
  description: string,
  isFeatured = false,
) => ({
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  price,
  imageUrl: unsplash(photo, 600),
  description,
  isFeatured,
  isPublished: true,
  isAvailable: true,
  sortOrder,
});

export const SEED_MENU_ITEMS = [
  menu(1, "Espresso", "120.00", "photo-1606851095660-7f54b95c4a26", "Rich and bold espresso shot to kickstart your day.", true),
  menu(2, "Cappuccino", "150.00", "photo-1590080877351-0e7f0a11c60b", "Creamy cappuccino with a perfect balance of espresso and froth.", true),
  menu(3, "Latte", "160.00", "photo-1589987603570-d3f90f21f879", "Smooth latte with steamed milk and espresso.", true),
  menu(4, "Mocha", "170.00", "photo-1617196032321-5cf76a8f2b4a", "Chocolate flavored latte with espresso and whipped cream."),
  menu(5, "Blueberry Muffin", "80.00", "photo-1612197526843-7ad6e7d4fef7", "Freshly baked blueberry muffin with a soft crumb."),
  menu(6, "Americano", "130.00", "photo-1601924582970-2c1b57b5a99f", "Espresso diluted with hot water for a smooth taste."),
  menu(7, "Flat White", "155.00", "photo-1613471749780-34b2d0f0d9a2", "Creamy flat white with velvety milk texture."),
  menu(8, "Macchiato", "140.00", "photo-1621989631128-63e0c2b45a62", "Espresso with a small amount of frothy milk."),
  menu(9, "Cinnamon Roll", "90.00", "photo-1614851461374-5a0f5918b2a5", "Warm cinnamon roll with sweet glaze."),
  menu(10, "Croissant", "85.00", "photo-1586985288123-2495f577d88c", "Flaky buttery croissant baked fresh."),
  menu(11, "Iced Latte", "170.00", "photo-1521305916504-4a1121188589", "Chilled latte perfect for warm days."),
];

/** Imported unpublished: dates have passed and details need owner confirmation. */
export const SEED_EVENTS = [
  {
    slug: "poetry-night-2026-03-10",
    title: "Poetry Night",
    description: "An evening of spoken word and poetry.",
    location: "Books n Cafe – Main Hall",
    startsAt: new Date("2026-03-10T18:00:00+08:00"),
    endsAt: new Date("2026-03-10T21:00:00+08:00"),
    imageUrl: unsplash("photo-1519681393784-d120267933ba"),
    isPublished: false,
  },
  {
    slug: "coffee-brewing-workshop-2026-03-05",
    title: "Coffee Brewing Workshop",
    // The original description contained keyboard filler text; this is the readable part.
    description: "Learn professional coffee brewing techniques.",
    location: "Books n Cafe – Bar Area",
    startsAt: new Date("2026-03-05T09:00:00+08:00"),
    endsAt: new Date("2026-03-05T12:00:00+08:00"),
    imageUrl: unsplash("photo-1509042239860-f550ce710b93"),
    isPublished: false,
  },
];

export const SEED_TEAM = [
  {
    name: "Engr. Stephen",
    role: "Founder & Creator",
    bio: "Hi, I'm Stephen! I founded Books ’n Cafe to create a welcoming space where stories and coffee come together. I handle everything from curating books, designing events, to ensuring every cup of coffee is perfect. My goal is to bring community and creativity under one roof.",
    imageUrl: null,
    isPublished: true,
    sortOrder: 1,
  },
];

/** The old cart accepted SAVE10 for 10% off; it is now validated on the server. */
export const SEED_COUPONS = [{ code: "SAVE10", percentOff: 10, isActive: true }];

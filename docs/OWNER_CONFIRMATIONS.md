# Information needed from the owner

Nothing below has been published. Each item can be entered in the admin dashboard (`/admin`) without code changes. Until it is entered, the related section stays hidden and search-engine data stays limited to what is known.

## Missing business details (Admin → Business details / Opening hours)

The repository and the live site contain none of these:

- [ ] Street address, city/municipality, province, postal code and country. Once these are entered, the site shows a "Visit us" section and publishes `CafeOrCoffeeShop` structured data.
- [ ] Phone number
- [ ] Public email address
- [ ] Map link (Google Maps or similar) for "Get directions"
- [ ] Directions and parking notes
- [ ] Weekly opening hours, plus any upcoming holiday closures
- [ ] Social media profile URLs (Facebook, Instagram, etc.)
- [ ] Time zone: currently assumed to be **Asia/Manila**, because the old site priced everything in ₱ with 12 % VAT. Please confirm.

## Content to confirm

- [ ] **Menu prices.** The 11 menu items and prices (Espresso ₱120 … Iced Latte ₱170) were copied from the old site. Are they current?
- [ ] **Book prices and availability.** The Great Gatsby ₱2,500, Pride & Prejudice ₱1,500 (checked out) and 1984 ₱1,500 were copied from the old site. ₱2,500 for The Great Gatsby looks high; please confirm.
- [ ] **To Kill a Mockingbird** appeared under "Featured books" on the old homepage but was never in the catalog. It is published without a price. Confirm it's stocked and add a price, or unpublish it.
- [ ] **Events.** "Poetry Night" (10 Mar 2026) and "Coffee Brewing Workshop" (5 Mar 2026) were imported as unpublished drafts. Did they happen? Publish them as past events or delete them, and add upcoming events.
- [ ] **Coupon `SAVE10`** (10 % off) is still active, as on the old site. Keep, change or deactivate it?
- [ ] **Online checkout.** The old site said "coming soon", and the new site says "Online checkout isn't available yet". Is the cart still wanted without checkout, or should it become an "order at the counter" list?
- [ ] **Book lending vs. selling.** Books show "Checked out", which suggests lending, but they also have sale prices. Which is it, or both?

## Photography and media

- [ ] All book, menu and event images are **generic Unsplash stock photos**, not photos of the cafe, its products or book covers, and several photo IDs could not be verified. Real photos of the venue, drinks and shelves would improve trust and search appearance. Images can be added as files under `public/images/` or hosted on an approved domain.
- [ ] A team photo for the About page (the old URL was a placeholder).
- [ ] A dedicated logo file (SVG or transparent PNG). The current mark is cropped from the banner illustration.

## Content worth adding

- [ ] Frequently asked questions (e.g. Wi-Fi, outlets, pets, reservations, payment methods). These appear on the homepage with FAQ structured data.
- [ ] A short "our story" and atmosphere description for the About page and homepage.
- [ ] Seating, reservations, private events or other facilities, if any.

## Accounts

- [ ] The email address and display name for the owner's admin account, and for any staff who need **editor** access (catalog, events, hours, announcements; no business details, navigation, coupons or subscriber list).

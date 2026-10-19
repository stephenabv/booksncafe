import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/", h1: "Welcome to Books ’n Cafe", text: "The Great Gatsby" },
  { path: "/books", h1: "Books Collection", text: "Pride & Prejudice" },
  { path: "/books/1984", h1: "1984", text: "George Orwell" },
  { path: "/menu", h1: "Cafe Menu", text: "Espresso" },
  { path: "/events", h1: "Events & Gatherings", text: "No upcoming events" },
  { path: "/about", h1: "About Us", text: "Engr. Stephen" },
];

test.describe("server-rendered public pages", () => {
  for (const page of PAGES) {
    test(`${page.path} returns meaningful HTML without JavaScript`, async ({ request }) => {
      const response = await request.get(page.path);
      expect(response.status()).toBe(200);
      const html = await response.text();
      const decoded = html.replace(/&amp;/g, "&").replace(/&#x27;/g, "'");
      expect(decoded).toContain(page.text);
      expect(decoded).toMatch(new RegExp(`<h1[^>]*>${page.h1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
      expect(html).toMatch(/<link rel="canonical" href="https:\/\/booksncafe\.example[^"]*"/);
      expect(html).toMatch(/<meta name="description" content="[^"]{20,}"/);
      expect(html).toContain('property="og:title"');
    });
  }

  test("every public page has a unique title", async ({ request }) => {
    const titles = await Promise.all(
      PAGES.map(async (p) => /<title>([^<]+)<\/title>/.exec(await (await request.get(p.path)).text())?.[1]),
    );
    expect(new Set(titles).size).toBe(PAGES.length);
  });

  test("unknown URLs return a real 404 with site navigation", async ({ page, request }) => {
    expect((await request.get("/this-page-does-not-exist")).status()).toBe(404);
    expect((await request.get("/books/not-a-real-book")).status()).toBe(404);
    expect((await request.get("/events/not-a-real-event")).status()).toBe(404);
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("isn’t on our shelves");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  });

  test("unpublished draft events are not reachable", async ({ request }) => {
    expect((await request.get("/events/poetry-night-2026-03-10")).status()).toBe(404);
  });

  test("legacy SPA entry redirects home", async ({ request }) => {
    const res = await request.get("/index.html", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toBe("/");
  });

  test("robots.txt and sitemap.xml are valid", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Sitemap: https://booksncafe.example/sitemap.xml");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.headers()["content-type"]).toContain("xml");
    const xml = await sitemap.text();
    for (const path of ["/", "/books", "/menu", "/events", "/about", "/books/the-great-gatsby"]) {
      expect(xml).toContain(`<loc>https://booksncafe.example${path}</loc>`);
    }
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("/cart");
    expect(xml).not.toContain("poetry-night");
  });

  test("structured data is valid JSON and truthful", async ({ request }) => {
    const html = await (await request.get("/books/the-great-gatsby")).text();
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]!));
    const types = blocks.map((b) => b["@type"]);
    expect(types).toEqual(expect.arrayContaining(["BreadcrumbList", "Book", "WebSite", "Organization"]));
    const book = blocks.find((b) => b["@type"] === "Book");
    expect(book.offers).toMatchObject({ price: "2500.00", priceCurrency: "PHP" });
    // No address on record yet, so the site must not claim to be a local business.
    expect(types).not.toContain("CafeOrCoffeeShop");
  });

  test("filtered book listings are noindex and search works without JavaScript", async ({ request }) => {
    const html = await (await request.get("/books?q=orwell")).text();
    expect(html).toContain('name="robots" content="noindex, follow"');
    expect(html).toContain("1984");
    expect(html).not.toContain("Pride &amp; Prejudice</a>");
  });

  test("security headers are set", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("header navigation links work and mark the active page", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [label, path] of [["Books", "/books"], ["Cafe Menu", "/menu"], ["Events", "/events"], ["About", "/about"], ["Home", "/"]] as const) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(path);
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    }
  });
});

test.describe("cart", () => {
  test("prices the cart on the server and applies a valid coupon", async ({ page }) => {
    await page.goto("/menu");
    await page.getByRole("button", { name: "Add to cart, Espresso" }).click();
    await page.getByRole("button", { name: "Add to cart, Espresso" }).click();
    await page.getByRole("button", { name: "Add to cart, Latte" }).click();
    await expect(page.getByRole("link", { name: "Cart, 3 items" })).toBeVisible();

    await page.goto("/cart");
    const summary = page.getByRole("complementary", { name: "Order summary" });
    await expect(summary.getByText("₱400", { exact: true }).last()).toBeVisible(); // 2 × 120 + 160

    await page.getByLabel("Coupon code").fill("nope");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("That coupon code isn’t valid.")).toBeVisible();

    await page.getByLabel("Coupon code").fill("save10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("SAVE10 applied: 10% off")).toBeVisible();
    await expect(summary.getByText("₱360", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Remove Latte from cart" }).click();
    await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();
  });

  test("checked-out books cannot be added", async ({ page }) => {
    await page.goto("/books/pride-and-prejudice");
    await expect(page.getByRole("button", { name: "Checked out" })).toBeDisabled();
  });
});

test("newsletter sign-up confirms without revealing existing subscribers", async ({ page }) => {
  await page.goto("/about");
  for (let i = 0; i < 2; i += 1) {
    await page.getByLabel("Email address").fill("reader@example.test");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByRole("status").filter({ hasText: "on the list" })).toBeVisible();
    await page.reload();
  }
});

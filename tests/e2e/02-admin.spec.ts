import { expect, test, type Page } from "@playwright/test";
import { E2E_ACCOUNTS } from "./accounts";

async function signIn(page: Page, account: { email: string; password: string }) {
  await page.goto("/syscon/login/admin");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/syscon/admin");
}

test.describe("admin access control", () => {
  test("anonymous visitors are sent to the login page", async ({ page, request }) => {
    for (const path of ["/syscon/admin", "/syscon/admin/settings", "/syscon/admin/r/books", "/syscon/admin/r/books/1"]) {
      await page.goto(path);
      await expect(page).toHaveURL("/syscon/login/admin");
    }
    const csv = await request.get("/syscon/admin/subscribers/export");
    expect(csv.status()).toBe(401);
  });

  test("admin pages are excluded from indexing", async ({ request }) => {
    const res = await request.get("/syscon/login/admin");
    expect(res.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    expect(await res.text()).toContain('name="robots" content="noindex, nofollow');
  });

  test("the old /admin address no longer exists", async ({ request }) => {
    for (const path of ["/admin", "/admin/login", "/admin/settings", "/admin/subscribers/export", "/syscon", "/syscon/login"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(404);
    }
  });

  test("the sign-in page has a light/dark toggle that is remembered", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/syscon/login/admin");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
  });

  test("wrong passwords and disabled accounts are rejected with the same message", async ({ page }) => {
    await page.goto("/syscon/login/admin");
    for (const [email, password] of [
      [E2E_ACCOUNTS.admin.email, "definitely-wrong-password"],
      ["nobody@example.test", "whatever-password-1"],
      ["disabled@example.test", "disabled-account-pw"],
    ] as const) {
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByRole("alert").filter({ hasText: "Incorrect" })).toHaveText("Incorrect email or password.");
      await expect(page).toHaveURL("/syscon/login/admin");
    }
  });

  test("session cookie is HttpOnly and logout ends the session", async ({ page, context }) => {
    await signIn(page, E2E_ACCOUNTS.admin);
    const cookie = (await context.cookies()).find((c) => c.name.endsWith("bnc_session"));
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/syscon/login/admin");
    // Replaying the old cookie must not work: the server-side session is deleted.
    await context.addCookies([cookie!]);
    await page.goto("/syscon/admin");
    await expect(page).toHaveURL("/syscon/login/admin");
  });

  test("editors cannot open admin-only areas", async ({ page, request }) => {
    await signIn(page, E2E_ACCOUNTS.editor);
    await expect(page.getByRole("link", { name: "Business details" })).toHaveCount(0);
    await page.goto("/syscon/admin/settings");
    await expect(page).toHaveURL("/syscon/admin?denied=1");
    await expect(page.getByRole("alert").filter({ hasText: "permission" })).toContainText("doesn’t have permission");
    await page.goto("/syscon/admin/r/coupons");
    await expect(page).toHaveURL("/syscon/admin?denied=1");

    const cookies = await page.context().cookies();
    const csv = await request.get("/syscon/admin/subscribers/export", {
      headers: { cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; ") },
    });
    expect(csv.status()).toBe(403);

    // Editors can still manage catalog content.
    await page.goto("/syscon/admin/r/books");
    await expect(page.getByRole("heading", { name: "Books", level: 1 })).toBeVisible();
  });
});

test.describe("admin content management", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, E2E_ACCOUNTS.admin);
  });

  test("overview lists missing business information", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Business information still missing" })).toBeVisible();
    await expect(page.getByText("Opening hours", { exact: true }).first()).toBeVisible();
  });

  test("business details and opening hours appear on the public site immediately", async ({ page }) => {
    await page.goto("/syscon/admin/settings");
    await page.getByLabel("Street address").fill("123 Sample Street");
    await page.getByLabel("City / municipality").fill("Test City");
    await page.getByLabel("Phone").fill("+63 900 000 0000");
    await page.getByRole("button", { name: "Save business details" }).click();
    await expect(page.getByRole("status")).toContainText("Business details saved");

    await page.goto("/syscon/admin/hours");
    await page.getByRole("checkbox", { name: "Show Monday on website" }).check();
    await page.getByLabel("Monday opening time").fill("08:00");
    await page.getByLabel("Monday closing time").fill("20:00");
    await page.getByRole("checkbox", { name: "Show Sunday on website" }).check();
    await page.getByRole("checkbox", { name: "Sunday closed" }).check();
    await page.getByRole("button", { name: "Save opening hours" }).click();
    await expect(page.getByRole("status")).toContainText("Opening hours saved");

    const html = await (await page.request.get("/")).text();
    expect(html).toContain("123 Sample Street");
    expect(html).toContain("8:00 AM – 8:00 PM");
    expect(html).toContain("CafeOrCoffeeShop");
  });

  test("invalid input is rejected with field errors and keeps what was typed", async ({ page }) => {
    await page.goto("/syscon/admin/r/menu/new");
    await page.getByLabel("Name").fill("Spanish Latte");
    await page.getByLabel("Price (₱, VAT inclusive)").fill("abc");
    await page.getByLabel("Image URL").fill("javascript:alert(1)");
    await page.getByRole("button", { name: "Create menu item" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Please correct" })).toBeVisible();
    await expect(page.getByText("Enter an amount like 150 or 150.50.")).toBeVisible();
    await expect(page.getByLabel("Name")).toHaveValue("Spanish Latte");
    await expect(page.getByLabel("Image URL")).toHaveAttribute("aria-invalid", "true");
  });

  test("create, edit and delete a book, reflected on the public site", async ({ page }) => {
    await page.goto("/syscon/admin/r/books/new");
    await page.getByLabel("Title").fill("Noli Me Tangere");
    await page.getByLabel("Author").fill("José Rizal");
    await page.getByLabel("Price (₱, VAT inclusive)").fill("450");
    await page.getByLabel("Published on the website").check();
    await page.getByRole("button", { name: "Create book" }).click();
    await expect(page).toHaveURL(/\/syscon\/admin\/r\/books\?saved=\d+/);
    await expect(page.getByRole("status")).toContainText("Book saved");

    let res = await page.request.get("/books/noli-me-tangere");
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("₱450");

    await page.getByRole("link", { name: "Edit Noli Me Tangere" }).click();
    await page.getByLabel("Price (₱, VAT inclusive)").fill("475.50");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/saved=/);
    expect(await (await page.request.get("/books/noli-me-tangere")).text()).toContain("₱475.50");

    await page.getByRole("link", { name: "Edit Noli Me Tangere" }).click();
    await page.getByRole("button", { name: "Delete book" }).click();
    const dialog = page.getByRole("dialog", { name: /Delete “Noli Me Tangere”/ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete book" }).click();
    await expect(page).toHaveURL("/syscon/admin/r/books?deleted=1");
    res = await page.request.get("/books/noli-me-tangere");
    expect(res.status()).toBe(404);
  });

  test("duplicate slugs are reported on the field", async ({ page }) => {
    await page.goto("/syscon/admin/r/books/new");
    await page.getByLabel("Title").fill("Another 1984");
    await page.getByLabel("Author").fill("Someone");
    await page.getByLabel("URL slug").fill("1984");
    await page.getByRole("button", { name: "Create book" }).click();
    await expect(page.getByText("Another book already uses this URL slug.")).toBeVisible();
  });

  test("publishing an event and an announcement updates the site", async ({ page }) => {
    await page.goto("/syscon/admin/r/events/new");
    await page.getByLabel("Title").fill("Saturday Book Club");
    await page.getByLabel("Starts").fill("2099-05-02T15:00");
    await page.getByLabel("Ends").fill("2099-05-02T17:00");
    await page.getByLabel("Published on the website").check();
    await page.getByRole("button", { name: "Create event" }).click();
    await expect(page).toHaveURL(/saved=/);

    await page.goto("/syscon/admin/r/announcements/new");
    await page.getByLabel("Headline").fill("Book club returns");
    await page.getByLabel("Link address").fill("/events");
    await page.getByLabel("Published on the website").check();
    await page.getByRole("button", { name: "Create announcement" }).click();
    await expect(page).toHaveURL(/saved=/);

    await page.goto("/events");
    await expect(page.getByRole("heading", { name: "Saturday Book Club" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Announcement" })).toContainText("Book club returns");
    await page.goto("/events/saturday-book-club-2099-05-02");
    await expect(page.getByText("Sat, May 2, 2099, 3:00 PM – 5:00 PM")).toBeVisible();
  });

  test("page SEO fields drive public metadata", async ({ page }) => {
    await page.goto("/syscon/admin/pages/menu");
    await page.getByLabel("Search title").fill("Coffee & Pastries Menu");
    await page.getByRole("button", { name: "Save page" }).click();
    await expect(page.getByRole("status")).toContainText("Page saved");
    const html = await (await page.request.get("/menu")).text();
    expect(html).toContain("<title>Coffee &amp; Pastries Menu | Books ’n Cafe</title>");
  });

  test("unsaved changes trigger a confirmation before leaving", async ({ page }) => {
    await page.goto("/syscon/admin/r/faqs/new");
    await page.getByLabel("Question").fill("Do you have Wi-Fi?");
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    page.once("dialog", (d) => d.dismiss());
    await page.getByRole("link", { name: "Cancel" }).click();
    await expect(page).toHaveURL("/syscon/admin/r/faqs/new");
  });
});

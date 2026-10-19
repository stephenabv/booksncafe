import { expect, test } from "@playwright/test";

test("mobile navigation opens, links work and Escape closes it", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  const mobileNav = page.getByRole("navigation", { name: "Mobile" });
  await expect(mobileNav).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(mobileNav).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();

  await page.getByRole("button", { name: "Open menu" }).click();
  await mobileNav.getByRole("link", { name: "Cafe Menu" }).click();
  await expect(page).toHaveURL("/menu");
  await expect(mobileNav).toBeHidden();
});

test("pages do not scroll horizontally on a phone", async ({ page }) => {
  for (const path of ["/", "/books", "/menu", "/cart", "/syscon/login/admin"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

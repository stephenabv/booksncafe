import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { hasRole } from "@/server/auth/roles";
import { businessJsonLd, eventJsonLd } from "@/lib/structured-data";

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password entirely", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
    expect(await verifyPassword("anything", "not-a-valid-hash")).toBe(false);
  });

  it("uses a unique salt per hash and enforces a minimum length", async () => {
    const [a, b] = await Promise.all([hashPassword("same password 123"), hashPassword("same password 123")]);
    expect(a).not.toBe(b);
    await expect(hashPassword("short")).rejects.toThrow(/at least/);
  });
});

describe("roles", () => {
  it("ranks admin above editor", () => {
    expect(hasRole("admin", "editor")).toBe(true);
    expect(hasRole("admin", "admin")).toBe(true);
    expect(hasRole("editor", "editor")).toBe(true);
    expect(hasRole("editor", "admin")).toBe(false);
  });
});

const business = {
  businessName: "Books ’n Cafe",
  description: null,
  email: null,
  phone: null,
  streetAddress: null,
  locality: null,
  region: null,
  postalCode: null,
  countryCode: null,
  latitude: null,
  longitude: null,
  mapUrl: null,
  priceRange: null,
  currency: "PHP",
};

describe("structured data", () => {
  it("does not claim a local business without an address", () => {
    const json = businessJsonLd(business, [], []);
    expect(json["@type"]).toBe("Organization");
    expect(json).not.toHaveProperty("address");
    expect(json).not.toHaveProperty("telephone");
  });

  it("emits CafeOrCoffeeShop with hours once an address exists", () => {
    const json = businessJsonLd({ ...business, streetAddress: "1 Main St", locality: "Quezon City", countryCode: "PH" }, [{ dayOfWeek: 1, isClosed: false, opensAt: "08:00", closesAt: "17:00" }], []);
    expect(json["@type"]).toEqual(["CafeOrCoffeeShop", "BookStore"]);
    expect(json.address).toMatchObject({ addressLocality: "Quezon City" });
    expect(json.openingHoursSpecification).toHaveLength(1);
  });

  it("skips Event markup without a venue address", () => {
    const event = { title: "Poetry Night", description: null, startsAt: new Date(), endsAt: new Date(), imageUrl: null, slug: "poetry", location: null };
    expect(eventJsonLd(event, business)).toBeNull();
  });
});

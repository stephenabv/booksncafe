import { describe, expect, it } from "vitest";
import { formatPrice, toMinorUnits } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { isValidTimeZone, utcToZonedLocal, zonedLocalToUtc } from "@/lib/timezone";

describe("timezone conversion", () => {
  it("round-trips Manila wall-clock time", () => {
    const utc = zonedLocalToUtc("2026-03-10T18:00", "Asia/Manila");
    expect(utc?.toISOString()).toBe("2026-03-10T10:00:00.000Z");
    expect(utcToZonedLocal(utc!, "Asia/Manila")).toBe("2026-03-10T18:00");
  });

  it("handles daylight-saving zones", () => {
    expect(zonedLocalToUtc("2026-07-01T12:00", "America/New_York")?.toISOString()).toBe("2026-07-01T16:00:00.000Z");
    expect(zonedLocalToUtc("2026-01-01T12:00", "America/New_York")?.toISOString()).toBe("2026-01-01T17:00:00.000Z");
  });

  it("rejects malformed input and unknown zones", () => {
    expect(zonedLocalToUtc("10/03/2026 6pm", "Asia/Manila")).toBeNull();
    expect(isValidTimeZone("Asia/Manila")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});

describe("slugify", () => {
  it("creates URL-safe slugs", () => {
    expect(slugify("Pride & Prejudice")).toBe("pride-and-prejudice");
    expect(slugify("  Café Olé!  ")).toBe("cafe-ole");
    expect(slugify("Books ’n Cafe")).toBe("books-n-cafe");
  });
});

describe("money", () => {
  it("formats pesos and ignores empty values", () => {
    expect(formatPrice("1500.00")).toBe("₱1,500");
    expect(formatPrice("150.50")).toBe("₱150.50");
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice("abc")).toBeNull();
    expect(toMinorUnits("19.99")).toBe(1999);
  });
});

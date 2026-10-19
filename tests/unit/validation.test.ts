import { describe, expect, it } from "vitest";
import { imageUrlField, linkField, moneyField, optionalText, slugField, timeField } from "@/lib/validation";

describe("admin field validation", () => {
  it("accepts allow-listed https images and site paths only", () => {
    expect(imageUrlField.parse("https://images.unsplash.com/photo-1")).toBe("https://images.unsplash.com/photo-1");
    expect(imageUrlField.parse("/images/cafe.jpg")).toBe("/images/cafe.jpg");
    expect(imageUrlField.parse("")).toBeNull();
    for (const bad of ["http://images.unsplash.com/x", "https://evil.example/x.png", "//evil.example/x.png", "javascript:alert(1)", "data:image/png;base64,AAAA"]) {
      expect(imageUrlField.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("blocks script and protocol-relative links", () => {
    expect(linkField.safeParse("/events").success).toBe(true);
    expect(linkField.safeParse("https://facebook.com/x").success).toBe(true);
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "//evil.example", "data:text/html,hi", "/\\evil.example"]) {
      expect(linkField.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("normalises money input", () => {
    expect(moneyField.parse("₱1,500")).toBe("1500.00");
    expect(moneyField.parse("150.5")).toBe("150.50");
    expect(moneyField.parse("")).toBeNull();
    expect(moneyField.safeParse("-5").success).toBe(false);
    expect(moneyField.safeParse("12.345").success).toBe(false);
  });

  it("validates slugs, times and trims optional text", () => {
    expect(slugField.parse("Poetry-Night")).toBe("poetry-night");
    expect(slugField.safeParse("poetry night").success).toBe(false);
    expect(slugField.safeParse("../admin").success).toBe(false);
    expect(timeField.parse("08:00")).toBe("08:00");
    expect(timeField.safeParse("25:00").success).toBe(false);
    expect(optionalText(5).parse("   ")).toBeNull();
    expect(optionalText(5).safeParse("toolong").success).toBe(false);
  });
});

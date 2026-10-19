import { describe, expect, it } from "vitest";
import { computeCartTotals, VAT_RATE } from "@/lib/pricing";

describe("computeCartTotals", () => {
  it("treats prices as VAT inclusive", () => {
    const totals = computeCartTotals([{ unitPrice: "112.00", quantity: 1 }]);
    expect(totals.total).toBe(112);
    expect(totals.vat).toBe(12);
    expect(totals.net).toBe(100);
    expect(VAT_RATE).toBe(0.12);
  });

  it("sums quantities exactly without floating point drift", () => {
    const totals = computeCartTotals([
      { unitPrice: "0.10", quantity: 3 },
      { unitPrice: "150.00", quantity: 2 },
    ]);
    expect(totals.gross).toBe(300.3);
  });

  it("applies a percentage discount before splitting VAT", () => {
    const totals = computeCartTotals([{ unitPrice: "150", quantity: 2 }], 10);
    expect(totals.discount).toBe(30);
    expect(totals.total).toBe(270);
    expect(totals.vat + totals.net).toBeCloseTo(270, 10);
  });

  it("rejects out-of-range discounts", () => {
    expect(() => computeCartTotals([], 101)).toThrow(RangeError);
    expect(() => computeCartTotals([], -1)).toThrow(RangeError);
  });

  it("returns zeros for an empty cart", () => {
    expect(computeCartTotals([])).toEqual({ gross: 0, discount: 0, total: 0, vat: 0, net: 0 });
  });
});

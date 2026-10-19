import { fromMinorUnits, toMinorUnits } from "./money";

/** Prices on the site are VAT-inclusive (Philippine VAT, 12%), matching the original cart. */
export const VAT_RATE = 0.12;

export interface PricedLine {
  unitPrice: string | number;
  quantity: number;
}

export interface CartTotals {
  /** Sum of VAT-inclusive prices before discount. */
  gross: number;
  /** VAT portion contained in the discounted total. */
  vat: number;
  /** Discounted total excluding VAT. */
  net: number;
  discount: number;
  total: number;
}

/**
 * Computes cart totals from authoritative unit prices. All arithmetic happens
 * in minor units to avoid floating point drift.
 */
export function computeCartTotals(lines: readonly PricedLine[], percentOff = 0): CartTotals {
  if (percentOff < 0 || percentOff > 100) throw new RangeError("percentOff must be between 0 and 100");
  const grossMinor = lines.reduce((sum, line) => sum + toMinorUnits(line.unitPrice) * line.quantity, 0);
  const discountMinor = Math.round((grossMinor * percentOff) / 100);
  const totalMinor = grossMinor - discountMinor;
  const vatMinor = Math.round((totalMinor * VAT_RATE) / (1 + VAT_RATE));
  return {
    gross: fromMinorUnits(grossMinor),
    discount: fromMinorUnits(discountMinor),
    total: fromMinorUnits(totalMinor),
    vat: fromMinorUnits(vatMinor),
    net: fromMinorUnits(totalMinor - vatMinor),
  };
}

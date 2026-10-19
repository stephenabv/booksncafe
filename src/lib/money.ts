const formatters = new Map<string, Intl.NumberFormat>();

/** Whole amounts show no decimals (₱150); fractional amounts always show two (₱150.50). */
function formatterFor(currency: string, fractionDigits: 0 | 2): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

/** Formats a price stored as numeric text (e.g. "150.00") for display. */
export function formatPrice(amount: string | number | null | undefined, currency = "PHP"): string | null {
  if (amount === null || amount === undefined || amount === "") return null;
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return null;
  return formatterFor(currency, Number.isInteger(value) ? 0 : 2).format(value);
}

/** Converts a decimal amount to integer centavos to keep arithmetic exact. */
export function toMinorUnits(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

export function fromMinorUnits(minor: number): number {
  return minor / 100;
}

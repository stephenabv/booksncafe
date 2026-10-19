export type CartItemType = "book" | "menu";

export interface CartLine {
  type: CartItemType;
  id: number;
  quantity: number;
}

export const MAX_CART_LINES = 50;
export const MAX_LINE_QUANTITY = 20;

export interface QuotedLine extends CartLine {
  name: string;
  href: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  unitPrice: number | null;
  lineTotal: number;
  /** False when the item was unpublished, is unavailable, or has no price. */
  purchasable: boolean;
}

export interface CartQuote {
  lines: QuotedLine[];
  currency: string;
  gross: number;
  vat: number;
  net: number;
  discount: number;
  total: number;
  coupon: { code: string; percentOff: number } | null;
  couponError: string | null;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_CART_LINES, MAX_LINE_QUANTITY, type CartItemType, type CartLine } from "@/lib/cart-types";

const STORAGE_KEY = "bnc-cart-v1";

interface CartContextValue {
  lines: CartLine[];
  hydrated: boolean;
  itemCount: number;
  add: (type: CartItemType, id: number) => void;
  setQuantity: (type: CartItemType, id: number, quantity: number) => void;
  remove: (type: CartItemType, id: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function sanitize(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        (l.type === "book" || l.type === "menu") &&
        Number.isInteger(l.id) &&
        l.id > 0 &&
        Number.isInteger(l.quantity) &&
        l.quantity > 0,
    )
    .map((l) => ({ type: l.type, id: l.id, quantity: Math.min(l.quantity, MAX_LINE_QUANTITY) }))
    .slice(0, MAX_CART_LINES);
}

/**
 * Client-side cart. Only item references and quantities are stored; prices
 * are always fetched from the server when the cart is viewed.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount to keep SSR markup stable
      if (stored) setLines(sanitize(JSON.parse(stored)));
    } catch {
      // Storage can be unavailable (private mode) or corrupted; start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Ignore quota or availability errors; the in-memory cart still works.
    }
  }, [lines, hydrated]);

  const setQuantity = useCallback((type: CartItemType, id: number, quantity: number) => {
    setLines((prev) => {
      const clamped = Math.max(0, Math.min(quantity, MAX_LINE_QUANTITY));
      const exists = prev.some((l) => l.type === type && l.id === id);
      if (clamped === 0) return prev.filter((l) => !(l.type === type && l.id === id));
      if (exists) return prev.map((l) => (l.type === type && l.id === id ? { ...l, quantity: clamped } : l));
      if (prev.length >= MAX_CART_LINES) return prev;
      return [...prev, { type, id, quantity: clamped }];
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      hydrated,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      add: (type, id) => {
        const current = lines.find((l) => l.type === type && l.id === id)?.quantity ?? 0;
        setQuantity(type, id, current + 1);
      },
      setQuantity,
      remove: (type, id) => setQuantity(type, id, 0),
      clear: () => setLines([]),
    }),
    [lines, hydrated, setQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

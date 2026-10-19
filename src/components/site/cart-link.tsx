"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart } from "./cart-context";

export function CartLink() {
  const { itemCount, hydrated } = useCart();
  const label = hydrated && itemCount > 0 ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart";
  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex size-11 items-center justify-center rounded-full text-paper-100 transition-colors hover:bg-paper-50/10 hover:text-amber-brand-light"
    >
      <ShoppingBag aria-hidden className="size-5" />
      {hydrated && itemCount > 0 && (
        <span className="absolute right-1 top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-brand px-1 text-[11px] font-bold leading-5 text-night-950">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

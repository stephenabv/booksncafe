"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import type { CartItemType } from "@/lib/cart-types";
import { useCart } from "./cart-context";

interface Props {
  type: CartItemType;
  id: number;
  name: string;
  disabled?: boolean;
  disabledLabel?: string;
  className?: string;
}

export function AddToCartButton({ type, id, name, disabled, disabledLabel = "Unavailable", className }: Props) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [added]);

  if (disabled) {
    return (
      <button type="button" disabled className={className ?? "btn-secondary w-full"}>
        {disabledLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        add(type, id);
        setAdded(true);
      }}
      className={className ?? "btn-primary w-full"}
      // The accessible name starts with the visible label so voice-control users
      // can say what they see (WCAG 2.5.3), then names the item for screen readers.
      aria-label={added ? `Added ${name} to cart` : `Add to cart, ${name}`}
    >
      {added ? <Check aria-hidden className="size-4" /> : <ShoppingBag aria-hidden className="size-4" />}
      <span aria-live="polite">{added ? "Added" : "Add to cart"}</span>
    </button>
  );
}

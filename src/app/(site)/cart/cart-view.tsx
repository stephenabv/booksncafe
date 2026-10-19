"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useCart } from "@/components/site/cart-context";
import type { CartQuote } from "@/lib/cart-types";
import { formatPrice } from "@/lib/money";
import { VAT_RATE } from "@/lib/pricing";
import { quoteCart } from "@/server/actions/public";

export function CartView() {
  const { lines, hydrated, setQuantity, remove } = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [pending, startTransition] = useTransition();

  // Re-price whenever the cart contents or applied coupon change.
  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    let cancelled = false;
    startTransition(async () => {
      try {
        const result = await quoteCart(lines, appliedCoupon || undefined);
        if (!cancelled) {
          setQuote(result);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("We couldn’t load current prices. Please refresh the page.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lines, appliedCoupon, hydrated]);

  if (!hydrated) {
    return (
      <p className="flex min-h-72 items-center justify-center text-espresso-700" role="status">
        Loading your cart…
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-100/60 px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-espresso-700">Add some books or cafe items to get started.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/books" className="btn-secondary">
            Browse books
          </Link>
          <Link href="/menu" className="btn-primary">
            Cafe menu
          </Link>
        </div>
      </div>
    );
  }

  const currency = quote?.currency ?? "PHP";
  const money = (n: number) => formatPrice(n, currency) ?? "";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section aria-labelledby="cart-items">
        <h2 id="cart-items" className="sr-only">
          Items
        </h2>
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-berry/10 p-3 text-sm text-berry">
            {error}
          </p>
        )}
        <ul className="space-y-4" aria-busy={pending}>
          {(quote?.lines ?? lines.map((l) => ({ ...l, name: "Loading…", href: null, imageUrl: null, imageAlt: null, unitPrice: null, lineTotal: 0, purchasable: true }))).map(
            (line) => (
              <li key={`${line.type}-${line.id}`} className="flex gap-4 rounded-2xl border border-cream-200 bg-white p-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                  {line.imageUrl && <Image src={line.imageUrl} alt={line.imageAlt ?? ""} fill sizes="80px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {line.href ? (
                      <Link href={line.href} className="hover:text-amber-ink">
                        {line.name}
                      </Link>
                    ) : (
                      line.name
                    )}
                  </p>
                  <p className="text-sm text-espresso-600">{line.type === "book" ? "Book" : "Cafe item"}</p>
                  {line.unitPrice !== null && <p className="mt-1 text-sm text-espresso-700">{money(line.unitPrice)} each</p>}
                  {!line.purchasable && <p className="mt-1 text-sm font-medium text-berry">Currently unavailable and not included in the total.</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex size-9 items-center justify-center rounded-full border border-cream-300 hover:bg-cream-100"
                      onClick={() => setQuantity(line.type, line.id, line.quantity - 1)}
                      aria-label={`Decrease quantity of ${line.name}`}
                    >
                      <Minus aria-hidden className="size-4" />
                    </button>
                    <span className="w-8 text-center tabular-nums" aria-label={`Quantity ${line.quantity}`}>
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="inline-flex size-9 items-center justify-center rounded-full border border-cream-300 hover:bg-cream-100"
                      onClick={() => setQuantity(line.type, line.id, line.quantity + 1)}
                      aria-label={`Increase quantity of ${line.name}`}
                    >
                      <Plus aria-hidden className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <p className="font-semibold tabular-nums">{line.purchasable ? money(line.lineTotal) : "—"}</p>
                  <button
                    type="button"
                    className="inline-flex size-9 items-center justify-center rounded-full text-berry hover:bg-berry/10"
                    onClick={() => remove(line.type, line.id)}
                    aria-label={`Remove ${line.name} from cart`}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>

      <aside aria-labelledby="summary" className="h-fit rounded-2xl border border-cream-200 bg-white p-6">
        <h2 id="summary" className="text-xl font-semibold">
          Order summary
        </h2>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedCoupon(couponInput.trim().toUpperCase());
          }}
        >
          <label htmlFor="coupon" className="mb-1 block text-sm font-medium">
            Coupon code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              maxLength={32}
              autoComplete="off"
              className="field uppercase"
            />
            <button type="submit" className="btn-secondary shrink-0" disabled={pending || !couponInput.trim()}>
              Apply
            </button>
          </div>
          <p role="status" className="mt-1 min-h-5 text-sm">
            {quote?.couponError && <span className="text-berry">{quote.couponError}</span>}
            {quote?.coupon && (
              <span className="text-leaf">
                {quote.coupon.code} applied: {quote.coupon.percentOff}% off
              </span>
            )}
          </p>
        </form>

        {quote && (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-espresso-700">Subtotal</dt>
              <dd className="tabular-nums">{money(quote.gross)}</dd>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-leaf">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{money(quote.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-espresso-600">
              <dt>Includes VAT ({Math.round(VAT_RATE * 100)}%)</dt>
              <dd className="tabular-nums">{money(quote.vat)}</dd>
            </div>
            <div className="flex justify-between border-t border-cream-200 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(quote.total)}</dd>
            </div>
          </dl>
        )}

        <button type="button" disabled className="btn-primary mt-6 w-full" aria-describedby="checkout-note">
          Proceed to checkout
        </button>
        <p id="checkout-note" className="mt-2 text-center text-xs text-espresso-600">
          Online checkout isn’t available yet.
        </p>
      </aside>
    </div>
  );
}

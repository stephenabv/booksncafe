import { Link } from "react-router-dom";
import { Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "../modules/Cart";
import type { CartItem } from "../modules/Cart";
import { useState } from "react";

type GroupedCartItem = CartItem & {
  count: number;
};

const VAT_RATE = 0.12;

const COUPON_CODE = "SAVE10";
const COUPON_DISCOUNT = 0.10;

const ViewCart: React.FC = () => {
  const { cart, removeFromCart, getTotalItems, getTotalPrice } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discountApplied, setDiscountApplied] = useState(0);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const groupedItems: Record<string, GroupedCartItem> = cart.reduce(
    (acc, item) => {
      const key = `${item.type}-${item.id}`;
      if (!acc[key]) {
        acc[key] = { ...item, count: 1 };
      } else {
        acc[key].count += 1;
      }
      return acc;
    },
    {} as Record<string, GroupedCartItem>
  );

  const groupedArray: GroupedCartItem[] = Object.values(groupedItems);

  // Calculate subtotal (excluding VAT) and total VAT
  const subtotalExclVAT = groupedArray.reduce((sum, item) => {
    if (!item.price) return sum;
    const priceExclVAT = item.price / (1 + VAT_RATE);
    return sum + priceExclVAT * item.count;
  }, 0);

  const totalVAT = groupedArray.reduce((sum, item) => {
    if (!item.price) return sum;
    const vatPerItem = (item.price * VAT_RATE) / (1 + VAT_RATE);
    return sum + vatPerItem * item.count;
  }, 0);

  const totalWithDiscount = totalPrice * (1 - discountApplied);

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === COUPON_CODE) {
      setDiscountApplied(COUPON_DISCOUNT);
      alert(`Coupon applied! ${COUPON_DISCOUNT * 100}% discount added.`);
    } else {
      setDiscountApplied(0);
      alert("Invalid coupon code");
    }
  };

  if (cart.length === 0) {
    return (
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Your cart is empty
        </h1>
        <p className="text-neutral-400 mb-6">
          Add some books or cafe items to get started.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            to="/books"
            className="rounded-lg border border-amber-500 px-6 py-3 text-md font-medium text-amber-500 transition hover:bg-amber-500 hover:text-neutral-900"
          >
            Browse Books
          </Link>
          <Link
            to="/menu"
            className="rounded-lg bg-amber-500 px-6 py-3 text-md font-medium transition hover:bg-amber-400"
          >
            Cafe Menu
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="text-neutral-400 hover:text-white">
          <ArrowLeft />
        </Link>
        <h1 className="text-4xl font-bold text-amber-500">View Cart</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {groupedArray.map((item) => {
            const vatPerItem = item.price ? (item.price * VAT_RATE) / (1 + VAT_RATE) : 0;
            const priceExclVAT = item.price ? item.price / (1 + VAT_RATE) : 0;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="flex gap-4 bg-neutral-800 rounded-lg p-4"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-20 object-cover rounded"
                  />
                )}

                <div className="flex-1">
                  <h2 className="text-white font-semibold">{item.name}</h2>
                  <p className="text-sm text-neutral-400 capitalize">
                    {item.type === "book" ? "Book" : "Cafe Item"}
                  </p>

                  {item.price !== undefined && (
                    <p className="mt-1 text-amber-400 font-medium">
                      ₱{item.price} × {item.count} = ₱{item.price * item.count}{" "}
                      <span className="text-neutral-400 text-sm">
                        (Excl. VAT: ₱{(priceExclVAT * item.count).toFixed(2)}, VAT: ₱{(vatPerItem * item.count).toFixed(2)})
                      </span>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-400 hover:text-red-500"
                  aria-label="Remove item"
                >
                  <Trash2 />
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-neutral-900 rounded-lg p-6 h-fit space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">
            Order Summary
          </h3>

          {/* Coupon field */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 rounded px-3 py-2 text-white"
            />
            <button
              onClick={applyCoupon}
              className="bg-amber-500 px-4 py-2 rounded font-semibold text-neutral-900"
            >
              Apply
            </button>
          </div>

          <div className="flex justify-between text-neutral-300">
            <span>Subtotal (Excl. VAT)</span>
            <span>₱{subtotalExclVAT.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-neutral-300">
            <span>VAT (12%)</span>
            <span>₱{totalVAT.toFixed(2)}</span>
          </div>

          {discountApplied > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount ({COUPON_CODE})</span>
              <span>-₱{(totalPrice * discountApplied).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-amber-400 font-bold text-lg">
            <span>Total Price</span>
            <span>₱{totalWithDiscount.toFixed(2)}</span>
          </div>

          <button
            className="w-full bg-green-600 hover:bg-green-700 transition py-3 rounded font-bold text-white"
            onClick={() => alert("Checkout coming soon 🚀")}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </section>
  );
};

export default ViewCart;

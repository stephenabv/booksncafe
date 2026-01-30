import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type CartItem = {
  id: number;
  name: string;
  price?: number;
  image?: string;
  type: "book" | "menu";
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  /** ✅ Total number of items */
  const getTotalItems = () => cart.length;

  /** ✅ Total price (menu items only) */
  const getTotalPrice = () =>
    cart.reduce((sum, item) => sum + (item.price ?? 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        getTotalItems,
        getTotalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

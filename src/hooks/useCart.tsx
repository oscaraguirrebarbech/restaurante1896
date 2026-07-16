import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  dishId: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  notes?: string;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (dishId: number) => void;
  setQty: (dishId: number, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const add: CartContextType["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.dishId === item.dishId);
      if (existing) return prev.map((i) => (i.dishId === item.dishId ? { ...i, quantity: i.quantity + qty } : i));
      return [...prev, { ...item, quantity: qty }];
    });
    setOpen(true);
  };

  const remove = (dishId: number) => setItems((prev) => prev.filter((i) => i.dishId !== dishId));
  const setQty = (dishId: number, qty: number) =>
    setItems((prev) => (qty <= 0 ? prev.filter((i) => i.dishId !== dishId) : prev.map((i) => (i.dishId === dishId ? { ...i, quantity: qty } : i))));
  const clear = () => setItems([]);

  const { count, total } = useMemo(
    () => ({
      count: items.reduce((a, i) => a + i.quantity, 0),
      total: items.reduce((a, i) => a + i.price * i.quantity, 0),
    }),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, count, total, add, remove, setQty, clear, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}

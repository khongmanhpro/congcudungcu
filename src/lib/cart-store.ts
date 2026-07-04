"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string | null;
  qty: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: Math.min(i.qty + qty, i.stock || 99) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, qty }] };
        }),
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock || 99)) } : i)),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + (i.salePrice ?? i.price) * i.qty, 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: "cdc-cart" },
  ),
);

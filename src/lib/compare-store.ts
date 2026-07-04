"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompareItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string | null;
  brand: string | null;
  specs: { label: string; value: string }[];
}

interface CompareState {
  items: CompareItem[];
  toggle: (item: CompareItem) => void;
  has: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

const MAX = 4;

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return { items: state.items.filter((i) => i.id !== item.id) };
          }
          if (state.items.length >= MAX) return state;
          return { items: [...state.items, item] };
        }),
      has: (id) => get().items.some((i) => i.id === id),
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "cdc-compare" },
  ),
);

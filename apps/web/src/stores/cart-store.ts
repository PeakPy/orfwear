import { create } from "zustand";

type CartState = {
  itemCount: number;
  setItemCount: (count: number) => void;
};

/** Client-only UI cart mirror. Source of truth remains the API. */
export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,
  setItemCount: (itemCount) => set({ itemCount }),
}));

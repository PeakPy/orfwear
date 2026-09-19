"use client";

import { useCart } from "@/features/cart/use-cart";

/** Keeps the header/dock badge populated on first paint of any route. */
export function CartCountSync() {
  useCart();
  return null;
}

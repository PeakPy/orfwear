import { apiFetch } from "@/lib/api/client";
import type { Cart, ShippingMethod } from "@/types/catalog";

export function getCurrentCart() {
  return apiFetch<Cart>("/cart/current");
}

export function addCartLine(variantId: string, quantity = 1) {
  return apiFetch<Cart>("/cart/lines", {
    method: "POST",
    body: { variant_id: variantId, quantity },
  });
}

export function updateCartLine(lineId: string, quantity: number) {
  return apiFetch<Cart>(`/cart/lines/${lineId}`, {
    method: "PATCH",
    body: { quantity },
  });
}

export function removeCartLine(lineId: string) {
  return apiFetch<Cart>(`/cart/lines/${lineId}`, { method: "DELETE" });
}

export function listShippingMethods() {
  return apiFetch<ShippingMethod[]>("/shipping/methods");
}

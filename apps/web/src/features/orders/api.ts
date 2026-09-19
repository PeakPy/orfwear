import { apiFetch } from "@/lib/api/client";
import type { CheckoutResult, Order, Payment } from "@/types/catalog";

export type CheckoutPayload = {
  shipping_method_code: string;
  address_id?: string;
  address?: {
    full_name: string;
    phone: string;
    address_line: string;
    province?: string;
    city?: string;
    postal_code?: string;
  };
  note?: string;
  save_address?: boolean;
};

export function checkoutOrder(payload: CheckoutPayload, idempotencyKey: string) {
  return apiFetch<CheckoutResult>("/orders/checkout", {
    method: "POST",
    body: payload,
    idempotencyKey,
  });
}

export function listOrders() {
  return apiFetch<Order[]>("/orders/");
}

export function getOrder(orderId: string, token?: string) {
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  return apiFetch<Order>(`/orders/${orderId}${qs}`);
}

export function cancelOrder(orderId: string, token?: string) {
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  return apiFetch<Order>(`/orders/${orderId}/cancel${qs}`, { method: "POST" });
}

export function getPaymentIntent(intentId: string) {
  return apiFetch<Payment>(`/payments/intents/${intentId}`);
}

/** Only accepted by adapters that advertise `supports_manual_completion`. */
export function completeSandboxPayment(intentId: string, succeeded: boolean) {
  return apiFetch<Payment>(`/payments/intents/${intentId}/sandbox-complete`, {
    method: "POST",
    body: { succeeded },
  });
}

const ORDER_TOKENS_KEY = "orf_order_tokens";

export function rememberOrderToken(orderId: string, token: string) {
  if (typeof window === "undefined") return;
  try {
    const store = readOrderTokens();
    store[orderId] = token;
    window.localStorage.setItem(ORDER_TOKENS_KEY, JSON.stringify(store));
  } catch {
    // Guests fall back to the token in the result URL.
  }
}

export function recallOrderToken(orderId: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return readOrderTokens()[orderId];
}

function readOrderTokens(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(ORDER_TOKENS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

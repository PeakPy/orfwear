import { apiFetch } from "@/lib/api/client";
import type { Address, Customer, ProductListItem } from "@/types/catalog";

export type OtpRequestResult = {
  ok: boolean;
  message: string;
  expires_in: number;
  retry_after: number;
  debug_code?: string | null;
};

export type OtpVerifyResult = {
  ok: boolean;
  message: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: Customer;
};

export function requestOtp(phone: string) {
  return apiFetch<OtpRequestResult>("/users/auth/otp/request", {
    method: "POST",
    body: { phone },
  });
}

export function verifyOtp(phone: string, code: string) {
  return apiFetch<OtpVerifyResult>("/users/auth/otp/verify", {
    method: "POST",
    body: { phone, code },
  });
}

export function getMe() {
  return apiFetch<Customer>("/users/me");
}

export function updateMe(payload: Partial<Pick<Customer, "first_name" | "last_name" | "email">>) {
  return apiFetch<Customer>("/users/me", { method: "PATCH", body: payload });
}

export type AddressPayload = {
  full_name: string;
  phone: string;
  address_line: string;
  province?: string;
  city?: string;
  postal_code?: string;
  label?: string;
  is_default?: boolean;
};

export function listAddresses() {
  return apiFetch<Address[]>("/users/addresses");
}

export function createAddress(payload: AddressPayload) {
  return apiFetch<Address>("/users/addresses", { method: "POST", body: payload });
}

export function updateAddress(id: string, payload: Partial<AddressPayload>) {
  return apiFetch<Address>(`/users/addresses/${id}`, { method: "PATCH", body: payload });
}

export function deleteAddress(id: string) {
  return apiFetch<void>(`/users/addresses/${id}`, { method: "DELETE" });
}

export function listWishlist() {
  return apiFetch<ProductListItem[]>("/users/wishlist");
}

export function addToWishlist(productId: string) {
  return apiFetch<ProductListItem[]>("/users/wishlist", {
    method: "POST",
    body: { product_id: productId },
  });
}

export function removeFromWishlist(productId: string) {
  return apiFetch<ProductListItem[]>(`/users/wishlist/${productId}`, { method: "DELETE" });
}

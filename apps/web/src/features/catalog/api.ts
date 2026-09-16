import { apiFetch } from "@/lib/api/client";
import type { ProductListItem } from "@/types/catalog";

export function listProducts() {
  return apiFetch<ProductListItem[]>("/catalog/products");
}

export function getProduct(slug: string) {
  return apiFetch<ProductListItem>(`/catalog/products/${slug}`);
}

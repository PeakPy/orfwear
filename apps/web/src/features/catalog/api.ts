import { apiFetch } from "@/lib/api/client";
import type {
  CatalogFacets,
  Category,
  CollectionDetail,
  CollectionListItem,
  ProductDetail,
  ProductPage,
} from "@/types/catalog";

export type ProductQuery = {
  q?: string;
  collection?: string;
  category?: string;
  audience?: string;
  sizes?: string[];
  colors?: string[];
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: string;
  page?: number;
  page_size?: number;
};

export function buildProductSearchParams(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.collection) params.set("collection", query.collection);
  if (query.category) params.set("category", query.category);
  if (query.audience && query.audience !== "all") params.set("audience", query.audience);
  if (query.sizes?.length) params.set("sizes", query.sizes.join(","));
  if (query.colors?.length) params.set("colors", query.colors.join(","));
  if (query.min_price != null) params.set("min_price", String(query.min_price));
  if (query.max_price != null) params.set("max_price", String(query.max_price));
  if (query.in_stock) params.set("in_stock", "true");
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  return params;
}

export function listProducts(query: ProductQuery = {}) {
  const qs = buildProductSearchParams(query).toString();
  return apiFetch<ProductPage>(`/catalog/products${qs ? `?${qs}` : ""}`);
}

export function getProduct(slug: string) {
  return apiFetch<ProductDetail>(`/catalog/products/${slug}`);
}

export function listCollections() {
  return apiFetch<CollectionListItem[]>("/catalog/collections");
}

export function getCollection(slug: string) {
  return apiFetch<CollectionDetail>(`/catalog/collections/${slug}`);
}

export function listCategories() {
  return apiFetch<Category[]>("/catalog/categories");
}

export function getFacets(scope: { collection?: string; category?: string } = {}) {
  const params = new URLSearchParams();
  if (scope.collection) params.set("collection", scope.collection);
  if (scope.category) params.set("category", scope.category);
  const qs = params.toString();
  return apiFetch<CatalogFacets>(`/catalog/facets${qs ? `?${qs}` : ""}`);
}

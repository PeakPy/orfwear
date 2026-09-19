import type { ProductQuery } from "@/features/catalog/api";

export const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "name", label: "الفبا" },
] as const;

export const AUDIENCE_OPTIONS = [
  { value: "all", label: "همه" },
  { value: "women", label: "زنانه" },
  { value: "men", label: "مردانه" },
] as const;

export type Filters = {
  q: string;
  audience: string;
  category: string;
  sizes: string[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  sort: string;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  audience: "all",
  category: "",
  sizes: [],
  colors: [],
  minPrice: null,
  maxPrice: null,
  inStock: false,
  sort: "newest",
};

export function filtersFromParams(params: URLSearchParams): Filters {
  const csv = (key: string) => {
    const raw = params.get(key);
    return raw ? raw.split(",").filter(Boolean) : [];
  };
  const num = (key: string) => {
    const raw = params.get(key);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    q: params.get("q") ?? "",
    audience: params.get("audience") ?? "all",
    category: params.get("category") ?? "",
    sizes: csv("sizes"),
    colors: csv("colors"),
    minPrice: num("min_price"),
    maxPrice: num("max_price"),
    inStock: params.get("in_stock") === "true",
    sort: params.get("sort") ?? "newest",
  };
}

export function filtersToParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.audience !== "all") params.set("audience", filters.audience);
  if (filters.category) params.set("category", filters.category);
  if (filters.sizes.length) params.set("sizes", filters.sizes.join(","));
  if (filters.colors.length) params.set("colors", filters.colors.join(","));
  if (filters.minPrice != null) params.set("min_price", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("max_price", String(filters.maxPrice));
  if (filters.inStock) params.set("in_stock", "true");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  return params;
}

export function filtersToQuery(filters: Filters, extra: Partial<ProductQuery> = {}): ProductQuery {
  return {
    q: filters.q || undefined,
    audience: filters.audience,
    category: filters.category || undefined,
    sizes: filters.sizes,
    colors: filters.colors,
    min_price: filters.minPrice ?? undefined,
    max_price: filters.maxPrice ?? undefined,
    in_stock: filters.inStock,
    sort: filters.sort,
    ...extra,
  };
}

/** Chips rendered above the grid; each one is individually removable. */
export function activeFilterChips(filters: Filters, categoryLabel?: string) {
  const chips: Array<{ key: string; label: string; clear: (current: Filters) => Filters }> = [];

  if (filters.audience !== "all") {
    const label = AUDIENCE_OPTIONS.find((o) => o.value === filters.audience)?.label ?? filters.audience;
    chips.push({
      key: `audience:${filters.audience}`,
      label,
      clear: (current) => ({ ...current, audience: "all" }),
    });
  }
  if (filters.category) {
    chips.push({
      key: `category:${filters.category}`,
      label: categoryLabel ?? filters.category,
      clear: (current) => ({ ...current, category: "" }),
    });
  }
  for (const size of filters.sizes) {
    chips.push({
      key: `size:${size}`,
      label: `سایز ${size}`,
      clear: (current) => ({ ...current, sizes: current.sizes.filter((s) => s !== size) }),
    });
  }
  for (const color of filters.colors) {
    chips.push({
      key: `color:${color}`,
      label: color,
      clear: (current) => ({ ...current, colors: current.colors.filter((c) => c !== color) }),
    });
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    chips.push({
      key: "price",
      label: "محدودهٔ قیمت",
      clear: (current) => ({ ...current, minPrice: null, maxPrice: null }),
    });
  }
  if (filters.inStock) {
    chips.push({
      key: "in_stock",
      label: "فقط موجود",
      clear: (current) => ({ ...current, inStock: false }),
    });
  }
  return chips;
}

export function countActiveFilters(filters: Filters): number {
  return (
    (filters.audience !== "all" ? 1 : 0) +
    (filters.category ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length +
    (filters.minPrice != null || filters.maxPrice != null ? 1 : 0) +
    (filters.inStock ? 1 : 0)
  );
}

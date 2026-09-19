"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowUpDown, PackageSearch, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getFacets, listProducts } from "@/features/catalog/api";
import { FilterSheet } from "@/features/catalog/filter-sheet";
import {
  activeFilterChips,
  countActiveFilters,
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  filtersToQuery,
  SORT_OPTIONS,
  type Filters,
} from "@/features/catalog/filter-state";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Four rows of the two-column grid; the rest streams in on scroll. */
const PAGE_SIZE = 8;

type ProductBrowserProps = {
  /** Fixed scope applied on top of user filters (collection landing pages). */
  collection?: string;
  showAudience?: boolean;
  emptyTitle?: string;
};

export function ProductBrowser({
  collection,
  showAudience = true,
  emptyTitle = "محصولی پیدا نشد",
}: ProductBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: Filters) => {
      const params = filtersToParams(next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const facetsQuery = useQuery({
    queryKey: ["facets", collection ?? null],
    queryFn: () => getFacets({ collection }),
    staleTime: 5 * 60_000,
  });

  const productsQuery = useInfiniteQuery({
    queryKey: ["products", collection ?? null, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listProducts(filtersToQuery(filters, { collection, page: pageParam, page_size: PAGE_SIZE })),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
  });

  const items = productsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const total = productsQuery.data?.pages[0]?.total ?? 0;
  const activeCount = countActiveFilters(filters);
  const categoryLabel = facetsQuery.data?.categories.find(
    (category) => category.value === filters.category,
  )?.label;
  const chips = activeFilterChips(filters, categoryLabel);

  const sentinel = useInfiniteScroll(
    productsQuery.hasNextPage && !productsQuery.isFetchingNextPage,
    productsQuery.fetchNextPage,
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn("pill h-11 gap-1.5", activeCount > 0 && "is-active")}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal className="size-3.5" strokeWidth={1.5} aria-hidden />
          فیلتر
          {activeCount > 0 ? (
            <span className="rounded-full bg-orf-bg-elevated px-1.5 text-[0.625rem] text-orf-fg">
              {formatNumber(activeCount)}
            </span>
          ) : null}
        </button>

        <label className="pill h-11 gap-1.5 has-focus-visible:outline">
          <ArrowUpDown className="size-3.5" strokeWidth={1.5} aria-hidden />
          <span className="sr-only">ترتیب نمایش</span>
          <select
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
            className="h-11 bg-transparent text-xs font-medium text-orf-muted outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <span className="ms-auto text-xs text-orf-muted" aria-live="polite">
          {productsQuery.isPending ? "…" : `${formatNumber(total)} محصول`}
        </span>
      </div>

      {chips.length > 0 ? (
        <ul className="rail mb-4">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                className="pill is-active h-11 gap-1"
                onClick={() => setFilters(chip.clear(filters))}
              >
                {chip.label}
                <X className="size-3" strokeWidth={2} aria-hidden />
                <span className="sr-only">حذف فیلتر</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="pill h-11"
              onClick={() => setFilters({ ...EMPTY_FILTERS, q: filters.q, sort: filters.sort })}
            >
              پاک کردن همه
            </button>
          </li>
        </ul>
      ) : null}

      {productsQuery.isPending ? <ProductGridSkeleton /> : null}

      {productsQuery.isError ? (
        <EmptyState
          title="بارگذاری ممکن نشد"
          description="اتصال شبکه را بررسی کنید و دوباره تلاش کنید."
        >
          <button type="button" className="btn-primary" onClick={() => productsQuery.refetch()}>
            تلاش دوباره
          </button>
        </EmptyState>
      ) : null}

      {productsQuery.isSuccess && items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={emptyTitle}
          description="فیلترها را تغییر دهید یا عبارت دیگری را امتحان کنید."
        >
          {activeCount > 0 ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setFilters({ ...EMPTY_FILTERS, q: filters.q })}
            >
              حذف فیلترها
            </button>
          ) : null}
        </EmptyState>
      ) : null}

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 2} />
          ))}
        </div>
      ) : null}

      {productsQuery.isFetchingNextPage ? (
        <div className="mt-3">
          <ProductGridSkeleton count={2} />
        </div>
      ) : null}

      <div ref={sentinel} className="h-8" aria-hidden />

      {productsQuery.hasNextPage && !productsQuery.isFetchingNextPage ? (
        <button
          type="button"
          className="btn-secondary mx-auto mt-2 flex"
          onClick={() => productsQuery.fetchNextPage()}
        >
          نمایش بیشتر
        </button>
      ) : null}

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        facets={facetsQuery.data}
        resultCount={total}
        onApply={setFilters}
        showAudience={showAudience}
      />
    </div>
  );
}

function useInfiniteScroll(enabled: boolean, onIntersect: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onIntersect);
  callback.current = onIntersect;

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) callback.current();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}

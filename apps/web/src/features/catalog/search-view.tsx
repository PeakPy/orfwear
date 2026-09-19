"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { ListSkeleton } from "@/components/ui/skeleton";
import { listCategories, listProducts } from "@/features/catalog/api";
import { formatNumber } from "@/lib/format";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const RECENT_KEY = "orf_recent_searches";
const RECENT_LIMIT = 6;

export function SearchView() {
  const [term, setTerm] = useState("");
  const query = useDebounced(term.trim(), DEBOUNCE_MS);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  const enabled = query.length >= MIN_QUERY_LENGTH;

  const results = useQuery({
    queryKey: ["search", query],
    queryFn: () => listProducts({ q: query, page_size: 20 }),
    enabled,
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!enabled || !results.isSuccess || results.data.total === 0) return;
    setRecent(pushRecent(query));
  }, [enabled, results.isSuccess, results.data?.total, query]);

  return (
    <div className="px-4 pt-2 pb-8">
      <h1 className="sr-only">جستجو</h1>

      <div className="glass-surface relative flex items-center rounded-[var(--orf-radius-pill)] px-2 shadow-[var(--orf-shadow-md)]">
        <Search className="mx-2 size-4 shrink-0 text-orf-muted" strokeWidth={1.5} aria-hidden />
        <input
          className="field-input min-h-11 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:shadow-none"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="نام محصول، دسته یا رنگ…"
          aria-label="جستجوی محصول"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
        />
        {term ? (
          <button
            type="button"
            onClick={() => setTerm("")}
            className="btn-icon size-9 min-h-9 min-w-9 border-0 bg-transparent shadow-none"
            aria-label="پاک کردن جستجو"
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        ) : null}
      </div>

      {!enabled ? (
        <div className="mt-7 space-y-8">
          {recent.length > 0 ? (
            <Section title="جستجوهای اخیر">
              <ul className="rail">
                {recent.map((item) => (
                  <li key={item}>
                    <button type="button" className="pill h-11" onClick={() => setTerm(item)}>
                      {item}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className="pill h-11"
                    onClick={() => setRecent(clearRecent())}
                  >
                    پاک کردن
                  </button>
                </li>
              </ul>
            </Section>
          ) : null}

          {categories.data && categories.data.length > 0 ? (
            <Section title="دسته‌های پرجستجو">
              <ul className="grid grid-cols-2 gap-2">
                {categories.data.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="flex min-h-11 items-center justify-between rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-3.5 text-sm font-medium"
                    >
                      {category.name}
                      <span className="text-[0.6875rem] font-normal text-orf-muted">
                        {category.product_count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      ) : (
        <div className="mt-6">
          {results.isPending ? <ListSkeleton count={4} height="h-28" /> : null}

          {results.isError ? (
            <EmptyState title="جستجو ممکن نشد" description="دوباره تلاش کنید.">
              <button type="button" className="btn-primary" onClick={() => results.refetch()}>
                تلاش دوباره
              </button>
            </EmptyState>
          ) : null}

          {results.isSuccess ? (
            results.data.items.length === 0 ? (
              <EmptyState
                icon={Search}
                title="نتیجه‌ای پیدا نشد"
                description={`برای «${query}» چیزی نیافتیم. عبارت کوتاه‌تری را امتحان کنید.`}
                actionHref="/products"
                actionLabel="مرور همهٔ محصولات"
              />
            ) : (
              <>
                <p className="mb-3 text-xs text-orf-muted" aria-live="polite">
                  {formatNumber(results.data.total)} نتیجه برای «{query}»
                </p>
                <ul className="space-y-3">
                  {results.data.items.map((product) => (
                    <li key={product.id}>
                      <ProductCard product={product} variant="list" />
                    </li>
                  ))}
                </ul>
              </>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return useMemo(() => debounced, [debounced]);
}

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function pushRecent(term: string): string[] {
  const next = [term, ...readRecent().filter((item) => item !== term)].slice(0, RECENT_LIMIT);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable in private mode; recents are non-critical.
  }
  return next;
}

function clearRecent(): string[] {
  try {
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
  return [];
}

"use client";

import { useEffect, useState } from "react";

import { Sheet } from "@/components/ui/sheet";
import { AUDIENCE_OPTIONS, SORT_OPTIONS, type Filters } from "@/features/catalog/filter-state";
import { formatPrice, toToman } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CatalogFacets } from "@/types/catalog";

type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  facets?: CatalogFacets;
  resultCount?: number;
  onApply: (filters: Filters) => void;
  /** Hide the audience row where the page already scopes it (collection pages). */
  showAudience?: boolean;
};

export function FilterSheet({
  open,
  onClose,
  filters,
  facets,
  resultCount,
  onApply,
  showAudience = true,
}: FilterSheetProps) {
  const [draft, setDraft] = useState<Filters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const priceMax = facets?.price_max ?? 0;
  const priceMin = facets?.price_min ?? 0;
  const sliderValue = draft.maxPrice ?? priceMax;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="فیلترها"
      description={resultCount != null ? `${resultCount} محصول` : undefined}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => {
              const cleared: Filters = {
                ...draft,
                audience: "all",
                category: "",
                sizes: [],
                colors: [],
                minPrice: null,
                maxPrice: null,
                inStock: false,
              };
              setDraft(cleared);
              onApply(cleared);
            }}
          >
            پاک کردن
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            اعمال فیلتر
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-2">
        {showAudience ? (
          <FilterGroup label="دسته‌بندی کلی">
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn("pill", draft.audience === option.value && "is-active")}
                  aria-pressed={draft.audience === option.value}
                  onClick={() => setDraft({ ...draft, audience: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FilterGroup>
        ) : null}

        {facets?.categories.length ? (
          <FilterGroup label="گروه محصول">
            <div className="flex flex-wrap gap-2">
              {facets.categories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  className={cn("pill", draft.category === category.value && "is-active")}
                  aria-pressed={draft.category === category.value}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      category: draft.category === category.value ? "" : category.value,
                    })
                  }
                >
                  {category.label}
                  <span className="text-[0.625rem] opacity-70">{category.count}</span>
                </button>
              ))}
            </div>
          </FilterGroup>
        ) : null}

        {facets?.sizes.length ? (
          <FilterGroup label="سایز">
            <div className="flex flex-wrap gap-2">
              {facets.sizes.map((size) => {
                const selected = draft.sizes.includes(size.value);
                return (
                  <button
                    key={size.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setDraft({ ...draft, sizes: toggleIn(draft.sizes, size.value) })}
                    className={cn(
                      "flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors",
                      selected
                        ? "border-orf-fg bg-orf-fg text-orf-bg-elevated"
                        : "border-orf-border bg-orf-bg-elevated text-orf-muted",
                    )}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>
          </FilterGroup>
        ) : null}

        {facets?.colors.length ? (
          <FilterGroup label="رنگ">
            <div className="flex flex-wrap gap-2">
              {facets.colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={cn("pill", draft.colors.includes(color.value) && "is-active")}
                  aria-pressed={draft.colors.includes(color.value)}
                  onClick={() => setDraft({ ...draft, colors: toggleIn(draft.colors, color.value) })}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </FilterGroup>
        ) : null}

        {priceMax > priceMin ? (
          <FilterGroup label="حداکثر قیمت">
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              step={Math.max(Math.round((priceMax - priceMin) / 40), 10_000)}
              value={sliderValue}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  maxPrice: Number(event.target.value) >= priceMax ? null : Number(event.target.value),
                })
              }
              className="h-11 w-full accent-orf-fg"
              aria-label="حداکثر قیمت"
              aria-valuetext={`${toToman(sliderValue)} تومان`}
            />
            <p className="mt-1 text-xs text-orf-muted">
              تا {formatPrice(sliderValue)}
            </p>
          </FilterGroup>
        ) : null}

        <FilterGroup label="ترتیب">
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn("pill", draft.sort === option.value && "is-active")}
                aria-pressed={draft.sort === option.value}
                onClick={() => setDraft({ ...draft, sort: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </FilterGroup>

        <label className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-4">
          <span className="text-sm font-medium">فقط کالاهای موجود</span>
          <input
            type="checkbox"
            className="size-5 accent-orf-fg"
            checked={draft.inStock}
            onChange={(event) => setDraft({ ...draft, inStock: event.target.checked })}
          />
        </label>
      </div>
    </Sheet>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-medium text-orf-fg">{label}</legend>
      {children}
    </fieldset>
  );
}

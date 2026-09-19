"use client";

import { ChevronRight, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import { isTabRoute, routeTitle } from "@/config/nav";
import { useCartStore } from "@/stores/cart-store";

/**
 * The single header treatment for the whole storefront: brand chrome on tab
 * roots, back + title on every sub-route. Pages must not render their own.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCartStore((state) => state.itemCount);
  const onTabRoot = isTabRoute(pathname);

  return (
    <header
      className="sticky top-0 z-30 px-3 pb-2"
      style={{ paddingTop: "calc(var(--orf-safe-top) + 0.5rem)" }}
    >
      <div className="glass-surface flex h-[var(--orf-header-height)] items-center gap-2 rounded-[var(--orf-radius-pill)] px-2 shadow-[var(--orf-shadow-md)]">
        {onTabRoot ? (
          <>
            <div className="ps-2">
              <BrandLogo />
            </div>
            <div className="flex-1" />
            <Link href="/search" className="btn-icon border-0 bg-transparent shadow-none" aria-label="جستجو">
              <Search className="size-[1.1rem]" strokeWidth={1.5} aria-hidden />
            </Link>
            <CartButton itemCount={itemCount} />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-icon border-0 bg-transparent shadow-none"
              aria-label="بازگشت"
            >
              <ChevronRight className="size-[1.15rem]" strokeWidth={1.5} aria-hidden />
            </button>
            <p className="min-w-0 flex-1 truncate text-center text-sm font-medium text-orf-fg">
              {routeTitle(pathname)}
            </p>
            <CartButton itemCount={itemCount} />
          </>
        )}
      </div>
    </header>
  );
}

function CartButton({ itemCount }: { itemCount: number }) {
  return (
    <Link
      href="/cart"
      className="btn-icon relative border-0 bg-transparent shadow-none"
      aria-label={itemCount > 0 ? `سبد خرید، ${itemCount} قلم` : "سبد خرید"}
    >
      <ShoppingBag className="size-[1.1rem]" strokeWidth={1.5} aria-hidden />
      {itemCount > 0 ? (
        <span className="count-badge">{itemCount > 99 ? "۹۹+" : itemCount}</span>
      ) : null}
    </Link>
  );
}

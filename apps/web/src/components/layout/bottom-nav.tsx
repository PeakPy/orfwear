"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Search, ShoppingBag, ShoppingCart, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

const tabs = [
  { href: "/", label: "خانه", icon: Home, match: (path: string) => path === "/" },
  {
    href: "/shop",
    label: "فروشگاه",
    icon: ShoppingBag,
    match: (path: string) =>
      path === "/shop" || path.startsWith("/products") || path.startsWith("/collections"),
  },
  {
    href: "/search",
    label: "جستجو",
    icon: Search,
    match: (path: string) => path.startsWith("/search"),
  },
  {
    href: "/account/wishlist",
    label: "علاقه‌مندی",
    icon: Heart,
    match: (path: string) => path.startsWith("/account/wishlist"),
  },
  {
    href: "/cart",
    label: "سبد",
    icon: ShoppingCart,
    match: (path: string) => path.startsWith("/cart") || path.startsWith("/checkout"),
    badge: true,
  },
  {
    href: "/account",
    label: "حساب",
    icon: User,
    match: (path: string) =>
      (path.startsWith("/account") && !path.startsWith("/account/wishlist")) ||
      path.startsWith("/login"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.itemCount);

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: "calc(var(--orf-safe-bottom) + 0.625rem)" }}
    >
      <ul className="glass-surface-dark pointer-events-auto flex h-14 max-w-full items-center gap-0.5 rounded-[var(--orf-radius-pill)] px-1.5 shadow-[var(--orf-shadow-dock)]">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const showBadge = "badge" in tab && tab.badge && itemCount > 0;

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-full transition-[background,color] duration-[var(--orf-duration)] ease-[var(--orf-ease)] motion-reduce:transition-none",
                  active
                    ? "bg-white text-orf-fg shadow-[var(--orf-shadow-sm)]"
                    : "text-white/70 hover:text-white",
                )}
                aria-label={
                  showBadge ? `${tab.label}، ${itemCount} قلم` : tab.label
                }
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-[1.15rem]" strokeWidth={1.5} aria-hidden />
                {showBadge ? (
                  <span className={cn("count-badge", !active && "count-badge--on-dark")}>
                    {itemCount > 9 ? "۹+" : itemCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

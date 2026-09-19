"use client";

import { Heart } from "lucide-react";

import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { useAccessToken } from "@/features/auth/session";
import { useWishlist } from "@/features/wishlist/use-wishlist";

export function WishlistView() {
  const { token, ready } = useAccessToken();
  const wishlist = useWishlist();

  return <Screen title="علاقه‌مندی‌ها">{renderBody()}</Screen>;

  function renderBody() {
    if (!ready || (token && wishlist.isPending)) {
      return <ProductGridSkeleton count={4} />;
    }

    if (!token) {
      return (
        <EmptyState
          icon={Heart}
          title="برای دیدن علاقه‌مندی‌ها وارد شوید"
          description="محصولات ذخیره‌شده به حساب شما وصل می‌شوند."
          actionHref="/login?next=/account/wishlist"
          actionLabel="ورود"
        />
      );
    }

    if (wishlist.isError) {
      return (
        <EmptyState title="علاقه‌مندی‌ها بارگذاری نشد" description="کمی بعد دوباره تلاش کنید." />
      );
    }

    const items = wishlist.data ?? [];

    if (items.length === 0) {
      return (
        <EmptyState
          icon={Heart}
          title="لیست علاقه‌مندی‌ها خالی است"
          description="روی قلب کنار محصولات بزنید تا اینجا ذخیره شوند."
          actionHref="/products"
          actionLabel="مرور محصولات"
        />
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  }
}

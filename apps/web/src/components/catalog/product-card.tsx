"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/toast";
import { useWishlistToggle } from "@/features/wishlist/use-wishlist";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types/catalog";

type ProductCardProps = {
  product: ProductListItem;
  /** `list` is the horizontal row used by search and wishlist results. */
  variant?: "list" | "grid";
  priority?: boolean;
};

/** Photo-first card. Glass is limited to the meta overlay, never the photo itself. */
export function ProductCard({ product, variant = "grid", priority = false }: ProductCardProps) {
  const imageSrc = product.image_url ?? null;
  const price =
    product.min_price_amount != null
      ? formatPrice(product.min_price_amount, product.currency)
      : null;
  const soldOut = product.in_stock === false;

  if (variant === "list") {
    return (
      <Link
        href={`/products/${product.slug}`}
        className="flex gap-3 rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated p-2.5 shadow-[var(--orf-shadow-sm)] transition-transform duration-[var(--orf-duration)] ease-[var(--orf-ease)] active:scale-[0.99] motion-reduce:transition-none"
      >
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[var(--orf-radius-md)] bg-orf-bg-subtle">
          <ProductImage src={imageSrc} alt={product.name} sizes="96px" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
          <p className="text-[0.6875rem] font-medium tracking-wide text-orf-accent">
            {product.brand}
          </p>
          <h3 className="mt-0.5 truncate text-sm font-medium text-orf-fg">{product.name}</h3>
          <p className="mt-1.5 text-sm text-orf-muted">
            {soldOut ? "ناموجود" : (price ?? "—")}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <article className="relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--orf-radius-xl)] bg-orf-bg-subtle shadow-[var(--orf-shadow-md)]">
          <ProductImage
            src={imageSrc}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 430px) 50vw, 215px"
          />
          {soldOut ? (
            <span className="absolute top-2 start-2 rounded-[var(--orf-radius-pill)] bg-orf-fg/85 px-2.5 py-1 text-[0.625rem] font-medium text-orf-bg-elevated">
              ناموجود
            </span>
          ) : null}
          <div className="glass-surface absolute inset-x-2 bottom-2 rounded-[var(--orf-radius-lg)] px-3 py-2">
            <p className="truncate text-xs font-medium text-orf-fg">{product.name}</p>
            <p className="mt-0.5 truncate text-[0.6875rem] text-orf-muted">{price ?? "—"}</p>
          </div>
        </div>
      </Link>
      <WishlistButton productId={product.id} productName={product.name} />
    </article>
  );
}

function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-orf-muted" aria-hidden>
        ORF
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover transition-transform duration-[var(--orf-duration-slow)] ease-[var(--orf-ease)] group-hover:scale-[1.02] motion-reduce:transition-none"
    />
  );
}

function WishlistButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const { contains, toggle, isAuthenticated, isPending } = useWishlistToggle();
  const saved = contains(productId);

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={async () => {
        if (!isAuthenticated) {
          notify("برای ذخیره، وارد شوید.", "error");
          router.push("/login?next=/account/wishlist");
          return;
        }
        try {
          await toggle(productId);
          notify(saved ? `«${productName}» حذف شد.` : `«${productName}» ذخیره شد.`);
        } catch {
          notify("ذخیره نشد. دوباره تلاش کنید.", "error");
        }
      }}
      className="btn-icon absolute top-2 end-2 size-9 min-h-9 min-w-9"
      aria-label={saved ? `حذف ${productName} از علاقه‌مندی‌ها` : `افزودن ${productName} به علاقه‌مندی‌ها`}
      aria-pressed={saved}
    >
      <Heart
        className={cn("size-4", saved && "fill-orf-fg")}
        strokeWidth={1.5}
        aria-hidden
      />
    </button>
  );
}

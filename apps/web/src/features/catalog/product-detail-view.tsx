"use client";

import { Heart, Ruler, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/catalog/product-card";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Section } from "@/components/ui/section";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { useCartMutations } from "@/features/cart/use-cart";
import { SIZE_GUIDE_ROWS } from "@/features/catalog/size-guide-data";
import { useWishlistToggle } from "@/features/wishlist/use-wishlist";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductDetail, Variant } from "@/types/catalog";

const LOW_STOCK_THRESHOLD = 3;

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { notify } = useToast();
  const { add } = useCartMutations({ onError: (message) => notify(message, "error") });
  const wishlist = useWishlistToggle();
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const activeVariants = useMemo(
    () => product.variants.filter((variant) => variant.is_active),
    [product.variants],
  );
  const colors = useMemo(() => unique(activeVariants.map((v) => v.color)), [activeVariants]);
  const [color, setColor] = useState(() => colors[0] ?? "");

  const sizesForColor = useMemo(
    () => activeVariants.filter((variant) => !color || variant.color === color),
    [activeVariants, color],
  );
  const [size, setSize] = useState(() => firstAvailableSize(sizesForColor));
  const [quantity, setQuantity] = useState(1);

  const selected = sizesForColor.find((variant) => variant.size === size) ?? null;
  const available = selected?.quantity_available ?? 0;
  const price = selected?.price_amount ?? product.min_price_amount ?? null;
  const saved = wishlist.contains(product.id);

  const images = product.images.length
    ? product.images.filter((image) => !color || !image.color || image.color === color)
    : [];
  const gallery = images.length ? images : product.images;

  const handleColorChange = (nextColor: string) => {
    setColor(nextColor);
    const nextSizes = activeVariants.filter((variant) => variant.color === nextColor);
    const stillValid = nextSizes.find((variant) => variant.size === size && variant.quantity_available > 0);
    setSize(stillValid ? size : firstAvailableSize(nextSizes));
    setQuantity(1);
  };

  const handleAdd = async () => {
    if (!selected) return;
    try {
      await add.mutateAsync({ variantId: selected.id, quantity });
      notify(`${product.name} به سبد اضافه شد.`);
    } catch {
      // useCartMutations already surfaced the message.
    }
  };

  return (
    <div className="pb-6">
      <Gallery images={gallery} name={product.name} />

      <div className="px-4">
        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.625rem] font-medium tracking-[0.2em] text-orf-accent uppercase">
              {product.brand}
              {product.category_name ? ` · ${product.category_name}` : ""}
            </p>
            <h1 className="mt-1.5 text-2xl leading-snug font-medium tracking-tight text-orf-fg">
              {product.name}
            </h1>
            {price != null ? (
              <p className="mt-2 text-lg font-medium">{formatPrice(price, product.currency)}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-icon shrink-0"
            aria-pressed={saved}
            aria-label={saved ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            onClick={async () => {
              if (!wishlist.isAuthenticated) {
                notify("برای ذخیره، وارد شوید.", "error");
                router.push(`/login?next=/products/${product.slug}`);
                return;
              }
              try {
                await wishlist.toggle(product.id);
                notify(saved ? "از علاقه‌مندی‌ها حذف شد." : "به علاقه‌مندی‌ها اضافه شد.");
              } catch {
                notify("ذخیره نشد.", "error");
              }
            }}
          >
            <Heart className={cn("size-4", saved && "fill-orf-fg")} strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        {colors.length > 1 ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-medium">
              رنگ: <span className="text-orf-muted">{color}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={color === value}
                  onClick={() => handleColorChange(value)}
                  className={cn("pill h-11", color === value && "is-active")}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {sizesForColor.length > 0 ? (
          <fieldset className="mt-6">
            <legend className="flex w-full items-center justify-between gap-3 text-sm font-medium">
              <span>سایز</span>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-normal text-orf-muted underline-offset-4 hover:underline"
              >
                <Ruler className="size-3.5" strokeWidth={1.5} aria-hidden />
                راهنمای سایز
              </button>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizesForColor.map((variant) => {
                const soldOut = variant.quantity_available <= 0;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={soldOut}
                    aria-pressed={size === variant.size}
                    onClick={() => {
                      setSize(variant.size);
                      setQuantity(1);
                    }}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                      size === variant.size
                        ? "border-orf-fg bg-orf-fg text-orf-bg-elevated"
                        : "border-orf-border bg-orf-bg-elevated text-orf-muted",
                      soldOut && "cursor-not-allowed opacity-35 line-through",
                    )}
                  >
                    {variant.size}
                    {soldOut ? <span className="sr-only"> ناموجود</span> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm" aria-live="polite">
            {!selected ? (
              <span className="text-orf-muted">سایز را انتخاب کنید</span>
            ) : available <= 0 ? (
              <span className="text-orf-danger">این سایز ناموجود است</span>
            ) : available <= LOW_STOCK_THRESHOLD ? (
              <span className="text-orf-danger">
                تنها {formatNumber(available)} عدد باقی مانده
              </span>
            ) : (
              <span className="text-orf-success">موجود در انبار</span>
            )}
          </p>
          {selected && available > 0 ? (
            <QuantityStepper
              value={quantity}
              max={Math.min(available, 20)}
              onChange={setQuantity}
            />
          ) : null}
        </div>

        <div className="glass-surface-strong sticky bottom-[calc(var(--orf-nav-height)+var(--orf-safe-bottom)+0.5rem)] z-20 mt-6 rounded-[var(--orf-radius-pill)] p-1.5 shadow-[var(--orf-shadow-lg)]">
          <button
            type="button"
            disabled={!selected || available <= 0 || add.isPending}
            onClick={handleAdd}
            className="btn-primary w-full gap-2"
          >
            <ShoppingBag className="size-4" strokeWidth={1.5} aria-hidden />
            {add.isPending
              ? "در حال افزودن…"
              : !selected
                ? "انتخاب سایز"
                : available <= 0
                  ? "ناموجود"
                  : "افزودن به سبد"}
          </button>
        </div>

        <ul className="mt-6 space-y-2">
          <Assurance icon={Truck} text="ارسال رایگان برای سفارش بالای ۵۰۰ هزار تومان" />
          <Assurance icon={ShieldCheck} text="۷ روز مهلت مرجوعی بدون توضیح" />
        </ul>

        <div className="mt-6 space-y-2">
          <Accordion title="توضیحات" defaultOpen>
            <p>{product.description}</p>
          </Accordion>
          {product.material ? (
            <Accordion title="جنس و ترکیب">
              <p>{product.material}</p>
            </Accordion>
          ) : null}
          {product.care ? (
            <Accordion title="نگهداری">
              <p>{product.care}</p>
            </Accordion>
          ) : null}
          <Accordion title="ارسال و مرجوعی">
            <p>
              سفارش‌ها در روزهای کاری ظرف ۲۴ ساعت پردازش می‌شوند. جزئیات کامل در{" "}
              <Link href="/shipping" className="underline underline-offset-4">
                صفحهٔ ارسال
              </Link>{" "}
              و{" "}
              <Link href="/returns" className="underline underline-offset-4">
                مرجوعی
              </Link>{" "}
              آمده است.
            </p>
          </Accordion>
        </div>

        {product.related && product.related.length > 0 ? (
          <Section title="شاید بپسندید" className="mt-8" actionHref="/products" actionLabel="همه">
            <ul className="rail">
              {product.related.map((related) => (
                <li key={related.id} className="w-[9.5rem]">
                  <ProductCard product={related} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>

      <Sheet
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        title="راهنمای سایز"
        description="اندازه‌ها بر حسب سانتی‌متر و روی بدن اندازه‌گیری شده‌اند."
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-xs text-orf-muted">
              <th className="py-2 font-medium">سایز</th>
              <th className="py-2 font-medium">دور سینه</th>
              <th className="py-2 font-medium">دور کمر</th>
              <th className="py-2 font-medium">دور باسن</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_GUIDE_ROWS.map((row) => (
              <tr key={row.size} className="border-t border-orf-border">
                <td className="py-2.5 font-medium">{row.size}</td>
                <td className="py-2.5 text-orf-muted">{row.chest}</td>
                <td className="py-2.5 text-orf-muted">{row.waist}</td>
                <td className="py-2.5 text-orf-muted">{row.hip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link href="/size-guide" className="btn-secondary mt-5 flex w-full">
          راهنمای کامل اندازه‌گیری
        </Link>
      </Sheet>
    </div>
  );
}

function Gallery({ images, name }: { images: { url: string; alt?: string }[]; name: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="mx-4 flex aspect-[3/4] items-center justify-center rounded-[var(--orf-radius-2xl)] bg-orf-bg-subtle text-sm text-orf-muted">
        بدون تصویر
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="gallery px-4"
        onScroll={(event) => {
          const element = event.currentTarget;
          const next = Math.round(element.scrollLeft / element.clientWidth);
          setIndex(Math.abs(next));
        }}
        role="group"
        aria-label={`تصاویر ${name}`}
      >
        {images.map((image, position) => (
          <div
            key={image.url}
            className="relative aspect-[3/4] overflow-hidden rounded-[var(--orf-radius-2xl)] bg-orf-bg-subtle shadow-[var(--orf-shadow-md)]"
          >
            <Image
              src={image.url}
              alt={image.alt || `${name} — نمای ${position + 1}`}
              fill
              priority={position === 0}
              sizes="(max-width: 430px) 100vw, 430px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {images.map((image, position) => (
            <span
              key={image.url}
              className={cn(
                "h-1.5 rounded-full transition-all duration-[var(--orf-duration)]",
                position === index ? "w-5 bg-orf-fg" : "w-1.5 bg-orf-border-strong",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Assurance({
  icon: Icon,
  text,
}: {
  icon: typeof Truck;
  text: string;
}) {
  return (
    <li className="flex items-center gap-2.5 rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-3.5 py-2.5 text-xs text-orf-muted">
      <Icon className="size-4 shrink-0 text-orf-accent" strokeWidth={1.5} aria-hidden />
      {text}
    </li>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-4 py-3"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        {title}
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-orf-border text-orf-muted transition-transform group-open:rotate-45 motion-reduce:transition-none"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="pt-2 pb-1 text-sm leading-relaxed text-orf-muted">{children}</div>
    </details>
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function firstAvailableSize(variants: Variant[]): string {
  return (variants.find((variant) => variant.quantity_available > 0) ?? variants[0])?.size ?? "";
}

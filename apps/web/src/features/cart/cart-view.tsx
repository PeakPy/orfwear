"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Tag, Trash2, TriangleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { listShippingMethods } from "@/features/cart/api";
import { useCart, useCartMutations } from "@/features/cart/use-cart";
import { formatNumber, formatPrice } from "@/lib/format";
import type { CartLine } from "@/types/catalog";

export function CartView() {
  const { notify } = useToast();
  const cartQuery = useCart();
  const { update, remove } = useCartMutations({ onError: (message) => notify(message, "error") });

  const shippingQuery = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: listShippingMethods,
    staleTime: 5 * 60_000,
  });

  if (cartQuery.isPending) {
    return (
      <div className="px-4 pt-2 pb-8">
        <h1 className="mb-5 text-[1.75rem] font-medium tracking-tight">سبد خرید</h1>
        <ListSkeleton count={3} height="h-28" />
      </div>
    );
  }

  if (cartQuery.isError) {
    return (
      <div className="px-4 pt-2 pb-8">
        <h1 className="mb-5 text-[1.75rem] font-medium tracking-tight">سبد خرید</h1>
        <EmptyState title="سبد بارگذاری نشد" description="اتصال شبکه را بررسی کنید.">
          <button type="button" className="btn-primary" onClick={() => cartQuery.refetch()}>
            تلاش دوباره
          </button>
        </EmptyState>
      </div>
    );
  }

  const cart = cartQuery.data;
  const busy = update.isPending || remove.isPending;

  if (cart.lines.length === 0) {
    return (
      <div className="px-4 pt-2 pb-8">
        <h1 className="mb-5 text-[1.75rem] font-medium tracking-tight">سبد خرید</h1>
        <EmptyState
          icon={ShoppingBag}
          title="سبد شما خالی است"
          description="از تازه‌ها شروع کنید یا کالکشن‌ها را ببینید."
          actionHref="/products"
          actionLabel="شروع خرید"
        />
      </div>
    );
  }

  // Mirror the method checkout preselects, otherwise the cart would quote a
  // price the shopper never actually gets charged.
  const defaultMethod = shippingQuery.data?.[0];
  const freeOver = defaultMethod?.free_over_amount ?? null;
  const shippingEstimate =
    defaultMethod == null
      ? null
      : freeOver != null && cart.subtotal_amount >= freeOver
        ? 0
        : defaultMethod.price_amount;
  const remainingForFree =
    freeOver != null && cart.subtotal_amount < freeOver ? freeOver - cart.subtotal_amount : 0;

  return (
    <div className="px-4 pt-2 pb-8">
      <div className="mb-5">
        <h1 className="text-[1.75rem] leading-tight font-medium tracking-tight">سبد خرید</h1>
        <p className="mt-1 text-sm text-orf-muted">{formatNumber(cart.item_count)} قلم</p>
      </div>

      {cart.has_unavailable_lines ? (
        <p
          className="mb-4 flex items-start gap-2 rounded-[var(--orf-radius-lg)] border border-orf-danger/30 bg-orf-danger/5 px-3.5 py-3 text-xs leading-relaxed text-orf-danger"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
          موجودی بعضی اقلام تغییر کرده است. پیش از تسویه، تعداد را اصلاح کنید.
        </p>
      ) : null}

      <ul className="space-y-3">
        {cart.lines.map((line) => (
          <li key={line.id}>
            <CartLineRow
              line={line}
              busy={busy}
              onQuantityChange={(quantity) => update.mutate({ lineId: line.id, quantity })}
              onRemove={() => {
                remove.mutate(line.id);
                notify(`«${line.product_name}» حذف شد.`);
              }}
            />
          </li>
        ))}
      </ul>

      <section className="glass-surface-strong mt-6 rounded-[var(--orf-radius-2xl)] p-4">
        <h2 className="sr-only">خلاصهٔ سفارش</h2>

        <div className="flex items-center gap-2 rounded-[var(--orf-radius-pill)] border border-dashed border-orf-border bg-orf-bg-elevated/60 px-3.5 py-2.5">
          <Tag className="size-4 shrink-0 text-orf-muted" strokeWidth={1.5} aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-orf-muted"
            placeholder="کد تخفیف"
            disabled
            aria-describedby="promo-hint"
          />
          <button type="button" className="btn-secondary min-h-9 px-3 py-1 text-xs" disabled>
            اعمال
          </button>
        </div>
        <p id="promo-hint" className="mt-1.5 text-[0.6875rem] text-orf-muted">
          کد تخفیف هنوز فعال نشده است.
        </p>

        <dl className="mt-4 space-y-2.5 text-sm">
          <Row label="جمع اقلام" value={formatPrice(cart.subtotal_amount, cart.currency)} />
          <Row
            label={defaultMethod ? `ارسال (${defaultMethod.title})` : "هزینهٔ ارسال"}
            value={
              shippingEstimate == null
                ? "در مرحلهٔ بعد"
                : shippingEstimate === 0
                  ? "رایگان"
                  : formatPrice(shippingEstimate, cart.currency)
            }
            muted
          />
          {remainingForFree > 0 ? (
            <p className="text-[0.6875rem] text-orf-accent">
              {formatPrice(remainingForFree, cart.currency)} تا ارسال رایگان
            </p>
          ) : null}
          <hr className="divider" />
          <Row
            label="برآورد قابل پرداخت"
            value={formatPrice(cart.subtotal_amount + (shippingEstimate ?? 0), cart.currency)}
            emphasis
          />
          <p className="text-[0.6875rem] text-orf-muted">
            مبلغ نهایی پس از انتخاب روش ارسال در تسویه حساب مشخص می‌شود.
          </p>
        </dl>

        <Link href="/checkout" className="btn-primary mt-4 w-full">
          ادامه و تسویه حساب
        </Link>
        <Link
          href="/products"
          className="mt-3 block text-center text-xs text-orf-muted underline-offset-4 hover:underline"
        >
          ادامهٔ خرید
        </Link>
      </section>
    </div>
  );
}

function CartLineRow({
  line,
  busy,
  onQuantityChange,
  onRemove,
}: {
  line: CartLine;
  busy: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated p-2.5 shadow-[var(--orf-shadow-sm)]">
      <Link
        href={`/products/${line.product_slug}`}
        className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-[var(--orf-radius-md)] bg-orf-bg-subtle"
      >
        {line.image_url ? (
          <Image src={line.image_url} alt="" fill sizes="80px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/products/${line.product_slug}`}
              className="block truncate text-sm font-medium text-orf-fg"
            >
              {line.product_name}
            </Link>
            <p className="mt-0.5 text-xs text-orf-muted">
              {[line.color, line.size].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-orf-muted transition-colors hover:text-orf-danger disabled:opacity-40"
            aria-label={`حذف ${line.product_name}`}
          >
            <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        {!line.is_available ? (
          <p className="mt-1 text-[0.6875rem] text-orf-danger">
            {line.quantity_available > 0
              ? `فقط ${formatNumber(line.quantity_available)} عدد موجود است`
              : "این مدل ناموجود شده است"}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <QuantityStepper
            value={line.quantity}
            max={Math.max(line.quantity_available, 1)}
            disabled={busy}
            onChange={onQuantityChange}
            label={`تعداد ${line.product_name}`}
          />
          <p className="text-sm font-medium">
            {formatPrice(line.line_total_amount, line.currency)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={muted ? "text-orf-muted" : "text-orf-muted"}>{label}</dt>
      <dd className={emphasis ? "text-base font-medium" : "font-medium"}>{value}</dd>
    </div>
  );
}

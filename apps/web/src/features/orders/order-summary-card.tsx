import Image from "next/image";
import Link from "next/link";

import { formatNumber, formatPrice } from "@/lib/format";
import type { Order } from "@/types/catalog";

export function OrderSummaryCard({ order }: { order: Order }) {
  return (
    <section className="rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated p-4 shadow-[var(--orf-shadow-sm)]">
      <h2 className="text-sm font-medium">اقلام سفارش</h2>

      <ul className="mt-3 space-y-3">
        {order.lines.map((line) => (
          <li key={line.id} className="flex gap-3">
            <Link
              href={`/products/${line.product_slug}`}
              className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-[var(--orf-radius-sm)] bg-orf-bg-subtle"
            >
              {line.image_url ? (
                <Image src={line.image_url} alt="" fill sizes="56px" className="object-cover" />
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{line.product_name}</p>
              <p className="mt-0.5 text-xs text-orf-muted">
                {[line.color, line.size].filter(Boolean).join(" · ")} ·{" "}
                {formatNumber(line.quantity)} عدد
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium">
              {formatPrice(line.line_total_amount, order.currency)}
            </p>
          </li>
        ))}
      </ul>

      <hr className="divider my-4" />

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-orf-muted">جمع اقلام</dt>
          <dd className="font-medium">{formatPrice(order.subtotal_amount, order.currency)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-orf-muted">
            ارسال{order.shipping_method_title ? ` — ${order.shipping_method_title}` : ""}
          </dt>
          <dd className="font-medium">
            {order.shipping_amount === 0
              ? "رایگان"
              : formatPrice(order.shipping_amount, order.currency)}
          </dd>
        </div>
        {order.discount_amount > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-orf-muted">تخفیف</dt>
            <dd className="font-medium text-orf-success">
              −{formatPrice(order.discount_amount, order.currency)}
            </dd>
          </div>
        ) : null}
        <hr className="divider" />
        <div className="flex justify-between gap-3">
          <dt className="text-orf-muted">مبلغ کل</dt>
          <dd className="text-base font-medium">
            {formatPrice(order.total_amount, order.currency)}
          </dd>
        </div>
      </dl>

      {order.shipping_address ? (
        <>
          <hr className="divider my-4" />
          <h3 className="text-sm font-medium">نشانی ارسال</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-orf-muted">
            {order.shipping_address.full_name}
            <br />
            {[
              order.shipping_address.province,
              order.shipping_address.city,
              order.shipping_address.address_line,
            ]
              .filter(Boolean)
              .join("، ")}
            {order.shipping_address.postal_code ? (
              <>
                <br />
                کد پستی: <span dir="ltr">{order.shipping_address.postal_code}</span>
              </>
            ) : null}
            <br />
            <span dir="ltr">{order.shipping_address.phone}</span>
          </p>
        </>
      ) : null}
    </section>
  );
}

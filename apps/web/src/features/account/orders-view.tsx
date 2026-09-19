"use client";

import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useAccessToken } from "@/features/auth/session";
import { listOrders } from "@/features/orders/api";
import {
  ORDER_STATUS_LABELS,
  formatDate,
  formatNumber,
  formatPrice,
  orderStatusTone,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export function AccountOrdersView() {
  const { token, ready } = useAccessToken();

  const orders = useQuery({
    queryKey: ["orders", token],
    queryFn: listOrders,
    enabled: Boolean(token),
    retry: false,
  });

  return <Screen title="سفارش‌های من">{renderBody()}</Screen>;

  function renderBody() {
    if (!ready || (token && orders.isPending)) {
      return <ListSkeleton count={3} height="h-28" />;
    }

    if (!token) {
      return (
        <EmptyState
          icon={Package}
          title="برای دیدن سفارش‌ها وارد شوید"
          description="سفارش‌های ثبت‌شده با شمارهٔ شما اینجا نمایش داده می‌شوند."
          actionHref="/login?next=/account/orders"
          actionLabel="ورود"
        />
      );
    }

    if (orders.isError) {
      return (
        <EmptyState title="سفارش‌ها بارگذاری نشدند" description="کمی بعد دوباره تلاش کنید.">
          <button type="button" className="btn-primary" onClick={() => orders.refetch()}>
            تلاش دوباره
          </button>
        </EmptyState>
      );
    }

    if (!orders.data || orders.data.length === 0) {
      return (
        <EmptyState
          icon={Package}
          title="هنوز سفارشی ثبت نکرده‌اید"
          description="با اولین خرید، سفارش‌هایتان اینجا ثبت می‌شود."
          actionHref="/products"
          actionLabel="شروع خرید"
        />
      );
    }

    return (
      <ul className="space-y-3">
        {orders.data.map((order) => (
          <li key={order.id}>
            <Link
              href={`/account/orders/${order.id}`}
              className="block rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated p-3.5 shadow-[var(--orf-shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium" dir="ltr">
                    {order.reference}
                  </p>
                  <p className="mt-0.5 text-xs text-orf-muted">
                    {order.created_at ? formatDate(order.created_at) : ""} ·{" "}
                    {formatNumber(order.item_count)} قلم
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-[var(--orf-radius-pill)] px-2.5 py-1 text-[0.6875rem] font-medium",
                    orderStatusTone(order.status),
                  )}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              {order.lines.length > 0 ? (
                <ul className="mt-3 flex gap-2">
                  {order.lines.slice(0, 4).map((line) => (
                    <li
                      key={line.id}
                      className="relative aspect-[3/4] w-12 overflow-hidden rounded-[var(--orf-radius-sm)] bg-orf-bg-subtle"
                    >
                      {line.image_url ? (
                        <Image
                          src={line.image_url}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : null}
                    </li>
                  ))}
                  {order.lines.length > 4 ? (
                    <li className="flex aspect-[3/4] w-12 items-center justify-center rounded-[var(--orf-radius-sm)] bg-orf-bg-subtle text-xs text-orf-muted">
                      +{formatNumber(order.lines.length - 4)}
                    </li>
                  ) : null}
                </ul>
              ) : null}

              <p className="mt-3 text-sm font-medium">
                {formatPrice(order.total_amount, order.currency)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { OrderSummaryCard } from "@/features/orders/order-summary-card";
import { cancelOrder, getOrder, recallOrderToken } from "@/features/orders/api";
import { ApiError } from "@/lib/api/client";
import {
  ORDER_STATUS_LABELS,
  formatDateTime,
  orderStatusTone,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export function OrderDetailView({ orderId }: { orderId: string }) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const token = recallOrderToken(orderId);

  const orderQuery = useQuery({
    queryKey: ["order", orderId, token],
    queryFn: () => getOrder(orderId, token),
    retry: false,
  });

  const cancel = useMutation({
    mutationFn: () => cancelOrder(orderId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      notify("سفارش لغو شد.");
    },
    onError: (error) =>
      notify(error instanceof ApiError ? error.message : "لغو سفارش ممکن نشد.", "error"),
  });

  if (orderQuery.isPending) {
    return (
      <div className="px-4 pt-2 pb-8">
        <ListSkeleton count={3} height="h-24" />
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="px-4 pt-2 pb-8">
        <EmptyState
          title="سفارش پیدا نشد"
          description="این سفارش به حساب شما تعلق ندارد یا حذف شده است."
          actionHref="/account/orders"
          actionLabel="سفارش‌های من"
        />
      </div>
    );
  }

  const order = orderQuery.data;

  return (
    <div className="px-4 pt-2 pb-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-medium tracking-tight" dir="ltr">
            {order.reference}
          </h1>
          {order.created_at ? (
            <p className="mt-1 text-xs text-orf-muted">{formatDateTime(order.created_at)}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-[var(--orf-radius-pill)] px-3 py-1.5 text-xs font-medium",
            orderStatusTone(order.status),
          )}
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {order.payment_status === "pending" ? (
        <div className="mb-5 rounded-[var(--orf-radius-lg)] border border-orf-accent/35 bg-orf-accent/5 px-3.5 py-3">
          <p className="text-xs leading-relaxed text-orf-fg">
            این سفارش در انتظار پرداخت است.
          </p>
          <Link
            href={`/checkout/result?order_id=${order.id}${token ? `&token=${encodeURIComponent(token)}` : ""}`}
            className="btn-primary mt-3 w-full"
          >
            ادامهٔ پرداخت
          </Link>
        </div>
      ) : null}

      {order.events.length > 0 ? (
        <section className="mb-5 rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated p-4">
          <h2 className="mb-3 text-sm font-medium">پیگیری سفارش</h2>
          <ol className="space-y-4">
            {order.events.map((event, index) => {
              const current = index === order.events.length - 1;
              return (
                <li key={`${event.status}-${event.created_at}`} className="flex gap-3">
                  <span className="flex flex-col items-center" aria-hidden>
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        current
                          ? "border-orf-fg bg-orf-fg text-orf-bg-elevated"
                          : "border-orf-border bg-orf-bg-elevated text-orf-muted",
                      )}
                    >
                      <Check className="size-3" strokeWidth={2.5} />
                    </span>
                    {index < order.events.length - 1 ? (
                      <span className="mt-1 w-px flex-1 bg-orf-border" />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-sm font-medium">
                      {ORDER_STATUS_LABELS[event.status] ?? event.status}
                    </p>
                    {event.note ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-orf-muted">{event.note}</p>
                    ) : null}
                    <p className="mt-0.5 text-[0.6875rem] text-orf-muted">
                      {formatDateTime(event.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <OrderSummaryCard order={order} />

      {order.customer_note ? (
        <p className="mt-4 rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-3.5 py-3 text-xs leading-relaxed text-orf-muted">
          یادداشت شما: {order.customer_note}
        </p>
      ) : null}

      {order.can_cancel ? (
        <button
          type="button"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
          className="mt-5 min-h-11 w-full rounded-[var(--orf-radius-pill)] border border-orf-danger/40 text-sm font-medium text-orf-danger disabled:opacity-50"
        >
          {cancel.isPending ? "در حال لغو…" : "لغو سفارش"}
        </button>
      ) : null}

      <Link href="/contact" className="mt-3 block text-center text-xs text-orf-muted underline-offset-4 hover:underline">
        مشکلی در سفارش دارید؟ با ما تماس بگیرید
      </Link>
    </div>
  );
}

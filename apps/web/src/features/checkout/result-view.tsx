"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleX, Clock, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { OrderSummaryCard } from "@/features/orders/order-summary-card";
import {
  completeSandboxPayment,
  getOrder,
  getPaymentIntent,
  recallOrderToken,
} from "@/features/orders/api";
import { ORDER_STATUS_LABELS } from "@/lib/format";

export function CheckoutResultView() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const orderId = params.get("order_id");
  const token = params.get("token") ?? (orderId ? recallOrderToken(orderId) : undefined);

  const orderQuery = useQuery({
    queryKey: ["order", orderId, token],
    queryFn: () => getOrder(orderId!, token),
    enabled: Boolean(orderId),
    // Poll while payment is still pending so provider callbacks surface quickly.
    refetchInterval: (query) =>
      query.state.data?.payment_status === "pending" ? 3000 : false,
  });

  const intentId = orderQuery.data?.payment_intent_id ?? null;

  const intentQuery = useQuery({
    queryKey: ["payment-intent", intentId],
    queryFn: () => getPaymentIntent(intentId!),
    enabled: Boolean(intentId) && orderQuery.data?.payment_status === "pending",
  });

  const complete = useMutation({
    mutationFn: (succeeded: boolean) => completeSandboxPayment(intentId!, succeeded),
    onSuccess: async (payment) => {
      await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      notify(
        payment.status === "succeeded" ? "پرداخت تأیید شد." : "پرداخت ناموفق ثبت شد.",
        payment.status === "succeeded" ? "success" : "error",
      );
    },
    onError: () => notify("ثبت نتیجهٔ پرداخت ممکن نشد.", "error"),
  });

  if (!orderId) {
    return (
      <div className="px-4 pt-2 pb-8">
        <EmptyState
          icon={PackageSearch}
          title="سفارشی برای نمایش نیست"
          description="اگر سفارشی ثبت کرده‌اید، آن را در حساب کاربری ببینید."
          actionHref="/account/orders"
          actionLabel="سفارش‌های من"
        />
      </div>
    );
  }

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
          description="لینک نامعتبر است یا دسترسی منقضی شده."
          actionHref="/account/orders"
          actionLabel="سفارش‌های من"
        />
      </div>
    );
  }

  const order = orderQuery.data;
  const paid = order.payment_status === "succeeded";
  const failed = order.payment_status === "failed";
  const manual = intentQuery.data?.supports_manual_completion ?? false;
  const gatewayUrl = intentQuery.data?.redirect_url ?? null;

  return (
    <div className="px-4 pt-2 pb-8">
      <section className="glass-surface-strong rounded-[var(--orf-radius-2xl)] px-4 py-6 text-center">
        <span
          className="mx-auto flex size-14 items-center justify-center rounded-full border border-orf-border bg-orf-bg-elevated"
          aria-hidden
        >
          {paid ? (
            <CircleCheck className="size-7 text-orf-success" strokeWidth={1.5} />
          ) : failed ? (
            <CircleX className="size-7 text-orf-danger" strokeWidth={1.5} />
          ) : (
            <Clock className="size-7 text-orf-accent" strokeWidth={1.5} />
          )}
        </span>
        <h1 className="mt-4 text-xl font-medium tracking-tight">
          {paid ? "سفارش شما ثبت شد" : failed ? "پرداخت ناموفق بود" : "در انتظار پرداخت"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-orf-muted">
          {paid
            ? "به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم."
            : failed
              ? "مبلغی کسر نشده است. می‌توانید دوباره تلاش کنید."
              : "پس از تأیید پرداخت، وضعیت سفارش به‌روزرسانی می‌شود."}
        </p>
        <p className="mt-3 text-xs text-orf-muted">
          شمارهٔ سفارش <span dir="ltr">{order.reference}</span> ·{" "}
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </p>
      </section>

      {order.payment_status === "pending" && gatewayUrl ? (
        <a href={gatewayUrl} className="btn-primary mt-5 w-full">
          ادامهٔ پرداخت در درگاه
        </a>
      ) : null}

      {order.payment_status === "pending" && gatewayUrl ? (
        <a href={gatewayUrl} className="btn-primary mt-5 w-full">
          ادامهٔ پرداخت در درگاه
        </a>
      ) : null}

      {order.payment_status === "pending" && manual && intentId ? (
        <section className="mt-5 rounded-[var(--orf-radius-xl)] border border-dashed border-orf-accent/40 bg-orf-accent/5 p-4">
          <h2 className="text-sm font-medium">پرداخت آزمایشی (محیط توسعه)</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-orf-muted">
            درگاه واقعی متصل نیست. برای ادامهٔ تست، نتیجهٔ پرداخت را انتخاب کنید.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={complete.isPending}
              onClick={() => complete.mutate(true)}
            >
              پرداخت موفق
            </button>
            <button
              type="button"
              className="btn-secondary flex-1"
              disabled={complete.isPending}
              onClick={() => complete.mutate(false)}
            >
              ناموفق
            </button>
          </div>
        </section>
      ) : null}

      <div className="mt-5">
        <OrderSummaryCard order={order} />
      </div>

      <div className="mt-5 space-y-2">
        <Link href={`/account/orders/${order.id}`} className="btn-secondary w-full">
          جزئیات سفارش
        </Link>
        <Link href="/products" className="btn-primary w-full">
          ادامهٔ خرید
        </Link>
      </div>
    </div>
  );
}

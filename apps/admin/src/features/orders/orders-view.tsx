"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, fieldClassName } from "@/components/ui/data-table";
import { adminApi } from "@/lib/api/admin";
import { formatDate, formatPrice, orderStatusLabel } from "@/lib/format";

export function OrdersListView() {
  const [status, setStatus] = useState("");
  const orders = useQuery({
    queryKey: ["admin", "orders", status],
    queryFn: () => adminApi.listOrders(status || undefined),
  });

  return (
    <div>
      <PageHeader title="سفارش‌ها" description="فهرست سفارش‌ها و تغییر وضعیت." />
      <DataTable
        columns={["شناسه", "مشتری", "مبلغ", "وضعیت", "تاریخ"]}
        emptyLabel={orders.isLoading ? "در حال بارگذاری…" : "سفارشی نیست."}
        toolbar={
          <select className={fieldClassName() + " max-w-[12rem]"} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">همه وضعیت‌ها</option>
            <option value="pending_payment">در انتظار پرداخت</option>
            <option value="paid">پرداخت‌شده</option>
            <option value="fulfilling">آماده‌سازی</option>
            <option value="shipped">ارسال‌شده</option>
            <option value="completed">تکمیل</option>
            <option value="cancelled">لغو</option>
          </select>
        }
      >
        {(orders.data ?? []).map((order) => (
          <tr key={order.id} className="border-b border-orf-border hover:bg-orf-bg-subtle/50">
            <td className="px-3 py-3">
              <Link href={`/orders/${order.id}`} className="font-medium underline-offset-2 hover:underline">
                {order.id.slice(0, 8)}…
              </Link>
            </td>
            <td className="px-3 py-3 text-orf-muted">{order.customer_email ?? order.customer_phone ?? "مهمان"}</td>
            <td className="px-3 py-3 text-orf-muted">{formatPrice(order.total_amount, order.currency)}</td>
            <td className="px-3 py-3 text-orf-muted">{orderStatusLabel(order.status)}</td>
            <td className="px-3 py-3 text-orf-muted">{formatDate(order.created_at)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

export function OrderDetailView({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const order = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => adminApi.getOrder(orderId),
  });
  const [status, setStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const current = order.data;
  const effectiveStatus = status || current?.status || "";
  const effectiveNotes = notes || current?.staff_notes || "";

  const save = useMutation({
    mutationFn: () =>
      adminApi.updateOrder(orderId, {
        status: effectiveStatus,
        staff_notes: effectiveNotes,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "order", orderId] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  if (order.isLoading) {
    return <p className="text-sm text-orf-muted">در حال بارگذاری…</p>;
  }
  if (!current) {
    return <p className="text-sm text-red-800">سفارش پیدا نشد.</p>;
  }

  return (
    <div>
      <PageHeader
        title={`سفارش ${current.id.slice(0, 8)}…`}
        description={formatDate(current.created_at)}
        actions={
          <Link href="/orders" className="rounded-[var(--orf-radius-md)] border border-orf-border bg-orf-bg-elevated px-3 py-2 text-sm">
            بازگشت
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[var(--orf-radius-md)] border border-orf-border bg-orf-bg-elevated p-5">
          <h2 className="text-sm font-medium">اقلام</h2>
          <ul className="mt-3 divide-y divide-orf-border text-sm">
            {current.lines.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-medium">{line.product_name}</p>
                  <p className="text-xs text-orf-muted">
                    {line.sku} × {line.quantity}
                  </p>
                </div>
                <p>{formatPrice(line.line_total_amount, current.currency)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium">جمع: {formatPrice(current.total_amount, current.currency)}</p>
        </section>

        <section className="space-y-4">
          <div className="rounded-[var(--orf-radius-md)] border border-orf-border bg-orf-bg-elevated p-5">
            <h2 className="text-sm font-medium">وضعیت</h2>
            <p className="mt-1 text-xs text-orf-muted">فعلی: {orderStatusLabel(current.status)}</p>
            <select
              className={fieldClassName() + " mt-3"}
              value={effectiveStatus}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending_payment">در انتظار پرداخت</option>
              <option value="paid">پرداخت‌شده</option>
              <option value="fulfilling">آماده‌سازی</option>
              <option value="shipped">ارسال‌شده</option>
              <option value="completed">تکمیل</option>
              <option value="cancelled">لغو</option>
            </select>
            <label className="mt-3 block text-sm font-medium">یادداشت</label>
            <textarea
              className={fieldClassName() + " mt-1"}
              rows={4}
              value={effectiveNotes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {save.error ? (
              <p className="mt-2 text-sm text-red-800">{(save.error as Error).message}</p>
            ) : null}
            <button
              type="button"
              className="mt-3 rounded-[var(--orf-radius-md)] bg-orf-fg px-3 py-2 text-sm font-medium text-orf-bg-elevated disabled:opacity-50"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              ذخیره تغییرات
            </button>
          </div>
          <div className="rounded-[var(--orf-radius-md)] border border-orf-border bg-orf-bg-elevated p-5 text-sm">
            <p>مشتری: {current.customer_email ?? current.customer_phone ?? "مهمان"}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

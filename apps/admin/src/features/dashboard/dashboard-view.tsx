"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Package, ShoppingBag, Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { adminApi } from "@/lib/api/admin";
import { formatPrice } from "@/lib/format";

export function DashboardView() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.dashboardStats(),
  });

  const cards = [
    {
      label: "سفارش امروز",
      value: data ? String(data.orders_today) : "—",
      hint: data ? `کل: ${data.orders_total}` : "در حال بارگذاری",
      icon: ShoppingBag,
    },
    {
      label: "فروش امروز",
      value: data ? formatPrice(data.sales_today_amount, data.currency) : "—",
      hint: data ? `کل: ${formatPrice(data.sales_total_amount, data.currency)}` : "تومان",
      icon: Wallet,
    },
    {
      label: "موجودی بحرانی",
      value: data ? String(data.low_stock_count) : "—",
      hint: "SKU زیر آستانه",
      icon: AlertTriangle,
    },
    {
      label: "محصولات فعال",
      value: data ? String(data.products_published) : "—",
      hint: data ? `از ${data.products_total} محصول` : "کاتالوگ",
      icon: Package,
    },
  ];

  return (
    <div>
      <PageHeader title="داشبورد" description="نمای سریع سفارش‌ها، موجودی و فروش." />

      {error ? (
        <p className="mb-4 text-sm text-red-800" role="alert">
          خطا در دریافت آمار. وارد شده‌اید و API روی :8001 در دسترس است؟
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <section
              key={card.label}
              className="glass-surface rounded-[var(--orf-radius-xl)] p-4 shadow-[var(--orf-shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-orf-muted">{card.label}</p>
                  <p className="mt-2 text-2xl font-medium tracking-tight text-orf-fg">
                    {isLoading ? "…" : card.value}
                  </p>
                  <p className="mt-1 text-xs text-orf-muted">{card.hint}</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-orf-bg-elevated shadow-[var(--orf-shadow-sm)]">
                  <Icon className="size-4 text-orf-accent" strokeWidth={1.5} aria-hidden />
                </span>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

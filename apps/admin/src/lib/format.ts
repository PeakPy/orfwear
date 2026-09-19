export function formatPrice(amount: number, currency = "IRR"): string {
  if (currency === "IRR") {
    const toman = Math.round(amount / 10);
    const formatted = new Intl.NumberFormat("fa-IR").format(toman);
    return `${formatted} تومان`;
  }
  return new Intl.NumberFormat("fa-IR", { style: "currency", currency }).format(amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const ORDER_STATUS_FA: Record<string, string> = {
  draft: "پیش‌نویس",
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  fulfilling: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  completed: "تکمیل",
  cancelled: "لغو",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_FA[status] ?? status;
}

export const ORDER_STATUSES = [
  "draft",
  "pending_payment",
  "paid",
  "fulfilling",
  "shipped",
  "completed",
  "cancelled",
] as const;

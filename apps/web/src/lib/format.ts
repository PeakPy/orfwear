/** Store amounts are IRR rial; shoppers read toman. */
export function toToman(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(Math.round(amount / 10));
}

export function formatPrice(amount: number, currency = "IRR"): string {
  if (currency !== "IRR") {
    return `${new Intl.NumberFormat("fa-IR").format(amount)} ${currency}`;
  }
  return `${toToman(amount)} تومان`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "پیش‌نویس",
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  fulfilling: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  completed: "تحویل‌شده",
  cancelled: "لغو‌شده",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

/** Status pill classes for order cards and the order detail header. */
export function orderStatusTone(status: string): string {
  if (status === "cancelled") return "bg-orf-danger/10 text-orf-danger";
  if (status === "pending_payment" || status === "draft") {
    return "bg-orf-accent/10 text-orf-accent";
  }
  if (status === "completed") return "bg-orf-success/12 text-orf-success";
  return "bg-orf-bg-subtle text-orf-fg";
}

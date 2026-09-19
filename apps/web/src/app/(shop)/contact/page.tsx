import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Package } from "lucide-react";

import { TrustPage } from "@/features/trust/trust-page";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "پشتیبانی سفارش و محصول ORF Wear.",
};

export default function ContactPage() {
  return (
    <TrustPage
      title="تماس با ما"
      currentHref="/contact"
      lead="برای پیگیری سفارش، انتخاب سایز یا مشکل در پرداخت با ما در تماس باشید."
      sections={[
        {
          heading: "ساعات پاسخ‌گویی",
          paragraphs: ["شنبه تا پنجشنبه، ۱۰ تا ۱۸. پاسخ ایمیل معمولاً در همان روز کاری است."],
        },
        {
          heading: "قبل از ارسال پیام",
          paragraphs: [
            "شمارهٔ سفارش و شمارهٔ موبایلی که با آن خرید کرده‌اید را بنویسید تا سریع‌تر کمک کنیم.",
          ],
        },
      ]}
    >
      <div className="mt-4 space-y-2">
        <a
          href="mailto:support@orfwear.ir"
          className="flex min-h-13 items-center gap-3 rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-4"
        >
          <Mail className="size-4 shrink-0 text-orf-muted" strokeWidth={1.5} aria-hidden />
          <span className="flex-1 text-sm font-medium">ایمیل پشتیبانی</span>
          <span className="text-xs text-orf-muted" dir="ltr">
            support@orfwear.ir
          </span>
        </a>
        <Link
          href="/account/orders"
          className="flex min-h-13 items-center gap-3 rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-4"
        >
          <Package className="size-4 shrink-0 text-orf-muted" strokeWidth={1.5} aria-hidden />
          <span className="flex-1 text-sm font-medium">پیگیری سفارش‌های من</span>
        </Link>
      </div>
    </TrustPage>
  );
}

import type { Metadata } from "next";

import { CheckoutForm } from "@/features/checkout/checkout-form";

export const metadata: Metadata = {
  title: "تسویه حساب",
  description: "ثبت نشانی، انتخاب روش ارسال و پرداخت سفارش.",
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}

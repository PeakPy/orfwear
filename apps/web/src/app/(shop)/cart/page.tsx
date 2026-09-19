import type { Metadata } from "next";

import { CartView } from "@/features/cart/cart-view";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "اقلام انتخابی شما در ORF Wear.",
};

export default function CartPage() {
  return <CartView />;
}

import type { Metadata } from "next";

import { AccountOrdersView } from "@/features/account/orders-view";

export const metadata: Metadata = {
  title: "سفارش‌های من",
  description: "تاریخچهٔ سفارش‌ها و وضعیت آن‌ها.",
};

export default function AccountOrdersPage() {
  return <AccountOrdersView />;
}

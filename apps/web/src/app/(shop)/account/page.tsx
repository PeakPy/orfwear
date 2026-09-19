import type { Metadata } from "next";

import { AccountView } from "@/features/account/account-view";

export const metadata: Metadata = {
  title: "حساب من",
  description: "سفارش‌ها، نشانی‌ها و علاقه‌مندی‌های شما.",
};

export default function AccountPage() {
  return <AccountView />;
}

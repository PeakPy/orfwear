import type { Metadata } from "next";

import { AddressesView } from "@/features/account/addresses-view";

export const metadata: Metadata = {
  title: "نشانی‌ها",
  description: "مدیریت نشانی‌های ارسال.",
};

export default function AddressesPage() {
  return <AddressesView />;
}

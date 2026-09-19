import type { Metadata } from "next";

import { OrderDetailView } from "@/features/account/order-detail-view";

export const metadata: Metadata = {
  title: "جزئیات سفارش",
  description: "اقلام، مبالغ و وضعیت پیگیری سفارش.",
};

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}

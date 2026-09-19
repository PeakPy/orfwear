import { OrderDetailView } from "@/features/orders/orders-view";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}

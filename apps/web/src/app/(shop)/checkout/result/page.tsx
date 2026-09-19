import type { Metadata } from "next";
import { Suspense } from "react";

import { ListSkeleton } from "@/components/ui/skeleton";
import { CheckoutResultView } from "@/features/checkout/result-view";

export const metadata: Metadata = {
  title: "نتیجهٔ سفارش",
  description: "وضعیت سفارش و پرداخت شما.",
};

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 pt-2 pb-8">
          <ListSkeleton count={3} height="h-24" />
        </div>
      }
    >
      <CheckoutResultView />
    </Suspense>
  );
}

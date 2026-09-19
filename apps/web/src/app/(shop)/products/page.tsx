import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { ProductBrowser } from "@/features/catalog/product-browser";

export const metadata: Metadata = {
  title: "محصولات",
  description: "همهٔ محصولات ORF Wear با فیلتر دسته، سایز، رنگ و قیمت.",
};

export default function ProductsPage() {
  return (
    <div className="px-4 pt-2 pb-8">
      <h1 className="sr-only">همهٔ محصولات</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductBrowser />
      </Suspense>
    </div>
  );
}

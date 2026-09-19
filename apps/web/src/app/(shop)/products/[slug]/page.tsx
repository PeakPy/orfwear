import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { getProduct } from "@/features/catalog/api";
import { ProductDetailView } from "@/features/catalog/product-detail-view";
import { ApiError } from "@/lib/api/client";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: product.name,
      description: product.description.slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.description.slice(0, 160),
        images: product.image_url ? [product.image_url] : undefined,
      },
    };
  } catch {
    return { title: "محصول" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  try {
    const product = await getProduct(slug);
    return <ProductDetailView product={product} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return (
      <div className="px-4 py-8">
        <EmptyState
          title="بارگذاری محصول ممکن نشد"
          description="اتصال شبکه را بررسی کنید و دوباره تلاش کنید."
          actionHref="/products"
          actionLabel="همهٔ محصولات"
        />
      </div>
    );
  }
}

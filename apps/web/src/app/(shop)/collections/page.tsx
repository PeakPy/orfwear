import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { listCollections } from "@/features/catalog/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کالکشن‌ها",
  description: "کالکشن‌های فصلی و کپسولی ORF Wear.",
};

export default async function CollectionsPage() {
  const collections = await listCollections().catch(() => null);

  if (!collections) {
    return (
      <div className="px-4 pt-2 pb-8">
        <EmptyState
          title="اتصال برقرار نشد"
          description="کالکشن‌ها بارگذاری نشدند. کمی بعد دوباره تلاش کنید."
          actionHref="/shop"
          actionLabel="بازگشت به فروشگاه"
        />
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="px-4 pt-2 pb-8">
        <EmptyState
          title="هنوز کالکشنی منتشر نشده"
          description="به‌زودی کالکشن‌های جدید اینجا قرار می‌گیرند."
          actionHref="/products"
          actionLabel="مشاهدهٔ محصولات"
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-2 pb-8">
      <h1 className="sr-only">کالکشن‌ها</h1>
      <ul className="space-y-4">
        {collections.map((collection) => (
          <li key={collection.id}>
            <Link
              href={`/collections/${collection.slug}`}
              className="relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-[var(--orf-radius-2xl)] bg-orf-bg-subtle shadow-[var(--orf-shadow-md)]"
            >
              {collection.image_url ? (
                <Image
                  src={collection.image_url}
                  alt=""
                  fill
                  sizes="(max-width: 430px) 100vw, 430px"
                  className="object-cover"
                />
              ) : null}
              <div className="glass-surface-strong relative m-2.5 rounded-[var(--orf-radius-xl)] px-4 py-3">
                <h2 className="text-base font-medium text-orf-fg">{collection.name}</h2>
                {collection.description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-orf-muted">
                    {collection.description}
                  </p>
                ) : null}
                {collection.product_count ? (
                  <p className="mt-1.5 text-[0.6875rem] text-orf-accent">
                    {collection.product_count} محصول
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

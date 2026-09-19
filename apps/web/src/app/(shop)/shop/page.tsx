import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { listCategories, listCollections, listProducts } from "@/features/catalog/api";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه",
  description: "دسته‌ها، کالکشن‌ها و تازه‌های ORF Wear.",
};

const AUDIENCES = [
  { value: "all", label: "همه" },
  { value: "women", label: "زنانه" },
  { value: "men", label: "مردانه" },
] as const;

type ShopPageProps = {
  searchParams: Promise<{ audience?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { audience = "all" } = await searchParams;

  const [collections, categories, products] = await Promise.all([
    listCollections().catch(() => []),
    listCategories().catch(() => []),
    listProducts({ audience, page_size: 6 })
      .then((page) => page.items)
      .catch(() => []),
  ]);

  const unreachable = collections.length === 0 && categories.length === 0 && products.length === 0;

  return (
    <div className="px-4 pt-2 pb-8">
      <div className="mb-5">
        <p className="text-[0.625rem] font-medium tracking-[0.22em] text-orf-accent uppercase">
          Shop
        </p>
        <h1 className="mt-1 text-[1.75rem] leading-tight font-medium tracking-tight text-orf-fg">
          فروشگاه
        </h1>
      </div>

      <nav aria-label="دسته‌بندی کلی" className="rail mb-6">
        {AUDIENCES.map((option) => (
          <Link
            key={option.value}
            href={option.value === "all" ? "/shop" : `/shop?audience=${option.value}`}
            className={cn("pill h-11", audience === option.value && "is-active")}
            aria-current={audience === option.value ? "page" : undefined}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      {unreachable ? (
        <EmptyState
          title="اتصال به کاتالوگ برقرار نشد"
          description="لطفاً کمی بعد دوباره تلاش کنید."
          actionHref="/shop"
          actionLabel="تلاش دوباره"
        />
      ) : null}

      {categories.length > 0 ? (
        <Section title="خرید بر اساس دسته" className="mb-8">
          <ul className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/products?category=${category.slug}${
                    audience !== "all" ? `&audience=${audience}` : ""
                  }`}
                  className="glass-surface flex min-h-14 items-center justify-between gap-2 rounded-[var(--orf-radius-lg)] px-4 text-sm font-medium shadow-[var(--orf-shadow-sm)]"
                >
                  {category.name}
                  <span className="text-[0.6875rem] font-normal text-orf-muted">
                    {category.product_count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {collections.length > 0 ? (
        <Section
          title="کالکشن‌ها"
          className="mb-8"
          actionHref="/collections"
          actionLabel="همه"
        >
          <ul className="grid grid-cols-2 gap-3">
            {collections.slice(0, 4).map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[var(--orf-radius-xl)] bg-orf-bg-subtle shadow-[var(--orf-shadow-md)]"
                >
                  {collection.image_url ? (
                    <Image
                      src={collection.image_url}
                      alt=""
                      fill
                      sizes="(max-width: 430px) 50vw, 215px"
                      className="object-cover"
                    />
                  ) : null}
                  <span className="glass-surface relative m-2 rounded-[var(--orf-radius-lg)] px-3 py-2 text-sm font-medium">
                    {collection.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {products.length > 0 ? (
        <Section
          title="تازه‌ها"
          actionHref={audience === "all" ? "/products" : `/products?audience=${audience}`}
          actionLabel="همه"
        >
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductCard } from "@/components/catalog/product-card";
import { Section } from "@/components/ui/section";
import { listCategories, listCollections, listProducts } from "@/features/catalog/api";
import type { CollectionListItem, ProductListItem } from "@/types/catalog";

const AUDIENCE_ENTRIES = [
  { href: "/shop?audience=women", label: "زنانه", caption: "Women" },
  { href: "/shop?audience=men", label: "مردانه", caption: "Men" },
] as const;

export async function HomeEditorial() {
  const [newArrivals, collections, categories] = await Promise.all([
    listProducts({ sort: "newest", page_size: 4 }).then((page) => page.items).catch(() => []),
    listCollections().catch(() => [] as CollectionListItem[]),
    listCategories().catch(() => []),
  ]);

  const featured = collections[0];
  const heroImage = featured?.image_url ?? newArrivals[0]?.image_url ?? null;

  return (
    <div className="px-4 pt-1 pb-8">
      <section className="relative overflow-hidden rounded-[var(--orf-radius-2xl)] bg-orf-bg-subtle shadow-[var(--orf-shadow-md)]">
        <div className="relative aspect-[4/5] w-full">
          {heroImage ? (
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              sizes="(max-width: 430px) 100vw, 430px"
              className="object-cover"
            />
          ) : null}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(190deg,transparent_35%,rgb(17_17_16/0.42)_100%)]"
          />
          <div className="absolute inset-x-3 bottom-3">
            <div className="glass-surface-strong rounded-[var(--orf-radius-xl)] px-4 py-4">
              <p className="text-[0.625rem] font-medium tracking-[0.22em] text-orf-accent uppercase">
                New season
              </p>
              <h1 className="mt-1.5 text-[1.6rem] leading-snug font-medium tracking-tight text-orf-fg">
                برش‌های آرام
                <br />
                برای روزهای بلند
              </h1>
              <Link href="/products" className="btn-primary mt-4 w-full">
                شروع خرید
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ul className="mt-3 grid grid-cols-2 gap-3">
        {AUDIENCE_ENTRIES.map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              className="glass-surface flex min-h-14 items-center justify-between gap-2 rounded-[var(--orf-radius-lg)] px-4 shadow-[var(--orf-shadow-sm)]"
            >
              <span>
                <span className="block text-[0.625rem] tracking-[0.18em] text-orf-accent uppercase">
                  {entry.caption}
                </span>
                <span className="block text-sm font-medium text-orf-fg">{entry.label}</span>
              </span>
              <ArrowLeft className="size-4 text-orf-muted" strokeWidth={1.5} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      {categories.length > 0 ? (
        <Section title="دسته‌ها" className="mt-8" actionHref="/products" actionLabel="همه">
          <ul className="rail">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/products?category=${category.slug}`} className="pill h-11">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {newArrivals.length > 0 ? (
        <Section
          title="تازه رسیده‌ها"
          eyebrow="New in"
          className="mt-8"
          actionHref="/products"
          actionLabel="همه"
        >
          <div className="grid grid-cols-2 gap-3">
            {newArrivals.map((product: ProductListItem) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Section>
      ) : null}

      {collections.length > 0 ? (
        <Section
          title="کالکشن‌ها"
          className="mt-8"
          actionHref="/collections"
          actionLabel="همه"
        >
          <ul className="rail">
            {collections.map((collection) => (
              <li key={collection.id} className="w-[13rem]">
                <Link
                  href={`/collections/${collection.slug}`}
                  className="relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[var(--orf-radius-xl)] bg-orf-bg-subtle shadow-[var(--orf-shadow-md)]"
                >
                  {collection.image_url ? (
                    <Image
                      src={collection.image_url}
                      alt=""
                      fill
                      sizes="208px"
                      className="object-cover"
                    />
                  ) : null}
                  <span className="glass-surface relative m-2 rounded-[var(--orf-radius-lg)] px-3 py-2.5">
                    <span className="block text-sm font-medium text-orf-fg">{collection.name}</span>
                    {collection.product_count ? (
                      <span className="block text-[0.6875rem] text-orf-muted">
                        {collection.product_count} محصول
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

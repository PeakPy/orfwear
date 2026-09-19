import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getCollection } from "@/features/catalog/api";
import { ProductBrowser } from "@/features/catalog/product-browser";
import { ApiError } from "@/lib/api/client";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const collection = await getCollection(slug);
    return { title: collection.name, description: collection.description.slice(0, 160) };
  } catch {
    return { title: "کالکشن" };
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  let collection;
  try {
    collection = await getCollection(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="pb-8">
      <div className="relative mx-4 aspect-[16/9] overflow-hidden rounded-[var(--orf-radius-2xl)] bg-orf-bg-subtle shadow-[var(--orf-shadow-md)]">
        {collection.image_url ? (
          <Image
            src={collection.image_url}
            alt=""
            fill
            priority
            sizes="(max-width: 430px) 100vw, 430px"
            className="object-cover"
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(190deg,transparent_40%,rgb(17_17_16/0.35)_100%)]"
        />
      </div>

      <div className="px-4 pt-4 pb-5">
        <p className="text-[0.625rem] font-medium tracking-[0.22em] text-orf-accent uppercase">
          Collection
        </p>
        <h1 className="mt-1 text-[1.6rem] leading-tight font-medium tracking-tight text-orf-fg">
          {collection.name}
        </h1>
        {collection.description ? (
          <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-orf-muted">
            {collection.description}
          </p>
        ) : null}
      </div>

      <div className="px-4">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductBrowser
            collection={collection.slug}
            emptyTitle="محصولی در این کالکشن نیست"
          />
        </Suspense>
      </div>
    </div>
  );
}

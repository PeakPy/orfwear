import Link from "next/link";

import { GlassPanel } from "@/components/glass/glass-panel";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl flex-col justify-center gap-10 px-6 py-16">
      <section className="relative overflow-hidden rounded-[2rem]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(196_165_116/0.35),transparent_45%),radial-gradient(circle_at_80%_60%,rgb(90_120_160/0.28),transparent_40%)]"
        />
        <GlassPanel className="relative px-8 py-16 md:px-14 md:py-24">
          <p className="mb-4 text-sm tracking-[0.35em] text-orf-accent uppercase">{siteConfig.brand}</p>
          <h1
            className="max-w-3xl text-5xl leading-none md:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            لباس و پوشیدنی با زبان بصری معاصر
          </h1>
          <p className="mt-6 max-w-xl text-base text-orf-muted md:text-lg">
            فروشگاه ORF — کالکشن‌های فصلی، جزئیات دقیق، و تجربه‌ای نزدیک به برندهای بزرگ مد.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/collections/new"
              className="rounded-full bg-orf-fg px-6 py-3 text-sm font-medium text-orf-bg"
            >
              مشاهده کالکشن جدید
            </Link>
            <Link href="/products" className="glass-surface rounded-full px-6 py-3 text-sm">
              همه محصولات
            </Link>
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}

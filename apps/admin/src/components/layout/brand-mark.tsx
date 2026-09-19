import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  /** Omit or pass null for a non-linked mark (e.g. login). */
  href?: string | null;
  markOnly?: boolean;
  className?: string;
};

export function BrandMark({ href = "/", markOnly = false, className }: BrandMarkProps) {
  const src = markOnly ? "/logo-mark.svg" : "/logo.svg";
  const width = markOnly ? 28 : 88;
  const height = markOnly ? 28 : 24;

  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- brand SVG slots
    <img
      src={src}
      alt="ORF"
      width={width}
      height={height}
      className={cn("h-auto w-auto text-orf-fg", className)}
      decoding="async"
    />
  );

  if (href == null) return image;

  return (
    <Link href={href} className="inline-flex items-center text-orf-fg" aria-label="ORF Admin">
      {image}
    </Link>
  );
}

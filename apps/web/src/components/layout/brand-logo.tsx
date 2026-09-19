import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  markOnly?: boolean;
  className?: string;
};

export function BrandLogo({ href = "/", markOnly = false, className }: BrandLogoProps) {
  const src = markOnly ? "/logo-mark.svg" : "/logo.svg";
  const width = markOnly ? 28 : 88;
  const height = markOnly ? 28 : 24;

  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- brand SVG slots; swap files in /public
    <img
      src={src}
      alt="ORF"
      width={width}
      height={height}
      className={cn("h-auto w-auto", className)}
      decoding="async"
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link href={href} className="inline-flex items-center text-orf-fg" aria-label="ORF — خانه">
      {image}
    </Link>
  );
}

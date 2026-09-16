import Link from "next/link";

import { GlassPanel } from "@/components/glass/glass-panel";
import { siteConfig } from "@/config/site";

const links = [
  { href: "/collections/new", label: "کالکشن" },
  { href: "/products", label: "محصولات" },
  { href: "/cart", label: "سبد" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <GlassPanel className="mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-3">
        <Link href="/" className="text-lg tracking-[0.2em]" style={{ fontFamily: "var(--font-display)" }}>
          {siteConfig.brand}
        </Link>
        <nav className="flex items-center gap-5 text-sm text-orf-muted">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-orf-fg">
              {link.label}
            </Link>
          ))}
        </nav>
      </GlassPanel>
    </header>
  );
}

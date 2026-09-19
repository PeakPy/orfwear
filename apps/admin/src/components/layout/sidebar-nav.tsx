"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navSections } from "@/config/nav";
import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-mark";

type SidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-[var(--orf-header-height)] items-center border-b border-orf-border/70 px-4">
        <BrandMark href="/" />
        <span className="mr-2 rounded-[var(--orf-radius-pill)] bg-orf-bg-subtle px-2 py-0.5 text-[0.6875rem] font-medium text-orf-muted">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="منوی ادمین">
        <ul className="space-y-5">
          {navSections.map((section) => (
            <li key={section.id}>
              <p className="mb-2 px-2 text-[0.7rem] font-medium tracking-wide text-orf-muted">
                {section.label}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex min-h-11 items-center gap-2.5 rounded-[var(--orf-radius-pill)] px-3 py-2 text-sm transition-colors duration-[var(--orf-duration)] ease-[var(--orf-ease)]",
                          active
                            ? "bg-orf-fg font-medium text-orf-bg-elevated shadow-[var(--orf-shadow-sm)]"
                            : "text-orf-muted hover:bg-orf-bg-subtle/80 hover:text-orf-fg",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

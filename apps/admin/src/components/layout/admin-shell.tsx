"use client";

import { LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearSessionCookie, readSessionCookie, type StaffSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-mark";
import { SidebarNav } from "./sidebar-nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [session, setSession] = useState<StaffSession | null>(null);

  useEffect(() => {
    setSession(readSessionCookie());
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  function handleLogout() {
    clearSessionCookie();
    setSession(null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-orf-bg text-orf-fg">
      {/* Desktop sidebar */}
      <aside className="glass-surface-strong fixed inset-y-3 right-3 z-30 hidden w-[var(--orf-sidebar-width)] overflow-hidden rounded-[var(--orf-radius-2xl)] shadow-[var(--orf-shadow-lg)] lg:block">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-orf-frame/35 backdrop-blur-sm transition-opacity duration-[var(--orf-duration)]",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label="بستن منو"
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            "glass-surface-strong absolute inset-y-3 right-3 w-[min(100%,var(--orf-sidebar-width))] overflow-hidden rounded-[var(--orf-radius-2xl)] shadow-[var(--orf-shadow-lg)] transition-transform duration-[var(--orf-duration)] ease-[var(--orf-ease)]",
            drawerOpen ? "translate-x-0" : "translate-x-[110%]",
          )}
        >
          <div className="absolute left-3 top-3 z-10">
            <button type="button" className="btn-icon" aria-label="بستن منو" onClick={() => setDrawerOpen(false)}>
              <X className="size-4" strokeWidth={1.5} />
            </button>
          </div>
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </div>

      <div className="lg:pr-[calc(var(--orf-sidebar-width)+1.5rem)]">
        <header className="sticky top-0 z-20 px-3 pt-3 lg:px-6">
          <div className="glass-surface flex h-[var(--orf-header-height)] items-center justify-between gap-3 rounded-[var(--orf-radius-pill)] px-3 shadow-[var(--orf-shadow-md)] lg:px-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-icon lg:hidden"
                aria-label="باز کردن منو"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
              >
                <Menu className="size-4" strokeWidth={1.5} />
              </button>
              <div className="lg:hidden">
                <BrandMark markOnly href="/" />
              </div>
              <p className="hidden text-sm text-orf-muted sm:block">پنل مدیریت فروشگاه</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {session ? (
                <div className="hidden text-left text-xs leading-tight sm:block">
                  <p className="font-medium text-orf-fg">{session.displayName}</p>
                  <p className="text-orf-muted">{session.email}</p>
                </div>
              ) : (
                <p className="text-xs text-orf-muted">بدون نشست</p>
              )}
              <button type="button" onClick={handleLogout} className="btn-secondary gap-1.5 px-3 text-xs">
                <LogOut className="size-3.5" strokeWidth={1.5} aria-hidden />
                خروج
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

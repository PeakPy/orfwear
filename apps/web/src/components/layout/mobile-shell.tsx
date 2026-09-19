import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteHeader } from "@/components/layout/site-header";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-shell">
      <a href="#main-content" className="skip-link">
        پرش به محتوا
      </a>
      <SiteHeader />
      <div className="mobile-shell__scroll">
        <main id="main-content" className="min-h-full" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

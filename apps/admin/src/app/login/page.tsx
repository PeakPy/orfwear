import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/layout/brand-mark";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-orf-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark href={null} />
          <div>
            <h1 className="text-xl font-medium text-orf-fg">ورود پرسنل</h1>
            <p className="mt-1 text-sm text-orf-muted">پنل مدیریت ORF Wear</p>
          </div>
        </div>

        <div className="glass-surface-strong rounded-[var(--orf-radius-2xl)] p-6 shadow-[var(--orf-shadow-lg)]">
          <Suspense fallback={<p className="text-sm text-orf-muted">در حال بارگذاری…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

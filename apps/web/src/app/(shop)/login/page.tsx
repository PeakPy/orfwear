import type { Metadata } from "next";
import { Suspense } from "react";

import { ListSkeleton } from "@/components/ui/skeleton";
import { LoginOtpForm } from "@/features/auth/login-otp-form";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب ORF Wear با شمارهٔ موبایل.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 pt-2 pb-8">
          <ListSkeleton count={2} height="h-14" />
        </div>
      }
    >
      <LoginOtpForm />
    </Suspense>
  );
}

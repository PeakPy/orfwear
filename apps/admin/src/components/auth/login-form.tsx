"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { createSession, writeSessionCookie } from "@/lib/auth/session";
import { fieldClassName, primaryButtonClassName } from "@/components/ui/data-table";

const loginSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "حداقل ۶ کاراکتر"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "staff@orfwear.ir", password: "orfwear" },
  });

  async function onSubmit(values: LoginValues) {
    setError(null);
    try {
      const result = await adminApi.login(values.email, values.password);
      writeSessionCookie(
        createSession({
          email: result.user.email,
          displayName: result.user.display_name,
          token: result.token,
        }),
      );
      const next = searchParams.get("next") || "/";
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "ورود ناموفق بود. دوباره تلاش کنید.";
      setError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-orf-fg">
          ایمیل پرسنل
        </label>
        <input id="email" type="email" autoComplete="username" className={fieldClassName()} {...register("email")} />
        {errors.email ? <p className="text-xs text-red-800">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-orf-fg">
          رمز عبور
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={fieldClassName()}
          {...register("password")}
        />
        {errors.password ? <p className="text-xs text-red-800">{errors.password.message}</p> : null}
      </div>

      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-orf-muted">
          محلی: <code className="text-[11px]">staff@orfwear.ir</code> /{" "}
          <code className="text-[11px]">orfwear</code> (ساخت خودکار در DEBUG)
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className={primaryButtonClassName(isSubmitting)}>
        {isSubmitting ? "در حال ورود…" : "ورود به پنل"}
      </button>
    </form>
  );
}

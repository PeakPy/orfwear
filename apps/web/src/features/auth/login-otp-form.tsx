"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, MessageSquareDot, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { requestOtp, verifyOtp } from "@/features/auth/api";
import { otpCodeSchema, phoneSchema } from "@/features/checkout/schema";
import { ApiError, setAccessToken } from "@/lib/api/client";
import { formatNumber } from "@/lib/format";

type PhoneValues = z.infer<typeof phoneSchema>;
type CodeValues = z.infer<typeof otpCodeSchema>;

/** Only internal paths are accepted so the `next` param can't be used for redirects off-site. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export function LoginOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const next = safeNext(params.get("next"));
  const [phone, setPhone] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(() => setRetryAfter((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  const phoneForm = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: { code: "" },
  });

  const request = useMutation({
    mutationFn: (values: PhoneValues) => requestOtp(values.phone),
    onSuccess: (result, values) => {
      setPhone(values.phone);
      setDevCode(result.debug_code ?? null);
      setRetryAfter(result.retry_after || 60);
      codeForm.reset({ code: "" });
    },
    onError: (error) =>
      notify(error instanceof ApiError ? error.message : "ارسال کد ممکن نشد.", "error"),
  });

  const verify = useMutation({
    mutationFn: (values: CodeValues) => verifyOtp(phone!, values.code),
    onSuccess: async (result) => {
      setAccessToken(result.access_token);
      // The anonymous cart is merged server-side on verify; refresh what depends on identity.
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.removeQueries({ queryKey: ["me"] });
      notify("خوش آمدید.");
      router.replace(next);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "تأیید کد ممکن نشد.";
      codeForm.setError("code", { message });
    },
  });

  return (
    <div className="px-4 pt-2 pb-8">
      <div className="mb-6">
        <span
          className="flex size-12 items-center justify-center rounded-full border border-orf-border bg-orf-bg-elevated"
          aria-hidden
        >
          {phone ? (
            <MessageSquareDot className="size-5 text-orf-accent" strokeWidth={1.5} />
          ) : (
            <ShieldCheck className="size-5 text-orf-accent" strokeWidth={1.5} />
          )}
        </span>
        <h1 className="mt-4 text-[1.6rem] leading-tight font-medium tracking-tight">
          {phone ? "کد تأیید را وارد کنید" : "ورود یا ثبت‌نام"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-orf-muted">
          {phone ? (
            <>
              کد ۶ رقمی به شمارهٔ <span dir="ltr">{phone}</span> پیامک شد.
            </>
          ) : (
            "شمارهٔ موبایل خود را وارد کنید؛ کد یک‌بارمصرف برایتان پیامک می‌شود."
          )}
        </p>
      </div>

      {!phone ? (
        <form noValidate onSubmit={phoneForm.handleSubmit((values) => request.mutate(values))}>
          <FormField
            label="شمارهٔ موبایل"
            htmlFor="login-phone"
            error={phoneForm.formState.errors.phone?.message}
          >
            <input
              id="login-phone"
              className="field-input"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09xxxxxxxxx"
              aria-invalid={Boolean(phoneForm.formState.errors.phone)}
              {...phoneForm.register("phone")}
            />
          </FormField>

          <button type="submit" className="btn-primary mt-5 w-full" disabled={request.isPending}>
            {request.isPending ? "در حال ارسال…" : "دریافت کد"}
          </button>

          <p className="mt-4 text-center text-[0.6875rem] leading-relaxed text-orf-muted">
            با ورود،{" "}
            <Link href="/terms" className="underline underline-offset-4">
              شرایط استفاده
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              حریم خصوصی
            </Link>{" "}
            را می‌پذیرید.
          </p>
        </form>
      ) : (
        <form noValidate onSubmit={codeForm.handleSubmit((values) => verify.mutate(values))}>
          <FormField
            label="کد تأیید"
            htmlFor="login-code"
            error={codeForm.formState.errors.code?.message}
          >
            <input
              id="login-code"
              className="field-input text-center text-lg tracking-[0.4em]"
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              aria-invalid={Boolean(codeForm.formState.errors.code)}
              {...codeForm.register("code")}
            />
          </FormField>

          {devCode ? (
            <p className="mt-3 rounded-[var(--orf-radius-md)] border border-dashed border-orf-accent/40 bg-orf-accent/5 px-3 py-2 text-xs text-orf-muted">
              کد محیط توسعه: <span dir="ltr">{devCode}</span>
            </p>
          ) : null}

          <button type="submit" className="btn-primary mt-5 w-full" disabled={verify.isPending}>
            {verify.isPending ? "در حال بررسی…" : "تأیید و ورود"}
          </button>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => request.mutate({ phone })}
              disabled={retryAfter > 0 || request.isPending}
              className="text-orf-fg underline underline-offset-4 disabled:text-orf-muted disabled:no-underline"
            >
              {retryAfter > 0
                ? `ارسال دوباره تا ${formatNumber(retryAfter)} ثانیه`
                : "ارسال دوبارهٔ کد"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPhone(null);
                setDevCode(null);
                setRetryAfter(0);
              }}
              className="inline-flex items-center gap-1 text-orf-muted"
            >
              تغییر شماره
              <ArrowRight className="size-3.5" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

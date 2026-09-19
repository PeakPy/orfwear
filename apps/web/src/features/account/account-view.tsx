"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  Heart,
  LogOut,
  MapPin,
  Package,
  Pencil,
  ShieldQuestion,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/ui/form-field";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { listAddresses, listWishlist, updateMe } from "@/features/auth/api";
import { useAccessToken, useSession } from "@/features/auth/session";
import { profileSchema, type ProfileFormValues } from "@/features/checkout/schema";
import { listOrders } from "@/features/orders/api";
import { ORDER_STATUS_LABELS, formatNumber } from "@/lib/format";
import { ApiError } from "@/lib/api/client";

export function AccountView() {
  const { token, ready } = useAccessToken();
  const { customer, isLoading, signOut } = useSession();
  const [editing, setEditing] = useState(false);

  const orders = useQuery({
    queryKey: ["orders", token],
    queryFn: listOrders,
    enabled: Boolean(token),
    retry: false,
  });

  const addresses = useQuery({
    queryKey: ["addresses", token],
    queryFn: listAddresses,
    enabled: Boolean(token),
    retry: false,
  });

  const wishlist = useQuery({
    queryKey: ["wishlist", token],
    queryFn: listWishlist,
    enabled: Boolean(token),
    retry: false,
  });

  if (!ready || (token && isLoading)) {
    return (
      <div className="px-4 pt-2 pb-8">
        <ListSkeleton count={4} height="h-16" />
      </div>
    );
  }

  if (!token || !customer) {
    return <GuestAccount />;
  }

  const activeOrders = (orders.data ?? []).filter(
    (order) => !["completed", "cancelled"].includes(order.status),
  );

  return (
    <div className="px-4 pt-2 pb-8">
      <section className="glass-surface-strong rounded-[var(--orf-radius-2xl)] p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-orf-border bg-orf-bg-elevated"
            aria-hidden
          >
            <UserRound className="size-5 text-orf-muted" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-medium tracking-tight">
              {customer.display_name || "حساب من"}
            </h1>
            <p className="mt-0.5 text-xs text-orf-muted" dir="ltr">
              {customer.phone}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((current) => !current)}
            className="btn-icon shrink-0"
            aria-expanded={editing}
            aria-label="ویرایش اطلاعات"
          >
            <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        {editing ? <ProfileForm onDone={() => setEditing(false)} /> : null}
      </section>

      {activeOrders.length > 0 ? (
        <section className="mt-5">
          <h2 className="mb-2.5 text-sm font-medium">سفارش‌های در جریان</h2>
          <ul className="space-y-2">
            {activeOrders.slice(0, 2).map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex items-center gap-3 rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-3.5 py-3"
                >
                  <Truck className="size-4 shrink-0 text-orf-accent" strokeWidth={1.5} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium" dir="ltr">
                      {order.reference}
                    </span>
                    <span className="block text-xs text-orf-muted">
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </span>
                  <ChevronLeft className="size-4 shrink-0 text-orf-muted" strokeWidth={1.5} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="mt-5" aria-label="بخش‌های حساب">
        <ul className="overflow-hidden rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated">
          <AccountRow
            href="/account/orders"
            icon={Package}
            label="سفارش‌های من"
            meta={orders.data ? formatNumber(orders.data.length) : undefined}
          />
          <AccountRow
            href="/account/addresses"
            icon={MapPin}
            label="نشانی‌ها"
            meta={addresses.data ? formatNumber(addresses.data.length) : undefined}
          />
          <AccountRow
            href="/account/wishlist"
            icon={Heart}
            label="علاقه‌مندی‌ها"
            meta={wishlist.data ? formatNumber(wishlist.data.length) : undefined}
          />
          <AccountRow href="/faq" icon={ShieldQuestion} label="پشتیبانی و سوالات" last />
        </ul>
      </nav>

      <button type="button" onClick={signOut} className="btn-secondary mt-5 w-full gap-2">
        <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
        خروج از حساب
      </button>
    </div>
  );
}

function GuestAccount() {
  return (
    <div className="px-4 pt-2 pb-8">
      <section className="glass-surface-strong rounded-[var(--orf-radius-2xl)] px-4 py-7 text-center">
        <span
          className="mx-auto flex size-14 items-center justify-center rounded-full border border-orf-border bg-orf-bg-elevated"
          aria-hidden
        >
          <UserRound className="size-6 text-orf-muted" strokeWidth={1.5} />
        </span>
        <h1 className="mt-4 text-xl font-medium tracking-tight">به حساب خود وارد شوید</h1>
        <p className="mt-2 text-sm leading-relaxed text-orf-muted">
          با شمارهٔ موبایل وارد شوید تا سفارش‌ها، نشانی‌ها و علاقه‌مندی‌هایتان ذخیره شود.
        </p>
        <Link href="/login?next=/account" className="btn-primary mt-5 w-full">
          ورود یا ثبت‌نام
        </Link>
      </section>

      <nav className="mt-5" aria-label="پیوندهای عمومی">
        <ul className="overflow-hidden rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated">
          <AccountRow href="/checkout/result" icon={Package} label="پیگیری سفارش" />
          <AccountRow href="/shipping" icon={Truck} label="ارسال و تحویل" />
          <AccountRow href="/faq" icon={ShieldQuestion} label="سوالات پرتکرار" last />
        </ul>
      </nav>
    </div>
  );
}

function AccountRow({
  href,
  icon: Icon,
  label,
  meta,
  last = false,
}: {
  href: string;
  icon: typeof Package;
  label: string;
  meta?: string;
  last?: boolean;
}) {
  return (
    <li className={last ? "" : "border-b border-orf-border"}>
      <Link href={href} className="flex min-h-13 items-center gap-3 px-4 py-3.5">
        <Icon className="size-4 shrink-0 text-orf-muted" strokeWidth={1.5} aria-hidden />
        <span className="flex-1 text-sm font-medium">{label}</span>
        {meta ? <span className="text-xs text-orf-muted">{meta}</span> : null}
        <ChevronLeft className="size-4 shrink-0 text-orf-muted" strokeWidth={1.5} aria-hidden />
      </Link>
    </li>
  );
}

function ProfileForm({ onDone }: { onDone: () => void }) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { customer } = useSession();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: "", last_name: "", email: "" },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        first_name: customer.first_name ?? "",
        last_name: customer.last_name ?? "",
        email: customer.email ?? "",
      });
    }
  }, [customer, form]);

  const save = useMutation({
    mutationFn: (values: ProfileFormValues) => updateMe(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      notify("اطلاعات ذخیره شد.");
      onDone();
    },
    onError: (error) =>
      notify(error instanceof ApiError ? error.message : "ذخیره نشد.", "error"),
  });

  return (
    <form
      className="mt-4 space-y-4 border-t border-orf-border pt-4"
      noValidate
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField label="نام" htmlFor="profile-first" error={form.formState.errors.first_name?.message}>
          <input id="profile-first" className="field-input" {...form.register("first_name")} />
        </FormField>
        <FormField label="نام خانوادگی" htmlFor="profile-last" error={form.formState.errors.last_name?.message}>
          <input id="profile-last" className="field-input" {...form.register("last_name")} />
        </FormField>
      </div>
      <FormField label="ایمیل" htmlFor="profile-email" error={form.formState.errors.email?.message}>
        <input
          id="profile-email"
          className="field-input"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          {...form.register("email")}
        />
      </FormField>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={save.isPending}>
          {save.isPending ? "در حال ذخیره…" : "ذخیره"}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onDone}>
          انصراف
        </button>
      </div>
    </form>
  );
}

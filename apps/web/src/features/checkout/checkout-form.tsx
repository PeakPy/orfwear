"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { listAddresses } from "@/features/auth/api";
import { useAccessToken } from "@/features/auth/session";
import { listShippingMethods } from "@/features/cart/api";
import { useCart } from "@/features/cart/use-cart";
import { AddressFormFields } from "@/features/checkout/address-form-fields";
import { addressSchema, type AddressFormValues } from "@/features/checkout/schema";
import { checkoutOrder, rememberOrderToken } from "@/features/orders/api";
import { ApiError } from "@/lib/api/client";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CheckoutForm() {
  const router = useRouter();
  const { notify } = useToast();
  const { token } = useAccessToken();
  const cartQuery = useCart();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [shippingCode, setShippingCode] = useState<string>("");
  const [note, setNote] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);

  // One key per checkout attempt keeps a double submit from creating two orders.
  const idempotencyKey = useRef(createIdempotencyKey());

  const addressesQuery = useQuery({
    queryKey: ["addresses", token],
    queryFn: listAddresses,
    enabled: Boolean(token),
    retry: false,
  });

  const shippingQuery = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: listShippingMethods,
    staleTime: 5 * 60_000,
  });

  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);

  useEffect(() => {
    if (addresses.length > 0 && selectedAddressId === null) {
      setSelectedAddressId((addresses.find((item) => item.is_default) ?? addresses[0]).id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!shippingCode && shippingQuery.data?.length) {
      setShippingCode(shippingQuery.data[0].code);
    }
  }, [shippingCode, shippingQuery.data]);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      province: "",
      city: "",
      address_line: "",
      postal_code: "",
      label: "",
    },
  });

  const checkout = useMutation({
    mutationFn: async (address: AddressFormValues | null) =>
      checkoutOrder(
        {
          shipping_method_code: shippingCode,
          ...(address
            ? { address, save_address: Boolean(token) && saveAddress }
            : { address_id: selectedAddressId ?? undefined }),
          note: note.trim() || undefined,
        },
        idempotencyKey.current,
      ),
    onSuccess: (result) => {
      // Stored first: the gateway sends the shopper back without the token.
      rememberOrderToken(result.order.id, result.order_token);

      const gatewayUrl = result.payment?.redirect_url;
      if (gatewayUrl) {
        window.location.assign(gatewayUrl);
        return;
      }
      router.replace(
        `/checkout/result?order_id=${result.order.id}&token=${encodeURIComponent(result.order_token)}`,
      );
    },
    onError: (error) => {
      // A rejected attempt must be retryable, so rotate the key.
      idempotencyKey.current = createIdempotencyKey();
      notify(error instanceof ApiError ? error.message : "ثبت سفارش انجام نشد.", "error");
    },
  });

  const usingSavedAddress = Boolean(token) && addresses.length > 0 && !useNewAddress;

  const submit = () => {
    if (!shippingCode) {
      notify("روش ارسال را انتخاب کنید.", "error");
      return;
    }
    if (usingSavedAddress) {
      if (!selectedAddressId) {
        notify("یک آدرس را انتخاب کنید.", "error");
        return;
      }
      checkout.mutate(null);
      return;
    }
    void form.handleSubmit((values) => checkout.mutate(values))();
  };

  if (cartQuery.isPending) {
    return (
      <div className="px-4 pt-2 pb-8">
        <ListSkeleton count={3} height="h-24" />
      </div>
    );
  }

  if (cartQuery.isError || !cartQuery.data || cartQuery.data.lines.length === 0) {
    return (
      <div className="px-4 pt-2 pb-8">
        <EmptyState
          title="سبد خرید خالی است"
          description="برای تسویه حساب، ابتدا محصولی به سبد اضافه کنید."
          actionHref="/products"
          actionLabel="مشاهدهٔ محصولات"
        />
      </div>
    );
  }

  const cart = cartQuery.data;
  const method = shippingQuery.data?.find((item) => item.code === shippingCode);
  const shippingAmount =
    method == null
      ? 0
      : method.free_over_amount != null && cart.subtotal_amount >= method.free_over_amount
        ? 0
        : method.price_amount;
  const total = cart.subtotal_amount + shippingAmount;

  return (
    <div className="px-4 pt-2 pb-8">
      {/* The route title already sits in the global header; don't repeat it. */}
      <h1 className="sr-only">تسویه حساب</h1>
      <p className="mb-6 text-sm text-orf-muted">
        {formatNumber(cart.item_count)} قلم · {formatPrice(cart.subtotal_amount, cart.currency)}
      </p>

      {!token ? (
        <p className="mb-5 rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-3.5 py-3 text-xs leading-relaxed text-orf-muted">
          بدون ثبت‌نام هم می‌توانید سفارش دهید.{" "}
          <Link href="/login?next=/checkout" className="font-medium text-orf-fg underline underline-offset-4">
            ورود
          </Link>{" "}
          باعث می‌شود آدرس‌ها و سفارش‌ها ذخیره شوند.
        </p>
      ) : null}

      <Step index={1} title="نشانی ارسال">
        {addressesQuery.isPending && token ? (
          <ListSkeleton count={2} height="h-20" />
        ) : (
          <>
            {addresses.length > 0 ? (
              <ul className="space-y-2">
                {addresses.map((address) => {
                  const active = !useNewAddress && selectedAddressId === address.id;
                  return (
                    <li key={address.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setUseNewAddress(false);
                          setSelectedAddressId(address.id);
                        }}
                        aria-pressed={active}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-[var(--orf-radius-lg)] border bg-orf-bg-elevated px-3.5 py-3 text-right transition-colors",
                          active ? "border-orf-fg" : "border-orf-border",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                            active ? "border-orf-fg bg-orf-fg text-orf-bg-elevated" : "border-orf-border",
                          )}
                          aria-hidden
                        >
                          {active ? <Check className="size-3" strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {address.full_name}
                            {address.label ? (
                              <span className="ms-2 text-[0.6875rem] font-normal text-orf-accent">
                                {address.label}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-orf-muted">
                            {[address.province, address.city, address.address_line]
                              .filter(Boolean)
                              .join("، ")}
                          </span>
                          <span className="mt-1 block text-xs text-orf-muted" dir="ltr">
                            {address.phone}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {addresses.length > 0 ? (
              <button
                type="button"
                onClick={() => setUseNewAddress((current) => !current)}
                className={cn("pill mt-3 h-11 gap-1.5", useNewAddress && "is-active")}
                aria-pressed={useNewAddress}
              >
                <Plus className="size-3.5" strokeWidth={1.5} aria-hidden />
                نشانی جدید
              </button>
            ) : null}

            {addresses.length === 0 || useNewAddress ? (
              <form className="mt-4" noValidate onSubmit={(event) => event.preventDefault()}>
                <AddressFormFields
                  register={form.register}
                  errors={form.formState.errors}
                  idPrefix="checkout"
                />
                {token ? (
                  <label className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-4">
                    <span className="text-sm">ذخیره در آدرس‌های من</span>
                    <input
                      type="checkbox"
                      className="size-5 accent-orf-fg"
                      checked={saveAddress}
                      onChange={(event) => setSaveAddress(event.target.checked)}
                    />
                  </label>
                ) : null}
              </form>
            ) : null}
          </>
        )}
      </Step>

      <Step index={2} title="روش ارسال">
        {shippingQuery.isPending ? (
          <ListSkeleton count={2} height="h-16" />
        ) : shippingQuery.isError || !shippingQuery.data?.length ? (
          <p className="text-sm text-orf-danger">روش‌های ارسال بارگذاری نشدند.</p>
        ) : (
          <ul className="space-y-2">
            {shippingQuery.data.map((option) => {
              const active = shippingCode === option.code;
              const free =
                option.free_over_amount != null && cart.subtotal_amount >= option.free_over_amount;
              return (
                <li key={option.code}>
                  <button
                    type="button"
                    onClick={() => setShippingCode(option.code)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[var(--orf-radius-lg)] border bg-orf-bg-elevated px-3.5 py-3 text-right transition-colors",
                      active ? "border-orf-fg" : "border-orf-border",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        active ? "border-orf-fg bg-orf-fg text-orf-bg-elevated" : "border-orf-border",
                      )}
                      aria-hidden
                    >
                      {active ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{option.title}</span>
                      {option.description ? (
                        <span className="mt-0.5 block text-xs text-orf-muted">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm font-medium">
                      {free || option.price_amount === 0
                        ? "رایگان"
                        : formatPrice(option.price_amount, option.currency)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <FormField label="یادداشت برای پیک" htmlFor="checkout-note" className="mt-4">
          <input
            id="checkout-note"
            className="field-input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="اختیاری"
            maxLength={200}
          />
        </FormField>
      </Step>

      <Step index={3} title="پرداخت" last>
        <dl className="space-y-2.5 text-sm">
          <SummaryRow label="جمع اقلام" value={formatPrice(cart.subtotal_amount, cart.currency)} />
          <SummaryRow
            label={method ? `ارسال — ${method.title}` : "ارسال"}
            value={shippingAmount === 0 ? "رایگان" : formatPrice(shippingAmount, cart.currency)}
          />
          <hr className="divider" />
          <SummaryRow label="مبلغ قابل پرداخت" value={formatPrice(total, cart.currency)} emphasis />
        </dl>

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-orf-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-orf-accent" strokeWidth={1.5} aria-hidden />
          پس از ثبت سفارش به مرحلهٔ پرداخت هدایت می‌شوید. تا تأیید پرداخت، موجودی برای شما رزرو می‌ماند.
        </p>

        <button
          type="button"
          onClick={submit}
          disabled={checkout.isPending}
          className="btn-primary mt-5 w-full"
        >
          {checkout.isPending ? "در حال ثبت…" : `ثبت سفارش — ${formatPrice(total, cart.currency)}`}
        </button>
      </Step>
    </div>
  );
}

function Step({
  index,
  title,
  children,
  last = false,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={last ? "" : "mb-6"}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-orf-fg">
        <span className="flex size-6 items-center justify-center rounded-full bg-orf-fg text-[0.6875rem] font-bold text-orf-bg-elevated">
          {formatNumber(index)}
        </span>
        {title}
      </h2>
      <div className="rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated/70 p-3.5 shadow-[var(--orf-shadow-sm)]">
        {children}
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-orf-muted">{label}</dt>
      <dd className={emphasis ? "text-base font-medium" : "font-medium"}>{value}</dd>
    </div>
  );
}

function createIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `chk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
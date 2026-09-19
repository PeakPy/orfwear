"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { Sheet } from "@/components/ui/sheet";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from "@/features/auth/api";
import { useAccessToken } from "@/features/auth/session";
import { AddressFormFields } from "@/features/checkout/address-form-fields";
import { addressSchema, type AddressFormValues } from "@/features/checkout/schema";
import { ApiError } from "@/lib/api/client";
import type { Address } from "@/types/catalog";

const BLANK: AddressFormValues = {
  full_name: "",
  phone: "",
  province: "",
  city: "",
  address_line: "",
  postal_code: "",
  label: "",
};

export function AddressesView() {
  const { token, ready } = useAccessToken();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);

  const addresses = useQuery({
    queryKey: ["addresses", token],
    queryFn: listAddresses,
    enabled: Boolean(token),
    retry: false,
  });

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: BLANK,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses"] });

  const save = useMutation({
    mutationFn: (values: AddressFormValues) =>
      editing ? updateAddress(editing.id, values) : createAddress(values),
    onSuccess: async () => {
      await invalidate();
      notify(editing ? "نشانی به‌روزرسانی شد." : "نشانی ذخیره شد.");
      closeSheet();
    },
    onError: (error) =>
      notify(error instanceof ApiError ? error.message : "ذخیره نشد.", "error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: async () => {
      await invalidate();
      notify("نشانی حذف شد.");
    },
    onError: () => notify("حذف نشانی ممکن نشد.", "error"),
  });

  const makeDefault = useMutation({
    mutationFn: (address: Address) => updateAddress(address.id, { is_default: true }),
    onSuccess: async () => {
      await invalidate();
      notify("نشانی پیش‌فرض تغییر کرد.");
    },
    onError: () => notify("تغییر پیش‌فرض ممکن نشد.", "error"),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(BLANK);
    setOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    form.reset({
      full_name: address.full_name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      address_line: address.address_line,
      postal_code: address.postal_code,
      label: address.label,
    });
    setOpen(true);
  };

  const closeSheet = () => {
    setOpen(false);
    setEditing(null);
  };

  if (!ready || (token && addresses.isPending)) {
    return (
      <Screen title="نشانی‌ها">
        <ListSkeleton count={2} height="h-24" />
      </Screen>
    );
  }

  if (!token) {
    return (
      <Screen title="نشانی‌ها">
        <EmptyState
          icon={MapPin}
          title="برای مدیریت نشانی‌ها وارد شوید"
          description="نشانی‌های ذخیره‌شده، تسویه حساب را سریع‌تر می‌کند."
          actionHref="/login?next=/account/addresses"
          actionLabel="ورود"
        />
      </Screen>
    );
  }

  const items = addresses.data ?? [];

  return (
    <Screen title="نشانی‌ها">
      {items.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="نشانی ذخیره‌شده‌ای ندارید"
          description="یک نشانی اضافه کنید تا در تسویه حساب سریع‌تر پیش بروید."
        >
          <button type="button" className="btn-primary" onClick={openCreate}>
            افزودن نشانی
          </button>
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((address) => (
              <li
                key={address.id}
                className="rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated p-3.5 shadow-[var(--orf-shadow-sm)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {address.full_name}
                      {address.label ? (
                        <span className="ms-2 text-[0.6875rem] font-normal text-orf-accent">
                          {address.label}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-orf-muted">
                      {[address.province, address.city, address.address_line]
                        .filter(Boolean)
                        .join("، ")}
                    </p>
                    <p className="mt-1 text-xs text-orf-muted" dir="ltr">
                      {address.phone}
                      {address.postal_code ? ` · ${address.postal_code}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="flex size-11 items-center justify-center rounded-full text-orf-muted"
                      aria-label={`ویرایش نشانی ${address.full_name}`}
                    >
                      <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(address.id)}
                      disabled={remove.isPending}
                      className="flex size-11 items-center justify-center rounded-full text-orf-muted hover:text-orf-danger disabled:opacity-40"
                      aria-label={`حذف نشانی ${address.full_name}`}
                    >
                      <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                </div>

                {address.is_default ? (
                  <p className="mt-2.5 text-[0.6875rem] font-medium text-orf-fg">نشانی پیش‌فرض</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeDefault.mutate(address)}
                    disabled={makeDefault.isPending}
                    className="mt-2.5 text-[0.6875rem] text-orf-muted underline underline-offset-4 disabled:opacity-40"
                  >
                    انتخاب به‌عنوان پیش‌فرض
                  </button>
                )}
              </li>
            ))}
          </ul>

          <button type="button" onClick={openCreate} className="btn-secondary mt-4 w-full gap-2">
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            افزودن نشانی جدید
          </button>
        </>
      )}

      <Sheet
        open={open}
        onClose={closeSheet}
        title={editing ? "ویرایش نشانی" : "نشانی جدید"}
      >
        <form noValidate onSubmit={form.handleSubmit((values) => save.mutate(values))}>
          <AddressFormFields
            register={form.register}
            errors={form.formState.errors}
            idPrefix="address"
            showLabel
          />
          <button type="submit" className="btn-primary mt-5 w-full" disabled={save.isPending}>
            {save.isPending ? "در حال ذخیره…" : "ذخیره نشانی"}
          </button>
        </form>
      </Sheet>
    </Screen>
  );
}

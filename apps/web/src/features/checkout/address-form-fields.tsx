"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { FormField } from "@/components/ui/form-field";
import type { AddressFormValues } from "@/features/checkout/schema";

type AddressFormFieldsProps = {
  register: UseFormRegister<AddressFormValues>;
  errors: FieldErrors<AddressFormValues>;
  idPrefix: string;
  showLabel?: boolean;
};

export function AddressFormFields({
  register,
  errors,
  idPrefix,
  showLabel = false,
}: AddressFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField label="نام و نام خانوادگی گیرنده" htmlFor={`${idPrefix}-name`} error={errors.full_name?.message}>
        <input
          id={`${idPrefix}-name`}
          className="field-input"
          autoComplete="name"
          aria-invalid={Boolean(errors.full_name)}
          {...register("full_name")}
        />
      </FormField>

      <FormField label="شمارهٔ موبایل" htmlFor={`${idPrefix}-phone`} error={errors.phone?.message}>
        <input
          id={`${idPrefix}-phone`}
          className="field-input"
          dir="ltr"
          inputMode="tel"
          placeholder="09xxxxxxxxx"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          {...register("phone")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="استان" htmlFor={`${idPrefix}-province`} error={errors.province?.message}>
          <input
            id={`${idPrefix}-province`}
            className="field-input"
            autoComplete="address-level1"
            aria-invalid={Boolean(errors.province)}
            {...register("province")}
          />
        </FormField>
        <FormField label="شهر" htmlFor={`${idPrefix}-city`} error={errors.city?.message}>
          <input
            id={`${idPrefix}-city`}
            className="field-input"
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
            {...register("city")}
          />
        </FormField>
      </div>

      <FormField label="نشانی" htmlFor={`${idPrefix}-line`} error={errors.address_line?.message}>
        <textarea
          id={`${idPrefix}-line`}
          className="field-input field-textarea"
          autoComplete="street-address"
          aria-invalid={Boolean(errors.address_line)}
          {...register("address_line")}
        />
      </FormField>

      <FormField label="کد پستی" htmlFor={`${idPrefix}-postal`} error={errors.postal_code?.message}>
        <input
          id={`${idPrefix}-postal`}
          className="field-input"
          dir="ltr"
          inputMode="numeric"
          autoComplete="postal-code"
          aria-invalid={Boolean(errors.postal_code)}
          {...register("postal_code")}
        />
      </FormField>

      {showLabel ? (
        <FormField
          label="عنوان آدرس"
          htmlFor={`${idPrefix}-label`}
          error={errors.label?.message}
          hint="مثلاً خانه یا محل کار"
        >
          <input id={`${idPrefix}-label`} className="field-input" {...register("label")} />
        </FormField>
      ) : null}
    </div>
  );
}

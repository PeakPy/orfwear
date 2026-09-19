"use client";

import { Minus, Plus } from "lucide-react";

type QuantityStepperProps = {
  value: number;
  max?: number;
  min?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  label?: string;
};

export function QuantityStepper({
  value,
  max = 20,
  min = 1,
  disabled = false,
  onChange,
  label = "تعداد",
}: QuantityStepperProps) {
  return (
    <div
      className="inline-flex items-center rounded-[var(--orf-radius-pill)] border border-orf-border bg-orf-bg-elevated p-1 shadow-[var(--orf-shadow-sm)]"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-full text-orf-fg disabled:opacity-30"
        aria-label="کاهش تعداد"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>
      <span
        className="min-w-9 text-center text-sm font-medium tabular-nums"
        aria-live="polite"
        aria-label={`${label}: ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-full text-orf-fg disabled:opacity-30"
        aria-label="افزایش تعداد"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Full-width bottom sheet used for filters, size guides and confirmations. */
export function Sheet({ open, onClose, title, description, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="sheet-panel"
      >
        <div className="sheet-grabber" aria-hidden />
        <header className="flex items-start justify-between gap-3 px-5 pt-3 pb-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium text-orf-fg">{title}</h2>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-orf-muted">{description}</p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="btn-icon shrink-0" aria-label="بستن">
            <X className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer ? <div className="border-t border-orf-border px-5 py-3">{footer}</div> : null}
      </div>
    </>
  );
}

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: EmptyStateProps) {
  return (
    <div className="rounded-[var(--orf-radius-2xl)] border border-orf-border bg-orf-bg-elevated/80 px-6 py-12 text-center shadow-[var(--orf-shadow-sm)]">
      {Icon ? (
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-orf-bg-subtle">
          <Icon className="size-5 text-orf-muted" strokeWidth={1.5} aria-hidden />
        </span>
      ) : null}
      <p className="text-base font-medium text-orf-fg">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-[30ch] text-sm leading-relaxed text-orf-muted">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn-primary mt-6 inline-flex">
          {actionLabel}
        </Link>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

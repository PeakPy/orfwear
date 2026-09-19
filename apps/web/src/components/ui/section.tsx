import Link from "next/link";

type SectionProps = {
  title: string;
  /** Small caption above the heading; keep to one or two words. */
  eyebrow?: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
};

export function Section({
  title,
  eyebrow,
  actionHref,
  actionLabel,
  children,
  className,
}: SectionProps) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[0.625rem] font-medium tracking-[0.2em] text-orf-accent uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-base font-medium text-orf-fg">{title}</h2>
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="-me-2 flex min-h-11 shrink-0 items-center px-2 text-xs font-medium text-orf-muted underline-offset-4 hover:underline"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

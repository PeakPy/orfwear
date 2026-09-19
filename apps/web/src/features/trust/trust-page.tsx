import Link from "next/link";

import { TRUST_LINKS } from "@/config/nav";

export type TrustSection = {
  heading: string;
  paragraphs: string[];
};

export type TrustFaq = {
  question: string;
  answer: string;
};

type TrustPageProps = {
  title: string;
  /** Editorial lead shown under the (header-provided) route title. */
  lead?: string;
  body?: string[];
  sections?: TrustSection[];
  faqs?: TrustFaq[];
  /** Rendered before the standard trust link footer. */
  children?: React.ReactNode;
  currentHref?: string;
};

/**
 * Shared shell for static trust content. The route title already lives in the
 * global header, so the visible h1 is intentionally omitted here.
 */
export function TrustPage({
  title,
  lead,
  body = [],
  sections = [],
  faqs = [],
  children,
  currentHref,
}: TrustPageProps) {
  return (
    <article className="px-4 pt-2 pb-8">
      <h1 className="sr-only">{title}</h1>

      {lead ? (
        <p className="mb-6 text-base leading-relaxed text-orf-fg">{lead}</p>
      ) : null}

      {body.length > 0 ? (
        <div className="space-y-4 rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated p-4 text-sm leading-relaxed text-orf-muted shadow-[var(--orf-shadow-sm)]">
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {sections.map((section) => (
        <section
          key={section.heading}
          className="mt-4 rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated p-4 shadow-[var(--orf-shadow-sm)]"
        >
          <h2 className="mb-2.5 text-sm font-medium text-orf-fg">{section.heading}</h2>
          <div className="space-y-3 text-sm leading-relaxed text-orf-muted">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}

      {faqs.length > 0 ? (
        <div className="mt-4 space-y-2">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-[var(--orf-radius-lg)] border border-orf-border bg-orf-bg-elevated px-4 py-3 shadow-[var(--orf-shadow-sm)]"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-medium text-orf-fg marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex w-full items-center justify-between gap-3">
                  {item.question}
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border border-orf-border text-orf-muted transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="pb-1 text-sm leading-relaxed text-orf-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      ) : null}

      {children}

      <nav aria-label="صفحات راهنما" className="mt-8">
        <h2 className="mb-2.5 text-xs font-medium tracking-[0.12em] text-orf-muted uppercase">
          راهنمای بیشتر
        </h2>
        <ul className="flex flex-wrap gap-2">
          {TRUST_LINKS.filter((link) => link.href !== currentHref).map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="pill h-11">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}

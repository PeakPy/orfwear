import { cn } from "@/lib/utils";

type DataTableProps = {
  columns: string[];
  children?: React.ReactNode;
  emptyLabel?: string;
  toolbar?: React.ReactNode;
  className?: string;
};

export function DataTable({
  columns,
  children,
  emptyLabel = "موردی یافت نشد.",
  toolbar,
  className,
}: DataTableProps) {
  const rows = children ?? null;
  const hasRows = Boolean(rows);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated shadow-[var(--orf-shadow-sm)]",
        className,
      )}
    >
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-orf-border px-3 py-3">
          {toolbar}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-orf-border bg-orf-bg-subtle/70 text-right">
              {columns.map((column) => (
                <th key={column} className="px-3 py-3 font-medium text-orf-muted">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasRows ? (
              rows
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-16 text-center text-orf-muted">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function fieldClassName() {
  return "w-full min-h-[2.75rem] rounded-[var(--orf-radius-pill)] border border-orf-border bg-orf-bg px-3.5 py-2 text-sm outline-none shadow-[var(--orf-shadow-sm)] transition-colors focus:border-orf-border-strong";
}

export function primaryButtonClassName(disabled?: boolean) {
  return cn(
    "inline-flex min-h-[2.75rem] items-center justify-center rounded-[var(--orf-radius-pill)] bg-orf-fg px-4 py-2 text-sm font-medium text-orf-bg-elevated shadow-[var(--orf-shadow-sm)] transition-opacity",
    disabled && "opacity-50",
  );
}

export function secondaryButtonClassName() {
  return "inline-flex min-h-[2.75rem] items-center justify-center rounded-[var(--orf-radius-pill)] border border-orf-border bg-orf-bg-elevated px-4 py-2 text-sm font-medium text-orf-fg shadow-[var(--orf-shadow-sm)] transition-colors hover:bg-orf-bg-subtle";
}

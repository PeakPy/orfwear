import { cn } from "@/lib/utils";

type ModuleShellProps = {
  children?: React.ReactNode;
  className?: string;
  emptyLabel?: string;
  columns?: string[];
};

/** Realistic table/list chrome without live CRUD yet. */
export function ModuleShell({
  children,
  className,
  emptyLabel = "ماژول در فاز بعد به API وصل می‌شود.",
  columns = ["عنوان", "وضعیت", "به‌روزرسانی"],
}: ModuleShellProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated shadow-[var(--orf-shadow-sm)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-orf-border px-3 py-3">
        <div className="h-11 min-w-[10rem] flex-1 rounded-[var(--orf-radius-pill)] border border-orf-border bg-orf-bg px-4 text-sm leading-[2.75rem] text-orf-muted">
          جستجو…
        </div>
        <div className="h-11 rounded-[var(--orf-radius-pill)] border border-orf-border bg-orf-bg px-4 text-xs leading-[2.75rem] text-orf-muted">
          فیلتر
        </div>
      </div>

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
            {children ?? (
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

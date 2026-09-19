import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="aspect-[3/4] w-full rounded-[var(--orf-radius-xl)]" />
          <Skeleton className="h-3 w-3/4 rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3, height = "h-24" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={cn("w-full rounded-[var(--orf-radius-xl)]", height)} />
      ))}
    </div>
  );
}

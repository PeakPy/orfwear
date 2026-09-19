import { cn } from "@/lib/utils";

type GlassPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "light" | "strong" | "dark";
};

/**
 * Frosted chrome only (header / bottom dock / sheets / key cards) — never product photos.
 */
export function GlassPanel({ className, tone = "light", ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        tone === "dark"
          ? "glass-surface-dark"
          : tone === "strong"
            ? "glass-surface-strong"
            : "glass-surface",
        className,
      )}
      {...props}
    />
  );
}

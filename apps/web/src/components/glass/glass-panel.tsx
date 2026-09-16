import { cn } from "@/lib/utils";

type GlassPanelProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Production-safe frosted glass baseline.
 * Swap internals later for SVG refraction without changing call sites.
 */
export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return <div className={cn("glass-surface", className)} {...props} />;
}

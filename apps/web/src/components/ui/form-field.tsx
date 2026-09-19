import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

export function FormField({ label, htmlFor, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn("block", className)}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-orf-muted">{hint}</span>
      ) : null}
    </div>
  );
}

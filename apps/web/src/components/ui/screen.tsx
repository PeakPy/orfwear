/**
 * Standard padded screen wrapper. The visible route title lives in the global
 * header, so the heading here is screen-reader only unless a page opts out by
 * rendering its own visible h1.
 */
export function Screen({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 pt-2 pb-8">
      <h1 className="sr-only">{title}</h1>
      {children}
    </div>
  );
}

import { listProducts } from "@/features/catalog/api";

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof listProducts>> = [];
  let error: string | null = null;

  try {
    products = await listProducts();
  } catch {
    error = "اتصال به API برقرار نشد. سرویس بکند را بالا بیاورید.";
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-3xl" style={{ fontFamily: "var(--font-display)" }}>
        محصولات
      </h1>
      {error ? <p className="text-orf-muted">{error}</p> : null}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.id} className="glass-surface rounded-3xl p-6">
            <p className="text-xs tracking-[0.25em] text-orf-accent uppercase">{product.brand}</p>
            <h2 className="mt-3 text-xl">{product.name}</h2>
            <p className="mt-2 text-sm text-orf-muted">{product.slug}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/data-table";
import { adminApi, type AdminProductDetail, type AdminProductListItem } from "@/lib/api/admin";
import { formatDate, formatPrice } from "@/lib/format";

const productSchema = z.object({
  name: z.string().min(2, "نام الزامی است"),
  slug: z.string().min(2, "اسلاگ الزامی است"),
  brand: z.string().min(1),
  description: z.string().optional(),
  is_published: z.boolean(),
  category_id: z.string().optional(),
  variant_sku: z.string().optional(),
  variant_size: z.string().optional(),
  variant_color: z.string().optional(),
  variant_price: z.coerce.number().int().nonnegative().optional(),
  variant_qty: z.coerce.number().int().nonnegative().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function ProductEditor({
  product,
  onClose,
}: {
  product: AdminProductDetail | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: () => adminApi.listCategories() });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      brand: product?.brand ?? "orf",
      description: product?.description ?? "",
      is_published: product?.is_published ?? false,
      category_id: product?.category_id ?? "",
      variant_sku: "",
      variant_size: "",
      variant_color: "",
      variant_price: 8900000,
      variant_qty: 10,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (product) {
        return adminApi.updateProduct(product.id, {
          name: values.name,
          slug: values.slug,
          brand: values.brand,
          description: values.description ?? "",
          is_published: values.is_published,
          category_id: values.category_id || null,
        });
      }
      const variants =
        values.variant_sku && values.variant_price != null
          ? [
              {
                sku: values.variant_sku,
                size: values.variant_size ?? "",
                color: values.variant_color ?? "",
                price_amount: values.variant_price,
                quantity_on_hand: values.variant_qty ?? 0,
                is_active: true,
                currency: "IRR",
              },
            ]
          : [];
      return adminApi.createProduct({
        name: values.name,
        slug: values.slug,
        brand: values.brand,
        description: values.description ?? "",
        is_published: values.is_published,
        category_id: values.category_id || null,
        collection_ids: [],
        variants,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-orf-frame/40 p-4 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[var(--orf-radius-md)] border border-orf-border bg-orf-bg-elevated p-5">
        <h2 className="text-base font-medium">{product ? "ویرایش محصول" : "محصول جدید"}</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={handleSubmit((v) => saveMutation.mutateAsync(v))}
        >
          <input className={fieldClassName()} placeholder="نام" {...register("name")} />
          {errors.name ? <p className="text-xs text-red-800">{errors.name.message}</p> : null}
          <input className={fieldClassName()} placeholder="slug" {...register("slug")} />
          <input className={fieldClassName()} placeholder="برند" {...register("brand")} />
          <textarea className={fieldClassName()} rows={3} placeholder="توضیح" {...register("description")} />
          <select className={fieldClassName()} {...register("category_id")}>
            <option value="">بدون دسته</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("is_published")} />
            منتشر شود
          </label>

          {!product ? (
            <fieldset className="space-y-2 rounded-[var(--orf-radius-md)] border border-orf-border p-3">
              <legend className="px-1 text-xs text-orf-muted">وریانت اولیه (اختیاری)</legend>
              <input className={fieldClassName()} placeholder="SKU" {...register("variant_sku")} />
              <div className="grid grid-cols-2 gap-2">
                <input className={fieldClassName()} placeholder="سایز" {...register("variant_size")} />
                <input className={fieldClassName()} placeholder="رنگ" {...register("variant_color")} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={fieldClassName()}
                  type="number"
                  placeholder="قیمت (ریال)"
                  {...register("variant_price")}
                />
                <input
                  className={fieldClassName()}
                  type="number"
                  placeholder="موجودی"
                  {...register("variant_qty")}
                />
              </div>
            </fieldset>
          ) : null}

          {saveMutation.error ? (
            <p className="text-sm text-red-800">{(saveMutation.error as Error).message}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={secondaryButtonClassName()} onClick={onClose}>
              انصراف
            </button>
            <button type="submit" className={primaryButtonClassName(isSubmitting)} disabled={isSubmitting}>
              ذخیره
            </button>
          </div>
        </form>

        {product ? <VariantPanel product={product} /> : null}
      </div>
    </div>
  );
}

function VariantPanel({ product }: { product: AdminProductDetail }) {
  const queryClient = useQueryClient();
  const [sku, setSku] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState(8900000);
  const [qty, setQty] = useState(5);

  const addMutation = useMutation({
    mutationFn: () =>
      adminApi.createVariant(product.id, {
        sku,
        size,
        color,
        price_amount: price,
        quantity_on_hand: qty,
        is_active: true,
        currency: "IRR",
      }),
    onSuccess: async () => {
      setSku("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "product", product.id] });
    },
  });

  return (
    <div className="mt-5 border-t border-orf-border pt-4">
      <h3 className="text-sm font-medium">وریانت‌ها</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {product.variants.map((v) => (
          <li key={v.id} className="flex justify-between gap-2 border-b border-orf-border py-1.5">
            <span>
              {v.sku} · {v.size} / {v.color}
            </span>
            <span className="text-orf-muted">
              {formatPrice(v.price_amount, v.currency)} · موجودی {v.quantity_available}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <input className={fieldClassName()} placeholder="SKU جدید" value={sku} onChange={(e) => setSku(e.target.value)} />
        <input className={fieldClassName()} placeholder="سایز" value={size} onChange={(e) => setSize(e.target.value)} />
        <input className={fieldClassName()} placeholder="رنگ" value={color} onChange={(e) => setColor(e.target.value)} />
        <input
          className={fieldClassName()}
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <input
          className={fieldClassName()}
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <button
          type="button"
          className={secondaryButtonClassName()}
          disabled={!sku || addMutation.isPending}
          onClick={() => addMutation.mutate()}
        >
          افزودن وریانت
        </button>
      </div>
      {addMutation.error ? (
        <p className="mt-2 text-xs text-red-800">{(addMutation.error as Error).message}</p>
      ) : null}
    </div>
  );
}

export function ProductsView() {
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const queryClient = useQueryClient();

  const products = useQuery({
    queryKey: ["admin", "products", q],
    queryFn: () => adminApi.listProducts(q || undefined),
  });

  const detail = useQuery({
    queryKey: ["admin", "product", editingId],
    queryFn: () => adminApi.getProduct(editingId as string),
    enabled: Boolean(editingId && editingId !== "new"),
  });

  const rows = useMemo(() => products.data ?? [], [products.data]);

  return (
    <div>
      <PageHeader
        title="محصولات"
        description="مدیریت محصولات و وریانت‌ها."
        actions={
          <button type="button" className={primaryButtonClassName()} onClick={() => setEditingId("new")}>
            محصول جدید
          </button>
        }
      />

      <DataTable
        columns={["نام", "دسته", "وضعیت", "قیمت از", "وریانت", "به‌روزرسانی"]}
        emptyLabel={products.isLoading ? "در حال بارگذاری…" : "محصولی نیست."}
        toolbar={
          <input
            className={fieldClassName() + " max-w-xs"}
            placeholder="جستجو…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        }
      >
        {rows.map((p: AdminProductListItem) => (
          <tr
            key={p.id}
            className="cursor-pointer border-b border-orf-border hover:bg-orf-bg-subtle/50"
            onClick={() => setEditingId(p.id)}
          >
            <td className="px-3 py-3 font-medium">{p.name}</td>
            <td className="px-3 py-3 text-orf-muted">{p.category_name ?? "—"}</td>
            <td className="px-3 py-3 text-orf-muted">{p.is_published ? "منتشر" : "پیش‌نویس"}</td>
            <td className="px-3 py-3 text-orf-muted">
              {p.min_price_amount != null ? formatPrice(p.min_price_amount, p.currency) : "—"}
            </td>
            <td className="px-3 py-3 text-orf-muted">{p.variant_count}</td>
            <td className="px-3 py-3 text-orf-muted">{formatDate(p.updated_at)}</td>
          </tr>
        ))}
      </DataTable>

      {editingId === "new" ? (
        <ProductEditor
          product={null}
          onClose={() => {
            setEditingId(null);
            void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
          }}
        />
      ) : null}
      {editingId && editingId !== "new" && detail.data ? (
        <ProductEditor
          product={detail.data}
          onClose={() => {
            setEditingId(null);
            void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
          }}
        />
      ) : null}
    </div>
  );
}

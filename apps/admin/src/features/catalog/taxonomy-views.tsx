"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, fieldClassName, primaryButtonClassName, secondaryButtonClassName } from "@/components/ui/data-table";
import { adminApi } from "@/lib/api/admin";

export function CategoriesView() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: () => adminApi.listCategories() });
  const create = useMutation({
    mutationFn: () => adminApi.createCategory({ name, slug }),
    onSuccess: async () => {
      setName("");
      setSlug("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  return (
    <div>
      <PageHeader title="دسته‌ها" description="دسته‌بندی کاتالوگ." />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={fieldClassName() + " max-w-[10rem]"} placeholder="نام" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={fieldClassName() + " max-w-[10rem]"} placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <button type="button" className={primaryButtonClassName()} disabled={!name || !slug || create.isPending} onClick={() => create.mutate()}>
          افزودن
        </button>
      </div>
      <DataTable columns={["نام", "اسلاگ", "والد"]} emptyLabel={categories.isLoading ? "…" : "دسته‌ای نیست."}>
        {(categories.data ?? []).map((c) => (
          <tr key={c.id} className="border-b border-orf-border">
            <td className="px-3 py-3 font-medium">{c.name}</td>
            <td className="px-3 py-3 text-orf-muted">{c.slug}</td>
            <td className="px-3 py-3 text-orf-muted">{c.parent_id ? c.parent_id.slice(0, 8) : "—"}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

export function CollectionsView() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const queryClient = useQueryClient();
  const collections = useQuery({ queryKey: ["admin", "collections"], queryFn: () => adminApi.listCollections() });
  const create = useMutation({
    mutationFn: () => adminApi.createCollection({ name, slug, is_published: true }),
    onSuccess: async () => {
      setName("");
      setSlug("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
    },
  });
  const toggle = useMutation({
    mutationFn: (c: { id: string; name: string; slug: string; description: string; is_published: boolean }) =>
      adminApi.updateCollection(c.id, {
        name: c.name,
        slug: c.slug,
        description: c.description,
        is_published: !c.is_published,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
    },
  });

  return (
    <div>
      <PageHeader title="کالکشن‌ها" description="مجموعه‌های فروشگاه." />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={fieldClassName() + " max-w-[10rem]"} placeholder="نام" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={fieldClassName() + " max-w-[10rem]"} placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <button type="button" className={primaryButtonClassName()} disabled={!name || !slug || create.isPending} onClick={() => create.mutate()}>
          افزودن
        </button>
      </div>
      <DataTable columns={["نام", "اسلاگ", "منتشر", "عملیات"]} emptyLabel={collections.isLoading ? "…" : "کالکشنی نیست."}>
        {(collections.data ?? []).map((c) => (
          <tr key={c.id} className="border-b border-orf-border">
            <td className="px-3 py-3 font-medium">{c.name}</td>
            <td className="px-3 py-3 text-orf-muted">{c.slug}</td>
            <td className="px-3 py-3 text-orf-muted">{c.is_published ? "بله" : "خیر"}</td>
            <td className="px-3 py-3">
              <button type="button" className={secondaryButtonClassName()} onClick={() => toggle.mutate(c)}>
                تغییر انتشار
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

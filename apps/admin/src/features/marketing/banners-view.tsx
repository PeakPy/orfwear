"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/data-table";
import { adminApi, type AdminBanner } from "@/lib/api/admin";

const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  cta_label: z.string().optional(),
  cta_href: z.string().optional(),
  image_url: z.string().optional(),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().nonnegative(),
});

type BannerForm = z.infer<typeof bannerSchema>;

function BannerFormDialog({
  banner,
  onClose,
}: {
  banner?: AdminBanner | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title ?? "",
      subtitle: banner?.subtitle ?? "",
      cta_label: banner?.cta_label ?? "",
      cta_href: banner?.cta_href ?? "",
      image_url: banner?.image_url ?? "",
      is_active: banner?.is_active ?? false,
      sort_order: banner?.sort_order ?? 0,
    },
  });

  const save = useMutation({
    mutationFn: (values: BannerForm) =>
      banner
        ? adminApi.updateBanner(banner.id, values)
        : adminApi.createBanner(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-orf-frame/40 p-4 sm:items-center">
      <form
        className="w-full max-w-md space-y-3 rounded-[var(--orf-radius-md)] border border-orf-border bg-orf-bg-elevated p-5"
        onSubmit={handleSubmit((v) => save.mutateAsync(v))}
      >
        <h2 className="text-base font-medium">{banner ? "ویرایش بنر" : "بنر جدید"}</h2>
        <input className={fieldClassName()} placeholder="عنوان" {...register("title")} />
        <input className={fieldClassName()} placeholder="زیرعنوان" {...register("subtitle")} />
        <input className={fieldClassName()} placeholder="متن CTA" {...register("cta_label")} />
        <input className={fieldClassName()} placeholder="لینک CTA" {...register("cta_href")} />
        <input className={fieldClassName()} placeholder="URL تصویر" {...register("image_url")} />
        <input className={fieldClassName()} type="number" placeholder="ترتیب" {...register("sort_order")} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("is_active")} />
          فعال
        </label>
        {save.error ? <p className="text-sm text-red-800">{(save.error as Error).message}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryButtonClassName()} onClick={onClose}>
            انصراف
          </button>
          <button type="submit" className={primaryButtonClassName(isSubmitting)} disabled={isSubmitting}>
            ذخیره
          </button>
        </div>
      </form>
    </div>
  );
}

export function BannersView() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const queryClient = useQueryClient();
  const banners = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: () => adminApi.listBanners(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="بنرها"
        description="بنرهای خانه و کمپین."
        actions={
          <button type="button" className={primaryButtonClassName()} onClick={() => setOpen(true)}>
            بنر جدید
          </button>
        }
      />
      <DataTable
        columns={["عنوان", "ترتیب", "فعال", "عملیات"]}
        emptyLabel={banners.isLoading ? "در حال بارگذاری…" : "بنری نیست."}
      >
        {(banners.data ?? []).map((b) => (
          <tr key={b.id} className="border-b border-orf-border">
            <td className="px-3 py-3">
              <p className="font-medium">{b.title}</p>
              <p className="text-xs text-orf-muted">{b.subtitle || b.cta_href || "—"}</p>
            </td>
            <td className="px-3 py-3 text-orf-muted">{b.sort_order}</td>
            <td className="px-3 py-3 text-orf-muted">{b.is_active ? "بله" : "خیر"}</td>
            <td className="px-3 py-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  className={secondaryButtonClassName()}
                  onClick={() => setEditing(b)}
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  className={secondaryButtonClassName()}
                  onClick={() => remove.mutate(b.id)}
                >
                  حذف
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      {open ? <BannerFormDialog onClose={() => setOpen(false)} /> : null}
      {editing ? <BannerFormDialog banner={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, fieldClassName, primaryButtonClassName, secondaryButtonClassName } from "@/components/ui/data-table";
import { adminApi } from "@/lib/api/admin";
import { formatDate, formatPrice } from "@/lib/format";

export function CustomersView() {
  const [q, setQ] = useState("");
  const customers = useQuery({
    queryKey: ["admin", "customers", q],
    queryFn: () => adminApi.listCustomers(q || undefined),
  });
  return (
    <div>
      <PageHeader title="مشتریان" description="کاربران غیرپرسنل." />
      <DataTable
        columns={["ایمیل", "تلفن", "سفارش‌ها", "فعال", "عضویت"]}
        emptyLabel={customers.isLoading ? "…" : "مشتری‌ای نیست."}
        toolbar={
          <input className={fieldClassName() + " max-w-xs"} placeholder="جستجو…" value={q} onChange={(e) => setQ(e.target.value)} />
        }
      >
        {(customers.data ?? []).map((c) => (
          <tr key={c.id} className="border-b border-orf-border">
            <td className="px-3 py-3 font-medium">{c.email}</td>
            <td className="px-3 py-3 text-orf-muted">{c.phone || "—"}</td>
            <td className="px-3 py-3 text-orf-muted">{c.order_count}</td>
            <td className="px-3 py-3 text-orf-muted">{c.is_active ? "بله" : "خیر"}</td>
            <td className="px-3 py-3 text-orf-muted">{formatDate(c.created_at)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

export function PaymentsView() {
  const payments = useQuery({ queryKey: ["admin", "payments"], queryFn: () => adminApi.listPayments() });
  return (
    <div>
      <PageHeader title="پرداخت‌ها" description="PaymentIntentهای ثبت‌شده." />
      <DataTable columns={["شناسه", "سفارش", "مبلغ", "وضعیت", "درگاه", "تاریخ"]} emptyLabel={payments.isLoading ? "…" : "پرداختی نیست."}>
        {(payments.data ?? []).map((p) => (
          <tr key={p.id} className="border-b border-orf-border">
            <td className="px-3 py-3 font-medium">{p.id.slice(0, 8)}…</td>
            <td className="px-3 py-3 text-orf-muted">{p.order_id.slice(0, 8)}…</td>
            <td className="px-3 py-3 text-orf-muted">{formatPrice(p.amount, p.currency)}</td>
            <td className="px-3 py-3 text-orf-muted">{p.status}</td>
            <td className="px-3 py-3 text-orf-muted">{p.provider}</td>
            <td className="px-3 py-3 text-orf-muted">{formatDate(p.created_at)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

export function ShippingMethodsView() {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const queryClient = useQueryClient();
  const methods = useQuery({ queryKey: ["admin", "shipping"], queryFn: () => adminApi.listShippingMethods() });
  const create = useMutation({
    mutationFn: () => adminApi.createShippingMethod({ code, title, price_amount: price, currency: "IRR", is_active: true }),
    onSuccess: async () => {
      setCode("");
      setTitle("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "shipping"] });
    },
  });
  const toggle = useMutation({
    mutationFn: (m: { id: string; is_active: boolean }) => adminApi.updateShippingMethod(m.id, { is_active: !m.is_active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "shipping"] });
    },
  });

  return (
    <div>
      <PageHeader title="روش‌های ارسال" description="تعرفه و فعال‌سازی ارسال." />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={fieldClassName() + " max-w-[8rem]"} placeholder="کد" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className={fieldClassName() + " max-w-[10rem]"} placeholder="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={fieldClassName() + " max-w-[8rem]"} type="number" placeholder="قیمت ریال" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        <button type="button" className={primaryButtonClassName()} disabled={!code || !title || create.isPending} onClick={() => create.mutate()}>
          افزودن
        </button>
      </div>
      <DataTable columns={["کد", "عنوان", "قیمت", "فعال", "عملیات"]} emptyLabel={methods.isLoading ? "…" : "روشی نیست."}>
        {(methods.data ?? []).map((m) => (
          <tr key={m.id} className="border-b border-orf-border">
            <td className="px-3 py-3 font-medium">{m.code}</td>
            <td className="px-3 py-3">{m.title}</td>
            <td className="px-3 py-3 text-orf-muted">{formatPrice(m.price_amount, m.currency)}</td>
            <td className="px-3 py-3 text-orf-muted">{m.is_active ? "بله" : "خیر"}</td>
            <td className="px-3 py-3">
              <button type="button" className={secondaryButtonClassName()} onClick={() => toggle.mutate(m)}>
                تغییر وضعیت
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

export function MediaView() {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const queryClient = useQueryClient();
  const media = useQuery({ queryKey: ["admin", "media"], queryFn: () => adminApi.listMedia() });
  const upload = useMutation({
    mutationFn: () => adminApi.uploadMediaStub({ url, alt_text: alt, content_type: "image/jpeg" }),
    onSuccess: async () => {
      setUrl("");
      setAlt("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    },
  });

  return (
    <div>
      <PageHeader title="رسانه" description="آپلود stub — فقط ثبت URL تا اتصال استوریج." />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={fieldClassName() + " min-w-[16rem] flex-1"} placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className={fieldClassName() + " max-w-[10rem]"} placeholder="alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
        <button type="button" className={primaryButtonClassName()} disabled={!url || upload.isPending} onClick={() => upload.mutate()}>
          ثبت
        </button>
      </div>
      <DataTable columns={["کلید", "URL", "نوع", "تاریخ"]} emptyLabel={media.isLoading ? "…" : "فایلی نیست."}>
        {(media.data ?? []).map((m) => (
          <tr key={m.id} className="border-b border-orf-border">
            <td className="px-3 py-3 font-medium">{m.key}</td>
            <td className="px-3 py-3 text-orf-muted">
              <a href={m.url} className="underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                لینک
              </a>
            </td>
            <td className="px-3 py-3 text-orf-muted">{m.content_type}</td>
            <td className="px-3 py-3 text-orf-muted">{formatDate(m.created_at)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

export function SettingsView() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: () => adminApi.getSettings() });
  const [form, setForm] = useState<Partial<{
    store_name: string;
    currency: string;
    low_stock_threshold: number;
    payment_provider: string;
    shipping_default_code: string;
  }>>({});

  const current = { ...(settings.data ?? {}), ...form };

  const save = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({
        store_name: current.store_name,
        currency: current.currency,
        low_stock_threshold: Number(current.low_stock_threshold ?? 5),
        payment_provider: current.payment_provider,
        shipping_default_code: current.shipping_default_code,
      }),
    onSuccess: async () => {
      setForm({});
      await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  return (
    <div>
      <PageHeader title="تنظیمات" description="تنظیمات فروشگاه (stub)." />
      {settings.isLoading ? (
        <p className="text-sm text-orf-muted">در حال بارگذاری…</p>
      ) : (
        <form
          className="max-w-lg space-y-3 rounded-[var(--orf-radius-md)] border border-orf-border bg-orf-bg-elevated p-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          {(
            [
              ["store_name", "نام فروشگاه"],
              ["currency", "ارز"],
              ["payment_provider", "درگاه"],
              ["shipping_default_code", "کد ارسال پیش‌فرض"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1 text-sm">
              <span>{label}</span>
              <input
                className={fieldClassName()}
                value={String(current[key] ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <label className="block space-y-1 text-sm">
            <span>آستانه موجودی بحرانی</span>
            <input
              className={fieldClassName()}
              type="number"
              value={Number(current.low_stock_threshold ?? 5)}
              onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: Number(e.target.value) }))}
            />
          </label>
          {save.error ? <p className="text-sm text-red-800">{(save.error as Error).message}</p> : null}
          <button type="submit" className={primaryButtonClassName(save.isPending)} disabled={save.isPending}>
            ذخیره
          </button>
        </form>
      )}
    </div>
  );
}

export function ContentPagesView() {
  const queryClient = useQueryClient();
  const pages = useQuery({ queryKey: ["admin", "content"], queryFn: () => adminApi.listContentPages() });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");

  const save = useMutation({
    mutationFn: () => adminApi.updateContentPage(editingId!, { title, body }),
    onSuccess: async () => {
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "content"] });
    },
  });

  return (
    <div>
      <PageHeader title="صفحات محتوا" description="about / faq / legal و مشابه." />
      <DataTable columns={["عنوان", "اسلاگ", "منتشر", "عملیات"]} emptyLabel={pages.isLoading ? "…" : "صفحه‌ای نیست."}>
        {(pages.data ?? []).map((p) => (
          <tr key={p.id} className="border-b border-orf-border">
            <td className="px-3 py-3 font-medium">{p.title}</td>
            <td className="px-3 py-3 text-orf-muted">{p.slug}</td>
            <td className="px-3 py-3 text-orf-muted">{p.is_published ? "بله" : "خیر"}</td>
            <td className="px-3 py-3">
              <button
                type="button"
                className={secondaryButtonClassName()}
                onClick={() => {
                  setEditingId(p.id);
                  setTitle(p.title);
                  setBody(p.body);
                }}
              >
                ویرایش
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {editingId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-orf-frame/40 p-4 sm:items-center">
          <div className="w-full max-w-lg space-y-3 rounded-[var(--orf-radius-md)] border border-orf-border bg-orf-bg-elevated p-5">
            <h2 className="text-base font-medium">ویرایش صفحه</h2>
            <input className={fieldClassName()} value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className={fieldClassName()} rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButtonClassName()} onClick={() => setEditingId(null)}>
                انصراف
              </button>
              <button type="button" className={primaryButtonClassName(save.isPending)} onClick={() => save.mutate()}>
                ذخیره
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

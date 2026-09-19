"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, fieldClassName, secondaryButtonClassName } from "@/components/ui/data-table";
import { adminApi } from "@/lib/api/admin";

export function InventoryView() {
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const queryClient = useQueryClient();
  const inventory = useQuery({
    queryKey: ["admin", "inventory", q, lowOnly],
    queryFn: () => adminApi.listInventory({ q: q || undefined, lowOnly }),
  });

  const adjust = useMutation({
    mutationFn: ({ variantId, delta }: { variantId: string; delta: number }) =>
      adminApi.adjustInventory(variantId, delta),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  return (
    <div>
      <PageHeader title="موجودی" description="سطح موجودی SKU و هشدار کمبود." />
      <DataTable
        columns={["SKU", "محصول", "موجودی", "رزرو", "وضعیت", "تنظیم"]}
        emptyLabel={inventory.isLoading ? "در حال بارگذاری…" : "موجودی ثبت نشده."}
        toolbar={
          <>
            <input
              className={fieldClassName() + " max-w-xs"}
              placeholder="جستجو SKU / محصول"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <label className="flex items-center gap-2 text-xs text-orf-muted">
              <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
              فقط بحرانی
            </label>
          </>
        }
      >
        {(inventory.data ?? []).map((item) => (
          <tr key={item.id} className="border-b border-orf-border">
            <td className="px-3 py-3 font-medium">{item.sku}</td>
            <td className="px-3 py-3 text-orf-muted">
              {item.product_name}
              <span className="block text-xs">
                {item.size} / {item.color}
              </span>
            </td>
            <td className="px-3 py-3">{item.quantity_available}</td>
            <td className="px-3 py-3 text-orf-muted">{item.quantity_reserved}</td>
            <td className="px-3 py-3 text-orf-muted">{item.is_low ? "بحرانی" : "عادی"}</td>
            <td className="px-3 py-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  className={secondaryButtonClassName()}
                  disabled={adjust.isPending}
                  onClick={() => adjust.mutate({ variantId: item.variant_id, delta: -1 })}
                >
                  −۱
                </button>
                <button
                  type="button"
                  className={secondaryButtonClassName()}
                  disabled={adjust.isPending}
                  onClick={() => adjust.mutate({ variantId: item.variant_id, delta: 1 })}
                >
                  +۱
                </button>
                <button
                  type="button"
                  className={secondaryButtonClassName()}
                  disabled={adjust.isPending}
                  onClick={() => adjust.mutate({ variantId: item.variant_id, delta: 10 })}
                >
                  +۱۰
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      {adjust.error ? (
        <p className="mt-3 text-sm text-red-800">{(adjust.error as Error).message}</p>
      ) : null}
    </div>
  );
}

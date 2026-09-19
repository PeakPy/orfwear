import type { Metadata } from "next";

import { SIZE_GUIDE_ROWS, TROUSER_SIZE_ROWS } from "@/features/catalog/size-guide-data";
import { TrustPage } from "@/features/trust/trust-page";

export const metadata: Metadata = {
  title: "راهنمای سایز",
  description: "اندازه را روی بدن بگیرید و با جدول هر محصول مقایسه کنید.",
};

export default function SizeGuidePage() {
  return (
    <TrustPage
      title="راهنمای سایز"
      currentHref="/size-guide"
      lead="اندازه را روی بدن بگیرید؛ سپس با جدول همان محصول مقایسه کنید."
      body={[
        "سایز استاندارد جهانی است، اما برش هر مدل فرق می‌کند. همیشه جدول همان محصول را ملاک بگیرید.",
      ]}
      sections={[
        {
          heading: "چطور اندازه بگیرید",
          paragraphs: [
            "سینه: متر را دور پهن‌ترین بخش سینه، موازی زمین نگه دارید.",
            "کمر: باریک‌ترین نقطهٔ کمر، بدون کشیدن متر.",
            "باسن: پهن‌ترین بخش باسن، پاها نزدیک هم.",
            "قد لباس در صفحهٔ محصول یا جدول همان مدل نوشته می‌شود.",
          ],
        },
        {
          heading: "اگر بین دو سایز هستید",
          paragraphs: [
            "برای فیت آزادتر سایز بالاتر، برای فیت نزدیک‌به‌بدن سایز پایین‌تر را انتخاب کنید.",
            "در صورت تردید از پشتیبانی بپرسید؛ پاسخ معمولاً همان روز کاری است.",
          ],
        },
      ]}
    >
      <section className="mt-4 overflow-hidden rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated p-4 shadow-[var(--orf-shadow-sm)]">
        <h2 className="mb-3 text-sm font-medium">بالاتنه (سانتی‌متر)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-orf-muted">
              <th className="py-2 text-start font-medium">سایز</th>
              <th className="py-2 text-start font-medium">دور سینه</th>
              <th className="py-2 text-start font-medium">دور کمر</th>
              <th className="py-2 text-start font-medium">دور باسن</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_GUIDE_ROWS.map((row) => (
              <tr key={row.size} className="border-t border-orf-border">
                <td className="py-2.5 font-medium">{row.size}</td>
                <td className="py-2.5 text-orf-muted">{row.chest}</td>
                <td className="py-2.5 text-orf-muted">{row.waist}</td>
                <td className="py-2.5 text-orf-muted">{row.hip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-4 overflow-hidden rounded-[var(--orf-radius-xl)] border border-orf-border bg-orf-bg-elevated p-4 shadow-[var(--orf-shadow-sm)]">
        <h2 className="mb-3 text-sm font-medium">شلوار (سانتی‌متر)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-orf-muted">
              <th className="py-2 text-start font-medium">سایز</th>
              <th className="py-2 text-start font-medium">دور کمر</th>
              <th className="py-2 text-start font-medium">قد داخل پا</th>
            </tr>
          </thead>
          <tbody>
            {TROUSER_SIZE_ROWS.map((row) => (
              <tr key={row.size} className="border-t border-orf-border">
                <td className="py-2.5 font-medium">{row.size}</td>
                <td className="py-2.5 text-orf-muted">{row.waist}</td>
                <td className="py-2.5 text-orf-muted">{row.inseam}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </TrustPage>
  );
}

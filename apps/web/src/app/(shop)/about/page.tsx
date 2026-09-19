import type { Metadata } from "next";

import { TrustPage } from "@/features/trust/trust-page";

export const metadata: Metadata = {
  title: "درباره ORF",
  description: "لباس روزمره با برش دقیق و جزئیات کم‌حرف.",
};

export default function AboutPage() {
  return (
    <TrustPage
      title="درباره ORF"
      currentHref="/about"
      lead="لباس روزمره با برش دقیق و جزئیات کم‌حرف."
      body={[
        "ORF Wear برای کسانی است که لباس را ساده می‌پوشند؛ نه برای نمایش، برای استفاده روزانه.",
        "تمرکز ما روی برش تمیز، پارچهٔ قابل‌اعتماد و خطوط مینیمال است — زنانه و مردانه، در یک زبان بصری.",
      ]}
      sections={[
        {
          heading: "چطور کار می‌کنیم",
          paragraphs: [
            "کالکشن‌ها محدود و فصلی‌اند. هر محصول قبل از انتشار از نظر تناسب و دوخت بررسی می‌شود.",
            "فروشگاه آنلاین همان تجربهٔ اپ موبایل است: کم‌حرف، سریع، بدون شلوغی.",
          ],
        },
      ]}
    />
  );
}

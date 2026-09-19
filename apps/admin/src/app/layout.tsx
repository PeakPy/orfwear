import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";

import { AppProviders } from "@/components/layout/app-providers";
import { siteConfig } from "@/config/site";

import "@/styles/globals.css";

/** Temporary until IRANYekanX license files land in packages/fonts */
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.brand} Admin`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: "/logo-mark.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f2ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className={vazirmatn.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

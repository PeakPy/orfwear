import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";

import { AppProviders } from "@/components/layout/app-providers";
import { MobileShell } from "@/components/layout/mobile-shell";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
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
    template: `%s · ${siteConfig.brand}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.brand,
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(siteConfig.url),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.brand,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-mark.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f3" },
    { media: "(prefers-color-scheme: dark)", color: "#f5f5f3" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className={vazirmatn.className}>
        <AppProviders>
          <MobileShell>{children}</MobileShell>
          <RegisterServiceWorker />
        </AppProviders>
      </body>
    </html>
  );
}

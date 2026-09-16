import type { Metadata, Viewport } from "next";
import { Fraunces, Sora } from "next/font/google";

import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/layout/app-providers";
import { siteConfig } from "@/config/site";

import "@/styles/globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
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
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${display.variable} ${sans.variable}`}>
      <body>
        <AppProviders>
          <SiteHeader />
          <main>{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}

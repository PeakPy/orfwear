export const siteConfig = {
  brand: process.env.NEXT_PUBLIC_BRAND_NAME ?? "ORF",
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "ORF Wear Admin",
  description: "پنل مدیریت ORF Wear",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1",
};

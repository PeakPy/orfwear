/** Routes that show brand chrome; everything else gets a back button + title. */
export const TAB_ROUTES = ["/", "/shop", "/search", "/cart", "/account"] as const;

type TitleRule = {
  match: (path: string) => boolean;
  title: string;
};

const RULES: TitleRule[] = [
  { match: (p) => p === "/products", title: "محصولات" },
  { match: (p) => p.startsWith("/products/"), title: "جزئیات" },
  { match: (p) => p === "/collections", title: "کالکشن‌ها" },
  { match: (p) => p.startsWith("/collections/"), title: "کالکشن" },
  { match: (p) => p === "/checkout", title: "تسویه حساب" },
  { match: (p) => p === "/checkout/result", title: "نتیجه سفارش" },
  { match: (p) => p === "/login", title: "ورود" },
  { match: (p) => p === "/account/orders", title: "سفارش‌ها" },
  { match: (p) => p.startsWith("/account/orders/"), title: "جزئیات سفارش" },
  { match: (p) => p === "/account/addresses", title: "آدرس‌ها" },
  { match: (p) => p === "/account/wishlist", title: "علاقه‌مندی‌ها" },
  { match: (p) => p === "/about", title: "درباره ORF" },
  { match: (p) => p === "/size-guide", title: "راهنمای سایز" },
  { match: (p) => p === "/shipping", title: "ارسال" },
  { match: (p) => p === "/returns", title: "مرجوعی و تعویض" },
  { match: (p) => p === "/faq", title: "پرسش‌های پرتکرار" },
  { match: (p) => p === "/contact", title: "تماس با ما" },
  { match: (p) => p === "/privacy", title: "حریم خصوصی" },
  { match: (p) => p === "/terms", title: "شرایط استفاده" },
];

export function isTabRoute(pathname: string): boolean {
  return (TAB_ROUTES as readonly string[]).includes(pathname);
}

export function routeTitle(pathname: string): string {
  return RULES.find((rule) => rule.match(pathname))?.title ?? "ORF";
}

export const TRUST_LINKS = [
  { href: "/about", label: "درباره ORF" },
  { href: "/size-guide", label: "راهنمای سایز" },
  { href: "/shipping", label: "ارسال" },
  { href: "/returns", label: "مرجوعی" },
  { href: "/faq", label: "پرسش‌ها" },
  { href: "/contact", label: "تماس" },
  { href: "/privacy", label: "حریم خصوصی" },
  { href: "/terms", label: "شرایط" },
] as const;

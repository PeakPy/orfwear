import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  Layers,
  Megaphone,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    id: "overview",
    label: "نمای کلی",
    items: [{ href: "/", label: "داشبورد", icon: LayoutDashboard }],
  },
  {
    id: "catalog",
    label: "کاتالوگ",
    items: [
      { href: "/catalog/products", label: "محصولات", icon: Package },
      { href: "/catalog/categories", label: "دسته‌ها", icon: FolderTree },
      { href: "/catalog/collections", label: "کالکشن‌ها", icon: Layers },
    ],
  },
  {
    id: "ops",
    label: "عملیات",
    items: [
      { href: "/inventory", label: "موجودی", icon: Warehouse },
      { href: "/orders", label: "سفارش‌ها", icon: ShoppingBag },
      { href: "/payments", label: "پرداخت‌ها", icon: Wallet },
      { href: "/customers", label: "مشتریان", icon: Users },
    ],
  },
  {
    id: "growth",
    label: "رشد",
    items: [
      { href: "/marketing/banners", label: "بنرها", icon: Image },
      { href: "/marketing/campaigns", label: "کمپین‌ها", icon: Megaphone },
      { href: "/shipping/methods", label: "روش‌های ارسال", icon: Truck },
    ],
  },
  {
    id: "content",
    label: "محتوا",
    items: [
      { href: "/content/pages", label: "صفحات", icon: FileText },
      { href: "/media", label: "رسانه", icon: Boxes },
    ],
  },
  {
    id: "system",
    label: "سیستم",
    items: [{ href: "/settings", label: "تنظیمات", icon: Settings }],
  },
];

export const allNavItems: NavItem[] = navSections.flatMap((section) => section.items);

import { apiFetch } from "@/lib/api/client";

export type StaffUser = {
  id: string;
  email: string;
  display_name: string;
  is_staff: boolean;
};

export type StaffLoginResult = {
  token: string;
  user: StaffUser;
};

export type DashboardStats = {
  orders_today: number;
  orders_total: number;
  sales_today_amount: number;
  sales_total_amount: number;
  currency: string;
  low_stock_count: number;
  products_published: number;
  products_total: number;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  is_published: boolean;
  category_id: string | null;
  category_name: string | null;
  variant_count: number;
  min_price_amount: number | null;
  currency: string;
  updated_at: string | null;
};

export type AdminVariant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  price_amount: number;
  currency: string;
  is_active: boolean;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  is_published: boolean;
  category_id: string | null;
  collection_ids: string[];
  variants: AdminVariant[];
  updated_at: string | null;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

export type AdminCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_published: boolean;
};

export type AdminStockItem = {
  id: string;
  variant_id: string;
  sku: string;
  product_name: string;
  size: string;
  color: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  is_low: boolean;
};

export type AdminOrderListItem = {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  customer_email: string | null;
  customer_phone: string | null;
  line_count: number;
  created_at: string | null;
};

export type AdminOrderDetail = {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  customer_email: string | null;
  customer_phone: string | null;
  staff_notes: string;
  lines: Array<{
    id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price_amount: number;
    line_total_amount: number;
  }>;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminBanner = {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  updated_at: string | null;
};

export type AdminPayment = {
  id: string;
  order_id: string;
  provider: string;
  provider_ref: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string | null;
};

export type AdminCustomer = {
  id: string;
  email: string;
  username: string;
  phone: string;
  is_active: boolean;
  order_count: number;
  created_at: string | null;
};

export type AdminShippingMethod = {
  id: string;
  code: string;
  title: string;
  price_amount: number;
  currency: string;
  is_active: boolean;
};

export type AdminMedia = {
  id: string;
  key: string;
  url: string;
  content_type: string;
  width: number | null;
  height: number | null;
  alt_text: string;
  created_at: string | null;
};

export type StoreSettings = {
  store_name: string;
  currency: string;
  low_stock_threshold: number;
  payment_provider: string;
  shipping_default_code: string;
};

export type ContentPage = {
  id: string;
  slug: string;
  title: string;
  body: string;
  is_published: boolean;
  updated_at: string | null;
};

export const adminApi = {
  login: (email: string, password: string) =>
    apiFetch<StaffLoginResult>("/admin/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  dashboardStats: () => apiFetch<DashboardStats>("/admin/dashboard/stats"),

  listProducts: (q?: string) =>
    apiFetch<AdminProductListItem[]>(`/admin/catalog/products${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getProduct: (id: string) => apiFetch<AdminProductDetail>(`/admin/catalog/products/${id}`),
  createProduct: (body: Record<string, unknown>) =>
    apiFetch<AdminProductDetail>("/admin/catalog/products", { method: "POST", body }),
  updateProduct: (id: string, body: Record<string, unknown>) =>
    apiFetch<AdminProductDetail>(`/admin/catalog/products/${id}`, { method: "PATCH", body }),
  createVariant: (productId: string, body: Record<string, unknown>) =>
    apiFetch<AdminVariant>(`/admin/catalog/products/${productId}/variants`, { method: "POST", body }),
  updateVariant: (productId: string, variantId: string, body: Record<string, unknown>) =>
    apiFetch<AdminVariant>(`/admin/catalog/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      body,
    }),

  listCategories: () => apiFetch<AdminCategory[]>("/admin/catalog/categories"),
  createCategory: (body: { name: string; slug: string; parent_id?: string | null }) =>
    apiFetch<AdminCategory>("/admin/catalog/categories", { method: "POST", body }),
  updateCategory: (id: string, body: { name: string; slug: string; parent_id?: string | null }) =>
    apiFetch<AdminCategory>(`/admin/catalog/categories/${id}`, { method: "PATCH", body }),

  listCollections: () => apiFetch<AdminCollection[]>("/admin/catalog/collections"),
  createCollection: (body: {
    name: string;
    slug: string;
    description?: string;
    is_published?: boolean;
  }) => apiFetch<AdminCollection>("/admin/catalog/collections", { method: "POST", body }),
  updateCollection: (
    id: string,
    body: { name: string; slug: string; description?: string; is_published?: boolean },
  ) => apiFetch<AdminCollection>(`/admin/catalog/collections/${id}`, { method: "PATCH", body }),

  listInventory: (opts?: { q?: string; lowOnly?: boolean }) => {
    const params = new URLSearchParams();
    if (opts?.q) params.set("q", opts.q);
    if (opts?.lowOnly) params.set("low_only", "true");
    const qs = params.toString();
    return apiFetch<AdminStockItem[]>(`/admin/inventory${qs ? `?${qs}` : ""}`);
  },
  adjustInventory: (variantId: string, delta: number, reason = "") =>
    apiFetch<AdminStockItem>(`/admin/inventory/${variantId}/adjust`, {
      method: "POST",
      body: { delta, reason },
    }),

  listOrders: (status?: string) =>
    apiFetch<AdminOrderListItem[]>(
      `/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),
  getOrder: (id: string) => apiFetch<AdminOrderDetail>(`/admin/orders/${id}`),
  updateOrder: (id: string, body: { status: string; staff_notes?: string }) =>
    apiFetch<AdminOrderDetail>(`/admin/orders/${id}`, { method: "PATCH", body }),

  listPayments: () => apiFetch<AdminPayment[]>("/admin/payments"),
  listCustomers: (q?: string) =>
    apiFetch<AdminCustomer[]>(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  listBanners: () => apiFetch<AdminBanner[]>("/admin/marketing/banners"),
  createBanner: (body: Record<string, unknown>) =>
    apiFetch<AdminBanner>("/admin/marketing/banners", { method: "POST", body }),
  updateBanner: (id: string, body: Record<string, unknown>) =>
    apiFetch<AdminBanner>(`/admin/marketing/banners/${id}`, { method: "PATCH", body }),
  deleteBanner: (id: string) =>
    apiFetch<{ ok: boolean }>(`/admin/marketing/banners/${id}`, { method: "DELETE" }),

  listShippingMethods: () => apiFetch<AdminShippingMethod[]>("/admin/shipping/methods"),
  createShippingMethod: (body: Record<string, unknown>) =>
    apiFetch<AdminShippingMethod>("/admin/shipping/methods", { method: "POST", body }),
  updateShippingMethod: (id: string, body: Record<string, unknown>) =>
    apiFetch<AdminShippingMethod>(`/admin/shipping/methods/${id}`, { method: "PATCH", body }),

  listMedia: () => apiFetch<AdminMedia[]>("/admin/media"),
  uploadMediaStub: (body: Record<string, unknown>) =>
    apiFetch<AdminMedia>("/admin/media/upload", { method: "POST", body }),

  getSettings: () => apiFetch<StoreSettings>("/admin/settings"),
  updateSettings: (body: Partial<StoreSettings>) =>
    apiFetch<StoreSettings>("/admin/settings", { method: "PATCH", body }),

  listContentPages: () => apiFetch<ContentPage[]>("/admin/content/pages"),
  updateContentPage: (id: string, body: Partial<ContentPage>) =>
    apiFetch<ContentPage>(`/admin/content/pages/${id}`, { method: "PATCH", body }),
};

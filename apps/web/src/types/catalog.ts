export type Variant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  price_amount: number;
  currency: string;
  is_active: boolean;
  quantity_available: number;
};

export type ProductImage = {
  url: string;
  alt?: string;
  color?: string;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description?: string;
  min_price_amount?: number | null;
  currency?: string;
  image_url?: string | null;
  audience?: string;
  category_slug?: string | null;
  colors?: string[];
  sizes?: string[];
  in_stock?: boolean;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  audience?: string;
  material?: string;
  care?: string;
  category_slug?: string | null;
  category_name?: string | null;
  variants: Variant[];
  images: ProductImage[];
  image_url?: string | null;
  min_price_amount?: number | null;
  currency?: string;
  in_stock?: boolean;
  collections?: string[];
  related?: ProductListItem[];
};

export type ProductPage = {
  items: ProductListItem[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
};

export type FacetValue = {
  value: string;
  label: string;
  count: number;
};

export type CatalogFacets = {
  categories: FacetValue[];
  collections: FacetValue[];
  sizes: FacetValue[];
  colors: FacetValue[];
  price_min: number;
  price_max: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  product_count: number;
};

export type CollectionListItem = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string | null;
  product_count?: number;
};

export type CollectionDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string | null;
  products: ProductListItem[];
};

export type CartLine = {
  id: string;
  variant_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  sku: string;
  size: string;
  color: string;
  image_url?: string | null;
  quantity: number;
  unit_price_amount: number;
  line_total_amount: number;
  currency: string;
  quantity_available: number;
  is_available: boolean;
};

export type Cart = {
  id: string;
  cart_key: string;
  currency: string;
  lines: CartLine[];
  subtotal_amount: number;
  item_count: number;
  has_unavailable_lines: boolean;
};

export type ShippingMethod = {
  code: string;
  title: string;
  description?: string;
  price_amount: number;
  currency?: string;
  eta_days?: number;
  free_over_amount?: number | null;
};

export type OrderLine = {
  id: string;
  product_name: string;
  product_slug?: string;
  sku: string;
  size?: string;
  color?: string;
  image_url?: string | null;
  quantity: number;
  unit_price_amount: number;
  line_total_amount: number;
};

export type OrderAddress = {
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address_line: string;
  postal_code: string;
};

export type OrderEvent = {
  status: string;
  note: string;
  created_at: string;
};

export type Order = {
  id: string;
  reference: string;
  status: string;
  currency: string;
  subtotal_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_method_title?: string;
  contact_name?: string;
  contact_phone?: string;
  customer_note?: string;
  shipping_address: OrderAddress;
  lines: OrderLine[];
  events: OrderEvent[];
  item_count: number;
  created_at?: string | null;
  paid_at?: string | null;
  payment_status: "" | "pending" | "succeeded" | "failed";
  payment_intent_id?: string | null;
  can_cancel: boolean;
};

export type Payment = {
  intent_id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  redirect_url?: string | null;
  supports_manual_completion: boolean;
};

export type CheckoutResult = {
  order: Order;
  payment: Payment | null;
  order_token: string;
  redirect_url?: string | null;
};

export type Address = {
  id: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address_line: string;
  postal_code: string;
  label: string;
  is_default: boolean;
};

export type Customer = {
  id: string;
  email: string;
  username: string;
  phone: string;
  first_name: string;
  last_name: string;
  display_name: string;
};

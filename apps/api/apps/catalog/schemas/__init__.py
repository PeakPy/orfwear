from __future__ import annotations

from ninja import Schema


class ProductImageOut(Schema):
    url: str
    alt: str = ""
    color: str = ""


class VariantOut(Schema):
    id: str
    sku: str
    size: str
    color: str
    price_amount: int
    currency: str
    is_active: bool
    quantity_available: int


class ProductListItem(Schema):
    id: str
    name: str
    slug: str
    brand: str
    description: str = ""
    min_price_amount: int | None = None
    currency: str = "IRR"
    image_url: str | None = None
    audience: str = "unisex"
    category_slug: str | None = None
    colors: list[str] = []
    sizes: list[str] = []
    in_stock: bool = True


class ProductDetail(Schema):
    id: str
    name: str
    slug: str
    brand: str
    description: str
    audience: str = "unisex"
    material: str = ""
    care: str = ""
    category_slug: str | None = None
    category_name: str | None = None
    variants: list[VariantOut]
    images: list[ProductImageOut] = []
    image_url: str | None = None
    min_price_amount: int | None = None
    currency: str = "IRR"
    in_stock: bool = True
    collections: list[str] = []
    related: list[ProductListItem] = []


class ProductPage(Schema):
    items: list[ProductListItem]
    page: int
    page_size: int
    total: int
    has_next: bool


class FacetValue(Schema):
    value: str
    label: str
    count: int = 0


class CatalogFacets(Schema):
    categories: list[FacetValue] = []
    collections: list[FacetValue] = []
    sizes: list[FacetValue] = []
    colors: list[FacetValue] = []
    price_min: int = 0
    price_max: int = 0


class CategoryOut(Schema):
    id: str
    name: str
    slug: str
    product_count: int = 0


class CollectionListItem(Schema):
    id: str
    name: str
    slug: str
    description: str = ""
    image_url: str | None = None
    product_count: int = 0


class CollectionDetail(Schema):
    id: str
    name: str
    slug: str
    description: str
    image_url: str | None = None
    products: list[ProductListItem]

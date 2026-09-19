from __future__ import annotations

from ninja import Schema

# ---- Catalog admin ----


class AdminCategoryOut(Schema):
    id: str
    name: str
    slug: str
    parent_id: str | None = None


class AdminCategoryIn(Schema):
    name: str
    slug: str
    parent_id: str | None = None


class AdminCollectionOut(Schema):
    id: str
    name: str
    slug: str
    description: str = ""
    is_published: bool = False


class AdminCollectionIn(Schema):
    name: str
    slug: str
    description: str = ""
    is_published: bool = False


class AdminVariantOut(Schema):
    id: str
    sku: str
    size: str
    color: str
    price_amount: int
    currency: str
    is_active: bool
    quantity_on_hand: int
    quantity_reserved: int
    quantity_available: int


class AdminVariantIn(Schema):
    sku: str
    size: str = ""
    color: str = ""
    price_amount: int
    currency: str = "IRR"
    is_active: bool = True
    quantity_on_hand: int = 0


class AdminVariantUpdateIn(Schema):
    sku: str | None = None
    size: str | None = None
    color: str | None = None
    price_amount: int | None = None
    currency: str | None = None
    is_active: bool | None = None


class AdminProductListItem(Schema):
    id: str
    name: str
    slug: str
    brand: str
    is_published: bool
    category_id: str | None = None
    category_name: str | None = None
    variant_count: int = 0
    min_price_amount: int | None = None
    currency: str = "IRR"
    updated_at: str | None = None


class AdminProductDetail(Schema):
    id: str
    name: str
    slug: str
    brand: str
    description: str
    is_published: bool
    category_id: str | None = None
    collection_ids: list[str] = []
    variants: list[AdminVariantOut] = []
    updated_at: str | None = None


class AdminProductCreateIn(Schema):
    name: str
    slug: str
    brand: str = "orf"
    description: str = ""
    is_published: bool = False
    category_id: str | None = None
    collection_ids: list[str] = []
    variants: list[AdminVariantIn] = []


class AdminProductUpdateIn(Schema):
    name: str | None = None
    slug: str | None = None
    brand: str | None = None
    description: str | None = None
    is_published: bool | None = None
    category_id: str | None = None
    collection_ids: list[str] | None = None

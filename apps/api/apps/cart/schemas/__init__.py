from __future__ import annotations

from ninja import Schema


class CartLineOut(Schema):
    id: str
    variant_id: str
    product_id: str
    product_name: str
    product_slug: str
    sku: str
    size: str
    color: str
    image_url: str | None = None
    quantity: int
    unit_price_amount: int
    line_total_amount: int
    currency: str
    quantity_available: int = 0
    is_available: bool = True


class CartOut(Schema):
    id: str
    cart_key: str
    currency: str
    lines: list[CartLineOut]
    subtotal_amount: int
    item_count: int
    has_unavailable_lines: bool = False


class AddCartLineIn(Schema):
    variant_id: str
    quantity: int = 1


class UpdateCartLineIn(Schema):
    quantity: int

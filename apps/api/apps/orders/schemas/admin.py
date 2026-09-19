from __future__ import annotations

from ninja import Schema


class AdminOrderLineOut(Schema):
    id: str
    product_name: str
    sku: str
    quantity: int
    unit_price_amount: int
    line_total_amount: int


class AdminOrderListItem(Schema):
    id: str
    status: str
    total_amount: int
    currency: str
    customer_email: str | None = None
    customer_phone: str | None = None
    line_count: int = 0
    created_at: str | None = None


class AdminOrderDetail(Schema):
    id: str
    status: str
    total_amount: int
    currency: str
    customer_email: str | None = None
    customer_phone: str | None = None
    staff_notes: str = ""
    lines: list[AdminOrderLineOut] = []
    created_at: str | None = None
    updated_at: str | None = None


class AdminOrderStatusIn(Schema):
    status: str
    staff_notes: str | None = None

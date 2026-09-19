from __future__ import annotations

from ninja import Schema


class StaffLoginIn(Schema):
    email: str
    password: str


class StaffUserOut(Schema):
    id: str
    email: str
    display_name: str
    is_staff: bool


class StaffLoginOut(Schema):
    token: str
    user: StaffUserOut


class DashboardStatsOut(Schema):
    orders_today: int
    orders_total: int
    sales_today_amount: int
    sales_total_amount: int
    currency: str = "IRR"
    low_stock_count: int
    products_published: int
    products_total: int


class StoreSettingsOut(Schema):
    store_name: str
    currency: str
    low_stock_threshold: int
    payment_provider: str
    shipping_default_code: str


class StoreSettingsIn(Schema):
    store_name: str | None = None
    currency: str | None = None
    low_stock_threshold: int | None = None
    payment_provider: str | None = None
    shipping_default_code: str | None = None


class ContentPageOut(Schema):
    id: str
    slug: str
    title: str
    body: str
    is_published: bool
    updated_at: str | None = None


class ContentPageIn(Schema):
    slug: str
    title: str
    body: str = ""
    is_published: bool = False


class ContentPageUpdateIn(Schema):
    title: str | None = None
    body: str | None = None
    is_published: bool | None = None

from __future__ import annotations

from ninja import Schema


class CheckoutAddressIn(Schema):
    full_name: str
    phone: str
    address_line: str
    province: str = ""
    city: str = ""
    postal_code: str = ""


class CheckoutIn(Schema):
    shipping_method_code: str
    # Either reference a saved address (signed-in shoppers) or send one inline.
    address_id: str | None = None
    address: CheckoutAddressIn | None = None
    note: str = ""
    save_address: bool = False


class OrderLineOut(Schema):
    id: str
    product_name: str
    product_slug: str = ""
    sku: str
    size: str = ""
    color: str = ""
    image_url: str | None = None
    quantity: int
    unit_price_amount: int
    line_total_amount: int


class OrderAddressOut(Schema):
    full_name: str = ""
    phone: str = ""
    province: str = ""
    city: str = ""
    address_line: str = ""
    postal_code: str = ""


class OrderEventOut(Schema):
    status: str
    note: str = ""
    created_at: str


class OrderOut(Schema):
    id: str
    reference: str
    status: str
    currency: str
    subtotal_amount: int
    shipping_amount: int
    discount_amount: int
    total_amount: int
    shipping_method_title: str = ""
    contact_name: str = ""
    contact_phone: str = ""
    customer_note: str = ""
    shipping_address: OrderAddressOut = OrderAddressOut()
    lines: list[OrderLineOut] = []
    events: list[OrderEventOut] = []
    item_count: int = 0
    created_at: str | None = None
    paid_at: str | None = None
    # Latest attempt, so the result page can poll without holding the intent id.
    payment_status: str = ""
    payment_intent_id: str | None = None
    can_cancel: bool = False


class PaymentOut(Schema):
    intent_id: str
    provider: str
    status: str
    amount: int
    currency: str
    redirect_url: str | None = None
    # True only for local/dev adapters; production gateways never allow this.
    supports_manual_completion: bool = False


class CheckoutOut(Schema):
    order: OrderOut
    payment: PaymentOut | None = None
    # Lets a guest reopen their own order result page without an account.
    order_token: str
    redirect_url: str | None = None

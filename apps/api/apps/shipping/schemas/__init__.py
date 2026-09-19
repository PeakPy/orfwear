from __future__ import annotations

from ninja import Schema


class ShippingMethodOut(Schema):
    code: str
    title: str
    description: str = ""
    price_amount: int
    currency: str = "IRR"
    eta_days: int = 0
    free_over_amount: int | None = None

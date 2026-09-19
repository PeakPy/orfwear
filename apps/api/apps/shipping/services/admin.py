from __future__ import annotations

from ninja import Schema

from apps.common.exceptions import ConflictError, NotFoundError, ValidationAppError
from apps.shipping.models import ShippingMethod


class AdminShippingMethodOut(Schema):
    id: str
    code: str
    title: str
    price_amount: int
    currency: str
    is_active: bool


class AdminShippingMethodIn(Schema):
    code: str
    title: str
    price_amount: int = 0
    currency: str = "IRR"
    is_active: bool = True


class AdminShippingMethodUpdateIn(Schema):
    title: str | None = None
    price_amount: int | None = None
    currency: str | None = None
    is_active: bool | None = None


def _serialize(method: ShippingMethod) -> AdminShippingMethodOut:
    return AdminShippingMethodOut(
        id=str(method.id),
        code=method.code,
        title=method.title,
        price_amount=method.price_amount,
        currency=method.currency,
        is_active=method.is_active,
    )


def list_shipping_methods() -> list[AdminShippingMethodOut]:
    return [_serialize(m) for m in ShippingMethod.objects.order_by("code")]


def create_shipping_method(**data) -> AdminShippingMethodOut:
    code = (data.get("code") or "").strip()
    title = (data.get("title") or "").strip()
    if not code or not title:
        raise ValidationAppError("code and title are required.")
    if ShippingMethod.objects.filter(code=code).exists():
        raise ConflictError("Shipping method code already exists.", details={"code": code})
    method = ShippingMethod.objects.create(
        code=code,
        title=title,
        price_amount=max(int(data.get("price_amount") or 0), 0),
        currency=(data.get("currency") or "IRR").strip() or "IRR",
        is_active=bool(data.get("is_active", True)),
    )
    return _serialize(method)


def update_shipping_method(method_id: str, **fields) -> AdminShippingMethodOut:
    method = ShippingMethod.objects.filter(pk=method_id).first()
    if not method:
        raise NotFoundError("Shipping method not found.", details={"id": method_id})
    for key in ("title", "price_amount", "currency", "is_active"):
        if key in fields and fields[key] is not None:
            setattr(method, key, fields[key])
    method.save()
    return _serialize(method)

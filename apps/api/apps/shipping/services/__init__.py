from __future__ import annotations

from apps.common.exceptions import ValidationAppError
from apps.shipping.models import ShippingMethod
from apps.shipping.schemas import ShippingMethodOut


def _serialize(method: ShippingMethod) -> ShippingMethodOut:
    return ShippingMethodOut(
        code=method.code,
        title=method.title,
        description=method.description,
        price_amount=method.price_amount,
        currency=method.currency,
        eta_days=method.eta_days,
        free_over_amount=method.free_over_amount,
    )


def list_shipping_methods() -> list[ShippingMethodOut]:
    return [_serialize(m) for m in ShippingMethod.objects.filter(is_active=True)]


def resolve_shipping_method(code: str) -> ShippingMethod:
    method = ShippingMethod.objects.filter(code=(code or "").strip(), is_active=True).first()
    if not method:
        raise ValidationAppError("روش ارسال انتخاب‌شده در دسترس نیست.")
    return method

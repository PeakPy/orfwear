from __future__ import annotations

from django.db import transaction
from django.db.models import F, IntegerField, Value
from django.db.models.functions import Greatest
from ninja import Schema

from apps.common.exceptions import NotFoundError, ValidationAppError
from apps.inventory.models import StockItem


class AdminStockItemOut(Schema):
    id: str
    variant_id: str
    sku: str
    product_name: str
    size: str
    color: str
    quantity_on_hand: int
    quantity_reserved: int
    quantity_available: int
    is_low: bool = False


class AdminStockAdjustIn(Schema):
    delta: int
    reason: str = ""


def _available_expr():
    return Greatest(
        F("quantity_on_hand") - F("quantity_reserved"), Value(0), output_field=IntegerField()
    )


def _serialize(item: StockItem, *, threshold: int = 5) -> AdminStockItemOut:
    variant = item.variant
    available = item.quantity_available
    return AdminStockItemOut(
        id=str(item.id),
        variant_id=str(variant.id),
        sku=variant.sku,
        product_name=variant.product.name,
        size=variant.size,
        color=variant.color,
        quantity_on_hand=item.quantity_on_hand,
        quantity_reserved=item.quantity_reserved,
        quantity_available=available,
        is_low=available <= threshold,
    )


def list_stock_items(
    *, q: str | None = None, low_only: bool = False, threshold: int = 5
) -> list[AdminStockItemOut]:
    from django.db.models import Q

    qs = (
        StockItem.objects.select_related("variant", "variant__product")
        .annotate(available=_available_expr())
        .order_by("variant__sku")
    )
    if q:
        qs = qs.filter(Q(variant__sku__icontains=q) | Q(variant__product__name__icontains=q))
    if low_only:
        qs = qs.filter(available__lte=threshold)
    return [_serialize(item, threshold=threshold) for item in qs[:200]]


@transaction.atomic
def adjust_stock(variant_id: str, *, delta: int, reason: str = "") -> AdminStockItemOut:
    if delta == 0:
        raise ValidationAppError("delta must be non-zero.")
    item = (
        StockItem.objects.select_for_update()
        .select_related("variant", "variant__product")
        .filter(variant_id=variant_id)
        .first()
    )
    if not item:
        from apps.catalog.models import ProductVariant

        variant = (
            ProductVariant.objects.filter(pk=variant_id, is_deleted=False)
            .select_related("product")
            .first()
        )
        if not variant:
            raise NotFoundError("Variant not found.", details={"variant_id": variant_id})
        item = StockItem.objects.create(variant=variant, quantity_on_hand=0, quantity_reserved=0)
        item = (
            StockItem.objects.select_for_update()
            .select_related("variant", "variant__product")
            .get(pk=item.pk)
        )

    new_qty = item.quantity_on_hand + int(delta)
    if new_qty < 0:
        raise ValidationAppError(
            "Insufficient on-hand quantity.",
            details={"quantity_on_hand": item.quantity_on_hand, "delta": delta},
        )
    if new_qty < item.quantity_reserved:
        raise ValidationAppError(
            "On-hand cannot be below reserved quantity.",
            details={"quantity_reserved": item.quantity_reserved, "target": new_qty},
        )

    item.quantity_on_hand = new_qty
    item.save(update_fields=["quantity_on_hand", "updated_at"])
    # reason reserved for future stock movement ledger
    _ = reason
    return _serialize(item)

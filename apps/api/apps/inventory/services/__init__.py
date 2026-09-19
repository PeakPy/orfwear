from __future__ import annotations

from django.db import transaction
from django.db.models import F

from apps.common.exceptions import ValidationAppError
from apps.inventory.models import StockItem


def available_for(variant_id) -> int:
    stock = StockItem.objects.filter(variant_id=variant_id).first()
    if stock is None:
        return 0
    return stock.quantity_available


@transaction.atomic
def reserve(variant_id, quantity: int) -> None:
    """Hold stock for an unpaid order. Locks the row so concurrent checkouts cannot oversell."""
    stock = StockItem.objects.select_for_update().filter(variant_id=variant_id).first()
    if stock is None or stock.quantity_available < quantity:
        raise ValidationAppError("موجودی کافی نیست.")
    stock.quantity_reserved = F("quantity_reserved") + quantity
    stock.save(update_fields=["quantity_reserved", "updated_at"])


@transaction.atomic
def release(variant_id, quantity: int) -> None:
    """Give reserved stock back (payment failed or order cancelled)."""
    stock = StockItem.objects.select_for_update().filter(variant_id=variant_id).first()
    if stock is None:
        return
    stock.quantity_reserved = max(stock.quantity_reserved - quantity, 0)
    stock.save(update_fields=["quantity_reserved", "updated_at"])


@transaction.atomic
def commit(variant_id, quantity: int) -> None:
    """Convert a reservation into a real stock movement once payment succeeds."""
    stock = StockItem.objects.select_for_update().filter(variant_id=variant_id).first()
    if stock is None:
        return
    stock.quantity_reserved = max(stock.quantity_reserved - quantity, 0)
    stock.quantity_on_hand = max(stock.quantity_on_hand - quantity, 0)
    stock.save(update_fields=["quantity_reserved", "quantity_on_hand", "updated_at"])

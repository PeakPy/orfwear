from __future__ import annotations

from django.db import models

from apps.common.models import TimeStampedModel, UUIDPrimaryKeyModel


class StockItem(UUIDPrimaryKeyModel, TimeStampedModel):
    variant = models.OneToOneField(
        "catalog.ProductVariant",
        related_name="stock",
        on_delete=models.CASCADE,
    )
    quantity_on_hand = models.PositiveIntegerField(default=0)
    quantity_reserved = models.PositiveIntegerField(default=0)

    @property
    def quantity_available(self) -> int:
        return max(self.quantity_on_hand - self.quantity_reserved, 0)

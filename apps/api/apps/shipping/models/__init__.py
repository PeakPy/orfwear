from __future__ import annotations

from django.db import models

from apps.common.models import TimeStampedModel, UUIDPrimaryKeyModel


class ShippingMethod(UUIDPrimaryKeyModel, TimeStampedModel):
    code = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    price_amount = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=3, default="IRR")
    eta_days = models.PositiveIntegerField(default=0, help_text="Indicative delivery time in days")
    free_over_amount = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Subtotal at which this method becomes free (minor units)",
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "price_amount"]

    def __str__(self) -> str:
        return self.title

    def cost_for(self, subtotal_amount: int) -> int:
        if self.free_over_amount is not None and subtotal_amount >= self.free_over_amount:
            return 0
        return self.price_amount

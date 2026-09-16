from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel, UUIDPrimaryKeyModel


class Cart(UUIDPrimaryKeyModel, TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="carts",
    )
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    currency = models.CharField(max_length=3, default="IRR")
    is_active = models.BooleanField(default=True)


class CartLine(UUIDPrimaryKeyModel, TimeStampedModel):
    cart = models.ForeignKey(Cart, related_name="lines", on_delete=models.CASCADE)
    variant = models.ForeignKey("catalog.ProductVariant", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price_amount = models.PositiveIntegerField()

    class Meta:
        unique_together = ("cart", "variant")

from __future__ import annotations

from django.db import models

from apps.common.models import TimeStampedModel, UUIDPrimaryKeyModel


class ShippingMethod(UUIDPrimaryKeyModel, TimeStampedModel):
    code = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=120)
    price_amount = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=3, default="IRR")
    is_active = models.BooleanField(default=True)

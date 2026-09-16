from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel, UUIDPrimaryKeyModel


class Order(UUIDPrimaryKeyModel, TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_PAYMENT = "pending_payment", "Pending payment"
        PAID = "paid", "Paid"
        FULFILLING = "fulfilling", "Fulfilling"
        SHIPPED = "shipped", "Shipped"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
    )
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.DRAFT)
    currency = models.CharField(max_length=3, default="IRR")
    total_amount = models.PositiveIntegerField(default=0)
    idempotency_key = models.CharField(max_length=128, unique=True, null=True, blank=True)
    correlation_id = models.CharField(max_length=64, blank=True)


class OrderLine(UUIDPrimaryKeyModel, TimeStampedModel):
    order = models.ForeignKey(Order, related_name="lines", on_delete=models.CASCADE)
    variant = models.ForeignKey("catalog.ProductVariant", on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200)
    sku = models.CharField(max_length=64)
    quantity = models.PositiveIntegerField()
    unit_price_amount = models.PositiveIntegerField()

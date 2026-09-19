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
    subtotal_amount = models.PositiveIntegerField(default=0)
    shipping_amount = models.PositiveIntegerField(default=0)
    discount_amount = models.PositiveIntegerField(default=0)
    total_amount = models.PositiveIntegerField(default=0)
    idempotency_key = models.CharField(max_length=128, unique=True, null=True, blank=True)
    correlation_id = models.CharField(max_length=64, blank=True)
    staff_notes = models.TextField(blank=True, help_text="Internal staff notes")

    contact_name = models.CharField(max_length=120, blank=True)
    contact_phone = models.CharField(max_length=32, blank=True)
    customer_note = models.TextField(blank=True)
    # Frozen copy of the delivery address; editing the saved address must not
    # rewrite an order that already shipped.
    shipping_address = models.JSONField(default=dict, blank=True)
    shipping_method_code = models.CharField(max_length=64, blank=True)
    shipping_method_title = models.CharField(max_length=120, blank=True)

    stock_reserved = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self) -> str:
        return f"Order {self.id}"

    @property
    def reference(self) -> str:
        return str(self.id).split("-")[0].upper()


class OrderLine(UUIDPrimaryKeyModel, TimeStampedModel):
    order = models.ForeignKey(Order, related_name="lines", on_delete=models.CASCADE)
    variant = models.ForeignKey("catalog.ProductVariant", on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200)
    product_slug = models.SlugField(blank=True)
    sku = models.CharField(max_length=64)
    size = models.CharField(max_length=32, blank=True)
    color = models.CharField(max_length=64, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    quantity = models.PositiveIntegerField()
    unit_price_amount = models.PositiveIntegerField()


class OrderEvent(UUIDPrimaryKeyModel, TimeStampedModel):
    """Append-only status timeline shown to the customer and to staff."""

    order = models.ForeignKey(Order, related_name="events", on_delete=models.CASCADE)
    status = models.CharField(max_length=32)
    note = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=32, default="system")

    class Meta:
        ordering = ["created_at"]

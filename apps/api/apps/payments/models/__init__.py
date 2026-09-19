from __future__ import annotations

from django.db import models

from apps.common.models import TimeStampedModel, UUIDPrimaryKeyModel


class PaymentIntent(UUIDPrimaryKeyModel, TimeStampedModel):
    class Status(models.TextChoices):
        REQUIRES_ACTION = "requires_action", "Requires action"
        PROCESSING = "processing", "Processing"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    order = models.ForeignKey("orders.Order", related_name="payments", on_delete=models.CASCADE)
    provider = models.CharField(max_length=64)
    provider_ref = models.CharField(max_length=128, blank=True)
    amount = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, default="IRR")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.REQUIRES_ACTION)
    idempotency_key = models.CharField(max_length=128, unique=True)
    raw_response = models.JSONField(default=dict, blank=True)
    redirect_url = models.URLField(max_length=500, blank=True)
    failure_code = models.CharField(max_length=64, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    correlation_id = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["provider", "provider_ref"])]

    TERMINAL_STATUSES = (Status.SUCCEEDED, Status.FAILED, Status.CANCELLED)

    @property
    def is_open(self) -> bool:
        return self.status not in self.TERMINAL_STATUSES

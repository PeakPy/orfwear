from __future__ import annotations

from django.db import models

from apps.common.models import SoftDeleteModel, TimeStampedModel, UUIDPrimaryKeyModel


class HeroBanner(UUIDPrimaryKeyModel, TimeStampedModel, SoftDeleteModel):
    title = models.CharField(max_length=160)
    subtitle = models.CharField(max_length=255, blank=True)
    cta_label = models.CharField(max_length=64, blank=True)
    cta_href = models.CharField(max_length=255, blank=True)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

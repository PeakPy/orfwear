from __future__ import annotations

from django.db import models

from apps.common.models import TimeStampedModel, UUIDPrimaryKeyModel


class MediaAsset(UUIDPrimaryKeyModel, TimeStampedModel):
    key = models.CharField(max_length=255, unique=True)
    url = models.URLField()
    content_type = models.CharField(max_length=128, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)

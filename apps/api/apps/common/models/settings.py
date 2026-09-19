from __future__ import annotations

from django.db import models

from apps.common.models.base import TimeStampedModel, UUIDPrimaryKeyModel


class StoreSetting(UUIDPrimaryKeyModel, TimeStampedModel):
    """Key/value store for admin settings stubs."""

    key = models.CharField(max_length=64, unique=True)
    value = models.JSONField(default=dict, blank=True)

    def __str__(self) -> str:
        return self.key


class ContentPage(UUIDPrimaryKeyModel, TimeStampedModel):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=160)
    body = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.title

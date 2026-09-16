from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.common.models import TimeStampedModel, UUIDPrimaryKeyModel


class User(UUIDPrimaryKeyModel, TimeStampedModel, AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=32, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
        ]

    def __str__(self) -> str:
        return self.email

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
            models.Index(fields=["phone"]),
        ]
        constraints = [
            # Phone is the storefront login identity, so it must be unique when set.
            # Staff accounts created by email keep it blank, hence the partial constraint.
            models.UniqueConstraint(
                fields=["phone"],
                condition=~models.Q(phone=""),
                name="uniq_user_phone_when_set",
            ),
        ]

    def __str__(self) -> str:
        return self.email


class Address(UUIDPrimaryKeyModel, TimeStampedModel):
    user = models.ForeignKey(User, related_name="addresses", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=32)
    province = models.CharField(max_length=64, blank=True)
    city = models.CharField(max_length=64, blank=True)
    address_line = models.TextField()
    postal_code = models.CharField(max_length=16, blank=True)
    label = models.CharField(max_length=64, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "addresses"
        ordering = ["-is_default", "-created_at"]

    def __str__(self) -> str:
        return f"{self.full_name} — {self.city}"

    def as_snapshot(self) -> dict:
        """Immutable copy stored on orders so later edits never rewrite history."""
        return {
            "full_name": self.full_name,
            "phone": self.phone,
            "province": self.province,
            "city": self.city,
            "address_line": self.address_line,
            "postal_code": self.postal_code,
        }


class WishlistItem(UUIDPrimaryKeyModel, TimeStampedModel):
    user = models.ForeignKey(User, related_name="wishlist_items", on_delete=models.CASCADE)
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "product")
        ordering = ["-created_at"]

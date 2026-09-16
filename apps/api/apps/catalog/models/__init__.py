from __future__ import annotations

from django.db import models

from apps.common.models import SoftDeleteModel, TimeStampedModel, UUIDPrimaryKeyModel


class Category(UUIDPrimaryKeyModel, TimeStampedModel, SoftDeleteModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.SET_NULL,
    )

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self) -> str:
        return self.name


class Collection(UUIDPrimaryKeyModel, TimeStampedModel, SoftDeleteModel):
    name = models.CharField(max_length=160)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.name


class Product(UUIDPrimaryKeyModel, TimeStampedModel, SoftDeleteModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL)
    collections = models.ManyToManyField(Collection, blank=True, related_name="products")
    is_published = models.BooleanField(default=False)
    brand = models.CharField(max_length=64, default="orf")

    def __str__(self) -> str:
        return self.name


class ProductVariant(UUIDPrimaryKeyModel, TimeStampedModel, SoftDeleteModel):
    product = models.ForeignKey(Product, related_name="variants", on_delete=models.CASCADE)
    sku = models.CharField(max_length=64, unique=True)
    size = models.CharField(max_length=32, blank=True)
    color = models.CharField(max_length=64, blank=True)
    price_amount = models.PositiveIntegerField(help_text="Minor units (e.g. IRR rial)")
    currency = models.CharField(max_length=3, default="IRR")
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.sku

from __future__ import annotations

import uuid

import pytest
from django.contrib.auth.models import AnonymousUser
from django.contrib.sessions.backends.db import SessionStore
from django.core.cache import cache
from django.test import RequestFactory

from apps.catalog.models import Category, Collection, Product, ProductImage, ProductVariant
from apps.inventory.models import StockItem
from apps.shipping.models import ShippingMethod
from apps.users.models import User


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def category(db):
    return Category.objects.create(name="تی‌شرت", slug="tshirts")


@pytest.fixture
def collection(db):
    return Collection.objects.create(name="تازه‌ها", slug="new", is_published=True)


@pytest.fixture
def product(db, category, collection):
    product = Product.objects.create(
        name="تی‌شرت پنبه",
        slug="cotton-tee",
        description="توضیح",
        category=category,
        is_published=True,
        brand="ORF",
        audience=Product.Audience.UNISEX,
    )
    product.collections.add(collection)
    ProductImage.objects.create(product=product, url="http://img.test/a.jpg", position=0)
    return product


def _make_variant(product, *, sku, size, color, price, on_hand):
    variant = ProductVariant.objects.create(
        product=product, sku=sku, size=size, color=color, price_amount=price
    )
    StockItem.objects.create(variant=variant, quantity_on_hand=on_hand, quantity_reserved=0)
    return variant


@pytest.fixture
def variant(db, product):
    return _make_variant(product, sku="TEE-M", size="M", color="سفید", price=1_000_000, on_hand=5)


@pytest.fixture
def variant_low(db, product):
    return _make_variant(product, sku="TEE-S", size="S", color="سفید", price=1_000_000, on_hand=1)


@pytest.fixture
def shipping_method(db):
    return ShippingMethod.objects.create(
        code="standard",
        title="پست پیشتاز",
        price_amount=650_000,
        free_over_amount=5_000_000,
        is_active=True,
    )


@pytest.fixture
def customer(db):
    return User.objects.create(
        username="09120000001", email="09120000001@phone.test", phone="09120000001"
    )


@pytest.fixture
def rf():
    return RequestFactory()


def _build_request(rf, *, user, cart_key: str | None):
    request = rf.get("/")
    request.user = user
    request.correlation_id = str(uuid.uuid4())
    request.session = SessionStore()
    if cart_key:
        request.META["HTTP_X_CART_KEY"] = cart_key
    return request


@pytest.fixture
def guest_request(rf):
    def _make(cart_key: str | None = None):
        return _build_request(rf, user=AnonymousUser(), cart_key=cart_key)

    return _make


@pytest.fixture
def user_request(rf, customer):
    def _make(cart_key: str | None = None, user=None):
        return _build_request(rf, user=user or customer, cart_key=cart_key)

    return _make

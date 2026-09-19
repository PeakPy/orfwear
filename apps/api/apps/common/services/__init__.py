from __future__ import annotations

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.utils import timezone

from apps.catalog.models import Product
from apps.common.exceptions import ForbiddenError, UnauthorizedError, ValidationAppError
from apps.common.models import ContentPage, StoreSetting
from apps.common.permissions import issue_staff_token
from apps.common.schemas import (
    ContentPageOut,
    DashboardStatsOut,
    StaffLoginOut,
    StaffUserOut,
    StoreSettingsOut,
)
from apps.inventory.models import StockItem
from apps.orders.models import Order

User = get_user_model()

STORE_SETTINGS_KEY = "store"
DEFAULT_STORE_SETTINGS = {
    "store_name": "ORF Wear",
    "currency": "IRR",
    "low_stock_threshold": 5,
    "payment_provider": "stub",
    "shipping_default_code": "standard",
}

DEFAULT_CONTENT_PAGES = [
    {"slug": "about", "title": "درباره ما", "body": "", "is_published": True},
    {"slug": "faq", "title": "سؤالات متداول", "body": "", "is_published": True},
    {"slug": "privacy", "title": "حریم خصوصی", "body": "", "is_published": True},
    {"slug": "terms", "title": "شرایط استفاده", "body": "", "is_published": True},
    {"slug": "shipping", "title": "ارسال", "body": "", "is_published": True},
    {"slug": "returns", "title": "مرجوعی", "body": "", "is_published": True},
]


def _staff_user_out(user) -> StaffUserOut:
    display = (user.get_full_name() or "").strip() or (user.username or user.email.split("@")[0])
    return StaffUserOut(
        id=str(user.id),
        email=user.email,
        display_name=display,
        is_staff=bool(user.is_staff),
    )


def staff_login(*, email: str, password: str) -> StaffLoginOut:
    email = (email or "").strip().lower()
    if not email or not password:
        raise ValidationAppError("Email and password are required.")

    user = User.objects.filter(email__iexact=email).first()

    # Local DX: bootstrap default staff when DB is empty (DEBUG only).
    if user is None and settings.DEBUG and email == "staff@orfwear.ir":
        user = User.objects.create_user(
            username="staff",
            email=email,
            password=password,
            is_staff=True,
            is_superuser=True,
        )
    elif user is None:
        raise UnauthorizedError("Invalid credentials.")
    elif not user.check_password(password):
        raise UnauthorizedError("Invalid credentials.")

    if not user.is_active:
        raise ForbiddenError("Account is inactive.")
    if not user.is_staff:
        raise ForbiddenError("Staff access required.")

    return StaffLoginOut(token=issue_staff_token(user), user=_staff_user_out(user))


def get_dashboard_stats() -> DashboardStatsOut:
    settings_out = get_store_settings()
    threshold = settings_out.low_stock_threshold
    today = timezone.localdate()

    orders_today_qs = Order.objects.filter(created_at__date=today).exclude(
        status=Order.Status.CANCELLED
    )
    paid_statuses = [
        Order.Status.PAID,
        Order.Status.FULFILLING,
        Order.Status.SHIPPED,
        Order.Status.COMPLETED,
    ]

    sales_today = (
        Order.objects.filter(created_at__date=today, status__in=paid_statuses).aggregate(
            total=Sum("total_amount")
        )["total"]
        or 0
    )
    sales_total = (
        Order.objects.filter(status__in=paid_statuses).aggregate(total=Sum("total_amount"))["total"]
        or 0
    )

    low_stock = (
        StockItem.objects.annotate(available=models_available_expr())
        .filter(available__lte=threshold)
        .count()
    )

    product_counts = Product.objects.filter(is_deleted=False).aggregate(
        total=Count("id"),
        published=Count("id", filter=Q(is_published=True)),
    )

    return DashboardStatsOut(
        orders_today=orders_today_qs.count(),
        orders_total=Order.objects.count(),
        sales_today_amount=int(sales_today),
        sales_total_amount=int(sales_total),
        currency=settings_out.currency,
        low_stock_count=low_stock,
        products_published=product_counts["published"] or 0,
        products_total=product_counts["total"] or 0,
    )


def models_available_expr():
    from django.db.models import F, IntegerField, Value
    from django.db.models.functions import Greatest

    return Greatest(
        F("quantity_on_hand") - F("quantity_reserved"), Value(0), output_field=IntegerField()
    )


def get_store_settings() -> StoreSettingsOut:
    row, _ = StoreSetting.objects.get_or_create(
        key=STORE_SETTINGS_KEY, defaults={"value": dict(DEFAULT_STORE_SETTINGS)}
    )
    merged = {**DEFAULT_STORE_SETTINGS, **(row.value or {})}
    return StoreSettingsOut(
        store_name=str(merged["store_name"]),
        currency=str(merged["currency"]),
        low_stock_threshold=int(merged["low_stock_threshold"]),
        payment_provider=str(merged["payment_provider"]),
        shipping_default_code=str(merged["shipping_default_code"]),
    )


def update_store_settings(**fields) -> StoreSettingsOut:
    row, _ = StoreSetting.objects.get_or_create(
        key=STORE_SETTINGS_KEY, defaults={"value": dict(DEFAULT_STORE_SETTINGS)}
    )
    current = {**DEFAULT_STORE_SETTINGS, **(row.value or {})}
    for key, value in fields.items():
        if value is not None and key in DEFAULT_STORE_SETTINGS:
            current[key] = value
    if current["low_stock_threshold"] < 0:
        raise ValidationAppError("low_stock_threshold must be >= 0")
    row.value = current
    row.save(update_fields=["value", "updated_at"])
    return get_store_settings()


def _serialize_content_page(page: ContentPage) -> ContentPageOut:
    return ContentPageOut(
        id=str(page.id),
        slug=page.slug,
        title=page.title,
        body=page.body,
        is_published=page.is_published,
        updated_at=page.updated_at.isoformat() if page.updated_at else None,
    )


def ensure_default_content_pages() -> None:
    for item in DEFAULT_CONTENT_PAGES:
        ContentPage.objects.get_or_create(
            slug=item["slug"],
            defaults={
                "title": item["title"],
                "body": item["body"],
                "is_published": item["is_published"],
            },
        )


def list_content_pages() -> list[ContentPageOut]:
    ensure_default_content_pages()
    pages = ContentPage.objects.order_by("slug")
    return [_serialize_content_page(p) for p in pages]


def update_content_page(page_id: str, **fields) -> ContentPageOut:
    page = ContentPage.objects.filter(pk=page_id).first()
    if not page:
        from apps.common.exceptions import NotFoundError

        raise NotFoundError("Content page not found.", details={"id": page_id})
    for key, value in fields.items():
        if value is not None:
            setattr(page, key, value)
    page.save()
    return _serialize_content_page(page)

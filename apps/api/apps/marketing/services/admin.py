from __future__ import annotations

from django.utils import timezone
from ninja import Schema

from apps.common.exceptions import NotFoundError, ValidationAppError
from apps.marketing.models import HeroBanner


class AdminBannerOut(Schema):
    id: str
    title: str
    subtitle: str
    cta_label: str
    cta_href: str
    image_url: str
    is_active: bool
    sort_order: int
    updated_at: str | None = None


class AdminBannerIn(Schema):
    title: str
    subtitle: str = ""
    cta_label: str = ""
    cta_href: str = ""
    image_url: str = ""
    is_active: bool = False
    sort_order: int = 0


class AdminBannerUpdateIn(Schema):
    title: str | None = None
    subtitle: str | None = None
    cta_label: str | None = None
    cta_href: str | None = None
    image_url: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


def _serialize(banner: HeroBanner) -> AdminBannerOut:
    return AdminBannerOut(
        id=str(banner.id),
        title=banner.title,
        subtitle=banner.subtitle,
        cta_label=banner.cta_label,
        cta_href=banner.cta_href,
        image_url=banner.image_url,
        is_active=banner.is_active,
        sort_order=banner.sort_order,
        updated_at=banner.updated_at.isoformat() if banner.updated_at else None,
    )


def list_admin_banners() -> list[AdminBannerOut]:
    banners = HeroBanner.objects.filter(is_deleted=False).order_by("sort_order", "-updated_at")
    return [_serialize(b) for b in banners]


def create_banner(**data) -> AdminBannerOut:
    title = (data.get("title") or "").strip()
    if not title:
        raise ValidationAppError("title is required.")
    banner = HeroBanner.objects.create(
        title=title,
        subtitle=(data.get("subtitle") or "").strip(),
        cta_label=(data.get("cta_label") or "").strip(),
        cta_href=(data.get("cta_href") or "").strip(),
        image_url=(data.get("image_url") or "").strip(),
        is_active=bool(data.get("is_active", False)),
        sort_order=int(data.get("sort_order") or 0),
    )
    return _serialize(banner)


def update_banner(banner_id: str, **fields) -> AdminBannerOut:
    banner = HeroBanner.objects.filter(pk=banner_id, is_deleted=False).first()
    if not banner:
        raise NotFoundError("Banner not found.", details={"id": banner_id})
    for key in (
        "title",
        "subtitle",
        "cta_label",
        "cta_href",
        "image_url",
        "is_active",
        "sort_order",
    ):
        if key in fields and fields[key] is not None:
            value = fields[key]
            if isinstance(value, str):
                value = value.strip()
            setattr(banner, key, value)
    banner.save()
    return _serialize(banner)


def delete_banner(banner_id: str) -> None:
    banner = HeroBanner.objects.filter(pk=banner_id, is_deleted=False).first()
    if not banner:
        raise NotFoundError("Banner not found.", details={"id": banner_id})
    banner.is_deleted = True
    banner.deleted_at = timezone.now()
    banner.is_active = False
    banner.save(update_fields=["is_deleted", "deleted_at", "is_active", "updated_at"])

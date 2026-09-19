from __future__ import annotations

import uuid

from ninja import Schema

from apps.media.models import MediaAsset


class AdminMediaOut(Schema):
    id: str
    key: str
    url: str
    content_type: str
    width: int | None = None
    height: int | None = None
    alt_text: str = ""
    created_at: str | None = None


class AdminMediaUploadIn(Schema):
    """Stub upload: client provides URL/metadata; real storage later."""

    url: str
    key: str | None = None
    content_type: str = "image/jpeg"
    width: int | None = None
    height: int | None = None
    alt_text: str = ""


def list_media_assets() -> list[AdminMediaOut]:
    assets = MediaAsset.objects.order_by("-created_at")[:100]
    return [
        AdminMediaOut(
            id=str(a.id),
            key=a.key,
            url=a.url,
            content_type=a.content_type,
            width=a.width,
            height=a.height,
            alt_text=a.alt_text,
            created_at=a.created_at.isoformat() if a.created_at else None,
        )
        for a in assets
    ]


def stub_upload_media(**data) -> AdminMediaOut:
    url = (data.get("url") or "").strip()
    if not url:
        from apps.common.exceptions import ValidationAppError

        raise ValidationAppError("url is required.")
    key = (data.get("key") or "").strip() or f"uploads/{uuid.uuid4().hex}"
    asset, _ = MediaAsset.objects.update_or_create(
        key=key,
        defaults={
            "url": url,
            "content_type": (data.get("content_type") or "image/jpeg").strip(),
            "width": data.get("width"),
            "height": data.get("height"),
            "alt_text": (data.get("alt_text") or "").strip(),
        },
    )
    return AdminMediaOut(
        id=str(asset.id),
        key=asset.key,
        url=asset.url,
        content_type=asset.content_type,
        width=asset.width,
        height=asset.height,
        alt_text=asset.alt_text,
        created_at=asset.created_at.isoformat() if asset.created_at else None,
    )

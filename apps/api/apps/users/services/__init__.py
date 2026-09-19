from __future__ import annotations

import logging
import re
import secrets

from django.conf import settings
from django.core.cache import cache
from django.db import IntegrityError, transaction

from apps.common.exceptions import (
    NotFoundError,
    ProviderUnavailableError,
    RateLimitedError,
    ValidationAppError,
)
from apps.common.permissions import CUSTOMER_TOKEN_MAX_AGE, issue_customer_token
from apps.common.utils import parse_uuid
from apps.users.models import Address, User, WishlistItem
from apps.users.schemas import AddressOut, MeOut, OtpRequestOut, OtpVerifyOut
from apps.users.sms import get_sms_backend, mask_phone

logger = logging.getLogger(__name__)

OTP_TTL_SECONDS = 300
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_PER_PHONE_PER_HOUR = 5
OTP_MAX_VERIFY_ATTEMPTS = 5
PHONE_RE = re.compile(r"^09\d{9}$")


def _normalize_phone(phone: str) -> str:
    cleaned = (phone or "").strip().replace(" ", "").replace("-", "")
    cleaned = cleaned.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
    if cleaned.startswith("+98"):
        cleaned = "0" + cleaned[3:]
    elif cleaned.startswith("0098"):
        cleaned = "0" + cleaned[4:]
    elif cleaned.startswith("98") and len(cleaned) == 12:
        cleaned = "0" + cleaned[2:]
    elif cleaned.startswith("9") and len(cleaned) == 10:
        cleaned = "0" + cleaned
    return cleaned


def _require_phone(phone: str) -> str:
    normalized = _normalize_phone(phone)
    if not PHONE_RE.match(normalized):
        # Echo nothing back about the submitted value.
        raise ValidationAppError("شماره موبایل معتبر نیست.")
    return normalized


def _expose_debug_code() -> bool:
    return bool(getattr(settings, "OTP_EXPOSE_DEBUG_CODE", settings.DEBUG))


def _otp_key(phone: str) -> str:
    return f"otp:code:{phone}"


def _attempts_key(phone: str) -> str:
    return f"otp:attempts:{phone}"


def _cooldown_key(phone: str) -> str:
    return f"otp:cooldown:{phone}"


def _hourly_key(phone: str) -> str:
    return f"otp:hourly:{phone}"


def request_otp(*, phone: str) -> OtpRequestOut:
    normalized = _require_phone(phone)

    if cache.get(_cooldown_key(normalized)):
        raise RateLimitedError("کد قبلی هنوز معتبر است؛ کمی بعد دوباره تلاش کنید.")

    hourly_key = _hourly_key(normalized)
    sent_this_hour = cache.get(hourly_key, 0)
    if sent_this_hour >= OTP_MAX_PER_PHONE_PER_HOUR:
        raise RateLimitedError("تعداد درخواست‌ها زیاد است؛ بعداً تلاش کنید.")

    code = f"{secrets.randbelow(1_000_000):06d}"
    cache.set(_otp_key(normalized), code, timeout=OTP_TTL_SECONDS)
    # Cooldown goes up before delivery so a burst of requests can't fan out to
    # the provider; the hourly counter is never rolled back, or a caller could
    # farm attempts by forcing failures.
    cache.set(_cooldown_key(normalized), 1, timeout=OTP_RESEND_COOLDOWN_SECONDS)
    cache.set(hourly_key, sent_this_hour + 1, timeout=3600)
    cache.delete(_attempts_key(normalized))

    backend = get_sms_backend()
    try:
        backend.send_otp(to=normalized, code=code)
    except Exception as exc:
        # Nothing was delivered, so drop the code and let the shopper retry now.
        cache.delete(_otp_key(normalized))
        cache.delete(_cooldown_key(normalized))
        logger.warning(
            "otp.delivery_failed phone=%s backend=%s error=%s",
            mask_phone(normalized),
            backend.name,
            type(exc).__name__,
        )
        raise ProviderUnavailableError(
            "ارسال پیامک ممکن نشد؛ لحظه‌ای بعد دوباره تلاش کنید."
        ) from exc

    logger.info("otp.requested phone=%s backend=%s", mask_phone(normalized), backend.name)

    return OtpRequestOut(
        ok=True,
        message="کد تأیید ارسال شد.",
        expires_in=OTP_TTL_SECONDS,
        retry_after=OTP_RESEND_COOLDOWN_SECONDS,
        debug_code=code if _expose_debug_code() else None,
    )


PHONE_EMAIL_DOMAIN = "@phone.orfwear.local"


def _public_email(user: User) -> str:
    """Hide the synthetic address minted for phone-only signups."""
    email = user.email or ""
    return "" if email.endswith(PHONE_EMAIL_DOMAIN) else email


def _serialize_me(user: User) -> MeOut:
    display = (f"{user.first_name} {user.last_name}".strip()) or user.phone or _public_email(user)
    return MeOut(
        id=str(user.id),
        email=_public_email(user),
        username=user.username,
        phone=user.phone or "",
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        display_name=display,
    )


def _get_or_create_customer(phone: str) -> User:
    user = User.objects.filter(phone=phone).first()
    if user:
        return user

    # Email/username stay unique-by-construction; the phone is the real identity.
    placeholder = f"{phone}{PHONE_EMAIL_DOMAIN}"
    try:
        with transaction.atomic():
            user = User.objects.create(
                phone=phone,
                email=placeholder,
                username=phone,
                is_active=True,
            )
            user.set_unusable_password()
            user.save(update_fields=["password"])
            return user
    except IntegrityError:
        # Concurrent first login for the same phone.
        existing = User.objects.filter(phone=phone).first()
        if existing:
            return existing
        raise


def verify_otp(request, *, phone: str, code: str) -> OtpVerifyOut:
    normalized = _require_phone(phone)
    cache_key = _otp_key(normalized)
    attempts_key = _attempts_key(normalized)

    attempts = cache.get(attempts_key, 0)
    if attempts >= OTP_MAX_VERIFY_ATTEMPTS:
        cache.delete(cache_key)
        raise RateLimitedError("تلاش‌های ناموفق زیاد است؛ کد جدید بگیرید.")

    expected = cache.get(cache_key)
    submitted = str(code or "").strip().translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
    if expected is None or not secrets.compare_digest(str(expected), submitted):
        cache.set(attempts_key, attempts + 1, timeout=OTP_TTL_SECONDS)
        logger.info("otp.verify_failed phone=%s", mask_phone(normalized))
        raise ValidationAppError("کد تأیید نامعتبر یا منقضی شده است.")

    cache.delete(cache_key)
    cache.delete(attempts_key)

    user = _get_or_create_customer(normalized)
    token = issue_customer_token(user)

    # Carry a guest cart over so nothing selected before login is lost.
    from apps.cart.services import merge_guest_cart_into_user

    merge_guest_cart_into_user(request, user=user)

    logger.info("otp.verified phone=%s user_id=%s", mask_phone(normalized), user.id)
    return OtpVerifyOut(
        ok=True,
        message="ورود انجام شد.",
        access_token=token,
        expires_in=CUSTOMER_TOKEN_MAX_AGE,
        user=_serialize_me(user),
    )


def get_me(user: User) -> MeOut:
    return _serialize_me(user)


def update_me(user: User, *, first_name=None, last_name=None, email=None) -> MeOut:
    updates: list[str] = []
    if first_name is not None:
        user.first_name = first_name.strip()[:150]
        updates.append("first_name")
    if last_name is not None:
        user.last_name = last_name.strip()[:150]
        updates.append("last_name")
    if email is not None:
        candidate = email.strip().lower()
        if candidate:
            if "@" not in candidate:
                raise ValidationAppError("ایمیل معتبر نیست.")
            if User.objects.filter(email=candidate).exclude(pk=user.pk).exists():
                raise ValidationAppError("این ایمیل قبلاً ثبت شده است.")
            user.email = candidate
            updates.append("email")
        elif user.phone:
            # Clearing the field falls back to the synthetic address so the
            # unique email column stays populated for phone-only accounts.
            user.email = f"{user.phone}{PHONE_EMAIL_DOMAIN}"
            updates.append("email")
    if updates:
        user.save(update_fields=[*updates, "updated_at"])
    return _serialize_me(user)


# —— Addresses ——


def _serialize_address(address: Address) -> AddressOut:
    return AddressOut(
        id=str(address.id),
        full_name=address.full_name,
        phone=address.phone,
        province=address.province,
        city=address.city,
        address_line=address.address_line,
        postal_code=address.postal_code,
        label=address.label,
        is_default=address.is_default,
    )


def list_addresses(user: User) -> list[AddressOut]:
    return [_serialize_address(a) for a in user.addresses.all()]


def get_address(user: User, address_id: str) -> Address:
    address = Address.objects.filter(id=parse_uuid(address_id, label="آدرس"), user=user).first()
    if not address:
        raise NotFoundError("آدرس پیدا نشد.")
    return address


@transaction.atomic
def create_address(user: User, *, payload) -> AddressOut:
    full_name = payload.full_name.strip()
    address_line = payload.address_line.strip()
    if len(full_name) < 2:
        raise ValidationAppError("نام گیرنده را کامل وارد کنید.")
    if len(address_line) < 5:
        raise ValidationAppError("نشانی را کامل وارد کنید.")

    is_first = not user.addresses.exists()
    address = Address.objects.create(
        user=user,
        full_name=full_name,
        phone=_require_phone(payload.phone),
        address_line=address_line,
        province=payload.province.strip()[:64],
        city=payload.city.strip()[:64],
        postal_code=payload.postal_code.strip()[:16],
        label=payload.label.strip()[:64],
        is_default=payload.is_default or is_first,
    )
    if address.is_default:
        user.addresses.exclude(pk=address.pk).update(is_default=False)
    return _serialize_address(address)


@transaction.atomic
def update_address(user: User, address_id: str, *, payload) -> AddressOut:
    address = get_address(user, address_id)
    fields: list[str] = []

    if payload.full_name is not None:
        address.full_name = payload.full_name.strip()[:120]
        fields.append("full_name")
    if payload.phone is not None:
        address.phone = _require_phone(payload.phone)
        fields.append("phone")
    if payload.address_line is not None:
        address.address_line = payload.address_line.strip()
        fields.append("address_line")
    if payload.province is not None:
        address.province = payload.province.strip()[:64]
        fields.append("province")
    if payload.city is not None:
        address.city = payload.city.strip()[:64]
        fields.append("city")
    if payload.postal_code is not None:
        address.postal_code = payload.postal_code.strip()[:16]
        fields.append("postal_code")
    if payload.label is not None:
        address.label = payload.label.strip()[:64]
        fields.append("label")
    if payload.is_default is not None:
        address.is_default = payload.is_default
        fields.append("is_default")

    if fields:
        address.save(update_fields=[*fields, "updated_at"])
    if address.is_default:
        user.addresses.exclude(pk=address.pk).update(is_default=False)
    return _serialize_address(address)


@transaction.atomic
def delete_address(user: User, address_id: str) -> None:
    address = get_address(user, address_id)
    was_default = address.is_default
    address.delete()
    if was_default:
        fallback = user.addresses.first()
        if fallback:
            fallback.is_default = True
            fallback.save(update_fields=["is_default", "updated_at"])


# —— Wishlist ——


def list_wishlist(user: User):
    from apps.catalog.services import serialize_products_for_ids

    product_ids = list(user.wishlist_items.values_list("product_id", flat=True))
    return serialize_products_for_ids(product_ids)


def add_to_wishlist(user: User, *, product_id: str):
    from apps.catalog.models import Product

    product = Product.objects.filter(
        id=parse_uuid(product_id, label="محصول"), is_published=True, is_deleted=False
    ).first()
    if not product:
        raise NotFoundError("محصول پیدا نشد.")
    WishlistItem.objects.get_or_create(user=user, product=product)
    return list_wishlist(user)


def remove_from_wishlist(user: User, *, product_id: str):
    WishlistItem.objects.filter(
        user=user, product_id=parse_uuid(product_id, label="محصول")
    ).delete()
    return list_wishlist(user)

from __future__ import annotations

import uuid

from django.db import transaction

from apps.cart.models import Cart, CartLine
from apps.cart.schemas import CartLineOut, CartOut
from apps.catalog.models import ProductVariant
from apps.common.exceptions import NotFoundError, ValidationAppError
from apps.common.utils import parse_uuid

CART_KEY_HEADER = "X-Cart-Key"
MAX_LINE_QUANTITY = 20


def resolve_cart_key(request, *, create: bool = True) -> str:
    header = request.headers.get(CART_KEY_HEADER) or request.META.get("HTTP_X_CART_KEY")
    if header:
        return header.strip()[:64]

    session = getattr(request, "session", None)
    if session is None:
        return ""
    if not session.session_key:
        if create:
            session.create()
        else:
            return ""
    return session.session_key or ""


def get_or_create_cart(request) -> Cart:
    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        cart = Cart.objects.filter(user=user, is_active=True).order_by("-created_at").first()
        if cart:
            return cart
        return Cart.objects.create(user=user, is_active=True, currency="IRR", session_key="")

    cart_key = resolve_cart_key(request, create=True) or uuid.uuid4().hex
    cart, _ = Cart.objects.get_or_create(
        session_key=cart_key,
        is_active=True,
        user=None,
        defaults={"currency": "IRR"},
    )
    return cart


# Kept for import compatibility with existing callers.
_get_or_create_cart = get_or_create_cart


def _available_qty(variant: ProductVariant) -> int:
    stock = getattr(variant, "stock", None)
    if stock is None:
        return 0
    return stock.quantity_available


def _cart_key_for(request, cart: Cart) -> str:
    return cart.session_key or resolve_cart_key(request, create=True)


def serialize_cart(cart: Cart, *, cart_key: str) -> CartOut:
    lines: list[CartLineOut] = []
    subtotal = 0
    item_count = 0
    has_unavailable = False

    queryset = (
        cart.lines.select_related("variant", "variant__product", "variant__stock")
        .prefetch_related("variant__product__images")
        .order_by("created_at")
    )
    for line in queryset:
        variant = line.variant
        line_total = line.unit_price_amount * line.quantity
        subtotal += line_total
        item_count += line.quantity
        available = _available_qty(variant)
        is_available = variant.is_active and not variant.is_deleted and available >= line.quantity
        if not is_available:
            has_unavailable = True
        images = list(variant.product.images.all())
        lines.append(
            CartLineOut(
                id=str(line.id),
                variant_id=str(variant.id),
                product_id=str(variant.product_id),
                product_name=variant.product.name,
                product_slug=variant.product.slug,
                sku=variant.sku,
                size=variant.size,
                color=variant.color,
                image_url=images[0].url if images else None,
                quantity=line.quantity,
                unit_price_amount=line.unit_price_amount,
                line_total_amount=line_total,
                currency=cart.currency,
                quantity_available=available,
                is_available=is_available,
            )
        )

    return CartOut(
        id=str(cart.id),
        cart_key=cart_key or cart.session_key,
        currency=cart.currency,
        lines=lines,
        subtotal_amount=subtotal,
        item_count=item_count,
        has_unavailable_lines=has_unavailable,
    )


def get_current_cart(request) -> CartOut:
    cart = get_or_create_cart(request)
    return serialize_cart(cart, cart_key=_cart_key_for(request, cart))


@transaction.atomic
def add_line(request, *, variant_id: str, quantity: int) -> CartOut:
    if quantity < 1:
        raise ValidationAppError("تعداد باید حداقل ۱ باشد.")

    variant = (
        ProductVariant.objects.filter(
            id=parse_uuid(variant_id, label="Variant"),
            is_active=True,
            is_deleted=False,
            product__is_published=True,
            product__is_deleted=False,
        )
        .select_related("product", "stock")
        .first()
    )
    if not variant:
        raise NotFoundError("این مدل در دسترس نیست.")

    available = _available_qty(variant)
    if available < 1:
        raise ValidationAppError("این مدل موجود نیست.")

    cart = get_or_create_cart(request)
    line, created = CartLine.objects.select_for_update().get_or_create(
        cart=cart,
        variant=variant,
        defaults={"quantity": 0, "unit_price_amount": variant.price_amount},
    )
    requested = line.quantity + quantity
    if requested > available:
        raise ValidationAppError(
            f"فقط {available} عدد از این مدل موجود است.",
            details={"available": available},
        )
    if requested > MAX_LINE_QUANTITY:
        raise ValidationAppError(f"حداکثر {MAX_LINE_QUANTITY} عدد از هر مدل قابل سفارش است.")

    line.quantity = requested
    line.unit_price_amount = variant.price_amount
    line.save(update_fields=["quantity", "unit_price_amount", "updated_at"])
    _ = created
    return serialize_cart(cart, cart_key=_cart_key_for(request, cart))


@transaction.atomic
def update_line(request, *, line_id: str, quantity: int) -> CartOut:
    cart = get_or_create_cart(request)
    line = (
        # `of` keeps the lock off the outer-joined stock row, which Postgres rejects.
        CartLine.objects.select_for_update(of=("self",))
        .filter(id=parse_uuid(line_id, label="Cart line"), cart=cart)
        .select_related("variant", "variant__stock")
        .first()
    )
    if not line:
        raise NotFoundError("این قلم در سبد نیست.")

    if quantity < 1:
        line.delete()
        return serialize_cart(cart, cart_key=_cart_key_for(request, cart))

    if quantity > MAX_LINE_QUANTITY:
        raise ValidationAppError(f"حداکثر {MAX_LINE_QUANTITY} عدد از هر مدل قابل سفارش است.")

    available = _available_qty(line.variant)
    if quantity > available:
        raise ValidationAppError(
            f"فقط {available} عدد از این مدل موجود است.",
            details={"available": available},
        )
    line.quantity = quantity
    line.save(update_fields=["quantity", "updated_at"])
    return serialize_cart(cart, cart_key=_cart_key_for(request, cart))


@transaction.atomic
def remove_line(request, *, line_id: str) -> CartOut:
    cart = get_or_create_cart(request)
    deleted, _ = CartLine.objects.filter(
        id=parse_uuid(line_id, label="Cart line"), cart=cart
    ).delete()
    if not deleted:
        raise NotFoundError("این قلم در سبد نیست.")
    return serialize_cart(cart, cart_key=_cart_key_for(request, cart))


@transaction.atomic
def merge_guest_cart_into_user(request, *, user) -> None:
    """Fold the anonymous cart into the shopper's cart at login.

    Quantities are summed and clamped to what inventory can satisfy so a merge
    never produces an unfulfillable cart.
    """
    cart_key = resolve_cart_key(request, create=False)
    if not cart_key:
        return

    guest_cart = Cart.objects.filter(session_key=cart_key, user=None, is_active=True).first()
    if not guest_cart:
        return

    user_cart = Cart.objects.filter(user=user, is_active=True).order_by("-created_at").first()
    if not user_cart:
        # Adopt the cart and drop the guest key so it can no longer be resolved anonymously.
        guest_cart.user = user
        guest_cart.session_key = ""
        guest_cart.save(update_fields=["user", "session_key", "updated_at"])
        return

    guest_lines = guest_cart.lines.select_related("variant", "variant__stock").all()
    for guest_line in guest_lines:
        available = _available_qty(guest_line.variant)
        target, _ = CartLine.objects.get_or_create(
            cart=user_cart,
            variant=guest_line.variant,
            defaults={"quantity": 0, "unit_price_amount": guest_line.unit_price_amount},
        )
        merged = min(target.quantity + guest_line.quantity, available, MAX_LINE_QUANTITY)
        if merged <= 0:
            target.delete()
            continue
        target.quantity = merged
        target.unit_price_amount = guest_line.unit_price_amount
        target.save(update_fields=["quantity", "unit_price_amount", "updated_at"])

    guest_cart.lines.all().delete()
    guest_cart.is_active = False
    guest_cart.save(update_fields=["is_active", "updated_at"])

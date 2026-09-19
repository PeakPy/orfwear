from __future__ import annotations

import logging

from django.core import signing
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.cart.models import CartLine
from apps.cart.services import get_or_create_cart, resolve_cart_key
from apps.common.exceptions import ConflictError, NotFoundError, ValidationAppError
from apps.common.utils import parse_uuid
from apps.inventory import services as inventory
from apps.orders.models import Order, OrderEvent, OrderLine
from apps.orders.schemas import (
    CheckoutOut,
    OrderAddressOut,
    OrderEventOut,
    OrderLineOut,
    OrderOut,
    PaymentOut,
)
from apps.payments.models import PaymentIntent
from apps.shipping.services import resolve_shipping_method

logger = logging.getLogger(__name__)

ORDER_TOKEN_SALT = "orf-order-access"
ORDER_TOKEN_MAX_AGE = 60 * 60 * 24 * 30

STATUS_NOTES = {
    Order.Status.PENDING_PAYMENT: "سفارش ثبت شد و در انتظار پرداخت است.",
    Order.Status.PAID: "پرداخت تأیید شد.",
    Order.Status.FULFILLING: "سفارش در حال آماده‌سازی است.",
    Order.Status.SHIPPED: "سفارش ارسال شد.",
    Order.Status.COMPLETED: "سفارش تحویل شد.",
    Order.Status.CANCELLED: "سفارش لغو شد.",
}


def issue_order_token(order: Order) -> str:
    return signing.dumps({"oid": str(order.id)}, salt=ORDER_TOKEN_SALT)


def _order_id_from_token(token: str) -> str | None:
    try:
        payload = signing.loads(token, salt=ORDER_TOKEN_SALT, max_age=ORDER_TOKEN_MAX_AGE)
    except signing.BadSignature:
        return None
    return payload.get("oid")


def record_event(order: Order, status: str, *, note: str = "", source: str = "system") -> None:
    OrderEvent.objects.create(
        order=order,
        status=status,
        note=note or STATUS_NOTES.get(status, ""),
        source=source,
    )


def _serialize_order(order: Order) -> OrderOut:
    lines = [
        OrderLineOut(
            id=str(line.id),
            product_name=line.product_name,
            product_slug=line.product_slug,
            sku=line.sku,
            size=line.size,
            color=line.color,
            image_url=line.image_url or None,
            quantity=line.quantity,
            unit_price_amount=line.unit_price_amount,
            line_total_amount=line.unit_price_amount * line.quantity,
        )
        for line in order.lines.all()
    ]
    snapshot = order.shipping_address or {}
    latest_payment = max(
        order.payments.all(),
        key=lambda intent: intent.created_at,
        default=None,
    )
    return OrderOut(
        id=str(order.id),
        reference=order.reference,
        status=order.status,
        currency=order.currency,
        subtotal_amount=order.subtotal_amount,
        shipping_amount=order.shipping_amount,
        discount_amount=order.discount_amount,
        total_amount=order.total_amount,
        shipping_method_title=order.shipping_method_title,
        contact_name=order.contact_name,
        contact_phone=order.contact_phone,
        customer_note=order.customer_note,
        shipping_address=OrderAddressOut(
            full_name=snapshot.get("full_name", ""),
            phone=snapshot.get("phone", ""),
            province=snapshot.get("province", ""),
            city=snapshot.get("city", ""),
            address_line=snapshot.get("address_line", ""),
            postal_code=snapshot.get("postal_code", ""),
        ),
        lines=lines,
        events=[
            OrderEventOut(
                status=event.status,
                note=event.note,
                created_at=event.created_at.isoformat(),
            )
            for event in order.events.all()
        ],
        item_count=sum(line.quantity for line in lines),
        created_at=order.created_at.isoformat() if order.created_at else None,
        paid_at=order.paid_at.isoformat() if order.paid_at else None,
        payment_status=_payment_status(latest_payment),
        payment_intent_id=str(latest_payment.id) if latest_payment else None,
        can_cancel=order.status == Order.Status.PENDING_PAYMENT,
    )


def _payment_status(intent) -> str:
    """Collapse provider intent states into what the storefront needs to render."""
    if intent is None:
        return ""
    if intent.status == PaymentIntent.Status.SUCCEEDED:
        return "succeeded"
    if intent.status in PaymentIntent.TERMINAL_STATUSES:
        return "failed"
    return "pending"


def _load_order(order_id: str) -> Order:
    order = (
        Order.objects.filter(id=parse_uuid(order_id, label="Order"))
        .prefetch_related("lines", "events", "payments")
        .first()
    )
    if not order:
        raise NotFoundError("سفارش پیدا نشد.")
    return order


def _resolve_address(request, payload) -> tuple[dict, str, str]:
    """Return (snapshot, contact_name, contact_phone) for the checkout payload."""
    user = getattr(request, "user", None)
    authenticated = user is not None and getattr(user, "is_authenticated", False)

    if payload.address_id:
        if not authenticated:
            raise ValidationAppError("برای استفاده از آدرس ذخیره‌شده وارد شوید.")
        from apps.users.services import get_address

        address = get_address(user, payload.address_id)
        return address.as_snapshot(), address.full_name, address.phone

    inline = payload.address
    if not inline:
        raise ValidationAppError("نشانی ارسال را وارد کنید.")

    from apps.users.services import _require_phone

    full_name = inline.full_name.strip()
    address_line = inline.address_line.strip()
    if len(full_name) < 2:
        raise ValidationAppError("نام گیرنده را کامل وارد کنید.")
    if len(address_line) < 5:
        raise ValidationAppError("نشانی را کامل وارد کنید.")
    phone = _require_phone(inline.phone)

    snapshot = {
        "full_name": full_name,
        "phone": phone,
        "province": inline.province.strip()[:64],
        "city": inline.city.strip()[:64],
        "address_line": address_line,
        "postal_code": inline.postal_code.strip()[:16],
    }

    if authenticated and payload.save_address:
        from apps.users.models import Address

        Address.objects.get_or_create(
            user=user,
            address_line=address_line,
            postal_code=snapshot["postal_code"],
            defaults={
                "full_name": full_name,
                "phone": phone,
                "province": snapshot["province"],
                "city": snapshot["city"],
                "is_default": not user.addresses.exists(),
            },
        )

    return snapshot, full_name, phone


def _checkout_response(order: Order, *, payment: PaymentOut | None) -> CheckoutOut:
    token = issue_order_token(order)
    return CheckoutOut(
        order=_serialize_order(order),
        payment=payment,
        order_token=token,
        redirect_url=f"/checkout/result?order_id={order.id}&token={token}",
    )


OPEN_PAYMENT_STATUSES = ("requires_action", "processing")


def create_checkout(request, *, payload, idempotency_key: str | None) -> CheckoutOut:
    """Turn the cart into an order, then open a payment attempt for it.

    The gateway call sits outside the reservation transaction on purpose: it is
    remote I/O and must not hold the locks taken while reserving stock.
    """
    from apps.payments.services import get_or_start_payment, serialize_payment

    if not idempotency_key or not idempotency_key.strip():
        raise ValidationAppError("Idempotency-Key header is required.")
    idempotency_key = idempotency_key.strip()[:128]

    order, replayed = _reserve_order(request, payload=payload, idempotency_key=idempotency_key)
    if replayed:
        intent = order.payments.filter(status__in=OPEN_PAYMENT_STATUSES).first()
        return _checkout_response(order, payment=serialize_payment(intent) if intent else None)

    intent = get_or_start_payment(order)

    logger.info(
        "order.created order_id=%s total=%s correlation_id=%s",
        order.id,
        order.total_amount,
        order.correlation_id,
    )

    order = Order.objects.prefetch_related("lines", "events", "payments").get(pk=order.pk)
    return _checkout_response(order, payment=serialize_payment(intent))


@transaction.atomic
def _reserve_order(request, *, payload, idempotency_key: str) -> tuple[Order, bool]:
    """Persist the order and reserve stock. Returns ``(order, replayed)``."""
    existing = (
        Order.objects.filter(idempotency_key=idempotency_key)
        .prefetch_related("lines", "events", "payments")
        .first()
    )
    if existing:
        # Replayed submit: return the original order untouched.
        return existing, True

    method = resolve_shipping_method(payload.shipping_method_code)
    snapshot, contact_name, contact_phone = _resolve_address(request, payload)

    cart = get_or_create_cart(request)
    cart_lines = list(
        # Lock only the cart rows: `variant__stock` is an outer join, which
        # Postgres refuses to lock ("FOR UPDATE cannot be applied to the
        # nullable side of an outer join").
        cart.lines.select_for_update(of=("self",))
        .select_related("variant", "variant__product", "variant__stock")
        .prefetch_related("variant__product__images")
    )
    if not cart_lines:
        raise ValidationAppError("سبد خرید خالی است.")

    subtotal = 0
    for line in cart_lines:
        variant = line.variant
        if not variant.is_active or variant.is_deleted or not variant.product.is_published:
            raise ValidationAppError(f"«{variant.product.name}» دیگر در دسترس نیست.")
        if inventory.available_for(variant.id) < line.quantity:
            raise ValidationAppError(f"موجودی «{variant.product.name}» کافی نیست.")
        subtotal += line.unit_price_amount * line.quantity

    shipping_amount = method.cost_for(subtotal)
    user = getattr(request, "user", None)
    order_user = user if user is not None and getattr(user, "is_authenticated", False) else None

    try:
        order = Order.objects.create(
            user=order_user,
            status=Order.Status.PENDING_PAYMENT,
            currency=cart.currency,
            subtotal_amount=subtotal,
            shipping_amount=shipping_amount,
            discount_amount=0,
            total_amount=subtotal + shipping_amount,
            idempotency_key=idempotency_key,
            correlation_id=getattr(request, "correlation_id", "") or "",
            contact_name=contact_name,
            contact_phone=contact_phone,
            customer_note=(payload.note or "").strip()[:500],
            shipping_address=snapshot,
            shipping_method_code=method.code,
            shipping_method_title=method.title,
        )
    except IntegrityError as exc:
        raced = (
            Order.objects.filter(idempotency_key=idempotency_key)
            .prefetch_related("lines", "events", "payments")
            .first()
        )
        if raced:
            return raced, True
        raise ConflictError("ثبت سفارش ممکن نشد.") from exc

    order_lines = []
    for line in cart_lines:
        variant = line.variant
        images = list(variant.product.images.all())
        order_lines.append(
            OrderLine(
                order=order,
                variant=variant,
                product_name=variant.product.name,
                product_slug=variant.product.slug,
                sku=variant.sku,
                size=variant.size,
                color=variant.color,
                image_url=images[0].url if images else "",
                quantity=line.quantity,
                unit_price_amount=line.unit_price_amount,
            )
        )
    OrderLine.objects.bulk_create(order_lines)

    for line in cart_lines:
        inventory.reserve(line.variant_id, line.quantity)
    order.stock_reserved = True
    order.save(update_fields=["stock_reserved", "updated_at"])

    record_event(order, Order.Status.PENDING_PAYMENT)

    CartLine.objects.filter(cart=cart).delete()
    cart.is_active = False
    cart.save(update_fields=["is_active", "updated_at"])
    resolve_cart_key(request, create=True)

    return order, False


@transaction.atomic
def mark_order_paid(order: Order) -> Order:
    """Idempotent: re-delivered gateway callbacks must not double-commit stock."""
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.status != Order.Status.PENDING_PAYMENT:
        return order

    if order.stock_reserved:
        for line in order.lines.all():
            inventory.commit(line.variant_id, line.quantity)
        order.stock_reserved = False

    order.status = Order.Status.PAID
    order.paid_at = timezone.now()
    order.save(update_fields=["status", "paid_at", "stock_reserved", "updated_at"])
    record_event(order, Order.Status.PAID)
    logger.info("order.paid order_id=%s", order.id)
    return order


@transaction.atomic
def cancel_order(order: Order, *, note: str = "", source: str = "system") -> Order:
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.status in (Order.Status.CANCELLED, Order.Status.COMPLETED):
        return order

    if order.stock_reserved:
        for line in order.lines.all():
            inventory.release(line.variant_id, line.quantity)
        order.stock_reserved = False

    order.status = Order.Status.CANCELLED
    order.cancelled_at = timezone.now()
    order.save(update_fields=["status", "cancelled_at", "stock_reserved", "updated_at"])
    record_event(order, Order.Status.CANCELLED, note=note, source=source)
    logger.info("order.cancelled order_id=%s source=%s", order.id, source)
    return order


def list_user_orders(request) -> list[OrderOut]:
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return []
    orders = Order.objects.filter(user=user).prefetch_related("lines", "events", "payments")[:50]
    return [_serialize_order(o) for o in orders]


def get_user_order(request, order_id: str, *, token: str | None = None) -> OrderOut:
    """Owner-scoped, or guest access via the signed token handed out at checkout."""
    order = _load_order(order_id)
    user = getattr(request, "user", None)

    if user and getattr(user, "is_authenticated", False) and order.user_id == user.pk:
        return _serialize_order(order)

    if token and _order_id_from_token(token) == str(order.id):
        return _serialize_order(order)

    raise NotFoundError("سفارش پیدا نشد.")


def cancel_user_order(request, order_id: str, *, token: str | None = None) -> OrderOut:
    order = _load_order(order_id)
    user = getattr(request, "user", None)
    owns = user and getattr(user, "is_authenticated", False) and order.user_id == user.pk
    if not owns and not (token and _order_id_from_token(token) == str(order.id)):
        raise NotFoundError("سفارش پیدا نشد.")
    if order.status != Order.Status.PENDING_PAYMENT:
        raise ValidationAppError("این سفارش قابل لغو نیست.")
    cancel_order(order, note="لغو توسط مشتری.", source="customer")
    return _serialize_order(_load_order(order_id))

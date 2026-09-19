from __future__ import annotations

import pytest

from apps.cart.services import add_line
from apps.common.exceptions import NotFoundError, ValidationAppError
from apps.inventory.models import StockItem
from apps.orders.models import Order
from apps.orders.schemas import CheckoutAddressIn, CheckoutIn
from apps.orders.services import (
    cancel_user_order,
    create_checkout,
    get_user_order,
    list_user_orders,
    mark_order_paid,
)
from apps.payments.models import PaymentIntent

pytestmark = pytest.mark.django_db


def _address() -> CheckoutAddressIn:
    return CheckoutAddressIn(
        full_name="سارا محمدی",
        phone="09121234567",
        address_line="تهران، خیابان ولیعصر، پلاک ۱۲",
        city="تهران",
        province="تهران",
        postal_code="1234567890",
    )


def _checkout_payload(**overrides) -> CheckoutIn:
    data = {"shipping_method_code": "standard", "address": _address()}
    data.update(overrides)
    return CheckoutIn(**data)


def test_checkout_totals_include_shipping(guest_request, variant, shipping_method):
    request = guest_request("chk-1")
    add_line(request, variant_id=str(variant.id), quantity=2)

    result = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-1")

    subtotal = 2 * variant.price_amount
    assert result.order.subtotal_amount == subtotal
    assert result.order.shipping_amount == shipping_method.price_amount
    assert result.order.total_amount == subtotal + shipping_method.price_amount
    assert result.order.status == Order.Status.PENDING_PAYMENT


def test_checkout_applies_free_shipping_threshold(guest_request, variant, shipping_method):
    request = guest_request("chk-free")
    add_line(request, variant_id=str(variant.id), quantity=5)

    result = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-free")

    assert result.order.subtotal_amount >= shipping_method.free_over_amount
    assert result.order.shipping_amount == 0


def test_checkout_snapshots_address_and_lines(guest_request, variant, shipping_method):
    request = guest_request("chk-2")
    add_line(request, variant_id=str(variant.id), quantity=1)

    result = create_checkout(
        request, payload=_checkout_payload(note="زنگ نزنید"), idempotency_key="key-2"
    )

    assert result.order.shipping_address.city == "تهران"
    assert result.order.shipping_method_title == shipping_method.title
    assert result.order.customer_note == "زنگ نزنید"
    line = result.order.lines[0]
    assert line.size == variant.size
    assert line.color == variant.color
    assert line.image_url == "http://img.test/a.jpg"


def test_checkout_reserves_stock_without_consuming_it(guest_request, variant, shipping_method):
    request = guest_request("chk-3")
    add_line(request, variant_id=str(variant.id), quantity=2)
    create_checkout(request, payload=_checkout_payload(), idempotency_key="key-3")

    stock = StockItem.objects.get(variant=variant)
    assert stock.quantity_on_hand == 5
    assert stock.quantity_reserved == 2
    assert stock.quantity_available == 3


def test_checkout_is_idempotent(guest_request, variant, shipping_method):
    request = guest_request("chk-4")
    add_line(request, variant_id=str(variant.id), quantity=1)

    first = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-4")
    second = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-4")

    assert first.order.id == second.order.id
    assert Order.objects.count() == 1


def test_checkout_requires_idempotency_key(guest_request, variant, shipping_method):
    request = guest_request("chk-5")
    add_line(request, variant_id=str(variant.id), quantity=1)

    with pytest.raises(ValidationAppError):
        create_checkout(request, payload=_checkout_payload(), idempotency_key=None)


def test_checkout_rejects_empty_cart(guest_request, shipping_method):
    with pytest.raises(ValidationAppError):
        create_checkout(
            guest_request("chk-6"), payload=_checkout_payload(), idempotency_key="key-6"
        )


def test_checkout_rejects_unknown_shipping_method(guest_request, variant, shipping_method):
    request = guest_request("chk-7")
    add_line(request, variant_id=str(variant.id), quantity=1)

    with pytest.raises(ValidationAppError):
        create_checkout(
            request,
            payload=_checkout_payload(shipping_method_code="teleport"),
            idempotency_key="key-7",
        )


def test_checkout_rejects_saved_address_for_guest(guest_request, variant, shipping_method):
    request = guest_request("chk-8")
    add_line(request, variant_id=str(variant.id), quantity=1)

    payload = CheckoutIn(
        shipping_method_code="standard", address_id="00000000-0000-0000-0000-000000000000"
    )
    with pytest.raises(ValidationAppError):
        create_checkout(request, payload=payload, idempotency_key="key-8")


def test_paying_commits_reserved_stock(guest_request, variant, shipping_method):
    request = guest_request("chk-9")
    add_line(request, variant_id=str(variant.id), quantity=2)
    result = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-9")

    order = Order.objects.get(pk=result.order.id)
    mark_order_paid(order)

    stock = StockItem.objects.get(variant=variant)
    assert stock.quantity_on_hand == 3
    assert stock.quantity_reserved == 0
    assert Order.objects.get(pk=order.pk).status == Order.Status.PAID


def test_mark_order_paid_is_idempotent(guest_request, variant, shipping_method):
    request = guest_request("chk-10")
    add_line(request, variant_id=str(variant.id), quantity=2)
    result = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-10")

    order = Order.objects.get(pk=result.order.id)
    mark_order_paid(order)
    mark_order_paid(order)

    stock = StockItem.objects.get(variant=variant)
    assert stock.quantity_on_hand == 3
    assert stock.quantity_reserved == 0


def test_cancel_releases_reserved_stock(guest_request, variant, shipping_method):
    request = guest_request("chk-11")
    add_line(request, variant_id=str(variant.id), quantity=2)
    result = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-11")

    cancel_user_order(request, result.order.id, token=result.order_token)

    stock = StockItem.objects.get(variant=variant)
    assert stock.quantity_reserved == 0
    assert stock.quantity_available == 5
    assert Order.objects.get(pk=result.order.id).status == Order.Status.CANCELLED


def test_guest_order_requires_signed_token(guest_request, variant, shipping_method):
    request = guest_request("chk-12")
    add_line(request, variant_id=str(variant.id), quantity=1)
    result = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-12")

    assert get_user_order(request, result.order.id, token=result.order_token).id == result.order.id

    with pytest.raises(NotFoundError):
        get_user_order(request, result.order.id, token=None)
    with pytest.raises(NotFoundError):
        get_user_order(request, result.order.id, token="forged-token")


def test_order_list_is_scoped_to_the_owner(
    user_request, guest_request, variant, shipping_method, customer
):
    request = user_request("chk-13")
    add_line(request, variant_id=str(variant.id), quantity=1)
    create_checkout(request, payload=_checkout_payload(), idempotency_key="key-13")

    assert len(list_user_orders(user_request())) == 1
    assert list_user_orders(guest_request("other")) == []


def test_order_timeline_records_transitions(guest_request, variant, shipping_method):
    request = guest_request("chk-14")
    add_line(request, variant_id=str(variant.id), quantity=1)
    result = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-14")

    mark_order_paid(Order.objects.get(pk=result.order.id))
    order = get_user_order(request, result.order.id, token=result.order_token)

    assert [event.status for event in order.events] == [
        Order.Status.PENDING_PAYMENT,
        Order.Status.PAID,
    ]


def test_order_exposes_latest_payment_state(guest_request, variant, shipping_method):
    """The result page polls the order, so payment progress must ride along with it."""
    request = guest_request("chk-15")
    add_line(request, variant_id=str(variant.id), quantity=1)
    result = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-15")

    pending = get_user_order(request, result.order.id, token=result.order_token)
    assert pending.payment_status == "pending"
    assert pending.payment_intent_id == result.payment.intent_id
    assert pending.can_cancel is True

    mark_order_paid(Order.objects.get(pk=result.order.id))
    PaymentIntent.objects.filter(order_id=result.order.id).update(
        status=PaymentIntent.Status.SUCCEEDED
    )

    paid = get_user_order(request, result.order.id, token=result.order_token)
    assert paid.payment_status == "succeeded"
    assert paid.can_cancel is False


def test_cancelled_payment_reads_as_failed(guest_request, variant, shipping_method):
    request = guest_request("chk-16")
    add_line(request, variant_id=str(variant.id), quantity=1)
    result = create_checkout(request, payload=_checkout_payload(), idempotency_key="key-16")

    PaymentIntent.objects.filter(order_id=result.order.id).update(
        status=PaymentIntent.Status.CANCELLED
    )

    order = get_user_order(request, result.order.id, token=result.order_token)
    assert order.payment_status == "failed"

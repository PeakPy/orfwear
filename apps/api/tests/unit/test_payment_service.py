from __future__ import annotations

import hashlib
import hmac

import pytest
from django.conf import settings

from apps.cart.services import add_line
from apps.common.exceptions import (
    NotFoundError,
    ProviderUnavailableError,
    ValidationAppError,
)
from apps.orders.models import Order
from apps.orders.schemas import CheckoutAddressIn, CheckoutIn
from apps.orders.services import create_checkout
from apps.payments.models import PaymentIntent
from apps.payments.providers.base import ProviderChargeFailed
from apps.payments.providers.local import LocalSandboxProvider, SandboxNotAllowed
from apps.payments.services import (
    complete_sandbox_payment,
    get_or_start_payment,
    handle_provider_callback,
)

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def allow_sandbox(settings):
    settings.PAYMENTS_ALLOW_SANDBOX = True
    settings.PAYMENT_PROVIDER = "apps.payments.providers.local.LocalSandboxProvider"


def _checkout(request, variant, key):
    add_line(request, variant_id=str(variant.id), quantity=1)
    payload = CheckoutIn(
        shipping_method_code="standard",
        address=CheckoutAddressIn(
            full_name="سارا محمدی",
            phone="09121234567",
            address_line="تهران، خیابان ولیعصر، پلاک ۱۲",
        ),
    )
    return create_checkout(request, payload=payload, idempotency_key=key)


def test_checkout_creates_a_payment_intent(guest_request, variant, shipping_method):
    result = _checkout(guest_request("pay-1"), variant, "pay-1")

    assert result.payment is not None
    assert result.payment.provider == "local_sandbox"
    assert result.payment.status == PaymentIntent.Status.REQUIRES_ACTION
    assert result.payment.amount == result.order.total_amount
    assert result.payment.supports_manual_completion is True


def test_open_intent_is_reused(guest_request, variant, shipping_method):
    result = _checkout(guest_request("pay-2"), variant, "pay-2")
    order = Order.objects.get(pk=result.order.id)

    first = get_or_start_payment(order)
    second = get_or_start_payment(order)

    assert first.pk == second.pk
    assert PaymentIntent.objects.filter(order=order).count() == 1


def test_sandbox_success_marks_the_order_paid(guest_request, variant, shipping_method):
    result = _checkout(guest_request("pay-3"), variant, "pay-3")

    settled = complete_sandbox_payment(result.payment.intent_id, succeeded=True)

    assert settled.status == PaymentIntent.Status.SUCCEEDED
    assert Order.objects.get(pk=result.order.id).status == Order.Status.PAID


def test_settling_twice_does_not_change_the_outcome(guest_request, variant, shipping_method):
    result = _checkout(guest_request("pay-4"), variant, "pay-4")

    complete_sandbox_payment(result.payment.intent_id, succeeded=True)
    replay = complete_sandbox_payment(result.payment.intent_id, succeeded=False)

    assert replay.status == PaymentIntent.Status.SUCCEEDED
    assert Order.objects.get(pk=result.order.id).status == Order.Status.PAID


def test_failed_payment_keeps_the_order_payable(guest_request, variant, shipping_method):
    result = _checkout(guest_request("pay-5"), variant, "pay-5")

    settled = complete_sandbox_payment(result.payment.intent_id, succeeded=False)

    assert settled.status == PaymentIntent.Status.FAILED
    assert settled.failure_code
    assert Order.objects.get(pk=result.order.id).status == Order.Status.PENDING_PAYMENT


def test_retry_after_failure_opens_a_new_intent(guest_request, variant, shipping_method):
    result = _checkout(guest_request("pay-6"), variant, "pay-6")
    complete_sandbox_payment(result.payment.intent_id, succeeded=False)

    order = Order.objects.get(pk=result.order.id)
    retry = get_or_start_payment(order)

    assert str(retry.id) != result.payment.intent_id
    assert PaymentIntent.objects.filter(order=order).count() == 2


def test_unknown_intent_is_not_found():
    with pytest.raises(NotFoundError):
        complete_sandbox_payment("00000000-0000-0000-0000-000000000000", succeeded=True)


def test_callback_requires_a_valid_signature(guest_request, variant, shipping_method):
    result = _checkout(guest_request("pay-7"), variant, "pay-7")
    intent = PaymentIntent.objects.get(pk=result.payment.intent_id)

    with pytest.raises(ValidationAppError):
        handle_provider_callback(
            payload={"provider_ref": intent.provider_ref, "succeeded": True},
            headers={"X-Sandbox-Signature": "forged"},
        )
    assert Order.objects.get(pk=result.order.id).status == Order.Status.PENDING_PAYMENT


def test_signed_callback_settles_the_intent(guest_request, variant, shipping_method):
    result = _checkout(guest_request("pay-8"), variant, "pay-8")
    intent = PaymentIntent.objects.get(pk=result.payment.intent_id)
    signature = hmac.new(
        settings.SECRET_KEY.encode(), intent.provider_ref.encode(), hashlib.sha256
    ).hexdigest()

    settled = handle_provider_callback(
        payload={"provider_ref": intent.provider_ref, "succeeded": True},
        headers={"X-Sandbox-Signature": signature},
    )

    assert settled.status == PaymentIntent.Status.SUCCEEDED
    assert Order.objects.get(pk=result.order.id).status == Order.Status.PAID


def test_sandbox_provider_refuses_to_load_when_disabled(settings):
    settings.PAYMENTS_ALLOW_SANDBOX = False
    with pytest.raises(SandboxNotAllowed):
        LocalSandboxProvider()


def test_replayed_callback_leaves_a_settled_intent_alone(
    guest_request, variant, shipping_method, monkeypatch
):
    result = _checkout(guest_request("pay-9"), variant, "pay-9")
    intent = PaymentIntent.objects.get(pk=result.payment.intent_id)
    signature = hmac.new(
        settings.SECRET_KEY.encode(), intent.provider_ref.encode(), hashlib.sha256
    ).hexdigest()
    payload = {"provider_ref": intent.provider_ref, "succeeded": True}
    headers = {"X-Sandbox-Signature": signature}
    handle_provider_callback(payload=payload, headers=headers)

    def fail(**_kwargs):
        raise AssertionError("a settled intent must not be re-verified")

    monkeypatch.setattr(LocalSandboxProvider, "verify_callback", fail)
    replay = handle_provider_callback(payload={**payload, "succeeded": False}, headers=headers)

    assert replay.status == PaymentIntent.Status.SUCCEEDED
    assert Order.objects.get(pk=result.order.id).status == Order.Status.PAID


def test_gateway_failure_keeps_the_order_and_reports_unavailable(
    guest_request, variant, shipping_method, monkeypatch
):
    def refuse(self, charge):
        raise ProviderChargeFailed("down", provider_code="-9")

    monkeypatch.setattr(LocalSandboxProvider, "create_charge", refuse)

    with pytest.raises(ProviderUnavailableError):
        _checkout(guest_request("pay-10"), variant, "pay-10")

    # The order is committed before the gateway is contacted, so it stays payable.
    order = Order.objects.get(idempotency_key="pay-10")
    assert order.status == Order.Status.PENDING_PAYMENT
    assert order.stock_reserved is True
    assert order.payments.count() == 0

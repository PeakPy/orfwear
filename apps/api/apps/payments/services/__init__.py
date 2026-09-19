from __future__ import annotations

import logging

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.common.exceptions import (
    NotFoundError,
    ProviderUnavailableError,
    ValidationAppError,
)
from apps.common.utils import parse_uuid
from apps.orders.models import Order
from apps.orders.schemas import PaymentOut
from apps.payments.models import PaymentIntent
from apps.payments.providers import (
    ChargeRequest,
    ProviderCallbackRejected,
    ProviderChargeFailed,
    get_payment_provider,
)

logger = logging.getLogger(__name__)

CALLBACK_PATH = "/api/v1/payments/callback"


def provider_callback_url() -> str:
    """Absolute URL the gateway returns the shopper to.

    Points at the API rather than the storefront so settlement is verified before
    anything is shown to the shopper.
    """
    base = str(getattr(settings, "PAYMENTS_CALLBACK_BASE_URL", "") or "").rstrip("/")
    return f"{base}{CALLBACK_PATH}"


def storefront_result_url(order_id: str | None) -> str:
    base = str(getattr(settings, "STOREFRONT_BASE_URL", "") or "").rstrip("/")
    if not order_id:
        return f"{base}/checkout/result"
    return f"{base}/checkout/result?order_id={order_id}"


def serialize_payment(intent: PaymentIntent | None) -> PaymentOut | None:
    if intent is None:
        return None
    provider = get_payment_provider()
    return PaymentOut(
        intent_id=str(intent.id),
        provider=intent.provider,
        status=intent.status,
        amount=intent.amount,
        currency=intent.currency,
        redirect_url=intent.redirect_url or None,
        supports_manual_completion=(
            intent.provider == provider.name
            and getattr(provider, "supports_manual_completion", False)
        ),
    )


def get_or_start_payment(order: Order) -> PaymentIntent:
    """Create (or reuse) the payment attempt for an order.

    Deliberately not wrapped in a transaction: it calls the gateway, and a slow
    PSP must not hold the checkout's inventory locks open. Duplicate attempts are
    prevented by the unique ``idempotency_key`` instead, so a retried checkout
    submit or a refreshed result page never charges twice.
    """
    open_intent = (
        PaymentIntent.objects.filter(order=order)
        .exclude(status__in=PaymentIntent.TERMINAL_STATUSES)
        .order_by("-created_at")
        .first()
    )
    if open_intent:
        return open_intent

    provider = get_payment_provider()
    attempt = PaymentIntent.objects.filter(order=order).count() + 1
    idempotency_key = f"order:{order.id}:attempt:{attempt}"

    try:
        result = provider.create_charge(
            ChargeRequest(
                amount=order.total_amount,
                currency=order.currency,
                idempotency_key=idempotency_key,
                order_id=str(order.id),
                return_url=provider_callback_url(),
                metadata={"reference": order.reference, "mobile": order.contact_phone},
            )
        )
    except ProviderChargeFailed as exc:
        logger.warning(
            "payment.charge_failed order_id=%s provider=%s code=%s",
            order.id,
            provider.name,
            exc.provider_code or "unknown",
        )
        raise ProviderUnavailableError(
            "اتصال به درگاه پرداخت برقرار نشد. سفارش ثبت شده و می‌توانید پرداخت را دوباره آغاز کنید."
        ) from exc

    try:
        intent = PaymentIntent.objects.create(
            order=order,
            provider=provider.name,
            provider_ref=result.provider_ref,
            amount=order.total_amount,
            currency=order.currency,
            status=PaymentIntent.Status.REQUIRES_ACTION,
            idempotency_key=idempotency_key,
            redirect_url=result.redirect_url or "",
            raw_response=result.raw,
            correlation_id=order.correlation_id,
        )
    except IntegrityError:
        # Concurrent request already opened this attempt; reuse it.
        raced = PaymentIntent.objects.filter(idempotency_key=idempotency_key).first()
        if raced is None:
            raise
        return raced

    logger.info(
        "payment.intent_created order_id=%s provider=%s attempt=%s",
        order.id,
        provider.name,
        attempt,
    )
    return intent


def get_intent(intent_id: str) -> PaymentIntent:
    intent = (
        PaymentIntent.objects.select_related("order")
        .filter(id=parse_uuid(intent_id, label="Payment"))
        .first()
    )
    if not intent:
        raise NotFoundError("تراکنش پیدا نشد.")
    return intent


@transaction.atomic
def _settle(intent: PaymentIntent, *, succeeded: bool, failure_code: str = "") -> PaymentIntent:
    from apps.orders.services import mark_order_paid, record_event

    intent = PaymentIntent.objects.select_for_update().select_related("order").get(pk=intent.pk)
    if not intent.is_open:
        return intent

    intent.status = PaymentIntent.Status.SUCCEEDED if succeeded else PaymentIntent.Status.FAILED
    intent.failure_code = "" if succeeded else (failure_code or "declined")[:64]
    intent.completed_at = timezone.now()
    intent.save(update_fields=["status", "failure_code", "completed_at", "updated_at"])

    if succeeded:
        mark_order_paid(intent.order)
    else:
        # Keep the order payable so the shopper can retry from the result page.
        record_event(
            intent.order,
            intent.order.status,
            note="پرداخت ناموفق بود.",
            source="payment",
        )
    logger.info(
        "payment.settled intent_id=%s succeeded=%s order_id=%s",
        intent.id,
        succeeded,
        intent.order_id,
    )
    return intent


def complete_sandbox_payment(intent_id: str, *, succeeded: bool) -> PaymentIntent:
    """Client-driven completion. Only ever available on adapters that opt in."""
    intent = get_intent(intent_id)
    provider = get_payment_provider()
    if intent.provider != provider.name or not getattr(
        provider, "supports_manual_completion", False
    ):
        raise ValidationAppError("این تراکنش از تکمیل دستی پشتیبانی نمی‌کند.")
    return _settle(intent, succeeded=succeeded, failure_code="sandbox_declined")


def handle_provider_callback(*, payload: dict, headers: dict) -> PaymentIntent:
    """Settle an attempt from a gateway callback.

    The reference is read first so the amount handed to verification comes from
    our own record, never from the callback. A callback for an already-settled
    attempt is answered from the stored state, which makes replays inert.
    """
    provider = get_payment_provider()
    try:
        provider_ref = provider.read_reference(payload=payload, headers=headers)
    except ProviderCallbackRejected as exc:
        logger.warning("payment.callback_rejected provider=%s reason=reference", provider.name)
        raise ValidationAppError("درخواست نامعتبر است.") from exc

    intent = (
        PaymentIntent.objects.select_related("order")
        .filter(provider=provider.name, provider_ref=provider_ref)
        .first()
    )
    if not intent:
        raise NotFoundError("تراکنش پیدا نشد.")
    if not intent.is_open:
        logger.info("payment.callback_replayed intent_id=%s status=%s", intent.id, intent.status)
        return intent

    try:
        result = provider.verify_callback(payload=payload, headers=headers, amount=intent.amount)
    except ProviderCallbackRejected as exc:
        logger.warning("payment.callback_rejected provider=%s reason=verify", provider.name)
        raise ValidationAppError("درخواست نامعتبر است.") from exc

    return _settle(intent, succeeded=result.succeeded, failure_code="provider_declined")

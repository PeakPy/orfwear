from __future__ import annotations

import httpx
import pytest
from django.core.exceptions import ImproperlyConfigured

from apps.payments.providers.base import (
    ChargeRequest,
    ProviderCallbackRejected,
    ProviderChargeFailed,
)
from apps.payments.providers.zarinpal import ZarinPalProvider

MERCHANT_ID = "00000000-0000-0000-0000-000000000000"
CALLBACK_URL = "https://api.orfwear.ir/api/v1/payments/callback"


@pytest.fixture(autouse=True)
def zarinpal_settings(settings):
    settings.ZARINPAL_MERCHANT_ID = MERCHANT_ID
    settings.ZARINPAL_BASE_URL = "https://payment.zarinpal.com"


@pytest.fixture
def transport(monkeypatch):
    """Capture outbound calls and answer them with canned provider bodies."""
    calls: list[dict] = []
    responses: list[object] = []

    def fake_post(url, *, json=None, data=None, headers=None, timeout, follow_redirects):
        calls.append({"url": url, "json": json, "data": data})
        outcome = responses.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        status, body = outcome
        return httpx.Response(status, json=body, request=httpx.Request("POST", url))

    monkeypatch.setattr("apps.common.http.httpx.post", fake_post)
    monkeypatch.setattr("apps.common.http.time.sleep", lambda _seconds: None)
    return calls, responses


def _charge(amount: int = 1_500_000) -> ChargeRequest:
    return ChargeRequest(
        amount=amount,
        currency="IRR",
        idempotency_key="order:1:attempt:1",
        order_id="ord-1",
        return_url=CALLBACK_URL,
        metadata={"reference": "ORF-1001", "mobile": "09121234567"},
    )


def test_missing_merchant_id_is_a_configuration_error(settings):
    settings.ZARINPAL_MERCHANT_ID = ""
    with pytest.raises(ImproperlyConfigured):
        ZarinPalProvider()


def test_charge_returns_the_startpay_url(transport):
    calls, responses = transport
    responses.append((200, {"data": {"code": 100, "authority": "A0000000001"}, "errors": []}))

    result = ZarinPalProvider().create_charge(_charge())

    assert result.provider_ref == "A0000000001"
    assert result.redirect_url == "https://payment.zarinpal.com/pg/StartPay/A0000000001"
    assert calls[0]["json"]["amount"] == 1_500_000
    assert calls[0]["json"]["callback_url"] == CALLBACK_URL
    # Card/fee details must never be persisted from the provider body.
    assert set(result.raw) == {"code"}


def test_charge_rejects_a_non_https_callback(transport):
    charge = ChargeRequest(
        amount=1000,
        currency="IRR",
        idempotency_key="k",
        order_id="ord-2",
        return_url="http://localhost:8001/api/v1/payments/callback",
    )
    with pytest.raises(ProviderChargeFailed):
        ZarinPalProvider().create_charge(charge)


def test_charge_failure_surfaces_the_provider_code(transport):
    _, responses = transport
    responses.append((200, {"data": [], "errors": {"code": -9, "message": "invalid"}}))

    with pytest.raises(ProviderChargeFailed) as exc:
        ZarinPalProvider().create_charge(_charge())

    assert exc.value.provider_code == "-9"


def test_charge_retries_then_gives_up_when_unreachable(transport):
    calls, responses = transport
    responses.extend(
        [httpx.ConnectTimeout("t"), httpx.ConnectTimeout("t"), httpx.ConnectTimeout("t")]
    )

    with pytest.raises(ProviderChargeFailed):
        ZarinPalProvider().create_charge(_charge())

    assert len(calls) == 3


def test_callback_without_authority_is_rejected():
    with pytest.raises(ProviderCallbackRejected):
        ZarinPalProvider().read_reference(payload={"Status": "OK"}, headers={})


def test_cancelled_callback_is_not_verified(transport):
    calls, _ = transport

    result = ZarinPalProvider().verify_callback(
        payload={"Authority": "A1", "Status": "NOK"}, headers={}, amount=1000
    )

    assert result.succeeded is False
    assert calls == []


def test_verify_uses_our_amount_not_the_callback(transport):
    calls, responses = transport
    responses.append((200, {"data": {"code": 100, "ref_id": 987}, "errors": []}))

    result = ZarinPalProvider().verify_callback(
        payload={"Authority": "A1", "Status": "OK", "amount": "1"}, headers={}, amount=250_000
    )

    assert result.succeeded is True
    assert calls[0]["json"]["amount"] == 250_000
    assert result.raw["ref_id"] == "987"


def test_already_verified_callback_counts_as_paid(transport):
    _, responses = transport
    responses.append((200, {"data": {"code": 101, "ref_id": 5}, "errors": []}))

    result = ZarinPalProvider().verify_callback(
        payload={"Authority": "A1", "Status": "OK"}, headers={}, amount=1000
    )

    assert result.succeeded is True


def test_declined_verification_is_not_paid(transport):
    _, responses = transport
    responses.append((200, {"data": [], "errors": {"code": -51}}))

    result = ZarinPalProvider().verify_callback(
        payload={"Authority": "A1", "Status": "OK"}, headers={}, amount=1000
    )

    assert result.succeeded is False


def test_unreachable_verification_does_not_settle(transport):
    _, responses = transport
    responses.extend([httpx.ReadTimeout("t")] * 3)

    with pytest.raises(ProviderCallbackRejected):
        ZarinPalProvider().verify_callback(
            payload={"Authority": "A1", "Status": "OK"}, headers={}, amount=1000
        )

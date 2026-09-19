from __future__ import annotations

import httpx
import pytest
from django.core.exceptions import ImproperlyConfigured

from apps.users.sms import LocalSmsBackend, NullSmsBackend, mask_phone
from apps.users.sms.kavenegar import KavenegarSmsBackend, SmsDeliveryFailed

API_KEY = "test-key"


@pytest.fixture(autouse=True)
def kavenegar_settings(settings):
    settings.KAVENEGAR_API_KEY = API_KEY
    settings.KAVENEGAR_OTP_TEMPLATE = "orf-login"
    settings.KAVENEGAR_SENDER = ""


@pytest.fixture
def transport(monkeypatch):
    calls: list[dict] = []
    responses: list[object] = []

    def fake_post(url, *, json=None, data=None, headers=None, timeout, follow_redirects):
        calls.append({"url": url, "data": data})
        outcome = responses.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        status, body = outcome
        return httpx.Response(status, json=body, request=httpx.Request("POST", url))

    monkeypatch.setattr("apps.common.http.httpx.post", fake_post)
    monkeypatch.setattr("apps.common.http.time.sleep", lambda _seconds: None)
    return calls, responses


def test_phone_is_masked_to_the_last_four_digits():
    assert mask_phone("09121234567") == "*******4567"


def test_local_backend_renders_the_otp_as_text(caplog):
    with caplog.at_level("INFO"):
        LocalSmsBackend().send_otp(to="09121234567", code="123456")

    messages = " ".join(record.getMessage() for record in caplog.records)
    assert "123456" not in messages
    assert "09121234567" not in messages


def test_null_backend_drops_without_raising():
    NullSmsBackend().send_otp(to="09121234567", code="123456")


def test_missing_credentials_are_a_configuration_error(settings):
    settings.KAVENEGAR_API_KEY = ""
    with pytest.raises(ImproperlyConfigured):
        KavenegarSmsBackend()

    settings.KAVENEGAR_API_KEY = API_KEY
    settings.KAVENEGAR_OTP_TEMPLATE = ""
    with pytest.raises(ImproperlyConfigured):
        KavenegarSmsBackend()


def test_otp_goes_through_the_template_endpoint(transport):
    calls, responses = transport
    responses.append((200, {"return": {"status": 200, "message": "ok"}}))

    KavenegarSmsBackend().send_otp(to="09121234567", code="123456")

    assert calls[0]["url"].endswith("/verify/lookup.json")
    assert calls[0]["data"] == {
        "receptor": "09121234567",
        "token": "123456",
        "template": "orf-login",
    }


def test_provider_rejection_raises(transport):
    _, responses = transport
    responses.append((200, {"return": {"status": 418, "message": "blocked"}}))

    with pytest.raises(SmsDeliveryFailed):
        KavenegarSmsBackend().send_otp(to="09121234567", code="123456")


def test_delivery_is_not_retried(transport):
    calls, responses = transport
    responses.append(httpx.ReadTimeout("t"))

    with pytest.raises(SmsDeliveryFailed):
        KavenegarSmsBackend().send_otp(to="09121234567", code="123456")

    # A resend could invalidate the code the shopper is already reading.
    assert len(calls) == 1


def test_free_text_send_uses_the_configured_sender(transport, settings):
    settings.KAVENEGAR_SENDER = "10004346"
    calls, responses = transport
    responses.append((200, {"return": {"status": 200}}))

    KavenegarSmsBackend().send(to="09121234567", text="سفارش شما ارسال شد.")

    assert calls[0]["url"].endswith("/sms/send.json")
    assert calls[0]["data"]["sender"] == "10004346"

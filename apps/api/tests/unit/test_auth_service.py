from __future__ import annotations

import pytest

from apps.cart.services import add_line, get_current_cart
from apps.common.exceptions import (
    ProviderUnavailableError,
    RateLimitedError,
    ValidationAppError,
)
from apps.common.permissions import load_customer_user_from_token
from apps.users.models import User
from apps.users.services import (
    OTP_MAX_PER_PHONE_PER_HOUR,
    OTP_MAX_VERIFY_ATTEMPTS,
    PHONE_EMAIL_DOMAIN,
    _normalize_phone,
    get_me,
    request_otp,
    update_me,
    verify_otp,
)
from apps.users.sms import LocalSmsBackend

pytestmark = pytest.mark.django_db

PHONE = "09121234567"


@pytest.mark.parametrize(
    "raw",
    [
        "09121234567",
        "+989121234567",
        "0098 9121234567",
        "989121234567",
        "0912-123-4567",
        "۰۹۱۲۱۲۳۴۵۶۷",
    ],
)
def test_phone_normalisation(raw):
    assert _normalize_phone(raw) == PHONE


def test_invalid_phone_is_rejected():
    with pytest.raises(ValidationAppError):
        request_otp(phone="12345")


def test_resend_is_throttled():
    request_otp(phone=PHONE)
    with pytest.raises(RateLimitedError):
        request_otp(phone=PHONE)


def test_hourly_cap_is_enforced(monkeypatch):
    import apps.users.services as svc

    monkeypatch.setattr(svc, "OTP_RESEND_COOLDOWN_SECONDS", 0)
    for _ in range(OTP_MAX_PER_PHONE_PER_HOUR):
        svc.request_otp(phone=PHONE)
    with pytest.raises(RateLimitedError):
        svc.request_otp(phone=PHONE)


def test_verify_creates_the_customer_and_issues_a_token(guest_request):
    code = request_otp(phone=PHONE).debug_code
    result = verify_otp(guest_request(), phone=PHONE, code=code)

    assert result.ok is True
    assert result.access_token
    user = User.objects.get(phone=PHONE)
    assert load_customer_user_from_token(result.access_token) == user


def test_verify_reuses_an_existing_customer(guest_request):
    code = request_otp(phone=PHONE).debug_code
    verify_otp(guest_request(), phone=PHONE, code=code)

    import apps.users.services as svc

    svc.cache.delete(svc._cooldown_key(PHONE))
    code = request_otp(phone=PHONE).debug_code
    verify_otp(guest_request(), phone=PHONE, code=code)

    assert User.objects.filter(phone=PHONE).count() == 1


def test_wrong_code_is_rejected(guest_request):
    request_otp(phone=PHONE)
    with pytest.raises(ValidationAppError):
        verify_otp(guest_request(), phone=PHONE, code="000000")


def test_brute_force_attempts_are_capped(guest_request):
    request_otp(phone=PHONE)
    for _ in range(OTP_MAX_VERIFY_ATTEMPTS):
        with pytest.raises(ValidationAppError):
            verify_otp(guest_request(), phone=PHONE, code="000000")
    with pytest.raises(RateLimitedError):
        verify_otp(guest_request(), phone=PHONE, code="000000")


def test_code_cannot_be_replayed(guest_request):
    code = request_otp(phone=PHONE).debug_code
    verify_otp(guest_request(), phone=PHONE, code=code)
    with pytest.raises(ValidationAppError):
        verify_otp(guest_request(), phone=PHONE, code=code)


def test_login_carries_the_guest_cart_over(guest_request, user_request, variant):
    cart_key = "login-merge"
    add_line(guest_request(cart_key), variant_id=str(variant.id), quantity=2)

    code = request_otp(phone=PHONE).debug_code
    verify_otp(guest_request(cart_key), phone=PHONE, code=code)

    user = User.objects.get(phone=PHONE)
    assert get_current_cart(user_request(user=user)).item_count == 2


def test_debug_code_is_withheld_when_disabled(settings):
    settings.OTP_EXPOSE_DEBUG_CODE = False
    assert request_otp(phone=PHONE).debug_code is None


def test_synthetic_phone_email_is_never_shown_to_the_customer(guest_request):
    code = request_otp(phone=PHONE).debug_code
    verify_otp(guest_request(), phone=PHONE, code=code)
    user = User.objects.get(phone=PHONE)

    assert user.email.endswith(PHONE_EMAIL_DOMAIN)
    assert get_me(user).email == ""
    assert get_me(user).display_name == PHONE


def test_customer_can_set_and_clear_their_email(guest_request):
    code = request_otp(phone=PHONE).debug_code
    verify_otp(guest_request(), phone=PHONE, code=code)
    user = User.objects.get(phone=PHONE)

    assert update_me(user, email="Sara@Example.com").email == "sara@example.com"

    # Clearing hides the address again without freeing the unique column.
    assert update_me(user, email="").email == ""
    user.refresh_from_db()
    assert user.email.endswith(PHONE_EMAIL_DOMAIN)


def test_duplicate_email_is_rejected(guest_request):
    code = request_otp(phone=PHONE).debug_code
    verify_otp(guest_request(), phone=PHONE, code=code)
    first = User.objects.get(phone=PHONE)
    update_me(first, email="taken@example.com")

    other = User.objects.create(phone="09121110000", username="09121110000", email="o@e.com")
    with pytest.raises(ValidationAppError):
        update_me(other, email="taken@example.com")


def test_failed_sms_delivery_is_reported_and_retryable(monkeypatch):
    def refuse(self, *, to, code):
        raise RuntimeError("provider down")

    monkeypatch.setattr(LocalSmsBackend, "send_otp", refuse)

    with pytest.raises(ProviderUnavailableError):
        request_otp(phone=PHONE)

    # Nothing was delivered, so the shopper must not be stuck behind a cooldown.
    monkeypatch.undo()
    assert request_otp(phone=PHONE).ok is True

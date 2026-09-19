"""SMS delivery port.

Keeping delivery behind an interface lets the storefront OTP flow run end to end
locally while a real Iranian provider (Kavenegar/Ghasedak/SMS.ir) is swapped in
via ``SMS_BACKEND`` without touching the auth services.
"""

from __future__ import annotations

import logging
from typing import Protocol

from django.conf import settings
from django.utils.module_loading import import_string

logger = logging.getLogger(__name__)


def mask_phone(phone: str) -> str:
    """Keep only the last 4 digits so logs never carry a full subscriber number."""
    tail = phone[-4:]
    return f"{'*' * max(len(phone) - 4, 0)}{tail}"


OTP_TEXT_TEMPLATE = "کد ورود ORF Wear: {code}"


class SmsBackend(Protocol):
    name: str

    def send(self, *, to: str, text: str) -> None: ...

    def send_otp(self, *, to: str, code: str) -> None:
        """Deliver a login code.

        Separate from ``send`` because Iranian providers require OTP traffic to go
        through an approved pattern/template endpoint rather than free text.
        """
        ...


class PlainTextOtpMixin:
    """Renders the OTP as a normal message. For backends without a template API."""

    def send_otp(self: SmsBackend, *, to: str, code: str) -> None:
        self.send(to=to, text=OTP_TEXT_TEMPLATE.format(code=code))


class LocalSmsBackend(PlainTextOtpMixin):
    """Development backend: records delivery without ever emitting the body.

    OTP codes are surfaced to local clients through the API response instead
    (see ``OTP_EXPOSE_DEBUG_CODE``), so nothing sensitive reaches the log stream.
    """

    name = "local"

    def send(self, *, to: str, text: str) -> None:
        logger.info("sms.send backend=local to=%s length=%d", mask_phone(to), len(text))


class NullSmsBackend(PlainTextOtpMixin):
    """Drops messages. Used when a deployment has no provider configured yet."""

    name = "null"

    def send(self, *, to: str, text: str) -> None:
        logger.warning("sms.dropped backend=null to=%s", mask_phone(to))


def get_sms_backend() -> SmsBackend:
    path = getattr(settings, "SMS_BACKEND", None) or "apps.users.sms.LocalSmsBackend"
    return import_string(path)()

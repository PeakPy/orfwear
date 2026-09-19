"""Kavenegar SMS backend.

OTP codes go through ``verify/lookup``, the template endpoint Iranian operators
require for transactional codes — it is the only path that reaches subscribers
who have blocked advertising traffic. Free-text ``send`` is kept for other
notifications.

The API key travels in the request path, so nothing here logs a URL.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from apps.common.http import ProviderUnavailable, post_json
from apps.users.sms import mask_phone

logger = logging.getLogger(__name__)

BASE_URL = "https://api.kavenegar.com/v1"
STATUS_OK = 200


class SmsDeliveryFailed(RuntimeError):
    """Provider accepted the connection but refused the message."""


class KavenegarSmsBackend:
    name = "kavenegar"

    def __init__(self) -> None:
        self._api_key = str(getattr(settings, "KAVENEGAR_API_KEY", "") or "").strip()
        if not self._api_key:
            raise ImproperlyConfigured("KAVENEGAR_API_KEY is required for the kavenegar backend.")
        self._otp_template = str(getattr(settings, "KAVENEGAR_OTP_TEMPLATE", "") or "").strip()
        if not self._otp_template:
            raise ImproperlyConfigured("KAVENEGAR_OTP_TEMPLATE is required for OTP delivery.")
        self._sender = str(getattr(settings, "KAVENEGAR_SENDER", "") or "").strip()

    def send_otp(self, *, to: str, code: str) -> None:
        self._call(
            "verify/lookup.json",
            {"receptor": to, "token": code, "template": self._otp_template},
            label="kavenegar.verify_lookup",
            to=to,
        )

    def send(self, *, to: str, text: str) -> None:
        params = {"receptor": to, "message": text}
        if self._sender:
            params["sender"] = self._sender
        self._call("sms/send.json", params, label="kavenegar.send", to=to)

    def _call(self, path: str, params: dict[str, str], *, label: str, to: str) -> None:
        try:
            # No retry: a timeout may still have delivered, and a duplicate code
            # would invalidate the one the shopper is reading.
            body = post_json(f"{BASE_URL}/{self._api_key}/{path}", data=params, label=label)
        except ProviderUnavailable as exc:
            logger.warning("sms.unavailable backend=%s to=%s", self.name, mask_phone(to))
            raise SmsDeliveryFailed("SMS provider unreachable.") from exc

        status = body.get("return", {})
        status_code = status.get("status") if isinstance(status, dict) else None
        if status_code != STATUS_OK:
            logger.warning(
                "sms.rejected backend=%s to=%s provider_status=%s",
                self.name,
                mask_phone(to),
                status_code,
            )
            raise SmsDeliveryFailed("SMS provider rejected the message.")

        logger.info("sms.sent backend=%s to=%s", self.name, mask_phone(to))

"""ZarinPal adapter (Payment API v4).

Flow: ``create_charge`` buys an *authority* and hands back the StartPay URL, the
shopper pays on ZarinPal, then the gateway sends them to our callback with
``Authority``/``Status``. ZarinPal does not sign that redirect, so the only
trustworthy confirmation is the server-to-server verify call made here — that is
what makes a forged or replayed callback harmless.

Amounts are passed through as stored (IRR minor unit = Rial); the merchant
account must be configured for the same unit.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from apps.common.http import ProviderUnavailable, post_json
from apps.payments.providers.base import (
    CallbackResult,
    ChargeRequest,
    ProviderCallbackRejected,
    ProviderChargeFailed,
    ProviderChargeResult,
)

logger = logging.getLogger(__name__)

PROVIDER_NAME = "zarinpal"
PRODUCTION_BASE_URL = "https://payment.zarinpal.com"

REQUEST_OK = 100
VERIFY_OK = 100
# 101 means "already verified": a duplicate callback for a settled payment.
VERIFY_ALREADY_DONE = 101


class ZarinPalProvider:
    name = PROVIDER_NAME
    supports_manual_completion = False

    def __init__(self) -> None:
        self._merchant_id = str(getattr(settings, "ZARINPAL_MERCHANT_ID", "") or "").strip()
        if not self._merchant_id:
            raise ImproperlyConfigured(
                "ZARINPAL_MERCHANT_ID is required for the zarinpal provider."
            )
        self._base_url = str(
            getattr(settings, "ZARINPAL_BASE_URL", "") or PRODUCTION_BASE_URL
        ).rstrip("/")

    # —— Charge ——

    def create_charge(self, charge: ChargeRequest) -> ProviderChargeResult:
        if not charge.return_url.startswith("https://"):
            # ZarinPal rejects non-HTTPS callbacks, and so should we.
            raise ProviderChargeFailed("Callback URL must be absolute HTTPS.")

        payload: dict[str, object] = {
            "merchant_id": self._merchant_id,
            "amount": charge.amount,
            "callback_url": charge.return_url,
            "description": self._description(charge),
        }
        mobile = str(charge.metadata.get("mobile") or "")
        if mobile:
            payload["metadata"] = {"mobile": mobile, "order_id": charge.order_id}

        try:
            body = post_json(
                f"{self._base_url}/pg/v4/payment/request.json",
                json=payload,
                label="zarinpal.request",
                retries=2,
            )
        except ProviderUnavailable as exc:
            raise ProviderChargeFailed(str(exc)) from exc

        data = _as_dict(body.get("data"))
        code = _as_int(data.get("code"))
        authority = str(data.get("authority") or "")
        if code != REQUEST_OK or not authority:
            provider_code = str(code if code is not None else _error_code(body))
            logger.warning(
                "payment.charge_rejected provider=%s order_id=%s code=%s",
                self.name,
                charge.order_id,
                provider_code,
            )
            raise ProviderChargeFailed(
                "ZarinPal refused the payment request.", provider_code=provider_code
            )

        logger.info(
            "payment.charge_created provider=%s order_id=%s ref=%s",
            self.name,
            charge.order_id,
            authority,
        )
        return ProviderChargeResult(
            provider_ref=authority,
            status="requires_action",
            redirect_url=f"{self._base_url}/pg/StartPay/{authority}",
            # Card data and fee details are deliberately dropped.
            raw={"code": code},
        )

    # —— Callback ——

    def read_reference(self, *, payload: dict, headers: dict) -> str:
        authority = str(payload.get("Authority") or payload.get("authority") or "").strip()
        if not authority:
            raise ProviderCallbackRejected("Callback is missing an authority.")
        return authority

    def verify_callback(self, *, payload: dict, headers: dict, amount: int) -> CallbackResult:
        authority = self.read_reference(payload=payload, headers=headers)

        status = str(payload.get("Status") or payload.get("status") or "").upper()
        if status != "OK":
            # Shopper cancelled or the bank declined; nothing to verify.
            logger.info("payment.callback_abandoned provider=%s ref=%s", self.name, authority)
            return CallbackResult(provider_ref=authority, succeeded=False, raw={"status": status})

        try:
            body = post_json(
                f"{self._base_url}/pg/v4/payment/verify.json",
                json={
                    "merchant_id": self._merchant_id,
                    "amount": amount,
                    "authority": authority,
                },
                label="zarinpal.verify",
                retries=2,
            )
        except ProviderUnavailable as exc:
            raise ProviderCallbackRejected("Verification call failed.") from exc

        data = _as_dict(body.get("data"))
        code = _as_int(data.get("code"))
        succeeded = code in (VERIFY_OK, VERIFY_ALREADY_DONE)
        logger.info(
            "payment.callback_verified provider=%s ref=%s code=%s succeeded=%s",
            self.name,
            authority,
            code if code is not None else _error_code(body),
            succeeded,
        )
        return CallbackResult(
            provider_ref=authority,
            succeeded=succeeded,
            # ref_id is the shopper-facing receipt number; card_pan/card_hash are not kept.
            raw={"code": code, "ref_id": str(data.get("ref_id") or "")},
        )

    def _description(self, charge: ChargeRequest) -> str:
        reference = str(charge.metadata.get("reference") or charge.order_id)
        return f"ORF Wear — سفارش {reference}"[:255]


def _as_dict(value: object) -> dict:
    return value if isinstance(value, dict) else {}


def _as_int(value: object) -> int | None:
    try:
        return int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


def _error_code(body: dict) -> str:
    """ZarinPal reports failures in ``errors``, which is ``[]`` on success."""
    errors = body.get("errors")
    if isinstance(errors, dict):
        return str(errors.get("code") or "unknown")
    if isinstance(errors, list) and errors and isinstance(errors[0], dict):
        return str(errors[0].get("code") or "unknown")
    return "unknown"

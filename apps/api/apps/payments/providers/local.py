"""Local sandbox payment adapter.

Exists so the storefront checkout can be exercised end to end without gateway
credentials. It never contacts a bank and never claims a real settlement: the
shopper is sent to an in-app confirmation screen that explicitly states the
payment is simulated. Refuses to load outside DEBUG unless a deployment opts in
via ``PAYMENTS_ALLOW_SANDBOX``.
"""

from __future__ import annotations

import hashlib
import hmac
import logging

from django.conf import settings

from apps.payments.providers.base import (
    CallbackResult,
    ChargeRequest,
    ProviderCallbackRejected,
    ProviderChargeResult,
)

logger = logging.getLogger(__name__)

PROVIDER_NAME = "local_sandbox"


class SandboxNotAllowed(RuntimeError):
    pass


def _sandbox_allowed() -> bool:
    return bool(getattr(settings, "PAYMENTS_ALLOW_SANDBOX", settings.DEBUG))


class LocalSandboxProvider:
    name = PROVIDER_NAME
    supports_manual_completion = True

    def __init__(self) -> None:
        if not _sandbox_allowed():
            raise SandboxNotAllowed(
                "local_sandbox payment provider is disabled; configure a real gateway."
            )

    def create_charge(self, charge: ChargeRequest) -> ProviderChargeResult:
        # Deterministic reference keeps retries with the same key idempotent.
        digest = hashlib.sha256(charge.idempotency_key.encode("utf-8")).hexdigest()[:24]
        provider_ref = f"sbx_{digest}"
        logger.info(
            "payment.charge_created provider=%s order_id=%s ref=%s",
            self.name,
            charge.order_id,
            provider_ref,
        )
        return ProviderChargeResult(
            provider_ref=provider_ref,
            status="requires_action",
            redirect_url=None,
            raw={"sandbox": True},
        )

    def read_reference(self, *, payload: dict, headers: dict) -> str:
        provider_ref = str(payload.get("provider_ref") or "")
        if not provider_ref:
            raise ProviderCallbackRejected("Callback is missing a reference.")
        return provider_ref

    def verify_callback(self, *, payload: dict, headers: dict, amount: int) -> CallbackResult:
        provider_ref = str(payload.get("provider_ref") or "")
        signature = str(headers.get("X-Sandbox-Signature") or "")
        expected = hmac.new(
            settings.SECRET_KEY.encode("utf-8"), provider_ref.encode("utf-8"), hashlib.sha256
        ).hexdigest()
        if not provider_ref or not hmac.compare_digest(signature, expected):
            raise ProviderCallbackRejected("Invalid sandbox callback signature.")
        return CallbackResult(
            provider_ref=provider_ref,
            succeeded=bool(payload.get("succeeded")),
            raw={"sandbox": True},
        )

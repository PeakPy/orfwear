from __future__ import annotations

from django.conf import settings
from django.utils.module_loading import import_string

from apps.payments.providers.base import (
    CallbackResult,
    ChargeRequest,
    PaymentProvider,
    ProviderCallbackRejected,
    ProviderChargeFailed,
    ProviderChargeResult,
)

__all__ = [
    "CallbackResult",
    "ChargeRequest",
    "PaymentProvider",
    "ProviderCallbackRejected",
    "ProviderChargeFailed",
    "ProviderChargeResult",
    "get_payment_provider",
]

DEFAULT_PROVIDER_PATH = "apps.payments.providers.local.LocalSandboxProvider"


def get_payment_provider() -> PaymentProvider:
    path = getattr(settings, "PAYMENT_PROVIDER", None) or DEFAULT_PROVIDER_PATH
    return import_string(path)()

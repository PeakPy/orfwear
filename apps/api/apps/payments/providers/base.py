"""Payment provider port.

Every gateway lives behind this interface so orders/checkout never depend on a
specific PSP. Adapters must be idempotent: calling ``create_charge`` twice with
the same ``idempotency_key`` has to return the same provider reference.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class ChargeRequest:
    amount: int
    currency: str
    idempotency_key: str
    order_id: str
    return_url: str
    metadata: dict = field(default_factory=dict)


@dataclass(frozen=True)
class ProviderChargeResult:
    provider_ref: str
    status: str
    redirect_url: str | None = None
    raw: dict = field(default_factory=dict)


@dataclass(frozen=True)
class CallbackResult:
    provider_ref: str
    succeeded: bool
    raw: dict = field(default_factory=dict)


class ProviderCallbackRejected(Exception):
    """Raised when a callback fails signature, replay, or payload checks."""


class ProviderChargeFailed(Exception):
    """Raised when the gateway refuses to open a payment attempt.

    Carries a provider-side code for logs only; it must never reach a client.
    """

    def __init__(self, message: str, *, provider_code: str = "") -> None:
        super().__init__(message)
        self.provider_code = provider_code


class PaymentProvider(Protocol):
    name: str
    #: Sandbox adapters can be completed from the client; real PSPs cannot.
    supports_manual_completion: bool

    def create_charge(self, charge: ChargeRequest) -> ProviderChargeResult: ...

    def read_reference(self, *, payload: dict, headers: dict) -> str:
        """Pull the provider reference out of a raw callback.

        Split from verification so the caller can resolve our own record first
        and feed the trusted amount into ``verify_callback`` instead of echoing
        back whatever the callback claimed.
        """
        ...

    def verify_callback(self, *, payload: dict, headers: dict, amount: int) -> CallbackResult: ...

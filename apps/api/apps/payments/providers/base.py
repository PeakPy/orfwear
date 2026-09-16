"""Payment provider adapters.

Implement each gateway behind this interface so orders/payments stay decoupled.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class ProviderChargeResult:
    provider_ref: str
    status: str
    raw: dict


class PaymentProvider(Protocol):
    name: str

    def create_charge(
        self,
        *,
        amount: int,
        currency: str,
        idempotency_key: str,
        metadata: dict,
    ) -> ProviderChargeResult: ...

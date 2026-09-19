from __future__ import annotations

from ninja import Schema

from apps.payments.models import PaymentIntent


class AdminPaymentOut(Schema):
    id: str
    order_id: str
    provider: str
    provider_ref: str
    amount: int
    currency: str
    status: str
    created_at: str | None = None


def list_admin_payments(*, status: str | None = None) -> list[AdminPaymentOut]:
    qs = PaymentIntent.objects.select_related("order").order_by("-created_at")
    if status:
        qs = qs.filter(status=status)
    return [
        AdminPaymentOut(
            id=str(p.id),
            order_id=str(p.order_id),
            provider=p.provider,
            provider_ref=p.provider_ref,
            amount=p.amount,
            currency=p.currency,
            status=p.status,
            created_at=p.created_at.isoformat() if p.created_at else None,
        )
        for p in qs[:100]
    ]

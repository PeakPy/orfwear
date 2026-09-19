from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from ninja import Schema

User = get_user_model()


class AdminCustomerOut(Schema):
    id: str
    email: str
    username: str
    phone: str
    is_active: bool
    order_count: int = 0
    created_at: str | None = None


def list_customers(*, q: str | None = None) -> list[AdminCustomerOut]:
    qs = (
        User.objects.filter(is_staff=False)
        .annotate(order_count=Count("orders"))
        .order_by("-created_at")
    )
    if q:
        qs = qs.filter(Q(email__icontains=q) | Q(phone__icontains=q) | Q(username__icontains=q))
    return [
        AdminCustomerOut(
            id=str(u.id),
            email=u.email,
            username=u.username,
            phone=u.phone or "",
            is_active=u.is_active,
            order_count=u.order_count or 0,
            created_at=u.created_at.isoformat() if u.created_at else None,
        )
        for u in qs[:100]
    ]

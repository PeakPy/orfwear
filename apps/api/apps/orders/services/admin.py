from __future__ import annotations

from django.db.models import Count, Prefetch

from apps.common.exceptions import NotFoundError, ValidationAppError
from apps.orders.models import Order, OrderLine
from apps.orders.schemas.admin import AdminOrderDetail, AdminOrderLineOut, AdminOrderListItem

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    Order.Status.DRAFT: {Order.Status.PENDING_PAYMENT, Order.Status.CANCELLED},
    Order.Status.PENDING_PAYMENT: {Order.Status.PAID, Order.Status.CANCELLED},
    Order.Status.PAID: {Order.Status.FULFILLING, Order.Status.CANCELLED},
    Order.Status.FULFILLING: {Order.Status.SHIPPED, Order.Status.CANCELLED},
    Order.Status.SHIPPED: {Order.Status.COMPLETED},
    Order.Status.COMPLETED: set(),
    Order.Status.CANCELLED: set(),
}


def _serialize_line(line: OrderLine) -> AdminOrderLineOut:
    return AdminOrderLineOut(
        id=str(line.id),
        product_name=line.product_name,
        sku=line.sku,
        quantity=line.quantity,
        unit_price_amount=line.unit_price_amount,
        line_total_amount=line.unit_price_amount * line.quantity,
    )


def _serialize_list_item(order: Order) -> AdminOrderListItem:
    user = order.user
    return AdminOrderListItem(
        id=str(order.id),
        status=order.status,
        total_amount=order.total_amount,
        currency=order.currency,
        customer_email=user.email if user else None,
        customer_phone=getattr(user, "phone", None) if user else None,
        line_count=getattr(order, "line_count", order.lines.count()),
        created_at=order.created_at.isoformat() if order.created_at else None,
    )


def _serialize_detail(order: Order) -> AdminOrderDetail:
    user = order.user
    return AdminOrderDetail(
        id=str(order.id),
        status=order.status,
        total_amount=order.total_amount,
        currency=order.currency,
        customer_email=user.email if user else None,
        customer_phone=getattr(user, "phone", None) if user else None,
        staff_notes=order.staff_notes or "",
        lines=[_serialize_line(line) for line in order.lines.all()],
        created_at=order.created_at.isoformat() if order.created_at else None,
        updated_at=order.updated_at.isoformat() if order.updated_at else None,
    )


def list_admin_orders(*, status: str | None = None) -> list[AdminOrderListItem]:
    qs = (
        Order.objects.select_related("user")
        .annotate(line_count=Count("lines"))
        .order_by("-created_at")
    )
    if status:
        qs = qs.filter(status=status)
    return [_serialize_list_item(o) for o in qs[:100]]


def get_admin_order(order_id: str) -> AdminOrderDetail:
    order = (
        Order.objects.filter(pk=order_id)
        .select_related("user")
        .prefetch_related(Prefetch("lines", queryset=OrderLine.objects.order_by("created_at")))
        .first()
    )
    if not order:
        raise NotFoundError("Order not found.", details={"order_id": order_id})
    return _serialize_detail(order)


def update_admin_order_status(
    order_id: str, *, status: str, staff_notes: str | None = None
) -> AdminOrderDetail:
    order = (
        Order.objects.filter(pk=order_id).select_related("user").prefetch_related("lines").first()
    )
    if not order:
        raise NotFoundError("Order not found.", details={"order_id": order_id})

    if status not in Order.Status.values:
        raise ValidationAppError("Invalid order status.", details={"status": status})

    allowed = ALLOWED_TRANSITIONS.get(order.status, set())
    if status != order.status and status not in allowed:
        raise ValidationAppError(
            "Illegal status transition.",
            details={"from": order.status, "to": status, "allowed": sorted(allowed)},
        )

    order.status = status
    update_fields = ["status", "updated_at"]
    if staff_notes is not None:
        order.staff_notes = staff_notes
        update_fields.append("staff_notes")
    order.save(update_fields=update_fields)
    return get_admin_order(order_id)

from ninja import Header, Query, Router

from apps.orders.schemas import CheckoutIn, CheckoutOut, OrderOut
from apps.orders.services import (
    cancel_user_order,
    create_checkout,
    get_user_order,
    list_user_orders,
)

router = Router(tags=["orders"])


@router.get("/", response=list[OrderOut], auth=None)
def orders_list(request):
    return list_user_orders(request)


@router.post("/checkout", response=CheckoutOut, auth=None)
def checkout(
    request,
    payload: CheckoutIn,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
):
    return create_checkout(request, payload=payload, idempotency_key=idempotency_key)


@router.get("/{order_id}", response=OrderOut, auth=None)
def order_detail(request, order_id: str, token: str | None = Query(None)):
    return get_user_order(request, order_id, token=token)


@router.post("/{order_id}/cancel", response=OrderOut, auth=None)
def order_cancel(request, order_id: str, token: str | None = Query(None)):
    return cancel_user_order(request, order_id, token=token)

from ninja import Header, Router

from apps.cart.schemas import AddCartLineIn, CartOut, UpdateCartLineIn
from apps.cart.services import add_line, get_current_cart, remove_line, update_line

router = Router(tags=["cart"])


@router.get("/current", response=CartOut, auth=None)
def current_cart(request, x_cart_key: str | None = Header(None, alias="X-Cart-Key")):
    # Header is consumed via request.headers inside the service.
    _ = x_cart_key
    return get_current_cart(request)


@router.post("/lines", response=CartOut, auth=None)
def add_cart_line(
    request, payload: AddCartLineIn, x_cart_key: str | None = Header(None, alias="X-Cart-Key")
):
    _ = x_cart_key
    return add_line(request, variant_id=payload.variant_id, quantity=payload.quantity)


@router.patch("/lines/{line_id}", response=CartOut, auth=None)
def patch_cart_line(
    request,
    line_id: str,
    payload: UpdateCartLineIn,
    x_cart_key: str | None = Header(None, alias="X-Cart-Key"),
):
    _ = x_cart_key
    return update_line(request, line_id=line_id, quantity=payload.quantity)


@router.delete("/lines/{line_id}", response=CartOut, auth=None)
def delete_cart_line(
    request, line_id: str, x_cart_key: str | None = Header(None, alias="X-Cart-Key")
):
    _ = x_cart_key
    return remove_line(request, line_id=line_id)

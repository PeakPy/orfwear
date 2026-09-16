from ninja import Router, Schema

router = Router(tags=["cart"])


class CartOut(Schema):
    id: str | None = None
    currency: str = "IRR"
    lines: list[dict] = []


@router.get("/current", response=CartOut, auth=None)
def current_cart(request):
    # Placeholder until session/auth cart service is implemented.
    return CartOut(id=None, currency="IRR", lines=[])

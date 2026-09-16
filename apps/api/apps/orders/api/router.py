from ninja import Router, Schema

router = Router(tags=["orders"])


class OrderOut(Schema):
    id: str
    status: str
    total_amount: int
    currency: str


@router.get("/", response=list[OrderOut], auth=None)
def list_orders(request):
    return []

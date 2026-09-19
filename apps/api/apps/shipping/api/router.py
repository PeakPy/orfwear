from ninja import Router

from apps.shipping.schemas import ShippingMethodOut
from apps.shipping.services import list_shipping_methods

router = Router(tags=["shipping"])


@router.get("/methods", response=list[ShippingMethodOut], auth=None)
def shipping_methods(request):
    return list_shipping_methods()

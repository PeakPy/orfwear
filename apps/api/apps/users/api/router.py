from ninja import Router

from apps.catalog.schemas import ProductListItem
from apps.common.permissions import customer_auth
from apps.users.schemas import (
    AddressIn,
    AddressOut,
    AddressPatchIn,
    MeOut,
    OtpRequestIn,
    OtpRequestOut,
    OtpVerifyIn,
    OtpVerifyOut,
    UpdateMeIn,
    WishlistAddIn,
)
from apps.users.services import (
    add_to_wishlist,
    create_address,
    delete_address,
    get_me,
    list_addresses,
    list_wishlist,
    remove_from_wishlist,
    request_otp,
    update_address,
    update_me,
    verify_otp,
)

router = Router(tags=["users"])


@router.post("/auth/otp/request", response=OtpRequestOut, auth=None)
def otp_request(request, payload: OtpRequestIn):
    return request_otp(phone=payload.phone)


@router.post("/auth/otp/verify", response=OtpVerifyOut, auth=None)
def otp_verify(request, payload: OtpVerifyIn):
    return verify_otp(request, phone=payload.phone, code=payload.code)


@router.get("/me", response=MeOut, auth=customer_auth)
def me(request):
    return get_me(request.user)


@router.patch("/me", response=MeOut, auth=customer_auth)
def patch_me(request, payload: UpdateMeIn):
    return update_me(
        request.user,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
    )


@router.get("/addresses", response=list[AddressOut], auth=customer_auth)
def addresses_list(request):
    return list_addresses(request.user)


@router.post("/addresses", response=AddressOut, auth=customer_auth)
def address_create(request, payload: AddressIn):
    return create_address(request.user, payload=payload)


@router.patch("/addresses/{address_id}", response=AddressOut, auth=customer_auth)
def address_update(request, address_id: str, payload: AddressPatchIn):
    return update_address(request.user, address_id, payload=payload)


@router.delete("/addresses/{address_id}", response={204: None}, auth=customer_auth)
def address_delete(request, address_id: str):
    delete_address(request.user, address_id)
    return 204, None


@router.get("/wishlist", response=list[ProductListItem], auth=customer_auth)
def wishlist_list(request):
    return list_wishlist(request.user)


@router.post("/wishlist", response=list[ProductListItem], auth=customer_auth)
def wishlist_add(request, payload: WishlistAddIn):
    return add_to_wishlist(request.user, product_id=payload.product_id)


@router.delete("/wishlist/{product_id}", response=list[ProductListItem], auth=customer_auth)
def wishlist_remove(request, product_id: str):
    return remove_from_wishlist(request.user, product_id=product_id)

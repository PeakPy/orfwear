from __future__ import annotations

from ninja import Schema


class MeOut(Schema):
    id: str
    email: str
    username: str
    phone: str = ""
    first_name: str = ""
    last_name: str = ""
    display_name: str = ""


class UpdateMeIn(Schema):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None


class OtpRequestIn(Schema):
    phone: str


class OtpRequestOut(Schema):
    ok: bool
    message: str
    expires_in: int = 0
    retry_after: int = 0
    # Local-only convenience; suppressed unless OTP_EXPOSE_DEBUG_CODE is enabled.
    debug_code: str | None = None


class OtpVerifyIn(Schema):
    phone: str
    code: str


class OtpVerifyOut(Schema):
    ok: bool
    message: str
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 0
    user: MeOut


class AddressIn(Schema):
    full_name: str
    phone: str
    address_line: str
    province: str = ""
    city: str = ""
    postal_code: str = ""
    label: str = ""
    is_default: bool = False


class AddressPatchIn(Schema):
    full_name: str | None = None
    phone: str | None = None
    address_line: str | None = None
    province: str | None = None
    city: str | None = None
    postal_code: str | None = None
    label: str | None = None
    is_default: bool | None = None


class AddressOut(Schema):
    id: str
    full_name: str
    phone: str
    province: str
    city: str
    address_line: str
    postal_code: str
    label: str
    is_default: bool


class WishlistAddIn(Schema):
    product_id: str

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core import signing
from ninja.security import HttpBearer

from apps.common.exceptions import ForbiddenError, UnauthorizedError

STAFF_TOKEN_SALT = "orf-staff-auth"
STAFF_TOKEN_MAX_AGE = 60 * 60 * 12  # 12 hours

CUSTOMER_TOKEN_SALT = "orf-customer-auth"
CUSTOMER_TOKEN_MAX_AGE = 60 * 60 * 24 * 30  # 30 days

User = get_user_model()


def issue_staff_token(user) -> str:
    return signing.dumps({"uid": str(user.pk)}, salt=STAFF_TOKEN_SALT)


def load_staff_user_from_token(token: str):
    try:
        payload = signing.loads(token, salt=STAFF_TOKEN_SALT, max_age=STAFF_TOKEN_MAX_AGE)
    except signing.BadSignature as exc:
        raise UnauthorizedError("Invalid or expired staff token.") from exc

    user = User.objects.filter(pk=payload.get("uid"), is_active=True).first()
    if not user:
        raise UnauthorizedError("Staff user not found.")
    if not user.is_staff:
        raise ForbiddenError("Staff access required.")
    return user


class StaffBearer(HttpBearer):
    """Require Authorization: Bearer <staff-token> for admin routes."""

    def authenticate(self, request, token: str):
        try:
            user = load_staff_user_from_token(token)
        except (UnauthorizedError, ForbiddenError):
            return None
        request.user = user
        return user


staff_auth = StaffBearer()


def issue_customer_token(user) -> str:
    return signing.dumps({"uid": str(user.pk), "typ": "customer"}, salt=CUSTOMER_TOKEN_SALT)


def load_customer_user_from_token(token: str):
    """Resolve a storefront bearer token. Returns None for anything unverifiable."""
    try:
        payload = signing.loads(token, salt=CUSTOMER_TOKEN_SALT, max_age=CUSTOMER_TOKEN_MAX_AGE)
    except signing.BadSignature:
        return None
    if payload.get("typ") != "customer":
        return None
    return User.objects.filter(pk=payload.get("uid"), is_active=True).first()


class CustomerBearer(HttpBearer):
    """Require Authorization: Bearer <customer-token> for account routes."""

    def authenticate(self, request, token: str):
        user = load_customer_user_from_token(token)
        if not user:
            return None
        request.user = user
        return user


customer_auth = CustomerBearer()

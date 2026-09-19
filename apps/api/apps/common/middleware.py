from __future__ import annotations

import logging
import uuid

from django.utils.deprecation import MiddlewareMixin

CORRELATION_HEADER = "X-Correlation-ID"
_logger = logging.getLogger(__name__)


class CorrelationIdMiddleware(MiddlewareMixin):
    def process_request(self, request):
        correlation_id = request.headers.get(CORRELATION_HEADER) or str(uuid.uuid4())
        request.correlation_id = correlation_id
        return None

    def process_response(self, request, response):
        correlation_id = getattr(request, "correlation_id", None)
        if correlation_id:
            response[CORRELATION_HEADER] = correlation_id
        return response


class CustomerTokenMiddleware(MiddlewareMixin):
    """Resolve storefront bearer tokens so optional-auth endpoints see the customer.

    Storefront routes (cart, checkout) must work for guests, so they are declared
    with ``auth=None``. Without this middleware an authenticated shopper would be
    indistinguishable from a guest on those routes. Staff tokens use a different
    signing salt and are intentionally ignored here.
    """

    def process_request(self, request):
        header = request.headers.get("Authorization") or ""
        if not header.startswith("Bearer "):
            return None

        current = getattr(request, "user", None)
        if current is not None and getattr(current, "is_authenticated", False):
            return None

        from apps.common.permissions import load_customer_user_from_token

        user = load_customer_user_from_token(header[7:].strip())
        if user:
            request.user = user
        return None

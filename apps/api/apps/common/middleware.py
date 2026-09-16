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

"""Outbound HTTP for third-party providers.

Adapters call through here so the reliability policy lives in one place: strict
timeouts, a bounded retry budget with backoff, and logging that never carries a
URL or payload (provider credentials travel in both).
"""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT_SECONDS = 8.0
BACKOFF_BASE_SECONDS = 0.4

# Only failures where the provider either never processed the request or asked
# us to slow down are worth repeating.
RETRYABLE_STATUS_CODES = frozenset({429, 500, 502, 503, 504})


class ProviderUnavailable(RuntimeError):
    """Provider could not be reached, or kept failing inside the retry budget."""


def post_json(
    url: str,
    *,
    json: dict[str, Any] | None = None,
    data: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    label: str,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    retries: int = 0,
) -> dict[str, Any]:
    """POST and decode a JSON object response.

    ``retries`` is the number of *extra* attempts; pass 0 for calls that must
    not be repeated (an SMS send), and a small budget for calls that are safe to
    repeat. ``label`` is the only request identifier that reaches the logs.
    """
    last_error: Exception | None = None

    for attempt in range(retries + 1):
        if attempt:
            time.sleep(BACKOFF_BASE_SECONDS * (2 ** (attempt - 1)))
        try:
            response = httpx.post(
                url,
                json=json,
                data=data,
                headers={"Accept": "application/json", **(headers or {})},
                timeout=timeout,
                follow_redirects=False,
            )
        except httpx.HTTPError as exc:
            last_error = exc
            logger.warning(
                "provider.transport_error call=%s attempt=%s error=%s",
                label,
                attempt + 1,
                type(exc).__name__,
            )
            continue

        if response.status_code in RETRYABLE_STATUS_CODES:
            last_error = ProviderUnavailable(f"{label} returned {response.status_code}")
            logger.warning(
                "provider.retryable_status call=%s attempt=%s status=%s",
                label,
                attempt + 1,
                response.status_code,
            )
            continue

        try:
            body = response.json()
        except ValueError as exc:
            logger.warning("provider.invalid_json call=%s status=%s", label, response.status_code)
            raise ProviderUnavailable(f"{label} returned a non-JSON response") from exc

        if not isinstance(body, dict):
            raise ProviderUnavailable(f"{label} returned an unexpected payload shape")

        logger.info("provider.call call=%s status=%s", label, response.status_code)
        return body

    raise ProviderUnavailable(f"{label} is unreachable") from last_error

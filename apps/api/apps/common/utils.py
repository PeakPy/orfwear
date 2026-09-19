from __future__ import annotations

import uuid

from apps.common.exceptions import NotFoundError


def parse_uuid(value: str, *, label: str = "resource") -> uuid.UUID:
    """Reject malformed identifiers before they reach the ORM.

    Passing a non-UUID string into a UUID lookup raises a 500 in Django; this
    keeps path parameters on the safe 404 path instead.
    """
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError) as exc:
        raise NotFoundError(f"{label} not found.") from exc

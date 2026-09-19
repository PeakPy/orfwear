from __future__ import annotations


class AppError(Exception):
    code = "app_error"
    status_code = 400

    def __init__(self, message: str, *, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class NotFoundError(AppError):
    code = "not_found"
    status_code = 404


class ConflictError(AppError):
    code = "conflict"
    status_code = 409


class ValidationAppError(AppError):
    code = "validation_error"
    status_code = 422


class RateLimitedError(AppError):
    code = "rate_limited"
    status_code = 429


class UnauthorizedError(AppError):
    code = "unauthenticated"
    status_code = 401


class ForbiddenError(AppError):
    code = "forbidden"
    status_code = 403


class ProviderUnavailableError(AppError):
    """An upstream provider (gateway, SMS) could not complete the request."""

    code = "provider_unavailable"
    status_code = 503

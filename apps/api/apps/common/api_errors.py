from __future__ import annotations

from ninja.errors import ValidationError

from apps.common.exceptions import AppError


def register_exception_handlers(api) -> None:
    @api.exception_handler(AppError)
    def on_app_error(request, exc: AppError):
        return api.create_response(
            request,
            {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "correlation_id": getattr(request, "correlation_id", None),
            },
            status=exc.status_code,
        )

    @api.exception_handler(ValidationError)
    def on_validation_error(request, exc: ValidationError):
        return api.create_response(
            request,
            {
                "code": "validation_error",
                "message": "Invalid request payload.",
                "details": {"errors": exc.errors},
                "correlation_id": getattr(request, "correlation_id", None),
            },
            status=422,
        )

from __future__ import annotations

# Safer default logger: avoid hard dependency path differences across python-json-logger versions.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "format": "%(asctime)s %(levelname)s [%(correlation_id)s] %(name)s %(message)s",
        }
    },
    "filters": {
        "correlation_id": {
            "()": "apps.common.logging.CorrelationIdFilter",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structured",
            "filters": ["correlation_id"],
        }
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}

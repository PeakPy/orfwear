from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import (  # noqa: F401
    OTP_EXPOSE_DEBUG_CODE,
    PAYMENT_PROVIDER,
    PAYMENTS_ALLOW_SANDBOX,
    REDIS_URL,
    SMS_BACKEND,
)

DEBUG = False

# OTP cooldowns and attempt counters live in the cache, so it has to be shared:
# per-process memory would multiply every limit by the worker count.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "KEY_PREFIX": "orfwear",
    }
}

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Fail the boot rather than silently run a shop that cannot take money or that
# hands out login codes in API responses.
if PAYMENTS_ALLOW_SANDBOX or "providers.local" in PAYMENT_PROVIDER:
    raise ImproperlyConfigured("A real PAYMENT_PROVIDER is required in production.")

if OTP_EXPOSE_DEBUG_CODE:
    raise ImproperlyConfigured("OTP_EXPOSE_DEBUG_CODE must stay off in production.")

if "sms.LocalSmsBackend" in SMS_BACKEND or "sms.NullSmsBackend" in SMS_BACKEND:
    raise ImproperlyConfigured("A real SMS_BACKEND is required in production.")

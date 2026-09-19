from __future__ import annotations

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parents[2]

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, ["localhost"]),
    DJANGO_CORS_ALLOWED_ORIGINS=(list, []),
    DJANGO_CSRF_TRUSTED_ORIGINS=(list, []),
)

environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DJANGO_DEBUG")
ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "apps.common",
    "apps.users",
    "apps.catalog",
    "apps.inventory",
    "apps.cart",
    "apps.orders",
    "apps.payments",
    "apps.shipping",
    "apps.marketing",
    "apps.media",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.common.middleware.CorrelationIdMiddleware",
    "apps.common.middleware.CustomerTokenMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

if env("DATABASE_URL", default=None):
    DATABASES = {"default": env.db("DATABASE_URL")}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB", default="orfwear"),
            "USER": env("POSTGRES_USER", default="orfwear"),
            "PASSWORD": env("POSTGRES_PASSWORD", default="orfwear"),
            "HOST": env("POSTGRES_HOST", default="127.0.0.1"),
            "PORT": env("POSTGRES_PORT", default="5432"),
            "CONN_MAX_AGE": 60,
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fa-ir"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "users.User"

CORS_ALLOWED_ORIGINS = env("DJANGO_CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env("DJANGO_CSRF_TRUSTED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(
    {
        "accept",
        "accept-encoding",
        "authorization",
        "content-type",
        "dnt",
        "origin",
        "user-agent",
        "x-csrftoken",
        "x-requested-with",
        "x-cart-key",
        "idempotency-key",
        "x-correlation-id",
    }
)

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "orfwear-local",
    }
}

REDIS_URL = env("REDIS_URL", default="redis://127.0.0.1:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_ALWAYS_EAGER = False

REST_API_TITLE = "ORF Wear API"
REST_API_VERSION = "1.0.0"

# Storefront OTP delivery. Swap SMS_BACKEND for a real provider adapter in prod.
SMS_BACKEND = env("SMS_BACKEND", default="apps.users.sms.LocalSmsBackend")
# Returning the OTP in the API response is a local-development affordance only.
OTP_EXPOSE_DEBUG_CODE = env("OTP_EXPOSE_DEBUG_CODE", default=DEBUG)

KAVENEGAR_API_KEY = env("KAVENEGAR_API_KEY", default="")
# Approved pattern name; the code is injected as the template's `token`.
KAVENEGAR_OTP_TEMPLATE = env("KAVENEGAR_OTP_TEMPLATE", default="")
KAVENEGAR_SENDER = env("KAVENEGAR_SENDER", default="")

# Payments stay provider-agnostic; the sandbox adapter refuses to load unless allowed.
PAYMENT_PROVIDER = env(
    "PAYMENT_PROVIDER", default="apps.payments.providers.local.LocalSandboxProvider"
)
PAYMENTS_ALLOW_SANDBOX = env("PAYMENTS_ALLOW_SANDBOX", default=DEBUG)

ZARINPAL_MERCHANT_ID = env("ZARINPAL_MERCHANT_ID", default="")
# Point at https://sandbox.zarinpal.com while testing against ZarinPal's sandbox.
ZARINPAL_BASE_URL = env("ZARINPAL_BASE_URL", default="https://payment.zarinpal.com")

PUBLIC_MEDIA_BASE_URL = env("PUBLIC_MEDIA_BASE_URL", default="http://localhost:8001")
# Absolute API origin a gateway returns the shopper to, and the storefront origin
# we hand them back to once settlement is verified.
PAYMENTS_CALLBACK_BASE_URL = env("PAYMENTS_CALLBACK_BASE_URL", default=PUBLIC_MEDIA_BASE_URL)
STOREFRONT_BASE_URL = env("STOREFRONT_BASE_URL", default="http://localhost:3000")

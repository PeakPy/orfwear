from .base import *  # noqa: F403
from .base import env

DEBUG = False
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
CELERY_TASK_ALWAYS_EAGER = True
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# SQLite keeps the default suite fast, but it silently drops row-level locking,
# so `select_for_update` regressions only surface on Postgres. Set
# TEST_ON_POSTGRES=1 (with the dev database running) to run against the real
# engine before releasing checkout or inventory changes.
if env.bool("TEST_ON_POSTGRES", default=False):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB", default="orfwear"),
            "USER": env("POSTGRES_USER", default="orfwear"),
            "PASSWORD": env("POSTGRES_PASSWORD", default="orfwear"),
            "HOST": env("POSTGRES_HOST", default="127.0.0.1"),
            "PORT": env("POSTGRES_PORT", default="5432"),
            "TEST": {"NAME": "orfwear_test"},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

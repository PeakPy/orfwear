from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path

from config.api import api


def healthcheck(_request):
    return JsonResponse({"status": "ok", "service": "orfwear-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", healthcheck, name="healthz"),
    path("api/", api.urls),
]

if settings.DEBUG:
    # Demo catalog imagery is generated into MEDIA_ROOT for local development.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

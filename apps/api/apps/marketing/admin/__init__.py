from django.contrib import admin

from apps.marketing.models import HeroBanner


@admin.register(HeroBanner)
class HeroBannerAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "sort_order", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("title", "subtitle")

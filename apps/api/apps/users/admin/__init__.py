from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.users.models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "username", "is_staff", "is_active", "created_at")
    search_fields = ("email", "username", "phone")
    fieldsets = DjangoUserAdmin.fieldsets + (("Profile", {"fields": ("phone",)}),)

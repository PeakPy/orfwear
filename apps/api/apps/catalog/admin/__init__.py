from django.contrib import admin

from apps.catalog.models import Category, Collection, Product, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "is_deleted")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_published")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "brand", "is_published", "category")
    list_filter = ("is_published", "brand")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug", "brand")
    inlines = [ProductVariantInline]
    filter_horizontal = ("collections",)

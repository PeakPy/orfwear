from __future__ import annotations

from ninja import Query, Router

from apps.catalog.schemas.admin import (
    AdminCategoryIn,
    AdminCategoryOut,
    AdminCollectionIn,
    AdminCollectionOut,
    AdminProductCreateIn,
    AdminProductDetail,
    AdminProductListItem,
    AdminProductUpdateIn,
    AdminVariantIn,
    AdminVariantOut,
    AdminVariantUpdateIn,
)
from apps.catalog.services import admin as catalog_admin
from apps.common.permissions import staff_auth
from apps.common.schemas import (
    ContentPageOut,
    ContentPageUpdateIn,
    DashboardStatsOut,
    StaffLoginIn,
    StaffLoginOut,
    StaffUserOut,
    StoreSettingsIn,
    StoreSettingsOut,
)
from apps.common.services import (
    get_dashboard_stats,
    get_store_settings,
    list_content_pages,
    staff_login,
    update_content_page,
    update_store_settings,
)
from apps.inventory.services import admin as inventory_admin
from apps.marketing.services import admin as marketing_admin
from apps.media.services import admin as media_admin
from apps.orders.schemas.admin import AdminOrderDetail, AdminOrderListItem, AdminOrderStatusIn
from apps.orders.services import admin as orders_admin
from apps.payments.services import admin as payments_admin
from apps.shipping.services import admin as shipping_admin
from apps.users.services import admin as users_admin

router = Router(tags=["admin"])


# ---- Auth (public) ----


@router.post("/auth/login", response=StaffLoginOut, auth=None)
def admin_login(request, payload: StaffLoginIn):
    return staff_login(email=payload.email, password=payload.password)


@router.get("/auth/me", response=StaffUserOut, auth=staff_auth)
def admin_me(request):
    user = request.auth
    display = (user.get_full_name() or "").strip() or (user.username or user.email.split("@")[0])
    return StaffUserOut(
        id=str(user.id),
        email=user.email,
        display_name=display,
        is_staff=bool(user.is_staff),
    )


# ---- Dashboard / settings / content ----


@router.get("/dashboard/stats", response=DashboardStatsOut, auth=staff_auth)
def dashboard_stats(request):
    return get_dashboard_stats()


@router.get("/settings", response=StoreSettingsOut, auth=staff_auth)
def settings_get(request):
    return get_store_settings()


@router.patch("/settings", response=StoreSettingsOut, auth=staff_auth)
def settings_update(request, payload: StoreSettingsIn):
    return update_store_settings(**payload.dict(exclude_unset=True))


@router.get("/content/pages", response=list[ContentPageOut], auth=staff_auth)
def content_pages_list(request):
    return list_content_pages()


@router.patch("/content/pages/{page_id}", response=ContentPageOut, auth=staff_auth)
def content_pages_update(request, page_id: str, payload: ContentPageUpdateIn):
    return update_content_page(page_id, **payload.dict(exclude_unset=True))


# ---- Catalog ----


@router.get("/catalog/products", response=list[AdminProductListItem], auth=staff_auth)
def admin_products_list(request, q: str | None = Query(None)):
    return catalog_admin.list_admin_products(q=q)


@router.post("/catalog/products", response=AdminProductDetail, auth=staff_auth)
def admin_products_create(request, payload: AdminProductCreateIn):
    return catalog_admin.create_admin_product(**payload.dict())


@router.get("/catalog/products/{product_id}", response=AdminProductDetail, auth=staff_auth)
def admin_products_detail(request, product_id: str):
    return catalog_admin.get_admin_product(product_id)


@router.patch("/catalog/products/{product_id}", response=AdminProductDetail, auth=staff_auth)
def admin_products_update(request, product_id: str, payload: AdminProductUpdateIn):
    return catalog_admin.update_admin_product(product_id, **payload.dict(exclude_unset=True))


@router.post("/catalog/products/{product_id}/variants", response=AdminVariantOut, auth=staff_auth)
def admin_variants_create(request, product_id: str, payload: AdminVariantIn):
    return catalog_admin.upsert_admin_variant(product_id, **payload.dict())


@router.patch(
    "/catalog/products/{product_id}/variants/{variant_id}",
    response=AdminVariantOut,
    auth=staff_auth,
)
def admin_variants_update(request, product_id: str, variant_id: str, payload: AdminVariantUpdateIn):
    return catalog_admin.upsert_admin_variant(
        product_id,
        variant_id=variant_id,
        **payload.dict(exclude_unset=True),
    )


@router.delete("/catalog/products/{product_id}/variants/{variant_id}", auth=staff_auth)
def admin_variants_delete(request, product_id: str, variant_id: str):
    catalog_admin.soft_delete_variant(product_id, variant_id)
    return {"ok": True}


@router.get("/catalog/categories", response=list[AdminCategoryOut], auth=staff_auth)
def admin_categories_list(request):
    return catalog_admin.list_admin_categories()


@router.post("/catalog/categories", response=AdminCategoryOut, auth=staff_auth)
def admin_categories_create(request, payload: AdminCategoryIn):
    return catalog_admin.create_category(**payload.dict())


@router.patch("/catalog/categories/{category_id}", response=AdminCategoryOut, auth=staff_auth)
def admin_categories_update(request, category_id: str, payload: AdminCategoryIn):
    return catalog_admin.update_category(category_id, **payload.dict())


@router.delete("/catalog/categories/{category_id}", auth=staff_auth)
def admin_categories_delete(request, category_id: str):
    catalog_admin.delete_category(category_id)
    return {"ok": True}


@router.get("/catalog/collections", response=list[AdminCollectionOut], auth=staff_auth)
def admin_collections_list(request):
    return catalog_admin.list_admin_collections()


@router.post("/catalog/collections", response=AdminCollectionOut, auth=staff_auth)
def admin_collections_create(request, payload: AdminCollectionIn):
    return catalog_admin.create_collection(**payload.dict())


@router.patch("/catalog/collections/{collection_id}", response=AdminCollectionOut, auth=staff_auth)
def admin_collections_update(request, collection_id: str, payload: AdminCollectionIn):
    return catalog_admin.update_collection(collection_id, **payload.dict())


@router.delete("/catalog/collections/{collection_id}", auth=staff_auth)
def admin_collections_delete(request, collection_id: str):
    catalog_admin.delete_collection(collection_id)
    return {"ok": True}


# ---- Inventory ----


@router.get("/inventory", response=list[inventory_admin.AdminStockItemOut], auth=staff_auth)
def admin_inventory_list(
    request,
    q: str | None = Query(None),
    low_only: bool = Query(False),
):
    settings = get_store_settings()
    return inventory_admin.list_stock_items(
        q=q, low_only=low_only, threshold=settings.low_stock_threshold
    )


@router.post(
    "/inventory/{variant_id}/adjust", response=inventory_admin.AdminStockItemOut, auth=staff_auth
)
def admin_inventory_adjust(request, variant_id: str, payload: inventory_admin.AdminStockAdjustIn):
    return inventory_admin.adjust_stock(variant_id, delta=payload.delta, reason=payload.reason)


# ---- Orders ----


@router.get("/orders", response=list[AdminOrderListItem], auth=staff_auth)
def admin_orders_list(request, status: str | None = Query(None)):
    return orders_admin.list_admin_orders(status=status)


@router.get("/orders/{order_id}", response=AdminOrderDetail, auth=staff_auth)
def admin_orders_detail(request, order_id: str):
    return orders_admin.get_admin_order(order_id)


@router.patch("/orders/{order_id}", response=AdminOrderDetail, auth=staff_auth)
def admin_orders_update(request, order_id: str, payload: AdminOrderStatusIn):
    return orders_admin.update_admin_order_status(
        order_id,
        status=payload.status,
        staff_notes=payload.staff_notes,
    )


# ---- Payments / customers / marketing / shipping / media ----


@router.get("/payments", response=list[payments_admin.AdminPaymentOut], auth=staff_auth)
def admin_payments_list(request, status: str | None = Query(None)):
    return payments_admin.list_admin_payments(status=status)


@router.get("/customers", response=list[users_admin.AdminCustomerOut], auth=staff_auth)
def admin_customers_list(request, q: str | None = Query(None)):
    return users_admin.list_customers(q=q)


@router.get("/marketing/banners", response=list[marketing_admin.AdminBannerOut], auth=staff_auth)
def admin_banners_list(request):
    return marketing_admin.list_admin_banners()


@router.post("/marketing/banners", response=marketing_admin.AdminBannerOut, auth=staff_auth)
def admin_banners_create(request, payload: marketing_admin.AdminBannerIn):
    return marketing_admin.create_banner(**payload.dict())


@router.patch(
    "/marketing/banners/{banner_id}", response=marketing_admin.AdminBannerOut, auth=staff_auth
)
def admin_banners_update(request, banner_id: str, payload: marketing_admin.AdminBannerUpdateIn):
    return marketing_admin.update_banner(banner_id, **payload.dict(exclude_unset=True))


@router.delete("/marketing/banners/{banner_id}", auth=staff_auth)
def admin_banners_delete(request, banner_id: str):
    marketing_admin.delete_banner(banner_id)
    return {"ok": True}


@router.get(
    "/shipping/methods", response=list[shipping_admin.AdminShippingMethodOut], auth=staff_auth
)
def admin_shipping_list(request):
    return shipping_admin.list_shipping_methods()


@router.post("/shipping/methods", response=shipping_admin.AdminShippingMethodOut, auth=staff_auth)
def admin_shipping_create(request, payload: shipping_admin.AdminShippingMethodIn):
    return shipping_admin.create_shipping_method(**payload.dict())


@router.patch(
    "/shipping/methods/{method_id}", response=shipping_admin.AdminShippingMethodOut, auth=staff_auth
)
def admin_shipping_update(
    request, method_id: str, payload: shipping_admin.AdminShippingMethodUpdateIn
):
    return shipping_admin.update_shipping_method(method_id, **payload.dict(exclude_unset=True))


@router.get("/media", response=list[media_admin.AdminMediaOut], auth=staff_auth)
def admin_media_list(request):
    return media_admin.list_media_assets()


@router.post("/media/upload", response=media_admin.AdminMediaOut, auth=staff_auth)
def admin_media_upload(request, payload: media_admin.AdminMediaUploadIn):
    return media_admin.stub_upload_media(**payload.dict())

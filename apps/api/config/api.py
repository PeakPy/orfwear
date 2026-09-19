from django.conf import settings
from ninja import NinjaAPI

from apps.cart.api.router import router as cart_router
from apps.catalog.api.router import router as catalog_router
from apps.common.api.admin_router import router as admin_router
from apps.common.api_errors import register_exception_handlers
from apps.marketing.api.router import router as marketing_router
from apps.orders.api.router import router as orders_router
from apps.payments.api.router import router as payments_router
from apps.shipping.api.router import router as shipping_router
from apps.users.api.router import router as users_router

api = NinjaAPI(
    title=settings.REST_API_TITLE,
    version=settings.REST_API_VERSION,
    urls_namespace="api",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

register_exception_handlers(api)

api.add_router("/v1/users", users_router)
api.add_router("/v1/catalog", catalog_router)
api.add_router("/v1/cart", cart_router)
api.add_router("/v1/orders", orders_router)
api.add_router("/v1/payments", payments_router)
api.add_router("/v1/shipping", shipping_router)
api.add_router("/v1/marketing", marketing_router)
api.add_router("/v1/admin", admin_router)

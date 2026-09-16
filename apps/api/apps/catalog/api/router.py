from ninja import Router, Schema

from apps.catalog.models import Product
from apps.common.exceptions import AppError

router = Router(tags=["catalog"])


class ProductListItem(Schema):
    id: str
    name: str
    slug: str
    brand: str


class NotFoundError(AppError):
    code = "not_found"
    status_code = 404


@router.get("/products", response=list[ProductListItem], auth=None)
def list_products(request):
    products = Product.objects.filter(is_published=True, is_deleted=False).order_by("-created_at")[:50]
    return [
        ProductListItem(id=str(p.id), name=p.name, slug=p.slug, brand=p.brand)
        for p in products
    ]


@router.get("/products/{slug}", response=ProductListItem, auth=None)
def get_product(request, slug: str):
    product = Product.objects.filter(slug=slug, is_published=True, is_deleted=False).first()
    if not product:
        raise NotFoundError("Product not found.", details={"slug": slug})
    return ProductListItem(
        id=str(product.id),
        name=product.name,
        slug=product.slug,
        brand=product.brand,
    )

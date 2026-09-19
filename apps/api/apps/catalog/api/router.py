from ninja import Query, Router

from apps.catalog.schemas import (
    CatalogFacets,
    CategoryOut,
    CollectionDetail,
    CollectionListItem,
    ProductDetail,
    ProductPage,
)
from apps.catalog.services import (
    get_collection_by_slug,
    get_facets,
    get_product_by_slug,
    list_categories,
    list_collections,
    list_products,
)

router = Router(tags=["catalog"])


@router.get("/products", response=ProductPage, auth=None)
def products_list(
    request,
    q: str | None = Query(None),
    collection: str | None = Query(None),
    category: str | None = Query(None),
    audience: str | None = Query(None),
    sizes: str | None = Query(None),
    colors: str | None = Query(None),
    min_price: int | None = Query(None),
    max_price: int | None = Query(None),
    in_stock: bool = Query(False),
    sort: str | None = Query(None),
    page: int = Query(1),
    page_size: int = Query(12),
):
    return list_products(
        q=q,
        collection_slug=collection,
        category=category,
        audience=audience,
        sizes=sizes,
        colors=colors,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get("/facets", response=CatalogFacets, auth=None)
def catalog_facets(
    request,
    collection: str | None = Query(None),
    category: str | None = Query(None),
):
    return get_facets(collection_slug=collection, category=category)


@router.get("/categories", response=list[CategoryOut], auth=None)
def categories_list(request):
    return list_categories()


@router.get("/products/{slug}", response=ProductDetail, auth=None)
def product_detail(request, slug: str):
    return get_product_by_slug(slug)


@router.get("/collections", response=list[CollectionListItem], auth=None)
def collections_list(request):
    return list_collections()


@router.get("/collections/{slug}", response=CollectionDetail, auth=None)
def collection_detail(request, slug: str):
    return get_collection_by_slug(slug)

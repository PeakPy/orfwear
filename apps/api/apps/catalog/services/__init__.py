from __future__ import annotations

from django.db.models import Count, F, Max, Min, Prefetch, Q

from apps.catalog.models import Category, Collection, Product, ProductImage, ProductVariant
from apps.catalog.schemas import (
    CatalogFacets,
    CategoryOut,
    CollectionDetail,
    CollectionListItem,
    FacetValue,
    ProductDetail,
    ProductImageOut,
    ProductListItem,
    ProductPage,
    VariantOut,
)
from apps.common.exceptions import NotFoundError

MAX_PAGE_SIZE = 48
DEFAULT_PAGE_SIZE = 12

SORT_OPTIONS = {
    "newest": ["-created_at"],
    "price_asc": ["min_price_amount", "-created_at"],
    "price_desc": ["-min_price_amount", "-created_at"],
    "name": ["name"],
}


def _published_products():
    return Product.objects.filter(is_published=True, is_deleted=False)


def _variant_prefetch(*, active_only: bool = True) -> Prefetch:
    qs = ProductVariant.objects.filter(is_deleted=False).select_related("stock")
    if active_only:
        qs = qs.filter(is_active=True)
    return Prefetch("variants", queryset=qs.order_by("color", "size"), to_attr="visible_variants")


def _image_prefetch() -> Prefetch:
    return Prefetch(
        "images",
        queryset=ProductImage.objects.order_by("position", "created_at"),
        to_attr="ordered_images",
    )


def _with_catalog_relations(qs):
    return qs.select_related("category").prefetch_related(_variant_prefetch(), _image_prefetch())


def _variant_available(variant: ProductVariant) -> int:
    stock = getattr(variant, "stock", None)
    if stock is None:
        return 0
    return stock.quantity_available


def _serialize_variant(variant: ProductVariant) -> VariantOut:
    return VariantOut(
        id=str(variant.id),
        sku=variant.sku,
        size=variant.size,
        color=variant.color,
        price_amount=variant.price_amount,
        currency=variant.currency,
        is_active=variant.is_active,
        quantity_available=_variant_available(variant),
    )


def _variants_of(product: Product) -> list[ProductVariant]:
    cached = getattr(product, "visible_variants", None)
    if cached is not None:
        return cached
    return [v for v in product.variants.all() if v.is_active and not v.is_deleted]


def _images_of(product: Product) -> list[ProductImage]:
    cached = getattr(product, "ordered_images", None)
    if cached is not None:
        return cached
    return list(product.images.all())


SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"]


def _dedupe(values) -> list[str]:
    seen: dict[str, None] = {}
    for value in values:
        if value:
            seen.setdefault(value, None)
    return list(seen)


def size_sort_key(size: str) -> tuple[int, float, str]:
    """Letter sizes follow the garment scale; numeric sizes sort numerically."""
    upper = size.upper()
    if upper in SIZE_ORDER:
        return (0, SIZE_ORDER.index(upper), "")
    try:
        return (1, float(size), "")
    except ValueError:
        return (2, 0.0, size)


def _sorted_sizes(values) -> list[str]:
    return sorted(_dedupe(values), key=size_sort_key)


def _serialize_product_list_item(product: Product) -> ProductListItem:
    variants = _variants_of(product)
    images = _images_of(product)
    prices = [v.price_amount for v in variants]
    return ProductListItem(
        id=str(product.id),
        name=product.name,
        slug=product.slug,
        brand=product.brand,
        description=product.description,
        min_price_amount=min(prices) if prices else None,
        currency=variants[0].currency if variants else "IRR",
        image_url=images[0].url if images else None,
        audience=product.audience,
        category_slug=product.category.slug if product.category_id else None,
        colors=_dedupe(v.color for v in variants),
        sizes=_sorted_sizes(v.size for v in variants),
        in_stock=any(_variant_available(v) > 0 for v in variants),
    )


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split(",") if part.strip()]


def list_products(
    *,
    q: str | None = None,
    collection_slug: str | None = None,
    category: str | None = None,
    audience: str | None = None,
    sizes: str | None = None,
    colors: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    sort: str | None = None,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
    in_stock_only: bool = False,
) -> ProductPage:
    qs = _published_products()

    if q:
        qs = qs.filter(
            Q(name__icontains=q)
            | Q(slug__icontains=q)
            | Q(brand__icontains=q)
            | Q(description__icontains=q)
            | Q(category__name__icontains=q)
        )
    if collection_slug:
        qs = qs.filter(
            collections__slug=collection_slug,
            collections__is_published=True,
            collections__is_deleted=False,
        )
    if category:
        qs = qs.filter(category__slug=category)
    if audience and audience != "all":
        qs = qs.filter(Q(audience=audience) | Q(audience=Product.Audience.UNISEX))

    size_list = _split_csv(sizes)
    if size_list:
        qs = qs.filter(
            variants__size__in=size_list, variants__is_active=True, variants__is_deleted=False
        )
    color_list = _split_csv(colors)
    if color_list:
        qs = qs.filter(
            variants__color__in=color_list, variants__is_active=True, variants__is_deleted=False
        )

    active_variant = Q(variants__is_active=True, variants__is_deleted=False)
    qs = qs.annotate(min_price_amount=Min("variants__price_amount", filter=active_variant))

    if min_price is not None:
        qs = qs.filter(min_price_amount__gte=min_price)
    if max_price is not None:
        qs = qs.filter(min_price_amount__lte=max_price)
    if in_stock_only:
        qs = qs.filter(
            variants__is_active=True,
            variants__is_deleted=False,
            variants__stock__quantity_on_hand__gt=F("variants__stock__quantity_reserved"),
        )

    order_by = SORT_OPTIONS.get(sort or "newest", SORT_OPTIONS["newest"])
    qs = qs.distinct().order_by(*order_by)

    page = max(int(page or 1), 1)
    page_size = min(max(int(page_size or DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE)
    total = qs.count()
    offset = (page - 1) * page_size
    products = _with_catalog_relations(qs)[offset : offset + page_size]

    items = [_serialize_product_list_item(p) for p in products]
    return ProductPage(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        has_next=offset + len(items) < total,
    )


def serialize_products_for_ids(product_ids) -> list[ProductListItem]:
    """Preserve the caller's ordering (used by the wishlist)."""
    if not product_ids:
        return []
    ordered = list(product_ids)
    products = _with_catalog_relations(_published_products().filter(id__in=ordered))
    by_id = {str(p.id): p for p in products}
    return [_serialize_product_list_item(by_id[str(pid)]) for pid in ordered if str(pid) in by_id]


def get_product_by_slug(slug: str) -> ProductDetail:
    product = _with_catalog_relations(_published_products().filter(slug=slug)).first()
    if not product:
        raise NotFoundError("Product not found.", details={"slug": slug})

    variants = sorted(_variants_of(product), key=lambda v: (v.color, size_sort_key(v.size)))
    images = _images_of(product)
    prices = [v.price_amount for v in variants]

    related_qs = _published_products().exclude(pk=product.pk)
    if product.category_id:
        related_qs = related_qs.filter(category_id=product.category_id)
    related = _with_catalog_relations(related_qs.order_by("-created_at"))[:6]

    return ProductDetail(
        id=str(product.id),
        name=product.name,
        slug=product.slug,
        brand=product.brand,
        description=product.description,
        audience=product.audience,
        material=product.material,
        care=product.care,
        category_slug=product.category.slug if product.category_id else None,
        category_name=product.category.name if product.category_id else None,
        variants=[_serialize_variant(v) for v in variants],
        images=[
            ProductImageOut(url=img.url, alt=img.alt_text or product.name, color=img.color)
            for img in images
        ],
        image_url=images[0].url if images else None,
        min_price_amount=min(prices) if prices else None,
        currency=variants[0].currency if variants else "IRR",
        in_stock=any(_variant_available(v) > 0 for v in variants),
        collections=[
            c.slug for c in product.collections.filter(is_published=True, is_deleted=False)
        ],
        related=[_serialize_product_list_item(p) for p in related],
    )


def get_facets(*, collection_slug: str | None = None, category: str | None = None) -> CatalogFacets:
    """Facet values for the storefront filter sheet, scoped to the active context."""
    qs = _published_products()
    if collection_slug:
        qs = qs.filter(collections__slug=collection_slug, collections__is_published=True)
    if category:
        qs = qs.filter(category__slug=category)

    variant_qs = ProductVariant.objects.filter(
        is_active=True, is_deleted=False, product__in=qs.values("pk")
    )

    sizes = sorted(
        variant_qs.exclude(size="").values("size").annotate(count=Count("product", distinct=True)),
        key=lambda row: size_sort_key(row["size"]),
    )
    colors = (
        variant_qs.exclude(color="")
        .values("color")
        .annotate(count=Count("product", distinct=True))
        .order_by("color")
    )
    bounds = variant_qs.aggregate(low=Min("price_amount"), high=Max("price_amount"))

    categories = (
        Category.objects.filter(is_deleted=False, product__in=qs.values("pk"))
        .annotate(count=Count("product", distinct=True))
        .order_by("name")
        .distinct()
    )
    collections = (
        Collection.objects.filter(is_published=True, is_deleted=False, products__in=qs.values("pk"))
        .annotate(count=Count("products", distinct=True))
        .order_by("name")
        .distinct()
    )

    return CatalogFacets(
        categories=[FacetValue(value=c.slug, label=c.name, count=c.count) for c in categories],
        collections=[FacetValue(value=c.slug, label=c.name, count=c.count) for c in collections],
        sizes=[FacetValue(value=s["size"], label=s["size"], count=s["count"]) for s in sizes],
        colors=[FacetValue(value=c["color"], label=c["color"], count=c["count"]) for c in colors],
        price_min=bounds["low"] or 0,
        price_max=bounds["high"] or 0,
    )


def list_categories() -> list[CategoryOut]:
    categories = (
        Category.objects.filter(is_deleted=False)
        .annotate(
            count=Count("product", filter=Q(product__is_published=True, product__is_deleted=False))
        )
        .order_by("name")
    )
    return [
        CategoryOut(id=str(c.id), name=c.name, slug=c.slug, product_count=c.count)
        for c in categories
        if c.count
    ]


def _collection_cover(collection: Collection) -> str | None:
    image = (
        ProductImage.objects.filter(
            product__collections=collection,
            product__is_published=True,
            product__is_deleted=False,
        )
        .order_by("position", "created_at")
        .values_list("url", flat=True)
        .first()
    )
    return image


def list_collections() -> list[CollectionListItem]:
    collections = (
        Collection.objects.filter(is_published=True, is_deleted=False)
        .annotate(
            count=Count(
                "products",
                filter=Q(products__is_published=True, products__is_deleted=False),
                distinct=True,
            )
        )
        .order_by("name")
    )
    return [
        CollectionListItem(
            id=str(c.id),
            name=c.name,
            slug=c.slug,
            description=c.description,
            image_url=_collection_cover(c),
            product_count=c.count,
        )
        for c in collections
    ]


def get_collection_by_slug(slug: str) -> CollectionDetail:
    collection = Collection.objects.filter(slug=slug, is_published=True, is_deleted=False).first()
    if not collection:
        raise NotFoundError("Collection not found.", details={"slug": slug})

    products = _with_catalog_relations(
        _published_products().filter(collections=collection).order_by("-created_at")
    )
    return CollectionDetail(
        id=str(collection.id),
        name=collection.name,
        slug=collection.slug,
        description=collection.description,
        image_url=_collection_cover(collection),
        products=[_serialize_product_list_item(p) for p in products],
    )

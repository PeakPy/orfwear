from __future__ import annotations

from django.db import transaction
from django.db.models import Count, Min, Prefetch, Q
from django.utils import timezone
from django.utils.text import slugify

from apps.catalog.models import Category, Collection, Product, ProductVariant
from apps.catalog.schemas.admin import (
    AdminCategoryOut,
    AdminCollectionOut,
    AdminProductDetail,
    AdminProductListItem,
    AdminVariantOut,
)
from apps.common.exceptions import ConflictError, NotFoundError, ValidationAppError
from apps.inventory.models import StockItem


def _serialize_category(cat: Category) -> AdminCategoryOut:
    return AdminCategoryOut(
        id=str(cat.id),
        name=cat.name,
        slug=cat.slug,
        parent_id=str(cat.parent_id) if cat.parent_id else None,
    )


def list_admin_categories() -> list[AdminCategoryOut]:
    cats = Category.objects.filter(is_deleted=False).order_by("name")
    return [_serialize_category(c) for c in cats]


def create_category(*, name: str, slug: str, parent_id: str | None = None) -> AdminCategoryOut:
    slug = slugify(slug, allow_unicode=True) or slugify(name, allow_unicode=True)
    if not slug:
        raise ValidationAppError("Valid slug is required.")
    if Category.objects.filter(slug=slug, is_deleted=False).exists():
        raise ConflictError("Category slug already exists.", details={"slug": slug})
    parent = None
    if parent_id:
        parent = Category.objects.filter(pk=parent_id, is_deleted=False).first()
        if not parent:
            raise NotFoundError("Parent category not found.")
    cat = Category.objects.create(name=name.strip(), slug=slug, parent=parent)
    return _serialize_category(cat)


def update_category(category_id: str, **fields) -> AdminCategoryOut:
    cat = Category.objects.filter(pk=category_id, is_deleted=False).first()
    if not cat:
        raise NotFoundError("Category not found.", details={"id": category_id})
    if "name" in fields and fields["name"] is not None:
        cat.name = fields["name"].strip()
    if "slug" in fields and fields["slug"] is not None:
        new_slug = slugify(fields["slug"], allow_unicode=True)
        if Category.objects.filter(slug=new_slug, is_deleted=False).exclude(pk=cat.pk).exists():
            raise ConflictError("Category slug already exists.", details={"slug": new_slug})
        cat.slug = new_slug
    if "parent_id" in fields:
        parent_id = fields["parent_id"]
        if parent_id is None:
            cat.parent = None
        else:
            parent = Category.objects.filter(pk=parent_id, is_deleted=False).first()
            if not parent:
                raise NotFoundError("Parent category not found.")
            if str(parent.pk) == str(cat.pk):
                raise ValidationAppError("Category cannot be its own parent.")
            cat.parent = parent
    cat.save()
    return _serialize_category(cat)


def delete_category(category_id: str) -> None:
    cat = Category.objects.filter(pk=category_id, is_deleted=False).first()
    if not cat:
        raise NotFoundError("Category not found.", details={"id": category_id})
    cat.is_deleted = True
    cat.deleted_at = timezone.now()
    cat.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


def _serialize_collection(col: Collection) -> AdminCollectionOut:
    return AdminCollectionOut(
        id=str(col.id),
        name=col.name,
        slug=col.slug,
        description=col.description,
        is_published=col.is_published,
    )


def list_admin_collections() -> list[AdminCollectionOut]:
    cols = Collection.objects.filter(is_deleted=False).order_by("name")
    return [_serialize_collection(c) for c in cols]


def create_collection(
    *, name: str, slug: str, description: str = "", is_published: bool = False
) -> AdminCollectionOut:
    slug = slugify(slug, allow_unicode=True) or slugify(name, allow_unicode=True)
    if not slug:
        raise ValidationAppError("Valid slug is required.")
    if Collection.objects.filter(slug=slug, is_deleted=False).exists():
        raise ConflictError("Collection slug already exists.", details={"slug": slug})
    col = Collection.objects.create(
        name=name.strip(),
        slug=slug,
        description=description or "",
        is_published=is_published,
    )
    return _serialize_collection(col)


def update_collection(collection_id: str, **fields) -> AdminCollectionOut:
    col = Collection.objects.filter(pk=collection_id, is_deleted=False).first()
    if not col:
        raise NotFoundError("Collection not found.", details={"id": collection_id})
    for key in ("name", "description", "is_published"):
        if key in fields and fields[key] is not None:
            setattr(col, key, fields[key].strip() if key == "name" else fields[key])
    if fields.get("slug") is not None:
        new_slug = slugify(fields["slug"], allow_unicode=True)
        if Collection.objects.filter(slug=new_slug, is_deleted=False).exclude(pk=col.pk).exists():
            raise ConflictError("Collection slug already exists.", details={"slug": new_slug})
        col.slug = new_slug
    col.save()
    return _serialize_collection(col)


def delete_collection(collection_id: str) -> None:
    col = Collection.objects.filter(pk=collection_id, is_deleted=False).first()
    if not col:
        raise NotFoundError("Collection not found.", details={"id": collection_id})
    col.is_deleted = True
    col.deleted_at = timezone.now()
    col.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


def _variant_stock(variant: ProductVariant) -> tuple[int, int, int]:
    stock = getattr(variant, "stock", None)
    if stock is None:
        return 0, 0, 0
    return stock.quantity_on_hand, stock.quantity_reserved, stock.quantity_available


def _serialize_variant(variant: ProductVariant) -> AdminVariantOut:
    on_hand, reserved, available = _variant_stock(variant)
    return AdminVariantOut(
        id=str(variant.id),
        sku=variant.sku,
        size=variant.size,
        color=variant.color,
        price_amount=variant.price_amount,
        currency=variant.currency,
        is_active=variant.is_active,
        quantity_on_hand=on_hand,
        quantity_reserved=reserved,
        quantity_available=available,
    )


def list_admin_products(*, q: str | None = None) -> list[AdminProductListItem]:
    qs = (
        Product.objects.filter(is_deleted=False)
        .select_related("category")
        .annotate(
            variant_count=Count("variants", filter=Q(variants__is_deleted=False)),
            min_price_amount=Min(
                "variants__price_amount",
                filter=Q(variants__is_active=True, variants__is_deleted=False),
            ),
        )
        .order_by("-updated_at")
    )
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(slug__icontains=q) | Q(brand__icontains=q))
    return [
        AdminProductListItem(
            id=str(p.id),
            name=p.name,
            slug=p.slug,
            brand=p.brand,
            is_published=p.is_published,
            category_id=str(p.category_id) if p.category_id else None,
            category_name=p.category.name if p.category_id else None,
            variant_count=p.variant_count or 0,
            min_price_amount=p.min_price_amount,
            currency="IRR",
            updated_at=p.updated_at.isoformat() if p.updated_at else None,
        )
        for p in qs[:100]
    ]


def get_admin_product(product_id: str) -> AdminProductDetail:
    product = (
        Product.objects.filter(pk=product_id, is_deleted=False)
        .prefetch_related(
            Prefetch(
                "variants",
                queryset=ProductVariant.objects.filter(is_deleted=False)
                .select_related("stock")
                .order_by("size", "color"),
            ),
            "collections",
        )
        .first()
    )
    if not product:
        raise NotFoundError("Product not found.", details={"id": product_id})
    return AdminProductDetail(
        id=str(product.id),
        name=product.name,
        slug=product.slug,
        brand=product.brand,
        description=product.description,
        is_published=product.is_published,
        category_id=str(product.category_id) if product.category_id else None,
        collection_ids=[str(c.id) for c in product.collections.all()],
        variants=[_serialize_variant(v) for v in product.variants.all()],
        updated_at=product.updated_at.isoformat() if product.updated_at else None,
    )


@transaction.atomic
def create_admin_product(
    *,
    name: str,
    slug: str,
    brand: str = "orf",
    description: str = "",
    is_published: bool = False,
    category_id: str | None = None,
    collection_ids: list[str] | None = None,
    variants: list | None = None,
) -> AdminProductDetail:
    slug = slugify(slug, allow_unicode=True) or slugify(name, allow_unicode=True)
    if not slug:
        raise ValidationAppError("Valid slug is required.")
    if Product.objects.filter(slug=slug, is_deleted=False).exists():
        raise ConflictError("Product slug already exists.", details={"slug": slug})

    category = None
    if category_id:
        category = Category.objects.filter(pk=category_id, is_deleted=False).first()
        if not category:
            raise NotFoundError("Category not found.")

    product = Product.objects.create(
        name=name.strip(),
        slug=slug,
        brand=(brand or "orf").strip(),
        description=description or "",
        is_published=is_published,
        category=category,
    )

    if collection_ids:
        cols = list(Collection.objects.filter(pk__in=collection_ids, is_deleted=False))
        product.collections.set(cols)

    for item in variants or []:
        _create_variant(product, item)

    return get_admin_product(str(product.id))


def _create_variant(product: Product, item) -> ProductVariant:
    data = item if isinstance(item, dict) else item.dict()
    sku = (data.get("sku") or "").strip()
    if not sku:
        raise ValidationAppError("Variant SKU is required.")
    if ProductVariant.objects.filter(sku=sku, is_deleted=False).exists():
        raise ConflictError("SKU already exists.", details={"sku": sku})
    price = int(data.get("price_amount") or 0)
    if price < 0:
        raise ValidationAppError("price_amount must be >= 0")
    variant = ProductVariant.objects.create(
        product=product,
        sku=sku,
        size=(data.get("size") or "").strip(),
        color=(data.get("color") or "").strip(),
        price_amount=price,
        currency=(data.get("currency") or "IRR").strip() or "IRR",
        is_active=bool(data.get("is_active", True)),
    )
    qty = max(int(data.get("quantity_on_hand") or 0), 0)
    StockItem.objects.create(variant=variant, quantity_on_hand=qty, quantity_reserved=0)
    return variant


@transaction.atomic
def update_admin_product(product_id: str, **fields) -> AdminProductDetail:
    product = Product.objects.filter(pk=product_id, is_deleted=False).first()
    if not product:
        raise NotFoundError("Product not found.", details={"id": product_id})

    for key in ("name", "brand", "description", "is_published"):
        if key in fields and fields[key] is not None:
            value = fields[key]
            setattr(
                product,
                key,
                value.strip() if isinstance(value, str) and key != "description" else value,
            )

    if fields.get("slug") is not None:
        new_slug = slugify(fields["slug"], allow_unicode=True)
        if Product.objects.filter(slug=new_slug, is_deleted=False).exclude(pk=product.pk).exists():
            raise ConflictError("Product slug already exists.", details={"slug": new_slug})
        product.slug = new_slug

    if "category_id" in fields:
        category_id = fields["category_id"]
        if category_id is None:
            product.category = None
        else:
            category = Category.objects.filter(pk=category_id, is_deleted=False).first()
            if not category:
                raise NotFoundError("Category not found.")
            product.category = category

    product.save()

    if fields.get("collection_ids") is not None:
        cols = list(Collection.objects.filter(pk__in=fields["collection_ids"], is_deleted=False))
        product.collections.set(cols)

    return get_admin_product(str(product.id))


@transaction.atomic
def upsert_admin_variant(
    product_id: str, *, variant_id: str | None = None, **data
) -> AdminVariantOut:
    product = Product.objects.filter(pk=product_id, is_deleted=False).first()
    if not product:
        raise NotFoundError("Product not found.", details={"id": product_id})

    if variant_id:
        variant = (
            ProductVariant.objects.filter(pk=variant_id, product=product, is_deleted=False)
            .select_related("stock")
            .first()
        )
        if not variant:
            raise NotFoundError("Variant not found.", details={"id": variant_id})
        for key in ("sku", "size", "color", "price_amount", "currency", "is_active"):
            if key in data and data[key] is not None:
                if key == "sku":
                    sku = data["sku"].strip()
                    if (
                        ProductVariant.objects.filter(sku=sku, is_deleted=False)
                        .exclude(pk=variant.pk)
                        .exists()
                    ):
                        raise ConflictError("SKU already exists.", details={"sku": sku})
                    variant.sku = sku
                else:
                    setattr(variant, key, data[key])
        variant.save()
        return _serialize_variant(variant)

    variant = _create_variant(product, data)
    variant = ProductVariant.objects.select_related("stock").get(pk=variant.pk)
    return _serialize_variant(variant)


def soft_delete_variant(product_id: str, variant_id: str) -> None:
    variant = ProductVariant.objects.filter(
        pk=variant_id, product_id=product_id, is_deleted=False
    ).first()
    if not variant:
        raise NotFoundError("Variant not found.", details={"id": variant_id})
    variant.is_deleted = True
    variant.deleted_at = timezone.now()
    variant.is_active = False
    variant.save(update_fields=["is_deleted", "deleted_at", "is_active", "updated_at"])

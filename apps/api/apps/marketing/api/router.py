from ninja import Router, Schema

from apps.marketing.models import HeroBanner

router = Router(tags=["marketing"])


class HeroBannerOut(Schema):
    id: str
    title: str
    subtitle: str
    cta_label: str
    cta_href: str
    image_url: str


@router.get("/heroes", response=list[HeroBannerOut], auth=None)
def list_heroes(request):
    banners = HeroBanner.objects.filter(is_active=True, is_deleted=False).order_by("sort_order")
    return [
        HeroBannerOut(
            id=str(b.id),
            title=b.title,
            subtitle=b.subtitle,
            cta_label=b.cta_label,
            cta_href=b.cta_href,
            image_url=b.image_url,
        )
        for b in banners
    ]

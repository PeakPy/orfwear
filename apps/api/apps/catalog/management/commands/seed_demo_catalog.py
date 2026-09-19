from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.demo_images import ensure_plate
from apps.catalog.models import Category, Collection, Product, ProductImage, ProductVariant
from apps.inventory.models import StockItem
from apps.marketing.models import HeroBanner
from apps.shipping.models import ShippingMethod

# Prices are IRR minor units (rial).
T = 10_000  # one toman

COLOR_HEX = {
    "سفید": (238, 236, 231),
    "مشکی": (38, 38, 38),
    "خاکستری": (150, 150, 146),
    "سرمه‌ای": (46, 55, 79),
    "بژ": (208, 194, 174),
    "زیتونی": (124, 128, 104),
    "شتری": (177, 141, 106),
    "یشمی": (154, 172, 156),
    "آجری": (166, 96, 78),
    "کرم": (226, 215, 197),
}

CATEGORIES = [
    ("tshirts", "تی‌شرت"),
    ("shirts", "پیراهن"),
    ("knitwear", "بافت"),
    ("trousers", "شلوار"),
    ("outerwear", "رویه"),
    ("dresses", "پیراهن مجلسی"),
]

COLLECTIONS = [
    ("new", "تازه‌ها", "رسیده‌های این هفته"),
    ("essentials", "ضروری‌ها", "قطعات پایهٔ کمد"),
    ("studio", "استودیو", "برش‌های آرام برای روزهای کاری"),
]

SIZES_TOP = ["S", "M", "L", "XL"]
SIZES_BOTTOM = ["30", "32", "34", "36"]

DEMO_PRODUCTS = [
    {
        "slug": "organic-cotton-tee",
        "name": "تی‌شرت پنبه ارگانیک",
        "category": "tshirts",
        "shape": "tee",
        "audience": Product.Audience.UNISEX,
        "price": 890 * T,
        "description": "تی‌شرت آستین‌کوتاه با پنبهٔ ارگانیک شانه‌زده و برش ریلکس. یقه رِب‌بافت که بعد از شست‌وشو فرم خود را نگه می‌دارد.",
        "material": "۱۰۰٪ پنبهٔ ارگانیک، ۱۸۰ گرم",
        "care": "شست‌وشو با آب سرد، خشک‌کن با دمای پایین، اتو از پشت پارچه.",
        "colors": ["سفید", "مشکی", "زیتونی"],
        "sizes": SIZES_TOP,
        "collections": ["new", "essentials"],
        "stock": {"سفید": [8, 12, 10, 4], "مشکی": [6, 9, 7, 0], "زیتونی": [3, 5, 2, 1]},
    },
    {
        "slug": "boxy-poplin-shirt",
        "name": "پیراهن پوپلین باکسی",
        "category": "shirts",
        "shape": "shirt",
        "audience": Product.Audience.WOMEN,
        "price": 1_980 * T,
        "description": "پیراهن پوپلین با فرم باکسی و شانهٔ افتاده. مناسب لایه‌گذاری روی تاپ یا پوشیدن به‌تنهایی.",
        "material": "۱۰۰٪ پنبهٔ پوپلین",
        "care": "شست‌وشوی ماشینی ملایم، اتوی گرم.",
        "colors": ["سفید", "کرم", "سرمه‌ای"],
        "sizes": SIZES_TOP,
        "collections": ["new", "studio"],
        "stock": {"سفید": [5, 7, 6, 2], "کرم": [4, 6, 3, 2], "سرمه‌ای": [2, 4, 4, 1]},
    },
    {
        "slug": "merino-crew-knit",
        "name": "بافت یقه‌گرد مرینو",
        "category": "knitwear",
        "shape": "knit",
        "audience": Product.Audience.MEN,
        "price": 3_450 * T,
        "description": "بافت یقه‌گرد از پشم مرینوی نرم با ضخامت متوسط. گرم، سبک و بدون خارش.",
        "material": "۱۰۰٪ پشم مرینو",
        "care": "شست‌وشوی دستی با آب ولرم، خشک‌کردن روی سطح صاف.",
        "colors": ["شتری", "خاکستری", "سرمه‌ای"],
        "sizes": SIZES_TOP,
        "collections": ["studio"],
        "stock": {"شتری": [4, 5, 5, 2], "خاکستری": [3, 6, 4, 1], "سرمه‌ای": [0, 2, 3, 1]},
    },
    {
        "slug": "relaxed-linen-trouser",
        "name": "شلوار کتان ریلکس",
        "category": "trousers",
        "shape": "trouser",
        "audience": Product.Audience.UNISEX,
        "price": 2_490 * T,
        "description": "شلوار کتان با فرم آزاد و کمر کشی پنهان. پارچهٔ خنک برای روزهای گرم.",
        "material": "۵۵٪ کتان، ۴۵٪ ویسکوز",
        "care": "شست‌وشوی ماشینی ۳۰ درجه، اتوی نمدار.",
        "colors": ["بژ", "زیتونی", "مشکی"],
        "sizes": SIZES_BOTTOM,
        "collections": ["essentials", "new"],
        "stock": {"بژ": [6, 8, 5, 3], "زیتونی": [4, 5, 4, 2], "مشکی": [2, 6, 6, 3]},
    },
    {
        "slug": "wide-wool-trouser",
        "name": "شلوار پشمی گشاد",
        "category": "trousers",
        "shape": "trouser",
        "audience": Product.Audience.WOMEN,
        "price": 3_150 * T,
        "description": "شلوار پشمی با پاچهٔ گشاد و پیلی جلو. برش بلند که خط پا را کشیده نشان می‌دهد.",
        "material": "۷۰٪ پشم، ۳۰٪ پلی‌استر",
        "care": "خشک‌شویی.",
        "colors": ["خاکستری", "مشکی"],
        "sizes": SIZES_BOTTOM,
        "collections": ["studio"],
        "stock": {"خاکستری": [3, 4, 3, 1], "مشکی": [2, 5, 4, 2]},
    },
    {
        "slug": "cotton-hoodie",
        "name": "هودی پنبه‌ای",
        "category": "knitwear",
        "shape": "hoodie",
        "audience": Product.Audience.UNISEX,
        "price": 2_150 * T,
        "description": "هودی با داخل کرک‌دار و کاپشن دولایه. کش دور مچ و کمر با بازگشت‌پذیری بالا.",
        "material": "۸۰٪ پنبه، ۲۰٪ پلی‌استر",
        "care": "پشت‌ورو بشویید، خشک‌کن با دمای پایین.",
        "colors": ["خاکستری", "مشکی", "یشمی"],
        "sizes": SIZES_TOP,
        "collections": ["new", "essentials"],
        "stock": {"خاکستری": [7, 9, 8, 3], "مشکی": [5, 7, 6, 2], "یشمی": [2, 3, 2, 0]},
    },
    {
        "slug": "light-field-jacket",
        "name": "کاپشن سبک فیلد",
        "category": "outerwear",
        "shape": "coat",
        "audience": Product.Audience.MEN,
        "price": 4_890 * T,
        "description": "لایهٔ میانی مینیمال برای فصل انتقال؛ چهار جیب کاربردی و آستر نازک.",
        "material": "۶۵٪ پنبه، ۳۵٪ نایلون",
        "care": "شست‌وشوی ماشینی ملایم، بدون سفیدکننده.",
        "colors": ["زیتونی", "مشکی", "شتری"],
        "sizes": SIZES_TOP,
        "collections": ["new"],
        "stock": {"زیتونی": [3, 4, 4, 2], "مشکی": [2, 3, 3, 1], "شتری": [1, 2, 2, 0]},
    },
    {
        "slug": "wool-overcoat",
        "name": "پالتو پشمی بلند",
        "category": "outerwear",
        "shape": "coat",
        "audience": Product.Audience.WOMEN,
        "price": 7_900 * T,
        "description": "پالتو تک‌سینه با یقهٔ برگردان و قد زیر زانو. ساختار سبک با آستر ساتن.",
        "material": "۷۵٪ پشم، ۲۵٪ پلی‌آمید",
        "care": "خشک‌شویی.",
        "colors": ["شتری", "مشکی"],
        "sizes": SIZES_TOP,
        "collections": ["studio"],
        "stock": {"شتری": [2, 3, 2, 1], "مشکی": [1, 2, 2, 1]},
    },
    {
        "slug": "slip-midi-dress",
        "name": "پیراهن میدی اسلیپ",
        "category": "dresses",
        "shape": "dress",
        "audience": Product.Audience.WOMEN,
        "price": 3_690 * T,
        "description": "پیراهن میدی با برش اریب و افتادگی نرم. بند قابل تنظیم و آستر کامل.",
        "material": "۱۰۰٪ ویسکوز",
        "care": "شست‌وشوی دستی، اتوی خنک.",
        "colors": ["مشکی", "یشمی", "آجری"],
        "sizes": SIZES_TOP,
        "collections": ["new", "studio"],
        "stock": {"مشکی": [4, 5, 4, 2], "یشمی": [2, 4, 3, 1], "آجری": [1, 2, 2, 0]},
    },
    {
        "slug": "heavy-jersey-tee",
        "name": "تی‌شرت جرسی ضخیم",
        "category": "tshirts",
        "shape": "tee",
        "audience": Product.Audience.MEN,
        "price": 1_190 * T,
        "description": "جرسی ۲۴۰ گرمی با فرم ایستاده و دوخت دولا روی درزها.",
        "material": "۱۰۰٪ پنبه، ۲۴۰ گرم",
        "care": "شست‌وشو با آب سرد.",
        "colors": ["سفید", "خاکستری", "سرمه‌ای"],
        "sizes": SIZES_TOP,
        "collections": ["essentials"],
        "stock": {"سفید": [9, 11, 9, 5], "خاکستری": [6, 8, 7, 3], "سرمه‌ای": [4, 6, 5, 2]},
    },
    {
        "slug": "oxford-shirt",
        "name": "پیراهن آکسفورد",
        "category": "shirts",
        "shape": "shirt",
        "audience": Product.Audience.MEN,
        "price": 2_290 * T,
        "description": "آکسفورد کلاسیک با یقهٔ دکمه‌دار و برش نیمه‌جذب. هرچه بیشتر بپوشید نرم‌تر می‌شود.",
        "material": "۱۰۰٪ پنبهٔ آکسفورد",
        "care": "شست‌وشوی ماشینی، اتوی گرم.",
        "colors": ["سفید", "کرم", "سرمه‌ای"],
        "sizes": SIZES_TOP,
        "collections": ["essentials", "studio"],
        "stock": {"سفید": [5, 8, 7, 3], "کرم": [3, 5, 4, 2], "سرمه‌ای": [2, 4, 3, 1]},
    },
    {
        "slug": "ribbed-knit-dress",
        "name": "پیراهن بافت رِب",
        "category": "dresses",
        "shape": "dress",
        "audience": Product.Audience.WOMEN,
        "price": 2_950 * T,
        "description": "پیراهن بافت رِب با کشسانی بالا و قد میدی. فرم بدن را دنبال می‌کند بدون فشار.",
        "material": "۶۰٪ ویسکوز، ۴۰٪ پلی‌استر",
        "care": "شست‌وشوی دستی، خشک‌کردن روی سطح صاف.",
        "colors": ["مشکی", "بژ", "زیتونی"],
        "sizes": SIZES_TOP,
        "collections": ["new"],
        "stock": {"مشکی": [4, 6, 5, 2], "بژ": [3, 4, 3, 1], "زیتونی": [2, 3, 2, 1]},
    },
]

# Slugs from the first demo pass; retired so they stop showing in the storefront.
SUPERSEDED_SLUGS = ["organic-tee", "linen-trouser", "light-jacket"]

SHIPPING_METHODS = [
    {
        "code": "standard",
        "title": "پست پیشتاز",
        "description": "تحویل ۳ تا ۵ روز کاری در سراسر کشور",
        "price_amount": 65 * T,
        "eta_days": 4,
        "free_over_amount": 5_000 * T,
        "sort_order": 1,
    },
    {
        "code": "express",
        "title": "ارسال سریع تهران",
        "description": "تحویل همان روز برای سفارش‌های قبل از ۱۲ ظهر",
        "price_amount": 120 * T,
        "eta_days": 1,
        "free_over_amount": None,
        "sort_order": 2,
    },
    {
        "code": "pickup",
        "title": "تحویل حضوری",
        "description": "دریافت از استودیو ORF، بدون هزینه",
        "price_amount": 0,
        "eta_days": 1,
        "free_over_amount": None,
        "sort_order": 3,
    },
]


class Command(BaseCommand):
    help = "Seed a realistic demo catalog (products, variants, imagery, shipping) for local development."

    def add_arguments(self, parser):
        parser.add_argument(
            "--regenerate-images",
            action="store_true",
            help="Re-render demo imagery even when the files already exist.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        force_images = options["regenerate_images"]

        categories = {
            slug: Category.objects.update_or_create(
                slug=slug, defaults={"name": name, "is_deleted": False}
            )[0]
            for slug, name in CATEGORIES
        }
        collections = {
            slug: Collection.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": description,
                    "is_published": True,
                    "is_deleted": False,
                },
            )[0]
            for slug, name, description in COLLECTIONS
        }

        for item in DEMO_PRODUCTS:
            product, _ = Product.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "description": item["description"],
                    "category": categories[item["category"]],
                    "audience": item["audience"],
                    "material": item["material"],
                    "care": item["care"],
                    "is_published": True,
                    "brand": "ORF",
                    "is_deleted": False,
                },
            )
            product.collections.set([collections[c] for c in item["collections"]])

            product.images.all().delete()
            for position, color in enumerate(item["colors"]):
                url = ensure_plate(
                    shape=item["shape"],
                    rgb=COLOR_HEX[color],
                    filename=f"{item['slug']}-{position}.jpg",
                    force=force_images,
                )
                ProductImage.objects.create(
                    product=product,
                    url=url,
                    alt_text=f"{item['name']} — {color}",
                    color=color,
                    position=position,
                )

            sku_base = item["slug"].upper().replace("-", "")[:14]
            for color_index, color in enumerate(item["colors"]):
                quantities = item["stock"][color]
                for size_index, size in enumerate(item["sizes"]):
                    variant, _ = ProductVariant.objects.update_or_create(
                        sku=f"{sku_base}-{color_index}{size_index}",
                        defaults={
                            "product": product,
                            "size": size,
                            "color": color,
                            "price_amount": item["price"],
                            "currency": "IRR",
                            "is_active": True,
                            "is_deleted": False,
                        },
                    )
                    StockItem.objects.update_or_create(
                        variant=variant,
                        defaults={
                            "quantity_on_hand": quantities[size_index],
                            "quantity_reserved": 0,
                        },
                    )

        Product.objects.filter(slug__in=SUPERSEDED_SLUGS).update(is_published=False)
        ProductVariant.objects.filter(product__slug__in=SUPERSEDED_SLUGS).update(is_active=False)

        for method in SHIPPING_METHODS:
            ShippingMethod.objects.update_or_create(
                code=method["code"],
                defaults={**method, "currency": "IRR", "is_active": True},
            )

        hero_image = ensure_plate(
            shape="coat", rgb=COLOR_HEX["شتری"], filename="hero-season.jpg", force=force_images
        )
        HeroBanner.objects.update_or_create(
            title="فصل جدید",
            defaults={
                "subtitle": "برش‌های آرام، پارچهٔ طبیعی",
                "cta_label": "دیدن تازه‌ها",
                "cta_href": "/collections/new",
                "image_url": hero_image,
                "is_active": True,
                "sort_order": 0,
                "is_deleted": False,
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(DEMO_PRODUCTS)} products, "
                f"{ProductVariant.objects.count()} variants, "
                f"{len(SHIPPING_METHODS)} shipping methods."
            )
        )

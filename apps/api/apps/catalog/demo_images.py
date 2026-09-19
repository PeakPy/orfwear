"""Deterministic studio imagery for the local demo catalog.

Renders neutral, editorial-looking garment plates so the storefront can be
reviewed without licensed photography. Generation is local and offline; files
land in MEDIA_ROOT and are served by the dev server.
"""

from __future__ import annotations

from pathlib import Path

from django.conf import settings
from PIL import Image, ImageDraw, ImageFilter

WIDTH = 1000
HEIGHT = 1333
DEMO_DIR = "catalog/demo"

BACKDROP_TOP = (243, 242, 239)
BACKDROP_BOTTOM = (227, 226, 221)


def _backdrop() -> Image.Image:
    base = Image.new("RGB", (WIDTH, HEIGHT), BACKDROP_TOP)
    draw = ImageDraw.Draw(base)
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        draw.line(
            [(0, y), (WIDTH, y)],
            fill=tuple(
                int(BACKDROP_TOP[i] + (BACKDROP_BOTTOM[i] - BACKDROP_TOP[i]) * ratio)
                for i in range(3)
            ),
        )

    glow = Image.new("L", (WIDTH, HEIGHT), 0)
    ImageDraw.Draw(glow).ellipse(
        [int(WIDTH * 0.1), int(-HEIGHT * 0.25), int(WIDTH * 0.95), int(HEIGHT * 0.55)], fill=90
    )
    base.paste(
        Image.new("RGB", (WIDTH, HEIGHT), (255, 255, 255)),
        (0, 0),
        glow.filter(ImageFilter.GaussianBlur(160)),
    )
    return base


def _shade(rgb: tuple[int, int, int], factor: float) -> tuple[int, int, int]:
    return tuple(max(0, min(255, int(channel * factor))) for channel in rgb)


def _tee(draw: ImageDraw.ImageDraw, color, *, long_sleeve=False, hood=False) -> None:
    cx = WIDTH // 2
    top, bottom = 330, 1010
    body_half = 210
    sleeve_drop = 640 if long_sleeve else 520

    draw.polygon(
        [
            (cx - body_half, top + 70),
            (cx - body_half - 140, top + 140),
            (cx - body_half - 175, sleeve_drop),
            (cx - body_half - 60, sleeve_drop + 30),
            (cx - body_half - 10, top + 250),
            (cx - body_half, bottom),
            (cx + body_half, bottom),
            (cx + body_half + 10, top + 250),
            (cx + body_half + 60, sleeve_drop + 30),
            (cx + body_half + 175, sleeve_drop),
            (cx + body_half + 140, top + 140),
            (cx + body_half, top + 70),
        ],
        fill=color,
    )
    draw.ellipse([cx - 95, top + 10, cx + 95, top + 130], fill=color)
    if hood:
        draw.ellipse([cx - 165, top - 60, cx + 165, top + 190], fill=_shade(color, 0.93))
    draw.ellipse([cx - 82, top + 28, cx + 82, top + 112], fill=BACKDROP_TOP)
    draw.line([(cx - 70, bottom - 6), (cx + 70, bottom - 6)], fill=_shade(color, 0.88), width=8)


def _shirt(draw: ImageDraw.ImageDraw, color) -> None:
    _tee(draw, color, long_sleeve=True)
    cx = WIDTH // 2
    draw.polygon([(cx - 95, 340), (cx, 470), (cx + 95, 340), (cx, 385)], fill=_shade(color, 0.9))
    for y in range(520, 980, 110):
        draw.ellipse([cx - 9, y, cx + 9, y + 18], fill=_shade(color, 0.78))


def _trouser(draw: ImageDraw.ImageDraw, color) -> None:
    cx = WIDTH // 2
    top, bottom = 360, 1140
    draw.polygon(
        [
            (cx - 190, top),
            (cx + 190, top),
            (cx + 175, bottom),
            (cx + 40, bottom),
            (cx, top + 420),
            (cx - 40, bottom),
            (cx - 175, bottom),
        ],
        fill=color,
    )
    draw.rectangle([cx - 192, top - 46, cx + 192, top + 16], fill=_shade(color, 0.9))


def _dress(draw: ImageDraw.ImageDraw, color) -> None:
    cx = WIDTH // 2
    draw.polygon(
        [(cx - 165, 360), (cx + 165, 360), (cx + 300, 1140), (cx - 300, 1140)],
        fill=color,
    )
    draw.polygon([(cx - 165, 360), (cx - 120, 300), (cx + 120, 300), (cx + 165, 360)], fill=color)
    draw.ellipse([cx - 78, 288, cx + 78, 372], fill=BACKDROP_TOP)


def _coat(draw: ImageDraw.ImageDraw, color) -> None:
    _tee(draw, color, long_sleeve=True)
    cx = WIDTH // 2
    draw.polygon([(cx - 110, 350), (cx, 560), (cx + 110, 350), (cx, 400)], fill=_shade(color, 0.88))
    draw.line([(cx, 560), (cx, 1010)], fill=_shade(color, 0.8), width=7)


SHAPES = {
    "tee": lambda d, c: _tee(d, c),
    "shirt": _shirt,
    "hoodie": lambda d, c: _tee(d, c, long_sleeve=True, hood=True),
    "knit": lambda d, c: _tee(d, c, long_sleeve=True),
    "trouser": _trouser,
    "dress": _dress,
    "coat": _coat,
}


def render_plate(*, shape: str, rgb: tuple[int, int, int], path: Path) -> None:
    image = _backdrop()

    shadow = Image.new("L", (WIDTH, HEIGHT), 0)
    ImageDraw.Draw(shadow).ellipse(
        [int(WIDTH * 0.22), HEIGHT - 190, int(WIDTH * 0.78), HEIGHT - 90], fill=70
    )
    image.paste(
        Image.new("RGB", (WIDTH, HEIGHT), (150, 148, 143)),
        (0, 0),
        shadow.filter(ImageFilter.GaussianBlur(45)),
    )

    garment = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    SHAPES.get(shape, SHAPES["tee"])(ImageDraw.Draw(garment), (*rgb, 255))

    drop = garment.split()[3].filter(ImageFilter.GaussianBlur(26))
    image.paste(Image.new("RGB", (WIDTH, HEIGHT), (188, 186, 180)), (14, 20), drop)
    image.paste(garment, (0, 0), garment)

    path.parent.mkdir(parents=True, exist_ok=True)
    image.filter(ImageFilter.SMOOTH).save(path, "JPEG", quality=86, optimize=True)


def plate_url(filename: str) -> str:
    base = str(getattr(settings, "PUBLIC_MEDIA_BASE_URL", "")).rstrip("/")
    return f"{base}{settings.MEDIA_URL}{DEMO_DIR}/{filename}"


def ensure_plate(
    *, shape: str, rgb: tuple[int, int, int], filename: str, force: bool = False
) -> str:
    path = Path(settings.MEDIA_ROOT) / DEMO_DIR / filename
    if force or not path.exists():
        render_plate(shape=shape, rgb=rgb, path=path)
    return plate_url(filename)

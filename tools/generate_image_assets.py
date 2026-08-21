#!/usr/bin/env python3
"""Generate responsive delivery assets without touching portfolio originals."""

from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
DATA_FILE = ROOT / "portfolio-data.js"
THUMB_WIDTH = 960


def portfolio_images() -> list[str]:
    source = DATA_FILE.read_text(encoding="utf-8")
    paths: list[str] = [f"images/webp{number}.webp" for number in range(1, 6)]

    traditional_block = re.search(
        r"traditional:\s*\[(.*?)\],\s*aiFamilies:", source, re.S
    )
    if not traditional_block:
        raise RuntimeError("Could not locate the traditional archive list")
    paths.extend(
        f"images/graphics/{name}"
        for name in re.findall(r'"([^"\n]+\.(?:webp|jpg))"', traditional_block.group(1))
    )

    family_block = re.search(r"aiFamilies:\s*\[(.*?)\]\s*,?\s*\}\s*,?\s*\};", source, re.S)
    if not family_block:
        raise RuntimeError("Could not locate the AI archive families")
    family_pattern = re.compile(
        r'\{\s*key:\s*"([^"]+)".*?(?:start:\s*(\d+)\s*,\s*)?count:\s*(\d+)\s*\}',
        re.S,
    )
    for key, start_value, count_value in family_pattern.findall(family_block.group(1)):
        start = int(start_value) if start_value else 1
        count = int(count_value)
        paths.extend(
            f"images/{key}{number}.webp" for number in range(start, start + count)
        )

    return list(dict.fromkeys(paths))


def webp_copy(source: Path, destination: Path, maximum_width: int, quality: int) -> tuple[int, int, int, int]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        original_width, original_height = image.size
        target_width = min(maximum_width, original_width)
        target_height = max(1, round(original_height * target_width / original_width))
        if (target_width, target_height) != image.size:
            image = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=quality, method=6)
    return original_width, original_height, target_width, target_height


def generate() -> None:
    manifest: dict[str, dict[str, int | str]] = {}
    original_bytes = 0
    thumbnail_bytes = 0

    for relative in portfolio_images():
        source = ROOT / relative
        if not source.exists():
            raise FileNotFoundError(relative)
        original_bytes += source.stat().st_size
        relative_inside_images = Path(relative).relative_to("images").with_suffix(".webp")
        destination = IMAGES / "thumbs" / relative_inside_images
        width, height, thumb_width, thumb_height = webp_copy(
            source, destination, THUMB_WIDTH, 76
        )
        thumbnail_bytes += destination.stat().st_size
        manifest[relative] = {
            "thumb": destination.relative_to(ROOT).as_posix(),
            "width": width,
            "height": height,
            "thumbWidth": thumb_width,
            "thumbHeight": thumb_height,
        }

    for source_name, folder_name, widths, quality in (
        ("banner.webp", "hero", (640, 1280, 1920, 2560), 80),
        ("dark_clouds.webp", "backgrounds", (640, 1280, 1920, 2560), 78),
        ("image2.webp", "backgrounds", (640, 1024, 1354), 76),
    ):
        source = IMAGES / source_name
        stem = source.stem.replace("_", "-")
        for width in widths:
            destination = IMAGES / folder_name / f"{stem}-{width}.webp"
            webp_copy(source, destination, width, quality)

    webp_copy(
        IMAGES / "domcloud_logo_corrupted.webp",
        IMAGES / "thumbs" / "ui" / "domcloud-logo-corrupted-480.webp",
        480,
        82,
    )

    favicon = Image.open(IMAGES / "favicon.ico").convert("RGBA")
    favicon.thumbnail((32, 32), Image.Resampling.LANCZOS)
    favicon.save(IMAGES / "favicon-32.png", "PNG", optimize=True)

    manifest_text = (
        '"use strict";\n\n'
        "window.IMAGE_ASSETS = Object.freeze("
        + json.dumps(manifest, indent=2, sort_keys=True)
        + ");\n"
    )
    (ROOT / "image-manifest.js").write_text(manifest_text, encoding="utf-8")

    print(f"Generated {len(manifest)} portfolio thumbnails")
    print(f"Original archive set: {original_bytes / 1024 / 1024:.2f} MiB")
    print(f"Thumbnail archive set: {thumbnail_bytes / 1024 / 1024:.2f} MiB")


if __name__ == "__main__":
    generate()

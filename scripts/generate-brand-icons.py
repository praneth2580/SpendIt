#!/usr/bin/env python3
"""Generate PWA, Android, and iOS assets from public/new_logo.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

try:
    RESAMPLE = Image.Resampling.LANCZOS
except AttributeError:
    RESAMPLE = Image.LANCZOS

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "new_logo.png"
PUBLIC = ROOT / "public"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_ICON = (
    ROOT / "ios" / "App" / "App" / "Assets.xcassets" / "AppIcon.appiconset" / "AppIcon-512@2x.png"
)

# Dark teal matching the brand mark background
BG = (11, 22, 22, 255)


def fit_on_square(source: Image.Image, size: int, padding_ratio: float = 0.06) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BG)
    inner = max(1, int(size * (1 - 2 * padding_ratio)))
    resized = source.resize((inner, inner), RESAMPLE)
    offset = (size - inner) // 2
    canvas.paste(resized, (offset, offset), resized)
    return canvas


def fit_on_splash(source: Image.Image, width: int, height: int) -> Image.Image:
    canvas = Image.new("RGBA", (width, height), BG)
    side = min(width, height)
    logo_max = int(side * 0.42)
    resized = source.resize((logo_max, logo_max), RESAMPLE)
    x = (width - logo_max) // 2
    y = (height - logo_max) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGBA").save(path, format="PNG", optimize=True)
    print(f"  wrote {path.relative_to(ROOT)}")


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source logo: {SRC}")

    source = Image.open(SRC).convert("RGBA")
    print(f"Source: {SRC} ({source.size[0]}x{source.size[1]})")

    print("\nPWA / web")
    save_png(fit_on_square(source, 192), PUBLIC / "icon-192.png")
    save_png(fit_on_square(source, 512), PUBLIC / "icon-512.png")
    save_png(fit_on_square(source, 32), PUBLIC / "favicon-32.png")

    print("\nAndroid launcher")
    launcher_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    foreground_sizes = {
        "mipmap-mdpi": 108,
        "mipmap-hdpi": 162,
        "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324,
        "mipmap-xxxhdpi": 432,
    }

    for folder, px in launcher_sizes.items():
        icon = fit_on_square(source, px)
        base = ANDROID_RES / folder
        save_png(icon, base / "ic_launcher.png")
        save_png(icon, base / "ic_launcher_round.png")

    for folder, px in foreground_sizes.items():
        save_png(
            fit_on_square(source, px, padding_ratio=0.04),
            ANDROID_RES / folder / "ic_launcher_foreground.png",
        )

    print("\nAndroid splash")
    for path in ANDROID_RES.rglob("splash.png"):
        with Image.open(path) as existing:
            w, h = existing.size
        save_png(fit_on_splash(source, w, h), path)

    print("\niOS app icon")
    if IOS_ICON.parent.exists():
        save_png(fit_on_square(source, 1024, padding_ratio=0.05), IOS_ICON)

    print("\nDone.")


if __name__ == "__main__":
    main()

"""
generate_icons.py — Grupo Catequético Santa Joana d'Arc
Gera todos os ícones PWA a partir do icone.png oficial.

Uso:
  pip install Pillow
  python generate_icons.py
"""

from pathlib import Path
from PIL import Image

SOURCE     = Path("src/images/icone_white.png")
OUTPUT_DIR = Path("src/images/icons")
SIZES      = [72, 96, 128, 144, 152, 192, 384, 512]

BG_PRIMARY  = (122, 45, 62)  # #7A2D3E — só para maskable


def remove_black_bg(img: Image.Image, threshold: int = 30) -> Image.Image:
    """Remove fundo preto tornando pixels escuros transparentes."""
    img = img.convert("RGBA")
    data = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = data[x, y]
            if r < threshold and g < threshold and b < threshold:
                data[x, y] = (r, g, b, 0)
    return img


def make_icon_transparent(size: int, img: Image.Image, pad_pct: float = 0.08) -> Image.Image:
    """Ícone com fundo transparente — mantém RGBA."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pad = int(size * pad_pct)
    inner = size - pad * 2
    resized = img.resize((inner, inner), Image.LANCZOS)
    canvas.paste(resized, (pad, pad), resized)
    return canvas  # RGBA, sem converter para RGB


def make_maskable(size: int, img: Image.Image) -> Image.Image:
    """Maskable: fundo sólido #7A2D3E + safe zone 15% — Android adapta."""
    canvas = Image.new("RGBA", (size, size), (*BG_PRIMARY, 255))
    pad = int(size * 0.15)
    inner = size - pad * 2
    resized = img.resize((inner, inner), Image.LANCZOS)
    canvas.paste(resized, (pad, pad), resized)
    return canvas.convert("RGB")


def main():
    if not SOURCE.exists():
        print(f"❌  {SOURCE} não encontrado.")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    src = remove_black_bg(Image.open(SOURCE))

    for s in SIZES:
        out = OUTPUT_DIR / f"icon-{s}x{s}.png"
        make_icon_transparent(s, src).save(out, "PNG", optimize=True)
        print(f"✅  {out}")

    for s in [192, 512]:
        out = OUTPUT_DIR / f"icon-{s}x{s}-maskable.png"
        make_maskable(s, src).save(out, "PNG", optimize=True)
        print(f"✅  {out}  (maskable)")

    make_icon_transparent(180, src).save(OUTPUT_DIR / "apple-touch-icon.png", "PNG", optimize=True)
    print("✅  apple-touch-icon.png")

    make_icon_transparent(32, src).save(OUTPUT_DIR / "favicon-32x32.png", "PNG", optimize=True)
    print("✅  favicon-32x32.png")

    print(f"\n🎉  {len(list(OUTPUT_DIR.glob('*.png')))} ícones em {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
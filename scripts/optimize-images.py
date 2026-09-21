"""
Convierte a WebP las fotos pesadas de una carpeta (por defecto las de producto),
las reduce a un máximo de 1200 px por lado y borra el original. Los PNG se
convierten siempre (conserva la transparencia); los JPG solo si pesan más de
150 KB. Si el WebP no resulta más liviano, se deja el original.

Imprime una línea "original -> nuevo" por archivo convertido, para poder
actualizar las referencias en el código.

Uso: python scripts/optimize-images.py [carpeta] [--dry-run]
"""
import os
import sys

from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DIR = os.path.join(REPO_ROOT, "public", "images", "products")

MAX_SIDE = 1200
WEBP_QUALITY = 82
JPG_MIN_BYTES = 150 * 1024


def convert(path, dry_run):
    ext = os.path.splitext(path)[1].lower()
    size = os.path.getsize(path)
    if ext == ".jpg" and size <= JPG_MIN_BYTES:
        return None

    target = os.path.splitext(path)[0] + ".webp"
    with Image.open(path) as source:
        image = source.convert("RGBA" if "A" in source.getbands() or "transparency" in source.info else "RGB")
    image.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)

    if dry_run:
        return size, size, target
    image.save(target, "WEBP", quality=WEBP_QUALITY, method=6)
    new_size = os.path.getsize(target)
    if new_size >= size:
        os.remove(target)
        return None
    os.remove(path)
    return size, new_size, target


def main():
    args = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    dry_run = "--dry-run" in sys.argv
    root = os.path.abspath(args[0]) if args else DEFAULT_DIR

    before = after = 0
    for folder, _, files in os.walk(root):
        for name in sorted(files):
            if os.path.splitext(name)[1].lower() not in (".png", ".jpg"):
                continue
            path = os.path.join(folder, name)
            result = convert(path, dry_run)
            if result is None:
                continue
            old_size, new_size, target = result
            before += old_size
            after += new_size
            print(f"{os.path.relpath(path, root)} -> {os.path.relpath(target, root)}")

    if not dry_run:
        print(f"\n{before / 1048576:.1f} MB -> {after / 1048576:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()

import os
from pathlib import Path
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

DIR = Path("public/images")
MAX_WIDTH = 1920
QUALITY = 82

jobs = [
    ("IMG_2179.HEIC", "IMG_2179.jpg"),
    ("IMG_2728 (1).HEIC", "IMG_2728.jpg"),
    ("IMG_5849.HEIC", "IMG_5849.jpg"),
]

for src, dst in jobs:
    in_path = DIR / src
    out_path = DIR / dst
    try:
        in_size = in_path.stat().st_size
        img = Image.open(in_path)
        img = ImageOps.exif_transpose(img)
        if img.mode != "RGB":
            img = img.convert("RGB")
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            img = img.resize((MAX_WIDTH, int(img.height * ratio)), Image.LANCZOS)
        img.save(out_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        out_size = out_path.stat().st_size
        print(f"{src} -> {dst}: {in_size/1024/1024:.2f}MB -> {out_size/1024/1024:.2f}MB")
        os.unlink(in_path)
    except Exception as e:
        print(f"FAILED {src}: {e}")

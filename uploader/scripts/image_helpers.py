import io
import mimetypes
from pathlib import Path

from PIL import Image, ImageOps


VARIANT_WIDTHS: dict[str, int] = {
    "w480": 480,
    "w960": 960,
    "w1600": 1600,
}


# Images
def open_image(path: Path) -> Image.Image:
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    return img

def compute_aspect_ratio(img: Image.Image) -> float:
    w, h = img.size
    if h == 0:
        raise ValueError("Image height is zero")
    return w / h

def resize_to_webp(img: Image.Image, max_width: int, quality: int = 82):
    w, h = img.size
    if w > max_width:
        new_w = max_width
        new_h = round(h * (new_w / w))
        out_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    else:
        out_img = img.copy()

    buf = io.BytesIO()
    out_img.save(buf, format="WEBP", quality=quality, method=6)
    return buf.getvalue(), out_img.size

def read_original_bytes(path: Path) -> tuple[bytes, str]:
    content_type, _ = mimetypes.guess_type(str(path))
    if content_type is None:
        content_type = "application/octet-stream"
    return path.read_bytes(), content_type

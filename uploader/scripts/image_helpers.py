import base64
import io
import mimetypes
from pathlib import Path

from PIL import Image, ImageOps


VARIANT_WIDTHS: dict[str, int] = {
    "w480": 480,
    "w960": 960,
    "w1600": 1600,
}

# Width of the inline placeholder shown while the real image loads. At 16px the
# webp is ~130 bytes as a data URI, small enough to sit in the page source and
# paint before any request goes out; it is heavily blurred in CSS anyway.
LQIP_WIDTH = 16


# Images
def open_image(path: Path) -> Image.Image:
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    return img

def image_size(img: Image.Image) -> tuple[int, int]:
    w, h = img.size
    if w == 0 or h == 0:
        raise ValueError("Image has a zero dimension")
    return w, h

def compute_aspect_ratio(img: Image.Image) -> float:
    w, h = image_size(img)
    return w / h

def make_lqip(img: Image.Image, width: int = LQIP_WIDTH, quality: int = 50) -> str:
    """A tiny blurred-up placeholder for this image, as a data URI."""
    height = max(1, round(img.height * width / img.width))
    small = img.resize((width, height), Image.Resampling.LANCZOS)

    buf = io.BytesIO()
    small.save(buf, format="WEBP", quality=quality, method=6)
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")

    return f"data:image/webp;base64,{encoded}"

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

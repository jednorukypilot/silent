"""
upload.py — upload works to Supabase storage + database.

Usage:
    python upload.py [--dry-run] [--keep-original] [--works-dir PATH]

Expects a .env file with:
    SUPABASE_URL=...
    SUPABASE_SECRET_KEY=...

Works directory structure:
    works/
        my-work/
            meta.json
            image1.jpg
            image2.jpg
            image3.jpg

meta.json fields:
    name        (required) string
    description (optional) string
    year        (optional) int
    displayed   (optional) int
    video_link  (optional) string
"""

import subprocess
import sys

REQUIREMENTS = [
    ("supabase", "supabase"),
    ("pillow", "PIL"),
    ("python-dotenv", "dotenv"),
]

def _install_deps():
    for pkg, import_name in REQUIREMENTS:
        try:
            __import__(import_name)
        except ImportError:
            print(f"Installing {pkg}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

_install_deps()

import argparse
import io
import json
import mimetypes
import os
import pathlib
import uuid
from typing import Any, Optional, cast

from dotenv import load_dotenv
from PIL import Image, ImageOps
from supabase import Client, create_client


# ── image helpers ─────────────────────────────────────────────────────────────

VARIANT_WIDTHS: dict[str, int] = {
    "w480": 480,
    "w960": 960,
    "w1600": 1600,
}


def open_image(path: pathlib.Path) -> Image.Image:
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


def read_original_bytes(path: pathlib.Path) -> tuple[bytes, str]:
    content_type, _ = mimetypes.guess_type(str(path))
    if content_type is None:
        content_type = "application/octet-stream"
    return path.read_bytes(), content_type


# ── storage / db helpers ──────────────────────────────────────────────────────

def upload_bytes(
    client: Client,
    bucket: str,
    path: str,
    data: bytes,
    content_type: str,
    dry_run: bool = False,
):
    if dry_run:
        print(f"[DRY RUN] upload {path} ({len(data)} bytes, {content_type})")
        return

    client.storage.from_(bucket).upload(
        path=path,
        file=data,
        file_options=cast(Any, {"content-type": content_type, "upsert": False}),
    )


def upload_variants(
    client: Client,
    bucket: str,
    variants: dict,
    img: Image.Image,
    file_key: str,
    dry_run: bool = False,
):
    for variant_name, max_width in variants.items():
        data, (w, h) = resize_to_webp(img, max_width=max_width)
        storage_path = f"{variant_name}/{file_key}.webp"
        upload_bytes(client, bucket, storage_path, data, "image/webp", dry_run=dry_run)
        print(f"  uploaded {variant_name}: {w}x{h}")


def upload_original(
    client: Client,
    bucket: str,
    path: pathlib.Path,
    file_key: str,
    dry_run: bool = False,
):
    ext = path.suffix.lower().lstrip(".") or "bin"
    data, content_type = read_original_bytes(path)
    storage_path = f"orig/{file_key}.{ext}"
    upload_bytes(client, bucket, storage_path, data, content_type, dry_run=dry_run)


def insert_work(
    *,
    client: Client,
    name: str,
    description: Optional[str],
    aspect_ratio: float,
    year: Optional[int],
    displayed: Optional[int],
    video_link: Optional[str],
    description_long: Optional[str],
    dry_run: bool = False,
):
    payload = {
        "name": name,
        "description": description,
        "description_long": description_long,
        "aspect_ratio": aspect_ratio,
        "year": year,
        "displayed": displayed,
        "video_link": video_link,
    }

    if dry_run:
        fake_id = str(uuid.uuid4())
        print("[DRY RUN] insert works:", payload)
        return fake_id

    res = client.table("works").insert(payload).execute()
    rows = cast(list[dict[str, Any]], res.data or [])
    if not rows or "id" not in rows[0]:
        raise ValueError("Insert into works did not return an id")
    return str(rows[0]["id"])


def insert_work_still(
    *,
    client: Client,
    work_id: str,
    file_key: str,
    alt: Optional[str],
    sort_order: int,
    dry_run: bool = False,
):
    payload = {
        "work_id": work_id,
        "file_key": file_key,
        "alt": alt,
        "sort_order": sort_order,
    }

    if dry_run:
        print("[DRY RUN] insert works_stills:", payload)
        return

    client.table("works_stills").insert(payload).execute()


# ── work folder ───────────────────────────────────────────────────────────────

def validate_displayed(value: object) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError(f"displayed must be an integer or null; got {type(value).__name__}")
    return value


def load_meta(work_dir: pathlib.Path) -> dict:
    meta_path = work_dir / "meta.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"Missing meta.json in {work_dir}")

    raw = meta_path.read_text(encoding="utf-8")
    try:
        meta = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Invalid JSON in {meta_path}: {e}\n"
            f"Make sure meta.json uses double quotes and has no trailing commas."
        ) from e
    return {
        "name": meta["name"],
        "description": meta.get("description"),
        "description_long": meta.get("description_long"),
        "year": meta.get("year"),
        "displayed": validate_displayed(meta.get("displayed")),
        "video_link": meta.get("video_link"),
    }


def import_work_folder(
    work_dir: pathlib.Path,
    client: Client,
    bucket: str,
    dry_run: bool = False,
    keep_original: bool = False,
):
    print(f"\n=== Importing {work_dir.name} ===")

    meta = load_meta(work_dir)

    image_paths = sorted([
        p for p in work_dir.iterdir()
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    ])

    if not image_paths:
        raise ValueError(f"No images found in {work_dir}")

    if len(image_paths) != 3:
        print(f"WARNING: expected 3 images, found {len(image_paths)}")

    first_img = open_image(image_paths[0])
    aspect_ratio = compute_aspect_ratio(first_img)

    work_id = cast(str, insert_work(
        client=client,
        name=meta["name"],
        description=meta["description"],
        description_long=meta["description_long"],
        aspect_ratio=aspect_ratio,
        year=meta["year"],
        displayed=meta["displayed"],
        video_link=meta["video_link"],
        dry_run=dry_run,
    ))

    for idx, img_path in enumerate(image_paths, start=1):
        img = open_image(img_path)
        file_key = str(uuid.uuid4())
        alt = f'{meta["name"]} \u2013 image {idx}'

        upload_variants(client, bucket, VARIANT_WIDTHS, img, file_key, dry_run=dry_run)

        if keep_original:
            upload_original(client, bucket, img_path, file_key, dry_run=dry_run)

        insert_work_still(
            client=client,
            work_id=work_id,
            file_key=file_key,
            alt=alt,
            sort_order=idx,
            dry_run=dry_run,
        )

        print(f"  inserted still {idx}: {img_path.name} -> {file_key}")

    print(f"Done: {meta['name']} ({work_id})")


# ── entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Upload works to Supabase.")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without executing them.")
    parser.add_argument("--keep-original", action="store_true", help="Also upload the original image file.")
    parser.add_argument(
        "--works-dir",
        default=str(pathlib.Path(__file__).parent / "works"),
        help="Path to the works directory (default: ./works)",
    )
    args = parser.parse_args()

    load_dotenv()

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY")

    if not url or not key:
        raise SystemExit("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment / .env file.")

    client: Client = create_client(supabase_url=url, supabase_key=key)
    bucket = "stills"
    import_root = pathlib.Path(args.works_dir)

    if not import_root.is_dir():
        raise SystemExit(f"Works directory not found: {import_root}")

    work_dirs = sorted([p for p in import_root.iterdir() if p.is_dir() and not p.name.startswith(".")])

    if not work_dirs:
        raise SystemExit(f"No work folders found in {import_root}")

    for work_dir in work_dirs:
        import_work_folder(
            work_dir,
            client,
            bucket,
            dry_run=args.dry_run,
            keep_original=args.keep_original,
        )


if __name__ == "__main__":
    main()

import uuid
from pathlib import Path
from typing import Any, Optional, cast

from PIL import Image
from supabase import Client

from scripts.image_helpers import read_original_bytes, resize_to_webp


# Storage
def upload_bytes(client: Client, bucket: str, path: str, data: bytes, content_type: str, dry_run: bool = False):
    if dry_run:
        print(f"[DRY RUN] upload {path} ({len(data)} bytes, {content_type})")
        return

    client.storage.from_(bucket).upload(
        path=path,
        file=data,
        file_options=cast(Any, {
            "content-type": content_type,
            "upsert": False,
        }),
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

def upload_original(client: Client, bucket: str, path: Path, file_key: str, dry_run: bool = False):
    ext = path.suffix.lower().lstrip(".")
    if not ext:
        ext = "bin"
    data, content_type = read_original_bytes(path)
    storage_path = f"orig/{file_key}.{ext}"
    upload_bytes(client, bucket, storage_path, data, content_type, dry_run=dry_run)

#DB
def insert_work(
    *,
    client: Client,
    name: str,
    description: Optional[str],
    aspect_ratio: float,
    year: Optional[int],
    displayed: Optional[int],
    video_link: Optional[str],
    dry_run: bool = False,
):
    payload = {
        "name": name,
        "description": description,
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
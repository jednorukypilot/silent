import uuid
from pathlib import Path
from typing import Any, Iterable, Optional, cast

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


# DB
def _returned_id(res, table: str) -> str:
    rows = cast(list[dict[str, Any]], res.data or [])
    if not rows or "id" not in rows[0]:
        raise ValueError(f"Insert into {table} did not return an id")
    return str(rows[0]["id"])

def insert_work(
    *,
    client: Client,
    name: str,
    description: Optional[str],
    description_long: Optional[str],
    aspect_ratio: float,
    year: Optional[int],
    displayed: Optional[int],
    highlighted: Optional[int],
    video_link: Optional[str],
    dry_run: bool = False,
) -> str:
    payload = {
        "name": name,
        "description": description,
        "description_long": description_long,
        "aspect_ratio": aspect_ratio,
        "year": year,
        "displayed": displayed,
        "highlighted": highlighted,
        "video_link": video_link,
    }

    if dry_run:
        print("[DRY RUN] insert works:", payload)
        return str(uuid.uuid4())

    res = client.table("works").insert(payload).execute()
    return _returned_id(res, "works")

def insert_still(
    *,
    client: Client,
    file_key: str,
    width: int,
    height: int,
    alt: Optional[str],
    lqip: Optional[str] = None,
    dry_run: bool = False,
) -> str:
    payload = {
        "file_key": file_key,
        "width": width,
        "height": height,
        "alt": alt,
        "lqip": lqip,
    }

    if dry_run:
        preview = {**payload, "lqip": f"<{len(lqip)} byte data URI>" if lqip else None}
        print("[DRY RUN] insert stills:", preview)
        return str(uuid.uuid4())

    res = client.table("stills").insert(payload).execute()
    return _returned_id(res, "stills")

def link_work_still(
    *,
    client: Client,
    work_id: str,
    still_id: str,
    sort_order: int,
    dry_run: bool = False,
):
    payload = {
        "work_id": work_id,
        "still_id": still_id,
        "sort_order": sort_order,
    }

    if dry_run:
        print("[DRY RUN] insert works_stills:", payload)
        return

    client.table("works_stills").insert(payload).execute()

def add_placements(
    *,
    client: Client,
    still_id: str,
    surfaces: Iterable[str],
    dry_run: bool = False,
):
    rows = [{"surface": surface, "still_id": still_id} for surface in surfaces]
    if not rows:
        return

    if dry_run:
        print("[DRY RUN] insert still_placements:", rows)
        return

    client.table("still_placements").insert(rows).execute()

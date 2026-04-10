import json
from pathlib import Path
import uuid
from typing import Optional, cast

from scripts.image_helpers import VARIANT_WIDTHS, compute_aspect_ratio, open_image
from scripts.storage_helpers import insert_work, insert_work_still, upload_original, upload_variants


def validate_displayed(value: object) -> Optional[int]:
    if value is None:
        return None

    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError(f"displayed must be an integer or null; got {type(value).__name__}")

    return value


def load_meta(work_dir: Path) -> dict:
    meta_path = work_dir / "meta.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"Missing meta.json in {work_dir}")

    meta = json.loads(meta_path.read_text(encoding="utf-8"))

    return {
        "name": meta["name"],
        "description": meta.get("description"),
        "description_long": meta.get("description_long"),
        "year": meta.get("year"),
        "displayed": validate_displayed(meta.get("displayed")),
        "video_link": meta.get("video_link"),
    }

def import_work_folder(work_dir: Path, client, bucket, dry_run=False, keep_original=False):
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

    # Use first image to determine work aspect_ratio
    first_img = open_image(image_paths[0])
    aspect_ratio = compute_aspect_ratio(first_img)

    work_id = insert_work(
        client=client,
        name=meta["name"],
        description=meta["description"],
        description_long=meta["description_long"],
        aspect_ratio=aspect_ratio,
        year=meta["year"],
        displayed=meta["displayed"],
        video_link=meta["video_link"],
        dry_run=dry_run,
    )
    work_id = cast(str, work_id)

    for idx, img_path in enumerate(image_paths, start=1):
        img = open_image(img_path)
        file_key = str(uuid.uuid4())
        alt = f'{meta["name"]} – image {idx}'

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
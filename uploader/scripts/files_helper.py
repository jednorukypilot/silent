import json
import uuid
from pathlib import Path
from typing import Optional

from scripts.image_helpers import VARIANT_WIDTHS, image_size, make_lqip, open_image
from scripts.storage_helpers import (
    add_placements,
    insert_still,
    insert_work,
    link_work_still,
    upload_original,
    upload_variants,
)

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
SURFACES = {"hero", "contact"}
WORK_ONLY_FIELDS = ("description", "description_long", "year", "displayed", "highlighted", "video_link")

# Every still in a work shares the work's aspect ratio: the home page renders a
# work as a 3-cell grid sized from that single number, so a still that does not
# match would be silently cropped. Allow a little slack for off-by-a-pixel crops.
RATIO_TOLERANCE = 0.01


def validate_order_value(value: object, field: str) -> Optional[int]:
    if value is None:
        return None

    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError(f"{field} must be an integer or null; got {type(value).__name__}")

    return value


def validate_placements(value: object, filename: str) -> list[str]:
    if value is None:
        return []

    if not isinstance(value, list):
        raise TypeError(f"placements for {filename} must be a list; got {type(value).__name__}")

    unknown = [s for s in value if s not in SURFACES]
    if unknown:
        raise ValueError(
            f"Unknown placement(s) {unknown} for {filename}; "
            f"expected any of {sorted(SURFACES)}"
        )

    return list(dict.fromkeys(value))


def load_meta(work_dir: Path, image_names: set[str]) -> dict:
    meta_path = work_dir / "meta.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"Missing meta.json in {work_dir}")

    raw = meta_path.read_text(encoding="utf-8")
    try:
        meta = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Invalid JSON in {meta_path}: {e}\n"
            f"Make sure meta.json uses double quotes and has no comments or trailing commas."
        ) from e

    name = meta.get("name")

    # A folder with no name is backdrop-only: its images land in the registry and
    # in still_placements, but no work row is created for them.
    if name is None:
        set_fields = [f for f in WORK_ONLY_FIELDS if meta.get(f) is not None]
        if set_fields:
            raise ValueError(
                f"{meta_path} has no \"name\", so no work is created, but it sets {set_fields}. "
                f"Add a name, or drop those fields."
            )

    stills_meta = meta.get("stills") or {}
    if not isinstance(stills_meta, dict):
        raise TypeError(f"\"stills\" in {meta_path} must be an object keyed by filename")

    unknown_files = sorted(set(stills_meta) - image_names)
    if unknown_files:
        raise ValueError(
            f"{meta_path} describes image(s) not present in {work_dir.name}: {unknown_files}"
        )

    stills = {}
    for filename, config in stills_meta.items():
        if not isinstance(config, dict):
            raise TypeError(f"\"stills\".\"{filename}\" in {meta_path} must be an object")
        stills[filename] = {
            "alt": config.get("alt"),
            "placements": validate_placements(config.get("placements"), filename),
        }

    return {
        "name": name,
        "description": meta.get("description"),
        "description_long": meta.get("description_long"),
        "year": meta.get("year"),
        "displayed": validate_order_value(meta.get("displayed"), "displayed"),
        "highlighted": validate_order_value(meta.get("highlighted"), "highlighted"),
        "video_link": meta.get("video_link"),
        "stills": stills,
    }


def resolve_work_aspect_ratio(
    sizes: list[tuple[Path, int, int]],
    allow_ratio_mismatch: bool = False,
) -> float:
    _, base_w, base_h = sizes[0]
    base_ratio = base_w / base_h

    mismatched = [
        (path.name, w / h)
        for path, w, h in sizes[1:]
        if abs((w / h) - base_ratio) / base_ratio > RATIO_TOLERANCE
    ]

    if mismatched:
        detail = ", ".join(f"{name} is {ratio:.4f}" for name, ratio in mismatched)
        message = (
            f"Stills in this work do not share one aspect ratio: "
            f"{sizes[0][0].name} is {base_ratio:.4f} but {detail}. "
            f"The work renders as a single-ratio grid, so these would be cropped."
        )
        if not allow_ratio_mismatch:
            raise ValueError(message + " Re-crop them, or pass --allow-ratio-mismatch.")
        print(f"WARNING: {message}")

    return base_ratio


def plan_work_folder(work_dir: Path, allow_ratio_mismatch: bool = False) -> dict:
    """Read and validate one folder. Raises on any problem; touches no network."""
    image_paths = sorted([
        p for p in work_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES
    ])

    if not image_paths:
        raise ValueError(f"No images found in {work_dir}")

    meta = load_meta(work_dir, {p.name for p in image_paths})
    is_work = meta["name"] is not None

    if is_work and len(image_paths) != 3:
        print(f"WARNING: {work_dir.name}: expected 3 images, found {len(image_paths)}")

    # Decoded images are not kept: three 4K frames per work would add up fast, and
    # the apply pass has to re-open them to resize anyway.
    sizes = []
    lqips = {}
    for path in image_paths:
        img = open_image(path)
        sizes.append((path, *image_size(img)))
        lqips[path] = make_lqip(img)

    stills = []
    for idx, (path, width, height) in enumerate(sizes, start=1):
        config = meta["stills"].get(path.name, {"alt": None, "placements": []})
        alt = config["alt"]
        if alt is None and is_work:
            alt = f'{meta["name"]} – image {idx:02d}'

        stills.append({
            "path": path,
            "width": width,
            "height": height,
            "alt": alt,
            "lqip": lqips[path],
            "placements": config["placements"],
            "sort_order": idx,
        })

    return {
        "dir": work_dir,
        "meta": meta,
        "stills": stills,
        "aspect_ratio": resolve_work_aspect_ratio(sizes, allow_ratio_mismatch) if is_work else None,
    }


def apply_work_plan(plan: dict, client, bucket, dry_run: bool = False, keep_original: bool = False):
    meta = plan["meta"]
    print(f"\n=== Importing {plan['dir'].name} ===")

    work_id = None
    if meta["name"] is not None:
        work_id = insert_work(
            client=client,
            name=meta["name"],
            description=meta["description"],
            description_long=meta["description_long"],
            aspect_ratio=plan["aspect_ratio"],
            year=meta["year"],
            displayed=meta["displayed"],
            highlighted=meta["highlighted"],
            video_link=meta["video_link"],
            dry_run=dry_run,
        )
    else:
        print(f'  no "name" in meta.json: importing {len(plan["stills"])} backdrop still(s) only')

    for still in plan["stills"]:
        img_path = still["path"]
        file_key = str(uuid.uuid4())

        # Files go up before the row goes in: a failed upload then leaves no row
        # pointing at missing objects, which nothing in the schema can repair.
        upload_variants(client, bucket, VARIANT_WIDTHS, open_image(img_path), file_key, dry_run=dry_run)

        if keep_original:
            upload_original(client, bucket, img_path, file_key, dry_run=dry_run)

        still_id = insert_still(
            client=client,
            file_key=file_key,
            width=still["width"],
            height=still["height"],
            alt=still["alt"],
            lqip=still["lqip"],
            dry_run=dry_run,
        )

        if work_id is not None:
            link_work_still(
                client=client,
                work_id=work_id,
                still_id=still_id,
                sort_order=still["sort_order"],
                dry_run=dry_run,
            )

        add_placements(
            client=client,
            still_id=still_id,
            surfaces=still["placements"],
            dry_run=dry_run,
        )

        placed = f" [{', '.join(still['placements'])}]" if still["placements"] else ""
        print(
            f"  inserted still {still['sort_order']}: {img_path.name} -> {file_key} "
            f"({still['width']}x{still['height']}){placed}"
        )

    label = meta["name"] or f"{plan['dir'].name} (backdrops)"
    print(f"Done: {label}{f' ({work_id})' if work_id else ''}")


def import_work_folder(
    work_dir: Path,
    client,
    bucket,
    dry_run: bool = False,
    keep_original: bool = False,
    allow_ratio_mismatch: bool = False,
):
    """Plan and import a single folder. uploader.ipynb calls this per folder."""
    apply_work_plan(
        plan_work_folder(work_dir, allow_ratio_mismatch),
        client,
        bucket,
        dry_run=dry_run,
        keep_original=keep_original,
    )

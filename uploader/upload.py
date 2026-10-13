"""
upload.py — upload works to Supabase storage + database.

Usage:
    python upload.py [--dry-run] [--keep-original] [--allow-ratio-mismatch]
                     [--works-dir PATH]

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

See meta.example.json for the meta.json format. A folder whose meta.json
has no "name" creates no work: its images are registered and placed as hero or
contact backdrops only.

The import logic lives in scripts/files_helper.py, which uploader.ipynb shares.
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
import os
import pathlib

from dotenv import load_dotenv
from supabase import Client, create_client

from scripts.files_helper import apply_work_plan, plan_work_folder


def main():
    parser = argparse.ArgumentParser(description="Upload works to Supabase.")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without executing them.")
    parser.add_argument("--keep-original", action="store_true", help="Also upload the original image file.")
    parser.add_argument(
        "--allow-ratio-mismatch",
        action="store_true",
        help="Warn instead of failing when a work's stills have different aspect ratios.",
    )
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

    # Every folder is read and validated before anything is written, so a typo in
    # one meta.json cannot leave the database half-populated.
    plans = []
    problems = []
    for work_dir in work_dirs:
        try:
            plans.append(plan_work_folder(work_dir, args.allow_ratio_mismatch))
        except Exception as error:
            problems.append((work_dir.name, error))

    if problems:
        print(f"\nRefusing to import: {len(problems)} of {len(work_dirs)} folder(s) need fixing.")
        for name, error in problems:
            print(f"  {name}: {error}")
        raise SystemExit(1)

    for plan in plans:
        apply_work_plan(
            plan,
            client,
            bucket,
            dry_run=args.dry_run,
            keep_original=args.keep_original,
        )


if __name__ == "__main__":
    main()

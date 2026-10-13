"""
wipe_storage.py — delete every object in the stills bucket.

DESTRUCTIVE. Lists by default and deletes nothing; pass --yes to actually remove.

Usage:
    python wipe_storage.py                 # list what would be deleted
    python wipe_storage.py --yes           # delete it
    python wipe_storage.py --bucket other  # a different bucket

Expects a .env file with:
    SUPABASE_URL=...
    SUPABASE_SECRET_KEY=...

This goes through the Storage API on purpose. Deleting rows from storage.objects
in SQL removes the record but leaves the file itself behind, unreachable and
still counted against storage — the opposite of a clean wipe.
"""

import subprocess
import sys

REQUIREMENTS = [
    ("supabase", "supabase"),
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

from dotenv import load_dotenv
from supabase import Client, create_client

PAGE_SIZE = 1000
DELETE_BATCH = 100


def list_folder(client: Client, bucket: str, prefix: str) -> list[dict]:
    """One folder's entries, following the API's pagination."""
    entries = []
    offset = 0

    while True:
        page = client.storage.from_(bucket).list(
            prefix, {"limit": PAGE_SIZE, "offset": offset}
        )
        if not page:
            break

        entries.extend(page)
        if len(page) < PAGE_SIZE:
            break

        offset += len(page)

    return entries


def walk(client: Client, bucket: str, prefix: str = "") -> list[str]:
    """Every object path under a prefix, depth first.

    The API reports folders as entries with no id, so that is what separates a
    directory from a file here.
    """
    paths = []

    for entry in list_folder(client, bucket, prefix):
        name = entry.get("name")
        if not name:
            continue

        path = f"{prefix}/{name}" if prefix else name

        if entry.get("id") is None:
            paths.extend(walk(client, bucket, path))
        else:
            paths.append(path)

    return paths


def main():
    parser = argparse.ArgumentParser(description="Delete every object in a Supabase storage bucket.")
    parser.add_argument("--yes", action="store_true", help="Actually delete. Without this, only lists.")
    parser.add_argument("--bucket", default="stills", help="Bucket to wipe (default: stills)")
    args = parser.parse_args()

    load_dotenv()

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY")

    if not url or not key:
        raise SystemExit("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment / .env file.")

    client: Client = create_client(supabase_url=url, supabase_key=key)

    print(f"Scanning bucket '{args.bucket}'...")
    paths = walk(client, args.bucket)

    if not paths:
        print("Bucket is already empty.")
        return

    by_prefix: dict[str, int] = {}
    for path in paths:
        folder = path.rsplit("/", 1)[0] if "/" in path else "(root)"
        by_prefix[folder] = by_prefix.get(folder, 0) + 1

    for folder in sorted(by_prefix):
        print(f"  {folder}/: {by_prefix[folder]} object(s)")
    print(f"Total: {len(paths)} object(s)")

    if not args.yes:
        print("\nNothing deleted. Re-run with --yes to delete these.")
        return

    print(f"\nDeleting {len(paths)} object(s)...")
    deleted = 0
    for start in range(0, len(paths), DELETE_BATCH):
        batch = paths[start : start + DELETE_BATCH]
        client.storage.from_(args.bucket).remove(batch)
        deleted += len(batch)
        print(f"  {deleted}/{len(paths)}")

    remaining = walk(client, args.bucket)
    if remaining:
        raise SystemExit(f"{len(remaining)} object(s) still present after the wipe: {remaining[:5]}")

    print(f"Deleted {deleted} object(s). Bucket is empty.")


if __name__ == "__main__":
    main()

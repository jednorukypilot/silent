# silent monorepo

This repository is organized as a small monorepo with two projects:

- `app/`: SvelteKit website (deployed to GitHub Pages)
- `uploader/`: Python uploader tools and notebook

## Structure

```text
.
├─ app/
│  ├─ src/
│  ├─ static/
│  ├─ assets/
│  ├─ package.json
│  └─ ...
├─ uploader/
│  ├─ scripts/
│  ├─ works/
│  ├─ requirements.in
│  ├─ requirements.txt
│  └─ uploader.ipynb
└─ package.json (root helper scripts)
```

## App (SvelteKit)

Install dependencies for the app:

```bash
npm ci --prefix app
```

Run development server from repo root:

```bash
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

The app build needs Supabase environment variables. For local development, copy [app/.env.example](app/.env.example) to `app/.env` and fill in the values:

```bash
SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key
```

## Uploader (Python)

Use a virtual environment inside `uploader/`:

```bash
# create once
python -m venv uploader/.venv

# activate (PowerShell)
.\uploader\.venv\Scripts\Activate.ps1

# install uploader deps
pip install -r uploader/requirements.txt
```

To refresh locked requirements:

```bash
pip install pip-tools
pip-compile uploader/requirements.in -o uploader/requirements.txt
```

Import every folder under `uploader/works/`:

```bash
python uploader/upload.py --dry-run   # validate and print, write nothing
python uploader/upload.py
```

Every folder is validated before anything is written, so a bad `meta.json` cannot
leave the database half-populated. Each image also gets a 16px blurred webp
(~160 bytes) stored as a data URI in `stills.lqip`; the site inlines it into the
page and shows it while the full image loads. A work's stills must all share one aspect
ratio (`--allow-ratio-mismatch` downgrades that to a warning).

Each folder needs a `meta.json`; see
[uploader/meta.example.json](uploader/meta.example.json). `stills` is
optional and keyed by filename — list only the images that need custom alt text or
a backdrop placement. A folder whose `meta.json` has no `name` creates no work:
its images are registered as hero/contact backdrops only.

## Database

Supabase. [db/reset.sql](db/reset.sql) is the authoritative schema: a central
`stills` registry that `works_stills` and `still_placements` reference, so one
image can back a work, the hero banner and the contact page without being stored
three times. It is destructive — it drops everything in `public` before building
the schema — and exists to document the database and to rebuild it from scratch,
not as part of any routine.

The schema uses a central `stills` registry that `works_stills` and
`still_placements` reference, so one image can back a work, the hero banner and
the contact page without being stored three times.

[db/reset.sql](db/reset.sql) drops everything in `public` and rebuilds it. It is
destructive and has not been applied yet. Full rebuild, in order:

```bash
python uploader/wipe_storage.py          # list what is in the bucket
python uploader/wipe_storage.py --yes    # 1. empty the bucket
#                                          2. run db/reset.sql in the SQL editor
python uploader/upload.py --dry-run      # 3. check the folders validate
python uploader/upload.py                #    re-upload
npm run build                            # 4. regenerate the site data
```

Wipe storage before dropping the tables: if the storage step fails, the rows that
say what the bucket should contain are still there. Between the reset and the
re-upload the site builds empty, which is expected.

Deleting rows from `storage.objects` in SQL is not a wipe — it drops the record
and leaves the file behind, unreachable and still billed. Use the script.

## CI/CD

GitHub Pages workflow is configured to:

- install dependencies from `app/`
- build the SvelteKit site in `app/`
- upload `app/build` as the Pages artifact

For GitHub Pages builds, add these repository secrets so the build can resolve Supabase config:

- `SUPABASE_URL`
- `PUBLIC_SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

build_trigger-001

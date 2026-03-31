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

## CI/CD

GitHub Pages workflow is configured to:

- install dependencies from `app/`
- build the SvelteKit site in `app/`
- upload `app/build` as the Pages artifact

For GitHub Pages builds, add these repository secrets so the build can resolve Supabase config:

- `SUPABASE_URL`
- `PUBLIC_SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

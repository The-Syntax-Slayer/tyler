# 07 — DEPLOYMENT & OPS (Vercel)

## Target: one Vercel project
- **Frontend:** Vite static build, served from Vercel's CDN.
- **Backend:** the FastAPI app as ONE Python serverless function —
  `api/index.py` exporting the `app` object — mounted at `/api`.
- **Same origin:** the frontend calls relative `/api/...`. No CORS, no second
  host, no `VITE_API_URL`, no separate backend URL to keep in sync.
- **Python 3.12**, pinned with a `.python-version` file (Vercel's default is
  3.12; pinning avoids silent auto-upgrades to 3.13/3.14).
- No legacy `builds`/`routes` config in `vercel.json` — only the function
  duration setting and build/output paths (see below).

## Vercel-specific wiring
- `api/index.py` — thin entrypoint only: adjust `sys.path` to `apps/api` and
  `from app.main import app`. It must fail loudly at build time if the import
  fails; never ship a fallback app that masks import errors.
- `api/requirements.txt` — pinned runtime deps only (FastAPI, Pydantic, and
  whatever the fetch script needs). Verify with `vercel build` that Vercel
  installed them; if a build shows missing deps, move the file to the repo
  root and rebuild — do not guess, read the build log.
- `vercel.json` (repo root):
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "buildCommand": "npm --prefix apps/web run build",
    "outputDirectory": "apps/web/dist",
    "functions": { "api/index.py": { "maxDuration": 30 } }
  }
  ```
- `.python-version` — `3.12`.
- **Route rule (critical):** FastAPI routes are defined WITHOUT the `/api`
  prefix in code (`/decision`, `/health`, …). Vercel mounts the function at
  `/api`, so deployed URLs are `/api/decision`, `/api/docs`. Locally, the Vite
  dev proxy rewrites `/api/*` → `/*` on `localhost:8000`. See `04-API-SPEC.md`.
- **Cache bundling (critical):** the committed snapshot in
  `apps/api/app/data/` (see `02-DATA-SPEC.md`) must be inside the function
  bundle. After `vercel build`, inspect
  `.vercel/output/functions/api/index.func/` and confirm the data files are
  present. If they are missing, check `.vercelignore` — it must NOT exclude
  that directory.

## Limits that shape the design (verified 29 Oct 2026)
- **Stateless; filesystem read-only except `/tmp`.** Nothing is written at
  runtime; the cache is bundled read-only. This is why the snapshot is
  committed (see `02-DATA-SPEC.md`).
- **Duration:** Hobby 300s default and max with Fluid Compute (the stale
  10s/60s figures apply only when Fluid Compute is disabled). Cached reads
  take milliseconds — duration is not a risk.
- **Bundle:** 250 MB uncompressed (Python allowance up to 500 MB). Our bundle
  is a few MB if dependencies stay minimal — keep them minimal.
- **Request/response body:** 4.5 MB. Our payloads are kilobytes.
- **Cold starts:** the first request after idle is slower. Hit `/api/health`
  before demos and before recording the video.

## Deploy sequence (task D-2)
1. Fetch + validate the January data; commit the snapshot + provenance.
2. `vercel build` locally; confirm the bundle contains the data files and the
   deps installed.
3. `vercel --prod`. Hit `https://<app>.vercel.app/api/health` (expect
   `cacheLoaded: true`) and `/api/docs`.
4. Run the `06-TESTING-QA.md` smoke pass against the DEPLOYED URL.
5. **Incognito verification:** deployed app, GitHub repo, YouTube video — fresh
   incognito window, signed out. Record date + result in the README.
6. Tag the submission commit (`git tag submission-v1`) after the check passes.

## Docker (brief requirement + local development — NOT the deploy path)
- `docker-compose.yml` runs the API (uvicorn) + web (Vite dev) locally, reading
  the same committed snapshot (read-only mount). `docker compose up --build`
  works from a clean clone — no fetch step needed to run.
- `apps/api/Dockerfile`: Python 3.12-slim, pinned requirements, non-root user.
  No API key is ever baked into an image layer.
- Keep Docker working and documented; deploy on Vercel. Do not build two
  deploy paths.

## Environment variables
- **None required at runtime on Vercel.** `BMRS_API_KEY` is fetch-time only
  (local re-fetch), held in env, never committed, never in the frontend.
- `.env.example` committed with placeholder values only.

## Rollback
Vercel deployment history: one-click rollback restores frontend + function
together. Keep deploys small and frequent so a rollback is always one step back.

## Troubleshooting (check first)
- 404 on `/api/*` → entrypoint not detected: `api/index.py` must export `app`;
  check the build log and `.python-version`.
- Missing deps at runtime → requirements file location; verify via `vercel build`.
- Empty charts on deploy, fine locally → cache missing from the bundle →
  inspect `.vercel/output`, check `.vercelignore`.
- Cold-start pause in a demo → warm `/api/health` first.
- 400s from Elexon during fetch → wrong param names; re-read `02-DATA-SPEC.md`
  (single `publishTime`; `settlementDateFrom/To`).
- CORS errors locally → Vite proxy rewrite misconfigured. Deployed, same
  origin has no CORS.

## Fallback — only if Vercel is blocked
If Vercel cannot deploy the Python function (verified blocker, not a guess):
API on Render (free tier) + frontend on Vercel, with `VITE_API_URL` and a CORS
allowlist for the exact Vercel origin. Document the switch in the README. Do
not build both paths up front — Vercel first.

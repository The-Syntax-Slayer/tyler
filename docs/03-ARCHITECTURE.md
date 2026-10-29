# 03 — ARCHITECTURE

## Repo layout (monorepo, one Docker Compose for local + deployable backend)
```
<anonymous-repo-name>/
├── AGENTS.md
├── README.md
├── vercel.json                  # build/output config + function maxDuration
├── .python-version             # 3.12 — pins the Vercel Python runtime
├── api/
│   ├── index.py                # Vercel entrypoint: exposes the FastAPI `app`
│   └── requirements.txt        # pinned runtime deps
├── docker-compose.yml
├── .gitignore                 # .env, node_modules, __pycache__, .venv (NOT the data snapshot)
├── docs/                      # this pack (00–09, SKILLS.md) — committed, it is part of the submission's honesty trail
├── apps/
│   ├── web/                   # React 19 + TypeScript + Vite + Tailwind CSS + Recharts
│   │   ├── src/
│   │   │   ├── components/    # DecisionView, AccuracyView, VintageExplorer, AboutView, Chart, MetricTable, CaveatBanner
│   │   │   ├── lib/api.ts     # typed API client (relative `/api` base), no raw fetch scattered in components
│   │   │   ├── lib/format.ts  # MW/UTC formatting, single source of truth
│   │   │   └── App.tsx        # routing (4 screens), layout, error boundary
│   │   ├── index.html
│   │   ├── vite.config.ts     # dev proxy: /api/* -> localhost:8000/* (prefix stripped)
│   │   └── package.json
│   └── api/                   # Python 3.12 + FastAPI + Pydantic v2
│       ├── app/
│       │   ├── main.py        # app factory, routes WITHOUT the /api prefix (Vercel mounts at /api), CORS for local dev only
│       │   ├── elexon.py      # Elexon client: the two verified queries, nothing else
│       │   ├── cache.py       # bundled-cache reads + provenance
│       │   ├── decisions.py   # decision-moment + vintage selection (publishTime <= cutoff)
│       │   ├── metrics.py     # MAE / RMSE / bias, pure functions, unit-tested
│       │   ├── schemas.py     # Pydantic response models (the API contract)
│       │   └── data/          # COMMITTED cache snapshot: fuelhh.json, windfor.json, provenance.json (public Elexon data)
│       ├── scripts/
│       │   └── fetch_january.py  # the ONLY code that calls Elexon; writes app/data/
│       ├── tests/             # pytest: metrics, decisions, API, validation rules
│       ├── requirements.txt
│       └── Dockerfile
```

## Runtime topology (Vercel — one project, one origin)
- **Local:** `docker compose up --build` runs api (uvicorn) + web (Vite dev).
  The Vite proxy rewrites `/api/*` → `/*` on the API. The API serves the
  committed cache snapshot only.
- **Deployed:** one Vercel project. The Vite build is served statically; the
  FastAPI app runs as a Python serverless function (`api/index.py`) mounted
  at `/api`. The function bundle contains the committed cache snapshot, so the
  deployed API never calls Elexon at request time — the read-only serverless
  filesystem makes runtime fetching impossible by design, and the bundle
  approach is the correct answer, not a workaround.
- **No database.** The committed snapshot is sufficient for a 31-day window
  and removes an entire failure class. Do not add Postgres/Redis.
- **Docker is the local-dev path and a brief requirement, not the deploy
  path.** Keep it working; deploy on Vercel.

## Data flow (read path)
```
UI (cutoff + delivery day)
  -> GET /api/... (04-API-SPEC.md)
  -> decisions.py: select vintage with max publishTime <= cutoff
  -> cache.py: read cached rows
  -> metrics.py: compute MAE/RMSE/bias on same-startTime pairs
  -> Pydantic schemas -> JSON -> Recharts + tables
```
The Elexon network is touched only by `fetch_january.py`. If that invariant
breaks, the design has regressed.

## Configuration
| Variable | Where | Notes |
|---|---|---|
| `BMRS_API_KEY` | Fetch script only (local re-fetch) | Optional; raises rate limits. Never in the frontend, never committed, never in the function bundle. |
| `CACHE_DIR` | API (optional override) | Default: the bundled snapshot at `apps/api/app/data/` (repo) — the same path locally, in Docker, and in the Vercel bundle. Override only for tests (temp dir). |
| `PORT` | Local / Docker only | Vercel assigns nothing here — serverless. Respect `$PORT` in Docker. |
| — | — | No `VITE_API_URL`, no `FRONTEND_ORIGIN` on Vercel: same origin. |

## Error handling (contract, not decoration)
- Cache miss / corrupt cache → API returns `503` with a plain-language message;
  UI shows the "data not loaded" state with the fix (run the fetch script).
  Never an empty chart, never zeros.
- Upstream Elexon failure during fetch → script exits non-zero, keeps the last
  good cache, logs the failing query. Never writes partial data over good data
  (write to temp, validate, then atomic rename).
- Invalid cutoff/date params → `422` with the validation detail; UI clamps the
  selector to valid values so this is rarely seen.
- Every API error response is JSON: `{ "detail": "<plain-language message>" }`.

## Performance budget
- Cached read path: p95 < 200ms locally; every interaction < 1s on cached data.
- January payloads are small (31 days × 48 actuals + ~31+ vintages × ~60 rows):
  keep responses unpaginated but complete; no N+1, no per-row requests.
- Charts render from already-fetched arrays; no re-fetch on hover/scrub —
  the vintage explorer pre-loads the day's vintages once.

## Security
- No auth needed (public demo data, no user state). Same origin on Vercel, so
  no CORS configuration is needed in production; local dev allows
  `localhost:5173` only.
- No secrets in the image or the function bundle. The API key is fetch-time
  only and is never baked into a Docker layer or the Vercel bundle — the
  bundle contains only the fetched public data + provenance.
- Dependency pinning: lockfiles committed (`package-lock.json`,
  pinned `requirements.txt`). No unpinned installs in Dockerfiles.
- Input validation on every query param (Pydantic). No string-built queries.

## What NOT to build
No background workers, no scheduler, no database, no auth, no SSR, no
server-side rendering of charts. The brief rewards a correct, legible,
deployable app — not infrastructure theatre.

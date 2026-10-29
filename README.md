# Wind Day-Ahead — Forecast Accuracy

A web app for a UK energy utility team buying in the GB day-ahead market. It shows
the latest wind-generation forecasts that were knowable when day-ahead decisions
had to be made, and lets the team evaluate forecast accuracy quantitatively —
for January 2026 delivery, using Elexon data only.

- **Decision view:** pick a delivery day and a D-1 gate-closure cutoff
  (11:00 / 17:00 / 23:00 UTC). The app serves the latest WINDFOR vintage
  published at or before that cutoff, next to FUELHH actuals.
- **Accuracy benchmarks:** MAE, RMSE and bias per forecast vintage and per
  lead-time horizon, across all 31 January delivery days.
- **Vintage explorer:** scrub through every published vintage for a delivery
  day and watch the forecast curve revise.
- **Data & methods:** the decision-time rule, the metric formulas, data
  provenance, and the WINDFOR/FUELHH scope caveat.

## The one rule that matters

A forecast is only shown for a decision if it was published **at or before**
the decision cutoff:

```
publishTime <= decision cutoff
```

The rule is enforced server-side (`apps/api/app/decisions.py`), never just
hidden in the UI, and is covered by a regression test. Serving a later vintage
for an earlier decision would be lookahead bias — evaluating a decision with
information that was physically unknowable at the time.

## Data — Elexon only, committed snapshot

All numbers come from a committed snapshot of two verified Elexon BMRS
queries (no live calls at runtime, no API key needed):

| Series | Query | Coverage |
|---|---|---|
| FUELHH actuals (WIND) | `GET /datasets/FUELHH?settlementDateFrom=…&settlementDateTo=…&fuelType=WIND` | 1,488 half-hourly rows, 31 days |
| WINDFOR forecast vintages | `GET /forecast/generation/wind/history?publishTime=<cutoff>` | 16,352 hourly rows, 224 vintages |

Two traps were verified live while building this: plain `from`/`to` parameters
on FUELHH are silently ignored (use `settlementDateFrom/To`), and the WINDFOR
history endpoint takes a single `publishTime` and returns the vintage in force
at that moment.

**Scope caveat, stated everywhere it matters:** WINDFOR forecasts total GB wind
(including embedded/distribution-connected wind); FUELHH WIND records
transmission-metered outturn only. Forecasts therefore sit systematically
above actuals (~3.5–6.3 GW on the days checked). That gap is a scope
difference, not pure forecast error — no calibration offsets are applied, and
bias is always reported separately from MAE/RMSE.

## Structure

```
api/                  Vercel serverless entrypoint (api/index.py -> FastAPI app)
apps/api/             FastAPI backend: decisions, metrics, cache, schemas
  app/data/           Committed Elexon snapshot (fuelhh.json, windfor.json, provenance.json)
  scripts/            fetch_january.py — the only code that calls Elexon
  tests/              Pytest suite (metrics, decisions, API, lookahead regression)
apps/web/             React 19 + TypeScript + Vite + Tailwind frontend
  src/lib/            Typed API client (api.ts) and UTC/MW formatting (format.ts)
  src/components/     Decision, Accuracy, Vintage Explorer, About, charts, KPI cards
vercel.json           One Vercel project: Vite static frontend + Python function at /api
docker-compose.yml    Local dev only (API + web); deployment is Vercel
```

## Run it locally

```bash
# Docker (no Node/Python install needed)
docker compose up --build
# Web: http://localhost:5173 · API docs: http://localhost:8000/docs

# Or from source (Python 3.12, Node 20+)
pip install -r apps/api/requirements.txt
uvicorn app.main:app --reload --app-dir apps/api --port 8000
npm --prefix apps/web install
npm --prefix apps/web run dev
```

Re-fetch the snapshot (optional — a key raises rate limits, it is not required):

```bash
python apps/api/scripts/fetch_january.py
```

## Checks

```bash
pytest apps/api                 # backend tests
npm --prefix apps/web run test  # frontend Vitest suite
npm --prefix apps/web run lint  # TypeScript typecheck
npm --prefix apps/web run build # production build
```

Deploy: `vercel --prod` (one project, same origin — the frontend calls
relative `/api/...`; no CORS, no second host, no runtime environment
variables).

## AI tools used

As the brief requires, AI use is disclosed: Google Antigravity (implementation
and tests), the Impeccable design skill (UI direction and accessibility
checks), selected Claude skills (`tdd-guide`, `senior-frontend`,
`docker-development`, `senior-devops`), and Muse (independent review, UI
redesign, and deployment repair). All data handling and accuracy logic was
verified against the live Elexon API responses above.

Runtime dependencies are permissively licensed (MIT/BSD/Apache/ISC; IBM Plex
fonts under OFL 1.1).

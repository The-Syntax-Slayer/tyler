# 04 — API SPEC

Base path `/api`. All timestamps ISO 8601 UTC (`Z`). All `generation` values MW.
JSON only. Implement exactly these endpoints — no extras without a reason noted
in the README.

## Routing on Vercel (read before implementing)
FastAPI routes are defined WITHOUT the `/api` prefix in code (`/decision`,
`/health`, …). Vercel mounts the `api/index.py` function at `/api`, so the
public paths below are served as `/api/decision`, `/api/health`, etc., and the
Swagger docs land at `/api/docs` when deployed (`/docs` locally). The Vite dev
proxy rewrites `/api/*` → `/*` on `localhost:8000`, so the frontend uses
relative `/api/...` URLs in both environments and the spec below always shows
the public path.

## Conventions
- Errors: `{ "detail": "<plain-language message>" }`, status `422` (validation),
  `503` (cache not loaded/corrupt), `500` (unexpected, message generic).
- Every forecast row in every response carries `publishTime`. A response missing
  it is a contract violation.
- Numbers are numbers (not strings). `null` only where a value genuinely does
  not exist (e.g. a horizon with no pairs) — never as a substitute for zero.

## Endpoints

### `GET /api/health`
```json
{ "status": "ok", "cacheLoaded": true, "settlementDates": 31, "vintages": 62,
  "cacheFetchedAt": "2026-10-29T12:00:00Z" }
```
`cacheLoaded: false` when the cache is missing — the UI shows the data-not-loaded
state. Used by deploy smoke tests.

### `GET /api/meta`
Provenance for the About screen (from `provenance.json`):
```json
{ "sources": ["Elexon BMRS — FUELHH", "Elexon BMRS — WINDFOR"],
  "window": { "from": "2026-01-01", "to": "2026-01-31" },
  "fetchedAt": "2026-10-29T12:00:00Z", "apiKeyUsed": false,
  "scopeNote": "WINDFOR and FUELHH WIND may cover different wind populations; see About. Bias is reported separately from MAE/RMSE." }
```

### `GET /api/decisions`
The valid decision moments (delivery dates × cutoffs). The UI builds its
selectors from this — never hardcode dates in the frontend.
```json
{ "decisions": [
  { "deliveryDate": "2026-01-01", "cutoffs": ["2025-12-31T17:00:00Z", "2026-01-01T09:00:00Z"] }
] }
```
Cutoff clock times come from the challenge document (see `02-DATA-SPEC.md`).
If the document states none, one documented default cutoff per day.

### `GET /api/decision?deliveryDate=2026-01-01&cutoff=2025-12-31T17:00:00Z`
The core endpoint. Returns the vintage knowable at the cutoff, the actuals,
and the metrics for that pair.
```json
{
  "deliveryDate": "2026-01-01",
  "cutoff": "2025-12-31T17:00:00Z",
  "vintage": { "publishTime": "2025-12-31T16:30:00Z",
               "note": "Latest vintage published at or before the cutoff." },
  "series": [
    { "startTime": "2026-01-01T00:00:00Z", "settlementPeriod": 1,
      "forecastMW": 20032, "actualMW": 13756, "residualMW": 6276 },
    "... hourly rows, same-startTime pairs only ..."
  ],
  "metrics": { "pairs": 24, "maeMW": 4521.3, "rmseMW": 4688.1, "biasMW": 4521.3,
               "biasNote": "Positive bias = forecast above actual on average." }
}
```
Rules: `vintage.publishTime <= cutoff`, enforced in `decisions.py`. If no
vintage exists at/before the cutoff → `422` with a plain message. `series`
contains only startTimes present in BOTH series.

### `GET /api/vintages?deliveryDate=2026-01-01`
All vintages for one delivery day, for the explorer. Each vintage: its
`publishTime` + hourly `forecastMW` rows. Sorted by `publishTime` ascending.
```json
{ "deliveryDate": "2026-01-01",
  "vintages": [ { "publishTime": "2025-12-30T22:30:00Z",
                  "points": [ { "startTime": "...", "forecastMW": 19800 } ] } ] }
```

### `GET /api/accuracy`
Per-vintage metrics across the window, plus per-horizon aggregates. The UI's
accuracy table consumes this directly.
```json
{ "perVintage": [
    { "deliveryDate": "2026-01-01", "publishTime": "2025-12-31T22:30:00Z",
      "pairs": 24, "maeMW": 4521.3, "rmseMW": 4688.1, "biasMW": 4521.3 } ],
  "perHorizonHours": [
    { "horizonHours": 12, "pairs": 31, "maeMW": 4100.0, "rmseMW": 4300.0, "biasMW": 3900.0 } ],
  "scopeNote": "Comparisons mix WINDFOR and FUELHH WIND populations; see About." }
```
Horizon = `startTime - publishTime` in hours, bucketed to whole hours.

## Metric definitions (implement exactly; document on the About screen)
For pairs `(F_i, A_i)`, `n` pairs, residual `r_i = F_i - A_i`:
- **MAE** = mean(|r_i|). **RMSE** = sqrt(mean(r_i²)). **Bias** = mean(r_i).
- Round display to 0 decimals (MW); compute on full precision; never round
  inputs before computing.
- Pure functions in `metrics.py`, unit-tested against hand-computed fixtures.

## OpenAPI
FastAPI generates `/docs` (Swagger) automatically. The deployed API must serve
it — the technical reviewer will open it. Keep operation summaries plain and
accurate.

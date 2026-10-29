# 02 — DATA SPEC (Elexon only, verified live 29 Oct 2026)

> Verification status: the two queries below were executed live against
> `https://data.elexon.co.uk/bmrs/api/v1` on 29 Oct 2026 (09:33–09:36 UTC), with
> **no API key**. The FUELHH query was re-verified live the same day. Full
> evidence, example rows and the 400-body read: `elexon-verification-evidence.md`
> (kept alongside this pack). Only 1 Jan 2026 and one vintage were queried —
> the data layer MUST validate the whole January window (task D-2).

## Sources (the only two allowed)
| Stream | Content | Granularity |
|---|---|---|
| **FUELHH** | Half-hourly outturn generation by fuel type (actuals) | 30 min, settlement periods 1–48 |
| **WINDFOR** | Wind generation forecast (vintages) | Hourly, mapped onto odd settlement periods (1, 3, 5, …) |

## Verified query 1 — FUELHH wind actuals
```
GET /datasets/FUELHH?settlementDateFrom=2026-01-01&settlementDateTo=2026-01-01&fuelType=WIND
```
Result: all 48 half-hourly rows for the settlement date, newest-first. Fields per
row: `dataset`, `publishTime`, `startTime`, `settlementDate`, `settlementPeriod`
(1–48), `fuelType` ("WIND"), `generation` (MW). Observed 1 Jan 2026: generation
13,756–16,408 MW.

**TRAP — read this twice:** plain `from`/`to` query params are **ignored** by
this endpoint. A call with `from`/`to` silently returned 29 Oct 2026 data.
Always use `settlementDateFrom` / `settlementDateTo`. Add a test that asserts
every returned row's `settlementDate` is inside the requested window — this trap
must be caught mechanically, not by eyeballing.

## Verified query 2 — WINDFOR forecast vintages (as-of semantics)
```
GET /forecast/generation/wind/history?publishTime=2026-01-01T00:00:00Z
```
Result: a **single vintage** — every row has `publishTime` 2025-12-31T22:30:00Z,
i.e. the latest vintage published **at or before** the requested time. Rows are
hourly (`settlementPeriod` odd only), `startTime` spanning ~2.5 days around the
requested time, `generation` in MW. This is exactly the "latest forecast
available at decision time" behaviour: **pass `publishTime=<decision cutoff>`**.

**TRAP:** `from`/`to` and `publishTimeFrom`/`publishTimeTo` variants return
HTTP 400. The 400 body names the missing `PublishTime` parameter — the endpoint
wants ONE `publishTime` value, not a range. To build the vintage explorer, call
the endpoint once per cutoff of interest and keep `publishTime` on every row.

The non-history endpoint `GET /forecast/generation/wind` returns only the LATEST
vintage (one `publishTime`, hourly rows) — useful for a smoke test, useless for
historical decision moments. Do not use it for the app.

## Scope flag — forecast vs actual gap (OPEN, must be resolved or labelled)
Comparing the single verified vintage (published 31 Dec 2025, 22:30 UTC) with
FUELHH actuals for 1 Jan 2026, the forecast is HIGHER than the actual in every
overlapping hourly slot, by ~3.5–6.3 GW:

| Slot | Forecast (MW) | Actual (MW) | Gap |
|---|---|---|---|
| Period 1 (00:00) | 20,032 | 13,756 | +6,276 |
| Period 19 (09:00) | 19,385 | 15,555 | +3,830 |
| Period 25 (12:00) | 20,025 | 16,408 | +3,617 |
| Period 47 (23:00) | 19,182 | 15,578 | +3,604 |

One vintage on one day does not prove systematic bias. The leading hypothesis:
**WINDFOR covers a wider wind population** (including embedded /
distribution-connected wind) than FUELHH "WIND" (operationally metered
transmission wind). This is an **inference, not a verified Elexon definition**.

**Required handling (task D-4):** (1) check the Elexon dataset definitions for
both series; (2) look for an actuals series with the same population as
WINDFOR; (3) if none exists — the expected outcome — compute the metrics
anyway, show **bias separately** from MAE/RMSE, and state the scope difference
prominently in the UI, README and video. **Never** present the gap as pure
forecast error. Do not "correct" the forecast by an estimated offset — that
would invent data.

## Temporal alignment rule
- Compare forecast and actuals at **hourly grain**, on identical `startTime`
  values. WINDFOR rows exist only at odd settlement periods; use the FUELHH
  row with the same `startTime` (do not average pairs unless the methods screen
  documents it — simplest correct choice: same-startTime matching).
- All timestamps are UTC (`Z`). Store and display in UTC; label the timezone
  everywhere. Settlement date ≠ calendar date for late periods — use
  `startTime`, never wall-clock assumptions.
- Keep `publishTime` on every forecast row through every layer (cache → API →
  UI). A row without a `publishTime` is a bug.

## January 2026 window
- Fetch FUELHH for `settlementDateFrom=2026-01-01` to `settlementDateTo=2026-01-31`,
  `fuelType=WIND` (page through if the API paginates — check response metadata).
- Fetch WINDFOR vintages for the decision cutoffs the app supports (see 03):
  one as-of call per cutoff; cover at least one cutoff per delivery day.
- Validate after fetching: every date present, 48 actuals per day, no duplicate
  `(startTime, publishTime)` vintage rows, no row outside the window.

## Caching and provenance (required design)
- The backend fetches from Elexon **only** via an explicit fetch script
  (`apps/api/scripts/fetch_january.py`), never in the request path. Fetched
  payloads are stored verbatim under `apps/api/app/data/` (`fuelhh.json`,
  `windfor.json`) plus a `provenance.json` recording: query URL, fetched-at
  timestamp, row counts, and the API-key mode used (key / no key).
- **The cache snapshot is committed to the repo.** It is public Elexon data
  (small: 31 days of half-hourly/hourly rows), and Vercel serverless functions
  have a read-only filesystem — the function bundle must contain the data, so
  a runtime fetch or a gitignored cache cannot work on Vercel. Keys are never
  committed; only the fetched data + provenance.
- The deployed app serves from the bundled cache. A cache-miss returns a clear
  error state ("January data not loaded"), never invented numbers. Re-fetching
  is a deliberate act: run the script, validate, commit the new snapshot.
- Respect rate limits: sequential requests, small delays, no parallel storms.
  No API key is needed for reads, but registering a free key (Elexon Portal,
  `BMRS_API_KEY` env var, server-side only, fetch-time only) raises rate
  limits — recommended.
- Never commit keys, `.env` files, or credentials. The provenance file must
  contain no secrets.

## Decision cutoffs (parameter, not invention)
Cutoff clock times must come from the challenge document. The app takes cutoffs
as parameters (UI selector + API param) and defaults must be set from the
document during the build. If the document does not state clock times, the app
defaults to one cutoff per delivery day at a documented, clearly-labelled time
and the README says so. Do not invent "the market closes at X" claims.

## Validation rules (implement as tests, see 06)
1. Every FUELHH row's `settlementDate` is inside the requested window.
2. 48 rows per settlement date, periods 1–48, no duplicates.
3. Every forecast row served for a decision moment has `publishTime <=` that
   moment (regression test with a deliberately late vintage).
4. No forecast row lacks `publishTime`; no `generation` value is null/negative
   without being surfaced as a data-quality flag.
5. Metric values recompute identically from cached data (deterministic).

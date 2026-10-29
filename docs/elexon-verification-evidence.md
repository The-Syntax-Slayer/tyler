# Gridbricks / REint challenge — Elexon API live verification (29 Oct 2026, ~15:05 IST)

Live, unauthenticated checks against the Elexon Insights Solution API
(`https://data.elexon.co.uk/bmrs/api/v1`). No API key was used or needed
for the calls below. Checked 29 Oct 2026, 09:33–09:35 UTC.

## VERIFIED: FUELHH wind actuals for January 2026

Query (worked, no key):

    GET /datasets/FUELHH?settlementDateFrom=2026-01-01&settlementDateTo=2026-01-01&fuelType=WIND

Result: all 48 half-hourly rows for settlement date 2026-01-01, fuelType
"WIND", returned newest-first. Fields per row: `dataset`, `publishTime`,
`startTime`, `settlementDate`, `settlementPeriod` (1–48), `fuelType`,
`generation` (MW). Example first/last rows:

- Period 48: startTime 2026-01-01T23:30:00Z, publishTime 2026-01-02T00:00:00Z, generation 15538
- Period 1: startTime 2026-01-01T00:00:00Z, publishTime 2026-01-01T00:30:00Z, generation 13756

Generation across the day: 13,756–16,408 MW (all 48 values in that band;
very windy day — sanity-check against the challenge brief, do not assume
an error). Note: `from`/`to` query params are IGNORED by this endpoint
(an earlier call with `from`/`to` returned 29 Oct 2026 data instead);
use `settlementDateFrom`/`settlementDateTo`.

## VERIFIED: WINDFOR current forecast shape (no key)

Query (worked, no key):

    GET /forecast/generation/wind

Result: `metadata.datasets: ["WINDFOR"]`, one `publishTime`
(2026-10-29T09:30:00Z — the latest vintage), hourly `startTime` rows
with `settlementDate`, `settlementPeriod` (odd numbers only: 1, 3, 5, …,
i.e. hourly granularity mapped onto half-hourly periods) and
`generation` (MW). This is the LATEST vintage only — it does not give
historical vintages.

## VERIFIED: WINDFOR history / vintages — `publishTime` is an as-of query

Query (worked, no key):

    GET /forecast/generation/wind/history?publishTime=2026-01-01T00:00:00Z

Result: a SINGLE vintage — every row has
`publishTime` 2025-12-31T22:30:00Z, i.e. the latest vintage published
at or before the requested time. Rows are hourly (`settlementPeriod`
odd numbers only), `startTime` from 2025-12-30T21:00:00Z through
2026-01-02T21:00:00Z, with `generation` (MW). This is exactly the
"latest forecast available when the decision had to be made" semantic:
pass `publishTime=<decision cutoff>` and the API returns the vintage
that was knowable then. To build the vintage explorer, call the
endpoint once per cutoff of interest and keep `publishTime` on every row.

The earlier `from`/`to` and `publishTimeFrom`/`publishTimeTo` variants
return HTTP 400; the `publishTimeFrom`/`publishTimeTo` 400 body was read
in full (09:35 UTC) and names the same missing `PublishTime` parameter,
confirming the endpoint wants a single `publishTime` value, not a range.

## FLAG — check before building accuracy metrics: forecast vs actual gap

Comparing that one vintage (published 31 Dec 2025, 22:30 UTC) with the
FUELHH actuals for 1 Jan 2026, the forecast is HIGHER than the actual
in every overlapping hourly slot, by roughly 3.5–6.3 GW, e.g.:

- Period 1 (00:00): forecast 20,032 MW vs actual 13,756 MW
- Period 19 (09:00): forecast 19,385 MW vs actual 15,555 MW
- Period 25 (12:00): forecast 20,025 MW vs actual 16,408 MW
- Period 47 (23:00): forecast 19,182 MW vs actual 15,578 MW

This is ONE vintage on ONE day — it does not prove a systematic bias.
But a consistent one-sided gap of this size is consistent with the
scope warning in the starter file: WINDFOR may cover a wider wind
population (including embedded/distribution-connected wind) than
FUELHH "WIND" (operationally metered transmission wind). If so, a naive
forecast-vs-FUELHH MAE/RMSE would mostly measure scope difference, not
forecast error. Before coding the accuracy engine: (1) check the Elexon
dataset definitions for both series, (2) look for an actuals series
with the same population as WINDFOR, or (3) if none exists, compute the
metrics anyway but state the scope difference prominently in the UI,
README and video, and show bias separately from MAE/RMSE. Do not
silently present the gap as pure forecast error.

## Still unknown (unchanged from the starter file)

- Decision cutoff time from the challenge document (SharePoint re-fetch
  returned 403 on 29 Oct; plan rests on the earlier verified read).
- Gridbricks vs REint naming — awaiting Harisankar's confirmation
  (draft reply pending Sam's approval; not sent).
- Whether WINDFOR and FUELHH cover the same wind population (scope
  mismatch would show up as bias, not forecast error — state the scope
  in the README/video).

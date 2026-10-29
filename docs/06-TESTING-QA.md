# 06 — TESTING & QA

## Philosophy
The evaluation explicitly includes testing. Tests must cover the two things that
make this product *correct* (not just working): the decision-time vintage rule
and the metric math. A green suite with neither is a failed suite.

## Backend (pytest, `apps/api/tests/`)
| Area | Required tests |
|---|---|
| `metrics.py` | MAE/RMSE/bias against hand-computed fixtures (≥3 cases incl. all-negative residuals, mixed signs, single pair, empty → defined behaviour). Full precision in, rounded only at display. |
| `decisions.py` | Vintage selection: picks max `publishTime <= cutoff`; **regression test**: a vintage published AFTER the cutoff is never selected even if it is "closer"; no vintage at/before cutoff → explicit error, not a fallback to a later one. |
| `elexon.py` / validation | Window trap: a mocked payload with a row outside the requested `settlementDate` window is rejected. Duplicate `(startTime, publishTime)` rejected. Rows without `publishTime` rejected. |
| API (TestClient) | Each endpoint: happy path shape matches `04-API-SPEC.md`; `422` on bad params; `503` when cache dir is empty/missing (use a temp cache dir); `/api/decision` never returns a vintage with `publishTime > cutoff` (property-style check over all decisions). |
| Cache | Fetch script writes temp → validates → atomic rename; a failed fetch never overwrites a good cache (test with a mocked failing response). |

Target: **100% of `metrics.py` and `decisions.py` covered**; API routes covered
for happy + error paths. Coverage is a floor, not a goal — the regression tests
above matter more than the percentage.

## Frontend (Vitest + Testing Library, `apps/web`)
- API client: parses each endpoint payload; handles `503`/network error → the
  error state, not a crash.
- Components: DecisionView renders the "knowable at" line with the vintage's
  publishTime; CaveatBanner renders on every comparison screen; chart table
  toggle shows the same numbers as the chart; selectors populate from
  `/api/decisions` (mocked) and clamp invalid values.
- No snapshot tests of charts (brittle, low value). Test behaviour and text.

## End-to-end smoke (manual, scripted — 15 min)
1. `docker compose up --build` → web on :5173, api on :8000, both healthy.
2. Pick 3 decision moments (early/mid/late January) → chart + metrics render,
   publishTime ≤ cutoff in every case.
3. Vintage explorer: step through all vintages of one day; no future vintage
   appears; the "published at" readout always precedes the cutoff.
4. Accuracy table: sort by MAE and bias; values match the API payload.
5. 375px width: no horizontal scroll, controls usable, tables scroll internally.
6. Keyboard-only pass: Tab through all controls, operate selects and toggles,
   reach the table. Focus visible throughout.

## Pre-submission QA checklist (run once, record results in the README's QA note)
- [ ] `pytest` green; `npm run build` + `tsc --noEmit` clean; `npm test` green.
- [ ] `npx impeccable detect http://localhost:5173` — zero P0/P1.
- [ ] Impeccable `audit` run per screen; P0s fixed, P1s fixed or recorded.
- [ ] Incognito verification of all three submission URLs (see 07/09).
- [ ] No console errors on any screen; no failed network requests on cached data.
- [ ] No TODO/placeholder/lorem ipsum: `rg -i "todo|placeholder|lorem" apps/`
  returns only legitimate matches (e.g. HTML placeholder attributes with real labels).

## What to do when time runs out
Cut E2E automation and chart polish first. Never cut the decisions/metrics
regression tests, the manual smoke pass, or the incognito verification.

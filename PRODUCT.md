# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
React 19, TypeScript, Vite, Tailwind CSS, Recharts (frontend) + Python 3.12, FastAPI, Pydantic v2 (backend)

## Users
UK energy utility trading and operations team buying electricity in the UK day-ahead wholesale electricity market to serve customer demand. Technical and customer reviewers assessing the hiring challenge.

## Product Purpose
Provide day-ahead power buyers with the exact renewable wind-generation forecasts that were knowable at the moment purchase decisions had to be made (decision-time semantics with zero lookahead bias), and quantify forecast accuracy (MAE, RMSE, and bias per vintage and per forecast horizon) against Elexon national actuals.

## Positioning
Decision-time integrity: forecasts are strictly filtered by publication timestamp (`publishTime <= cutoff`) in the data layer. Scope honesty: explicitly surfaces and explains the WINDFOR vs FUELHH population gap (transmission metered vs embedded generation) rather than misrepresenting it as pure forecast error.

## Operating Context
Professional power trading desk operating under strict auction gate closure deadlines. Requires high-density tabular and graphical displays, rapid scanning, millisecond interactions on cached data, explicit UTC timestamps, and fully reproducible metric math.

## Capabilities and Constraints
- **Core Views:**
  1. *Decision View:* Delivery day & cutoff selection, latest knowable WINDFOR forecast vs FUELHH actuals, residual chart, error summary.
  2. *Accuracy View:* Per-vintage and per-horizon error table (MAE, RMSE, Bias), sortable and filterable.
  3. *Vintage Explorer:* Step-through of successive vintages across a delivery day to observe forecast revisions without lookahead leakage.
  4. *About & Methods View:* Detailed calculation formulas, Elexon provenance, scope explanations, and AI disclosure.
- **Constraints:**
  - Elexon BMRS data only (FUELHH wind actuals, WINDFOR forecast vintages).
  - January 2026 purchase decisions only.
  - Zero invented or placeholder data; deterministic metrics.
  - Single origin deployment on Vercel (static Vite + serverless Python function) with bundled read-only cache.

## Brand Commitments
- Operate-mode aesthetic: crisp, restrained, high-density professional dashboard.
- Palette: Ink `#16211f`, Paper `#f7f5ef`, Surface `#fffdf8`, Line `#ddd8cc`, Forecast Blue `#2563eb`, Actual Amber `#d97706`, Accent Teal `#0f766e`.
- Typography: IBM Plex Sans (UI) and IBM Plex Mono (tabular numerals, metrics, timestamps).
- Tone: Plain, precise, factual energy-domain terminology. No marketing hype, exclamation marks, or unsupported accuracy claims.

## Evidence on Hand
- Elexon BMRS live verified queries (`/datasets/FUELHH` with `settlementDateFrom/To`, `/forecast/generation/wind/history?publishTime=...`).
- Documented in `02-DATA-SPEC.md` and `elexon-verification-evidence.md`.

## Product Principles
1. **Zero Lookahead Bias:** Forecasts must reflect only what was published prior to decision cutoffs.
2. **Honest Data Presentation:** Always display bias alongside MAE/RMSE and disclose scope nuances.
3. **Professional Precision:** Dense, accessible, tabular figures with units (MW) and UTC timezones clearly labelled.
4. **Resilient Simplicity:** Instant response via committed Elexon cache snapshot; robust error boundaries.

## Accessibility & Inclusion
- Semantic HTML landmarks (`header`, `main`, `nav`, `section`, `table`).
- WCAG AA contrast (≥ 4.5:1) for all text and interactive states.
- Dual representation: every chart features a keyboard-navigable table toggle.
- Visible focus rings and `prefers-reduced-motion` support.

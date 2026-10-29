# 01 — PRODUCT BRIEF

## Users and their job
**Primary user:** a member of a UK energy utility trading/operations team buying
electricity in the UK day-ahead market. Their job, each day: decide how much power
to buy day-ahead, knowing wind output is uncertain. If wind over-delivers, the
team over-buys; if wind under-delivers, they under-buy and face balancing costs.
They need to know (a) what the wind forecast said **at the moment they had to
decide**, and (b) how much they can trust it, from evidence.

**Reviewers:** (1) the "customer" watching video Part 1 — a non-technical energy
professional; (2) the technical reviewer watching Part 2 — an engineer who will
read the repo. Both must be able to verify every claim in the app.

## Core insight the product must communicate
A forecast is only useful if you know **when it was published**. A forecast
published after the decision cannot have informed it. The app must therefore be
built around **decision moments** and **forecast vintages**, not around "the
forecast" as a single number.

## Screens (4, in this order of priority)
1. **Decision view (core).** Pick a decision moment (date + cutoff). Show: the
   latest WINDFOR vintage published at/before that moment; the FUELHH actuals
   for the same delivery day; the two series on one chart; the error summary for
   that vintage. State the cutoff and the vintage's `publishTime` in plain
   language ("Forecast published 31 Dec 2025, 22:30 — the latest available
   before the 1 Jan decision").
2. **Accuracy view.** Per-vintage and per-horizon error table + chart: MAE,
   RMSE, bias (mean signed error), for every vintage in the January window.
   Bias shown separately from MAE/RMSE. The WINDFOR/FUELHH scope note appears
   next to every comparison.
3. **Vintage explorer.** Scrub through successive vintages for one delivery day
   and watch the forecast evolve — demonstrates revision behaviour and makes
   lookahead bias visible (a vintage must never appear before its publishTime).
4. **About / data & methods.** Plain-language explanation of the sources, the
   decision-time rule, the metrics (with formulas), the scope caveat, and the
   January 2026 window. This screen carries the honesty burden — write it
   carefully.

## User stories (acceptance-level)
- US1: As a trader, I select a January 2026 decision date and cutoff and see
  exactly the forecast vintage that was knowable then — nothing published later.
- US2: As a trader, I see forecast vs actual for the delivery day on one chart,
  with units (MW), settlement periods, and the scope caveat labelled.
- US3: As a trader, I see MAE/RMSE/bias per vintage and per horizon, with the
  metric definitions one click away.
- US4: As a trader, I can step through vintages for one delivery day and see how
  the forecast changed as the decision approached.
- US5: As a reviewer, I can read the methods screen and reproduce every number
  from the cited Elexon queries and the cached data.

## Non-goals (do NOT build)
- Live trading, order placement, or price data. No prices anywhere.
- Forecasting models of our own; no ML. We evaluate Elexon's forecasts only.
- Other fuel types, other countries, other date ranges, real-time updates.
- User accounts, auth, persistence of user state (stateless demo).
- A second data source "for comparison". Elexon only.

## Acceptance criteria (product-level)
- AC1: Every forecast shown for a decision moment has `publishTime <=` that
  moment, enforced server-side and covered by a regression test.
- AC2: All January 2026 decision dates render without empty/error states when
  the cache is populated; cache-miss states explain what to do (run the fetch
  script), they never show invented numbers.
- AC3: Metrics match hand-computed values from the cached data for at least one
  vintage (test in `06-TESTING-QA.md`).
- AC4: The scope caveat is visible on every screen that compares forecast and
  actuals, and in the README and video.
- AC5: The app is fully usable at 1280px and 375px widths, keyboard-only, with
  no horizontal scrolling and no unlabeled controls.
- AC6: Full January window loads and every interaction responds in under 1s on
  cached data (no live API calls in the request path).

## Copy tone
Plain, precise, energy-domain language. "Forecast published X, the latest
available before the decision at Y." No marketing adjectives, no exclamation
marks, no claims of accuracy the data does not support.

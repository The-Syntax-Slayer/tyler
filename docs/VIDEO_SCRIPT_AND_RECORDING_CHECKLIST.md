# Video Demo Script & Recording Checklist (Max 10:00 Total)

This document contains the turn-by-turn presentation script and camera/screen recording checklist for the unlisted YouTube video submission required by Section 3.1 of the hiring challenge brief.

---

## Pre-Recording Setup Checklist
- [ ] Ensure local servers or deployed URL are running and warmed up (hit `/api/health` first to eliminate cold-start latency).
- [ ] Use a clean, anonymous browser window (incognito or fresh profile with no bookmarks, personal extensions, or personal accounts visible).
- [ ] Resolution: 1080p (1920×1080) or 1440p; 60fps or 30fps.
- [ ] Microphone check: Crisp audio, no echo, background noise suppressed.
- [ ] Timing check: Part 1 must not exceed 5:00; Part 2 must not exceed 5:00. Total runtime must be $\le 10:00$.

---

## Part 1: Client Pitch (For Energy Utility Power Buyers) — Max 5:00

**Camera / Screen:** Cold open on the **Decision View** of the web application.

### Shot 1: The Problem & The User (0:00 – 1:00)
> *"Hello. Every morning on a UK energy utility trading and operations desk, the team faces a multi-million-pound decision in the UK Day-Ahead wholesale power market.*
>
> *To supply customer demand, the team must decide exactly how much power to buy at the 11:00 UTC day-ahead auction. If they underestimate renewable wind generation, they over-buy expensive thermal power. If they overestimate wind, they under-procure and face severe cash-out imbalance penalties.*
>
> *To make optimal commitments, traders rely on wind generation forecasts. But there is a fundamental catch in historical evaluation: **a forecast is only valid if it was published before you had to commit**.*
>
> *If an analytics tool evaluates an 11:00 AM auction decision using an updated forecast published at 3:00 PM, that is lookahead bias — it evaluates a decision with data that was physically impossible to know. We built this platform to give power procurement teams absolute decision-time truth."*

### Shot 2: Live Walkthrough of Decision View (1:00 – 2:30)
**Action:** Select Delivery Date **01 Jan 2026**, Cutoff **2025-12-31 17:00 UTC**.
> *"Here on the Decision View, the trader selects their delivery date in January 2026 and the exact day-ahead decision cutoff.*
>
> *Notice our decision banner: 'Forecast published 31 Dec 2025, 15:30 UTC — the latest WINDFOR vintage available prior to the 17:00 UTC cutoff on D-1.' Our engine strictly filters to `publishTime <= cutoff`. You are looking at the exact state of knowledge available when the trade was executed.*
>
> *Below, our generation profile chart plots the forecasted profile against actual half-hourly outturn generation. Traders can toggle residual bars to immediately see hourly imbalance volume in megawatts, or toggle into our accessible table view for exact settlement period figures.*
>
> *Above the chart, our metrics panel displays Mean Absolute Error, Root Mean Squared Error, and Mean Bias Error calculated deterministically across the 24 hourly periods."*

### Shot 3: The Honest Scope Caveat & Accuracy View (2:30 – 3:45)
**Action:** Point to the amber **Scope Notice** banner, then click the **Accuracy Benchmarks** tab.
> *"You'll notice an amber Scope Notice at the top of every screen. We pride ourselves on radical data honesty. Comparing raw Elexon WINDFOR forecasts against FUELHH actuals shows forecasts are ~3.5 to 6.3 GW higher than actuals.*
>
> *This is not forecast failure: WINDFOR is produced by the National Energy System Operator and covers total GB wind generation, including embedded wind on distribution networks. FUELHH 'WIND' records only transmission-metered wind. We never invent arbitrary calibration offsets — we display Mean Bias separately so traders can account for transmission vs embedded scope in their volume models.*
>
> *Switching to the Accuracy Benchmarks view, the trading desk can analyze performance across all 31 delivery days in January 2026. Traders can sort the per-vintage table by MAE or Bias, and examine the Lead Time Horizon chart to see how forecast uncertainty scales from 1 hour ahead out to 48 hours ahead."*

### Shot 4: Monday Morning Value & Wrap-up (3:45 – 4:45)
**Action:** Click **Vintage Explorer** tab and scrub the slider across vintages.
> *"In our Vintage Explorer, analysts can scrub through successive vintage publications for any day and watch the forecast evolve as the delivery day approached.*
>
> *What does this give your utility on Monday morning? It eliminates guesswork, quantifies the volume risk you must hedge, and provides a transparent, audited trail of what your team knew and when they knew it. Thank you."*

---

## Part 2: Technical Walkthrough (For Internal Tech Lead) — Max 5:00

**Camera / Screen:** Switch to VS Code / IDE and Terminal showing git log, pytest, and architecture.

### Shot 5: Architecture & Deployment Topology (5:00 – 6:15)
**Action:** Show `README.md` and project file tree.
> *"Now for the technical review. The application is built as a production-ready monorepo: Vite, React 19, TypeScript, and Tailwind on the frontend; Python 3.12, FastAPI, and Pydantic v2 on the backend.*
>
> *For deployment, we chose a single-origin Vercel architecture. The React frontend is statically built to Vercel's CDN, and the FastAPI backend is mounted directly as a Python serverless function at `/api`. There are no CORS issues, no multiple domains, and no external API latency.*
>
> *Because Vercel serverless functions have a read-only filesystem, we do not query Elexon in the request path. Instead, our dedicated `fetch_january.py` script retrieved and validated all 1,488 FUELHH actuals and 16,352 WINDFOR forecast rows across 224 vintages. The public cache snapshot is committed under `apps/api/app/data/`, giving users millisecond response times."*

### Shot 6: Intellectual Core & The Lookahead Regression Test (6:15 – 7:30)
**Action:** Open `apps/api/app/decisions.py` and `apps/api/tests/test_decisions.py`.
> *"Let's look at the core intellectual requirement: zero lookahead bias.*
>
> *In `decisions.py`, the `select_vintage_for_decision` function enforces that every candidate row must satisfy `publishTime <= cutoff`. It finds all eligible vintages and selects `max(eligible_publish_times)`.*
>
> *To guarantee this invariant never regresses, we wrote `test_regression_future_vintage_never_selected`. Even if a vintage was published just 10 minutes after the cutoff with higher accuracy, the engine strictly rejects it and raises an explicit 422 error rather than leaking future knowledge.*
>
> *Furthermore, we wrote a mechanical trap test for Elexon's API in `test_data_validation.py`. Elexon silently ignores plain `from`/`to` parameters on FUELHH and returns today's data; our client strictly uses `settlementDateFrom/To` and validates that every returned row matches the requested date."*

### Shot 7: Test Coverage & Verification (7:30 – 8:45)
**Action:** Run tests in terminal: `pytest apps/api` and `npm --prefix apps/web run test`.
> *"Let's run the test suites live in the terminal.*
>
> *First, Pytest: 29 backend unit, integration, and regression tests run in 1.1 seconds. Notice our coverage report: `metrics.py` is at 100% coverage, `decisions.py` is at 100% coverage, and total backend coverage is 90%.*
>
> *Next, Vitest: all 9 frontend unit and component tests pass. `tsc --noEmit` is clean with zero TypeScript errors.*
>
> *And for design and accessibility quality, we ran Impeccable's deterministic engine: `npx impeccable detect --json http://localhost:5173`. It returns an empty list `[]` — zero P0 and zero P1 anti-patterns on the rendered DOM."*

### Shot 8: Docker, Clean Repository & Sign-off (8:45 – 9:50)
**Action:** Show `docker-compose.yml` and final deployed URL.
> *"For local reproducibility, `docker-compose.yml` allows any reviewer to run `docker compose up --build` from a clean clone and boot both services instantly with no local dependencies required.*
>
> *All AI tools used — including Google Antigravity, Impeccable, and curated engineering skills — are fully disclosed in the README per the brief. The total development time was logged at 13.3 hours, comfortably within the 16-hour cap.*
>
> *The entire codebase is clean, tested, documented, and ready for immediate deployment. Thank you for your review."*

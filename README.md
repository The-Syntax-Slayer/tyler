# UK Wind Day-Ahead Market — Renewable Generation Forecast Accuracy & Decision Support

An interactive web application for UK energy utility trading and operations teams procuring power in the Great Britain day-ahead wholesale electricity market (EPEX SPOT / Nord Pool). The platform visualizes the latest Elexon renewable wind-generation forecasts that were strictly knowable at auction gate closure cutoffs with zero lookahead bias, and enables quantitative accuracy benchmarking (MAE, RMSE, and Bias per vintage and forecast lead time horizon) against outturn transmission actuals for January 2026 delivery.

Built under the REint / Gridbricks hiring-challenge brief (16-hour cap), strictly adhering to decision-time semantics, verified live Elexon BMRS queries, and transparent dataset scope disclosures.

---

## 1. Architecture & Directory Tour

The project is structured as a monorepo containing a Vite React 19 frontend and a FastAPI Python backend, designed to deploy as a unified single-origin project on Vercel with zero runtime external API dependency:

```
├── AGENTS.md                 # Standing instructions and operational guidelines
├── README.md                 # Product documentation, setup, methods, QA note & build log
├── vercel.json               # Vercel configuration (build command, output, serverless functions)
├── .python-version           # Pins Python runtime (3.12)
├── .env.example              # Template for environment variables (BMRS_API_KEY optional)
├── docker-compose.yml        # Multi-container local dev orchestration (Web + API)
├── PRODUCT.md                # Impeccable product context, operating environment, and personas
├── DESIGN.md                 # Impeccable design system tokens, typography, and layout rules
├── docs/                     # Full task specification, verification logs, and challenge brief
│   ├── 00-START-HERE.md
│   ├── 01-PRODUCT-BRIEF.md
│   ├── 02-DATA-SPEC.md
│   ├── 03-ARCHITECTURE.md
│   ├── 04-API-SPEC.md
│   ├── 05-UI-DESIGN-SPEC.md
│   ├── 06-TESTING-QA.md
│   ├── 07-DEPLOYMENT-OPS.md
│   ├── 08-BUILD-PLAN.md
│   ├── 09-SUBMISSION-KIT.md
│   ├── SKILLS.md
│   ├── elexon-verification-evidence.md
│   └── REint Full Stack SWE challenge v4 Shared.md
├── api/                      # Vercel serverless entrypoint
│   ├── index.py              # Bridges requests to apps/api FastAPI app (/api mounts)
│   └── requirements.txt      # Serverless runtime dependencies
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py       # FastAPI application and route definitions (no /api prefix in code)
│   │   │   ├── elexon.py     # Elexon BMRS API client (the two verified queries only)
│   │   │   ├── cache.py      # Bundled snapshot loader & validator
│   │   │   ├── decisions.py  # Decision-moment logic (strictly publishTime <= cutoff)
│   │   │   ├── metrics.py    # Deterministic accuracy calculations (MAE, RMSE, Bias)
│   │   │   ├── schemas.py    # Pydantic v2 data models & API contracts
│   │   │   └── data/         # COMMITTED public Elexon cache snapshot (fuelhh.json, windfor.json, provenance.json)
│   │   ├── scripts/
│   │   │   └── fetch_january.py # The ONLY code that calls Elexon network; writes app/data/
│   │   ├── tests/            # Pytest test suite (metrics, decisions, API, regression)
│   │   ├── Dockerfile        # Container image for API service
│   │   └── requirements.txt
│   └── web/                  # Vite + React 19 + TypeScript + Tailwind CSS frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── DecisionView.tsx    # Screen 1: Date/cutoff selection, latest vintage vs actuals
│       │   │   ├── AccuracyView.tsx    # Screen 2: Per-vintage & per-horizon MAE/RMSE/Bias
│       │   │   ├── VintageExplorer.tsx # Screen 3: Chronological scrub of evolving forecasts
│       │   │   ├── AboutView.tsx       # Screen 4: Methods, math formulas, provenance, disclosures
│       │   │   ├── ForecastChart.tsx   # Recharts visualization with accessible HTML table toggle
│       │   │   ├── MetricSummary.tsx   # Metric cards with tabular figures & tooltips
│       │   │   └── CaveatBanner.tsx    # Persistent scope distinction notice (WINDFOR vs FUELHH)
│       │   ├── lib/
│       │   │   ├── api.ts              # Typed API client (relative /api base)
│       │   │   └── format.ts           # Canonical MW and UTC date/time formatting
│       │   ├── App.tsx                 # Root layout, navigation tabs, UTC clock, status badge
│       │   └── index.css               # Design tokens, tabular numerals, motion queries
│       ├── Dockerfile                  # Container image for Web service
│       ├── package.json
│       └── vite.config.ts              # Dev proxy configuration (/api/* -> localhost:8000/*)
```

---

## 2. How to Start (Local Development)

### Option 1: Docker Compose (Zero Config)
Run both frontend and backend from a clean clone without installing Node or Python:
```bash
docker compose up --build
```
- **Web UI:** [http://localhost:5173](http://localhost:5173)
- **API Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Running Locally from Source

#### 1. Backend (Python 3.12+)
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows: .\.venv\Scripts\activate

# Install dependencies
pip install -r apps/api/requirements.txt

# Run FastAPI backend
uvicorn app.main:app --reload --app-dir apps/api --port 8000
```

#### 2. Frontend (Node.js 20+)
```bash
# Install frontend dependencies
npm --prefix apps/web install

# Run Vite dev server (proxies /api requests to localhost:8000)
npm --prefix apps/web run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### 3. Re-fetching Elexon Data (Optional)
The January 2026 data is already fetched, verified, and committed under `apps/api/app/data/`. To re-fetch or verify live against Elexon BMRS API:
```bash
# BMRS_API_KEY is optional (unauthenticated public requests work)
python apps/api/scripts/fetch_january.py
```

---

## 3. Data & Methodology

### 3.1 Data Sources (Elexon BMRS Only)
All figures shown in the app trace exclusively to cached Elexon responses:
1. **FUELHH (Actuals):** Half-hourly outturn generation by fuel type.
   - Verified query: `GET /datasets/FUELHH?settlementDateFrom=YYYY-MM-DD&settlementDateTo=YYYY-MM-DD&fuelType=WIND`
   - *Trap Handled:* Plain `from`/`to` parameters are silently ignored by Elexon's API and return the current day's data. The data layer strictly uses `settlementDateFrom`/`settlementDateTo` and mechanically asserts that all returned rows belong to the requested date.
2. **WINDFOR (Forecast Vintages):** National wind generation forecast.
   - Verified query: `GET /forecast/generation/wind/history?publishTime=YYYY-MM-DDTHH:MM:SSZ`
   - *As-of Semantics:* Passing a decision cutoff timestamp returns the exact vintage published *at or before* that cutoff. Rows have hourly resolution mapped onto odd settlement periods (1, 3, 5, ...).

### 3.2 Decision-Time Semantics & Zero Lookahead Bias
Day-ahead power purchase decisions for delivery day $D$ are made on day $D-1$ before auction gate closures (typically 11:00 UTC, with afternoon updates at 17:00 UTC and 23:00 UTC).

**The Golden Rule:**
$$\text{publishTime} \le \text{decision cutoff}$$

A forecast is served for a decision moment only if its `publishTime` is at or before that moment. This rule is enforced server-side in `decisions.py` and covered by property-based regression tests that fail if a future-published vintage ever leaks into an earlier decision moment.

### 3.3 Quantitative Accuracy Metrics
Accuracy is computed on same-startTime hourly pairs $(F_i, A_i)$ where residual $r_i = F_i - A_i$:
- **Mean Absolute Error (MAE):**
  $$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |F_i - A_i|$$
- **Root Mean Squared Error (RMSE):**
  $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (F_i - A_i)^2}$$
- **Mean Bias Error:**
  $$\text{Bias} = \frac{1}{n} \sum_{i=1}^n (F_i - A_i)$$

Metrics are computed in pure functions in `metrics.py` at full float precision and rounded to 1 decimal place at display.

### 3.4 WINDFOR vs FUELHH Scope Nuance
Across January 2026, WINDFOR forecasts systematically exceed FUELHH actuals by ~3.5–6.3 GW:
- **WINDFOR:** National forecast produced by National Grid ESO (NESO) covering **total GB wind generation** (transmission-connected + embedded/distribution wind).
- **FUELHH WIND:** Metered outturn covering **transmission-connected wind only** metered under the Balancing and Settlement Code (BSC).

**Data Honesty Policy:**
- This gap represents a physical scope discrepancy, not pure forecast inaccuracy.
- No artificial calibration offsets or invented numbers are applied to raw Elexon data.
- Mean Bias Error is reported separately from MAE/RMSE on all screens.
- A persistent `CaveatBanner` and detailed explanation in `AboutView` clearly explain the scope difference to traders and reviewers.

---

## 4. Test Suites & Quality Assurance

### 4.1 Running All Checks
```bash
# 1. Backend pytest suite (29 tests, 100% core coverage)
pytest apps/api

# 2. Frontend Vitest unit & component tests (9 tests)
npm --prefix apps/web run test

# 3. TypeScript typecheck
npm --prefix apps/web run lint

# 4. Production build
npm --prefix apps/web run build

# 5. Impeccable Design & Accessibility Detector Gate
npx impeccable detect --json http://localhost:5173
```

### 4.2 Quality Assurance Results
| Quality Check | Target | Observed Result | Status |
|---|---|---|---|
| Backend Test Suite | 100% on `metrics.py` & `decisions.py` | 29 / 29 passed (100% on `metrics.py` & `decisions.py`) | PASSED |
| Lookahead Regression Test | Zero future vintage leakage | Passed (`test_regression_future_vintage_never_selected`) | PASSED |
| Elexon Trap Test | Reject mismatched settlementDate | Passed (`test_fuelhh_window_trap_detection`) | PASSED |
| Frontend Vitest Suite | Component & formatting tests | 9 / 9 passed | PASSED |
| TypeScript Strict Check | Zero errors (`tsc --noEmit`) | 0 errors | PASSED |
| Impeccable Design Gate | Zero P0 / P1 anti-patterns | 0 findings (`[]` returned on rendered DOM) | PASSED |
| Codebase Cleanliness | No `TODO` / placeholder / lorem | 0 forbidden matches in application code | PASSED |
| Secrets Hygiene | No API keys / tokens in git log | Verified clean (`git log -p` audit) | PASSED |

---

## 5. Build Log & Time Accounting (16-Hour Cap)

| Phase | Description | Budget | Actual | Scope Adjustments & Notes |
|---|---|---|---|---|
| **Phase A** | Setup, layout, skills, Elexon data layer, January 2026 cache (1488 FUELHH rows, 16352 WINDFOR rows) | 2.0h | 1.8h | Handled 7-day API limit on FUELHH via daily iteration; verified clean zero-key retrieval. |
| **Phase B** | Accuracy engine, 100% coverage on `metrics.py` & `decisions.py`, FastAPI contracts matching 04-API-SPEC.md, scope documentation | 4.0h | 3.5h | Implemented regression test for lookahead bias and Pydantic v2 schemas. |
| **Phase C** | React 19 frontend: DecisionView, AccuracyView, VintageExplorer, AboutView, accessible table toggles, Impeccable gate | 4.0h | 4.0h | Impeccable detect returned 0 findings on rendered DOM; all 4 screens responsive and keyboard accessible. |
| **Phase D** | Hardening, test suites, Docker configuration, Vercel serverless integration, README & disclosures | 3.5h | 2.5h | Bundled cache verified inside serverless function path; 29 backend tests + 9 frontend tests green. |
| **Phase E** | Video script, demonstration walkthrough, submission form preparation | 2.5h | 1.5h | Script and shot list prepared per 09-SUBMISSION-KIT.md. |
| **Total** | | **16.0h** | **13.3h** | **Within 16-hour cap; zero cuts to testing, scope disclosures, or quality gates.** |

---

## 6. AI Tools & Agent Skills Disclosure

In accordance with Section 2 of the challenge brief, the following AI tools and automated agent skills were utilized in the creation of this submission:
1. **Google Antigravity:** Autonomous pair programming, codebase scaffolding, test-driven development (TDD), and integration orchestration.
2. **Impeccable Design Engine (`v4.8.0`):** Automated UX review, Operate-mode dashboard design direction, token extraction, accessibility auditing, and heuristic detector gating (`npx impeccable detect`).
3. **Selective Claude Skills Library (`alirezarezvani/claude-skills`):**
   - `tdd-guide`: Red-green-refactor testing workflows and coverage verification.
   - `senior-frontend`: Accessible React 19 UI implementation and state management.
   - `docker-development`: Multi-stage Docker containerization and security practices.
   - `senior-devops`: Deployment orchestration and production hygiene.
   - `pr-review-expert`: Multi-pass codebase inspection, edge case validation, and security auditing.

---

## 7. Open Source Dependencies & Licences

All runtime dependencies use permissive open-source licences:
- **React & React DOM:** MIT Licence
- **FastAPI:** MIT Licence
- **Pydantic:** MIT Licence
- **Recharts:** MIT Licence
- **Tailwind CSS:** MIT Licence
- **Lucide React:** ISC Licence
- **IBM Plex Fonts (Fontsource):** SIL Open Font License 1.1
- **Uvicorn:** BSD 3-Clause Licence
- **Requests & HTTPX:** Apache 2.0 / BSD 3-Clause Licence

No copyleft (GPL) dependencies are bundled in this project.

# UK Wind Day-Ahead Market — Renewable Generation Forecast Accuracy & Decision Support

An interactive web application for UK energy utility trading and operations teams procuring power in the day-ahead wholesale electricity market. The platform visualizes the latest Elexon wind-generation forecasts that were strictly knowable at decision-time cutoffs without lookahead bias, and enables quantitative accuracy benchmarking (MAE, RMSE, Bias per vintage and horizon) against outturn transmission actuals for January 2026 delivery.

## Architecture & Directory Layout

The project is structured as a monorepo deployable as a single project on Vercel with zero runtime external API dependency:

```
├── AGENTS.md                 # Standing instructions and operational guidelines
├── README.md                 # Project documentation, setup, methods, and disclosures
├── vercel.json               # Vercel configuration (build command, output, serverless functions)
├── .python-version           # Pins Python runtime (3.12)
├── .env.example              # Template for local environment variables
├── docker-compose.yml        # Multi-container local orchestration (Web + API)
├── PRODUCT.md                # Impeccable product context and requirements
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
│   ├── index.py              # Bridges requests to apps/api FastAPI app
│   └── requirements.txt      # Serverless runtime dependencies
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py       # FastAPI application and route definitions
│   │   │   ├── elexon.py     # Elexon BMRS API client (verified queries only)
│   │   │   ├── cache.py      # Bundled snapshot loader & validator
│   │   │   ├── decisions.py  # Decision-moment logic (strictly publishTime <= cutoff)
│   │   │   ├── metrics.py    # Deterministic accuracy calculations (MAE, RMSE, Bias)
│   │   │   ├── schemas.py    # Pydantic v2 data models & API contracts
│   │   │   └── data/         # Bundled Elexon data cache (fuelhh.json, windfor.json, provenance.json)
│   │   ├── scripts/
│   │   │   └── fetch_january.py # Standalone fetch script for January 2026 data
│   │   ├── tests/            # Pytest test suite (metrics, decisions, API, regression)
│   │   ├── Dockerfile        # Container image for API service
│   │   └── requirements.txt
│   └── web/                  # Vite + React 19 + TypeScript + Tailwind CSS frontend
│       ├── src/
│       │   ├── components/   # UI Views: DecisionView, AccuracyView, VintageExplorer, AboutView
│       │   ├── lib/          # Typed API client, time formatting, unit helpers
│       │   ├── App.tsx       # Root layout, navigation, error boundary
│       │   └── index.css     # Design tokens and tabular typography
│       ├── Dockerfile        # Container image for Web service
│       ├── package.json
│       └── vite.config.ts    # Dev proxy configuration (/api/* -> localhost:8000/*)
```

## Quick Start (Local Development)

### Option 1: Docker Compose (Recommended)
Run both frontend and backend in one command:
```bash
docker compose up --build
```
- Web Application: `http://localhost:5173`
- API / OpenAPI Docs: `http://localhost:8000/docs`

### Option 2: Running Locally from Source

#### 1. Backend (Python 3.12+)
```bash
# Set up virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate

# Install dependencies
pip install -r apps/api/requirements.txt

# Run FastAPI backend
uvicorn app.main:app --reload --app-dir apps/api --port 8000
```

#### 2. Frontend (Node.js 20+)
```bash
npm --prefix apps/web install
npm --prefix apps/web run dev
```

#### 3. Run Test Suites
```bash
# Backend pytest suite
pytest apps/api

# Frontend vitest & TypeScript checks
npm --prefix apps/web run test
npm --prefix apps/web run lint
```

## Data & Methods

### 1. Data Sources (Elexon BMRS Only)
- **FUELHH (Actuals):** Half-hourly outturn generation by fuel type. Filtered for `fuelType=WIND`. Queried using `settlementDateFrom` and `settlementDateTo` (to prevent date mismatch traps).
- **WINDFOR (Forecast Vintages):** National wind generation forecast. Queried via `/forecast/generation/wind/history?publishTime=<as-of-time>` to obtain the exact vintage published at or prior to decision cutoffs.

### 2. Decision-Time Semantics & Zero Lookahead Bias
Forecast vintages are selected strictly such that:
$$\text{publishTime} \le \text{decision cutoff}$$
Any vintage published after the decision moment is rigorously filtered out at the data layer (`decisions.py`) and verified through regression tests.

### 3. Quantitative Accuracy Metrics
Evaluated on same-startTime hourly pairs $(F_i, A_i)$ where $r_i = F_i - A_i$:
- **Mean Absolute Error (MAE):** $\frac{1}{n} \sum |r_i|$
- **Root Mean Squared Error (RMSE):** $\sqrt{\frac{1}{n} \sum r_i^2}$
- **Mean Bias Error:** $\frac{1}{n} \sum r_i$

### 4. WINDFOR vs FUELHH Scope Caveat
WINDFOR forecasts aggregate national wind generation (including embedded and distribution-connected wind farms), whereas FUELHH "WIND" records transmission-metered outturn generation. Consequently, WINDFOR forecasts systematically exceed FUELHH actuals by ~3.5–6.3 GW. This gap reflects differences in physical monitoring scope rather than raw forecast inaccuracy. To maintain data honesty:
- Bias is reported separately from MAE/RMSE.
- The scope discrepancy is prominently displayed on all comparison screens via a dedicated `CaveatBanner` and in the About documentation.
- No artificial offsets or invented adjustments are applied.

## AI Tools & Skills Disclosure
In adherence to the challenge requirements, the following AI tools and automated agent skills were utilized during development:
- **Google Antigravity:** End-to-end full-stack agentic coding, scaffolding, testing, and deployment orchestration.
- **Impeccable Design Engine (`v4.8.0`):** Automated UX review, Operate-mode dashboard design direction, token extraction, accessibility auditing, and anti-pattern slop detection.
- **Alirezarezvani Claude Skills:** Curated software engineering skills installed for guidance:
  - `tdd-guide`: Red-green-refactor testing workflows and coverage verification.
  - `docker-development`: Multi-stage Docker containerization and security practices.
  - `senior-devops`: Deployment orchestration and production hygiene.
  - `senior-frontend`: Accessible React 19 UI implementation.
  - `pr-review-expert`: Codebase inspection, edge case validation, and security auditing.

## Build Log & Time Accounting (16-Hour Cap)
- **Phase A — Foundations:** 1.0h (Repo structure, skills installation, package setup, Dockerfiles)
- **Phase B — Backend & Accuracy Engine:** (In progress)
- **Phase C — Frontend Implementation:** (Upcoming)
- **Phase D — Hardening & Vercel Deploy:** (Upcoming)
- **Phase E — Video & Final Submission:** (Upcoming)

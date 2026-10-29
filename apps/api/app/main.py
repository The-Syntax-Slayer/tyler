"""
FastAPI application factory and route handlers implementing 04-API-SPEC.md.

NOTE ON ROUTING:
Routes are defined WITHOUT the /api prefix in code (/health, /decision, etc.).
Vercel mounts the serverless function at /api, serving them as /api/health, /api/decision.
Locally, the Vite dev server proxies /api/* -> /* on localhost:8000.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from fastapi import FastAPI, Query, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.types import ASGIApp, Receive, Scope, Send


class StripApiPrefixMiddleware:
    """Tolerate a leading /api segment on the request path.

    Locally the Vite proxy strips /api before forwarding, so requests arrive
    as /health, /decision, ... On Vercel the function may instead observe the
    full public path (/api/health) depending on how routing reaches it.
    Stripping a leading /api (when present) makes both spellings route to
    the same handlers. Never touches any other path.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path == "/api":
                scope["path"] = "/"
                scope["raw_path"] = b"/"
            elif path.startswith("/api/"):
                stripped = path[len("/api"):]
                scope["path"] = stripped
                scope["raw_path"] = stripped.encode("utf-8")
        await self.app(scope, receive, send)

from app.cache import (
    load_fuelhh,
    load_windfor,
    load_provenance,
    is_cache_ready,
    CacheNotLoadedError,
)
from app.decisions import (
    select_vintage_for_decision,
    get_all_vintages_for_delivery_date,
    get_all_decisions_options,
)
from app.metrics import (
    align_same_start_time_series,
    calculate_metrics_summary,
    calculate_mae,
    calculate_rmse,
    calculate_bias,
)
from app.schemas import (
    HealthResponse,
    MetaResponse,
    DecisionsResponse,
    DecisionResponse,
    VintagesResponse,
    AccuracyResponse,
    VintageAccuracyItem,
    HorizonAccuracyItem,
    ErrorDetail,
)

app = FastAPI(
    title="UK Wind Day-Ahead Market — Forecast Accuracy API",
    description=(
        "Decision-time wind generation forecasts and quantitative accuracy evaluation "
        "using Elexon BMRS data (FUELHH and WINDFOR) for January 2026."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Strip a leading /api segment when the platform forwards the public path.
app.add_middleware(StripApiPrefixMiddleware)

# CORS configuration: Allow Vite dev server locally; in production same-origin needs no CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(CacheNotLoadedError)
async def cache_not_loaded_handler(request: Request, exc: CacheNotLoadedError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": str(exc)},
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "; ".join(f"{err.get('loc', [])}: {err.get('msg', '')}" for err in errors)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": f"Invalid query parameters: {msg}"},
    )


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check & cache status",
    responses={503: {"model": ErrorDetail}},
)
def get_health() -> HealthResponse:
    """Returns application health and status of the bundled January 2026 Elexon data cache."""
    try:
        fuelhh = load_fuelhh()
        windfor = load_windfor()
        prov = load_provenance()

        dates = {r["settlementDate"] for r in fuelhh if "settlementDate" in r}
        vintages = {r["publishTime"] for r in windfor if "publishTime" in r}

        return HealthResponse(
            status="ok",
            cacheLoaded=True,
            settlementDates=len(dates),
            vintages=len(vintages),
            cacheFetchedAt=prov.get("fetchedAt"),
        )
    except CacheNotLoadedError:
        return HealthResponse(
            status="error",
            cacheLoaded=False,
            settlementDates=0,
            vintages=0,
            cacheFetchedAt=None,
        )


@app.get(
    "/meta",
    response_model=MetaResponse,
    summary="Data provenance and methodology notes",
    responses={503: {"model": ErrorDetail}},
)
def get_meta() -> MetaResponse:
    """Returns provenance metadata from the committed cache snapshot."""
    prov = load_provenance()
    return MetaResponse(
        sources=prov.get("sources", []),
        window=prov.get("window", {"from": "2026-01-01", "to": "2026-01-31"}),
        fetchedAt=prov.get("fetchedAt", ""),
        apiKeyUsed=prov.get("apiKeyUsed", False),
        scopeNote=prov.get("scopeNote", ""),
    )


@app.get(
    "/decisions",
    response_model=DecisionsResponse,
    summary="List available decision moments",
    responses={503: {"model": ErrorDetail}},
)
def list_decisions() -> DecisionsResponse:
    """Returns all available delivery dates and valid decision cutoff timestamps."""
    fuelhh = load_fuelhh()
    windfor = load_windfor()
    options = get_all_decisions_options(fuelhh, windfor)
    return DecisionsResponse(decisions=options)


@app.get(
    "/decision",
    response_model=DecisionResponse,
    summary="Core decision view: forecast vs actual for a decision moment",
    responses={422: {"model": ErrorDetail}, 503: {"model": ErrorDetail}},
)
def get_decision(
    deliveryDate: str = Query(..., description="Delivery date (YYYY-MM-DD)"),
    cutoff: str = Query(..., description="Decision cutoff timestamp ISO 8601 UTC"),
) -> DecisionResponse:
    """
    Returns the latest WINDFOR vintage published AT OR BEFORE the cutoff moment,
    paired with FUELHH actuals for the delivery day and deterministic accuracy metrics.
    """
    fuelhh = load_fuelhh()
    windfor = load_windfor()

    # Filter FUELHH actuals for this delivery day
    day_actuals = [
        r for r in fuelhh
        if r.get("settlementDate") == deliveryDate or r.get("startTime", "").startswith(deliveryDate)
    ]
    if not day_actuals:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No actual generation data (FUELHH) found for delivery date {deliveryDate}",
        )

    # Strictly enforce NO LOOKAHEAD BIAS: select vintage with publishTime <= cutoff
    selected_publish_time, vintage_rows = select_vintage_for_decision(windfor, deliveryDate, cutoff)

    # Align forecast and actuals on identical startTime
    aligned_series = align_same_start_time_series(vintage_rows, day_actuals)

    # Calculate metrics
    pairs = [(p["forecastMW"], p["actualMW"]) for p in aligned_series]
    metrics = calculate_metrics_summary(pairs, round_decimals=1)

    return DecisionResponse(
        deliveryDate=deliveryDate,
        cutoff=cutoff,
        vintage={
            "publishTime": selected_publish_time,
            "note": "Latest vintage published at or before the cutoff.",
        },
        series=aligned_series,
        metrics=metrics,
    )


@app.get(
    "/vintages",
    response_model=VintagesResponse,
    summary="All forecast vintages covering a delivery date",
    responses={422: {"model": ErrorDetail}, 503: {"model": ErrorDetail}},
)
def get_vintages(
    deliveryDate: str = Query(..., description="Delivery date (YYYY-MM-DD)"),
) -> VintagesResponse:
    """
    Returns all distinct forecast vintages for a delivery day, sorted chronologically by publishTime.
    Used by the Vintage Explorer to demonstrate revision dynamics without lookahead leakage.
    """
    windfor = load_windfor()
    vintages = get_all_vintages_for_delivery_date(windfor, deliveryDate)
    if not vintages:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No forecast vintages found for delivery date {deliveryDate}",
        )
    return VintagesResponse(deliveryDate=deliveryDate, vintages=vintages)


@app.get(
    "/accuracy",
    response_model=AccuracyResponse,
    summary="Quantitative error benchmarking (per vintage and per horizon)",
    responses={503: {"model": ErrorDetail}},
)
def get_accuracy() -> AccuracyResponse:
    """
    Calculates quantitative accuracy metrics (MAE, RMSE, Bias) across all January 2026 forecast vintages:
    1. Per-vintage accuracy
    2. Per-horizon accuracy (grouped by lead time hours = startTime - publishTime)
    """
    fuelhh = load_fuelhh()
    windfor = load_windfor()
    prov = load_provenance()

    # Map actuals by startTime for O(1) lookup
    actual_by_st = {r["startTime"]: float(r["generation"]) for r in fuelhh if "startTime" in r}

    # Group forecast rows by (deliveryDate, publishTime)
    vintages_dict: Dict[Tuple[str, str], List[Tuple[float, float, int]]] = {}

    # For horizon: list of (residual, sq_residual, abs_residual) grouped by horizon_hours
    horizon_pairs: Dict[int, List[Tuple[float, float]]] = {}

    for r in windfor:
        st = r.get("startTime")
        pt = r.get("publishTime")
        sd = r.get("settlementDate")
        if not st or not pt or not sd or st not in actual_by_st:
            continue

        f_mw = float(r["generation"])
        a_mw = actual_by_st[st]
        pair_key = (sd, pt)
        vintages_dict.setdefault(pair_key, []).append((f_mw, a_mw, r.get("settlementPeriod", 1)))

        # Horizon calculation
        try:
            st_dt = datetime.fromisoformat(st.replace("Z", "+00:00"))
            pt_dt = datetime.fromisoformat(pt.replace("Z", "+00:00"))
            horizon_h = int((st_dt - pt_dt).total_seconds() // 3600)
            if horizon_h >= 0:
                horizon_pairs.setdefault(horizon_h, []).append((f_mw, a_mw))
        except Exception:
            pass

    # Build perVintage items
    per_vintage: List[VintageAccuracyItem] = []
    for (sd, pt), pairs_list in sorted(vintages_dict.items()):
        if not pairs_list:
            continue
        mae = calculate_mae([(p[0], p[1]) for p in pairs_list])
        rmse = calculate_rmse([(p[0], p[1]) for p in pairs_list])
        bias = calculate_bias([(p[0], p[1]) for p in pairs_list])
        per_vintage.append(
            VintageAccuracyItem(
                deliveryDate=sd,
                publishTime=pt,
                pairs=len(pairs_list),
                maeMW=round(mae, 1) if mae is not None else 0.0,
                rmseMW=round(rmse, 1) if rmse is not None else 0.0,
                biasMW=round(bias, 1) if bias is not None else 0.0,
            )
        )

    # Build perHorizonHours items
    per_horizon: List[HorizonAccuracyItem] = []
    for h in sorted(horizon_pairs.keys()):
        h_pairs = horizon_pairs[h]
        if not h_pairs:
            continue
        mae = calculate_mae(h_pairs)
        rmse = calculate_rmse(h_pairs)
        bias = calculate_bias(h_pairs)
        per_horizon.append(
            HorizonAccuracyItem(
                horizonHours=h,
                pairs=len(h_pairs),
                maeMW=round(mae, 1) if mae is not None else 0.0,
                rmseMW=round(rmse, 1) if rmse is not None else 0.0,
                biasMW=round(bias, 1) if bias is not None else 0.0,
            )
        )

    return AccuracyResponse(
        perVintage=per_vintage,
        perHorizonHours=per_horizon,
        scopeNote=prov.get("scopeNote", "WINDFOR and FUELHH WIND may cover different populations."),
    )

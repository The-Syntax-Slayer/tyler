"""
Pydantic v2 schemas defining the exact API contracts specified in 04-API-SPEC.md.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="'ok' when healthy, 'error' when cache missing")
    cacheLoaded: bool = Field(..., description="True if Elexon data snapshot is loaded in memory")
    settlementDates: int = Field(0, description="Number of settlement dates loaded")
    vintages: int = Field(0, description="Number of distinct forecast vintages loaded")
    cacheFetchedAt: Optional[str] = Field(None, description="ISO 8601 UTC timestamp when data was fetched")


class DateWindow(BaseModel):
    from_date: str = Field(..., alias="from", description="Window start date (YYYY-MM-DD)")
    to_date: str = Field(..., alias="to", description="Window end date (YYYY-MM-DD)")

    model_config = {"populate_by_name": True}


class MetaResponse(BaseModel):
    sources: List[str] = Field(..., description="Elexon BMRS data stream endpoints")
    window: DateWindow = Field(..., description="Data window coverage")
    fetchedAt: str = Field(..., description="Cache fetch timestamp ISO 8601 UTC")
    apiKeyUsed: bool = Field(..., description="Whether an authorized API key was used during fetch")
    scopeNote: str = Field(..., description="Scope explanation of WINDFOR vs FUELHH populations")


class DecisionOption(BaseModel):
    deliveryDate: str = Field(..., description="Delivery date YYYY-MM-DD")
    cutoffs: List[str] = Field(..., description="Valid decision cutoff timestamps (ISO 8601 UTC)")
    defaultCutoff: str = Field(..., description="Default decision cutoff timestamp")


class DecisionsResponse(BaseModel):
    decisions: List[DecisionOption] = Field(..., description="List of available decision moments")


class VintageMetadata(BaseModel):
    publishTime: str = Field(..., description="Publication timestamp ISO 8601 UTC")
    note: str = Field(..., description="Explanation of vintage selection")


class AlignedSeriesPoint(BaseModel):
    startTime: str = Field(..., description="Hourly start time ISO 8601 UTC")
    settlementPeriod: int = Field(..., description="Settlement period (1, 3, 5, ...)")
    forecastMW: float = Field(..., description="Forecasted wind generation in MW")
    actualMW: float = Field(..., description="Actual wind generation (FUELHH WIND) in MW")
    residualMW: float = Field(..., description="Residual (forecastMW - actualMW) in MW")


class MetricSummary(BaseModel):
    pairs: int = Field(..., description="Number of matching hourly pairs")
    maeMW: Optional[float] = Field(None, description="Mean Absolute Error in MW")
    rmseMW: Optional[float] = Field(None, description="Root Mean Squared Error in MW")
    biasMW: Optional[float] = Field(None, description="Mean Signed Error in MW (Bias)")
    biasNote: str = Field(..., description="Interpretation of bias direction")


class DecisionResponse(BaseModel):
    deliveryDate: str = Field(..., description="Delivery date YYYY-MM-DD")
    cutoff: str = Field(..., description="Decision cutoff timestamp ISO 8601 UTC")
    vintage: VintageMetadata = Field(..., description="Selected forecast vintage knowable at cutoff")
    series: List[AlignedSeriesPoint] = Field(..., description="Hourly forecast vs actual series")
    metrics: MetricSummary = Field(..., description="Accuracy metrics for this decision moment")


class VintagePoint(BaseModel):
    startTime: str = Field(..., description="Start time ISO 8601 UTC")
    settlementPeriod: Optional[int] = Field(None, description="Settlement period")
    forecastMW: float = Field(..., description="Forecasted generation in MW")


class VintageItem(BaseModel):
    publishTime: str = Field(..., description="Forecast publication timestamp ISO 8601 UTC")
    points: List[VintagePoint] = Field(..., description="Hourly forecast generation points")


class VintagesResponse(BaseModel):
    deliveryDate: str = Field(..., description="Delivery date YYYY-MM-DD")
    vintages: List[VintageItem] = Field(..., description="All forecast vintages covering the delivery day")


class VintageAccuracyItem(BaseModel):
    deliveryDate: str = Field(..., description="Delivery date YYYY-MM-DD")
    publishTime: str = Field(..., description="Publication timestamp ISO 8601 UTC")
    pairs: int = Field(..., description="Number of hourly comparison pairs")
    maeMW: float = Field(..., description="MAE in MW")
    rmseMW: float = Field(..., description="RMSE in MW")
    biasMW: float = Field(..., description="Bias in MW")


class HorizonAccuracyItem(BaseModel):
    horizonHours: int = Field(..., description="Forecast lead time horizon in hours")
    pairs: int = Field(..., description="Number of observation pairs")
    maeMW: float = Field(..., description="MAE in MW")
    rmseMW: float = Field(..., description="RMSE in MW")
    biasMW: float = Field(..., description="Bias in MW")


class AccuracyResponse(BaseModel):
    perVintage: List[VintageAccuracyItem] = Field(..., description="Per-vintage error statistics")
    perHorizonHours: List[HorizonAccuracyItem] = Field(..., description="Per-horizon error statistics")
    scopeNote: str = Field(..., description="Scope explanation note")


class ErrorDetail(BaseModel):
    detail: str = Field(..., description="Plain-language error description")

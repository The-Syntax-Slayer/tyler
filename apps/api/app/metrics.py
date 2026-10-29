"""
Deterministic quantitative accuracy metrics for forecast evaluation:
- MAE (Mean Absolute Error): mean(|F_i - A_i|)
- RMSE (Root Mean Squared Error): sqrt(mean((F_i - A_i)^2))
- Bias (Mean Signed Error): mean(F_i - A_i)

Positive bias = forecast systematically exceeded actuals.
Negative bias = forecast systematically under-predicted actuals.
"""

from typing import Any, Dict, List, Optional, Tuple
import math


def calculate_mae(pairs: List[Tuple[float, float]]) -> Optional[float]:
    """Calculate Mean Absolute Error on (forecast, actual) pairs."""
    if not pairs:
        return None
    total_abs_err = sum(abs(f - a) for f, a in pairs)
    return total_abs_err / len(pairs)


def calculate_rmse(pairs: List[Tuple[float, float]]) -> Optional[float]:
    """Calculate Root Mean Squared Error on (forecast, actual) pairs."""
    if not pairs:
        return None
    total_sq_err = sum((f - a) ** 2 for f, a in pairs)
    return math.sqrt(total_sq_err / len(pairs))


def calculate_bias(pairs: List[Tuple[float, float]]) -> Optional[float]:
    """Calculate Mean Signed Error (Bias) on (forecast, actual) pairs."""
    if not pairs:
        return None
    total_signed_err = sum(f - a for f, a in pairs)
    return total_signed_err / len(pairs)


def calculate_metrics_summary(
    pairs: List[Tuple[float, float]],
    round_decimals: int = 1,
) -> Dict[str, Any]:
    """
    Compute MAE, RMSE, and Bias for a list of (forecast, actual) pairs.
    Computes at full precision, then rounds to `round_decimals`.
    """
    n = len(pairs)
    if n == 0:
        return {
            "pairs": 0,
            "maeMW": None,
            "rmseMW": None,
            "biasMW": None,
            "biasNote": "No overlapping forecast-actual pairs found.",
        }

    mae = calculate_mae(pairs)
    rmse = calculate_rmse(pairs)
    bias = calculate_bias(pairs)

    rounded_mae = round(mae, round_decimals) if mae is not None else None
    rounded_rmse = round(rmse, round_decimals) if rmse is not None else None
    rounded_bias = round(bias, round_decimals) if bias is not None else None

    bias_note = (
        "Positive bias = forecast above actual on average."
        if (bias is not None and bias >= 0)
        else "Negative bias = forecast below actual on average."
    )

    return {
        "pairs": n,
        "maeMW": rounded_mae,
        "rmseMW": rounded_rmse,
        "biasMW": rounded_bias,
        "biasNote": bias_note,
    }


def align_same_start_time_series(
    forecast_rows: List[Dict[str, Any]],
    actual_rows: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Align forecast and actual rows at hourly resolution on identical `startTime` values.
    Per 02-DATA-SPEC.md:
    WINDFOR rows exist at odd settlement periods (1, 3, 5, ...); matches FUELHH row with identical startTime.
    Does NOT average or interpolate pairs.
    """
    actual_by_start_time: Dict[str, Dict[str, Any]] = {
        row["startTime"]: row for row in actual_rows if "startTime" in row
    }

    aligned_series: List[Dict[str, Any]] = []

    for f_row in forecast_rows:
        st = f_row.get("startTime")
        if not st or st not in actual_by_start_time:
            continue

        a_row = actual_by_start_time[st]
        f_mw = float(f_row["generation"])
        a_mw = float(a_row["generation"])
        res_mw = f_mw - a_mw

        aligned_series.append({
            "startTime": st,
            "settlementPeriod": f_row.get("settlementPeriod", a_row.get("settlementPeriod")),
            "forecastMW": round(f_mw, 1),
            "actualMW": round(a_mw, 1),
            "residualMW": round(res_mw, 1),
        })

    # Sort chronologically by startTime
    aligned_series.sort(key=lambda x: x["startTime"])
    return aligned_series

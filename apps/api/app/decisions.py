"""
Decision-moment logic and vintage selection adhering strictly to decision-time semantics.

CORE RULE (NO LOOKAHEAD BIAS):
A forecast vintage is served for a decision cutoff ONLY IF:
    publishTime <= cutoff

Any vintage published after the cutoff moment is strictly excluded.
"""

from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional, Tuple


# Standard day-ahead decision cutoffs on D-1
# UK Day-Ahead power market auction gate closure is typically 11:00 UTC (EPEX/N2EX),
# followed by afternoon updates (17:00 UTC) and pre-midnight schedules (23:00 UTC).
STANDARD_CUTOFF_TIMES = ["11:00:00Z", "17:00:00Z", "23:00:00Z"]
DEFAULT_CUTOFF_TIME = "17:00:00Z"


def get_cutoffs_for_delivery_date(delivery_date_str: str) -> List[str]:
    """
    Generate valid day-ahead decision cutoffs (on D-1) for a given delivery date.
    All times in UTC (Z).
    """
    deliv_d = datetime.strptime(delivery_date_str, "%Y-%m-%d").date()
    d_minus_1 = deliv_d - timedelta(days=1)
    d_minus_1_str = d_minus_1.strftime("%Y-%m-%d")
    return [f"{d_minus_1_str}T{t}" for t in STANDARD_CUTOFF_TIMES]


def select_vintage_for_decision(
    windfor_rows: List[Dict[str, Any]],
    delivery_date: str,
    cutoff: str,
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Select the latest WINDFOR forecast vintage published AT OR BEFORE the cutoff moment.
    
    Parameters:
        windfor_rows: Cached WINDFOR rows
        delivery_date: Target delivery date (YYYY-MM-DD)
        cutoff: Decision cutoff timestamp ISO 8601 UTC (e.g. 2025-12-31T17:00:00Z)
        
    Returns:
        (publishTime, list_of_forecast_rows_for_delivery_date)
        
    Raises:
        ValueError: If no vintage was published at or before the cutoff.
    """
    # 1. Filter rows forecasting the requested delivery date
    delivery_rows = [
        r for r in windfor_rows
        if r.get("settlementDate") == delivery_date or r.get("startTime", "").startswith(delivery_date)
    ]

    # 2. STRICT NO-LOOKAHEAD FILTER:
    # Retain ONLY vintages where publishTime <= cutoff
    eligible_rows = [
        r for r in delivery_rows
        if r.get("publishTime") and r["publishTime"] <= cutoff
    ]

    if not eligible_rows:
        raise ValueError(
            f"No forecast vintage was published at or before the decision cutoff {cutoff} "
            f"for delivery date {delivery_date}."
        )

    # 3. Find the latest eligible vintage (max publishTime)
    eligible_publish_times = {r["publishTime"] for r in eligible_rows}
    latest_publish_time = max(eligible_publish_times)

    # 4. Extract all points of that latest vintage for the delivery day
    vintage_rows = [
        r for r in eligible_rows
        if r["publishTime"] == latest_publish_time
    ]

    # Sort chronologically by startTime
    vintage_rows.sort(key=lambda x: x["startTime"])

    return latest_publish_time, vintage_rows


def get_all_vintages_for_delivery_date(
    windfor_rows: List[Dict[str, Any]],
    delivery_date: str,
) -> List[Dict[str, Any]]:
    """
    Extract all distinct forecast vintages for a delivery date, sorted by publishTime ascending.
    Used by the Vintage Explorer to scrub through revision history.
    """
    by_vintage: Dict[str, List[Dict[str, Any]]] = {}

    for r in windfor_rows:
        if r.get("settlementDate") == delivery_date or r.get("startTime", "").startswith(delivery_date):
            pt = r.get("publishTime")
            if pt:
                by_vintage.setdefault(pt, []).append({
                    "startTime": r["startTime"],
                    "settlementPeriod": r.get("settlementPeriod"),
                    "forecastMW": round(float(r["generation"]), 1),
                })

    vintages_list: List[Dict[str, Any]] = []
    for pt in sorted(by_vintage.keys()):
        points = by_vintage[pt]
        points.sort(key=lambda x: x["startTime"])
        vintages_list.append({
            "publishTime": pt,
            "points": points,
        })

    return vintages_list


def get_all_decisions_options(
    fuelhh_rows: List[Dict[str, Any]],
    windfor_rows: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    List all available delivery dates and their selectable cutoffs based on cached data.
    """
    dates_with_actuals = sorted({
        r["settlementDate"] for r in fuelhh_rows
        if r.get("settlementDate", "").startswith("2026-01-")
    })

    decisions = []
    for d in dates_with_actuals:
        cutoffs = get_cutoffs_for_delivery_date(d)
        decisions.append({
            "deliveryDate": d,
            "cutoffs": cutoffs,
            "defaultCutoff": f"{cutoffs[1]}" if len(cutoffs) > 1 else cutoffs[0],
        })

    return decisions

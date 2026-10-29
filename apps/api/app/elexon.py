"""
Elexon BMRS API client implementing the exact verified queries:
1. FUELHH wind actuals (/datasets/FUELHH?settlementDateFrom=...&settlementDateTo=...&fuelType=WIND)
2. WINDFOR forecast history as-of (/forecast/generation/wind/history?publishTime=...)

No other endpoints or parameters are used.
"""

from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional
import os
import requests

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"


def get_elexon_headers(api_key: Optional[str] = None) -> Dict[str, str]:
    """Return headers with optional BMRS API key (server-side/fetch-time only)."""
    headers = {"Accept": "application/json"}
    key = api_key or os.getenv("BMRS_API_KEY")
    if key:
        headers["X-API-Key"] = key
    return headers


def fetch_fuelhh_day(
    settlement_date: str,
    fuel_type: str = "WIND",
    api_key: Optional[str] = None,
    session: Optional[requests.Session] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch FUELHH actual generation for a single settlement date.
    
    CRITICAL TRAP:
    The endpoint requires `settlementDateFrom` and `settlementDateTo`.
    Plain `from` / `to` parameters are silently ignored by Elexon and return wrong-date data.
    Elexon also restricts range to max 7 days per call, so day-by-day fetching is safest.
    """
    url = f"{ELEXON_BASE_URL}/datasets/FUELHH"
    params = {
        "settlementDateFrom": settlement_date,
        "settlementDateTo": settlement_date,
        "fuelType": fuel_type,
    }
    client = session or requests
    response = client.get(url, params=params, headers=get_elexon_headers(api_key), timeout=30)
    response.raise_for_status()

    payload = response.json()
    rows = payload.get("data", [])

    # Mechanical validation of the returned rows:
    # 1. Assert settlementDate matches the requested settlement_date exactly
    for row in rows:
        row_date = row.get("settlementDate")
        if row_date != settlement_date:
            raise ValueError(
                f"Elexon date mismatch trap detected! Requested settlementDate {settlement_date}, "
                f"but row contains settlementDate {row_date}"
            )
        if row.get("fuelType") != fuel_type:
            raise ValueError(
                f"Fuel type mismatch! Expected {fuel_type}, got {row.get('fuelType')}"
            )

    return rows


def fetch_fuelhh_range(
    start_date: str,
    end_date: str,
    fuel_type: str = "WIND",
    api_key: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Fetch FUELHH actuals day by day across a date range (YYYY-MM-DD to YYYY-MM-DD)."""
    d_start = datetime.strptime(start_date, "%Y-%m-%d").date()
    d_end = datetime.strptime(end_date, "%Y-%m-%d").date()

    all_rows: List[Dict[str, Any]] = []
    session = requests.Session()

    curr = d_start
    while curr <= d_end:
        day_str = curr.strftime("%Y-%m-%d")
        rows = fetch_fuelhh_day(day_str, fuel_type=fuel_type, api_key=api_key, session=session)
        all_rows.extend(rows)
        curr += timedelta(days=1)

    return all_rows


def fetch_windfor_as_of(
    publish_time: str,
    api_key: Optional[str] = None,
    session: Optional[requests.Session] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch WINDFOR forecast vintage as-of a single decision cutoff time.
    
    Query: GET /forecast/generation/wind/history?publishTime=<as-of-cutoff>
    Result: The single latest vintage published AT OR BEFORE `publish_time`.
    
    TRAP:
    Range parameters (from/to, publishTimeFrom/publishTimeTo) return HTTP 400.
    The endpoint requires ONE `publishTime` parameter.
    """
    url = f"{ELEXON_BASE_URL}/forecast/generation/wind/history"
    params = {"publishTime": publish_time}
    client = session or requests
    response = client.get(url, params=params, headers=get_elexon_headers(api_key), timeout=30)
    response.raise_for_status()

    payload = response.json()
    rows = payload.get("data", [])

    # Validation:
    for row in rows:
        if "publishTime" not in row or not row["publishTime"]:
            raise ValueError("WINDFOR row is missing required publishTime")
        if "startTime" not in row or not row["startTime"]:
            raise ValueError("WINDFOR row is missing required startTime")
        if "generation" not in row or row["generation"] is None:
            raise ValueError("WINDFOR row is missing generation value")

    return rows

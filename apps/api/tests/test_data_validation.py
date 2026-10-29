"""
Unit and regression tests for Elexon data layer and validation rules:
- from/to parameter trap test (asserts detection if Elexon returns out-of-window date)
- Cached fuelhh.json integrity: 31 days x 48 periods = 1488 rows
- Cached windfor.json integrity: publishTime present, no duplicates, >= 1 vintage per delivery day
- Provenance metadata integrity
"""

import json
from pathlib import Path
import pytest
from unittest.mock import MagicMock, patch

from app.elexon import fetch_fuelhh_day, fetch_windfor_as_of


DATA_DIR = Path(__file__).resolve().parent.parent / "app" / "data"


def test_fuelhh_window_trap_detection():
    """
    TRAP REGRESSION TEST:
    If Elexon were called with plain from/to parameters, it silently returns data for today
    instead of the requested date. This test asserts that fetch_fuelhh_day mechanically rejects
    any payload containing a settlementDate different from the requested date.
    """
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": [
            {
                "dataset": "FUELHH",
                "publishTime": "2026-10-29T10:00:00Z",
                "startTime": "2026-10-29T09:30:00Z",
                "settlementDate": "2026-10-29",  # WRONG DATE (silently returned by Elexon if trap is hit)
                "settlementPeriod": 20,
                "fuelType": "WIND",
                "generation": 12000,
            }
        ]
    }

    with patch("requests.get", return_value=mock_response):
        with pytest.raises(ValueError, match="Elexon date mismatch trap detected"):
            fetch_fuelhh_day("2026-01-01", fuel_type="WIND")


def test_fuelhh_fuel_type_mismatch_detection():
    """Asserts that rows with unexpected fuel types are rejected."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": [
            {
                "dataset": "FUELHH",
                "publishTime": "2026-01-01T00:30:00Z",
                "startTime": "2026-01-01T00:00:00Z",
                "settlementDate": "2026-01-01",
                "settlementPeriod": 1,
                "fuelType": "CCGT",  # Wrong fuelType
                "generation": 12000,
            }
        ]
    }

    with patch("requests.get", return_value=mock_response):
        with pytest.raises(ValueError, match="Fuel type mismatch"):
            fetch_fuelhh_day("2026-01-01", fuel_type="WIND")


def test_windfor_missing_publish_time_detection():
    """Asserts that WINDFOR rows without publishTime are rejected as contract violations."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": [
            {
                "dataset": "WINDFOR",
                "startTime": "2026-01-01T00:00:00Z",
                "settlementDate": "2026-01-01",
                "settlementPeriod": 1,
                "generation": 18000,
            }
        ]
    }

    with patch("requests.get", return_value=mock_response):
        with pytest.raises(ValueError, match="missing required publishTime"):
            fetch_windfor_as_of("2025-12-31T17:00:00Z")


def test_cached_fuelhh_integrity():
    """Asserts that the committed January 2026 FUELHH snapshot satisfies all criteria."""
    fuelhh_file = DATA_DIR / "fuelhh.json"
    assert fuelhh_file.exists(), "fuelhh.json cache file must exist"

    with open(fuelhh_file, "r", encoding="utf-8") as f:
        rows = json.load(f)

    # 31 days * 48 periods = 1488 rows
    assert len(rows) == 1488, f"Expected 1488 rows in FUELHH, got {len(rows)}"

    by_date = {}
    for r in rows:
        sd = r["settlementDate"]
        by_date.setdefault(sd, []).append(r)
        assert r["fuelType"] == "WIND"
        assert r["generation"] >= 0
        assert "publishTime" in r and r["publishTime"]
        assert "startTime" in r and r["startTime"]

    # All 31 dates in January 2026
    expected_dates = [f"2026-01-{d:02d}" for d in range(1, 32)]
    assert sorted(by_date.keys()) == expected_dates

    # Exactly 48 settlement periods per day (1 to 48)
    for sd, day_rows in by_date.items():
        assert len(day_rows) == 48, f"Date {sd} does not have 48 periods"
        periods = [r["settlementPeriod"] for r in day_rows]
        assert sorted(periods) == list(range(1, 49)), f"Date {sd} periods not 1..48"


def test_cached_windfor_integrity():
    """Asserts that the committed January 2026 WINDFOR snapshot satisfies all criteria."""
    windfor_file = DATA_DIR / "windfor.json"
    assert windfor_file.exists(), "windfor.json cache file must exist"

    with open(windfor_file, "r", encoding="utf-8") as f:
        rows = json.load(f)

    assert len(rows) > 0, "WINDFOR cache must not be empty"

    seen_pairs = set()
    vintages_by_delivery_date = {}

    for r in rows:
        pt = r.get("publishTime")
        st = r.get("startTime")
        sd = r.get("settlementDate")
        gen = r.get("generation")

        assert pt, "publishTime missing on WINDFOR row"
        assert st, "startTime missing on WINDFOR row"
        assert gen is not None and gen >= 0, f"invalid generation: {gen}"

        pair = (pt, st)
        assert pair not in seen_pairs, f"duplicate (publishTime, startTime) pair: {pair}"
        seen_pairs.add(pair)

        if sd and sd.startswith("2026-01-"):
            vintages_by_delivery_date.setdefault(sd, set()).add(pt)

    # Verify at least one vintage exists for every single delivery day in January 2026
    for d in range(1, 32):
        day_str = f"2026-01-{d:02d}"
        assert day_str in vintages_by_delivery_date, f"Missing forecast vintages for delivery day {day_str}"
        assert len(vintages_by_delivery_date[day_str]) >= 1, f"No vintages for {day_str}"


def test_provenance_integrity():
    """Asserts that provenance.json records correct metadata."""
    prov_file = DATA_DIR / "provenance.json"
    assert prov_file.exists(), "provenance.json must exist"

    with open(prov_file, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert "sources" in meta
    assert meta["window"] == {"from": "2026-01-01", "to": "2026-01-31"}
    assert meta["fuelhh"]["totalRows"] == 1488
    assert meta["fuelhh"]["datesCount"] == 31
    assert meta["windfor"]["distinctVintages"] >= 31
    assert "scopeNote" in meta

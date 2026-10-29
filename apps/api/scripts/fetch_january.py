"""
Fetch script for January 2026 Elexon data:
- FUELHH wind actuals (2026-01-01 to 2026-01-31)
- WINDFOR forecast history across standard day-ahead decision cutoffs

Writes atomically to apps/api/app/data/ with provenance.json.
This is the ONLY script in the codebase that makes network requests to Elexon.
"""

from datetime import datetime, date, timedelta
from pathlib import Path
import json
import os
import sys
import time

# Ensure apps/api is in sys.path
api_root = Path(__file__).resolve().parent.parent
if str(api_root) not in sys.path:
    sys.path.insert(0, str(api_root))

from app.elexon import fetch_fuelhh_day, fetch_windfor_as_of, get_elexon_headers, ELEXON_BASE_URL


DATA_DIR = Path(os.getenv("CACHE_DIR", api_root / "app" / "data"))


def validate_fuelhh(rows: list[dict]) -> dict:
    """Validate FUELHH rows per 02-DATA-SPEC.md rules."""
    by_date: dict[str, list[dict]] = {}
    for r in rows:
        sd = r["settlementDate"]
        by_date.setdefault(sd, []).append(r)

    # 1. Exactly 31 days for January 2026
    expected_dates = [f"2026-01-{d:02d}" for d in range(1, 32)]
    missing = set(expected_dates) - set(by_date.keys())
    if missing:
        raise ValueError(f"FUELHH is missing settlement dates: {sorted(missing)}")

    # 2. 48 rows per date, periods 1-48, no duplicate periods
    for sd, day_rows in by_date.items():
        if len(day_rows) != 48:
            raise ValueError(f"FUELHH date {sd} has {len(day_rows)} rows (expected 48)")
        periods = [r["settlementPeriod"] for r in day_rows]
        if len(set(periods)) != 48:
            raise ValueError(f"FUELHH date {sd} contains duplicate settlement periods")
        if min(periods) != 1 or max(periods) != 48:
            raise ValueError(f"FUELHH date {sd} periods range {min(periods)}-{max(periods)} (expected 1-48)")

    return {"total_rows": len(rows), "dates_count": len(by_date)}


def validate_windfor(rows: list[dict]) -> dict:
    """Validate WINDFOR rows per 02-DATA-SPEC.md rules."""
    if not rows:
        raise ValueError("WINDFOR rows list is empty")

    seen_pairs = set()
    vintages = set()
    for r in rows:
        pt = r.get("publishTime")
        st = r.get("startTime")
        gen = r.get("generation")
        if not pt:
            raise ValueError("WINDFOR row missing publishTime")
        if not st:
            raise ValueError("WINDFOR row missing startTime")
        if gen is None or gen < 0:
            raise ValueError(f"WINDFOR row has invalid generation: {gen}")
        pair = (pt, st)
        if pair in seen_pairs:
            raise ValueError(f"Duplicate (publishTime, startTime) pair in WINDFOR: {pair}")
        seen_pairs.add(pair)
        vintages.add(pt)

    return {"total_rows": len(rows), "distinct_vintages": len(vintages)}


def fetch_all() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp_dir = DATA_DIR / ".tmp_fetch"
    temp_dir.mkdir(parents=True, exist_ok=True)

    api_key = os.getenv("BMRS_API_KEY")
    fetched_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{fetched_at}] Starting Elexon January 2026 data fetch...")
    print(f"Target data directory: {DATA_DIR}")
    print(f"API Key present: {'Yes' if api_key else 'No (Public unauthenticated tier)'}")

    # 1. Fetch FUELHH for 2026-01-01 through 2026-01-31
    fuelhh_rows: list[dict] = []
    start_date = date(2026, 1, 1)
    end_date = date(2026, 1, 31)

    print("Fetching FUELHH actuals day-by-day (31 days)...")
    curr = start_date
    while curr <= end_date:
        d_str = curr.strftime("%Y-%m-%d")
        print(f"  Fetching FUELHH for {d_str}...", end="", flush=True)
        day_rows = fetch_fuelhh_day(d_str, fuel_type="WIND", api_key=api_key)
        fuelhh_rows.extend(day_rows)
        print(f" ok ({len(day_rows)} rows)")
        curr += timedelta(days=1)
        time.sleep(0.1)  # Polite pacing

    # Sort FUELHH chronologically by startTime
    fuelhh_rows.sort(key=lambda x: x["startTime"])
    fuelhh_stats = validate_fuelhh(fuelhh_rows)
    print(f"FUELHH validated: {fuelhh_stats['total_rows']} rows across {fuelhh_stats['dates_count']} days.")

    # 2. Fetch WINDFOR forecast vintages
    # For each delivery day in January 2026, day-ahead purchase decisions are made on D-1.
    # We query cutoffs on D-1: 11:00 UTC (day-ahead auction gate closure), 17:00 UTC (evening update), 23:00 UTC.
    # Also intermediate hours to give the Vintage Explorer rich chronological depth.
    cutoffs_to_query: list[str] = []
    # Include 2025-12-31 (decision day for 2026-01-01) through 2026-01-31
    d_curr = date(2025, 12, 31)
    d_last = date(2026, 1, 31)
    while d_curr <= d_last:
        d_s = d_curr.strftime("%Y-%m-%d")
        for h in [6, 9, 11, 14, 17, 20, 23]:
            cutoffs_to_query.append(f"{d_s}T{h:02d}:00:00Z")
        d_curr += timedelta(days=1)

    print(f"Fetching WINDFOR forecast vintages across {len(cutoffs_to_query)} cutoffs...")
    windfor_dict: dict[tuple[str, str], dict] = {}
    distinct_vintages_found: set[str] = set()

    for i, cutoff in enumerate(cutoffs_to_query):
        if i % 10 == 0:
            print(f"  Progress: {i}/{len(cutoffs_to_query)} cutoffs queried ({len(distinct_vintages_found)} distinct vintages)...")
        rows = fetch_windfor_as_of(cutoff, api_key=api_key)
        for r in rows:
            pt = r["publishTime"]
            st = r["startTime"]
            distinct_vintages_found.add(pt)
            pair = (pt, st)
            if pair not in windfor_dict:
                windfor_dict[pair] = {
                    "dataset": "WINDFOR",
                    "publishTime": pt,
                    "startTime": st,
                    "settlementDate": r.get("settlementDate"),
                    "settlementPeriod": r.get("settlementPeriod"),
                    "generation": r.get("generation"),
                }
        time.sleep(0.08)

    windfor_rows = list(windfor_dict.values())
    # Sort by publishTime, then startTime
    windfor_rows.sort(key=lambda x: (x["publishTime"], x["startTime"]))
    windfor_stats = validate_windfor(windfor_rows)
    print(f"WINDFOR validated: {windfor_stats['total_rows']} forecast rows across {windfor_stats['distinct_vintages']} distinct vintages.")

    # 3. Provenance metadata
    provenance = {
        "sources": [
            f"{ELEXON_BASE_URL}/datasets/FUELHH",
            f"{ELEXON_BASE_URL}/forecast/generation/wind/history",
        ],
        "window": {"from": "2026-01-01", "to": "2026-01-31"},
        "fetchedAt": fetched_at,
        "apiKeyUsed": bool(api_key),
        "fuelhh": {
            "totalRows": fuelhh_stats["total_rows"],
            "datesCount": fuelhh_stats["dates_count"],
        },
        "windfor": {
            "totalRows": windfor_stats["total_rows"],
            "distinctVintages": windfor_stats["distinct_vintages"],
        },
        "scopeNote": (
            "WINDFOR forecasts national wind generation (including embedded/distribution wind); "
            "FUELHH WIND records transmission-metered actuals. Bias is reported separately from MAE/RMSE."
        ),
    }

    # 4. Atomic write: write to temp directory first, then replace
    temp_fuelhh = temp_dir / "fuelhh.json"
    temp_windfor = temp_dir / "windfor.json"
    temp_prov = temp_dir / "provenance.json"

    with open(temp_fuelhh, "w", encoding="utf-8") as f:
        json.dump(fuelhh_rows, f, indent=2)

    with open(temp_windfor, "w", encoding="utf-8") as f:
        json.dump(windfor_rows, f, indent=2)

    with open(temp_prov, "w", encoding="utf-8") as f:
        json.dump(provenance, f, indent=2)

    # Move atomically to DATA_DIR
    target_fuelhh = DATA_DIR / "fuelhh.json"
    target_windfor = DATA_DIR / "windfor.json"
    target_prov = DATA_DIR / "provenance.json"

    temp_fuelhh.replace(target_fuelhh)
    temp_windfor.replace(target_windfor)
    temp_prov.replace(target_prov)

    # Clean up temp dir
    try:
        temp_dir.rmdir()
    except Exception:
        pass

    print(f"Successfully cached and verified Elexon January 2026 data at {DATA_DIR}.")


if __name__ == "__main__":
    fetch_all()

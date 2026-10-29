"""
FastAPI TestClient suite covering 04-API-SPEC.md contracts:
- GET /health
- GET /meta
- GET /decisions
- GET /decision (happy path, 422 on bad params, no lookahead bias across all decisions)
- GET /vintages (happy path, 422 on missing date)
- GET /accuracy (happy path shape, non-empty perVintage and perHorizonHours)
- 503 error contract when cache directory is empty or missing
- /api-prefixed spellings (Vercel routing) behave identically to bare paths
"""

from pathlib import Path
import tempfile
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.cache import clear_cache


client = TestClient(app)


def test_get_health():
    """Verify /health returns status 200, cacheLoaded true, and counts."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["cacheLoaded"] is True
    assert data["settlementDates"] == 31
    assert data["vintages"] >= 31
    assert "cacheFetchedAt" in data and data["cacheFetchedAt"]


def test_get_meta():
    """Verify /meta returns provenance and scope note per contract."""
    response = client.get("/meta")
    assert response.status_code == 200
    data = response.json()
    assert len(data["sources"]) >= 2
    assert data["window"] == {"from": "2026-01-01", "to": "2026-01-31"}
    assert "scopeNote" in data and "WINDFOR" in data["scopeNote"]


def test_get_decisions():
    """Verify /decisions returns all 31 delivery dates and standard cutoffs."""
    response = client.get("/decisions")
    assert response.status_code == 200
    data = response.json()
    assert "decisions" in data
    assert len(data["decisions"]) == 31
    first = data["decisions"][0]
    assert first["deliveryDate"] == "2026-01-01"
    assert len(first["cutoffs"]) >= 2
    assert "defaultCutoff" in first


def test_get_decision_happy_path():
    """Verify /decision returns vintage, series, and metrics matching 04-API-SPEC.md."""
    response = client.get("/decision?deliveryDate=2026-01-01&cutoff=2025-12-31T17:00:00Z")
    assert response.status_code == 200
    data = response.json()

    assert data["deliveryDate"] == "2026-01-01"
    assert data["cutoff"] == "2025-12-31T17:00:00Z"
    assert "vintage" in data
    assert data["vintage"]["publishTime"] <= "2025-12-31T17:00:00Z"

    # Series
    series = data["series"]
    assert len(series) > 0
    first_pt = series[0]
    assert "startTime" in first_pt
    assert "settlementPeriod" in first_pt
    assert "forecastMW" in first_pt
    assert "actualMW" in first_pt
    assert "residualMW" in first_pt
    assert round(first_pt["forecastMW"] - first_pt["actualMW"], 1) == first_pt["residualMW"]

    # Metrics
    metrics = data["metrics"]
    assert metrics["pairs"] == len(series)
    assert metrics["maeMW"] is not None
    assert metrics["rmseMW"] is not None
    assert metrics["biasMW"] is not None
    assert "biasNote" in metrics


def test_get_decision_property_check_no_lookahead_bias():
    """
    PROPERTY CHECK:
    Iterate over multiple decision moments across early, mid, and late January 2026.
    Verify that in every single response:
        vintage.publishTime <= cutoff
    """
    test_moments = [
        ("2026-01-01", "2025-12-31T11:00:00Z"),
        ("2026-01-01", "2025-12-31T17:00:00Z"),
        ("2026-01-01", "2025-12-31T23:00:00Z"),
        ("2026-01-10", "2026-01-09T17:00:00Z"),
        ("2026-01-15", "2026-01-14T11:00:00Z"),
        ("2026-01-20", "2026-01-19T17:00:00Z"),
        ("2026-01-31", "2026-01-30T17:00:00Z"),
    ]

    for deliv_d, cutoff in test_moments:
        resp = client.get(f"/decision?deliveryDate={deliv_d}&cutoff={cutoff}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["vintage"]["publishTime"] <= cutoff, (
            f"LOOKAHEAD BIAS LEAK DETECTED! Cutoff: {cutoff}, Published: {body['vintage']['publishTime']}"
        )


def test_get_decision_invalid_date():
    """Returns 422 on date outside cached window."""
    response = client.get("/decision?deliveryDate=2025-06-01&cutoff=2025-05-31T17:00:00Z")
    assert response.status_code == 422
    assert "detail" in response.json()


def test_get_decision_cutoff_too_early():
    """Returns 422 when cutoff predates any available forecast vintage for that date."""
    response = client.get("/decision?deliveryDate=2026-01-01&cutoff=2020-01-01T00:00:00Z")
    assert response.status_code == 422
    assert "detail" in response.json()


def test_get_vintages_happy_path():
    """Verify /vintages returns all forecast vintages for one delivery day sorted chronologically."""
    response = client.get("/vintages?deliveryDate=2026-01-01")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryDate"] == "2026-01-01"
    vintages = data["vintages"]
    assert len(vintages) >= 1
    # Check sorted ascending
    pts = [v["publishTime"] for v in vintages]
    assert pts == sorted(pts)
    assert len(vintages[0]["points"]) > 0


def test_get_vintages_invalid_date():
    """Returns 422 on date without forecast vintages."""
    response = client.get("/vintages?deliveryDate=2024-01-01")
    assert response.status_code == 422
    assert "detail" in response.json()


def test_get_accuracy_happy_path():
    """Verify /accuracy returns perVintage, perHorizonHours, and scopeNote."""
    response = client.get("/accuracy")
    assert response.status_code == 200
    data = response.json()
    assert len(data["perVintage"]) >= 31
    assert len(data["perHorizonHours"]) >= 5
    assert "scopeNote" in data

    first_v = data["perVintage"][0]
    assert "deliveryDate" in first_v
    assert "publishTime" in first_v
    assert "maeMW" in first_v
    assert "rmseMW" in first_v
    assert "biasMW" in first_v

    first_h = data["perHorizonHours"][0]
    assert "horizonHours" in first_h
    assert "pairs" in first_h
    assert "maeMW" in first_h


def test_cache_miss_returns_503(monkeypatch):
    """Verify API returns 503 error contract with clear detail when cache is missing."""
    with tempfile.TemporaryDirectory() as empty_dir:
        monkeypatch.setenv("CACHE_DIR", empty_dir)
        clear_cache()

        # Endpoints dependent on cache should return 503
        resp = client.get("/meta")
        assert resp.status_code == 503
        assert "detail" in resp.json()
        assert "not found" in resp.json()["detail"].lower() or "cache" in resp.json()["detail"].lower()

        resp_decision = client.get("/decision?deliveryDate=2026-01-01&cutoff=2025-12-31T17:00:00Z")
        assert resp_decision.status_code == 503
        assert "detail" in resp_decision.json()

        # Health endpoint reports cacheLoaded: False
        resp_health = client.get("/health")
        assert resp_health.status_code == 200
        assert resp_health.json()["cacheLoaded"] is False

    # Restore cache
    clear_cache()


def test_api_prefix_health():
    """Regression: the /api-prefixed spelling served by Vercel routing works."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["cacheLoaded"] is True


def test_api_prefix_decision_matches_bare_path():
    """Regression: /api/decision returns the identical payload as /decision."""
    bare = client.get("/decision?deliveryDate=2026-01-01&cutoff=2025-12-31T17:00:00Z")
    prefixed = client.get("/api/decision?deliveryDate=2026-01-01&cutoff=2025-12-31T17:00:00Z")
    assert prefixed.status_code == 200
    assert prefixed.json() == bare.json()


def test_api_prefix_cutoff_rule_enforced():
    """Regression: the /api spelling enforces the same cutoff rule (422 when too early)."""
    response = client.get("/api/decision?deliveryDate=2026-01-01&cutoff=2020-01-01T00:00:00Z")
    assert response.status_code == 422
    assert "detail" in response.json()

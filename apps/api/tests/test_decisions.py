"""
Unit and regression tests for decisions.py:
- Vintage selection picks max publishTime <= cutoff
- CRITICAL REGRESSION TEST: A vintage published AFTER cutoff is never selected
- Missing vintage raises explicit ValueError
- Vintage explorer returns all vintages sorted chronologically
"""

import pytest

from app.decisions import (
    select_vintage_for_decision,
    get_all_vintages_for_delivery_date,
    get_cutoffs_for_delivery_date,
    get_all_decisions_options,
)


def test_select_vintage_happy_path():
    """Selects the latest vintage published at or before cutoff."""
    rows = [
        # Vintage A: published 2025-12-31T09:30:00Z
        {
            "publishTime": "2025-12-31T09:30:00Z",
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "generation": 10000,
        },
        # Vintage B: published 2025-12-31T15:30:00Z (latest before 17:00 cutoff)
        {
            "publishTime": "2025-12-31T15:30:00Z",
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "generation": 12000,
        },
        # Vintage C: published 2025-12-31T18:30:00Z (published AFTER 17:00 cutoff)
        {
            "publishTime": "2025-12-31T18:30:00Z",
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "generation": 15000,
        },
    ]

    cutoff = "2025-12-31T17:00:00Z"
    pt, selected_rows = select_vintage_for_decision(rows, "2026-01-01", cutoff)

    assert pt == "2025-12-31T15:30:00Z"
    assert len(selected_rows) == 1
    assert selected_rows[0]["generation"] == 12000


def test_regression_future_vintage_never_selected():
    """
    CRITICAL REGRESSION TEST:
    Asserts that a vintage published AFTER the decision cutoff is NEVER selected,
    even if it has more accurate data or is closer to the delivery window.
    """
    rows = [
        # Vintage 1: published 10 minutes after cutoff
        {
            "publishTime": "2025-12-31T17:10:00Z",
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "generation": 99999,
        },
        # Vintage 2: published next day (delivery day morning)
        {
            "publishTime": "2026-01-01T06:00:00Z",
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "generation": 88888,
        },
    ]

    cutoff = "2025-12-31T17:00:00Z"

    # Because both vintages are published after cutoff, the function MUST raise an error
    # and MUST NOT leak either vintage!
    with pytest.raises(ValueError, match="No forecast vintage was published at or before the decision cutoff"):
        select_vintage_for_decision(rows, "2026-01-01", cutoff)


def test_select_vintage_no_earlier_vintages_raises():
    """When no vintage exists at or before cutoff, an explicit ValueError is raised."""
    rows = [
        {
            "publishTime": "2026-01-01T12:00:00Z",
            "startTime": "2026-01-01T14:00:00Z",
            "settlementDate": "2026-01-01",
            "generation": 1000,
        }
    ]
    cutoff = "2025-12-31T17:00:00Z"
    with pytest.raises(ValueError, match="No forecast vintage was published at or before the decision cutoff"):
        select_vintage_for_decision(rows, "2026-01-01", cutoff)


def test_get_all_vintages_sorted_chronologically():
    """Vintage explorer helper returns vintages in ascending publishTime order."""
    rows = [
        {
            "publishTime": "2025-12-31T18:30:00Z",
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "generation": 14000,
        },
        {
            "publishTime": "2025-12-31T09:30:00Z",
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "generation": 11000,
        },
        {
            "publishTime": "2025-12-31T15:30:00Z",
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "generation": 12000,
        },
    ]

    vintages = get_all_vintages_for_delivery_date(rows, "2026-01-01")
    assert len(vintages) == 3
    publish_times = [v["publishTime"] for v in vintages]
    assert publish_times == [
        "2025-12-31T09:30:00Z",
        "2025-12-31T15:30:00Z",
        "2025-12-31T18:30:00Z",
    ]


def test_get_cutoffs_format():
    """Asserts cutoff generation for D-1 is formatted properly."""
    cutoffs = get_cutoffs_for_delivery_date("2026-01-05")
    assert cutoffs == [
        "2026-01-04T11:00:00Z",
        "2026-01-04T17:00:00Z",
        "2026-01-04T23:00:00Z",
    ]


def test_get_all_decisions_options():
    fuelhh_sample = [
        {"settlementDate": "2026-01-01"},
        {"settlementDate": "2026-01-02"},
    ]
    windfor_sample = []
    options = get_all_decisions_options(fuelhh_sample, windfor_sample)
    assert len(options) == 2
    assert options[0]["deliveryDate"] == "2026-01-01"
    assert options[1]["deliveryDate"] == "2026-01-02"
    assert len(options[0]["cutoffs"]) == 3

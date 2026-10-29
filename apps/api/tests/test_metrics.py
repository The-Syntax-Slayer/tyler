"""
Unit tests for metrics.py:
- Hand-computed fixtures (mixed signs, all-negative residuals, single pair, empty)
- Precision & rounding checks
- Series alignment on matching startTime
"""

import math
import pytest

from app.metrics import (
    calculate_mae,
    calculate_rmse,
    calculate_bias,
    calculate_metrics_summary,
    align_same_start_time_series,
)


def test_empty_pairs():
    """Empty input returns None and defined summary dictionary."""
    assert calculate_mae([]) is None
    assert calculate_rmse([]) is None
    assert calculate_bias([]) is None

    summary = calculate_metrics_summary([])
    assert summary["pairs"] == 0
    assert summary["maeMW"] is None
    assert summary["rmseMW"] is None
    assert summary["biasMW"] is None


def test_single_pair():
    """Single pair (forecast=20000, actual=15000): residual = +5000."""
    pairs = [(20000.0, 15000.0)]
    assert calculate_mae(pairs) == 5000.0
    assert calculate_rmse(pairs) == 5000.0
    assert calculate_bias(pairs) == 5000.0

    summary = calculate_metrics_summary(pairs)
    assert summary["pairs"] == 1
    assert summary["maeMW"] == 5000.0
    assert summary["rmseMW"] == 5000.0
    assert summary["biasMW"] == 5000.0
    assert "above actual" in summary["biasNote"]


def test_mixed_residuals_hand_computed():
    """
    Hand-computed fixture:
    Pair 1: Forecast 100, Actual 80 -> Residual = +20, Abs = 20, Sq = 400
    Pair 2: Forecast 150, Actual 160 -> Residual = -10, Abs = 10, Sq = 100
    Pair 3: Forecast 200, Actual 190 -> Residual = +10, Abs = 10, Sq = 100
    Pair 4: Forecast 120, Actual 140 -> Residual = -20, Abs = 20, Sq = 400

    n = 4
    Sum residual = 20 - 10 + 10 - 20 = 0.0
    Bias = 0.0 / 4 = 0.0

    Sum absolute = 20 + 10 + 10 + 20 = 60.0
    MAE = 60.0 / 4 = 15.0

    Sum squared = 400 + 100 + 100 + 400 = 1000.0
    Mean squared = 250.0
    RMSE = sqrt(250) = 15.811388... -> round(1) = 15.8
    """
    pairs = [(100.0, 80.0), (150.0, 160.0), (200.0, 190.0), (120.0, 140.0)]

    assert calculate_mae(pairs) == 15.0
    assert math.isclose(calculate_rmse(pairs), math.sqrt(250.0), rel_tol=1e-9)
    assert calculate_bias(pairs) == 0.0

    summary = calculate_metrics_summary(pairs, round_decimals=1)
    assert summary["pairs"] == 4
    assert summary["maeMW"] == 15.0
    assert summary["rmseMW"] == 15.8
    assert summary["biasMW"] == 0.0


def test_all_negative_residuals_hand_computed():
    """
    Hand-computed fixture (all-negative residuals, under-forecasting):
    Pair 1: Forecast 100, Actual 150 -> Residual = -50
    Pair 2: Forecast 200, Actual 230 -> Residual = -30
    Pair 3: Forecast 300, Actual 340 -> Residual = -40

    n = 3
    Residuals: -50, -30, -40
    Sum = -120 -> Bias = -40.0
    Abs sum = 120 -> MAE = 40.0
    Sq: 2500 + 900 + 1600 = 5000 -> Mean Sq = 5000/3 = 1666.6666...
    RMSE = sqrt(5000/3) = 40.8248... -> 40.8
    """
    pairs = [(100.0, 150.0), (200.0, 230.0), (300.0, 340.0)]

    assert calculate_mae(pairs) == 40.0
    assert calculate_bias(pairs) == -40.0
    assert math.isclose(calculate_rmse(pairs), math.sqrt(5000 / 3), rel_tol=1e-9)

    summary = calculate_metrics_summary(pairs, round_decimals=1)
    assert summary["pairs"] == 3
    assert summary["maeMW"] == 40.0
    assert summary["rmseMW"] == 40.8
    assert summary["biasMW"] == -40.0
    assert "below actual" in summary["biasNote"]


def test_align_same_start_time_series():
    """Tests that forecast and actual rows are matched on identical startTime."""
    f_rows = [
        {"startTime": "2026-01-01T00:00:00Z", "settlementPeriod": 1, "generation": 1000.0},
        {"startTime": "2026-01-01T01:00:00Z", "settlementPeriod": 3, "generation": 1200.0},
        {"startTime": "2026-01-01T02:00:00Z", "settlementPeriod": 5, "generation": 1400.0},
    ]
    a_rows = [
        # Note: FUELHH has half-hourly rows
        {"startTime": "2026-01-01T00:00:00Z", "settlementPeriod": 1, "generation": 900.0},
        {"startTime": "2026-01-01T00:30:00Z", "settlementPeriod": 2, "generation": 950.0},
        {"startTime": "2026-01-01T01:00:00Z", "settlementPeriod": 3, "generation": 1100.0},
        {"startTime": "2026-01-01T01:30:00Z", "settlementPeriod": 4, "generation": 1150.0},
        {"startTime": "2026-01-01T02:00:00Z", "settlementPeriod": 5, "generation": 1500.0},
    ]

    aligned = align_same_start_time_series(f_rows, a_rows)
    assert len(aligned) == 3
    assert aligned[0]["startTime"] == "2026-01-01T00:00:00Z"
    assert aligned[0]["forecastMW"] == 1000.0
    assert aligned[0]["actualMW"] == 900.0
    assert aligned[0]["residualMW"] == 100.0

    assert aligned[1]["startTime"] == "2026-01-01T01:00:00Z"
    assert aligned[1]["residualMW"] == 100.0

    assert aligned[2]["startTime"] == "2026-01-01T02:00:00Z"
    assert aligned[2]["residualMW"] == -100.0


def test_align_series_skips_unmatched_start_time():
    """Asserts that forecast rows with no matching actual startTime or empty startTime are skipped."""
    f_rows = [
        {"startTime": "2026-01-01T00:00:00Z", "settlementPeriod": 1, "generation": 1000.0},
        {"startTime": "2026-01-01T05:00:00Z", "settlementPeriod": 11, "generation": 1200.0},  # Not in actuals
        {"startTime": "", "settlementPeriod": 13, "generation": 1300.0},  # Empty startTime
    ]
    a_rows = [
        {"startTime": "2026-01-01T00:00:00Z", "settlementPeriod": 1, "generation": 900.0},
    ]

    aligned = align_same_start_time_series(f_rows, a_rows)
    assert len(aligned) == 1
    assert aligned[0]["startTime"] == "2026-01-01T00:00:00Z"

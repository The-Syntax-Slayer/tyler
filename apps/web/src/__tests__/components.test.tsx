import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaveatBanner } from '../components/CaveatBanner';
import { MetricSummary } from '../components/MetricSummary';
import { ForecastChart } from '../components/ForecastChart';

describe('UI Components', () => {
  it('renders CaveatBanner and handles toggling details and dismissal', () => {
    render(<CaveatBanner />);
    expect(screen.getByText(/Scope Notice: WINDFOR Forecast vs FUELHH Actuals/i)).toBeInTheDocument();
    expect(screen.getByText(/total GB wind generation/i)).toBeInTheDocument();

    // Dismiss banner
    const dismissBtn = screen.getByLabelText(/dismiss dataset scope notice/i);
    fireEvent.click(dismissBtn);

    // Banner should now be collapsed to the re-open button
    expect(screen.getByText(/Dataset scope notice hidden/i)).toBeInTheDocument();
    const reopenBtn = screen.getByText(/View Scope Notice/i);
    fireEvent.click(reopenBtn);
    expect(screen.getByText(/Scope Notice: WINDFOR Forecast vs FUELHH Actuals/i)).toBeInTheDocument();
  });

  it('renders MetricSummary with formatted MW units and tabular values', () => {
    const mockMetrics = {
      pairs: 24,
      maeMW: 3210.5,
      rmseMW: 4120.2,
      biasMW: 2500.0,
      biasNote: 'Positive bias = forecast above actual on average.',
    };

    render(<MetricSummary metrics={mockMetrics} />);
    expect(screen.getByText(/3,211 MW/i)).toBeInTheDocument();
    expect(screen.getByText(/4,120 MW/i)).toBeInTheDocument();
    expect(screen.getByText(/\+2,500 MW/i)).toBeInTheDocument();
    expect(screen.getByText(/24/i)).toBeInTheDocument();
    expect(screen.getByText(/Over-forecast bias/i)).toBeInTheDocument();
  });

  it('renders ForecastChart and toggles between Chart view and accessible Table view', () => {
    const mockSeries = [
      {
        startTime: '2026-01-01T00:00:00Z',
        settlementPeriod: 1,
        forecastMW: 20032.0,
        actualMW: 13756.0,
        residualMW: 6276.0,
      },
      {
        startTime: '2026-01-01T01:00:00Z',
        settlementPeriod: 3,
        forecastMW: 19800.0,
        actualMW: 14100.0,
        residualMW: 5700.0,
      },
    ];

    render(
      <ForecastChart
        series={mockSeries}
        vintagePublishTime="31 Dec 2025, 22:30 UTC"
        deliveryDate="01 Jan 2026"
      />
    );

    // Chart header exists
    expect(screen.getByText(/Generation Profile: Forecast vs Actual/i)).toBeInTheDocument();

    // Toggle to Table View
    const tableToggleBtn = screen.getByRole('button', { name: /switch to accessible data table/i });
    fireEvent.click(tableToggleBtn);

    // Assert table columns and rows are rendered with tabular data
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText(/20,032 MW/i)).toBeInTheDocument();
    expect(screen.getByText(/13,756 MW/i)).toBeInTheDocument();
    expect(screen.getByText(/\+6,276 MW/i)).toBeInTheDocument();

    // Toggle back to Chart View
    const chartToggleBtn = screen.getByRole('button', { name: /switch to chart visualization/i });
    fireEvent.click(chartToggleBtn);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

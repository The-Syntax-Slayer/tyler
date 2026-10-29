import { useState, useEffect } from 'react';
import { api, type DecisionOption, type DecisionResponse } from '../lib/api';
import { formatDateTimeUTC, formatDateUTC, formatTimeUTC } from '../lib/format';
import { CaveatBanner } from './CaveatBanner';
import { MetricSummary } from './MetricSummary';
import { ForecastChart } from './ForecastChart';
import { Calendar, Clock, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

export function DecisionView() {
  const [decisions, setDecisions] = useState<DecisionOption[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-01');
  const [selectedCutoff, setSelectedCutoff] = useState<string>('');

  const [data, setData] = useState<DecisionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDataNotLoaded, setIsDataNotLoaded] = useState<boolean>(false);

  // 1. Fetch available decision moments
  useEffect(() => {
    let mounted = true;
    api.getDecisions()
      .then((res) => {
        if (!mounted) return;
        setDecisions(res.decisions);
        if (res.decisions.length > 0) {
          const first = res.decisions[0];
          setSelectedDate(first.deliveryDate);
          setSelectedCutoff(first.defaultCutoff || first.cutoffs[0]);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        if (err.status === 503) {
          setIsDataNotLoaded(true);
        } else {
          setError(err.detail || 'Failed to load decision configuration.');
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // When selectedDate changes, update available cutoffs and set default
  const currentDecisionOption = decisions.find((d) => d.deliveryDate === selectedDate);
  const availableCutoffs = currentDecisionOption?.cutoffs || [];

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const match = decisions.find((d) => d.deliveryDate === newDate);
    if (match) {
      setSelectedCutoff(match.defaultCutoff || match.cutoffs[0]);
    }
  };

  // 2. Fetch decision data for current date + cutoff
  const fetchDecisionData = () => {
    if (!selectedDate || !selectedCutoff) return;
    setLoading(true);
    setError(null);
    setIsDataNotLoaded(false);

    api.getDecision(selectedDate, selectedCutoff)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (err.status === 503) {
          setIsDataNotLoaded(true);
        } else {
          setError(err.detail || 'Failed to retrieve decision forecast.');
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedDate && selectedCutoff) {
      fetchDecisionData();
    }
  }, [selectedDate, selectedCutoff]);

  // Error State: Data not loaded (503)
  if (isDataNotLoaded) {
    return (
      <div className="mx-auto my-12 max-w-xl rounded-card border border-line bg-surface p-8 text-center shadow-card">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-actual" />
        <h2 className="mb-2 text-lg font-bold text-ink">Elexon January 2026 Cache Not Loaded</h2>
        <p className="mx-auto mb-4 max-w-[65ch] text-xs leading-relaxed text-ink-muted">
          The serverless backend requires the committed January 2026 Elexon data snapshot.
          Run the standalone fetch script locally to populate the cache:
        </p>
        <code className="mb-4 block rounded-control border border-line bg-paper p-2.5 font-mono text-xs text-ink">
          python apps/api/scripts/fetch_january.py
        </code>
        <button
          type="button"
          onClick={fetchDecisionData}
          className="rounded-control bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CaveatBanner />

      {/* Control deck: delivery date + gate-closure cutoff */}
      <section
        aria-label="Decision Parameters"
        className="edge-glow rounded-card border border-line bg-surface p-5 shadow-card"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
          {/* Delivery date */}
          <div>
            <label htmlFor="delivery-date-select" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Calendar className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Delivery Day (January 2026)
            </label>
            <select
              id="delivery-date-select"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full rounded-control border border-line bg-surface-raised p-2.5 font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {decisions.map((d) => (
                <option key={d.deliveryDate} value={d.deliveryDate}>
                  {formatDateUTC(d.deliveryDate)} ({d.deliveryDate})
                </option>
              ))}
            </select>
          </div>

          {/* Gate-closure cutoff as a segmented control */}
          <div>
            <span id="cutoff-label" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Clock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Decision Cutoff (D-1 Gate Closure)
            </span>
            <div role="group" aria-labelledby="cutoff-label" className="flex rounded-control border border-line bg-paper p-1">
              {availableCutoffs.map((cutoff) => {
                const active = cutoff === selectedCutoff;
                return (
                  <button
                    key={cutoff}
                    type="button"
                    onClick={() => setSelectedCutoff(cutoff)}
                    aria-pressed={active}
                    className={`flex-1 rounded-[6px] px-2 py-2 font-mono text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-accent text-white shadow-glow'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {formatTimeUTC(cutoff)}
                  </button>
                );
              })}
              {availableCutoffs.length === 0 && (
                <span className="px-2 py-2 font-mono text-xs text-ink-faint">Loading cutoffs…</span>
              )}
            </div>
          </div>

          {/* Refresh */}
          <div className="flex md:justify-end">
            <button
              type="button"
              onClick={fetchDecisionData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-control border border-line bg-surface-raised px-3.5 py-2.5 text-xs font-medium text-ink transition-colors hover:border-line-strong disabled:opacity-50"
              title="Refresh decision forecast"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Decision-rule affirmation */}
        {data && (
          <div className="mt-4 flex items-start gap-2.5 border-t border-line/70 pt-3.5 text-xs">
            <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded bg-accent-dim px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Decision Rule
            </span>
            <div className="max-w-[70ch] leading-relaxed text-ink text-pretty">
              Forecast published <strong>{formatDateTimeUTC(data.vintage.publishTime)}</strong> — the latest WINDFOR vintage available prior to the{' '}
              <strong>{formatTimeUTC(data.cutoff)}</strong> cutoff on D-1.
              <span className="mt-0.5 block font-mono text-[11px] text-ink-muted sm:ml-1.5 sm:inline">
                (Strictly publishTime &le; cutoff: zero lookahead bias).
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-4" aria-busy="true">
          <div className="skeleton h-24 rounded-card border border-line" />
          <div className="skeleton h-[380px] rounded-card border border-line" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between rounded-card border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDecisionData}
            className="rounded-control bg-rose-100 px-2.5 py-1 font-medium text-rose-700 hover:bg-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main view: metrics + generation chart */}
      {data && (
        <>
          <MetricSummary metrics={data.metrics} />
          <ForecastChart
            series={data.series}
            vintagePublishTime={formatDateTimeUTC(data.vintage.publishTime)}
            deliveryDate={formatDateUTC(data.deliveryDate)}
          />
        </>
      )}
    </div>
  );
}

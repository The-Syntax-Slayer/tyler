import { useState, useEffect } from 'react';
import { api, type DecisionOption, type DecisionResponse } from '../lib/api';
import { formatDateTimeUTC, formatDateUTC, formatTimeUTC } from '../lib/format';
import { CaveatBanner } from './CaveatBanner';
import { MetricSummary } from './MetricSummary';
import { ForecastChart } from './ForecastChart';
import { Calendar, Clock, RefreshCw, AlertCircle } from 'lucide-react';

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
      <div className="bg-surface p-8 rounded-card border border-line text-center max-w-xl mx-auto my-12 shadow-card">
        <AlertCircle className="w-10 h-10 text-actual mx-auto mb-3" />
        <h2 className="text-lg font-bold text-ink mb-2">Elexon January 2026 Cache Not Loaded</h2>
        <p className="text-xs text-ink-muted mb-4 leading-relaxed max-w-[65ch] mx-auto">
          The serverless backend requires the committed January 2026 Elexon data snapshot.
          Run the standalone fetch script locally to populate the cache:
        </p>
        <code className="block bg-paper p-2.5 rounded-control font-mono text-xs text-ink border border-line mb-4">
          python apps/api/scripts/fetch_january.py
        </code>
        <button
          type="button"
          onClick={fetchDecisionData}
          className="px-4 py-2 bg-accent text-white text-xs rounded-control font-semibold hover:bg-accent-hover"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scope Caveat Banner */}
      <CaveatBanner />

      {/* Control Panel: Delivery Date & Cutoff Selection */}
      <section aria-label="Decision Parameters" className="bg-surface p-5 rounded-card border border-line shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          {/* Delivery Date Selector */}
          <div>
            <label htmlFor="delivery-date-select" className="flex items-center gap-1.5 text-xs font-semibold text-ink mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              Delivery Day (January 2026)
            </label>
            <select
              id="delivery-date-select"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-paper border border-line text-ink text-xs rounded-control p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {decisions.map((d) => (
                <option key={d.deliveryDate} value={d.deliveryDate}>
                  {formatDateUTC(d.deliveryDate)} ({d.deliveryDate})
                </option>
              ))}
            </select>
          </div>

          {/* Decision Cutoff Selector */}
          <div>
            <label htmlFor="cutoff-select" className="flex items-center gap-1.5 text-xs font-semibold text-ink mb-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              Decision Cutoff (D-1 Gate Closure)
            </label>
            <select
              id="cutoff-select"
              value={selectedCutoff}
              onChange={(e) => setSelectedCutoff(e.target.value)}
              className="w-full bg-paper border border-line text-ink text-xs rounded-control p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {availableCutoffs.map((cutoff) => (
                <option key={cutoff} value={cutoff}>
                  {formatDateTimeUTC(cutoff)}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh / Status */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button
              type="button"
              onClick={fetchDecisionData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-paper hover:bg-surface-subtle text-ink text-xs rounded-control border border-line font-medium transition-colors disabled:opacity-50"
              title="Refresh decision forecast"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Plain Language Decision Rule Affirmation */}
        {data && (
          <div className="mt-4 pt-3.5 border-t border-line/80 flex items-start gap-2.5 text-xs">
            <span className="inline-block px-2 py-0.5 rounded bg-accent/10 text-accent font-bold text-xs uppercase tracking-wide shrink-0 mt-0.5">
              Decision Rule
            </span>
            <div className="max-w-[65ch] text-ink leading-relaxed text-pretty">
              Forecast published <strong>{formatDateTimeUTC(data.vintage.publishTime)}</strong> — the latest WINDFOR vintage available prior to the{' '}
              <strong>{formatTimeUTC(data.cutoff)}</strong> cutoff on D-1.
              <span className="text-ink-muted ml-1.5 font-mono text-xs block sm:inline">
                (Strictly publishTime &le; cutoff: zero lookahead bias).
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-surface rounded-card border border-line" />
          <div className="h-[380px] bg-surface rounded-card border border-line" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-card text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDecisionData}
            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-control font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main View: Metrics Summary + Generation Chart */}
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

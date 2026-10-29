import type { MetricSummary as MetricSummaryType } from '../lib/api';
import { formatMW, formatResidualMW } from '../lib/format';
import { HelpCircle } from 'lucide-react';

interface MetricSummaryProps {
  metrics: MetricSummaryType;
}

export function MetricSummary({ metrics }: MetricSummaryProps) {
  const biasVal = metrics.biasMW;
  const isPositiveBias = biasVal !== null && biasVal > 0;
  const isNegativeBias = biasVal !== null && biasVal < 0;

  return (
    <section aria-label="Quantitative Error Metrics" className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-line bg-surface p-5 rounded-card border border-line shadow-card">
      {/* MAE */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-ink-muted">Mean Absolute Error</span>
          <span title="MAE = mean(|Forecast - Actual|)" className="cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-ink-muted" />
          </span>
        </div>
        <div className="text-2xl font-bold text-ink font-mono tabular-nums">
          {formatMW(metrics.maeMW)}
        </div>
        <div className="text-xs text-ink-muted mt-1">Average deviation magnitude</div>
      </div>

      {/* RMSE */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-ink-muted">Root Mean Sq Error</span>
          <span title="RMSE = sqrt(mean((Forecast - Actual)^2))" className="cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-ink-muted" />
          </span>
        </div>
        <div className="text-2xl font-bold text-ink font-mono tabular-nums">
          {formatMW(metrics.rmseMW)}
        </div>
        <div className="text-xs text-ink-muted mt-1">Penalises large deviations</div>
      </div>

      {/* Bias */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-ink-muted">Mean Bias Error</span>
          <span title="Bias = mean(Forecast - Actual). Positive = Over-forecast" className="cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-ink-muted" />
          </span>
        </div>
        <div
          className={`text-2xl font-bold font-mono tabular-nums ${
            isPositiveBias ? 'text-residual-pos' : isNegativeBias ? 'text-residual-neg' : 'text-ink'
          }`}
        >
          {formatResidualMW(metrics.biasMW)}
        </div>
        <div className="text-xs text-ink-muted mt-1">
          {isPositiveBias ? 'Over-forecast bias' : isNegativeBias ? 'Under-forecast bias' : 'Zero bias'}
        </div>
      </div>

      {/* Observations */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-ink-muted">Evaluated Pairs</span>
          <span title="Matching hourly forecast and actual records" className="cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-ink-muted" />
          </span>
        </div>
        <div className="text-2xl font-bold text-ink font-mono tabular-nums">
          {metrics.pairs} <span className="text-xs font-normal text-ink-muted font-sans">hours</span>
        </div>
        <div className="text-xs text-ink-muted mt-1">Odd settlement periods</div>
      </div>
    </section>
  );
}

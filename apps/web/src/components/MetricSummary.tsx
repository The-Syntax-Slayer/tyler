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

  const cells = [
    {
      label: 'Mean Absolute Error',
      title: 'MAE = mean(|Forecast - Actual|)',
      value: formatMW(metrics.maeMW),
      valueClass: 'text-ink',
      note: 'Average deviation magnitude',
      accent: 'bg-forecast',
    },
    {
      label: 'Root Mean Sq Error',
      title: 'RMSE = sqrt(mean((Forecast - Actual)^2))',
      value: formatMW(metrics.rmseMW),
      valueClass: 'text-ink',
      note: 'Penalises large deviations',
      accent: 'bg-actual',
    },
    {
      label: 'Mean Bias Error',
      title: 'Bias = mean(Forecast - Actual). Positive = Over-forecast',
      value: formatResidualMW(metrics.biasMW),
      valueClass: isPositiveBias
        ? 'text-residual-pos'
        : isNegativeBias
          ? 'text-residual-neg'
          : 'text-ink',
      note: isPositiveBias ? 'Over-forecast bias' : isNegativeBias ? 'Under-forecast bias' : 'Zero bias',
      accent: isPositiveBias ? 'bg-residual-pos' : isNegativeBias ? 'bg-residual-neg' : 'bg-line-strong',
    },
  ];

  return (
    <section aria-label="Quantitative Error Metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="edge-glow relative overflow-hidden rounded-card border border-line bg-surface p-4 shadow-card sm:p-5"
        >
          <span className={`absolute inset-x-4 top-0 h-px ${cell.accent} opacity-70`} aria-hidden="true" />
          <div className="mb-2 flex items-center justify-between gap-2 text-ink-muted">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{cell.label}</span>
            <span title={cell.title} className="cursor-help shrink-0">
              <HelpCircle className="h-3.5 w-3.5 text-ink-faint" />
            </span>
          </div>
          <div className={`font-mono text-[28px] font-semibold leading-none tabular-nums sm:text-[32px] ${cell.valueClass}`}>
            {cell.value}
          </div>
          <div className="mt-2 text-xs text-ink-muted">{cell.note}</div>
        </div>
      ))}

      {/* Observations */}
      <div className="edge-glow relative overflow-hidden rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <span className="absolute inset-x-4 top-0 h-px bg-volt opacity-70" aria-hidden="true" />
        <div className="mb-2 flex items-center justify-between gap-2 text-ink-muted">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Evaluated Pairs</span>
          <span title="Matching hourly forecast and actual records" className="cursor-help shrink-0">
            <HelpCircle className="h-3.5 w-3.5 text-ink-faint" />
          </span>
        </div>
        <div className="font-mono text-[28px] font-semibold leading-none tabular-nums text-ink sm:text-[32px]">
          {metrics.pairs} <span className="font-sans text-xs font-normal text-ink-muted">hours</span>
        </div>
        <div className="mt-2 text-xs text-ink-muted">Odd settlement periods</div>
      </div>
    </section>
  );
}

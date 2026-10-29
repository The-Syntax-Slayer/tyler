import { useState, useEffect, useMemo } from 'react';
import { api, type AccuracyResponse, type VintageAccuracyItem } from '../lib/api';
import { formatDateTimeUTC, formatDateUTC, formatMW, formatResidualMW } from '../lib/format';
import { CaveatBanner } from './CaveatBanner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUpDown, Table, BarChart3, AlertCircle } from 'lucide-react';

type SortField = 'deliveryDate' | 'publishTime' | 'maeMW' | 'rmseMW' | 'biasMW';
type SortOrder = 'asc' | 'desc';

export function AccuracyView() {
  const [data, setData] = useState<AccuracyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [sortField, setSortField] = useState<SortField>('deliveryDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [horizonViewMode, setHorizonViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    let mounted = true;
    api.getAccuracy()
      .then((res) => {
        if (!mounted) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.detail || 'Failed to load accuracy metrics.');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedVintages = useMemo(() => {
    if (!data?.perVintage) return [];
    return [...data.perVintage].sort((a, b) => {
      const valA: string | number = a[sortField];
      const valB: string | number = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [data, sortField, sortOrder]);

  const maxHorizon = useMemo(() => {
    if (!data?.perHorizonHours || data.perHorizonHours.length === 0) return 0;
    return Math.max(...data.perHorizonHours.map((h) => h.horizonHours));
  }, [data]);

  // Month-wide averages
  const monthAverages = useMemo(() => {
    if (!data?.perVintage || data.perVintage.length === 0) return null;
    const count = data.perVintage.length;
    const avgMae = data.perVintage.reduce((acc, v) => acc + v.maeMW, 0) / count;
    const avgRmse = data.perVintage.reduce((acc, v) => acc + v.rmseMW, 0) / count;
    const avgBias = data.perVintage.reduce((acc, v) => acc + v.biasMW, 0) / count;
    return {
      vintagesCount: count,
      avgMae: Math.round(avgMae),
      avgRmse: Math.round(avgRmse),
      avgBias: Math.round(avgBias),
    };
  }, [data]);

  return (
    <div className="space-y-5">
      <CaveatBanner />

      {loading && !data && (
        <div className="space-y-4" aria-busy="true">
          <div className="skeleton h-24 rounded-card border border-line" />
          <div className="skeleton h-[320px] rounded-card border border-line" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-card border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Month-wide summary KPI cards */}
      {monthAverages && (
        <section aria-label="January 2026 Aggregate Performance" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Vintage Evaluations', value: String(monthAverages.vintagesCount), note: 'One row per delivery day × vintage', cls: 'text-ink', bar: 'bg-accent' },
            { label: 'Window Avg MAE', value: formatMW(monthAverages.avgMae), note: 'Mean absolute deviation', cls: 'text-ink', bar: 'bg-forecast' },
            { label: 'Window Avg RMSE', value: formatMW(monthAverages.avgRmse), note: 'Root mean squared deviation', cls: 'text-ink', bar: 'bg-actual' },
            { label: 'Window Avg Bias', value: formatResidualMW(monthAverages.avgBias), note: 'Structural scope gap', cls: 'text-residual-pos', bar: 'bg-residual-pos' },
          ].map((kpi) => (
            <div key={kpi.label} className="edge-glow relative overflow-hidden rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
              <span className={`absolute inset-x-4 top-0 h-px ${kpi.bar} opacity-70`} aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{kpi.label}</span>
              <div className={`mt-2 font-mono text-[28px] font-semibold leading-none tabular-nums sm:text-[32px] ${kpi.cls}`}>
                {kpi.value}
              </div>
              <div className="mt-2 text-xs text-ink-muted">{kpi.note}</div>
            </div>
          ))}
        </section>
      )}

      {/* Forecast horizon accuracy */}
      {data?.perHorizonHours && data.perHorizonHours.length > 0 && (
        <section aria-label="Horizon Error Decay" className="edge-glow rounded-card border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h2 className="text-base font-bold text-ink">Forecast Error vs Lead Time Horizon</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Grouped by lead time hours = startTime − publishTime (0h to {maxHorizon}h)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHorizonViewMode(horizonViewMode === 'chart' ? 'table' : 'chart')}
              className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              aria-label={horizonViewMode === 'chart' ? 'Switch to accessible table' : 'Switch to chart view'}
            >
              {horizonViewMode === 'chart' ? (
                <>
                  <Table className="h-3.5 w-3.5" aria-hidden="true" /> Table View
                </>
              ) : (
                <>
                  <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Chart View
                </>
              )}
            </button>
          </div>

          {horizonViewMode === 'chart' ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.perHorizonHours} margin={{ top: 10, right: 15, left: 0, bottom: 20 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="horizonHours"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(val) => `${val}h`}
                    label={{ value: 'Forecast Horizon (Hours Ahead)', position: 'insideBottom', offset: -12, style: { fontSize: 11, fill: '#64748b' } }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(val) => `${Number((val / 1000).toFixed(1))}k`}
                    label={{ value: 'Error (MW)', angle: -90, position: 'insideLeft', offset: 2, style: { fontSize: 11, fill: '#64748b' } }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(29, 78, 216, 0.06)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload as typeof data.perHorizonHours[0];
                      return (
                        <div className="space-y-1 rounded-control border border-line bg-surface-raised p-3 font-mono text-xs shadow-card">
                          <div className="border-b border-line pb-1 font-sans font-semibold text-ink">
                            Lead Time: {item.horizonHours} Hours Ahead ({item.pairs} pairs)
                          </div>
                          <div className="flex justify-between gap-4 text-ink">
                            <span className="font-sans">MAE:</span>
                            <span className="font-bold tabular-nums">{formatMW(item.maeMW)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-ink">
                            <span className="font-sans">RMSE:</span>
                            <span className="font-bold tabular-nums">{formatMW(item.rmseMW)}</span>
                          </div>
                          <div className="flex justify-between gap-4 border-t border-line pt-1 text-residual-pos">
                            <span className="font-sans">Mean Bias:</span>
                            <span className="font-bold tabular-nums">{formatResidualMW(item.biasMW)}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
                    formatter={(value) => <span className="text-xs font-medium text-ink-muted">{value}</span>}
                  />
                  <Bar dataKey="maeMW" name="MAE (MW)" fill="#2563eb" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="biasMW" name="Bias (MW)" fill="#d97706" radius={[4, 4, 0, 0]} opacity={0.85} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="max-h-[320px] overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <caption className="sr-only">Forecast error metrics grouped by lead time horizon</caption>
                <thead className="sticky top-0 border-b border-line bg-surface-raised text-ink-muted">
                  <tr>
                    <th scope="col" className="p-2.5 font-semibold">Lead Time (Hours)</th>
                    <th scope="col" className="p-2.5 text-right font-semibold">Sample Pairs</th>
                    <th scope="col" className="p-2.5 text-right font-semibold">MAE</th>
                    <th scope="col" className="p-2.5 text-right font-semibold">RMSE</th>
                    <th scope="col" className="p-2.5 text-right font-semibold">Mean Bias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-mono">
                  {data.perHorizonHours.map((h) => (
                    <tr key={h.horizonHours} className="transition-colors hover:bg-surface-subtle">
                      <td className="p-2.5 font-semibold text-ink">{h.horizonHours}h ahead</td>
                      <td className="p-2.5 text-right tabular-nums text-ink-muted">{h.pairs}</td>
                      <td className="p-2.5 text-right font-medium tabular-nums text-ink">{formatMW(h.maeMW)}</td>
                      <td className="p-2.5 text-right font-medium tabular-nums text-ink">{formatMW(h.rmseMW)}</td>
                      <td className="p-2.5 text-right font-semibold tabular-nums text-residual-pos">{formatResidualMW(h.biasMW)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Per-vintage error table */}
      <section aria-label="Per-Vintage Accuracy Table" className="edge-glow rounded-card border border-line bg-surface p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 className="text-base font-bold text-ink">Per-Vintage Accuracy Table</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Quantitative verification across each distinct forecast publication
            </p>
          </div>
          <span className="font-mono text-xs text-ink-muted">Showing {sortedVintages.length} vintage evaluations</span>
        </div>

        <div className="max-h-[480px] overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">Detailed error table per forecast vintage</caption>
            <thead className="sticky top-0 border-b border-line bg-surface-raised text-ink-muted select-none">
              <tr>
                <th scope="col" className="p-2.5">
                  <button type="button" onClick={() => handleSort('deliveryDate')} className="flex items-center gap-1 font-semibold hover:text-ink focus:outline-none focus:underline">
                    Delivery Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" className="p-2.5">
                  <button type="button" onClick={() => handleSort('publishTime')} className="flex items-center gap-1 font-semibold hover:text-ink focus:outline-none focus:underline">
                    Published At (UTC) <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" className="p-2.5 text-right font-semibold">Pairs</th>
                <th scope="col" className="p-2.5 text-right">
                  <button type="button" onClick={() => handleSort('maeMW')} className="flex w-full items-center justify-end gap-1 font-semibold hover:text-ink focus:outline-none focus:underline">
                    MAE <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" className="p-2.5 text-right">
                  <button type="button" onClick={() => handleSort('rmseMW')} className="flex w-full items-center justify-end gap-1 font-semibold hover:text-ink focus:outline-none focus:underline">
                    RMSE <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" className="p-2.5 text-right">
                  <button type="button" onClick={() => handleSort('biasMW')} className="flex w-full items-center justify-end gap-1 font-semibold hover:text-ink focus:outline-none focus:underline">
                    Bias (Scope) <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono">
              {sortedVintages.map((v: VintageAccuracyItem) => (
                <tr key={`${v.deliveryDate}-${v.publishTime}`} className="transition-colors hover:bg-surface-subtle">
                  <td className="p-2.5 font-sans font-medium text-ink">{formatDateUTC(v.deliveryDate)}</td>
                  <td className="p-2.5 text-ink-muted">{formatDateTimeUTC(v.publishTime)}</td>
                  <td className="p-2.5 text-right tabular-nums text-ink-muted">{v.pairs}</td>
                  <td className="p-2.5 text-right font-medium tabular-nums text-ink">{formatMW(v.maeMW)}</td>
                  <td className="p-2.5 text-right font-medium tabular-nums text-ink">{formatMW(v.rmseMW)}</td>
                  <td className="p-2.5 text-right font-semibold tabular-nums text-residual-pos">{formatResidualMW(v.biasMW)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

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
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [data, sortField, sortOrder]);

  // Compute month-wide averages
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
    <div className="space-y-6">
      <CaveatBanner />

      {loading && !data && (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-surface rounded-card border border-line" />
          <div className="h-[320px] bg-surface rounded-card border border-line" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-card text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Month-wide summary KPI cards - flat hierarchy without nested cards */}
      {monthAverages && (
        <section aria-label="January 2026 Aggregate Performance" className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-line bg-surface p-5 rounded-card border border-line shadow-card">
          <div className="p-3">
            <span className="text-xs text-ink-muted font-semibold uppercase tracking-wider text-[11px]">Evaluated Vintages</span>
            <div className="text-2xl font-bold text-ink font-mono tabular-nums mt-1">
              {monthAverages.vintagesCount}
            </div>
            <div className="text-xs text-ink-muted mt-1">Across 31 delivery days</div>
          </div>
          <div className="p-3">
            <span className="text-xs text-ink-muted font-semibold uppercase tracking-wider text-[11px]">Window Avg MAE</span>
            <div className="text-2xl font-bold text-ink font-mono tabular-nums mt-1">
              {formatMW(monthAverages.avgMae)}
            </div>
            <div className="text-xs text-ink-muted mt-1">Mean absolute deviation</div>
          </div>
          <div className="p-3">
            <span className="text-xs text-ink-muted font-semibold uppercase tracking-wider text-[11px]">Window Avg RMSE</span>
            <div className="text-2xl font-bold text-ink font-mono tabular-nums mt-1">
              {formatMW(monthAverages.avgRmse)}
            </div>
            <div className="text-xs text-ink-muted mt-1">Root mean squared deviation</div>
          </div>
          <div className="p-3">
            <span className="text-xs text-ink-muted font-semibold uppercase tracking-wider text-[11px]">Window Avg Bias</span>
            <div className="text-2xl font-bold text-residual-pos font-mono tabular-nums mt-1">
              {formatResidualMW(monthAverages.avgBias)}
            </div>
            <div className="text-xs text-ink-muted mt-1">Structural scope gap</div>
          </div>
        </section>
      )}

      {/* Forecast Horizon Accuracy Analysis */}
      {data?.perHorizonHours && data.perHorizonHours.length > 0 && (
        <section aria-label="Horizon Error Decay" className="bg-surface p-5 rounded-card border border-line shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">
                Forecast Error vs Lead Time Horizon
              </h2>
              <p className="text-xs text-ink-muted max-w-[70ch]">
                Grouped by lead time hours = startTime − publishTime (0h to 48h)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHorizonViewMode(horizonViewMode === 'chart' ? 'table' : 'chart')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-control bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
              aria-label={horizonViewMode === 'chart' ? 'Switch to accessible table' : 'Switch to chart view'}
            >
              {horizonViewMode === 'chart' ? (
                <>
                  <Table className="w-3.5 h-3.5" aria-hidden="true" /> Table View
                </>
              ) : (
                <>
                  <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" /> Chart View
                </>
              )}
            </button>
          </div>

          {horizonViewMode === 'chart' ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.perHorizonHours} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd8cc" vertical={false} />
                  <XAxis
                    dataKey="horizonHours"
                    stroke="#475569"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${val}h`}
                    label={{ value: 'Forecast Horizon (Hours Ahead)', position: 'insideBottom', offset: -12, style: { fontSize: 12, fill: '#475569' } }}
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    label={{ value: 'Error (MW)', angle: -90, position: 'insideLeft', offset: -2, style: { fontSize: 12, fill: '#475569' } }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload as typeof data.perHorizonHours[0];
                      return (
                        <div className="bg-surface p-3 rounded-control border border-line shadow-card text-xs font-mono space-y-1">
                          <div className="font-sans font-semibold text-ink border-b border-line pb-1">
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
                          <div className="flex justify-between gap-4 text-residual-pos pt-1 border-t border-line">
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
                    formatter={(value) => <span className="text-xs text-slate-800 font-medium">{value}</span>}
                  />
                  <Bar dataKey="maeMW" name="MAE (MW)" fill="#0f766e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="biasMW" name="Bias (MW)" fill="#b45309" radius={[3, 3, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full text-left text-xs border-collapse">
                <caption className="sr-only">Forecast error metrics grouped by lead time horizon</caption>
                <thead className="bg-paper sticky top-0 border-b border-line text-ink-muted">
                  <tr>
                    <th scope="col" className="p-2.5 font-semibold">Lead Time (Hours)</th>
                    <th scope="col" className="p-2.5 font-semibold text-right">Sample Pairs</th>
                    <th scope="col" className="p-2.5 font-semibold text-right">MAE</th>
                    <th scope="col" className="p-2.5 font-semibold text-right">RMSE</th>
                    <th scope="col" className="p-2.5 font-semibold text-right">Mean Bias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-mono">
                  {data.perHorizonHours.map((h) => (
                    <tr key={h.horizonHours} className="hover:bg-surface-subtle transition-colors">
                      <td className="p-2.5 text-ink font-semibold">{h.horizonHours}h ahead</td>
                      <td className="p-2.5 text-right text-ink-muted tabular-nums">{h.pairs}</td>
                      <td className="p-2.5 text-right font-medium text-ink tabular-nums">{formatMW(h.maeMW)}</td>
                      <td className="p-2.5 text-right font-medium text-ink tabular-nums">{formatMW(h.rmseMW)}</td>
                      <td className="p-2.5 text-right font-semibold text-residual-pos tabular-nums">{formatResidualMW(h.biasMW)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Per-Vintage Error Table */}
      <section aria-label="Per-Vintage Accuracy Table" className="bg-surface p-5 rounded-card border border-line shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-line">
          <div>
            <h2 className="text-base font-bold text-ink">
              Per-Vintage Accuracy Table
            </h2>
            <p className="text-xs text-ink-muted max-w-[70ch]">
              Quantitative verification across each distinct forecast publication
            </p>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            Showing {sortedVintages.length} vintages
          </span>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">Detailed error table per forecast vintage</caption>
            <thead className="bg-paper sticky top-0 border-b border-line text-ink-muted select-none">
              <tr>
                <th scope="col" className="p-2.5">
                  <button
                    type="button"
                    onClick={() => handleSort('deliveryDate')}
                    className="flex items-center gap-1 font-semibold hover:text-ink focus:outline-none focus:underline"
                  >
                    Delivery Date <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th scope="col" className="p-2.5">
                  <button
                    type="button"
                    onClick={() => handleSort('publishTime')}
                    className="flex items-center gap-1 font-semibold hover:text-ink focus:outline-none focus:underline"
                  >
                    Published At (UTC) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th scope="col" className="p-2.5 text-right font-semibold">Pairs</th>
                <th scope="col" className="p-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('maeMW')}
                    className="flex items-center justify-end gap-1 font-semibold hover:text-ink w-full focus:outline-none focus:underline"
                  >
                    MAE <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th scope="col" className="p-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('rmseMW')}
                    className="flex items-center justify-end gap-1 font-semibold hover:text-ink w-full focus:outline-none focus:underline"
                  >
                    RMSE <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th scope="col" className="p-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('biasMW')}
                    className="flex items-center justify-end gap-1 font-semibold hover:text-ink w-full focus:outline-none focus:underline"
                  >
                    Bias (Scope) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono">
              {sortedVintages.map((v: VintageAccuracyItem) => (
                <tr key={`${v.deliveryDate}-${v.publishTime}`} className="hover:bg-surface-subtle transition-colors">
                  <td className="p-2.5 font-sans font-medium text-ink">{formatDateUTC(v.deliveryDate)}</td>
                  <td className="p-2.5 text-ink-muted">{formatDateTimeUTC(v.publishTime)}</td>
                  <td className="p-2.5 text-right text-ink-muted tabular-nums">{v.pairs}</td>
                  <td className="p-2.5 text-right font-medium text-ink tabular-nums">{formatMW(v.maeMW)}</td>
                  <td className="p-2.5 text-right font-medium text-ink tabular-nums">{formatMW(v.rmseMW)}</td>
                  <td className="p-2.5 text-right font-semibold text-residual-pos tabular-nums">{formatResidualMW(v.biasMW)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

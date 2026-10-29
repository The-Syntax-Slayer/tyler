import { useState } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { AlignedSeriesPoint } from '../lib/api';
import { formatHourTick, formatMW, formatResidualMW, formatTimeUTC } from '../lib/format';
import { Table, LineChart as ChartIcon } from 'lucide-react';

interface ForecastChartProps {
  series: AlignedSeriesPoint[];
  vintagePublishTime?: string;
  deliveryDate?: string;
}

const AXIS = { stroke: '#64748b', fontSize: 11, tickLine: false };

export function ForecastChart({ series, vintagePublishTime, deliveryDate }: ForecastChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [showResiduals, setShowResiduals] = useState(true);

  if (!series || series.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-12 text-center text-ink-muted">
        No forecast and actual data points available for this period.
      </div>
    );
  }

  const chartData = series.map((pt) => ({
    ...pt,
    timeLabel: formatHourTick(pt.startTime),
    fullTime: formatTimeUTC(pt.startTime),
  }));

  return (
    <div className="edge-glow rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      {/* Header controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-accent shadow-glow" aria-hidden="true" />
            Generation Profile: Forecast vs Actual
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Hourly resolution (odd settlement periods 1–47) · All times UTC
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'chart' && (
            <button
              type="button"
              onClick={() => setShowResiduals(!showResiduals)}
              aria-pressed={showResiduals}
              className={`rounded-control border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showResiduals
                  ? 'border-accent/50 bg-accent-dim text-accent'
                  : 'border-line bg-surface text-ink-muted hover:text-ink'
              }`}
            >
              {showResiduals ? 'Hide Residuals' : 'Show Residuals'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
            className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
            aria-label={viewMode === 'chart' ? 'Switch to accessible data table' : 'Switch to chart visualization'}
          >
            {viewMode === 'chart' ? (
              <>
                <Table className="h-3.5 w-3.5" aria-hidden="true" /> Table View
              </>
            ) : (
              <>
                <ChartIcon className="h-3.5 w-3.5" aria-hidden="true" /> Chart View
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="timeLabel" {...AXIS} axisLine={{ stroke: '#e2e8f0' }} dy={6} />
              <YAxis
                yAxisId="generation"
                {...AXIS}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft', offset: 2, style: { fontSize: 11, fill: '#64748b' } }}
              />
              {showResiduals && (
                <YAxis
                  yAxisId="residual"
                  orientation="right"
                  {...AXIS}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                  label={{ value: 'Residual (MW)', angle: 90, position: 'insideRight', offset: 0, style: { fontSize: 11, fill: '#64748b' } }}
                />
              )}
              <Tooltip
                cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as typeof chartData[0];
                  return (
                    <div className="space-y-1 rounded-control border border-line bg-surface-raised p-3 font-mono text-xs shadow-card">
                      <div className="border-b border-line pb-1 font-sans font-semibold text-ink">
                        Settlement Period {item.settlementPeriod} ({item.fullTime})
                      </div>
                      <div className="flex justify-between gap-4 text-forecast">
                        <span className="font-sans">WINDFOR Forecast:</span>
                        <span className="font-bold tabular-nums">{formatMW(item.forecastMW)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-actual">
                        <span className="font-sans">FUELHH Actual:</span>
                        <span className="font-bold tabular-nums">{formatMW(item.actualMW)}</span>
                      </div>
                      <div
                        className={`flex justify-between gap-4 border-t border-line pt-1 ${
                          item.residualMW >= 0 ? 'text-residual-pos' : 'text-residual-neg'
                        }`}
                      >
                        <span className="font-sans">Residual (F - A):</span>
                        <span className="font-bold tabular-nums">{formatResidualMW(item.residualMW)}</span>
                      </div>
                      {vintagePublishTime && (
                        <div className="pt-1 font-sans text-[10px] text-ink-muted">
                          Forecast published: {vintagePublishTime}
                        </div>
                      )}
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
              {showResiduals && (
                <Bar yAxisId="residual" dataKey="residualMW" name="Residual (MW)" opacity={0.55} barSize={12} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.residualMW >= 0 ? '#e11d48' : '#2563eb'}
                    />
                  ))}
                </Bar>
              )}
              <Area
                yAxisId="generation"
                type="monotone"
                dataKey="forecastMW"
                name="WINDFOR Forecast"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#forecastFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Area
                yAxisId="generation"
                type="monotone"
                dataKey="actualMW"
                name="FUELHH Actual"
                stroke="#d97706"
                strokeWidth={2.5}
                fill="url(#actualFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Accessible HTML data table view */
        <div className="max-h-[420px] overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">
              Hourly wind generation comparison for delivery date {deliveryDate || ''}
            </caption>
            <thead className="sticky top-0 border-b border-line bg-surface-raised text-ink-muted">
              <tr>
                <th scope="col" className="p-2.5 font-semibold">Period</th>
                <th scope="col" className="p-2.5 font-semibold">Start Time (UTC)</th>
                <th scope="col" className="p-2.5 text-right font-semibold">WINDFOR Forecast</th>
                <th scope="col" className="p-2.5 text-right font-semibold">FUELHH Actual</th>
                <th scope="col" className="p-2.5 text-right font-semibold">Residual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono">
              {series.map((row) => (
                <tr key={row.startTime} className="transition-colors hover:bg-surface-subtle">
                  <td className="p-2.5 text-ink-muted">{row.settlementPeriod}</td>
                  <td className="p-2.5 text-ink">{formatTimeUTC(row.startTime)}</td>
                  <td className="p-2.5 text-right font-semibold tabular-nums text-forecast">
                    {formatMW(row.forecastMW)}
                  </td>
                  <td className="p-2.5 text-right font-semibold tabular-nums text-actual">
                    {formatMW(row.actualMW)}
                  </td>
                  <td
                    className={`p-2.5 text-right font-semibold tabular-nums ${
                      row.residualMW >= 0 ? 'text-residual-pos' : 'text-residual-neg'
                    }`}
                  >
                    {formatResidualMW(row.residualMW)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

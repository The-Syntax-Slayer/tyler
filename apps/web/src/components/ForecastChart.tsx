import { useState } from 'react';
import {
  ComposedChart,
  Line,
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

export function ForecastChart({ series, vintagePublishTime, deliveryDate }: ForecastChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [showResiduals, setShowResiduals] = useState(true);

  if (!series || series.length === 0) {
    return (
      <div className="bg-surface p-12 rounded-card border border-line text-center text-ink-muted">
        No forecast and actual data points available for this period.
      </div>
    );
  }

  // Pre-process data for tooltip and display
  const chartData = series.map((pt) => ({
    ...pt,
    timeLabel: formatHourTick(pt.startTime),
    fullTime: formatTimeUTC(pt.startTime),
  }));

  return (
    <div className="bg-surface p-4 rounded-card border border-line shadow-card">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-line">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Generation Profile: Forecast vs Actual
          </h2>
          <p className="text-xs text-ink-muted">
            Hourly resolution (odd settlement periods 1–47) · All times UTC
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'chart' && (
            <button
              type="button"
              onClick={() => setShowResiduals(!showResiduals)}
              className={`px-2.5 py-1 text-xs rounded-control border transition-colors ${
                showResiduals
                  ? 'bg-paper text-ink border-line font-medium'
                  : 'bg-surface text-ink-muted border-line/60 hover:text-ink'
              }`}
            >
              {showResiduals ? 'Hide Residuals' : 'Show Residuals'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-control bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
            aria-label={viewMode === 'chart' ? 'Switch to accessible data table' : 'Switch to chart visualization'}
          >
            {viewMode === 'chart' ? (
              <>
                <Table className="w-3.5 h-3.5" aria-hidden="true" /> Table View
              </>
            ) : (
              <>
                <ChartIcon className="w-3.5 h-3.5" aria-hidden="true" /> Chart View
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ddd8cc" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#4b5563"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#ddd8cc' }}
                dy={6}
              />
              <YAxis
                yAxisId="generation"
                stroke="#4b5563"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#ddd8cc' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft', offset: -2, style: { fontSize: 12, fill: '#4b5563' } }}
              />
              {showResiduals && (
                <YAxis
                  yAxisId="residual"
                  orientation="right"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#ddd8cc' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                  label={{ value: 'Residual (MW)', angle: 90, position: 'insideRight', offset: 0, style: { fontSize: 11, fill: '#4b5563' } }}
                />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as typeof chartData[0];
                  return (
                    <div className="bg-surface p-3 rounded-control border border-line shadow-card text-xs font-mono space-y-1">
                      <div className="font-sans font-semibold text-ink border-b border-line pb-1">
                        Settlement Period {item.settlementPeriod} ({item.fullTime})
                      </div>
                      <div className="flex justify-between gap-4 text-blue-700">
                        <span className="font-sans">WINDFOR Forecast:</span>
                        <span className="font-bold tabular-nums">{formatMW(item.forecastMW)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-amber-800">
                        <span className="font-sans">FUELHH Actual:</span>
                        <span className="font-bold tabular-nums">{formatMW(item.actualMW)}</span>
                      </div>
                      <div
                        className={`flex justify-between gap-4 pt-1 border-t border-line ${
                          item.residualMW >= 0 ? 'text-residual-pos' : 'text-residual-neg'
                        }`}
                      >
                        <span className="font-sans">Residual (F - A):</span>
                        <span className="font-bold tabular-nums">{formatResidualMW(item.residualMW)}</span>
                      </div>
                      {vintagePublishTime && (
                        <div className="pt-1 text-[10px] text-ink-muted font-sans">
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
                formatter={(value) => <span className="text-xs text-slate-800 font-medium">{value}</span>}
              />
              {showResiduals && (
                <Bar
                  yAxisId="residual"
                  dataKey="residualMW"
                  name="Residual (MW)"
                  opacity={0.65}
                  barSize={12}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.residualMW >= 0 ? '#b91c1c' : '#1d4ed8'}
                    />
                  ))}
                </Bar>
              )}
              <Line
                yAxisId="generation"
                type="monotone"
                dataKey="forecastMW"
                name="WINDFOR Forecast"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563eb' }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="generation"
                type="monotone"
                dataKey="actualMW"
                name="FUELHH Actual"
                stroke="#b45309"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#b45309' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Accessible HTML Data Table View */
        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">
              Hourly wind generation comparison for delivery date {deliveryDate || ''}
            </caption>
            <thead className="bg-paper sticky top-0 border-b border-line text-ink-muted">
              <tr>
                <th scope="col" className="p-2.5 font-semibold">Period</th>
                <th scope="col" className="p-2.5 font-semibold">Start Time (UTC)</th>
                <th scope="col" className="p-2.5 font-semibold text-right">WINDFOR Forecast</th>
                <th scope="col" className="p-2.5 font-semibold text-right">FUELHH Actual</th>
                <th scope="col" className="p-2.5 font-semibold text-right">Residual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono">
              {series.map((row) => (
                <tr key={row.startTime} className="hover:bg-surface-subtle transition-colors">
                  <td className="p-2.5 text-ink-muted">{row.settlementPeriod}</td>
                  <td className="p-2.5 text-ink">{formatTimeUTC(row.startTime)}</td>
                  <td className="p-2.5 text-right font-semibold text-blue-700 tabular-nums">
                    {formatMW(row.forecastMW)}
                  </td>
                  <td className="p-2.5 text-right font-semibold text-amber-800 tabular-nums">
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

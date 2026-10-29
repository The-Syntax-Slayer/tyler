import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { api, type VintageItem } from '../lib/api';
import { formatDateTimeUTC, formatDateUTC, formatHourTick, formatMW, formatTimeUTC } from '../lib/format';
import { CaveatBanner } from './CaveatBanner';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChevronLeft, ChevronRight, Play, Pause, Calendar, Clock, RotateCcw, AlertCircle } from 'lucide-react';

export function VintageExplorer() {
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-01-01');
  const [vintages, setVintages] = useState<VintageItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Available January 2026 dates
  const dates = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
  }, []);

  // Fetch all vintages for delivery date
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setIsPlaying(false);

    api.getVintages(deliveryDate)
      .then((res) => {
        if (!mounted) return;
        setVintages(res.vintages);
        setCurrentIndex(0);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.detail || 'Failed to load vintages for this date.');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [deliveryDate]);

  // Autoplay scrubber
  useEffect(() => {
    if (!isPlaying || vintages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= vintages.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, vintages.length]);

  const currentVintage = vintages[currentIndex];

  const chartData = useMemo(() => {
    if (!currentVintage) return [];
    return currentVintage.points.map((pt) => ({
      ...pt,
      timeLabel: formatHourTick(pt.startTime),
      fullTime: formatTimeUTC(pt.startTime),
    }));
  }, [currentVintage]);

  const sliderFill = vintages.length > 1 ? (currentIndex / (vintages.length - 1)) * 100 : 0;

  return (
    <div className="space-y-5">
      <CaveatBanner />

      {loading && !currentVintage && (
        <div className="space-y-4" aria-busy="true">
          <div className="skeleton h-28 rounded-card border border-line" />
          <div className="skeleton h-[360px] rounded-card border border-line" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-card border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Control deck */}
      <section aria-label="Explorer Controls" className="edge-glow space-y-4 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Delivery date */}
          <div className="flex items-center gap-2">
            <label htmlFor="explorer-date-select" className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              Delivery Day:
            </label>
            <select
              id="explorer-date-select"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="rounded-control border border-line bg-surface-raised p-1.5 font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDateUTC(d)} ({d})
                </option>
              ))}
            </select>
          </div>

          {/* Stepper + playback */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentIndex(0)}
              disabled={currentIndex === 0}
              className="rounded-control border border-line bg-surface-raised p-1.5 text-ink transition-colors hover:border-line-strong disabled:opacity-40"
              title="First vintage"
              aria-label="First vintage"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 rounded-control border border-line bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-line-strong disabled:opacity-40"
              aria-label="Previous forecast vintage"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={vintages.length <= 1}
              className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
              aria-label={isPlaying ? 'Pause replay' : 'Play revision sequence'}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Play Revisions
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(vintages.length - 1, prev + 1))}
              disabled={currentIndex >= vintages.length - 1}
              className="flex items-center gap-1 rounded-control border border-line bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-line-strong disabled:opacity-40"
              aria-label="Next forecast vintage"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Vintage scrub slider */}
        {vintages.length > 0 && (
          <div className="border-t border-line/60 pt-3">
            <div className="mb-2 flex justify-between font-mono text-xs text-ink-muted">
              <span>Vintage 1 ({formatDateTimeUTC(vintages[0].publishTime)})</span>
              <span className="font-semibold text-accent">
                Vintage {currentIndex + 1} of {vintages.length}
              </span>
              <span>Latest ({formatDateTimeUTC(vintages[vintages.length - 1].publishTime)})</span>
            </div>
            <input
              type="range"
              min={0}
              max={vintages.length - 1}
              value={currentIndex}
              onChange={(e) => setCurrentIndex(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ '--fill': `${sliderFill}%` } as CSSProperties}
              aria-label="Vintage chronological timeline slider"
            />
          </div>
        )}

        {/* Current vintage readout */}
        {currentVintage && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-line/70 bg-paper p-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span>
                Active Vintage Published: <strong>{formatDateTimeUTC(currentVintage.publishTime)}</strong>
              </span>
            </div>
            <div className="font-mono text-[11px] text-ink-muted">
              Available points: {currentVintage.points.length} hours
            </div>
          </div>
        )}
      </section>

      {/* Evolving forecast curve */}
      {currentVintage && (
        <section aria-label="Evolving Forecast Curve" className="edge-glow rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="explorerFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft', offset: 2, style: { fontSize: 11, fill: '#64748b' } }}
                />
                <Tooltip
                  cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as typeof chartData[0];
                    return (
                      <div className="space-y-1 rounded-control border border-line bg-surface-raised p-3 font-mono text-xs shadow-card">
                        <div className="border-b border-line pb-1 font-sans font-semibold text-ink">
                          Period {item.settlementPeriod} ({item.fullTime})
                        </div>
                        <div className="flex justify-between gap-4 text-forecast">
                          <span className="font-sans">Forecast Output:</span>
                          <span className="font-bold tabular-nums">{formatMW(item.forecastMW)}</span>
                        </div>
                        <div className="border-t border-line pt-1 font-sans text-[10px] text-ink-muted">
                          Published: {formatDateTimeUTC(currentVintage.publishTime)}
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
                <Area
                  type="monotone"
                  dataKey="forecastMW"
                  name={`WINDFOR (Published ${formatTimeUTC(currentVintage.publishTime)})`}
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#explorerFill)"
                  dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

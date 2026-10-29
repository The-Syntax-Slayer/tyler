import { useState, useEffect, useMemo } from 'react';
import { api, type VintageItem } from '../lib/api';
import { formatDateTimeUTC, formatDateUTC, formatHourTick, formatMW, formatTimeUTC } from '../lib/format';
import { CaveatBanner } from './CaveatBanner';
import {
  LineChart,
  Line,
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

  return (
    <div className="space-y-6">
      <CaveatBanner />

      {loading && !currentVintage && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-surface rounded-card border border-line" />
          <div className="h-[360px] bg-surface rounded-card border border-line" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-card text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Toolbar */}
      <section aria-label="Explorer Controls" className="bg-surface p-4 rounded-card border border-line shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Delivery Date Selection */}
          <div className="flex items-center gap-2">
            <label htmlFor="explorer-date-select" className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Delivery Day:
            </label>
            <select
              id="explorer-date-select"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="bg-paper border border-line text-ink text-xs rounded-control p-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDateUTC(d)} ({d})
                </option>
              ))}
            </select>
          </div>

          {/* Stepper & Playback Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentIndex(0)}
              disabled={currentIndex === 0}
              className="p-1.5 bg-paper hover:bg-surface-subtle text-ink rounded-control border border-line disabled:opacity-40"
              title="First vintage"
              aria-label="First vintage"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-2.5 py-1.5 bg-paper hover:bg-surface-subtle text-ink text-xs rounded-control border border-line font-medium flex items-center gap-1 disabled:opacity-40"
              aria-label="Previous forecast vintage"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={vintages.length <= 1}
              className="px-3 py-1.5 bg-accent text-white text-xs rounded-control font-medium hover:bg-accent-hover flex items-center gap-1.5 disabled:opacity-40"
              aria-label={isPlaying ? 'Pause replay' : 'Play revision sequence'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Play Revisions
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(vintages.length - 1, prev + 1))}
              disabled={currentIndex >= vintages.length - 1}
              className="px-2.5 py-1.5 bg-paper hover:bg-surface-subtle text-ink text-xs rounded-control border border-line font-medium flex items-center gap-1 disabled:opacity-40"
              aria-label="Next forecast vintage"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Vintage Scrub Slider */}
        {vintages.length > 0 && (
          <div className="pt-2 border-t border-line/60">
            <div className="flex justify-between text-xs text-ink-muted mb-1.5 font-mono">
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
              className="w-full accent-accent cursor-pointer h-1.5 bg-line rounded-lg"
              aria-label="Vintage chronological timeline slider"
            />
          </div>
        )}

        {/* Current Vintage Readout */}
        {currentVintage && (
          <div className="p-3 bg-paper rounded-control border border-line/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>
                Active Vintage Published: <strong>{formatDateTimeUTC(currentVintage.publishTime)}</strong>
              </span>
            </div>
            <div className="font-mono text-ink-muted text-[11px]">
              Available points: {currentVintage.points.length} hours
            </div>
          </div>
        )}
      </section>

      {/* Visual Chart */}
      {currentVintage && (
        <section aria-label="Evolving Forecast Curve" className="bg-surface p-4 rounded-card border border-line shadow-card">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd8cc" vertical={false} />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#4b5563"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#ddd8cc' }}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#ddd8cc' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft', offset: -2, style: { fontSize: 12, fill: '#4b5563' } }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as typeof chartData[0];
                    return (
                      <div className="bg-surface p-3 rounded-control border border-line shadow-card text-xs font-mono space-y-1">
                        <div className="font-sans font-semibold text-ink border-b border-line pb-1">
                          Period {item.settlementPeriod} ({item.fullTime})
                        </div>
                        <div className="flex justify-between gap-4 text-forecast">
                          <span className="font-sans">Forecast Output:</span>
                          <span className="font-bold tabular-nums">{formatMW(item.forecastMW)}</span>
                        </div>
                        <div className="text-[10px] text-ink-muted font-sans pt-1 border-t border-line">
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
                  formatter={(value) => <span className="text-xs text-slate-800 font-medium">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="forecastMW"
                  name={`WINDFOR (Published ${formatTimeUTC(currentVintage.publishTime)})`}
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

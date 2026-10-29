import { useState, useEffect } from 'react';
import { DecisionView } from './components/DecisionView';
import { AccuracyView } from './components/AccuracyView';
import { VintageExplorer } from './components/VintageExplorer';
import { AboutView } from './components/AboutView';
import { api, type HealthResponse } from './lib/api';
import { Wind, BarChart2, History, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';

type Tab = 'decision' | 'accuracy' | 'explorer' | 'about';

const TABS: { id: Tab; label: string; Icon: typeof Wind }[] = [
  { id: 'decision', label: 'Decision View', Icon: Wind },
  { id: 'accuracy', label: 'Accuracy Benchmarks', Icon: BarChart2 },
  { id: 'explorer', label: 'Vintage Explorer', Icon: History },
  { id: 'about', label: 'Data & Methods', Icon: BookOpen },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('decision');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [utcTime, setUtcTime] = useState<string>('');

  // Live UTC clock — the market runs on UTC.
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setUtcTime(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', cacheLoaded: false, settlementDates: 0, vintages: 0, cacheFetchedAt: null }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Frosted command header */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3.5">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-accent/40 bg-accent-dim shadow-glow">
                <Wind className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                  GB Day-Ahead Desk
                </p>
                <h1 className="text-lg font-bold leading-tight tracking-tight sm:text-xl">
                  Wind Day-Ahead <span className="font-normal text-ink-muted">/ Forecast Accuracy</span>
                </h1>
              </div>
            </div>

            {/* Tab rail */}
            <nav
              aria-label="Main Navigation"
              className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-control border border-line bg-surface p-1 sm:order-none sm:w-auto sm:flex-1 sm:justify-center lg:mx-4"
            >
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={activeTab === id ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-1.5 rounded-[6px] px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === id
                      ? 'bg-accent text-white shadow-glow'
                      : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* Live status */}
            <div className="ml-auto flex items-center gap-2.5">
              <div className="hidden items-center gap-2 rounded-control border border-line bg-surface px-2.5 py-2 font-mono text-xs text-ink-muted md:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-volt animate-pulseDot" aria-hidden="true" />
                <span className="tabular-nums font-medium text-ink">{utcTime || '— UTC'}</span>
              </div>
              {health && (
                <div
                  className={`flex items-center gap-1.5 rounded-control border px-2.5 py-2 text-xs font-semibold ${
                    health.cacheLoaded
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-600'
                  }`}
                  title={
                    health.cacheLoaded
                      ? `Bundled cache: ${health.settlementDates} dates, ${health.vintages} vintages`
                      : 'Cache not loaded'
                  }
                >
                  {health.cacheLoaded ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Cache Live</span>
                      <span className="sm:hidden">Live</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Cache Offline</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data ticker strip */}
        <div className="border-t border-line/70">
          <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint sm:px-6 lg:px-8">
            <span>Elexon BMRS only</span>
            <span className="text-line-strong" aria-hidden="true">/</span>
            <span>National wind</span>
            <span className="text-line-strong" aria-hidden="true">/</span>
            <span>January 2026 decisions</span>
            <span className="text-line-strong" aria-hidden="true">/</span>
            <span>31 delivery days</span>
            <span className="text-line-strong" aria-hidden="true">/</span>
            <span>224 forecast vintages</span>
            <span className="ml-auto hidden text-accent/80 sm:inline">publishTime &le; cutoff — zero lookahead</span>
          </div>
        </div>
      </header>

      {/* Main view — all views stay mounted so switching tabs preserves
          each view's date, cutoff, slider and scroll state. */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className={activeTab === 'decision' ? undefined : 'hidden'}>
          <DecisionView />
        </div>
        <div className={activeTab === 'accuracy' ? undefined : 'hidden'}>
          <AccuracyView />
        </div>
        <div className={activeTab === 'explorer' ? undefined : 'hidden'}>
          <VintageExplorer />
        </div>
        <div className={activeTab === 'about' ? undefined : 'hidden'}>
          <AboutView />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-5 text-xs text-ink-muted">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p>Source: Elexon BMRS (FUELHH, WINDFOR) · National wind · January 2026 decisions · All times UTC</p>
          <p className="font-mono text-[11px]">
            Zero lookahead bias: <span className="font-semibold text-accent">publishTime &le; decision cutoff</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { DecisionView } from './components/DecisionView';
import { AccuracyView } from './components/AccuracyView';
import { VintageExplorer } from './components/VintageExplorer';
import { AboutView } from './components/AboutView';
import { api, type HealthResponse } from './lib/api';
import { Wind, BarChart2, History, BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

type Tab = 'decision' | 'accuracy' | 'explorer' | 'about';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('decision');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [utcTime, setUtcTime] = useState<string>('');

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Health Check
  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', cacheLoaded: false, settlementDates: 0, vintages: 0 }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-sans selection:bg-accent/20">
      {/* Top Header Bar */}
      <header className="bg-surface border-b border-line sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 h-16 sm:h-20">
            {/* Brand Title: icon in flow without container */}
            <div className="flex items-center gap-2.5">
              <Wind className="w-7 h-7 text-accent shrink-0" aria-hidden="true" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                  Wind Day-Ahead <span className="text-ink-muted font-normal text-lg sm:text-xl">| Forecast Accuracy</span>
                </h1>
                <p className="text-xs text-ink-muted hidden sm:block">
                  Elexon BMRS · National Wind · January 2026 Decisions
                </p>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main Navigation">
              <button
                type="button"
                onClick={() => setActiveTab('decision')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-control font-semibold transition-colors ${
                  activeTab === 'decision'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-subtle'
                }`}
                aria-current={activeTab === 'decision' ? 'page' : undefined}
              >
                <Wind className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Decision View</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('accuracy')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-control font-semibold transition-colors ${
                  activeTab === 'accuracy'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-subtle'
                }`}
                aria-current={activeTab === 'accuracy' ? 'page' : undefined}
              >
                <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Accuracy Benchmarks</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('explorer')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-control font-semibold transition-colors ${
                  activeTab === 'explorer'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-subtle'
                }`}
                aria-current={activeTab === 'explorer' ? 'page' : undefined}
              >
                <History className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vintage Explorer</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-control font-semibold transition-colors ${
                  activeTab === 'about'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-subtle'
                }`}
                aria-current={activeTab === 'about' ? 'page' : undefined}
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Data & Methods</span>
              </button>
            </nav>

            {/* Status indicators */}
            <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-ink-muted bg-surface-subtle px-2.5 py-1.5 rounded-control border border-line">
                <Clock className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span className="tabular-nums font-semibold">{utcTime || 'UTC'}</span>
              </div>

              {health && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-control border text-xs font-medium ${
                    health.cacheLoaded
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-red-50 text-red-800 border-red-300'
                  }`}
                  title={
                    health.cacheLoaded
                      ? `Bundled cache: ${health.settlementDates} dates, ${health.vintages} vintages`
                      : 'Cache not loaded'
                  }
                >
                  {health.cacheLoaded ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      <span>Cache Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-red-700" aria-hidden="true" />
                      <span>Cache Offline</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'decision' && <DecisionView />}
        {activeTab === 'accuracy' && <AccuracyView />}
        {activeTab === 'explorer' && <VintageExplorer />}
        {activeTab === 'about' && <AboutView />}
      </main>

      {/* Persistent Accessible Footer */}
      <footer className="bg-surface border-t border-line py-5 text-xs text-ink-muted mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Source: Elexon BMRS (FUELHH, WINDFOR) · National wind · January 2026 decisions · All times UTC
          </div>
          <div className="font-mono text-xs">
            Zero lookahead bias: <span className="text-accent font-bold">publishTime &le; decision cutoff</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

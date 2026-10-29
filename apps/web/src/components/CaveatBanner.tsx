import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';

export function CaveatBanner() {
  const [isOpen, setIsOpen] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div className="mb-4 text-xs text-ink-muted flex items-center justify-between bg-surface p-2.5 rounded-control border border-line">
        <span>Dataset scope notice hidden (WINDFOR vs FUELHH population gap).</span>
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="text-accent underline font-semibold hover:text-accent-hover"
        >
          View Scope Notice
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label="Dataset Scope Caveat"
      className="mb-6 rounded-card border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 mt-0.5 text-amber-700 shrink-0" aria-hidden="true" />
          <div className="max-w-[65ch]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-amber-950">
                Scope Notice: WINDFOR Forecast vs FUELHH Actuals Population Difference
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs text-amber-800 hover:underline flex items-center gap-0.5 font-semibold"
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <>Hide details <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Show details <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
            <p className="text-xs mt-1 text-amber-900 leading-relaxed max-w-[65ch] text-pretty">
              <strong>WINDFOR</strong> forecasts total GB wind generation (including embedded and distribution-connected wind),
              whereas <strong>FUELHH WIND</strong> records only transmission-system metered outturn.
              This structural scope difference accounts for the consistent positive bias (~3.5–6.3 GW) and is not pure forecast model error.
            </p>
            {isOpen && (
              <div className="mt-2.5 pt-2.5 border-t border-amber-200 text-xs text-amber-900 space-y-1.5 max-w-[65ch] text-pretty">
                <p>
                  • <strong>No Invented Offsets:</strong> The app never applies arbitrary calibration offsets to alter raw Elexon data.
                </p>
                <p>
                  • <strong>Reporting Standard:</strong> Mean Bias Error is reported separately from MAE and RMSE across all views.
                </p>
                <p>
                  • <strong>Decision Semantics:</strong> Forecasts are strictly filtered to vintages published prior to auction gate closure.
                </p>
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-amber-800 hover:text-amber-950 p-1 rounded hover:bg-amber-100 transition-colors"
          title="Dismiss notice"
          aria-label="Dismiss dataset scope notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

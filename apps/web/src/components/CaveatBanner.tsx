import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';

export function CaveatBanner() {
  const [isOpen, setIsOpen] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-control border border-line bg-surface p-2.5 text-xs text-ink-muted">
        <span>Dataset scope notice hidden (WINDFOR vs FUELHH population gap).</span>
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="font-semibold text-accent underline hover:text-accent-hover"
        >
          View Scope Notice
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label="Dataset Scope Caveat"
      className="mb-6 rounded-card border border-amber-400/30 bg-amber-400/[0.07] p-4 text-amber-100 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="max-w-[70ch]">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-amber-50">
                Scope Notice: WINDFOR Forecast vs FUELHH Actuals Population Difference
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-0.5 text-xs font-semibold text-amber-300 hover:underline"
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <>Hide details <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>Show details <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
            <p className="mt-1 max-w-[70ch] text-xs leading-relaxed text-amber-100/90 text-pretty">
              <strong>WINDFOR</strong> forecasts total GB wind generation (including embedded and distribution-connected wind),
              whereas <strong>FUELHH WIND</strong> records only transmission-system metered outturn.
              This structural scope difference accounts for the consistent positive bias (~3.5–6.3 GW) and is not pure forecast model error.
            </p>
            {isOpen && (
              <div className="mt-2.5 space-y-1.5 border-t border-amber-400/20 pt-2.5 text-xs text-amber-100/90 text-pretty">
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
          className="rounded p-1 text-amber-300 transition-colors hover:bg-amber-400/10 hover:text-amber-100"
          title="Dismiss notice"
          aria-label="Dismiss dataset scope notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { api, type MetaResponse } from '../lib/api';
import { formatDateTimeUTC } from '../lib/format';
import { Database, ShieldCheck, Calculator, AlertTriangle, Cpu, Terminal } from 'lucide-react';

export function AboutView() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);

  useEffect(() => {
    api.getMeta().then(setMeta).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Overview Card */}
      <section className="bg-surface p-6 rounded-card border border-line shadow-card space-y-4">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <Database className="w-4 h-4 text-accent" />
          Mission & Context
        </h2>
        <p className="text-xs text-ink leading-relaxed">
          In the Great Britain electricity market, wholesale power suppliers and traders make daily purchase commitments
          in the Day-Ahead Market (such as the EPEX SPOT or Nord Pool auctions, typically closing at 11:00 UTC on D-1).
          Because renewable generation is variable, trading teams must rely on wind forecasts published <em>before</em> the
          bidding gate closure. This platform provides deterministic decision-time visibility and quantitative error benchmarking
          for all purchase decisions in January 2026.
        </p>
      </section>

      {/* Decision-Time Rule (No Lookahead Bias) */}
      <section className="bg-surface p-6 rounded-card border border-line shadow-card space-y-3">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          Core Intellectual Rule: Zero Lookahead Bias
        </h2>
        <p className="text-xs text-ink leading-relaxed">
          A forecast is valid for evaluating a procurement decision if and only if it was published prior to the decision cutoff.
          Serving a forecast published at 18:30 UTC for an 11:00 UTC auction decision introduces <strong>lookahead bias</strong> (evaluating
          historical actions with information that was physically unknowable).
        </p>
        <div className="p-3 bg-paper rounded-control border border-line font-mono text-xs text-ink">
          <code>Condition: publishTime &le; decision_cutoff</code>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          This rule is enforced directly in the data engine (<code>decisions.py</code>) and guarded by automated regression tests
          verifying that late-published vintages can never leak into earlier decision moments.
        </p>
      </section>

      {/* Scope Nuance: WINDFOR vs FUELHH */}
      <section className="bg-surface p-6 rounded-card border border-actual/40 shadow-card space-y-3">
        <h2 className="text-base font-semibold text-[#78350f] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-actual" />
          Dataset Scope Distinction (WINDFOR vs FUELHH)
        </h2>
        <p className="text-xs text-ink leading-relaxed">
          Comparing WINDFOR forecasts against FUELHH actuals reveals that forecasts systematically exceed actuals by ~3.5–6.3 GW:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-paper border-b border-line text-ink-muted">
              <tr>
                <th scope="col" className="p-2 font-semibold">Dataset</th>
                <th scope="col" className="p-2 font-semibold">Source</th>
                <th scope="col" className="p-2 font-semibold">Physical Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              <tr>
                <td className="p-2 font-mono font-medium text-forecast">WINDFOR</td>
                <td className="p-2">National Grid ESO / NESO</td>
                <td className="p-2">National aggregate wind (Transmission + Distribution/Embedded Wind)</td>
              </tr>
              <tr>
                <td className="p-2 font-mono font-medium text-actual">FUELHH WIND</td>
                <td className="p-2">Elexon Settlement Meters</td>
                <td className="p-2">Transmission-connected wind turbines metered under the BSC</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink leading-relaxed">
          <strong>Key Takeaway:</strong> This offset is a structural difference in physical monitoring scope rather than forecast model inaccuracy.
          Per challenge instructions, no invented adjustment offsets are applied to raw Elexon data, and Mean Bias Error is reported separately
          from MAE and RMSE.
        </p>
      </section>

      {/* Quantitative Metric Mathematical Definitions */}
      <section className="bg-surface p-6 rounded-card border border-line shadow-card space-y-3">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <Calculator className="w-4 h-4 text-accent" />
          Quantitative Accuracy Metric Formulas
        </h2>
        <p className="text-xs text-ink leading-relaxed">
          Accuracy metrics are evaluated at hourly resolution on matching <code>startTime</code> pairs between WINDFOR and FUELHH WIND.
          For pair $(F_i, A_i)$ where residual $r_i = F_i - A_i$:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-paper rounded-control border border-line">
            <div className="font-sans font-semibold text-ink mb-1">Mean Absolute Error</div>
            <div className="text-accent font-bold">MAE = (1/n) &Sigma; |r_i|</div>
            <p className="font-sans text-[11px] text-ink-muted mt-1">Magnitude of expected forecast error in MW.</p>
          </div>
          <div className="p-3 bg-paper rounded-control border border-line">
            <div className="font-sans font-semibold text-ink mb-1">Root Mean Squared Error</div>
            <div className="text-accent font-bold">RMSE = &radic;((1/n) &Sigma; r_i&sup2;)</div>
            <p className="font-sans text-[11px] text-ink-muted mt-1">Quadratic penalty heavily weighting extreme deviations.</p>
          </div>
          <div className="p-3 bg-paper rounded-control border border-line">
            <div className="font-sans font-semibold text-ink mb-1">Mean Bias Error</div>
            <div className="text-accent font-bold">Bias = (1/n) &Sigma; r_i</div>
            <p className="font-sans text-[11px] text-ink-muted mt-1">Signed directional bias (+ = over-forecast).</p>
          </div>
        </div>
      </section>

      {/* Cache Provenance */}
      {meta && (
        <section className="bg-surface p-6 rounded-card border border-line shadow-card space-y-3">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" />
            Data Provenance & Snapshot Integrity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-paper rounded-control border border-line">
              <span className="font-sans text-ink-muted block">Cache Snapshot Window:</span>
              <span className="font-semibold text-ink">{meta.window.from} to {meta.window.to}</span>
            </div>
            <div className="p-2.5 bg-paper rounded-control border border-line">
              <span className="font-sans text-ink-muted block">Snapshot Fetched At:</span>
              <span className="font-semibold text-ink">{formatDateTimeUTC(meta.fetchedAt)}</span>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            The January 2026 Elexon data snapshot is committed directly under <code>apps/api/app/data/</code> to support zero-runtime-latency,
            stateless execution within Vercel's read-only serverless environment.
          </p>
        </section>
      )}

      {/* AI Tools & Skills Disclosure */}
      <section className="bg-surface p-6 rounded-card border border-line shadow-card space-y-3">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent" />
          AI Tools & Agent Skills Disclosure
        </h2>
        <p className="text-xs text-ink leading-relaxed">
          In strict compliance with the challenge requirements, all AI tools and automated agent skills used during development are disclosed:
        </p>
        <ul className="text-xs space-y-1.5 list-disc pl-4 text-ink">
          <li><strong>Google Antigravity:</strong> Autonomous pair programming, implementation, test execution, and deployment verification.</li>
          <li><strong>Impeccable Design Engine (v4.8.0):</strong> Design vocabulary, Operate-mode tokens, accessibility auditing, and heuristic detector gating.</li>
          <li><strong>Selective Claude Skills:</strong> <code>tdd-guide</code> (test-driven development), <code>senior-frontend</code> (React 19 & Tailwind), <code>docker-development</code> (containerization), and <code>senior-devops</code> (Vercel serverless integration).</li>
        </ul>
      </section>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api, type MetaResponse } from '../lib/api';
import { formatDateTimeUTC } from '../lib/format';
import { Database, ShieldCheck, Calculator, AlertTriangle, Cpu, Terminal } from 'lucide-react';

function SectionCard({
  icon: Icon,
  title,
  children,
  tone = 'default',
}: {
  icon: typeof Database;
  title: string;
  children: React.ReactNode;
  tone?: 'default' | 'warn';
}) {
  return (
    <section
      className={`edge-glow rounded-card border bg-surface p-6 shadow-card ${
        tone === 'warn' ? 'border-amber-300' : 'border-line'
      }`}
    >
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-ink">
        <span className={`flex h-8 w-8 items-center justify-center rounded-control border ${
          tone === 'warn' ? 'border-amber-300 bg-amber-50' : 'border-accent/30 bg-accent-dim'
        }`}>
          <Icon className={`h-4 w-4 ${tone === 'warn' ? 'text-amber-700' : 'text-accent'}`} />
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function AboutView() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);

  useEffect(() => {
    api.getMeta().then(setMeta).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SectionCard icon={Database} title="Mission & Context">
        <p className="text-sm leading-relaxed text-ink">
          In the Great Britain electricity market, wholesale power suppliers and traders make daily purchase commitments
          in the Day-Ahead Market (such as the EPEX SPOT or Nord Pool auctions, typically closing at 11:00 UTC on D-1).
          Because renewable generation is variable, trading teams must rely on wind forecasts published <em>before</em> the
          bidding gate closure. This platform provides deterministic decision-time visibility and quantitative error benchmarking
          for all purchase decisions in January 2026.
        </p>
      </SectionCard>

      <SectionCard icon={ShieldCheck} title="Core Intellectual Rule: Zero Lookahead Bias">
        <p className="text-sm leading-relaxed text-ink">
          A forecast is valid for evaluating a procurement decision if and only if it was published prior to the decision cutoff.
          Serving a forecast published at 18:30 UTC for an 11:00 UTC auction decision introduces <strong>lookahead bias</strong> (evaluating
          historical actions with information that was physically unknowable).
        </p>
        <div className="rounded-control border border-line bg-paper p-3 font-mono text-xs text-accent">
          <code>Condition: publishTime &le; decision_cutoff</code>
        </div>
        <p className="text-xs leading-relaxed text-ink-muted">
          This rule is enforced directly in the data engine (<code>decisions.py</code>) and guarded by automated regression tests
          verifying that late-published vintages can never leak into earlier decision moments.
        </p>
      </SectionCard>

      <SectionCard icon={AlertTriangle} title="Dataset Scope Distinction (WINDFOR vs FUELHH)" tone="warn">
        <p className="text-sm leading-relaxed text-ink">
          Comparing WINDFOR forecasts against FUELHH actuals reveals that forecasts systematically exceed actuals by ~3.5–6.3 GW:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-line bg-paper text-ink-muted">
              <tr>
                <th scope="col" className="p-2 font-semibold">Dataset</th>
                <th scope="col" className="p-2 font-semibold">Source</th>
                <th scope="col" className="p-2 font-semibold">Physical Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              <tr>
                <td className="p-2 font-mono font-medium text-forecast">WINDFOR</td>
                <td className="p-2 text-ink">National Grid ESO / NESO</td>
                <td className="p-2 text-ink">National aggregate wind (Transmission + Distribution/Embedded Wind)</td>
              </tr>
              <tr>
                <td className="p-2 font-mono font-medium text-actual">FUELHH WIND</td>
                <td className="p-2 text-ink">Elexon Settlement Meters</td>
                <td className="p-2 text-ink">Transmission-connected wind turbines metered under the BSC</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed text-ink">
          <strong>Key Takeaway:</strong> This offset is a structural difference in physical monitoring scope rather than forecast model inaccuracy.
          Per challenge instructions, no invented adjustment offsets are applied to raw Elexon data, and Mean Bias Error is reported separately
          from MAE and RMSE.
        </p>
      </SectionCard>

      <SectionCard icon={Calculator} title="Quantitative Accuracy Metric Formulas">
        <p className="text-sm leading-relaxed text-ink">
          Accuracy metrics are evaluated at hourly resolution on matching <code>startTime</code> pairs between WINDFOR and FUELHH WIND.
          For pair (F<sub>i</sub>, A<sub>i</sub>) where residual r<sub>i</sub> = F<sub>i</sub> − A<sub>i</sub>:
        </p>
        <div className="grid grid-cols-1 gap-3 font-mono text-xs md:grid-cols-3">
          <div className="rounded-control border border-line bg-paper p-3">
            <div className="mb-1 font-sans font-semibold text-ink">Mean Absolute Error</div>
            <div className="font-bold text-accent">MAE = (1/n) &Sigma; |r_i|</div>
            <p className="mt-1 font-sans text-[11px] text-ink-muted">Magnitude of expected forecast error in MW.</p>
          </div>
          <div className="rounded-control border border-line bg-paper p-3">
            <div className="mb-1 font-sans font-semibold text-ink">Root Mean Squared Error</div>
            <div className="font-bold text-accent">RMSE = &radic;((1/n) &Sigma; r_i&sup2;)</div>
            <p className="mt-1 font-sans text-[11px] text-ink-muted">Quadratic penalty heavily weighting extreme deviations.</p>
          </div>
          <div className="rounded-control border border-line bg-paper p-3">
            <div className="mb-1 font-sans font-semibold text-ink">Mean Bias Error</div>
            <div className="font-bold text-accent">Bias = (1/n) &Sigma; r_i</div>
            <p className="mt-1 font-sans text-[11px] text-ink-muted">Signed directional bias (+ = over-forecast).</p>
          </div>
        </div>
      </SectionCard>

      {meta && (
        <SectionCard icon={Terminal} title="Data Provenance & Snapshot Integrity">
          <div className="grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
            <div className="rounded-control border border-line bg-paper p-2.5">
              <span className="block font-sans text-ink-muted">Cache Snapshot Window:</span>
              <span className="font-semibold text-ink">{meta.window.from} to {meta.window.to}</span>
            </div>
            <div className="rounded-control border border-line bg-paper p-2.5">
              <span className="block font-sans text-ink-muted">Snapshot Fetched At:</span>
              <span className="font-semibold text-ink">{formatDateTimeUTC(meta.fetchedAt)}</span>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            The January 2026 Elexon data snapshot is committed directly under <code>apps/api/app/data/</code> to support zero-runtime-latency,
            stateless execution within Vercel&apos;s read-only serverless environment.
          </p>
        </SectionCard>
      )}

      <SectionCard icon={Cpu} title="AI Tools & Agent Skills Disclosure">
        <p className="text-sm leading-relaxed text-ink">
          In strict compliance with the challenge requirements, all AI tools and automated agent skills used during development are disclosed:
        </p>
        <ul className="list-disc space-y-1.5 pl-4 text-sm text-ink">
          <li><strong>Google Antigravity:</strong> Autonomous pair programming, implementation, test execution, and deployment verification.</li>
          <li><strong>Impeccable Design Engine (v4.8.0):</strong> Design vocabulary, Operate-mode tokens, accessibility auditing, and heuristic detector gating.</li>
          <li><strong>Selective Claude Skills:</strong> <code>tdd-guide</code> (test-driven development), <code>senior-frontend</code> (React 19 &amp; Tailwind), <code>docker-development</code> (containerization), and <code>senior-devops</code> (Vercel serverless integration).</li>
          <li><strong>Muse (Genie):</strong> Independent review, UI redesign, deployment repair, and verification of this submission.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

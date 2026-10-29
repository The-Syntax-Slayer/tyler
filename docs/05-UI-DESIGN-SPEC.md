# 05 — UI / DESIGN SPEC

## Mode and standard
This is an **Operate-mode** dashboard (Impeccable's term): dense, precise,
used by professionals under time pressure. Optimise for legibility, scanability
and trust — not for decoration. Run Impeccable from the start (see
`SKILLS.md`): `/impeccable init` → `/impeccable shape` → build → `/impeccable
critique` per screen → `/impeccable audit` → `/impeccable polish` +
`/impeccable harden` → `npx impeccable detect` gate.

## Design tokens (single source: `apps/web/src/index.css`)
- **Type:** IBM Plex Sans (UI) + IBM Plex Mono (numbers, timestamps). Never
  Inter/system defaults — Impeccable flags them as slop, and a trading desk
  deserves tabular numerals. Load via Fontsource packages (self-hosted, no
  Google Fonts CDN dependency at runtime).
- **Neutrals:** tinted, never pure black/gray. Ink `#16211f` (deep green-ink),
  paper `#f7f5ef` (warm paper), surface `#fffdf8`, line `#ddd8cc`.
- **Series colours (colourblind-safe pair):** forecast `#2563eb` (blue), actual
  `#d97706` (amber). Residual: positive `#b91c1c`, negative `#1d4ed8` —
  always paired with `+`/`−` signs and text, never colour alone.
- **Accent (actions only):** `#0f766e` (teal). One accent, used sparingly.
- **Radius:** 10px cards, 6px controls. **Shadows:** one restrained level only.
  No gradients. No nested cards — a chart sits on the surface, not in a card
  inside a card.
- **Density:** 14px base text, 12px secondary, tabular numerals for all MW
  values (`font-variant-numeric: tabular-nums`).

## Layout
- Top bar: product name ("Wind Day-Ahead — Forecast Accuracy"), date/cutoff
  context, About link. No marketing nav.
- Screens 1–3 share one pattern: **controls left/top** (delivery date, cutoff,
  vintage stepper), **chart centre**, **metrics + caveat right/below**.
  The scope caveat (`CaveatBanner`) is a persistent, dismissible-but-default-on
  banner on every comparison screen.
- Footer on every screen: "Source: Elexon BMRS (FUELHH, WINDFOR) · National
  wind · January 2026 decisions · All times UTC".

## Screens and components
1. **DecisionView** — `DateSelect` + `CutoffSelect` (populated from
   `/api/decisions`), a plain-language "knowable at decision time" line
   ("Forecast published 31 Dec 2025, 22:30 UTC — latest available before the
   17:00 cutoff"), `ForecastChart` (ComposedChart: forecast line + actual line
   + residual bars on a second axis, toggleable), `MetricSummary` (MAE/RMSE/
   bias with definitions on hover/focus).
2. **AccuracyView** — `MetricTable` (per vintage: delivery date, publishTime,
   pairs, MAE, RMSE, bias; sortable), `HorizonChart` (MAE by horizon hours),
   scope caveat beside the table.
3. **VintageExplorer** — vintage stepper (prev/next + slider) over one
   delivery day; chart re-renders from the pre-loaded vintages; a "published
   at" readout that can never show a future vintage for the selected cutoff.
4. **AboutView** — sources, the decision-time rule, metric formulas, the scope
   caveat in full, the January window, fetch provenance (from `/api/meta`),
   and the AI-tools disclosure summary (full text in README).

## Chart rules (Recharts)
- X axis: settlement time (UTC, hourly ticks). Y axis: MW, labelled, starting
  at 0. Tooltip shows startTime, both values, residual, and the vintage's
  publishTime. Legend always visible. Charts are keyboard-operable via the
  adjacent data table (every chart has a table view toggle — this is also the
  accessibility story).
- No animation that delays reading; transitions ≤150ms, `prefers-reduced-motion`
  respected.

## States (design all four, ship all four)
- **Loading:** skeleton rows, no layout shift. **Empty:** "No vintage published
  before this cutoff" with the next available publishTime. **Error:** the API's
  plain message + retry. **Data-not-loaded:** cache-miss explanation + the fix
  (fetch script). Never blank, never zeros, never lorem ipsum.

## Accessibility (P0 — audit must pass)
- Semantic landmarks (`header`, `main`, `nav`, `table` with `th scope`).
- Every control labelled; selects have visible labels, not placeholder-only.
- Focus visible everywhere; full keyboard path: controls → chart table → metrics.
- Contrast ≥ 4.5:1 for text (check with `audit` on the rendered page).
- Charts never the only representation — table toggle on every chart.
- `prefers-reduced-motion` respected; no autoplaying/moving content.
- Responsive: 1280px full layout; 375px single column, controls stack, chart
  height preserved, no horizontal scroll.

## Responsive checkpoints (verify by screenshot at each)
375px, 768px, 1280px, 1600px. Check: no overlap, no clipped axis labels, the
caveat banner readable, tables scroll internally (not the page).

## Copy rules
- Units on every number (MW). Times always with UTC. "Forecast" vs "actual"
  never abbreviated ambiguously. Error copy states what happened + what to do.
- No exclamation marks, no "AI-powered", no accuracy claims beyond the data.

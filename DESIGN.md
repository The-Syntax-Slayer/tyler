# Design System

<!-- impeccable:design-schema 1 -->

## Design Direction & Mode
**Operate Mode**: Dense, clear, precise dashboard for energy traders and power procurement analysts. High contrast, high legibility, zero decorative clutter.

## Typography
- **UI & Prose**: `IBM Plex Sans`, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Data, Metrics, Timestamps**: `IBM Plex Mono`, Menlo, Monaco, Consolas, monospace
- **Scale**:
  - Headings: H1 24px (font-semibold, tracking-tight), H2 18px (font-semibold), H3 14px (font-medium, uppercase, tracking-wider)
  - Body: 14px base, 12px secondary / caption
  - Numerals: tabular numbers enabled everywhere (`font-variant-numeric: tabular-nums`)

## Color Tokens
- **Background & Canvas**:
  - Paper (body bg): `#f7f5ef`
  - Surface (card/panel bg): `#fffdf8`
  - Subtle Surface: `#f0eee6`
- **Text & Borders**:
  - Ink (primary text): `#16211f`
  - Muted Ink (secondary text): `#4b5563`
  - Line (borders & dividers): `#ddd8cc`
  - Focus Ring: `#0f766e`
- **Series & Domain Semantics**:
  - Forecast: `#2563eb` (Royal Blue)
  - Actual: `#d97706` (Amber / Ochre)
  - Residual Positive (Over-forecast): `#b91c1c` (Deep Red) + sign
  - Residual Negative (Under-forecast): `#1d4ed8` (Deep Blue) - sign
  - Accent / Action: `#0f766e` (Deep Teal)
- **Status Banners**:
  - Caveat Notice: Border `#d97706`, Background `#fffbeb`, Text `#92400e`

## Geometry & Elevation
- **Border Radius**:
  - Cards / Panels: `10px` (`rounded-xl` in Tailwind config)
  - Controls / Inputs / Buttons: `6px` (`rounded-md`)
  - Badges / Pills: `4px` (`rounded`)
- **Shadows**:
  - Surface elevation: single subtle drop shadow `0 1px 3px 0 rgba(22, 33, 31, 0.05), 0 1px 2px -1px rgba(22, 33, 31, 0.05)`
  - No deep or fuzzy multi-layer shadows, no neon glows.
- **Borders**:
  - `1px solid #ddd8cc` on all surface boundaries. No nested card-in-a-card stacking.

## Layout & Spatial System
- **Header**: Fixed/sticky top navigation bar with brand, live date/time indicator in UTC, navigation tabs, and dataset metadata pill.
- **Three-Column Dashboard Grid** (Responsive):
  - Left / Top: Filter and selection panel (Delivery Date, Cutoff Time, Stepper).
  - Centre: Primary visualization (Recharts Forecast vs Actual + Residual bars).
  - Right / Bottom: Quantitative metrics summary (MAE, RMSE, Bias, Pairs count) + scope note.
- **Accessibility & Dual Presentation**:
  - Every chart includes a toggle for a native HTML tabular view.
  - Tables have semantic headers with `scope="col"`, row striping, and keyboard navigation.

## Interaction & Motion
- Fast, predictable transitions (≤150ms).
- Immediate feedback on filter changes.
- Respect `prefers-reduced-motion: reduce` by disabling transitions.

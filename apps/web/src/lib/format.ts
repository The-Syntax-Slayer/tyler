/**
 * Canonical MW and UTC formatting. Every timestamp is rendered in UTC —
 * the market runs on UTC, so no local-timezone conversion is ever applied.
 * All parsing uses UTC getters, so output is identical in any timezone.
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function parseUTC(input: string): Date {
  // A bare YYYY-MM-DD date means midnight UTC on that day.
  return new Date(input.length === 10 ? `${input}T00:00:00Z` : input);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function grouped(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function formatMW(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '— MW';
  return `${grouped(value)} MW`;
}

export function formatResidualMW(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '— MW';
  if (value === 0) return '0 MW';
  const sign = value > 0 ? '+' : '-';
  return `${sign}${grouped(Math.abs(value))} MW`;
}

export function formatDateTimeUTC(input: string): string {
  const d = parseUTC(input);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

export function formatDateUTC(input: string): string {
  const d = parseUTC(input);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatTimeUTC(input: string): string {
  const d = parseUTC(input);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/** Hour-bucket tick for chart axes: 17:30 -> "17:00". */
export function formatHourTick(input: string): string {
  const d = parseUTC(input);
  return `${pad(d.getUTCHours())}:00`;
}

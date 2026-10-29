import { describe, it, expect } from 'vitest';
import {
  formatMW,
  formatResidualMW,
  formatDateTimeUTC,
  formatDateUTC,
  formatTimeUTC,
  formatHourTick,
} from '../lib/format';

describe('format utilities', () => {
  it('formats MW values correctly with thousand separators', () => {
    expect(formatMW(15420.4)).toBe('15,420 MW');
    expect(formatMW(0)).toBe('0 MW');
    expect(formatMW(null)).toBe('— MW');
    expect(formatMW(undefined)).toBe('— MW');
  });

  it('formats residual MW values with explicit +/- signs', () => {
    expect(formatResidualMW(5210.8)).toBe('+5,211 MW');
    expect(formatResidualMW(-3140.2)).toBe('-3,140 MW');
    expect(formatResidualMW(0)).toBe('0 MW');
    expect(formatResidualMW(null)).toBe('— MW');
  });

  it('formats UTC dates and times consistently', () => {
    const iso = '2025-12-31T17:30:00Z';
    expect(formatDateTimeUTC(iso)).toBe('31 Dec 2025, 17:30 UTC');
    expect(formatDateUTC(iso)).toBe('31 Dec 2025');
    expect(formatTimeUTC(iso)).toBe('17:30 UTC');
    expect(formatHourTick(iso)).toBe('17:00');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from '../lib/api';

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches health successfully', async () => {
    const mockHealth = {
      status: 'ok',
      cacheLoaded: true,
      settlementDates: 31,
      vintages: 224,
      cacheFetchedAt: '2026-10-29T19:01:30Z',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    } as Response);

    const res = await api.getHealth();
    expect(res).toEqual(mockHealth);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
  });

  it('throws ApiError with detail message on 503 cache miss', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ detail: 'FUELHH cache not found' }),
    } as Response);

    await expect(api.getDecision('2026-01-01', '2025-12-31T17:00:00Z')).rejects.toThrow(ApiError);
  });

  it('throws ApiError with detail on 422 validation failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'No forecast vintage published before cutoff' }),
    } as Response);

    await expect(api.getDecision('2026-01-01', '2020-01-01T00:00:00Z')).rejects.toThrow(ApiError);
  });
});

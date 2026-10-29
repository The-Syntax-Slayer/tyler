/**
 * Typed client for the FastAPI backend. Same-origin in every environment:
 * the frontend calls relative `/api/...`, the Vite dev server proxies to
 * localhost:8000, and Vercel mounts the Python function at `/api`.
 */

export interface HealthResponse {
  status: string;
  cacheLoaded: boolean;
  settlementDates: number;
  vintages: number;
  cacheFetchedAt: string | null;
}

export interface MetaResponse {
  sources: string[];
  window: { from: string; to: string };
  fetchedAt: string;
  apiKeyUsed: boolean;
  scopeNote: string;
}

export interface DecisionOption {
  deliveryDate: string;
  cutoffs: string[];
  defaultCutoff: string;
}

export interface DecisionsResponse {
  decisions: DecisionOption[];
}

export interface VintageMetadata {
  publishTime: string;
  note: string;
}

export interface AlignedSeriesPoint {
  startTime: string;
  settlementPeriod: number;
  forecastMW: number;
  actualMW: number;
  residualMW: number;
}

export interface MetricSummary {
  pairs: number;
  maeMW: number | null;
  rmseMW: number | null;
  biasMW: number | null;
  biasNote: string;
}

export interface DecisionResponse {
  deliveryDate: string;
  cutoff: string;
  vintage: VintageMetadata;
  series: AlignedSeriesPoint[];
  metrics: MetricSummary;
}

export interface VintagePoint {
  startTime: string;
  settlementPeriod?: number | null;
  forecastMW: number;
}

export interface VintageItem {
  publishTime: string;
  points: VintagePoint[];
}

export interface VintagesResponse {
  deliveryDate: string;
  vintages: VintageItem[];
}

export interface VintageAccuracyItem {
  deliveryDate: string;
  publishTime: string;
  pairs: number;
  maeMW: number;
  rmseMW: number;
  biasMW: number;
}

export interface HorizonAccuracyItem {
  horizonHours: number;
  pairs: number;
  maeMW: number;
  rmseMW: number;
  biasMW: number;
}

export interface AccuracyResponse {
  perVintage: VintageAccuracyItem[];
  perHorizonHours: HorizonAccuracyItem[];
  scopeNote: string;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body?.detail === 'string' && body.detail) detail = body.detail;
    } catch {
      // Keep the default message when the error body is not JSON.
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getHealth: () => request<HealthResponse>('/api/health'),
  getMeta: () => request<MetaResponse>('/api/meta'),
  getDecisions: () => request<DecisionsResponse>('/api/decisions'),
  getDecision: (deliveryDate: string, cutoff: string) =>
    request<DecisionResponse>(
      `/api/decision?${new URLSearchParams({ deliveryDate, cutoff }).toString()}`,
    ),
  getVintages: (deliveryDate: string) =>
    request<VintagesResponse>(
      `/api/vintages?${new URLSearchParams({ deliveryDate }).toString()}`,
    ),
  getAccuracy: () => request<AccuracyResponse>('/api/accuracy'),
};

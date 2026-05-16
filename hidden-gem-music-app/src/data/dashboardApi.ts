import type {
  ApiDiscoveryGap,
  ApiGapBucket,
  ApiIsolationEntry,
  ApiIsolationLeader,
  ApiOverlapRate,
  ApiPeakReach,
  ApiTrendPoint,
} from "../types/api";
import { getApiBaseUrl } from "./apiBaseUrl";
import { fetchWithTimeoutAndRetry } from "./fetchWithTimeout";

const overlapRateCache = new Map<string, ApiOverlapRate>();
const discoveryGapCache = new Map<string, ApiDiscoveryGap>();
const isolationLeaderCache = new Map<string, ApiIsolationLeader>();
const peakReachCache = new Map<string, ApiPeakReach>();
const overlapTrendCache = new Map<string, ApiTrendPoint[]>();
const isolationRankingCache = new Map<string, ApiIsolationEntry[]>();
const gapDistributionCache = new Map<string, ApiGapBucket[]>();

function dateRangeKey(start: string, end: string) {
  return `${start}::${end}`;
}

async function parseJsonResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed for ${endpoint} with status ${response.status}.`);
  }
  return (await response.json()) as T;
}

export async function loadOverlapRate(start: string, end: string): Promise<ApiOverlapRate> {
  const key = dateRangeKey(start, end);
  const cached = overlapRateCache.get(key);
  if (cached) return cached;
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/overlap-rate?start=${start}&end=${end}`;
  const response = await fetchWithTimeoutAndRetry(endpoint);
  const payload = await parseJsonResponse<ApiOverlapRate>(response, endpoint);
  overlapRateCache.set(key, payload);
  return payload;
}

export async function loadDiscoveryGap(start: string, end: string): Promise<ApiDiscoveryGap> {
  const key = dateRangeKey(start, end);
  const cached = discoveryGapCache.get(key);
  if (cached) return cached;
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/discovery-gap?start=${start}&end=${end}`;
  const response = await fetchWithTimeoutAndRetry(endpoint);
  const payload = await parseJsonResponse<ApiDiscoveryGap>(response, endpoint);
  discoveryGapCache.set(key, payload);
  return payload;
}

export async function loadIsolationLeader(start: string, end: string): Promise<ApiIsolationLeader> {
  const key = dateRangeKey(start, end);
  const cached = isolationLeaderCache.get(key);
  if (cached) return cached;
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/isolation-leader?start=${start}&end=${end}`;
  const response = await fetchWithTimeoutAndRetry(endpoint);
  const payload = await parseJsonResponse<ApiIsolationLeader>(response, endpoint);
  isolationLeaderCache.set(key, payload);
  return payload;
}

export async function loadPeakReach(start: string, end: string): Promise<ApiPeakReach> {
  const key = dateRangeKey(start, end);
  const cached = peakReachCache.get(key);
  if (cached) return cached;
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/peak-reach?start=${start}&end=${end}`;
  const response = await fetchWithTimeoutAndRetry(endpoint);
  const payload = await parseJsonResponse<ApiPeakReach>(response, endpoint);
  peakReachCache.set(key, payload);
  return payload;
}

export async function loadOverlapTrend(start: string, end: string): Promise<ApiTrendPoint[]> {
  const key = dateRangeKey(start, end);
  const cached = overlapTrendCache.get(key);
  if (cached) return cached;
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/overlap-trend?start=${start}&end=${end}`;
  const response = await fetchWithTimeoutAndRetry(endpoint);
  const payload = await parseJsonResponse<ApiTrendPoint[]>(response, endpoint);
  overlapTrendCache.set(key, payload);
  return payload;
}

export async function loadIsolationRanking(start: string, end: string): Promise<ApiIsolationEntry[]> {
  const key = dateRangeKey(start, end);
  const cached = isolationRankingCache.get(key);
  if (cached) return cached;
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/isolation-ranking?start=${start}&end=${end}`;
  const response = await fetchWithTimeoutAndRetry(endpoint);
  const payload = await parseJsonResponse<ApiIsolationEntry[]>(response, endpoint);
  isolationRankingCache.set(key, payload);
  return payload;
}

export async function loadGapDistribution(start: string, end: string): Promise<ApiGapBucket[]> {
  const key = dateRangeKey(start, end);
  const cached = gapDistributionCache.get(key);
  if (cached) return cached;
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/gap-distribution?start=${start}&end=${end}`;
  const response = await fetchWithTimeoutAndRetry(endpoint);
  const payload = await parseJsonResponse<ApiGapBucket[]>(response, endpoint);
  gapDistributionCache.set(key, payload);
  return payload;
}

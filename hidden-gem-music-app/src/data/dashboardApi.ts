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

async function parseJsonResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed for ${endpoint} with status ${response.status}.`);
  }
  return (await response.json()) as T;
}

export async function loadOverlapRate(start: string, end: string): Promise<ApiOverlapRate> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/overlap-rate?start=${start}&end=${end}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiOverlapRate>(response, endpoint);
}

export async function loadDiscoveryGap(start: string, end: string): Promise<ApiDiscoveryGap> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/discovery-gap?start=${start}&end=${end}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiDiscoveryGap>(response, endpoint);
}

export async function loadIsolationLeader(start: string, end: string): Promise<ApiIsolationLeader> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/isolation-leader?start=${start}&end=${end}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiIsolationLeader>(response, endpoint);
}

export async function loadPeakReach(start: string, end: string): Promise<ApiPeakReach> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/peak-reach?start=${start}&end=${end}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiPeakReach>(response, endpoint);
}

export async function loadOverlapTrend(start: string, end: string): Promise<ApiTrendPoint[]> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/overlap-trend?start=${start}&end=${end}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiTrendPoint[]>(response, endpoint);
}

export async function loadIsolationRanking(start: string, end: string): Promise<ApiIsolationEntry[]> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/isolation-ranking?start=${start}&end=${end}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiIsolationEntry[]>(response, endpoint);
}

export async function loadGapDistribution(start: string, end: string): Promise<ApiGapBucket[]> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/dashboard/gap-distribution?start=${start}&end=${end}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiGapBucket[]>(response, endpoint);
}

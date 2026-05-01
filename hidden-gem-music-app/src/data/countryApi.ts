import type { ApiCountryProfile, ApiCountrySongsPage, ApiHiddenGem } from "../types/api";

const DEFAULT_API_BASE_URL = "http://localhost:5140";

function getApiBaseUrl() {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : DEFAULT_API_BASE_URL;
}

async function parseJsonResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed for ${endpoint} with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function loadCountryProfile(countryCode: string, year: number): Promise<ApiCountryProfile> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/${countryCode}?year=${year}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiCountryProfile>(response, endpoint);
}

export async function loadCountryHiddenGemsPreview(countryCode: string, year: number, limit = 13): Promise<ApiHiddenGem[]> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/${countryCode}/hidden-gems/preview?year=${year}&limit=${limit}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiHiddenGem[]>(response, endpoint);
}

export async function loadAvailableYears(): Promise<number[]> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/metadata/years`;
  const response = await fetch(endpoint);
  const payload = await parseJsonResponse<unknown[]>(response, endpoint);

  return payload
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.trunc(value))
    .filter((value) => value > 0)
    .sort((a, b) => a - b);
}

export async function loadCountrySongsPage(
  countryCode: string,
  year: number,
  listType: "shared" | "unique",
  page: number,
  pageSize = 50
): Promise<ApiCountrySongsPage> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/${countryCode}/songs?year=${year}&listType=${listType}&page=${page}&pageSize=${pageSize}`;
  const response = await fetch(endpoint);
  return parseJsonResponse<ApiCountrySongsPage>(response, endpoint);
}

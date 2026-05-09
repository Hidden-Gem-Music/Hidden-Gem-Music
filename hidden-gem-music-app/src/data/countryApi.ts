import type { ApiCountryGenreSample, ApiCountryHiddenGemPreview, ApiCountryProfile, ApiCountrySongsPage, ApiHiddenGemResponse } from "../types/api";
import { getApiBaseUrl } from "./apiBaseUrl";

async function parseJsonResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed for ${endpoint} with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function loadCountryProfile(countryCode: string, year: number, signal?: AbortSignal): Promise<ApiCountryProfile> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/${countryCode}?year=${year}`;
  const response = await fetch(endpoint, { signal });
  return parseJsonResponse<ApiCountryProfile>(response, endpoint);
}

export async function loadCountryHiddenGemsPreview(
  countryCode: string,
  year: number,
  limit = 13,
  signal?: AbortSignal
): Promise<ApiCountryHiddenGemPreview[]> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/${countryCode}/hidden-gems/preview?year=${year}&limit=${limit}`;
  const response = await fetch(endpoint, { signal });
  return parseJsonResponse<ApiCountryHiddenGemPreview[]>(response, endpoint);
}

export async function loadHiddenGemsPage(
  countryCode: string,
  year: number,
  minCountries = 2,
  page = 1,
  pageSize = 25,
  signal?: AbortSignal
): Promise<ApiHiddenGemResponse> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/hidden-gems/${countryCode}?year=${year}&minCountries=${minCountries}&page=${page}&pageSize=${pageSize}`;
  const response = await fetch(endpoint, { signal });
  return parseJsonResponse<ApiHiddenGemResponse>(response, endpoint);
}

export async function loadAvailableYears(signal?: AbortSignal): Promise<number[]> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/metadata/years`;
  const response = await fetch(endpoint, { signal });
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
  pageSize = 50,
  signal?: AbortSignal
): Promise<ApiCountrySongsPage> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/${countryCode}/songs?year=${year}&listType=${listType}&page=${page}&pageSize=${pageSize}`;
  const response = await fetch(endpoint, { signal });
  return parseJsonResponse<ApiCountrySongsPage>(response, endpoint);
}

export async function loadCountryGenreSamples(
  countryCodes: string[],
  year: number,
  signal?: AbortSignal
): Promise<ApiCountryGenreSample[]> {
  const normalizedCodes = Array.from(
    new Set(
      countryCodes
        .map((code) => code.trim().toUpperCase())
        .filter((code) => /^[A-Z]{2}$/.test(code))
    )
  );

  if (normalizedCodes.length === 0) {
    return [];
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/genre-samples?year=${year}&codes=${encodeURIComponent(normalizedCodes.join(","))}`;
  const response = await fetch(endpoint, { signal });
  return parseJsonResponse<ApiCountryGenreSample[]>(response, endpoint);
}

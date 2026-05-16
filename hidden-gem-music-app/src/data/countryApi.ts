import type { ApiCountryGenreSample, ApiCountryHiddenGemPreview, ApiCountryProfile, ApiCountrySongsPage, ApiHiddenGemResponse } from "../types/api";
import { getApiBaseUrl } from "./apiBaseUrl";
import { fetchWithTimeoutAndRetry } from "./fetchWithTimeout";

const countryProfileCache = new Map<string, ApiCountryProfile>();
const countryHiddenGemsPreviewCache = new Map<string, ApiCountryHiddenGemPreview[]>();
const hiddenGemsPageCache = new Map<string, ApiHiddenGemResponse>();
const countrySongsPageCache = new Map<string, ApiCountrySongsPage>();
const countryGenreSampleCache = new Map<string, ApiCountryGenreSample>();

function buildCountryYearKey(countryCode: string, year: number) {
  return `${countryCode.trim().toUpperCase()}::${year}`;
}

function buildHiddenGemsPageKey(countryCode: string, year: number, minCountries: number, page: number, pageSize: number) {
  return `${buildCountryYearKey(countryCode, year)}::${minCountries}::${page}::${pageSize}`;
}

function buildCountrySongsPageKey(
  countryCode: string,
  year: number,
  listType: "shared" | "unique",
  page: number,
  pageSize: number
) {
  return `${buildCountryYearKey(countryCode, year)}::${listType}::${page}::${pageSize}`;
}

function buildCountryGenreSampleKey(countryCode: string, year: number) {
  return `${buildCountryYearKey(countryCode, year)}::genre-sample`;
}

async function parseJsonResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed for ${endpoint} with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function loadCountryProfile(countryCode: string, year: number, signal?: AbortSignal): Promise<ApiCountryProfile> {
  const cacheKey = buildCountryYearKey(countryCode, year);
  const cached = countryProfileCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/${countryCode}?year=${year}`;
  const response = await fetchWithTimeoutAndRetry(endpoint, {}, signal);
  const payload = await parseJsonResponse<ApiCountryProfile>(response, endpoint);
  countryProfileCache.set(cacheKey, payload);
  return payload;
}

export async function loadCountryHiddenGemsPreview(
  countryCode: string,
  year: number,
  limit = 13,
  signal?: AbortSignal
): Promise<ApiCountryHiddenGemPreview[]> {
  const cacheKey = `${buildCountryYearKey(countryCode, year)}::preview::${limit}`;
  const cached = countryHiddenGemsPreviewCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const hiddenGemsPage = await loadHiddenGemsPage(countryCode, year, 2, 1, limit, signal);
  const payload: ApiCountryHiddenGemPreview[] = hiddenGemsPage.items.map((item) => ({
    songName: item.songName,
    albumName: item.albumName,
    artistName: item.artistName,
    trendScore: item.trendScore,
    countriesChartingCount: item.countriesChartingCount,
    deezerTrackId: item.deezerTrackId,
    deezerAlbumId: item.deezerAlbumId,
    deezerArtistId: item.deezerArtistId,
    artistImageUrl: item.artistImageUrl,
    albumArtUrl: item.albumArtUrl,
    genres: item.genres,
    previewUrl: item.previewUrl,
    previewExpiresAtUtc: item.previewExpiresAtUtc,
    explicitLyrics: item.explicitLyrics,
    explicitContentCover: item.explicitContentCover,
    albumExplicitLyrics: item.albumExplicitLyrics,
    releaseDate: item.releaseDate,
    recordType: item.recordType,
    contributors: item.contributors,
    artistAlbumCount: item.artistAlbumCount,
    tracklist: item.tracklist,
  }));
  countryHiddenGemsPreviewCache.set(cacheKey, payload);
  return payload;
}

export async function loadHiddenGemsPage(
  countryCode: string,
  year: number,
  minCountries = 2,
  page = 1,
  pageSize = 25,
  signal?: AbortSignal
): Promise<ApiHiddenGemResponse> {
  const cacheKey = buildHiddenGemsPageKey(countryCode, year, minCountries, page, pageSize);
  const cached = hiddenGemsPageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/hidden-gems/${countryCode}?year=${year}&minCountries=${minCountries}&page=${page}&pageSize=${pageSize}`;
  const response = await fetchWithTimeoutAndRetry(endpoint, {}, signal);
  const payload = await parseJsonResponse<ApiHiddenGemResponse>(response, endpoint);
  hiddenGemsPageCache.set(cacheKey, payload);
  return payload;
}

let availableYearsPromise: Promise<number[]> | null = null;

export function loadAvailableYears(_signal?: AbortSignal): Promise<number[]> {
  if (availableYearsPromise !== null) {
    return availableYearsPromise;
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/metadata/years`;

  availableYearsPromise = fetchWithTimeoutAndRetry(endpoint)
    .then((response) => parseJsonResponse<unknown[]>(response, endpoint))
    .then((payload) =>
      payload
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .map((value) => Math.trunc(value))
        .filter((value) => value > 0)
        .sort((a, b) => a - b)
    )
    .catch((err: unknown) => {
      availableYearsPromise = null;
      throw err;
    });

  return availableYearsPromise;
}

export async function loadCountrySongsPage(
  countryCode: string,
  year: number,
  listType: "shared" | "unique",
  page: number,
  pageSize = 50,
  signal?: AbortSignal
): Promise<ApiCountrySongsPage> {
  const cacheKey = buildCountrySongsPageKey(countryCode, year, listType, page, pageSize);
  const cached = countrySongsPageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/${countryCode}/songs?year=${year}&listType=${listType}&page=${page}&pageSize=${pageSize}`;
  const response = await fetchWithTimeoutAndRetry(endpoint, {}, signal);
  const payload = await parseJsonResponse<ApiCountrySongsPage>(response, endpoint);
  countrySongsPageCache.set(cacheKey, payload);
  return payload;
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

  const cachedSamples = normalizedCodes
    .map((code) => countryGenreSampleCache.get(buildCountryGenreSampleKey(code, year)))
    .filter((entry): entry is ApiCountryGenreSample => Boolean(entry));
  const cachedCodes = new Set(cachedSamples.map((entry) => entry.countryCode.toUpperCase()));
  const missingCodes = normalizedCodes.filter((code) => !cachedCodes.has(code));

  if (missingCodes.length === 0) {
    return normalizedCodes
      .map((code) => countryGenreSampleCache.get(buildCountryGenreSampleKey(code, year)))
      .filter((entry): entry is ApiCountryGenreSample => Boolean(entry));
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/country/genre-samples?year=${year}&codes=${encodeURIComponent(missingCodes.join(","))}`;
  const response = await fetchWithTimeoutAndRetry(endpoint, {}, signal);
  const payload = await parseJsonResponse<ApiCountryGenreSample[]>(response, endpoint);
  payload.forEach((item) => {
    countryGenreSampleCache.set(buildCountryGenreSampleKey(item.countryCode, year), item);
  });

  return normalizedCodes
    .map((code) => countryGenreSampleCache.get(buildCountryGenreSampleKey(code, year)))
    .filter((entry): entry is ApiCountryGenreSample => Boolean(entry));
}

export function getCachedCountryGenreSamples(countryCode: string, year: number): string[] {
  return countryGenreSampleCache.get(buildCountryGenreSampleKey(countryCode, year))?.genres ?? [];
}

export function getCachedHiddenGemsPage(
  countryCode: string,
  year: number,
  minCountries = 2,
  page = 1,
  pageSize = 25
): ApiHiddenGemResponse | null {
  return hiddenGemsPageCache.get(buildHiddenGemsPageKey(countryCode, year, minCountries, page, pageSize)) ?? null;
}

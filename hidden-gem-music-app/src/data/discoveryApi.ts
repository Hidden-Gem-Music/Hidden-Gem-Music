import type { Country } from "../types/content";
import { mapApiCountryGlobeSummary } from "./apiMappers";
import type { ApiCountryGlobeSummary } from "../types/api";
import { getApiBaseUrl } from "./apiBaseUrl";
import { normalizeCountryDisplayName } from "./countryDisplay";
import { fetchWithTimeoutAndRetry } from "./fetchWithTimeout";

const discoveryCountriesCache = new Map<number, Country[]>();
const discoveryCountriesInFlight = new Map<number, Promise<Country[]>>();

export function loadDiscoveryCountries(year: number, fallbackCountries: Country[], _signal?: AbortSignal): Promise<Country[]> {
  const cached = discoveryCountriesCache.get(year);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inFlight = discoveryCountriesInFlight.get(year);
  if (inFlight) {
    return inFlight;
  }

  const existingByCode = new Map(fallbackCountries.map((country) => [country.code.toUpperCase(), country]));
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/discovery/countries?year=${year}`;

  const promise = fetchWithTimeoutAndRetry(endpoint)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Discovery country request failed with status ${response.status}.`);
      }
      return response.json() as Promise<ApiCountryGlobeSummary[]>;
    })
    .then((payload) => {
      const countries = payload
        .map((item, index) => {
          const mapped = mapApiCountryGlobeSummary(item);
          const normalizedCode = mapped.countryCode.toUpperCase();
          const existing = existingByCode.get(normalizedCode);

          return {
            id: `iso-${normalizedCode.toLowerCase() || index}`,
            code: normalizedCode,
            name: normalizeCountryDisplayName(mapped.countryName),
            region: mapped.region,
            lat: typeof mapped.lat === "number" ? mapped.lat : existing?.lat ?? 0,
            long: typeof mapped.long === "number" ? mapped.long : existing?.long ?? 0,
            hiddenSongs: mapped.hiddenSongs,
            genres: existing?.genres?.length ? existing.genres : ["Unknown"],
            album: mapped.topAlbum,
            albumArtist: mapped.topArtist,
            hasSongData: Boolean(item.topSongName?.trim() && item.topArtistName?.trim()),
            topSong: mapped.topSong,
            languages: existing?.languages?.length ? existing.languages : ["Unknown"],
            sceneNote: existing?.sceneNote ?? "Discovery details will expand as country profile data is connected.",
            featuredArtists: existing?.featuredArtists ?? [],
            markerTop: existing?.markerTop ?? "-20%",
            markerLeft: existing?.markerLeft ?? "-20%",
          };
        })
        .filter((country) => {
          const normalizedCode = country.code.trim().toUpperCase();
          const normalizedName = country.name.trim().toLowerCase();
          return normalizedCode !== "GLOBAL" && normalizedName !== "global";
        });

      discoveryCountriesCache.set(year, countries);
      discoveryCountriesInFlight.delete(year);
      return countries;
    })
    .catch((err: unknown) => {
      discoveryCountriesInFlight.delete(year);
      throw err;
    });

  discoveryCountriesInFlight.set(year, promise);
  return promise;
}

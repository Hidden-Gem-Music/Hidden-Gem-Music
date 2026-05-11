import type { Country } from "../types/content";
import { mapApiCountryGlobeSummary } from "./apiMappers";
import type { ApiCountryGlobeSummary } from "../types/api";
import { getApiBaseUrl } from "./apiBaseUrl";

export async function loadDiscoveryCountries(year: number, fallbackCountries: Country[], signal?: AbortSignal): Promise<Country[]> {
  const existingByCode = new Map(fallbackCountries.map((country) => [country.code.toUpperCase(), country]));
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/discovery/countries?year=${year}`;
  const response = await fetch(endpoint, { signal });

  if (!response.ok) {
    throw new Error(`Discovery country request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as ApiCountryGlobeSummary[];

  return payload
    .map((item, index) => {
    const mapped = mapApiCountryGlobeSummary(item);
    const normalizedCode = mapped.countryCode.toUpperCase();
    const existing = existingByCode.get(normalizedCode);

    return {
      id: `iso-${normalizedCode.toLowerCase() || index}`,
      code: normalizedCode,
      name: mapped.countryName,
      region: mapped.region,
      hiddenSongs: mapped.hiddenSongs,
      genres: existing?.genres?.length ? existing.genres : ["Unknown"],
      album: mapped.topAlbum,
      albumArtist: mapped.topArtist,
      hasSongData: Boolean(item.topAlbumName?.trim() && item.topArtistName?.trim()),
      topSong: existing?.topSong ?? "Unknown Song",
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
}

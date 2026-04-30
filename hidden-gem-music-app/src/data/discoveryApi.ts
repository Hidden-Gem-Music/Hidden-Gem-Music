import type { Country } from "../types/content";
import { mapApiCountryGlobeSummary } from "./apiMappers";
import type { ApiCountryGlobeSummary } from "../types/api";

const DEFAULT_API_BASE_URL = "http://localhost:5140";

function getApiBaseUrl() {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : DEFAULT_API_BASE_URL;
}

export async function loadDiscoveryCountries(year: number, fallbackCountries: Country[]): Promise<Country[]> {
  const existingByCode = new Map(fallbackCountries.map((country) => [country.code.toUpperCase(), country]));
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/discovery/countries?year=${year}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Discovery country request failed with status ${response.status}.`);
  }

  const payload = ((await response.json()) as unknown[]).map((item) => {
    const row = item as Record<string, unknown>;
    const hiddenGemCountRaw =
      row.hiddenGemCount ??
      row.HiddenGemCount ??
      row.hidden_gem_count ??
      row.hiddenSongCount ??
      row.hidden_song_count ??
      row.hiddenSongs ??
      0;
    const topAlbumNameRaw =
      row.topAlbumName ??
      row.TopAlbumName ??
      row.top_album_name ??
      row.albumName ??
      row.album_name ??
      null;
    const topArtistNameRaw =
      row.topArtistName ??
      row.TopArtistName ??
      row.top_artist_name ??
      row.artistName ??
      row.artist_name ??
      null;

    return {
      countryCode: (row.countryCode ?? row.CountryCode ?? row.country_code ?? "") as string | null,
      countryName: (row.countryName ?? row.CountryName ?? row.country_name ?? "") as string | null,
      region: (row.region ?? row.Region ?? null) as string | null,
      lat: Number(row.lat ?? row.Lat ?? row.latitude ?? row.Latitude ?? 0),
      long: Number(row.long ?? row.Long ?? row.longitude ?? row.Longitude ?? 0),
      hiddenGemCount: Number(hiddenGemCountRaw),
      topAlbumName: topAlbumNameRaw as string | null,
      topArtistName: topArtistNameRaw as string | null,
    } satisfies ApiCountryGlobeSummary;
  });

  return payload.map((item, index) => {
    const mapped = mapApiCountryGlobeSummary(item);
    const normalizedCode = mapped.countryCode.toUpperCase();
    const existing = existingByCode.get(normalizedCode);

    return {
      id: existing?.id ?? `iso-${normalizedCode.toLowerCase() || index}`,
      code: normalizedCode,
      name: mapped.countryName,
      region: mapped.region,
      hiddenSongs: mapped.hiddenSongs,
      genres: existing?.genres?.length ? existing.genres : ["Unknown"],
      album: mapped.topAlbum,
      albumArtist: mapped.topArtist,
      topSong: existing?.topSong ?? "Unknown Song",
      languages: existing?.languages?.length ? existing.languages : ["Unknown"],
      sceneNote: existing?.sceneNote ?? "Discovery details will expand as country profile data is connected.",
      featuredArtists: existing?.featuredArtists ?? [],
      markerTop: existing?.markerTop ?? "-20%",
      markerLeft: existing?.markerLeft ?? "-20%",
    };
  });
}

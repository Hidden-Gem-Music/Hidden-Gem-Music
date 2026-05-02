import type {
  ApiComparisonResult,
  ApiCountryComparisonSide,
  ApiCountryGlobeSummary,
  ApiCountryProfile,
  ApiHiddenGem,
  ApiHiddenGemResponse,
  ApiSharedSong,
  ApiSong,
} from "../types/api";

export type UiSongPreview = {
  title: string;
  artist: string;
  album: string;
};

export type UiSharedSongPreview = UiSongPreview & {
  rankA: number;
  rankB: number;
};

export type UiCountryProfile = {
  countryCode: string;
  countryName: string;
  year: number;
  totalCharted: number;
  sharedCount: number;
  uniqueCount: number;
  overlapPercent: number;
  topSharedSongs: UiSongPreview[];
  topUniqueSongs: UiSongPreview[];
};

export type UiCountryComparisonSide = {
  countryCode: string;
  countryName: string;
  totalCharted: number;
  sharedCount: number;
  uniqueCount: number;
  overlapPercent: number;
};

export type UiComparisonResult = {
  countryA: UiCountryComparisonSide | null;
  countryB: UiCountryComparisonSide | null;
  sharedSongs: UiSharedSongPreview[];
  uniqueToA: UiSongPreview[];
  uniqueToB: UiSongPreview[];
};

export type UiHiddenGem = UiSongPreview & {
  genre: string;
  previewUrl: string;
  trendScore: number;
  countriesChartingCount: number;
};

export type UiHiddenGemPage = {
  items: UiHiddenGem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
};

export type UiCountryGlobeSummary = {
  countryCode: string;
  countryName: string;
  region: string;
  lat: number;
  long: number;
  hiddenSongs: number;
  topAlbum: string;
  topArtist: string;
};

const toNonEmpty = (value: string | null | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

export const mapApiSong = (song: ApiSong): UiSongPreview => ({
  title: toNonEmpty(song.songName, "Unknown Song"),
  artist: toNonEmpty(song.artistName, "Unknown Artist"),
  album: toNonEmpty(song.albumName, "Unknown Album"),
});

export const mapApiSharedSong = (song: ApiSharedSong): UiSharedSongPreview => ({
  title: toNonEmpty(song.songName, "Unknown Song"),
  artist: toNonEmpty(song.artistName, "Unknown Artist"),
  album: "Unknown Album",
  rankA: song.rankA,
  rankB: song.rankB,
});

export const mapApiCountryProfile = (profile: ApiCountryProfile): UiCountryProfile => ({
  countryCode: toNonEmpty(profile.countryCode, ""),
  countryName: toNonEmpty(profile.countryName, "Unknown Country"),
  year: profile.year,
  totalCharted: profile.totalCharted,
  sharedCount: profile.sharedCount,
  uniqueCount: profile.uniqueCount,
  overlapPercent: profile.overlapPct,
  topSharedSongs: profile.topSharedSongs.map(mapApiSong),
  topUniqueSongs: profile.topUniqueSongs.map(mapApiSong),
});

export const mapApiComparisonSide = (side: ApiCountryComparisonSide): UiCountryComparisonSide => ({
  countryCode: toNonEmpty(side.countryCode, ""),
  countryName: toNonEmpty(side.countryName, "Unknown Country"),
  totalCharted: side.totalCharted,
  sharedCount: side.sharedCount,
  uniqueCount: side.uniqueCount,
  overlapPercent: side.overlapPct,
});

export const mapApiComparisonResult = (result: ApiComparisonResult): UiComparisonResult => ({
  countryA: result.countryA ? mapApiComparisonSide(result.countryA) : null,
  countryB: result.countryB ? mapApiComparisonSide(result.countryB) : null,
  sharedSongs: result.sharedSongs.map(mapApiSharedSong),
  uniqueToA: result.uniqueToA.map(mapApiSong),
  uniqueToB: result.uniqueToB.map(mapApiSong),
});

export const mapApiHiddenGem = (item: ApiHiddenGem): UiHiddenGem => ({
  ...mapApiSong(item),
  genre: toNonEmpty(item.genre, "Unknown Genre"),
  previewUrl: toNonEmpty(item.previewUrl, ""),
  trendScore: item.trendScore,
  countriesChartingCount: item.countriesChartingCount,
});

export const mapApiHiddenGemPage = (response: ApiHiddenGemResponse): UiHiddenGemPage => ({
  items: response.items.map(mapApiHiddenGem),
  page: response.page,
  pageSize: response.pageSize,
  totalCount: response.totalCount,
  hasMore: response.hasMore,
});

export const mapApiCountryGlobeSummary = (item: ApiCountryGlobeSummary): UiCountryGlobeSummary => ({
  countryCode: toNonEmpty(item.countryCode, ""),
  countryName: toNonEmpty(item.countryName, "Unknown Country"),
  region: toNonEmpty(item.region, "Continent info coming soon."),
  lat: item.lat,
  long: item.long,
  hiddenSongs: item.hiddenGemCount,
  topAlbum: toNonEmpty(item.topAlbumName, "Unknown Album"),
  topArtist: toNonEmpty(item.topArtistName, "Unknown Artist"),
});

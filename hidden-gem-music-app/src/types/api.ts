export type ApiSong = {
  songName: string | null;
  artistName: string | null;
  albumName: string | null;
  deezerTrackId?: number | null;
  deezerAlbumId?: number | null;
  deezerArtistId?: number | null;
  artistImageUrl?: string | null;
  albumArtUrl?: string | null;
  genres?: string[] | null;
  previewUrl?: string | null;
  previewExpiresAtUtc?: string | null;
  explicitLyrics?: boolean | null;
  explicitContentCover?: boolean | null;
  albumExplicitLyrics?: boolean | null;
  releaseDate?: string | null;
  recordType?: string | null;
  contributors?: string[] | null;
  artistAlbumCount?: number | null;
  tracklist?: string[] | null;
};

export type ApiSharedSong = {
  songName: string | null;
  artistName: string | null;
  rankA: number;
  rankB: number;
};

export type ApiCountryProfile = {
  countryCode: string | null;
  countryName: string | null;
  year: number;
  totalCharted: number;
  sharedCount: number;
  uniqueCount: number;
  overlapPct: number;
  topSharedSongs: ApiSong[];
  topUniqueSongs: ApiSong[];
  sampleGenres?: string[] | null;
};

export type ApiCountrySongsPage = {
  items: ApiSong[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
};

export type ApiCountryComparisonSide = {
  countryCode: string | null;
  countryName: string | null;
  totalCharted: number;
  sharedCount: number;
  uniqueCount: number;
  overlapPct: number;
};

export type ApiComparisonResult = {
  countryA: ApiCountryComparisonSide | null;
  countryB: ApiCountryComparisonSide | null;
  sharedSongs: ApiSharedSong[];
  uniqueToA: ApiSong[];
  uniqueToB: ApiSong[];
};

export type ApiHiddenGem = {
  songName: string | null;
  albumName: string | null;
  artistName: string | null;
  genre: string | null;
  deezerTrackId?: number | null;
  deezerAlbumId?: number | null;
  deezerArtistId?: number | null;
  artistImageUrl?: string | null;
  albumArtUrl?: string | null;
  genres?: string[] | null;
  previewUrl?: string | null;
  previewExpiresAtUtc?: string | null;
  explicitLyrics?: boolean | null;
  explicitContentCover?: boolean | null;
  albumExplicitLyrics?: boolean | null;
  releaseDate?: string | null;
  recordType?: string | null;
  contributors?: string[] | null;
  artistAlbumCount?: number | null;
  tracklist?: string[] | null;
  trendScore: number;
  countriesChartingCount: number;
};

export type ApiCountryHiddenGemPreview = {
  songName: string | null;
  albumName: string | null;
  artistName: string | null;
  trendScore: number;
  countriesChartingCount: number;
  deezerTrackId?: number | null;
  deezerAlbumId?: number | null;
  deezerArtistId?: number | null;
  artistImageUrl?: string | null;
  albumArtUrl?: string | null;
  genres?: string[] | null;
  previewUrl?: string | null;
  previewExpiresAtUtc?: string | null;
  explicitLyrics?: boolean | null;
  explicitContentCover?: boolean | null;
  albumExplicitLyrics?: boolean | null;
  releaseDate?: string | null;
  recordType?: string | null;
  contributors?: string[] | null;
  artistAlbumCount?: number | null;
  tracklist?: string[] | null;
};

export type ApiHiddenGemResponse = {
  items: ApiHiddenGem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
};

export type ApiCountryGlobeSummary = {
  countryCode: string | null;
  countryName: string | null;
  region: string | null;
  lat: number;
  long: number;
  hiddenGemCount: number;
  topAlbumName: string | null;
  topArtistName: string | null;
};

export type ApiCountryGenreSample = {
  countryCode: string;
  genres: string[];
};

export type ApiOverlapRate = {
  overlapPct: number;
  totalUniqueSongs: number;
  songsIn2Plus: number;
};

export type ApiDiscoveryGap = {
  avgGapDays: number;
  medianGapDays: number;
  sampleSize: number;
};

export type ApiIsolationLeader = {
  countryName: string;
  isoCode: string;
  isolationScore: number;
};

export type ApiPeakReach = {
  peakCountryCount: number;
  songTitle: string;
  artistName: string;
  peakDate: string;
  albumArtUrl?: string | null;
};

export type ApiTrendPoint = {
  periodLabel: string;
  periodYear: number;
  periodMonth: number | null;
  overlapPct: number;
  avgCountries: number;
  totalUniqueSongs: number;
  songsIn2Plus: number;
  isGap: boolean;
};

export type ApiIsolationEntry = {
  countryName: string;
  isoCode: string;
  isolationScore: number;
  isolationTier: "high" | "mid" | "low";
};

export type ApiGapBucket = {
  bucketLabel: string;
  bucketOrder: number;
  songCount: number;
};

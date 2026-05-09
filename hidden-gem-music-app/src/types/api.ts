export type ApiSong = {
  songName: string | null;
  artistName: string | null;
  albumName: string | null;
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
  previewUrl: string | null;
  trendScore: number;
  countriesChartingCount: number;
};

export type ApiHiddenGemResponse = {
  items: ApiHiddenGem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
};

export type ApiCountryHiddenGemPreview = {
  songName: string | null;
  artistName: string | null;
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

export type ApiCountrySongsPage = {
  items: ApiSong[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
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

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

export type Country = {
  id: string;
  code: string;
  name: string;
  region: string;
  hiddenSongs: number;
  genres: string[];
  album: string;
  albumArtist: string;
  topSong: string;
  languages: string[];
  sceneNote: string;
  featuredArtists: string[];
  markerTop: string;
  markerLeft: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  genres: string[];
  languages: string[];
  year: number;
  duration: string;
  description: string;
  spotifySearchUrl: string;
};

import { Country, Song } from "../types/content";

export const availableYears = Array.from({ length: 2021 - 1975 + 1 }, (_, index) => 1975 + index);

type CountrySeed = Country & {
  albumVariants: string[];
  artistVariants: string[];
  genrePool: string[];
  songPool: string[];
};

const countrySeeds: CountrySeed[] = [
  {
    id: "usa",
    code: "US",
    name: "USA",
    region: "North America",
    hiddenSongs: 139,
    genres: ["Pop", "Rock", "Country"],
    album: "Neon Horizon",
    albumArtist: "Skyline Youth",
    topSong: "Gold Static",
    languages: ["English"],
    sceneNote: "A broad mix of indie pop, country crossover, and regional alt scenes.",
    featuredArtists: ["Skyline Youth", "Velvet Relay", "Juniper Motel"],
    markerTop: "22%",
    markerLeft: "47%",
    albumVariants: ["Neon Horizon", "After Hours Atlas", "Signal Motel", "Velvet Receiver"],
    artistVariants: ["Skyline Youth", "Velvet Relay", "Juniper Motel", "Copper Static"],
    genrePool: ["Pop", "Rock", "Country", "Alt Pop", "Americana", "Synth Pop"],
    songPool: ["Gold Static", "Midnight Receipt", "Velvet Receiver", "Highway Bloom"],
  },
  {
    id: "canada",
    code: "CA",
    name: "Canada",
    region: "North America",
    hiddenSongs: 112,
    genres: ["Indie", "Folk", "Alt Pop"],
    album: "Northern Bloom",
    albumArtist: "Aurora Lane",
    topSong: "Aurora Thread",
    languages: ["English", "French"],
    sceneNote: "Strong independent scenes with bilingual crossover and moody folk textures.",
    featuredArtists: ["Aurora Lane", "Cedar Parade", "The New Tides"],
    markerTop: "12%",
    markerLeft: "56%",
    albumVariants: ["Northern Bloom", "Blue Current", "Frostline", "Harborline"],
    artistVariants: ["Aurora Lane", "Cedar Parade", "The New Tides", "Glass Pines"],
    genrePool: ["Indie", "Folk", "Alt Pop", "Dream Pop", "Chamber Pop", "Synth Folk"],
    songPool: ["Aurora Thread", "Silver Pines", "Harborline", "Northlight"],
  },
  {
    id: "mexico",
    code: "MX",
    name: "Mexico",
    region: "North America",
    hiddenSongs: 94,
    genres: ["Regional", "Pop", "Alternative"],
    album: "Sol de Medianoche",
    albumArtist: "Valeria Cruz",
    topSong: "Ritmo Escondido",
    languages: ["Spanish"],
    sceneNote: "Regional sounds mix with modern alt-pop and dark electronic influences.",
    featuredArtists: ["Valeria Cruz", "Noche de Cobre", "Pueblo Lunar"],
    markerTop: "49%",
    markerLeft: "44%",
    albumVariants: ["Sol de Medianoche", "Noche Solar", "Luz de Barrio", "Brillo Escondido"],
    artistVariants: ["Valeria Cruz", "Noche de Cobre", "Pueblo Lunar", "Luna del Sur"],
    genrePool: ["Regional", "Pop", "Alternative", "Electronic", "Indie Pop", "Dance"],
    songPool: ["Ritmo Escondido", "Calles de Cristal", "Latidos de Neon", "Pulso Lunar"],
  },
  {
    id: "england",
    code: "GB",
    name: "England",
    region: "Europe",
    hiddenSongs: 87,
    genres: ["Indie Rock", "Garage", "Dream Pop"],
    album: "Glass District",
    albumArtist: "Fever Harbour",
    topSong: "Static on the Strand",
    languages: ["English"],
    sceneNote: "Dense clusters of guitar-forward indie and leftfield dream pop.",
    featuredArtists: ["Fever Harbour", "Station Bloom", "North Arcade"],
    markerTop: "27%",
    markerLeft: "71%",
    albumVariants: ["Glass District", "Grey District", "Southbound Static", "Platform Fever"],
    artistVariants: ["Fever Harbour", "Station Bloom", "North Arcade", "South Parade"],
    genrePool: ["Indie Rock", "Garage", "Dream Pop", "Post Punk", "Britpop", "Synth Pop"],
    songPool: ["Static on the Strand", "Station to Station", "Platform Fever", "Grey Parade"],
  },
  {
    id: "france",
    code: "FR",
    name: "France",
    region: "Europe",
    hiddenSongs: 102,
    genres: ["Electro Pop", "House", "Alt Pop"],
    album: "Velvet City",
    albumArtist: "Lune Arcade",
    topSong: "Rouge Minuit",
    languages: ["French", "English"],
    sceneNote: "Club-adjacent pop with strong synth production and cinematic hooks.",
    featuredArtists: ["Lune Arcade", "Cinema Bleu", "Hotel Mirage"],
    markerTop: "33%",
    markerLeft: "73%",
    albumVariants: ["Velvet City", "Lumiere Club", "Cinema Rouge", "Rouge Circuit"],
    artistVariants: ["Lune Arcade", "Cinema Bleu", "Hotel Mirage", "Atelier Nuit"],
    genrePool: ["Electro Pop", "House", "Alt Pop", "Disco", "Synth Pop", "Dance"],
    songPool: ["Rouge Minuit", "Nuit Magnifique", "Rouge Circuit", "Club Lumiere"],
  },
  {
    id: "switzerland",
    code: "CH",
    name: "Switzerland",
    region: "Europe",
    hiddenSongs: 58,
    genres: ["Electronic", "Folk", "Ambient"],
    album: "Alpine Echoes",
    albumArtist: "Noir Cascade",
    topSong: "Cable Car Sleep",
    languages: ["German", "French", "English"],
    sceneNote: "Ambient electronic work sits alongside melodic folk-pop and darkwave cuts.",
    featuredArtists: ["Noir Cascade", "Helvetic Fade", "Lake Circuit"],
    markerTop: "34%",
    markerLeft: "75%",
    albumVariants: ["Alpine Echoes", "Echoes Between Peaks", "Winter Relay", "Glass Tram"],
    artistVariants: ["Noir Cascade", "Lake Circuit", "Helvetic Fade", "Summit Relay"],
    genrePool: ["Electronic", "Folk", "Ambient", "Dream Pop", "Darkwave", "Neo Folk"],
    songPool: ["Cable Car Sleep", "Summit Static", "Glass Tram", "Snowline Pulse"],
  },
  {
    id: "norway",
    code: "NO",
    name: "Norway",
    region: "Europe",
    hiddenSongs: 38,
    genres: ["Synthwave", "Art Pop", "Electronic"],
    album: "In the Hollow of a Wave",
    albumArtist: "Monstereo",
    topSong: "Afterlight Signal",
    languages: ["Norwegian", "English"],
    sceneNote: "Synth-driven projects with a cinematic, cold-climate art-pop edge.",
    featuredArtists: ["Monstereo", "Polar Theatre", "Signal Lantern"],
    markerTop: "15%",
    markerLeft: "73%",
    albumVariants: ["In the Hollow of a Wave", "Northern Delay", "Glacier Theatre", "White Noise Fjord"],
    artistVariants: ["Monstereo", "Signal Lantern", "Polar Theatre", "Arctic Relay"],
    genrePool: ["Synthwave", "Art Pop", "Electronic", "Ambient", "Dream Pop", "Dark Synth"],
    songPool: ["Afterlight Signal", "White Noise Fjord", "Icepulse", "Polar Theatre"],
  },
  {
    id: "japan",
    code: "JP",
    name: "Japan",
    region: "Asia",
    hiddenSongs: 121,
    genres: ["City Pop", "Rock", "Electronic"],
    album: "Shibuya Skyline",
    albumArtist: "Akari Field",
    topSong: "Neon Rail",
    languages: ["Japanese", "English"],
    sceneNote: "City pop revival, guitar bands, and electronic crossover keep surfacing.",
    featuredArtists: ["Akari Field", "Metro Bloom", "Orbit Capsule"],
    markerTop: "31%",
    markerLeft: "88%",
    albumVariants: ["Shibuya Skyline", "Yamanote Glow", "Metro Twilight", "Terminal Hearts"],
    artistVariants: ["Akari Field", "Metro Bloom", "Orbit Capsule", "Shinjuku Pulse"],
    genrePool: ["City Pop", "Rock", "Electronic", "Synth Pop", "Dream Pop", "Disco"],
    songPool: ["Neon Rail", "Crosswalk Memory", "Terminal Hearts", "Shibuya Echo"],
  },
];

const norwaySongTemplates: Omit<Song, "id" | "year">[] = [
  {
    title: "In the Hollow of a Wave",
    artist: "Monstereo",
    album: "In the Hollow of a Wave",
    genres: ["Synthwave", "Electronic", "Cinematic"],
    languages: ["Norwegian", "English"],
    duration: "3:34",
    description: "Cold synth textures with a widescreen chorus and layered analog pulses.",
    spotifySearchUrl: "https://open.spotify.com/search/Monstereo%20In%20the%20Hollow%20of%20a%20Wave",
  },
  {
    title: "Static Heartline",
    artist: "Monstereo",
    album: "In the Hollow of a Wave",
    genres: ["Synthwave", "Alt Pop", "Electronic"],
    languages: ["Norwegian"],
    duration: "4:02",
    description: "Sharper hooks and a darker bassline than the lead single.",
    spotifySearchUrl: "https://open.spotify.com/search/Monstereo%20Static%20Heartline",
  },
  {
    title: "Afterlight Signal",
    artist: "Monstereo",
    album: "In the Hollow of a Wave",
    genres: ["Electronic", "Dream Pop", "Synthwave"],
    languages: ["English"],
    duration: "3:18",
    description: "A brighter melodic cut that feels built for late-night driving.",
    spotifySearchUrl: "https://open.spotify.com/search/Monstereo%20Afterlight%20Signal",
  },
  {
    title: "Polar Theatre",
    artist: "Monstereo",
    album: "In the Hollow of a Wave",
    genres: ["Art Pop", "Electronic", "Ambient"],
    languages: ["Norwegian", "English"],
    duration: "4:21",
    description: "Theatrical arrangement with strong drums and moody vocal layering.",
    spotifySearchUrl: "https://open.spotify.com/search/Monstereo%20Polar%20Theatre",
  },
  {
    title: "Midnight Artery",
    artist: "Monstereo",
    album: "In the Hollow of a Wave",
    genres: ["Electronic", "Indie", "Synthwave"],
    languages: ["English"],
    duration: "3:49",
    description: "A concise and atmospheric closer with a warmer vocal mix.",
    spotifySearchUrl: "https://open.spotify.com/search/Monstereo%20Midnight%20Artery",
  },
];

function getYearOffset(year: number, countryId: string) {
  const baseIndex = countrySeeds.findIndex((country) => country.id === countryId);
  return year - 1975 + baseIndex * 3;
}

function rotateValues(values: string[], offset: number) {
  return Array.from({ length: 3 }, (_, index) => values[(offset + index) % values.length]);
}

function getCountrySeed(countryId: string) {
  return countrySeeds.find((country) => country.id === countryId) ?? countrySeeds[0];
}

function buildCountryForYear(seed: CountrySeed, year: number): Country {
  const offset = getYearOffset(year, seed.id);
  const swing = ((offset * 17) % 33) - 16;
  const hiddenSongs = Math.max(18, seed.hiddenSongs - 24 + swing + ((year - 1975) % 11));
  const album = seed.albumVariants[offset % seed.albumVariants.length];
  const albumArtist = seed.artistVariants[offset % seed.artistVariants.length];
  const genres = rotateValues(seed.genrePool, offset);
  const topSong = seed.songPool[offset % seed.songPool.length];
  const featuredArtists = rotateValues(seed.artistVariants, offset);

  return {
    ...seed,
    hiddenSongs,
    album,
    albumArtist,
    genres,
    topSong,
    featuredArtists,
    sceneNote: `${seed.sceneNote} ${year} view highlights ${albumArtist} and ${topSong}.`,
  };
}

export function getCountriesForYear(year: number): Country[] {
  return countrySeeds.map((country) => buildCountryForYear(country, year));
}

export function getCountryByYear(countryId: string, year: number): Country {
  return getCountriesForYear(year).find((country) => country.id === countryId) ?? getCountriesForYear(year)[0];
}

export function getFeaturedCountry(year: number) {
  return getCountryByYear("switzerland", year);
}

export function getDefaultComparisonIds() {
  return ["france", "japan"];
}

export function getSongsForCountryYear(countryId: string, year: number): Song[] {
  const country = getCountryByYear(countryId, year);
  const baseTemplates =
    countryId === "norway"
      ? norwaySongTemplates
      : Array.from({ length: 5 }, (_, index) => ({
          title: `${country.topSong} ${index + 1}`,
          artist: country.featuredArtists[index % country.featuredArtists.length],
          album: country.album,
          genres: rotateValues(country.genres, index),
          languages: country.languages,
          duration: `3:${String(8 + ((year + index * 7) % 49)).padStart(2, "0")}`,
          description: `A representative hidden-gem cut from ${country.name}'s ${year} dataset.`,
          spotifySearchUrl: `https://open.spotify.com/search/${encodeURIComponent(
            `${country.featuredArtists[index % country.featuredArtists.length]} ${country.album}`
          )}`,
        }));

  const rotateBy = (2021 - year + getYearOffset(year, countryId)) % baseTemplates.length;
  const rotated = [...baseTemplates.slice(rotateBy), ...baseTemplates.slice(0, rotateBy)];

  return rotated.map((song, index) => ({
    ...song,
    title: `${song.title}`,
    artist: country.featuredArtists[(index + rotateBy) % country.featuredArtists.length] ?? song.artist,
    album: country.album,
    genres: rotateValues(country.genres, index),
    languages: country.languages,
    spotifySearchUrl: `https://open.spotify.com/search/${encodeURIComponent(
      `${country.featuredArtists[(index + rotateBy) % country.featuredArtists.length] ?? song.artist} ${song.title}`
    )}`,
    id: `${countryId}-${year}-${index + 1}`,
    year,
  }));
}

export function getDashboardMetrics(year: number, countries: Country[]) {
  const totalHiddenSongs = countries.reduce((sum, country) => sum + country.hiddenSongs, 0);
  const mostRepresentedRegion =
    countries.reduce<Record<string, number>>((acc, country) => {
      acc[country.region] = (acc[country.region] ?? 0) + country.hiddenSongs;
      return acc;
    }, {});
  const topRegion = Object.entries(mostRepresentedRegion).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown";

  return [
    {
      label: "Countries Tracked",
      value: `${countries.length}`,
      detail: `Live globe/list coverage for ${year}.`,
    },
    {
      label: "Hidden Songs Indexed",
      value: `${totalHiddenSongs}`,
      detail: "Aggregated across the current yearly slice.",
    },
    {
      label: "Busiest Region",
      value: topRegion,
      detail: "Highest hidden-song concentration in the current mock dataset.",
    },
  ];
}

export function searchLibrary(query: string, year: number) {
  const normalized = query.trim().toLowerCase();
  const countries = getCountriesForYear(year).filter((country) => {
    if (!normalized) {
      return true;
    }
    return (
      country.name.toLowerCase().includes(normalized) ||
      country.region.toLowerCase().includes(normalized) ||
      country.genres.some((genre) => genre.toLowerCase().includes(normalized)) ||
      country.album.toLowerCase().includes(normalized)
    );
  });

  const songs = getCountriesForYear(year).flatMap((country) =>
    getSongsForCountryYear(country.id, year)
      .filter((song) => {
        if (!normalized) {
          return false;
        }
        return (
          song.title.toLowerCase().includes(normalized) ||
          song.artist.toLowerCase().includes(normalized) ||
          song.album.toLowerCase().includes(normalized) ||
          song.genres.some((genre) => genre.toLowerCase().includes(normalized))
        );
      })
      .map((song) => ({ ...song, countryName: country.name, countryId: country.id }))
  );

  return { countries, songs };
}

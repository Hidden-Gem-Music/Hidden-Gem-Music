import type { ApiLanguageSongLookupItem, ApiLanguageSongMatch } from "../types/api";
import { getApiBaseUrl } from "./apiBaseUrl";

export type LanguageEnrichedSong = {
  title: string;
  artist: string;
  languages?: string[];
  lyricsUrl?: string;
};

const languageMatchCache = new Map<string, ApiLanguageSongMatch | null>();
const NON_LANGUAGE_LABELS = new Set([
  "another language goes here",
  "instrumental",
  "loading",
  "loading...",
  "n/a",
  "none",
  "other",
  "this song is an instrumental",
  "unknown",
]);

export function formatLanguageLabel(language: string) {
  return language.trim().replace(/\s+\([a-z]{2,3}\)$/i, "");
}

function isUsableLanguageLabel(language: string) {
  const normalized = language.trim().toLowerCase();
  return normalized.length > 0 && !NON_LANGUAGE_LABELS.has(normalized);
}

function normalizeLookupValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildLanguageLookupKey(songName: string | null | undefined, artistName: string | null | undefined) {
  const normalizedSong = normalizeLookupValue(songName);
  const normalizedArtist = normalizeLookupValue(artistName);
  return normalizedSong && normalizedArtist ? `${normalizedSong}::${normalizedArtist}` : "";
}

async function requestLanguageMatches(songs: ApiLanguageSongLookupItem[], signal?: AbortSignal) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/language/songs`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ songs }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${endpoint} with status ${response.status}.`);
  }

  return (await response.json()) as ApiLanguageSongMatch[];
}

export async function loadLanguageMatchesForSongs<T extends LanguageEnrichedSong>(songs: T[], signal?: AbortSignal): Promise<Map<string, ApiLanguageSongMatch>> {
  const keysToRequest = new Set<string>();
  const songsToRequest: ApiLanguageSongLookupItem[] = [];

  songs.forEach((song) => {
    const key = buildLanguageLookupKey(song.title, song.artist);
    if (!key || languageMatchCache.has(key) || keysToRequest.has(key)) {
      return;
    }

    keysToRequest.add(key);
    songsToRequest.push({ songName: song.title, artistName: song.artist });
  });

  if (songsToRequest.length > 0) {
    const matches = await requestLanguageMatches(songsToRequest, signal);
    const matchedByKey = new Map(matches.map((match) => [buildLanguageLookupKey(match.songName, match.artistName), match]));
    keysToRequest.forEach((key) => {
      languageMatchCache.set(key, matchedByKey.get(key) ?? null);
    });
  }

  const result = new Map<string, ApiLanguageSongMatch>();
  songs.forEach((song) => {
    const key = buildLanguageLookupKey(song.title, song.artist);
    const match = key ? languageMatchCache.get(key) : null;
    if (key && match) {
      result.set(key, match);
    }
  });

  return result;
}

export async function enrichSongsWithLanguage<T extends LanguageEnrichedSong>(songs: T[], signal?: AbortSignal): Promise<T[]> {
  if (songs.length === 0) {
    return songs;
  }

  const matches = await loadLanguageMatchesForSongs(songs, signal);
  return songs.map((song) => {
    const match = matches.get(buildLanguageLookupKey(song.title, song.artist));
    if (!match) {
      return song;
    }

    return {
      ...song,
      languages: match.languages,
      lyricsUrl: match.lyricsUrl,
    };
  });
}

export function collectUniqueLanguagesFromSongs(songs: LanguageEnrichedSong[], limit: number) {
  const seen = new Set<string>();
  const results: string[] = [];

  songs.slice(0, limit).forEach((song) => {
    (song.languages ?? [])
      .map(formatLanguageLabel)
      .filter(isUsableLanguageLabel)
      .forEach((language) => {
        const normalized = language.toLowerCase();
        if (seen.has(normalized)) {
          return;
        }
        seen.add(normalized);
        results.push(language);
      });
  });

  return results;
}

export function formatLanguageAndMore(languages: string[]) {
  const seen = new Set<string>();
  const cleaned = languages.map(formatLanguageLabel).filter((language) => {
    if (!isUsableLanguageLabel(language)) {
      return false;
    }
    const normalized = language.toLowerCase();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 3).join(", ")}, and more`;
  }
  if (cleaned.length === 2) {
    return `${cleaned[0]}, ${cleaned[1]} and more`;
  }
  if (cleaned.length === 1) {
    return `${cleaned[0]} and more`;
  }
  return "";
}

# Deezer API

**Author:** mp3li
**Date:** 2026-05-09

## Provider

- Provider name: Deezer
- Base URL: `https://api.deezer.com`
- Current repo usage:
  - `backend/Capstone.API/Infrastructure/Repositories/DeezerSongEnrichmentService.cs`
  - `tools/song_data_enrichment/enrich_songs.py`

## Why this provider is used

Deezer is the current primary source for almost all of the additional song metadata needed by the app.

It is the provider currently used for:

- genre(s) of each song
- album art URL
- artist image URL
- 30 second preview URL

It also provides several reach fields already useful for future iterations:

- explicit lyrics flag
- album explicit-lyrics indicator
- explicit cover flag
- release date
- record type
- contributors
- artist album count

## Authentication requirements

- Current project implementation for these read endpoints does not rely on a Deezer bearer token.
- The repo still keeps these optional local env names available:
  - `DEEZER_APP_ID`
  - `DEEZER_APP_SECRET`
- In the original enrichment tool README, Deezer credentials are explicitly marked optional for the implemented path.

## Current project rate-limit policy

- Original enrichment tool safety policy:
  - `50 requests / 4 seconds`
- Current live backend safety policy:
  - `50 requests / 4.9 seconds`
- Current live backend retry policy:
  - up to `3` attempts
  - delays:
    - `250ms`
    - `800ms`
    - `1600ms`

Important distinction:

- the values above are the **project safety policy actually implemented in this repo**
- they should be treated as the current operational rule for this project even if provider-side behavior changes later

## Endpoints currently needed

### 1. Search

- Endpoint URL:
  - `GET https://api.deezer.com/search?q={query}`
- Main purpose:
  - find the best track candidate from `song title + artist name`
- Current repo usage:
  - first-step match lookup in both the original enrichment tool and the live backend service

#### Required parameters

- `q`

#### Current query patterns used by this repo

The repo does not use only one search string. It tries multiple query candidates in order:

1. `track:"{song_title}" artist:"{artist_name}"`
2. `track:"{simplified_song_title}" artist:"{artist_name}"`
3. `{song_title} {artist_name}`
4. `{simplified_song_title} {artist_name}`
5. fallback artist-oriented query

This matters because symbol-heavy song titles and non-Latin titles do not always match well on the first exact-looking query.

#### Data this endpoint provides that the project uses

- track id
- track title
- preview URL
- artist id
- artist name
- artist image fallback fields
- album id
- album title
- album art fallback fields

#### Required-data coverage from this endpoint alone

- partial support for genre(s): `no`
- language(s): `no`
- album art URL: `partial`
- artist image URL: `partial`
- 30 second preview: `yes`

#### Reach-data coverage from this endpoint alone

- explicit lyrics: `partial`
- release date: `partial`
- record type: `no`
- contributors: `no`
- artist album count: `no`

#### Example request

```text
https://api.deezer.com/search?q=track:%22Alleluia%22%20artist:%22PLK%22
```

#### Example response shape

```json
{
  "data": [
    {
      "id": 123456789,
      "title": "Song Title",
      "title_short": "Song Title",
      "preview": "https://cdnt-preview.dzcdn.net/api/...",
      "explicit_lyrics": true,
      "release_date": "2025-03-14",
      "artist": {
        "id": 111,
        "name": "Artist Name",
        "picture_xl": "https://cdn-images.dzcdn.net/images/artist/...",
        "picture_medium": "https://cdn-images.dzcdn.net/images/artist/..."
      },
      "album": {
        "id": 222,
        "title": "Album Name",
        "cover_xl": "https://cdn-images.dzcdn.net/images/cover/...",
        "cover_medium": "https://cdn-images.dzcdn.net/images/cover/..."
      }
    }
  ]
}
```

#### Testing notes

- Direct browser testing works for this endpoint.
- This was explicitly used during current-project testing to confirm live Deezer access still worked.
- Matching quality is good, but not perfect, so the repo uses multiple query candidates plus normalization logic before accepting a result.

### 2. Track

- Endpoint URL:
  - `GET https://api.deezer.com/track/{deezerTrackId}`
- Main purpose:
  - refresh a known track by Deezer track id
  - especially useful when the preview URL has expired and the repo already knows the track id
- Current repo usage:
  - current live backend cache refresh path

#### Required parameters

- `deezerTrackId` in the path

#### Data this endpoint provides that the project uses

- track id
- title
- short title
- preview URL
- explicit lyrics
- release date
- artist id / name
- album id / title

#### Required-data coverage from this endpoint alone

- genre(s): `no`
- language(s): `no`
- album art URL: `partial`
- artist image URL: `partial`
- 30 second preview: `yes`

#### Reach-data coverage from this endpoint alone

- explicit lyrics: `yes`
- release date: `partial`

#### Example request

```text
https://api.deezer.com/track/123456789
```

#### Example response shape

```json
{
  "id": 123456789,
  "title": "Song Title",
  "title_short": "Song Title",
  "preview": "https://cdnt-preview.dzcdn.net/api/...",
  "explicit_lyrics": true,
  "release_date": "2025-03-14",
  "artist": {
    "id": 111,
    "name": "Artist Name"
  },
  "album": {
    "id": 222,
    "title": "Album Name"
  }
}
```

#### Testing notes

- This endpoint is especially important for preview refresh.
- The current backend uses it after a cached preview URL expires.
- If refresh fails transiently, the backend falls back to cached non-preview metadata when possible.

### 3. Album

- Endpoint URL:
  - `GET https://api.deezer.com/album/{deezerAlbumId}`
- Main purpose:
  - enrich a matched track with album-level fields the search/track response does not fully provide
- Current repo usage:
  - both original enrichment tool and live backend service

#### Required parameters

- `deezerAlbumId` in the path

#### Data this endpoint provides that the project uses

- album title
- cover image URLs
- genres
- contributors
- record type
- release date
- explicit cover flag
- explicit lyrics / explicit-content-lyrics indicator

#### Required-data coverage from this endpoint

- genre(s): `yes`
- language(s): `no`
- album art URL: `yes`
- artist image URL: `no`
- 30 second preview: `no`

#### Reach-data coverage from this endpoint

- explicit cover: `yes`
- album explicit lyrics: `yes`
- release date: `yes`
- record type: `yes`
- contributors: `yes`

#### Example request

```text
https://api.deezer.com/album/222
```

#### Example response shape

```json
{
  "id": 222,
  "title": "Album Name",
  "cover_xl": "https://cdn-images.dzcdn.net/images/cover/...",
  "cover_medium": "https://cdn-images.dzcdn.net/images/cover/...",
  "genres": {
    "data": [
      { "id": 116, "name": "Rap/Hip Hop" }
    ]
  },
  "contributors": [
    { "id": 111, "name": "Artist Name" }
  ],
  "record_type": "album",
  "release_date": "2025-03-14",
  "explicit_content_cover": 1,
  "explicit_lyrics": true,
  "explicit_content_lyrics": 1
}
```

#### Testing notes

- This is the key Deezer endpoint for actual genre fill.
- It is also the main source for several reach fields already flowing into the live backend cache.
- If this endpoint fails transiently, the backend keeps retry/fallback behavior instead of hard-failing the whole country endpoint immediately.

### 4. Artist

- Endpoint URL:
  - `GET https://api.deezer.com/artist/{deezerArtistId}`
- Main purpose:
  - enrich a matched track with artist-level fields not fully available from search/track alone
- Current repo usage:
  - current live backend service

#### Required parameters

- `deezerArtistId` in the path

#### Data this endpoint provides that the project uses

- artist name
- artist image URLs
- `nb_album`

#### Required-data coverage from this endpoint

- genre(s): `no`
- language(s): `no`
- album art URL: `no`
- artist image URL: `yes`
- 30 second preview: `no`

#### Reach-data coverage from this endpoint

- artist album count: `yes`

#### Example request

```text
https://api.deezer.com/artist/111
```

#### Example response shape

```json
{
  "id": 111,
  "name": "Artist Name",
  "picture_xl": "https://cdn-images.dzcdn.net/images/artist/...",
  "picture_medium": "https://cdn-images.dzcdn.net/images/artist/...",
  "nb_album": 12
}
```

#### Testing notes

- This endpoint is what makes artist-image and album-count support cleaner than trying to rely only on search response fragments.

## Matching logic documented from current repo behavior

The current repo does not trust the first search hit blindly.

The actual current match order is:

1. exact normalized song + artist
2. simplified song + simplified artist
3. exact artist with title-prefix containment
4. if none match, first returned candidate

This is important enough to document because duplicate titles, punctuation-heavy titles, emoji-heavy titles, and non-Latin text all show up in the dataset.

## Preview expiry notes

- Deezer preview URLs are temporary.
- The repo does not treat `preview_url` as permanent.
- The live backend parses `hdnea` from the preview URL and extracts the `exp=` timestamp.
- Cached previews are reused only while valid.
- Expired previews are refreshed by known Deezer track id.

### Preview URL host pattern actually seen in this project

- observed pattern:
  - `https://cdnt-preview.dzcdn.net/api/...`
- why it is tracked:
  - this is the actual playable preview URL returned by Deezer in both tool output and live enrichment work
  - even though the project does not call that host as a “search endpoint,” it is still one of the endpoint patterns actively used in the project

### Image URL host pattern actually seen in this project

- observed pattern:
  - `https://cdn-images.dzcdn.net/images/...`
- why it is tracked:
  - these are the concrete album-art and artist-image URLs the app/tooling stores and renders

## Endpoint split: original tool path vs current live backend path

### Original tool path

The original enrichment tool currently uses:

- Deezer search
- Deezer album

It does not currently depend on a dedicated direct `track/{id}` or `artist/{id}` lookup in the same way the live backend does.

### Current live backend path

The live backend currently uses:

- Deezer search
- Deezer track
- Deezer album
- Deezer artist

This distinction matters because the repo now has both:

- a historical/fuller enrichment path
- and a current live app enrichment path

## Reliability notes

- Strongest required-field coverage provider for the current app path: Deezer
- Biggest limitation of Deezer for current scope:
  - no direct reliable lyric-language field in the endpoints this repo uses

## Conclusion

Deezer is the core provider for the current additional-data route because it covers nearly all of the UI-visible metadata needed now, especially art, genres, previews, release dates, and several reach fields.

The one major required-data gap still left outside Deezer is language detection.

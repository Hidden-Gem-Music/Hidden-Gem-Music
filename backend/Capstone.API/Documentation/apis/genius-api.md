# Genius API

**Author:** mp3li
**Date:** 2026-05-09

This file documents the official Genius API usage.

For the project-specific Genius scraper/match-validation workflow built around Genius URLs and lyrics page fetching, also see:

- `genius-web-scraper.md`

## Provider

- Provider name: Genius
- Base URL: `https://api.genius.com`
- Current repo usage:
  - `tools/song_data_enrichment/enrich_songs.py`

## Why this provider is used

Genius is not the current primary provider for visual song metadata.

Its current main role in this project is:

- discover a lyrics page URL for a matched song

That matters because:

- lyrics URL is one of the reach fields already wanted
- lyrics text can later be used for language detection if that route is approved and implemented

## Authentication requirements

- Required local secret:
  - `GENIUS_ACCESS_TOKEN`
- Current header used by the repo:

```text
Authorization: Bearer {GENIUS_ACCESS_TOKEN}
```

## Current provider role in this project

### Used now

- lyrics URL discovery

### Not currently used in the live backend route

- live frontend/backend song enrichment
- direct language fill on app screens

### Future-use potential

- lyrics-based language detection
- more reliable song-page linking for later enrichment/export workflows

## Rate-limit / usage notes

- No fixed numeric Genius limit is currently documented in this repo’s active code or README.
- The older enrichment workflow already hit quota/rate-limit behavior before.
- Current practical rule for this project:
  - handle Genius conservatively
  - watch for `429`
  - keep it separate from the live Deezer enrichment route unless clearly needed

## Endpoint currently needed

### 1. Search

- Endpoint URL:
  - `GET https://api.genius.com/search?q={query}`
- Main purpose:
  - find the best Genius song result from `song title + artist name`
  - capture the Genius song page URL

#### Required parameters

- `q`

#### Current query patterns used by this repo

1. `{song_title} {artist_name}`
2. `{simplified_song_title} {artist_name}`
3. `{artist_name}`

#### Data this endpoint provides that the project uses

- Genius song id
- title
- Genius page URL
- primary artist id
- primary artist name

#### Required-data coverage from this endpoint alone

- genre(s): `no`
- language(s): `no`
- album art URL: `no`
- artist image URL: `no`
- 30 second preview: `no`

#### Reach-data coverage from this endpoint alone

- lyrics URL: `yes`

#### Example request

```bash
curl -H "Authorization: Bearer YOUR_GENIUS_ACCESS_TOKEN" \
  "https://api.genius.com/search?q=Alleluia%20PLK"
```

#### Example response shape

```json
{
  "response": {
    "hits": [
      {
        "result": {
          "id": 12345,
          "title": "Song Title",
          "url": "https://genius.com/artist-song-lyrics",
          "path": "/artist-song-lyrics",
          "primary_artist": {
            "id": 678,
            "name": "Artist Name"
          }
        }
      }
    ]
  }
}
```

#### Testing notes

- This is the endpoint used by the original enrichment tool.
- The tool does not accept the first hit blindly.
- It first tries:
  - exact normalized title + artist
  - then simplified title + artist
- then falls back to the first result

### 2. Lyrics page fetch using returned Genius URL

- Endpoint type:
  - not an official Genius JSON API endpoint
  - direct web-page fetch of the song page URL returned by Genius search
- Practical URL shape:
  - `GET https://genius.com/{artist-song-slug}-lyrics`
- Current repo usage:
  - `tools/song_data_enrichment/enrich_songs.py`
  - helper function: `fetch_lyrics_text`

#### Why this step is tracked here

Even though this is not part of the official JSON API surface, it is still part of the actual project data pipeline that has been used and discussed.

So it needs documentation too.

#### Main purpose

- fetch lyrics page HTML after Genius API search returns a song URL
- extract lyrics text for possible later language detection

#### Data this step provides that the project uses

- lyrics text extracted from page HTML

#### Required-data coverage from this step

- language(s): `indirect only`

#### Reach-data coverage from this step

- no additional reach field by itself beyond enabling downstream language detection work

#### Example request

```text
https://genius.com/artist-song-lyrics
```

#### Practical extraction notes from current repo behavior

- the tool looks for:
  - `<div data-lyrics-container="true" ...>`
- then:
  - joins containers
  - converts `<br>` to line breaks
  - strips remaining tags
  - collapses repeated empty lines

#### Reliability notes

- This is more fragile than a clean provider JSON field.
- It depends on current Genius page structure staying compatible with the extraction pattern.
- It is useful, but it should be documented as a practical fallback step, not as a perfectly stable official structured-data endpoint.

## Important limitation: official Genius API is not enough by itself for language

This is the key project note for Genius:

- the Genius JSON API search response can give a lyrics page URL
- it does **not** directly give this project a clean language field for the song
- it also does **not** directly give this project full lyrics text in the JSON response path currently used

So if language is implemented through Genius later, the practical flow would be:

1. use `GET /search`
2. take `result.url`
3. fetch the lyrics web page itself
4. extract lyrics text
5. run local language detection on that text

## Non-API follow-up step already used by the old enrichment tool

The original enrichment tool already contains a helper path that does this after Genius search succeeds:

- fetch the returned lyrics page URL
- extract HTML blocks marked as lyrics containers
- strip markup
- pass the resulting text into local language detection

That means:

- Genius API helps solve the language problem indirectly
- but not through a single official JSON endpoint that simply returns `language`

## Reliability notes

### Strengths

- good for finding a stable lyrics page URL
- useful as a supporting provider for future language work

### Weaknesses

- not a strong provider for art, previews, or core audio metadata
- not the right single-provider solution for the current live app path
- may hit quota/rate-limit constraints more awkwardly than the current Deezer-only live enrichment route

## Conclusion

Genius is currently best treated as a supporting provider for:

- lyrics URL
- future lyric-text extraction
- future language detection work

It is not the provider that should currently own most of the UI-facing additional song metadata.

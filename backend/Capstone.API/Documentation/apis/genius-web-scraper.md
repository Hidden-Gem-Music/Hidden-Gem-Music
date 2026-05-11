# Genius Web Scraper Workflow

**Author:** mp3li
**Date:** 2026-05-09

## Purpose of this file

This file documents the project-specific Genius web-scraper workflow that was created after the official Genius API proved too restrictive for broad repeated use.

This is separate from `genius-api.md` on purpose.

Why it is separate:

- `genius-api.md` documents the official Genius API endpoint usage
- this file documents the practical scraper-style workflow built around Genius page URLs, URL structure study, lyrics-page fetches, and match-validation rules

This workflow is more than “call Genius search once and trust the first hit.”

It is a matching and validation process.

## Why this scraper workflow exists

The project needed a way to:

- get lyrics page URLs
- test whether a returned Genius result really matched the intended song
- avoid accepting weak or incorrect matches
- keep a practical path open for later language detection from lyrics text

The official Genius API alone was not enough for the full practical workflow wanted here because:

- it can be restrictive in real repeated usage
- the project needed more control over matching quality
- the project needed a practical way to use Genius page URLs and lyrics page structure directly

So the project approach became:

1. use Genius search conservatively
2. inspect the returned result structure and URL
3. compare the result against the intended song/artist using normalization logic
4. only accept it if it passes the repo’s match rules
5. otherwise skip it instead of forcing a bad match
6. if needed later, fetch the lyrics page itself and extract lyrics text

## Current repo location

- Current implementation file:
  - `tools/song_data_enrichment/enrich_songs.py`

The workflow is currently represented mainly by:

- `genius_search(...)`
- `fetch_lyrics_text(...)`
- the shared normalization helpers:
  - `normalize_text(...)`
  - `simplify_for_search(...)`

## Provider surfaces involved

This workflow uses two Genius surfaces together:

### 1. Official Genius search API

- `GET https://api.genius.com/search?q={query}`

Used for:

- discovering candidate Genius song results
- getting the Genius page URL for a candidate result

### 2. Direct Genius lyrics page fetch

- practical URL shape:
  - `GET https://genius.com/{artist-song-slug}-lyrics`

Used for:

- fetching the actual lyrics page HTML
- extracting lyric-container text from the page

## Authentication requirements

### Required for Genius search

- local secret:
  - `GENIUS_ACCESS_TOKEN`
- current request header:

```text
Authorization: Bearer {GENIUS_ACCESS_TOKEN}
```

### Not required for direct lyrics page fetch

- the current repo helper fetches the returned Genius page URL directly

## Query construction strategy

The scraper workflow does not trust one single query string.

It tries multiple query candidates in order.

Current query order in the repo:

1. `{song_title} {artist_name}`
2. `{simplified_song_title} {artist_name}`
3. `{artist_name}`

This matters because song titles can fail to match cleanly when they include:

- punctuation
- symbols
- stylized formatting
- mixed scripts
- unusual spacing

## Text normalization strategy

The workflow validates results using normalization helpers before deciding a match is acceptable.

### `normalize_text(...)`

Current behavior:

- trim leading/trailing whitespace
- lowercase the text
- collapse repeated internal whitespace

This is used for:

- exact normalized comparison

### `simplify_for_search(...)`

Current behavior:

- start from normalized text
- remove punctuation and symbol noise
- keep letters, numbers, and spaces
- collapse repeated whitespace

This is used for:

- more forgiving fallback matching
- query fallback construction

## Match-validation logic

This is the most important part of the scraper workflow.

The project does not blindly accept the first Genius hit.

It validates the candidate results in this order:

### 1. Exact normalized match

For each hit:

- compare normalized Genius result title to normalized intended song title
- compare normalized Genius primary artist name to normalized intended artist name

If both match:

- accept that result immediately

### 2. Simplified normalized match

If no exact normalized match is found:

- compare simplified result title to simplified intended song title
- compare simplified result artist to simplified intended artist

If both match:

- accept that result immediately

### 3. First-hit fallback

If neither of the above matches succeeds:

- return the first Genius hit result

Important practical note:

- the broader enrichment workflow still tracks whether the result was actually found or useful
- if no hits exist at all, it returns no Genius result and the song can be skipped for the Genius side

## Why this validation logic matters

Without validation, the project would be much more likely to:

- accept the wrong song with a similar title
- accept the wrong artist version
- accept remixes, alternates, or unrelated stylized results
- attach the wrong lyrics URL to a song record

This workflow was designed specifically to reduce false positives.

## Lyrics-page fetch and extraction logic

After a Genius result is accepted, the repo can use its URL for direct page fetch and extraction.

Current helper:

- `fetch_lyrics_text(url: str, timeout: int = 20) -> str`

### Request behavior

- direct `GET` request to the Genius page URL
- timeout currently set to `20` seconds

### Extraction behavior

The current helper:

1. downloads the page HTML
2. looks for:
   - `<div data-lyrics-container="true" ...>`
3. joins all matched lyric containers
4. converts `<br>` tags into line breaks
5. strips remaining HTML tags
6. collapses repeated empty lines
7. returns cleaned plain text

If the request fails or no lyrics containers are found:

- return empty string

## How the workflow decides match vs skip

Very simply:

- if Genius search returns no hits:
  - skip
- if the broader enrichment flow gets no usable Genius result:
  - mark Genius as unmatched for that row
- if a candidate is found:
  - take its URL
  - optionally fetch lyrics text
- if none of that succeeds:
  - skip the Genius portion instead of inventing a match

This is important to project quality.

The workflow is intentionally willing to skip rather than force a bad match.

## Returned data the workflow currently contributes

### Directly

- Genius page URL
- Genius song id
- Genius title
- Genius primary artist id
- Genius primary artist name

### Indirectly / downstream

- lyrics text
- local language detection input

## Field coverage

### Required-data fields

- genre(s): `no`
- language(s): `indirect only, through later lyrics extraction + local detection`
- album art URL: `no`
- artist image URL: `no`
- 30 second preview: `no`

### Reach-data fields

- lyrics URL: `yes`

## Example workflow

For an intended input like:

- song title: `Alleluia`
- artist name: `PLK`

The workflow conceptually does:

1. search:
   - `Alleluia PLK`
2. if needed, search fallback:
   - simplified title + artist
3. if needed, search fallback:
   - `PLK`
4. compare hits using exact normalized match
5. if needed, compare hits using simplified normalized match
6. accept validated result or skip
7. use `result.url` if a result is accepted
8. optionally fetch the Genius lyrics page from that URL

## Reliability notes

This workflow is practical, but it is not magic.

Strengths:

- better than trusting first-hit matching
- intentionally skip-friendly when confidence is weak
- useful for later lyrics/language work
- explicit about normalization and fallback steps

Weaknesses:

- still depends on Genius result quality
- still depends on Genius page structure for lyrics extraction
- can still miss songs with unusual naming or poor result coverage
- does not directly solve album art, artist image, previews, or genres

## Rate-limit and usage notes

This file should be read together with `genius-api.md`.

Project-level practical conclusion:

- the official Genius route was too restrictive to be treated as the main high-volume enrichment source for the app’s live additional-data needs
- that is a major reason Deezer became the primary live additional-data source
- the Genius scraper workflow remains valuable for:
  - lyrics URL discovery
  - match validation
  - possible future language-detection work

## Relationship to the rest of the project

This Genius scraper workflow is not the project’s main live enrichment path now.

That role belongs to Deezer in the live backend route.

But this workflow still matters because it documents:

- the user’s researched Genius URL structure approach
- the project’s practical Genius matching rules
- how Genius results are tested before acceptance
- why some songs are intentionally skipped instead of force-matched
- the future path for lyrics-based language detection if that route is revived later

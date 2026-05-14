# Additional Data Research Notes

**Author:** mp3li
**Date:** 2026-05-09

Very simply: this is the research-and-decisions file that explains what was learned, what problems came up, and why certain provider choices were made.

## Purpose of this file

This file records the practical project conclusions from researching additional-data providers and endpoints.

It is meant to answer:

- which provider gives which field
- which required fields are ready now
- which required fields still need a secondary step
- what matching/rate-limit problems were discovered
- what fallback behavior the app/tooling should use

## Field coverage matrix

| Field | Deezer search | Deezer track | Deezer album | Deezer artist | Genius search | Extra local step needed |
|---|---|---|---|---|---|---|
| Song genre(s) | No | No | Yes | No | No | No |
| Language(s) in song lyrics | No | No | No | No | No | Yes |
| Album art URL | Partial | Partial | Yes | No | No | No |
| Artist image URL | Partial | Partial | No | Yes | No | No |
| 30 second preview URL | Yes | Yes | No | No | No | No |
| Explicit lyrics | Partial | Yes | Partial | No | No | No |
| Explicit cover | No | No | Yes | No | No | No |
| Album explicit lyrics | No | No | Yes | No | No | No |
| Release date | Partial | Partial | Yes | No | No | No |
| Lyrics URL | No | No | No | No | Yes | No |
| Record type | No | No | Yes | No | No | No |
| Contributors | No | No | Yes | No | No | No |
| Artist album count | No | No | No | Yes | No | No |

## Full endpoint inventory tracked in this repo

This is the expanded endpoint list beyond only the minimum issue wording.

### Internal app/backend endpoints

- `GET /api/country/{countryCode}?year={year}`
- `GET /api/country/{countryCode}/hidden-gems/preview?year={year}&limit={limit}`
- `GET /api/country/{countryCode}/songs?year={year}&listType={shared|unique}&page={page}&pageSize={pageSize}`
- `GET /api/country/genre-samples?year={year}&codes={comma_separated_country_codes}`
- `GET /api/hidden-gems/{countryCode}?year={year}&minCountries={minCountries}&page={page}&pageSize={pageSize}`
- `GET /api/metadata/years`

### External provider JSON endpoints

- `GET https://api.deezer.com/search?q={query}`
- `GET https://api.deezer.com/track/{deezerTrackId}`
- `GET https://api.deezer.com/album/{deezerAlbumId}`
- `GET https://api.deezer.com/artist/{deezerArtistId}`
- `GET https://api.genius.com/search?q={query}`

### External provider web-fetch step

- `GET https://genius.com/{artist-song-slug}-lyrics`

### Important returned endpoint/URL patterns also tracked

- Deezer preview host:
  - `https://cdnt-preview.dzcdn.net/api/...`
- Deezer image host:
  - `https://cdn-images.dzcdn.net/images/...`

## Required-data conclusion

For the current project:

- Deezer is enough to cover most required display fields.
- The main required-field gap is:
  - language(s)

## Language conclusion

Language is the one field that still needs special handling.

Current best-documented route in this repo is:

1. use Genius search to get a lyrics page URL
2. fetch the lyrics page
3. extract lyrics text
4. run local language detection

So the important architectural point is:

- language is not currently a single-endpoint provider field in this repo
- it is a provider-plus-processing problem

## Matching concerns found during project work

### 1. Exact string matching is not enough

The song dataset contains:

- punctuation-heavy titles
- emoji-heavy titles
- non-Latin titles
- duplicates across artists and markets

Because of that, current matching logic needs:

- normalization
- simplified search strings
- multi-query fallback
- duplicate protection

### 2. First-hit acceptance is risky

Both Deezer and Genius search can return plausible-but-wrong first hits.

Safer matching order used in this repo:

- exact normalized match first
- simplified normalized match second
- artist-preserved fallback third
- only then first-hit fallback if nothing stronger exists

### 3. Duplicate handling matters

This project already had to guard against duplicate display data.

Current practical dedupe patterns:

- enrichment/output dedupe:
  - `song_name + artist_name`
- hidden-gem preview display dedupe:
  - normalized `song + artist`

## Rate-limit findings and operational notes

### Deezer

Current repo safety limits:

- original enrichment tool:
  - `50 requests / 4 seconds`
- live backend:
  - `50 requests / 4.9 seconds`

Additional live-backend protections:

- sliding-window rate limiter
- transient retry up to 3 attempts
- retry delays of `250ms`, `800ms`, `1600ms`
- unresolved retry suppression window:
  - `12 hours`

### Genius

Current repo finding:

- Genius must be treated more cautiously for repeated large-scale enrichment work
- quota / `429` behavior was already a practical concern in previous runs

Project recommendation:

- keep Genius out of the hot live-app path unless needed
- use it for targeted enrichment or later offline expansion work

## Preview URL handling notes

Preview URLs need their own rules.

Reason:

- the preview URL is not permanent
- it expires

Current project rule:

- cache preview URLs temporarily
- parse expiry from the URL
- reuse while valid
- refresh using known Deezer track id when expired
- do not treat old preview URLs as permanent DB truth

## Current project implementation split

### Live app route

- database provides base song lists
- backend enriches visible songs from Deezer on demand
- backend caches stable resolved metadata locally
- frontend shows placeholders/loading states while missing fields resolve

### Original / future fuller enrichment route

- the original tool still matters for:
  - large-scale output generation
  - Genius-driven lyrics URL capture
  - future lyrics-based language detection
  - future fuller organized dataset exports

## Recommended documentation / implementation interpretation

Based on the research and actual repo work, the additional-data direction is:

- required visual metadata:
  - safe to treat Deezer as the primary source
- language:
  - document as a separate secondary pipeline problem
- lyrics URL:
  - document Genius search as the current source
- future full-dataset organization:
  - keep the old enrichment-tool path available

## Final conclusion

The research outcome is not “one provider does everything.”

The actual conclusion is:

- Deezer is the best primary provider for current UI-facing song metadata.
- Genius is a supporting provider for lyrics URL and future language work.
- Language still requires an extra processing step after provider lookup.
- Preview URLs should always be treated as expiring values, not permanent truth.

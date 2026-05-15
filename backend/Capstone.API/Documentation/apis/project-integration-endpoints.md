# Project Integration Endpoints

**Author:** mp3li
**Date:** 2026-05-15

## Purpose of this file

This file tracks the endpoints used by the project as a whole, not just the raw external provider endpoints.

Very simply: this is the wiring map that shows what the project actually calls and how those calls connect together.

That includes:

- internal app/backend endpoints used by the frontend
- external provider endpoints used by the live backend
- external provider endpoints used by the original enrichment tool
- non-API web-fetch steps that are still part of the practical data pipeline

This file exists because the project now has two real additional-data paths:

1. the original enrichment-tool path
2. the current live backend enrichment path

Both need to be documented clearly.

## Internal backend endpoints currently involved in additional-data behavior

These are the app endpoints the frontend calls.

### 1. Country profile

- Endpoint:
  - `GET /api/country/{countryCode}?year={year}`
- Frontend wrapper:
  - `loadCountryProfile`
- Current role:
  - base country profile
  - enriched top shared songs
  - enriched top unique songs
  - sampled genres used in summary text

### 2. Country hidden-gems preview

- Endpoint:
  - `GET /api/country/{countryCode}/hidden-gems/preview?year={year}&limit={limit}`
- Frontend wrapper:
  - `loadCountryHiddenGemsPreview`
- Current role:
  - preview carousel songs for country and comparison screens
  - live Deezer enrichment applied on backend

### 3. Country songs paged list

- Endpoint:
  - `GET /api/country/{countryCode}/songs?year={year}&listType={shared|unique}&page={page}&pageSize={pageSize}`
- Frontend wrapper:
  - `loadCountrySongsPage`
- Current role:
  - `Most Loved in This Country`
  - `Loved Here and Elsewhere`
  - live Deezer enrichment applied on backend

### 4. Country genre samples

- Endpoint:
  - `GET /api/country/genre-samples?year={year}&codes={comma_separated_country_codes}`
- Frontend wrapper:
  - `loadCountryGenreSamples`
- Current role:
  - Discovery Map country-list genre line
  - Discovery Map hover/detail genre line
  - uses the current repo’s `B / I / Y` sampling logic on the backend

### 5. Hidden Gems page

- Endpoint:
  - `GET /api/hidden-gems/{countryCode}?year={year}&minCountries={minCountries}&page={page}&pageSize={pageSize}`
- Frontend wrapper:
  - `loadHiddenGemsPage`
- Current role:
  - main Hidden Gems screen song list
  - live Deezer enrichment applied on backend

### 6. Metadata years

- Endpoint:
  - `GET /api/metadata/years`
- Frontend wrapper:
  - `loadAvailableYears`
- Current role:
  - shared selected-year options for screen flows that depend on year-specific enrichment
  - source of truth for Discovery and Comparison year availability, including 2025 when present in the dataset

### 7. Comparison

- Endpoint:
  - `GET /api/comparison?countryA={countryCode}&countryB={countryCode}&year={year}`
  - `GET /api/comparison/hidden-gems?countryA={countryCode}&countryB={countryCode}&year={year}`
- Frontend role:
  - supports the comparison feature path where backend comparison summaries or hidden-gem suggestions are needed
- Current behavior:
  - country codes must be two different 2-letter ISO codes
  - year validation follows the metadata-years source of truth instead of the older hard-coded 2021 maximum

## External provider endpoints used by the current live backend path

These are called from:

- `backend/Capstone.API/Infrastructure/Repositories/DeezerSongEnrichmentService.cs`

### Deezer search

- `GET https://api.deezer.com/search?q={query}`

### Deezer track

- `GET https://api.deezer.com/track/{deezerTrackId}`

### Deezer album

- `GET https://api.deezer.com/album/{deezerAlbumId}`

### Deezer artist

- `GET https://api.deezer.com/artist/{deezerArtistId}`

## External provider endpoints used by the original enrichment tool path

These are called from:

- `tools/song_data_enrichment/enrich_songs.py`

### Deezer search

- `GET https://api.deezer.com/search?q={query}`

### Deezer album

- `GET https://api.deezer.com/album/{albumId}`

Note:

- the original tool path documented in this repo does not currently show a dedicated direct Deezer `track/{id}` or `artist/{id}` fetch in the same way the live backend does
- instead, the original tool relies primarily on Deezer search result data plus album lookup

### Genius search

- `GET https://api.genius.com/search?q={query}`

### Genius lyrics page fetch

- not an official JSON API endpoint
- practical endpoint shape:
  - `GET https://genius.com/{artist-song-slug}-lyrics`
- Current repo usage:
  - fetch lyrics page HTML after Genius search returns `result.url`
  - extract lyric-container HTML
  - strip markup
  - run local language detection

Related documentation:

- `genius-api.md` for the official API side
- `genius-web-scraper.md` for the project’s match-validation and direct-page workflow

## Additional endpoint-like URL patterns that matter operationally

These are not treated as “search endpoints” by the repo, but they still matter enough to track.

### Deezer preview URL

- Observed host pattern:
  - `https://cdnt-preview.dzcdn.net/api/...`
- Why it matters:
  - this is the actual playable preview URL returned by Deezer
  - it expires
  - the backend caches and reuses it only until expiry

### Deezer image URL

- Observed host pattern:
  - `https://cdn-images.dzcdn.net/images/...`
- Why it matters:
  - these are the artist/album images the app is actually showing

## Path comparison: original tool vs current live backend

### Original enrichment tool path

The tool path is:

1. input CSV row
2. Deezer search
3. Deezer album
4. Genius search
5. Genius lyrics page fetch if needed
6. local language detection
7. output rows written to CSV / JSON / TXT

### Current live backend path

The live backend path is:

1. frontend calls app endpoint
2. backend gets base song rows from DB/stored procedures
3. backend checks local live enrichment cache
4. if needed, backend does Deezer search
5. backend resolves track / album / artist metadata
6. backend caches resolved data
7. backend returns enriched payload to frontend

## Why both paths are documented

Because the repo is currently in a mixed but intentional state:

- the live app uses backend-owned live Deezer enrichment now
- the original tool still matters for future fuller organized data work

So “all endpoints we use” means both of those paths need to stay visible in documentation.

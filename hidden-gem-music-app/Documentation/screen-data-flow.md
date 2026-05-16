# Screen Data Flow

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-15
**Status:** Current Frontend Data-Flow Reference

---

## Purpose

This document explains how the frontend pulls, reuses, and displays screen data in the live app.

Use this file for:

- frontend endpoint usage
- request ownership by screen
- cache and reuse behavior
- which additional-data fields are already live in the frontend

Use `local-development-environment.md` for API base URL environment notes and local run/testing workflow.

## API base URL ownership

API base URL logic lives in:

- `src/data/apiBaseUrl.ts`

This file treats `apiBaseUrl.ts` as part of the frontend data seam, but the local environment and override behavior are documented in:

- `local-development-environment.md`

## Main frontend API files

- `src/data/discoveryApi.ts`
- `src/data/countryApi.ts`
- `src/data/apiMappers.ts`
- `src/data/fetchWithTimeout.ts`
- `src/data/countryDisplay.ts`

These files are the main frontend seam between:

- backend responses
- provider-enriched backend fields
- and screen-level UI usage

## Current frontend endpoint usage

Discovery:

- `GET /api/discovery/countries?year={year}`

Metadata:

- `GET /api/metadata/years`

Country:

- `GET /api/country/{countryCode}?year={year}`
- `GET /api/country/{countryCode}/songs?year={year}&listType={shared|unique}&page={page}&pageSize={pageSize}`
- `GET /api/country/genre-samples?year={year}&codes={comma-separated-codes}`

Hidden Gems:

- `GET /api/hidden-gems/{countryCode}?year={year}&minCountries={n}&page={page}&pageSize={pageSize}`

Dashboard / Discovery Dashboard:

- `GET /api/dashboard/overlap-rate?start={date}&end={date}`
- `GET /api/dashboard/discovery-gap?start={date}&end={date}&minCountries={n}`
- `GET /api/dashboard/gap-distribution?start={date}&end={date}`
- `GET /api/dashboard/isolation-leader?start={date}&end={date}`
- `GET /api/dashboard/isolation-ranking?start={date}&end={date}`
- `GET /api/dashboard/peak-reach?start={date}&end={date}`
- `GET /api/dashboard/overlap-trend?start={date}&end={date}`

## Frontend cache/reuse behavior

Current frontend cache maps include:

- `countryProfileCache`
- `countryHiddenGemsPreviewCache`
- `hiddenGemsPageCache`
- `countrySongsPageCache`
- `countryGenreSampleCache`

Discovery year reuse is also kept in app state through:

- `discoveryCountriesByYear` in `App.tsx`

Discovery's current default year is app-owned and set to 2025. The frontend fallback year list includes 2025 so the UI can initialize consistently before metadata loading completes.

Important note:

- these caches are frontend session-memory reuse
- they improve the active running session
- they do not replace backend/local persisted enrichment data

## Discovery screen flow

Main files:

- `App.tsx`
- `src/screens/DiscoveryScreen.tsx`
- `src/components/DiscoverySidebarPanels.tsx`
- `src/components/globe/GlobePanel.tsx`
- `src/components/globe/GlobeView.tsx`
- `src/assets/maps/worldMap50m.ts`
- `src/data/discoveryApi.ts`

Current flow:

1. `App.tsx` loads available years.
2. `App.tsx` initializes Discovery to the current default year, 2025.
3. `App.tsx` loads Discovery countries for the selected year.
4. Discovery results are cached by year in app state.
5. `DiscoveryScreen.tsx` filters/sorts the active country set for UI use.
6. The custom map receives:
   - the active filtered country set
   - and the broader current Discovery country pool for dimmed-but-visible context
7. Genre samples are prefetched in smaller batches through `loadCountryGenreSamples`.

Important current rule:

- user-facing country pools should exclude `GLOBAL`-style rows
- the custom map does not call an external map service at runtime; it renders from the app-owned geometry asset
- the map and list should use the same song-data quality rules so "No song data" states do not conflict with misleading "Unknown" album/song labels
- changing year should update the active country data without resetting the user's current map viewport

## Country screen flow

Main files:

- `src/screens/CountryScreen.tsx`
- `src/data/countryApi.ts`

Current flow:

1. Country profile loads through `loadCountryProfile`.
2. Shared and unique song lists load through `loadCountrySongsPage`.
3. Hidden-gem preview data is derived from page 1 of the real Hidden Gems endpoint.
4. Favorite artists, album art, song metadata, and additional-data fields are mapped into the UI from the backend response path.

Important current rule:

- hidden-gem preview behavior should stay aligned to the real Hidden Gems data path, not a fake/mock-only preview flow

## Comparison Results flow

Main files:

- `src/screens/ComparisonResultsScreen.tsx`
- `App.tsx`

Current flow:

1. The app chooses the active comparison countries through `comparisonIds`.
2. The screen loads country profile and song-list data for each selected country.
3. Hidden-gem preview behavior is kept parallel to the Country Detail behavior where possible.

Important current rule:

- comparison should use the app-provided available country pool rather than depending on Discovery being the currently visible screen

## Comparison Select map flow

Main files:

- `src/screens/ComparisonSelectScreen.tsx`
- `src/components/globe/GlobePanel.tsx`
- `src/components/globe/GlobeView.tsx`

Current flow:

1. Comparison filter state determines the active selectable country subset.
2. The map receives:
   - the active filtered comparison set
   - and the broader comparison country pool for dimmed context
3. Selected country A and country B are styled distinctly on the map.

Important current rules:

- map interaction should follow Comparison selection rules without changing the screen-owned comparison filter logic
- comparison year choices should follow the app-provided metadata years so 2025 remains available when the backend reports it

## Hidden Gems screen flow

Main files:

- `src/screens/HiddenGemsScreen.tsx`
- `src/data/countryApi.ts`

Current flow:

1. Hidden Gems intro state may appear first depending on how the route was opened.
2. Hidden Gems page data loads through `loadHiddenGemsPage`.
3. Country profile data also loads for the side sections that need it.
4. Page results are cached by country/year/page/page-size.
5. Focus-selection logic resolves preview clicks from other screens to the intended song on the full Hidden Gems screen.

Important current rules:

- do not over-pull more data than needed for the active page
- keep page counts based on the real backend total count
- dedupe songs on the frontend mapping side when the response shape needs that protection
- Hidden Gems country/year prompt options should use the Hidden-Gems-specific availability filter, not the broader app-data country filter
- general Discovery/Country/Comparison country pools should not disappear only because a country has zero hidden gems for the selected year
- while the selected year's API country pool reloads, route/header/breadcrumb labels should use stable known country metadata instead of loading placeholders or raw ISO codes
- API route ids such as `iso-ar` can be resolved through the world-map ISO metadata so user-facing labels can remain full names such as `Argentina`
- Favorite Artists are profile-backed, so their loading state should follow the country-profile request rather than the page-list request
- Favorite Artists may reuse artist image URLs already present in loaded Hidden Gems song rows when the profile side does not provide an image URL
- CD image loading is separate from API data loading; image slots should keep per-art loading feedback until the image file itself loads or errors

## Discovery Dashboard flow

Main files:

- `src/screens/DashboardScreen.web.tsx`
- `src/screens/DashboardScreen.tsx`
- `src/data/dashboardApi.ts`
- `src/data/discoveryApi.ts`
- `src/data/countryApi.ts`

Current flow:

1. The web Dashboard loads its KPI/chart data from the Dashboard API date range `2017-01-01` through `2025-12-31`.
2. The country selector separately builds its dropdown from countries with app data across available metadata years.
3. Isolation scores are displayed only for countries included in the current `isolation-ranking` response.
4. Countries with app data but no returned isolation score stay selectable and use honest no-score messaging rather than fake ranking values.
5. Chapter 4 peak reach uses `albumArtUrl` from the Dashboard peak-reach response when available.

Important current rules:

- The Dashboard nav label is `Discovery Dashboard`.
- The nav order should keep `Discovery Dashboard` directly after `Discovery Map` on web, mobile, and Welcome screen actions.
- The country selector and isolation ranking chart do not currently have the same source: the selector uses app-data countries, while the chart uses `sp_GetIsolationRanking`.
- `sp_GetIsolationRanking` currently returns the stored procedure result as-is; if the graph needs all isolation-score countries, the stored procedure/data-owner path needs to remove its `SELECT TOP 20` limit.
- Peak reach art should come from backend enrichment when possible; the frontend can use a known fallback only to avoid a blank CD for the current peak song.

## Fetch timeout and retry behavior

Main file:

- `src/data/fetchWithTimeout.ts`

Current rules:

- data helpers should use the shared timeout/retry wrapper where that wrapper is already wired in
- aborts should not be retried
- request timeouts should not be retried as a second full timeout window
- retry should stay limited to likely transient network fetch failures

## Additional-data field behavior

Current app/frontend implementation actively uses:

- genre(s)
- album art
- artist image
- preview URL

Current app/frontend implementation also surfaces several safe reach-data fields where available:

- explicit flags
- release date
- record type
- contributors
- artist album count
- tracklist

Language remains intentionally unfinished in the live frontend flow and stays marked as coming soon where applicable.

## Mapping rule

Screen code should prefer using mapped frontend-friendly shapes rather than handling raw backend payload quirks directly in many places.

That is why:

- fetch logic belongs in `src/data`
- response cleanup belongs in mappers
- and screens should stay focused on display/state logic

## Future update rule

If future work changes:

- endpoint paths
- current cache maps
- which screens own which requests
- or which additional-data fields are considered live in the frontend

then this document should be updated in the same change.

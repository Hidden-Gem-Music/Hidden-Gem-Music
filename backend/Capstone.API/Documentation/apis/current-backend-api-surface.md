# Current Backend API Surface

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-14
**Status:** Current Live API Contract Supplement

---

## Purpose

This file records the backend API surface that is currently live in code.

It exists as a supplement to the accepted backend ADRs already in `backend/Capstone.API/Documentation/`.

Important scope note:

- the ADR files remain valuable architecture records and are intentionally not rewritten here
- this file exists because the live controller/endpoint surface has grown beyond the older route-count snapshot
- when there is a conflict between an older route-count summary and the current controller code, the current controller code is the source of truth

## Current controller and endpoint inventory

Current live backend surface:

- 7 controllers
- 17 `GET` endpoints
- endpoint inventory last checked against controller attributes on 2026-05-14

Current controllers:

- `MetadataController`
- `DiscoveryController`
- `CountryController`
- `HiddenGemsController`
- `ComparisonController`
- `DashboardController`
- `GlobeController`

## Current shared error-handling and cancellation standard

Current controller behavior is standardized around:

- `SqlException`
  - returns `503`
  - logs the database failure
  - returns a user-facing unavailable message
- `OperationCanceledException` when the request cancellation token was cancelled
  - returns `EmptyResult`
  - does not log as an error because client disconnect/navigation cancellation is expected behavior
- unexpected `Exception`
  - returns `500`
  - logs the unexpected failure
  - returns a user-facing unexpected-error message

Current cancellation-token behavior:

- controller actions accept `CancellationToken cancellationToken = default` where request work can be cancelled
- repository interfaces and implementations pass cancellation tokens through to database calls
- `SqlServerRepository` passes cancellation tokens into async connection/reader/read operations

This matters because cancelled browser/mobile requests should stop driving backend and SQL work instead of holding resources until long-running queries finish.

## Endpoint inventory by controller

### MetadataController

Route prefix:

- `api/metadata`

Endpoints:

- `GET /api/metadata/years`

Primary role:

- returns the available dataset years used by frontend year selection flows

Repository path:

- `IMetadataRepository.GetAvailableYearsAsync`
- `MetadataRepository`
- `sp_GetAvailableYears`

Current behavior notes:

- returns distinct dataset years in ascending order
- no route params
- no custom validation layer beyond repository result handling

### DiscoveryController

Route prefix:

- `api/discovery`

Endpoints:

- `GET /api/discovery/countries?year={year}`

Primary role:

- the current frontend Discovery screen's main country/list/map data source

Repository path:

- `IGlobeRepository.GetGlobeSummaryAsync`
- `GlobeRepository`
- `sp_GetDiscoverPageInfo`

Current behavior notes:

- validates `year` against `IMetadataRepository.GetAvailableYearsAsync()`
- returns `400` when the requested year is not available
- returns `503` for SQL/database failures
- returns `500` for unexpected failures

Important current note:

- this is the current frontend-facing Discovery endpoint
- `GlobeController` still exists, but the current shared frontend flow relies on `api/discovery/countries`

### CountryController

Route prefix:

- `api/country`

Endpoints:

- `GET /api/country/{code}?year={year}`
- `GET /api/country/{code}/hidden-gems/preview?year={year}&limit={limit}`
- `GET /api/country/{code}/songs?year={year}&listType={shared|unique}&page={page}&pageSize={pageSize}`
- `GET /api/country/genre-samples?year={year}&codes=US,CA,JP`

Primary role:

- serves the Country Detail screen and supporting Discovery/Comparison genre-sample needs

Validation and normalization behavior:

- `code` must be exactly 2 letters
- `year` is validated against the available-years metadata set
- country codes are normalized to uppercase
- `listType` must be `shared` or `unique`
- preview `limit` is clamped to `1..25`
- songs `page` is clamped to `>= 1`
- songs `pageSize` is clamped to `1..100`
- `genre-samples` accepts comma-separated 2-letter codes, uppercases them, removes duplicates, and caps them at 16

Repository and stored procedure bindings:

- `GetCountryProfile`
  - `ICountryRepository.GetCountryProfileAsync`
  - `CountryRepository`
  - `sp_GetCountryProfile`
- `GetHiddenGemsPreview`
  - `ICountryRepository.GetHiddenGemsPreviewAsync`
  - `CountryRepository`
  - `sp_GetCountryHiddenGemsPreview`
- `GetCountrySongs`
  - `ICountryRepository.GetCountrySongsPageAsync`
  - `CountryRepository`
  - `sp_GetCountrySongsPaged`
- `GetCountryGenreSamples`
  - `ICountryRepository.GetCountryGenreSampleAsync`
  - `CountryRepository`
  - repeated `sp_GetCountrySongsPaged` scan used for sampled genre extraction

Current behavior notes:

- `GetCountryProfile` returns `404` when the country/year profile row is not found
- the controller returns `503` for SQL/database failures, silently ends cancelled requests with `EmptyResult`, and returns `500` for unexpected failures
- `genre-samples` uses in-memory caching for both available years and sampled genre results

Additional-data behavior notes:

- `CountryProfile`, hidden-gems preview rows, and country song rows are enriched at request time through `IDeezerSongEnrichmentService`
- no-match songs can be filtered out of enriched lists rather than returned with broken metadata

### HiddenGemsController

Route prefix:

- `api/hidden-gems`

Endpoints:

- `GET /api/hidden-gems/{code}?year={year}&minCountries={n}&page={p}&pageSize={s}`

Primary role:

- serves the main Hidden Gems screen list

Repository path:

- `IHiddenGemsRepository.GetHiddenGemsAsync`
- `HiddenGemsRepository`
- `sp_GetHiddenGems`

Current behavior notes:

- `page < 1` is normalized to `1`
- `pageSize < 1` or `pageSize > 100` is normalized to `25`
- repository scans larger raw batches, enriches rows through Deezer, then constructs the returned page from resolved rows

Important pagination note:

- the stored procedure still receives `@Offset` and `@PageSize`
- because unresolved rows can be dropped during enrichment, repository-side scanning continues until it can confidently fill the requested resolved page

### ComparisonController

Route prefix:

- `api/comparison`

Endpoints:

- `GET /api/comparison?countryA={code}&countryB={code}&year={year}`
- `GET /api/comparison/hidden-gems?countryA={code}&countryB={code}&year={year}`

Primary role:

- serves comparison results and comparison hidden-gem suggestions

Validation and normalization behavior:

- `countryA` and `countryB` must each be exactly 2 letters
- `countryA` and `countryB` must be different countries
- `year` must be in `1975..2021`
- years `2007..2010` are rejected as unavailable
- both country codes are normalized to uppercase

Repository and stored procedure bindings:

- `GetCountryComparison`
  - `IComparisonRepository.GetCountryComparisonAsync`
  - `ComparisonRepository`
  - `sp_GetCountryComparison`
- `GetComparisonHiddenGems`
  - `IComparisonRepository.GetComparisonHiddenGemsAsync`
  - `ComparisonRepository`
  - `sp_GetComparisonHiddenGems`

Current behavior notes:

- comparison returns `404` when no usable comparison result is returned
- both comparison endpoints return `503` for SQL/database failures and `500` for unexpected failures

### DashboardController

Route prefix:

- `api/dashboard`

Endpoints:

- `GET /api/dashboard/overlap-rate?start={date}&end={date}`
- `GET /api/dashboard/discovery-gap?start={date}&end={date}&minCountries={n}`
- `GET /api/dashboard/gap-distribution?start={date}&end={date}`
- `GET /api/dashboard/isolation-leader?start={date}&end={date}`
- `GET /api/dashboard/isolation-ranking?start={date}&end={date}`
- `GET /api/dashboard/peak-reach?start={date}&end={date}`
- `GET /api/dashboard/overlap-trend?start={date}&end={date}`

Primary role:

- serves the dashboard KPI cards and charts

Repository and stored procedure bindings:

- `GetOverlapRate`
  - `IDashboardRepository.GetOverlapRateAsync`
  - `DashboardRepository`
  - `sp_GetGlobalOverlapRate`
- `GetDiscoveryGap`
  - `IDashboardRepository.GetDiscoveryGapAsync`
  - `DashboardRepository`
  - `sp_GetAverageDiscoveryGap`
- `GetGapDistribution`
  - `IDashboardRepository.GetGapDistributionAsync`
  - `DashboardRepository`
  - `sp_GetDiscoveryGapDistribution`
- `GetIsolationLeader`
  - `IDashboardRepository.GetIsolationLeaderAsync`
  - `DashboardRepository`
  - `sp_GetIsolationLeader`
- `GetIsolationRanking`
  - `IDashboardRepository.GetIsolationRankingAsync`
  - `DashboardRepository`
  - `sp_GetIsolationRanking`
- `GetPeakReach`
  - `IDashboardRepository.GetPeakReachAsync`
  - `DashboardRepository`
  - `sp_GetPeakCrossRegionalReach`
- `GetOverlapTrend`
  - `IDashboardRepository.GetOverlapTrendAsync`
  - `DashboardRepository`
  - `sp_GetGlobalOverlapTrend`

Current behavior notes:

- `start` and `end` are `DateOnly` query parameters
- several KPI routes return `404` when no single-row KPI result exists
- list/chart endpoints generally return `200` with an empty collection instead of `404`

### GlobeController

Route prefix:

- `api/globe`

Endpoints:

- `GET /api/globe?year={year}`

Primary role:

- legacy/supplementary globe summary route for Discovery Map data

Repository path:

- `IGlobeRepository.GetGlobeSummaryAsync`
- `GlobeRepository`
- `sp_GetDiscoverPageInfo`

Current behavior notes:

- currently returns the same repository-backed summary family as Discovery
- does not currently do the metadata-year validation that `DiscoveryController` does

## Current backend additional-data enrichment path

Primary live enrichment service:

- `IDeezerSongEnrichmentService`
- `Infrastructure/Repositories/DeezerSongEnrichmentService.cs`

Current live behavior:

- request-time Deezer enrichment for country songs, hidden-gem preview rows, and hidden-gem list rows
- reusable local cache persisted under:
  - `backend/Capstone.API/live_song_enrichment_cache/`
- cache artifacts written as:
  - `live_song_cache.json`
  - `live_song_cache.csv`
  - `live_song_cache.txt`
- preview URLs are reused while still valid
- expired previews are refreshed through known Deezer track ids when possible
- unresolved songs are cached as unresolved for a retry window instead of being retried on every request

## Current documentation drift that this file resolves

This file exists partly because the current backend surface has outgrown the older route snapshot.

Current examples of drift:

- accepted ADR route inventory describes 13 endpoints across 5 controllers
- current code exposes 17 endpoints across 7 controllers
- the older route ADR does not include:
  - `MetadataController`
  - `DiscoveryController`
  - Country songs paging endpoint
  - Country genre-samples endpoint
- older frontend wording may still say Discovery Globe, while the current app-facing feature name is Discovery Map
- the additional-data integration docs describe the frontend-facing additional-data subset, but not the full dashboard/globe/backend route surface

## Update rule

If controllers, route shapes, query parameters, repository bindings, or request-time enrichment behavior change, this file should be updated in the same workstream.

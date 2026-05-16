# QA Log
## HiddenGemMusic Capstone

---

## 2026-05-15 — Discovery Globe SP Optimization and Summary Table

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `sp_GetDiscoverPageInfo`, `sp_PopulateTopSongByCountryYear`, `TopSongByCountryYear` table

### What I noticed

`sp_GetDiscoverPageInfo` was scanning `ChartEntry` live on every globe screen load to find the most frequently charted song per country per year using `ROW_NUMBER() OVER (PARTITION BY ...)`. This scan runs against a very large table and was the main reason the Discovery Globe was slow on first load, even after the genre-sampling and frontend caching fixes.

Additionally, the `WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL` filter was written for the old Mapbox globe, which needed coordinates for dot placement. The Discovery screen now uses an SVG world map that matches countries by ISO code — so the lat/long filter was incorrectly excluding any country with a valid ISO code but no stored coordinates.

### What was fixed

- Created `TopSongByCountryYear` summary table with named FK constraints:

```sql
CREATE TABLE TopSongByCountryYear (
    country_id   INT            NOT NULL,
    chart_year   INT            NOT NULL,
    song_id      INT            NOT NULL,
    album_name   NVARCHAR(512)  NULL,
    artist_name  NVARCHAR(MAX)  NULL,
    CONSTRAINT PK_TopSongByCountryYear PRIMARY KEY (country_id, chart_year),
    CONSTRAINT FK_TSCY_Country FOREIGN KEY (country_id) REFERENCES Country(country_id),
    CONSTRAINT FK_TSCY_Song    FOREIGN KEY (song_id)    REFERENCES DIM_Song(song_id)
);
```

- Created `sp_PopulateTopSongByCountryYear` — uses a named CTE (`RankedSongs`) to scan `ChartEntry` once and store the winning song per country/year. Ties broken by `song_id ASC` for determinism. Includes a sanity-check result set showing rows populated per year.
- Updated `sp_GetDiscoverPageInfo` to `LEFT JOIN TopSongByCountryYear` instead of scanning `ChartEntry` live — SP now reads only pre-computed tables (`Country`, `HiddenGems`, `TopSongByCountryYear`) and is near-instant.
- Replaced `WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL` with `WHERE c.iso_code IS NOT NULL` — correctly scoped to what the SVG map actually needs for shape matching.
- Confirmed `latitude`/`longitude` stay in the `SELECT` — the `Country` TypeScript type requires them as non-optional fields; removing them from the response would require multi-file type system changes for no rendering benefit.
- Updated documentation headers on both SPs.

### How to test

1. In SSMS, confirm the table is populated: `SELECT chart_year, COUNT(*) AS countries FROM TopSongByCountryYear GROUP BY chart_year ORDER BY chart_year;`
2. Call `GET /api/discovery/countries?year=2021` — response time should be significantly faster than before on a cold server
3. Confirm `top_album_name` and `top_artist_name` are non-null for major countries (US, GB, JP, AR, etc.)
4. Confirm countries with no song data return `null` for those fields rather than an error
5. Confirm the globe renders all expected countries — the `iso_code IS NOT NULL` filter should not drop any country that was previously visible

### Verification

- `EXEC sp_GetDiscoverPageInfo @Year = 2021;`
- `EXEC sp_PopulateTopSongByCountryYear;` — check sanity output shows expected year/country counts

---

## 2026-05-15 — Hidden Gems Direct Navigation and Code Review Follow-Up

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Hidden Gems direct/reload prompt behavior, route header/breadcrumb stability, loading overlays, country filtering, fetch retry behavior, and Welcome navigation reset

### What I noticed

After the Issue 125 branch was reviewed and tested, these remaining risks or regressions needed focus:

- Direct `/hidden-gems` navigation needed to show the country/year selection prompt when there was no confirmed country/year context.
- In-app navigation to Hidden Gems still needed to skip the prompt and open the intended country/year page.
- Hidden Gems year changes could temporarily show `Loading country...` in the header and breadcrumb.
- Returning from Hidden Gems to Country could leave the Country header/breadcrumb stuck on `Loading country...`.
- A later fallback briefly showed country codes such as `AR` instead of full names such as `Argentina`.
- Hidden Gems sections needed the same glassy/dimmed loading treatment used elsewhere.
- The global Hidden Gems loading message used feature-specific copy instead of neutral `Loading...`.
- General app country filtering was too tightly coupled to `hiddenSongs > 0`.
- Fetch retry behavior could retry abort/timeout failures and duplicate long waits.
- Clicking `Welcome` from an active page could show the Welcome modal over that page instead of returning to the normal Welcome state.

### What was fixed

- Added app-owned Hidden Gems prompt logic for direct/reload paths without complete country/year params.
- Preserved app-driven Hidden Gems handoff behavior for Country and preview-click navigation.
- Added stable country lookup fallbacks so route titles, headers, and breadcrumbs keep full country names while API country pools reload.
- Added world-map ISO fallback so API ids like `iso-ar` resolve to `Argentina` rather than flashing `AR`.
- Added glassy/dimmed `Loading...` veils to the Hidden Gems song list, now-playing panel, and favorite-artists section.
- Replaced `Loading hidden gems...` with neutral `Loading...`.
- Split general app-data country filtering from Hidden-Gems-specific hidden-gem availability filtering.
- Limited fetch retry behavior to likely transient network fetch failures, not aborts or timeouts.
- Changed Welcome navigation from header/breadcrumb clicks to reset into the normal Welcome-over-Discovery stack.

### How to test

1. Open `/hidden-gems` directly with no country/year params. The country/year intro prompt should appear.
2. From a Country page, open Hidden Gems. It should go straight to that country's Hidden Gems page.
3. Refresh after app-driven Hidden Gems handoff. The selected country/year behavior should remain correct.
4. Change the Hidden Gems year dropdown. Header, document title, and breadcrumb should keep the full country name.
5. Return from Hidden Gems to Country. Header and breadcrumb should keep the full country name and should not get stuck on `Loading country...`.
6. Test an API country id route such as `iso-ar` when available. The label should resolve to `Argentina`, not flash `AR`.
7. Confirm Hidden Gems section loading uses the dimmed/glassy `Loading...` veil.
8. Confirm Hidden Gems loading text is neutral `Loading...`.
9. Check Discovery/Country/Comparison country choices are not wrongly removed just because a country has zero hidden gems.
10. Click `Welcome` from a Country or Hidden Gems page. Welcome should return to the normal Welcome state instead of appearing over the current page.

### Verification

- `npm run typecheck -- --noEmit`

### User runtime confirmation

mp3li confirmed:

- direct Hidden Gems prompt behavior is correct
- in-app Hidden Gems navigation is correct
- reload/handoff behavior is correct
- basic backend data loading is good
- glassy Hidden Gems loading treatment is correct
- country names no longer show `Loading country...` or flash country codes
- Welcome navigation behavior is good

---

## 2026-05-15 — Project Stabilization Follow-Up

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Generated enrichment outputs, comparison year validation, shared native button timing, local config template, and stabilization verification coverage

### What I noticed

The whole-project review found several risks that could cause future regressions even though the project built successfully:

- Full generated enrichment outputs were tracked under `tools/song_data_enrichment/output/`.
- Comparison backend year validation still used stale hard-coded `1975..2021` rules while the app year flow now supports metadata-backed years, including 2025 when present.
- Shared native `ActionButton` behavior fired actions from `onPressIn` with a timer instead of normal `Pressable onPress`.
- Local backend config was ignored correctly, but there was no committed local example file.
- Frontend package scripts did not include a dedicated typecheck command.

### What was fixed

- Untracked full generated enrichment outputs while leaving local files on disk.
- Ignored `tools/song_data_enrichment/output/` and documented that full enrichment output/state is local runtime data.
- Updated Comparison backend validation to use available years from metadata instead of stale fixed year constants.
- Kept Comparison invalid-year behavior as `400` while making support follow the dataset year source of truth.
- Restored shared native `ActionButton` actions to normal `onPress` behavior while preserving pressed styling.
- Added a committed backend local settings example with placeholder values only.
- Added a frontend `typecheck` script.
- Updated backend API documentation so Comparison year validation matches the current metadata-backed behavior.

### How to test

1. Confirm `git ls-files tools/song_data_enrichment/output` returns no tracked output files.
2. Confirm `tools/song_data_enrichment/output/` files still exist locally if they existed before the cleanup.
3. Start the backend and call `GET /api/metadata/years`; confirm the expected dataset years are returned.
4. Call `GET /api/comparison?countryA=US&countryB=CA&year=2025`; it should not be rejected because of the old 2021 maximum when 2025 is in metadata.
5. Call `GET /api/comparison?countryA=US&countryB=CA&year=2022`; it should return `400` when 2022 is not in metadata.
6. On mobile, tap shared welcome/comparison buttons and confirm pressed styling still appears and navigation/action only happens on a completed press.
7. Re-run the Discovery Map checks from the Discovery Map stabilization entry below.

### Verification

- `git diff --check`
- `npm run typecheck`
- `dotnet build`

### User runtime confirmation

After the stabilization changes, mp3li tested locally and confirmed:

- Discovery Map still opens normally and keeps 2025 behavior.
- Welcome and Comparison buttons still show pressed styling and navigate.
- Comparison year dropdown includes 2025 when metadata returns it.
- Comparison with 2025 does not fail because of the old 2021 limit.
- Generated enrichment output files still exist locally while git no longer tracks `tools/song_data_enrichment/output/`.

---

## 2026-05-14 — Discovery Map Web/Mobile Stabilization

**Tester:** mp3li
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Discovery Map default year, web hover/list behavior, mobile map controls, mobile country taps, mobile glassy blurb, welcome navigation, and reset behavior

### What I noticed

During hands-on web and mobile review, the Discovery Map had several issues that were not captured by compile-only checks:

- Discovery opened with 2025 data but the timeline slider visually appeared to be on 2024.
- Web year changes could leave refreshing/loading UI stuck or visible after leaving Discovery.
- Web map hover highlighted the country list but did not always scroll the highlighted row into view.
- Country-list and map no-song-data messaging could disagree.
- Mobile welcome-to-Discovery could feel unresponsive before the welcome modal disappeared.
- Mobile welcome dismissal could trigger an unhandled `GO_BACK` navigation warning when there was no route to pop.
- Mobile glassy blurb helper text overlapped the `Discovery Map` heading/gem and needed to sit under the divider line.
- Mobile map arrows/zoom/reset needed visible press feedback so the user could tell taps were accepted.
- Mobile map transform-based movement made country borders blurry.
- Mobile country taps needed the required rule: first tap previews, second tap on the same country opens detail.
- No-data countries needed visible borders so continent shapes remained readable.
- Mobile reset disappeared because reset visibility was tied to brittle viewport-default detection.

### What was fixed

- Set the app-owned Discovery default year to 2025 and aligned the slider's visual state to the actual selected year.
- Kept Discovery year refresh overlays scoped to Discovery and cleared them when navigating away.
- Preserved current map viewport across year changes instead of forcing a reset.
- Improved web map/list synchronization so country hover can bring the highlighted list row into view.
- Aligned no-song-data handling between list and map card/blurb states.
- Guarded welcome dismissal with `navigationRef.canGoBack()` before calling `goBack`.
- Added a safe fallback route to Discovery when welcome has no back route.
- Added tap guards and mobile pressed styling for welcome buttons.
- Reworked mobile map blurb positioning so it sits above the map, with the map below it.
- Restored the heading divider line and placed helper/detail text under it.
- Matched mobile blurb heading/detail text scale to nearby Discovery section/list text.
- Added separate mobile blurb heights for helper mode and country-detail mode.
- Kept web blurb compact after mobile layout changes.
- Restored crisp mobile map rendering by using SVG viewBox movement instead of scaling the whole SVG view.
- Added press styling to mobile arrow, zoom, and reset controls.
- Kept reset visible on mobile and fixed reset to compare against the real default viewport.
- Implemented mobile country tap behavior so only a second tap on the same country opens the Country page.
- Kept no-data country borders visible while leaving no-data country fills empty.

### How to test

1. Open Discovery from the welcome modal on mobile. The welcome button should show pressed feedback and the modal should dismiss without a `GO_BACK` warning.
2. Confirm Discovery initializes to 2025 and the timeline/slider visually agrees with the active year.
3. On web, hover a map country and confirm the matching country in the list is highlighted and brought into view.
4. Change Discovery year on web and confirm the map does not jump back to the default viewport unless Reset is pressed.
5. On mobile, tap one country once. It should update the glassy blurb and should not open the Country page.
6. Tap a different country once. It should preview that different country, not open it.
7. Tap the same selected country again. It should open the Country page.
8. Navigate back to Discovery and confirm stale selected-country highlighting does not incorrectly carry over as a fresh tap.
9. Use arrow, zoom, and reset controls on mobile and confirm each shows visible press styling.
10. Confirm no-data countries still show borders and the map remains crisp, not blurry.
11. Confirm the mobile glassy blurb is taller for helper copy and shorter for country detail copy.

### Verification

- `npx tsc --noEmit`
- `git diff --check`

Both passed after the final reset visibility and mobile blurb height fixes.

---

## 2026-05-13 — Frontend Load Optimization (Redundant API Calls)

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `loading-optimization`
**Scope:** `discoveryApi.ts`, `dashboardApi.ts`, `countryApi.ts`

### What I noticed

Audited all API fetch functions for repeat pinging — cases where the same endpoint was being called multiple times when once was enough. Found two categories: functions with no cache at all, and a race condition in a newly-added cache.

| File | Function | Problem |
|---|---|---|
| `dashboardApi.ts` | All 7 functions | No caching — all 7 dashboard endpoints re-fired on every visit to the dashboard screen (every mount) |
| `countryApi.ts` | `loadAvailableYears` | No cache — called independently in `App.tsx`, `CountryScreen`, and `ComparisonResultsScreen`; fired on every mount of each |
| `discoveryApi.ts` | `loadDiscoveryCountries` | No module-level cache — relied entirely on `App.tsx` React state, which doesn't deduplicate concurrent calls |

### What was fixed

**`dashboardApi.ts`** — Added a `Map` cache to all 7 functions (`loadOverlapRate`, `loadDiscoveryGap`, `loadIsolationLeader`, `loadPeakReach`, `loadOverlapTrend`, `loadIsolationRanking`, `loadGapDistribution`) keyed on the date range string. First visit fetches; every subsequent visit is served from the module cache with zero network requests. Also switched from bare `fetch()` to `fetchWithTimeoutAndRetry()` to match the rest of the codebase.

**`countryApi.ts` — `loadAvailableYears`** — Replaced a result-level cache (which still had a race window where concurrent callers could each fire their own request before the first resolved) with a Promise-level cache. All concurrent callers share the same in-flight request. If the request fails, the cache clears so the next call retries.

**`discoveryApi.ts` — `loadDiscoveryCountries`** — Added a module-level result cache and in-flight Promise deduplication, both keyed on year. On a cache hit, returns instantly. If a request for the same year is already in-flight (e.g., two callers at startup), the second caller shares the existing Promise instead of firing a second request.

### How to test

1. Open the app and navigate to the Dashboard — note load time
2. Navigate away and return to the Dashboard — should render **instantly** with no network requests visible in DevTools → Network tab
3. Open DevTools → Network, filter by `/api/metadata/years` — should appear **once** total across the session regardless of how many screens call it
4. Open DevTools → Network, filter by `/api/discovery/countries` — should appear **once per year** across the session; switching years fetches once for that year, switching back is instant

### Verification

- `npm run typecheck`

---

## 2026-05-13 — Genre Sampling Sequential Bottleneck

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `loading-optimization`
**Scope:** `CountryController.cs` — `GetCountryGenreSamples` endpoint

### What I noticed

Genre samples on the Discovery globe screen were taking an extremely long time on first load. DevTools showed the `/api/country/genre-samples` request for the initial 8-country batch was the bottleneck — country page visits were much faster and frequently showed browser disk cache hits.

The backend `GetCountryGenreSamples` endpoint processed country codes in a **sequential `foreach` loop**. For each code, it checked `IMemoryCache` first, then if not cached, called `GetCountryGenreSampleAsync` which involves a DB query and Deezer API calls. Because the loop was sequential, an 8-country batch request took the **sum** of all individual resolution times — potentially 8–12 seconds on a cold cache.

The country page felt faster because it only ever requests 1 country at a time, and browser disk cache hits from previous visits made repeat requests instant. The globe fires a batch URL with all 8 codes combined (e.g. `?codes=AR,AU,BR,DE,...`) — a URL the browser has never cached — so it always paid the full sequential cost.

### What was fixed

Changed the `foreach` loop to `Task.WhenAll` so all country codes in the batch are resolved **in parallel**:

```csharp
var tasks = normalizedCodes.Select(async (countryCode) => { ... });
var results = (await Task.WhenAll(tasks)).Where(sample => sample is not null).ToList();
```

Total resolution time for a batch is now the **slowest single country** instead of the sum of all of them.

This is safe with the existing Deezer infrastructure — `DeezerSongEnrichmentService` is registered as a singleton, so the shared `SlidingWindowRateLimiter` and file cache gate apply across all parallel tasks. The `IMemoryCache` keys are per-country-code so there is no concurrent access on the same key.

### How to test

1. Hard refresh and navigate to Discovery Globe — the genre loading spinner in the sidebar should resolve noticeably faster than before
2. In DevTools → Network, find the `/api/country/genre-samples` request — check its duration on first load (cold server cache) vs before the fix
3. Confirm the fix is safe: check the backend logs — no Deezer rate limit errors (`429`) should appear during the batch request

### Verification

- `dotnet build`

---

## 2026-05-13 — Backend Error Handling

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `67-cross-check-interfaces-controllers-against-sps`
**Scope:** All 7 controllers

### What I noticed

While reviewing the AR 2023 `OperationCanceledException` error in the backend logs, I checked error handling across all controllers and found it was completely inconsistent — some had none at all.

| Controller | Problem |
|---|---|
| `DashboardController` | No try-catch, no logger — all 7 endpoints unprotected |
| `GlobeController` | No try-catch, no logger |
| `MetadataController` | No try-catch, no logger |
| `HiddenGemsController` | No try-catch, no logger, takes `CancellationToken` but never handled it |
| `CountryController` | Had SqlException + Exception on all endpoints but was missing `OperationCanceledException` on 3 of 4 endpoints |

`ComparisonController` and `DiscoveryController` were already fine.

### What was fixed

All controllers now consistently catch:
- `SqlException` → 503 with a user-facing message + error log
- `OperationCanceledException` (where a `CancellationToken` is in scope) → silent `EmptyResult()`, no log — this is normal client disconnection behavior, not an error
- `Exception` → 500 with a user-facing message + error log

Logger was injected into the four controllers that were missing it.

### How to test

1. Start the API and make a valid request to any endpoint (e.g. `GET /api/dashboard/overlap-rate?start=2017-01-01&end=2021-12-31`)
2. Navigate away immediately / cancel the request — the server log should produce **no error entry** (silent `EmptyResult`, not a stack trace)
3. To verify 503: temporarily take the DB offline and hit any endpoint — should return `503` with the user-facing message, not a 500 or unhandled exception page
4. Sanity check: every controller action is wrapped in try-catch — no unprotected endpoints

### Verification

- `dotnet build`

---

## 2026-05-13 — CancellationToken Propagation

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `67-cross-check-interfaces-controllers-against-sps`
**Scope:** All controllers, interfaces, repositories, and the SQL data layer

### What I noticed

While fixing controller error handling, I found that `CancellationToken` was being dropped before it ever reached the database. Controllers accepted the token and passed it to repositories, but `IDataRepository.GetDataAsync` / `GetDataSetsAsync` had no token parameter at all — so cancellation stopped at the repository boundary. SQL commands ran to completion even after the client disconnected.

Additionally, even in repositories that already declared a token (CountryRepository, HiddenGemsRepository), some individual `_db` call sites weren't passing it through.

| Layer | Problem |
|---|---|
| `IDataRepository` | No `CancellationToken` on any of the 3 methods — token could never reach SQL |
| `SqlServerRepository` | `OpenAsync`, `ExecuteReaderAsync`, `ReadAsync`, `IsDBNullAsync`, `NextResultAsync` all called without a token |
| `IGlobeRepository`, `IMetadataRepository` | No token on their methods |
| `IComparisonRepository` | No token on either method |
| `IDashboardRepository` | No token on any of the 7 methods |
| `CountryRepository` | Token declared on public methods but dropped when calling `_db` — 5 call sites affected |
| `HiddenGemsRepository` | Token declared but dropped at the `_db.GetDataAsync` call |
| `DashboardController`, `GlobeController`, `MetadataController`, `ComparisonController`, `DiscoveryController` | No `CancellationToken` parameter on any endpoint — token was never in scope to begin with |

### What was fixed

- Added `CancellationToken cancellationToken = default` to all 3 `IDataRepository` methods
- Updated `SqlServerRepository` to pass the token to every async DB call
- Updated `MySqlRepository` signatures to match the interface
- Added token to `IGlobeRepository`, `IMetadataRepository`, `IComparisonRepository`, and all 7 methods on `IDashboardRepository`
- Updated all repository implementations to accept and pass the token to `_db` calls
- Added `CancellationToken` parameter to all controller endpoints that were missing it — ASP.NET Core automatically binds this from `HttpContext.RequestAborted`
- Added `OperationCanceledException` catch to all newly-updated controller endpoints
- Threaded token through `DiscoveryController` to both its repo calls

Token now flows end to end: browser cancels → ASP.NET cancels token → controller → repository → `_db` → SQL command interrupted.

Without this, every cancelled request held a live SQL connection open until the query finished. On slow scans — like the genre sampling that caused the AR 2023 error — the server kept doing work and holding resources for a client that was already gone.

### How to test

1. Open SQL Server Activity Monitor or query `sys.dm_exec_requests` before and after a cancelled request
2. Hit a slow endpoint (Hidden Gems with a large dataset, or genre sampling on a country not yet cached) and navigate away immediately
3. The in-flight SQL session should disappear from `dm_exec_requests` promptly — previously it would run to completion regardless of client disconnect

### Verification

- `dotnet build`

---

## 2026-05-13 — Model Nullability Audit

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `67-cross-check-interfaces-controllers-against-sps`
**Scope:** All 20 model files across Dashboard, Comparison, Country, Globe, HiddenGems, and Shared folders

### What I noticed

Audited all models against their source stored procedures to check whether non-nullable value-type properties could actually receive NULL from the database.

| Model | Property | Was | Should Be | Reason |
|---|---|---|---|---|
| `GlobalTrendPoint` | `OverlapPct` | `decimal` | `decimal?` | Gap rows in `sp_GetGlobalOverlapTrend` return NULL for all metric columns — Recharts uses `IsGap` to skip rendering these points |
| `GlobalTrendPoint` | `AvgCountries` | `decimal` | `decimal?` | Same — gap row |
| `GlobalTrendPoint` | `TotalUniqueSongs` | `int` | `int?` | Same — gap row |
| `GlobalTrendPoint` | `SongsIn2Plus` | `int` | `int?` | Same — gap row |
| `PeakReachKpi` | `PeakDate` | `DateOnly` | `DateOnly?` | `AsDateOnly` returned `DateOnly.MinValue` for NULL, masking missing dates instead of surfacing them |

All remaining non-nullable value-type properties (`int` counts, `decimal` percentages, `double` lat/long, chart ranks) are backed by columns that are structurally guaranteed non-null by their SPs or are aggregates that always produce a value.

### What was fixed

- Made 4 metric properties on `GlobalTrendPoint` nullable (`decimal?` / `int?`)
- Made `PeakDate` on `PeakReachKpi` nullable (`DateOnly?`)
- Updated `DashboardRepository` mapping for `GlobalTrendPoint` to call `AsNullableDecimal` and `AsNullableInt`
- Updated `DashboardRepository` mapping for `PeakReachKpi` to call `AsNullableDateOnly`
- Added `AsNullableDecimal` and `AsNullableDateOnly` private helper methods to `DashboardRepository`
- Removed the old non-nullable `AsDateOnly` helper (no longer used)

### How to test

1. Call `GET /api/dashboard/overlap-trend?start=2017-01-01&end=2024-12-31` — the response should include rows where `overlapPct`, `avgCountries`, `totalUniqueSongs`, and `songsIn2Plus` are `null` (not `0`) when `isGap` is `true`
2. Verify the dashboard gap region renders as a dashed line, not a flat zero line through the data gap
3. Call `GET /api/dashboard/peak-reach?start=2017-01-01&end=2024-12-31` — `peakDate` should be `null` if the SP returns NULL, not `"0001-01-01"`

### Verification

- `dotnet build`

---

## 2026-05-13 — Bug 7: `sp_GetAverageDiscoveryGap` Imprecise Date Filter and Wrong Floor

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `127-debug-sp-repository-bugs`
**Scope:** `sp_GetAverageDiscoveryGap`

### What I noticed

During the SP / interface / controller cross-check pass, `sp_GetAverageDiscoveryGap` was identified as having the same class of issues as Bug 6 (gap distribution SP):

- **Date filtering via `SongCountryPresence` join** — the SP filtered by `scp.chart_year`, which records when a song was charting, not when its spread event originated. A song spreading in 2018 could appear in SCP rows for 2019 and 2020, making the join an imprecise date boundary.
- **Floor at `days_to_spread > 0`** — included day-1 entries (songs released simultaneously across markets on launch day), which are global rollouts rather than organic cross-border discovery events. Inconsistent with the population SP after its `> 1` floor update.

### What was fixed

Replaced the `SongCountryPresence` date join with `WHERE dgd.first_chart_date BETWEEN @DateStart AND @DateEnd`, matching the pattern applied to `sp_GetDiscoveryGapDistribution` in Bug 6. Floor raised from `> 0` to `> 1` for consistency with the population SP.

Note: `SongCountryPresence` is still used in the `EXISTS` clause for the `@MinCountries` filter — that use is correct and unchanged.

### How to test

1. Change the date range on the Dashboard — the Avg Discovery Gap KPI values should update to reflect only spread events originating within the selected period
2. Confirm the median and mean values are consistent with the gap distribution histogram for the same date range

### Verification

- Re-run `sp_GetAverageDiscoveryGap.sql` in SSMS. No repopulation required.

---

## 2026-05-13 — Bug 6: `sp_GetDiscoveryGapDistribution` Date Range Parameters Unused

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `127-debug-sp-repository-bugs`
**Scope:** `sp_GetDiscoveryGapDistribution`, `sp_PopulateDiscoveryGapByDay`, `DiscoveryGapByDay` table

### What I noticed

`@DateStart` and `@DateEnd` were declared in the SP signature and passed through from `DashboardController` → `IDashboardRepository` → the SP, but the SP body never referenced them. Every call returned the complete all-years dataset regardless of what date range the caller passed.

An initial fix using `JOIN SongCountryPresence` and filtering by `scp.chart_year` was applied but found to be semantically imprecise — `chart_year` records when a song was charting, not when the spread event originated. A song could spread in 2018 but still appear in SCP rows for 2019 and 2020.

### What was fixed

- **Schema change:** `ALTER TABLE DiscoveryGapByDay ADD first_chart_date DATE NULL` — stores the origin date of the spread event directly on the pre-computed table.
- **`sp_PopulateDiscoveryGapByDay` updated:** Added `first_chart_date` to the INSERT, populated from `origin_date` in the `Spread` CTE. Also raised the floor from `gap_days > 0` to `gap_days > 1` — day-1 entries are songs released simultaneously across markets on launch day (global rollouts, not organic cross-border discovery events).
- **`sp_GetDiscoveryGapDistribution` updated:** Removed `SongCountryPresence` join entirely. Filter is now `WHERE dgbd.first_chart_date BETWEEN @DateStart AND @DateEnd` — directly scoped to when the spread event originated.

### How to test

1. Change the date range on the Dashboard — the gap distribution histogram should update and reflect only spread events originating in the selected period
2. Selecting only DS1 years (2017–2021) should not show 2023 data

### Verification

- Run `ALTER TABLE` in SSMS, re-run `sp_PopulateDiscoveryGapByDay` to populate `first_chart_date`, then re-run the read SP.

---

## 2026-05-13 — Bug 5: `sp_GetHiddenGems` Missing `total_count` — Pagination Permanently Broken

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `127-debug-sp-repository-bugs`
**Scope:** `sp_GetHiddenGems`, `HiddenGemsRepository`

### What I noticed

`HiddenGemsRepository` reads `total_count` from the first result row to compute the `hasMore` flag used for infinite scroll pagination. The SP never returned this column, so `totalRawCount` always defaulted to 0 and `hasMore` was always `false`. Pagination was broken on every load regardless of filter parameters — only the first page was ever shown.

### What was fixed

Added `COUNT(1) OVER() AS total_count` to the SELECT in `sp_GetHiddenGems`, matching the pattern already used in `sp_GetCountrySongsPaged`. No repopulation required — the fix is in the read SP only.

### How to test

1. Navigate to Hidden Gems for a country with many hidden gems (e.g. US, GB)
2. Scroll to the bottom of the list — additional pages should load via infinite scroll
3. Confirm `hasMore` is `true` when more results exist and `false` only on the last page

### Verification

- Re-run `sp_GetHiddenGems.sql` in SSMS. No repopulation required.
- `dotnet build`

---

## 2026-05-08 — Viral 50 / Top 200 Chart Type Conflation

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `sp_PopulateSongCountryPresence`, `sp_PopulateDiscoveryGapByDay`, `sp_PopulatePeakReachBySong` — all six summary tables repopulated

### What I noticed

During dashboard narrative design review, it was identified that the Top 200 and Viral 50 chart types in Dataset 1 measure fundamentally different phenomena but were being treated as equivalent charting events in all population stored procedures.

- **Top 200:** sustained listener demand — streams-based, reflects adoption
- **Viral 50:** rate-of-spread — a song can enter with minimal total streams by spreading simultaneously across markets

This affected multiple metrics: the Discovery Gap 0–7d bucket was heavily inflated by Viral 50 simultaneous-spread events, the Global Overlap Rate was inflated by Viral 50 entries, and the Peak Cross-Regional Reach winner was a Viral 50 result (70 countries — abcdefu) rather than a meaningful Top 200 adoption event.

### What was fixed

`AND ce.chart_type_id != 2` added to the `WHERE` clause of the `ChartEntry` query in three population procedures:
- `sp_PopulateSongCountryPresence` — main WHERE clause
- `sp_PopulateDiscoveryGapByDay` — FirstAppearance CTE
- `sp_PopulatePeakReachBySong` — DailyReach CTE

During repopulation, the `gap_days > 0` filter in `sp_PopulateDiscoveryGapByDay` was also found to have reverted to `>= 0` during the SP rewrite — corrected back to `> 0` and repopulated.

All six summary tables repopulated in dependency order: `sp_PopulateSongCountryPresence` → `sp_PopulateDiscoveryGapByDay` → `sp_PopulatePeakReachBySong` → `sp_PopulateGlobalOverlapByYear` → `sp_PopulateCountryYearStats` → `sp_PopulateIsolationScoreByCountry`.

Post-fix values vs. pre-fix:

| Metric | Pre-fix | Post-fix |
|---|---|---|
| Global Overlap Rate | 26% | 25% |
| Discovery Gap median | 4d | 12d |
| Discovery Gap mean | 38d | 108d |
| Peak Cross-Regional Reach | 70 countries (abcdefu) | 69 countries (STAY — The Kid LAROI) |

SP headers updated with 05/08/2026 update lines. Dashboard chart legend updated from "2017–2021 (Top 200 + Viral 50)" to "2017–2021 (Top 200 only)".

### How to test

1. Confirm Global Overlap Rate KPI shows ~25%
2. Confirm Discovery Gap KPI shows median ~12d, mean ~108d — the mean/median divergence is expected and documented
3. Confirm Peak Cross-Regional Reach winner is STAY (The Kid LAROI), not abcdefu

### Verification

- Query `SELECT COUNT(*) FROM SongCountryPresence` before and after — count should decrease after excluding Viral 50
- `EXEC sp_PopulateGlobalOverlapByYear;` — check output values match documented post-fix numbers

---

## 2026-04-29 — Bug 3: Argentina 2023 Hidden Gems — Seasonal Data Skew

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** Year selector label, Hidden Gems / Country Profile / Country Comparison / Globe filter panel

### What I noticed

Argentina's Hidden Gems list for 2023 was dominated by Christmas songs: "All I Want for Christmas Is You," "Last Christmas," "Rockin' Around the Christmas Tree," "Jingle Bell Rock," etc. Dataset 2 begins October 17, 2023 — so "2023" in the dataset means Oct 17 – Dec 31 only (75 days, heavily December). Christmas songs dominate December global charts, achieve high `country_count`, score well on TrendScore formula, and Argentina did not chart them — making them technically valid hidden gems under the SP logic, but obviously misleading to end users.

The SP is functioning correctly given the data it has. The issue is entirely a data scope limitation inherent to Dataset 2's start date.

### What was fixed

- Year selector updated to display **"2023 (Oct–Dec)"** wherever 2023 appears as a filter option — applied consistently across Hidden Gems, Country Profile, Country Comparison, and Globe screens
- Limitation documented in dashboard About This Data section

### How to test

1. Open any year selector in the app — 2023 should appear as "2023 (Oct–Dec)" not plain "2023"
2. Confirm the label appears consistently on the Hidden Gems screen, Country Profile screen, Comparison screen, and Discovery Globe year filter

### Verification

- Visual check across all year-selector UI surfaces

---

## 2026-04-29 — Bug 2: Global Reach vs. Overlap Rate Apparent Tension

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** Dashboard — Global Reach Over Time chart labels and explainer copy

### What I noticed

The Global Overlap Rate KPI showed 26% of songs appearing in 2+ countries. The Global Reach Over Time chart showed average countries per song of ~2.9–3.2 for DS1 years. These appeared inconsistent — a 26% overlap rate with most songs staying in 1 country seemed to contradict an average of ~3 countries per song.

Investigation confirmed no SP bug: the math is consistent (74% of songs × 1 country + 26% of songs × ~9 countries ≈ 3.1 average). The real issues were labeling: 2023 covers Oct–Dec only (smaller song pool, lower avg_countries) and DS2 years use Top 50 charts vs DS1's Top 200 — smaller pool produces lower averages that are not directly comparable.

### What was fixed

No SP changes. Frontend only:
- 2023 x-axis label marked with asterisk in orange
- 2023 bar dimmed to 45% opacity
- Tooltip for 2023 shows "2023 (Oct–Dec only)"
- Partial year legend item added
- Chart explainer text updated to note DS1 vs DS2 chart scope difference

### How to test

1. Open the Dashboard — 2023 bar in the Global Reach chart should appear visually dimmed with an asterisk
2. Hover the 2023 bar — tooltip should show "2023 (Oct–Dec only)"
3. Confirm a partial-year legend item is visible

### Verification

- Visual check of the Dashboard Global Reach Over Time chart

---

## 2026-04-29 — Bug 1: Discovery Gap KPI vs. Distribution Chart Contradiction

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `sp_PopulateDiscoveryGapByDay`, `sp_GetAverageDiscoveryGap`, `sp_GetDiscoveryGapDistribution` — table repopulated

### What I noticed

The Avg Discovery Gap KPI card showed 43 days average. The Discovery Gap Distribution histogram showed the 0–7d bucket as by far the tallest bar, with most songs appearing to cross in under a week. A mean of 43 days is not consistent with a distribution heavily weighted toward 0–7 days.

Investigation found the average SP was averaging across all song-country pair rows (one per destination country per song), while the distribution SP counted distinct songs once each — an aggregation unit mismatch. After fixing the aggregation, the new average was 7 days with median 0, still inconsistent. Direct query of `days_to_spread` distribution revealed 55,276 day-zero rows — left-censored artifacts from Dataset 2's start date (songs already globally charting when data collection began). Changing the populate SP filter from `gap_days >= 0` to `gap_days > 0` and repopulating yielded avg 38 days, median 4 days. Further boundary-week contamination analysis confirmed the fast-crossing distribution is real behavior driven by streaming-era music and Viral 50 chart dynamics, not a data artifact.

### What was fixed

- **`sp_PopulateDiscoveryGapByDay`:** changed `WHERE gap_days >= 0` to `WHERE gap_days > 0`. Added HAVING filter to Origin CTE excluding dataset opening-week origins.
- **`sp_GetAverageDiscoveryGap`:** rewrote to aggregate to `MIN(days_to_spread)` per song before averaging (previously averaging all destination-country rows).
- **`sp_GetDiscoveryGapDistribution`:** added date range filter, changed `>= 0` to `> 0`.
- Table repopulated. Final values: avg 38 days, median 4 days, sample size 35,448.
- UI copy updated in both the KPI card and the distribution chart to accurately describe the data shape and note Viral 50 contribution to the 0–7d bucket.

Post-fix bucket distribution:

| Bucket | Song count |
|---|---|
| 0–7d | 21,936 |
| 8–14d | 8,033 |
| 15–30d | 11,517 |
| 31–60d | 6,966 |
| 61–90d | 3,103 |
| 90d+ | 6,711 |

### How to test

1. Confirm Dashboard KPI shows avg ~38 days, median ~4 days
2. Confirm the distribution histogram's 0–7d bucket is the tallest, consistent with a median of 4 days
3. The mean/median divergence is expected — the KPI card flip side should explain "Why two numbers?"

### Verification

- `EXEC sp_GetAverageDiscoveryGap @DateStart = '2017-01-01', @DateEnd = '2021-12-31';`
- `EXEC sp_GetDiscoveryGapDistribution @DateStart = '2017-01-01', @DateEnd = '2021-12-31';`
- Confirm avg and histogram values are mutually consistent

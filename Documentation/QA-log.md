# QA Log
## HiddenGemMusic Capstone

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

**Branch:** `loading-optimization`
**Scope:** `discoveryApi.ts`, `dashboardApi.ts`, `countryApi.ts`

### What I noticed

Audited all API fetch functions for repeat pinging — cases where the same endpoint was being called multiple times when once was enough. Found two categories: functions with no cache at all, and a race condition in a newly-added cache.

### What was wrong

| File | Function | Problem |
|---|---|---|
| `dashboardApi.ts` | All 7 functions | No caching — all 7 dashboard endpoints re-fired on every visit to the dashboard screen (every mount) |
| `countryApi.ts` | `loadAvailableYears` | No cache — called independently in `App.tsx`, `CountryScreen`, and `ComparisonResultsScreen`; fired on every mount of each |
| `discoveryApi.ts` | `loadDiscoveryCountries` | No module-level cache — relied entirely on `App.tsx` React state, which doesn't deduplicate concurrent calls |

### What was fixed

**`dashboardApi.ts`** — Added a `Map` cache to all 7 functions (`loadOverlapRate`, `loadDiscoveryGap`, `loadIsolationLeader`, `loadPeakReach`, `loadOverlapTrend`, `loadIsolationRanking`, `loadGapDistribution`) keyed on the date range string. First visit fetches; every subsequent visit is served from the module cache with zero network requests.

**`countryApi.ts` — `loadAvailableYears`** — Replaced the simple result cache (which still had a race window) with a Promise-level cache. All concurrent callers share the same in-flight request rather than each firing their own. If the request fails, the cache clears so the next call retries.

**`discoveryApi.ts` — `loadDiscoveryCountries`** — Added a module-level result cache and in-flight Promise deduplication, both keyed on year. On a cache hit, returns instantly. If a request for the same year is already in-flight (e.g., two callers at startup), the second caller shares the existing Promise instead of firing a second request.

### Why it matters

The dashboard had 7 concurrent SP calls on every screen visit with no way to reuse results — navigating away and back re-fired all 7 every time. `loadAvailableYears` was being called from 3 separate places with no coordination. These are the same pattern of repeat pinging that caused performance issues in earlier iterations.

### How to test

1. Open the app and navigate to the Dashboard — note load time
2. Navigate away and return to the Dashboard — should render **instantly** with no network requests visible in DevTools → Network tab
3. Open DevTools → Network, filter by `/api/metadata/years` — should appear **once** total across the session regardless of how many screens call it
4. Open DevTools → Network, filter by `/api/discovery/countries` — should appear **once per year** across the session; switching years fetches once for that year, switching back is instant

---

## 2026-05-13 — Genre Sampling Sequential Bottleneck

**Branch:** `loading-optimization`
**Scope:** `CountryController.cs` — `GetCountryGenreSamples` endpoint

### What I noticed

Genre samples on the Discovery globe screen were taking an extremely long time on first load. DevTools showed the `/api/country/genre-samples` request for the initial 8-country batch was the bottleneck — country page visits were much faster and frequently showed browser disk cache hits.

### What was wrong

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

### Separate finding — `sp_GetDiscoverPageInfo` pre-computation

The `/api/discovery/countries` SP (`sp_GetDiscoverPageInfo`) was scanning `ChartEntry` for an entire year to find the most frequently charted song per country using `ROW_NUMBER()`. This was written without knowing it would be called on every globe screen load.

**What was fixed** — Created `TopSongByCountryYear` summary table and `sp_PopulateTopSongByCountryYear` population SP (same pattern as dashboard SPs). Updated `sp_GetDiscoverPageInfo` to JOIN on the summary table instead of scanning `ChartEntry` live. The SP now reads only pre-computed tables and is near-instant.

**SSMS steps required before deploying:**
```sql
CREATE TABLE TopSongByCountryYear (
    country_id  INT            NOT NULL,
    chart_year  INT            NOT NULL,
    album_name  NVARCHAR(500)  NULL,
    artist_name NVARCHAR(500)  NULL,
    PRIMARY KEY (country_id, chart_year)
);
EXEC sp_PopulateTopSongByCountryYear;
-- Then register sp_GetDiscoverPageInfo.sql
```

### How to test

1. Hard refresh and navigate to Discovery Globe — the genre loading spinner in the sidebar should resolve noticeably faster than before
2. In DevTools → Network, find the `/api/country/genre-samples` request — check its duration on first load (cold server cache) vs before the fix
3. Confirm the fix is safe: check the backend logs — no Deezer rate limit errors (`429`) should appear during the batch request

---

## 2026-05-13 — Backend Error Handling

**Scope:** All 7 controllers

### What I noticed

While reviewing the AR 2023 `OperationCanceledException` error in the backend logs, I checked error handling across all controllers and found it was completely inconsistent — some had none at all.

### What was wrong

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

---

## 2026-05-13 — CancellationToken Propagation

**Scope:** All controllers, interfaces, repositories, and the SQL data layer

### What I noticed

While fixing controller error handling, I found that `CancellationToken` was being dropped before it ever reached the database. Controllers accepted the token and passed it to repositories, but `IDataRepository.GetDataAsync` / `GetDataSetsAsync` had no token parameter at all — so cancellation stopped at the repository boundary. SQL commands ran to completion even after the client disconnected.

Additionally, even in repositories that already declared a token (CountryRepository, HiddenGemsRepository), some individual `_db` call sites weren't passing it through.

### What was wrong

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

### Why it matters

Without this, every cancelled request still held a live SQL connection open until the query finished. On fast queries this is invisible. On slow scans — like the genre sampling that caused the AR 2023 error — the server kept doing work and holding resources for a client that was already gone. With the fix, the database command is interrupted immediately when the client disconnects, freeing the connection and thread right away.

---

## 2026-05-13 — Model Nullability Audit

**Scope:** All 20 model files across Dashboard, Comparison, Country, Globe, HiddenGems, and Shared folders

### What I noticed

Audited all models against their source stored procedures to check whether non-nullable value-type properties could actually receive NULL from the database.

### What was wrong

| Model | Property | Was | Should Be | Reason |
|---|---|---|---|---|
| `GlobalTrendPoint` | `OverlapPct` | `decimal` | `decimal?` | Gap rows in `sp_GetGlobalOverlapTrend` return NULL for all metric columns — Recharts uses `IsGap` to skip rendering these points |
| `GlobalTrendPoint` | `AvgCountries` | `decimal` | `decimal?` | Same — gap row |
| `GlobalTrendPoint` | `TotalUniqueSongs` | `int` | `int?` | Same — gap row |
| `GlobalTrendPoint` | `SongsIn2Plus` | `int` | `int?` | Same — gap row |
| `PeakReachKpi` | `PeakDate` | `DateOnly` | `DateOnly?` | `AsDateOnly` returned `DateOnly.MinValue` for NULL, masking missing dates instead of surfacing them |

### What was fixed

- Made 4 metric properties on `GlobalTrendPoint` nullable (`decimal?` / `int?`)
- Made `PeakDate` on `PeakReachKpi` nullable (`DateOnly?`)
- Updated `DashboardRepository` mapping for `GlobalTrendPoint` to call `AsNullableDecimal` and `AsNullableInt`
- Updated `DashboardRepository` mapping for `PeakReachKpi` to call `AsNullableDateOnly`
- Added `AsNullableDecimal` and `AsNullableDateOnly` private helper methods to `DashboardRepository`
- Removed the old non-nullable `AsDateOnly` helper (no longer used)

### All other models — no issues found

All remaining non-nullable value-type properties (`int` counts, `decimal` percentages, `double` lat/long, chart ranks) are backed by columns that are structurally guaranteed non-null by their SPs or are aggregates that always produce a value.

---

## How to Test (Branch: `67-cross-check-interfaces-controllers-against-sps`)

### Error handling

1. Start the API and make a valid request to any endpoint (e.g. `GET /api/dashboard/overlap-rate?start=2017-01-01&end=2021-12-31`)
2. Navigate away immediately / cancel the request — the server log should produce **no error entry** (silent `EmptyResult`, not a stack trace)
3. To verify 503: temporarily take the DB offline and hit any endpoint — should return `503` with the user-facing message, not a 500 or unhandled exception page
4. Sanity check: every controller action is wrapped in try-catch — no unprotected endpoints

### CancellationToken propagation

1. Open SQL Server Activity Monitor or query `sys.dm_exec_requests` before and after a cancelled request
2. Hit a slow endpoint (Hidden Gems with a large dataset, or genre sampling on a country not yet cached) and navigate away immediately
3. The in-flight SQL session should disappear from `dm_exec_requests` promptly — previously it would run to completion regardless of client disconnect

### Model nullability

1. Call `GET /api/dashboard/overlap-trend?start=2017-01-01&end=2024-12-31` — the response should include rows where `overlapPct`, `avgCountries`, `totalUniqueSongs`, and `songsIn2Plus` are `null` (not `0`) when `isGap` is `true`
2. Verify the dashboard gap region renders as a dashed line, not a flat zero line through the data gap
3. Call `GET /api/dashboard/peak-reach?start=2017-01-01&end=2024-12-31` — `peakDate` should be `null` if the SP returns NULL, not `"0001-01-01"`

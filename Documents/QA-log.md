# QA Log
## HiddenGemMusic Capstone

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

### Remaining SQL-side opportunity (not yet implemented)

`sp_GetDiscoverPageInfo` is the only major read SP not backed by a pre-computed summary table. It scans `ChartEntry` for an entire year to find the top song per country via `ROW_NUMBER()`. All dashboard SPs read from pre-computed tables and return instantly — this one doesn't. Pre-computing it into a summary table (similar to `sp_PopulateGlobalOverlapByYear` pattern) would be the remaining backend load-time win for the globe screen.

### How to test

1. Open the app and navigate to the Dashboard — note load time
2. Navigate away and return to the Dashboard — should render **instantly** with no network requests visible in DevTools → Network tab
3. Open DevTools → Network, filter by `/api/metadata/years` — should appear **once** total across the session regardless of how many screens call it
4. Open DevTools → Network, filter by `/api/discovery/countries` — should appear **once per year** across the session; switching years fetches once for that year, switching back is instant

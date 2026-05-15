# QA Log
## HiddenGemMusic Capstone

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

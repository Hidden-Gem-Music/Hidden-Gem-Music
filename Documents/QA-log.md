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

# ADR-BACKEND-002: API Routes, Controllers, Repository Layer, and DTOs

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** Leena Komenski (BDA / Backend Lead)
**Date:** 2026-04-22
**Status:** Accepted — pending SP cross-check (see Section 6)

---

## Context

This ADR documents the concrete implementation of the API surface: every route, controller action, repository method, stored procedure call, and DTO field mapping. It was written after the code compiled and built successfully, and reflects the actual state of the files — not the planning document.

> **Important:** The stored procedures referenced throughout this document have not yet been executed against a live database. All SP names, parameter names, and expected output column names were established from an existing planned project refernce document and the existing infrastructure. **They must be cross-checked against the real SP definitions as SPs are written and executed.** See Section 6 for the complete verification checklist.

---

## 1. Infrastructure Layer — How SPs Are Called

All database access flows through two layers:

**Layer 1 — Generic SP executor (`IDataRepository` / `SqlServerRepository`)**
Located in `Infrastructure/Interfaces/` and `Infrastructure/Repositories/`.
Executes any stored procedure and returns raw `IDictionary<string, object?>` rows.
Three methods:
- `GetDataAsync(string storedProc)` — no parameters
- `GetDataAsync(string storedProc, IDictionary<string, object?> parameters)` — with parameters
- `GetDataSetsAsync(string storedProc, IDictionary<string, object?> parameters)` — multiple result sets

`DateOnly` values are converted to `DateTime` using `.ToDateTime(TimeOnly.MinValue)` before being passed to SQL Server, since MSSQL `DATE` parameters expect `DateTime` from ADO.NET.

**Layer 2 — Domain repositories (`IGlobeRepository`, etc.)**
Located in `Infrastructure/Interfaces/` (interfaces) and `Infrastructure/Repositories/` (implementations).
Each injects `IDataRepositoryFactory`, creates an `IDataRepository` for `"DefaultConnection"`, calls the appropriate SP, and maps the dictionary rows to typed DTOs using private static helpers (`AsString`, `AsInt`, `AsDecimal`, `AsBool`, `AsDouble`, `AsNullableInt`, `AsDateOnly`).

`AsDateOnly` expects the SP to return a `DateTime` value (SQL `DATE`), which is then converted via `DateOnly.FromDateTime(dt)`.

**DI registrations in `Program.cs`:**
```
IDataRepositoryFactory  →  DataRepositoryFactory      (Singleton)
IGlobeRepository        →  GlobeRepository            (Scoped)
ICountryRepository      →  CountryRepository          (Scoped)
IHiddenGemsRepository   →  HiddenGemsRepository       (Scoped)
IComparisonRepository   →  ComparisonRepository       (Scoped)
IDashboardRepository    →  DashboardRepository        (Scoped)
```

---

## 2. All API Routes

**13 endpoints total across 5 controllers.** Each action method in a controller is one endpoint — the controller class is a grouping container, the base route (e.g. `[Route("api/dashboard")]`) sets the prefix, and each `[HttpGet(...)]` on an action method defines the specific endpoint under it.

| Controller | Endpoints |
|---|---|
| `GlobeController` | 1 |
| `CountryController` | 2 |
| `HiddenGemsController` | 1 |
| `ComparisonController` | 2 |
| `DashboardController` | 7 |
| **Total** | **13** |



All country codes are normalized to uppercase (`.ToUpper()`) at the controller boundary before being passed to the repository.

### 2.1 Globe

| Method | Route | Controller action | Default params |
|--------|-------|-------------------|---------------|
| GET | `/api/globe` | `GlobeController.GetGlobeSummary` | `year = 2021` |

**Query params:** `year` (int)

---

### 2.2 Country Profile

| Method | Route | Controller action | Default params |
|--------|-------|-------------------|---------------|
| GET | `/api/country/{code}` | `CountryController.GetCountryProfile` | `year = 2021` |
| GET | `/api/country/{code}/hidden-gems/preview` | `CountryController.GetHiddenGemsPreview` | `year = 2021` |

**Route params:** `code` (2-letter ISO, normalized to uppercase)
**Query params:** `year` (int)
**Returns 404** if `GetCountryProfileAsync` returns null (country/year combination not found).

---

### 2.3 Hidden Gems

| Method | Route | Controller action | Default params |
|--------|-------|-------------------|---------------|
| GET | `/api/hidden-gems/{code}` | `HiddenGemsController.GetHiddenGems` | `year = 2021`, `minCountries = 2`, `page = 1`, `pageSize = 25` |

**Route params:** `code` (2-letter ISO, normalized to uppercase)
**Query params:** `year`, `minCountries`, `page`, `pageSize`
**Clamping applied in controller (not in the SP):**
- `page < 1` → clamped to `1`
- `pageSize < 1 || pageSize > 100` → clamped to `25`

Offset passed to SP is calculated as `(page - 1) * pageSize`.

---

### 2.4 Comparison

| Method | Route | Controller action | Default params |
|--------|-------|-------------------|---------------|
| GET | `/api/comparison` | `ComparisonController.GetCountryComparison` | `year = 2021` |
| GET | `/api/comparison/hidden-gems` | `ComparisonController.GetComparisonHiddenGems` | `year = 2021` |

**Query params:** `countryA`, `countryB` (both required, no defaults), `year`
**Returns 404** if `GetCountryComparisonAsync` returns null (fewer than 2 result sets, or both country stats are empty).

---

### 2.5 Dashboard

All dashboard routes require `start` and `end` as `DateOnly` query parameters in ISO 8601 format (`yyyy-MM-dd`). No defaults — both are required.

| Method | Route | Controller action | Extra params | Returns 404? |
|--------|-------|-------------------|-------------|-------------|
| GET | `/api/dashboard/overlap-rate` | `GetOverlapRate` | — | Yes |
| GET | `/api/dashboard/discovery-gap` | `GetDiscoveryGap` | `minCountries = 2` | Yes |
| GET | `/api/dashboard/gap-distribution` | `GetGapDistribution` | — | No (empty list) |
| GET | `/api/dashboard/isolation-leader` | `GetIsolationLeader` | — | Yes |
| GET | `/api/dashboard/isolation-ranking` | `GetIsolationRanking` | — | No (empty list) |
| GET | `/api/dashboard/peak-reach` | `GetPeakReach` | — | Yes |
| GET | `/api/dashboard/overlap-trend` | `GetOverlapTrend` | — | No (empty list) |

---

## 3. Stored Procedure Bindings

For each SP: the name as hard-coded in the repository, the parameter names as passed from C#, and the output column names the repository expects to read. **All column names and parameter names must be verified against the live SP when it is written.**

### 3.1 `sp_GetGlobeSummary`
**Repository:** `GlobeRepository.GetGlobeSummaryAsync`
**Params:** `@Year INT`
**Expected output columns:**
| Column | C# property | Type |
|--------|------------|------|
| `country_code` | `CountryGlobeSummary.CountryCode` | string? |
| `country_name` | `CountryGlobeSummary.CountryName` | string? |
| `lat` | `CountryGlobeSummary.Lat` | double |
| `long` | `CountryGlobeSummary.Long` | double |
| `hidden_gem_count` | `CountryGlobeSummary.HiddenGemCount` | int |
| `top_album_name` | `CountryGlobeSummary.TopAlbumName` | string? |

---

### 3.2 `sp_GetCountryProfile`
**Repository:** `CountryRepository.GetCountryProfileAsync`
**Params:** `@CountryCode CHAR(2)`, `@Year INT`
**Result sets:** 3 (uses `GetDataSetsAsync`)

| Set | Content | Maps to |
|-----|---------|---------|
| 0 | Single stats row | `CountryProfile` scalar fields |
| 1 | Top shared songs | `CountryProfile.TopSharedSongs` |
| 2 | Top unique songs | `CountryProfile.TopUniqueSongs` |

**Set 0 expected columns:**
| Column | C# property | Type |
|--------|------------|------|
| `country_code` | `CountryProfile.CountryCode` | string? |
| `country_name` | `CountryProfile.CountryName` | string? |
| `chart_year` | `CountryProfile.Year` | int |
| `total_charted` | `CountryProfile.TotalCharted` | int |
| `shared_count` | `CountryProfile.SharedCount` | int |
| `unique_count` | `CountryProfile.UniqueCount` | int |
| `overlap_pct` | `CountryProfile.OverlapPct` | decimal |

**Sets 1 and 2 expected columns (Song):**
| Column | C# property | Type |
|--------|------------|------|
| `song_name` | `Song.SongName` | string? |
| `artist_name` | `Song.ArtistName` | string? |
| `album_name` | `Song.AlbumName` | string? |

---

### 3.3 `sp_GetCountryHiddenGemsPreview`
**Repository:** `CountryRepository.GetHiddenGemsPreviewAsync`
**Params:** `@CountryCode CHAR(2)`, `@Year INT`
**Expected output columns:** Same as Section 3.5 (HiddenGem shape).

---

### 3.4 `sp_GetHiddenGems`
**Repository:** `HiddenGemsRepository.GetHiddenGemsAsync`
**Params:** `@CountryCode CHAR(2)`, `@Year INT`, `@MinCountries INT`, `@Offset INT`, `@PageSize INT`

> Note: `@Offset` is computed in C# as `(page - 1) * pageSize` before being passed. The SP receives a row offset, not a page number.

**Expected output columns:**
| Column | C# property | Type |
|--------|------------|------|
| `song_name` | `HiddenGem.SongName` | string? |
| `album_name` | `HiddenGem.AlbumName` | string? |
| `artist_name` | `HiddenGem.ArtistName` | string? |
| `genre` | `HiddenGem.Genre` | string? |
| `preview_url` | `HiddenGem.PreviewUrl` | string? |
| `trend_score` | `HiddenGem.TrendScore` | decimal |
| `countries_charting_count` | `HiddenGem.CountriesChartingCount` | int |

---

### 3.5 `sp_GetCountryComparison`
**Repository:** `ComparisonRepository.GetCountryComparisonAsync`
**Params:** `@CountryCodeA CHAR(2)`, `@CountryCodeB CHAR(2)`, `@Year INT`
**Result sets:** 5 (uses `GetDataSetsAsync`)

| Set | Content | Maps to |
|-----|---------|---------|
| 0 | Country A stats (single row) | `ComparisonResult.CountryA` |
| 1 | Country B stats (single row) | `ComparisonResult.CountryB` |
| 2 | Shared songs | `ComparisonResult.SharedSongs` |
| 3 | Songs unique to Country A | `ComparisonResult.UniqueToA` |
| 4 | Songs unique to Country B | `ComparisonResult.UniqueToB` |

Returns null (→ 404) if fewer than 2 result sets are returned or either stats row is empty.

**Sets 0 and 1 expected columns (CountryComparisonSide):**
| Column | C# property | Type |
|--------|------------|------|
| `country_code` | `CountryComparisonSide.CountryCode` | string? |
| `country_name` | `CountryComparisonSide.CountryName` | string? |
| `total_charted` | `CountryComparisonSide.TotalCharted` | int |
| `shared_count` | `CountryComparisonSide.SharedCount` | int |
| `unique_count` | `CountryComparisonSide.UniqueCount` | int |
| `overlap_pct` | `CountryComparisonSide.OverlapPct` | decimal |

**Set 2 expected columns (SharedSong):**
| Column | C# property | Type |
|--------|------------|------|
| `song_name` | `SharedSong.SongName` | string? |
| `artist_name` | `SharedSong.ArtistName` | string? |
| `album_name` | `SharedSong.AlbumName` | string? |
| `rank_in_country_a` | `SharedSong.RankInCountryA` | int |
| `rank_in_country_b` | `SharedSong.RankInCountryB` | int |

**Sets 3 and 4 expected columns (Song):** Same as Section 3.2 sets 1/2.

---

### 3.6 `sp_GetComparisonHiddenGems`
**Repository:** `ComparisonRepository.GetComparisonHiddenGemsAsync`
**Params:** `@CountryCodeA CHAR(2)`, `@CountryCodeB CHAR(2)`, `@Year INT`
**Expected output columns:**
| Column | C# property | Type |
|--------|------------|------|
| `song_name` | `ComparisonHiddenGem.SongName` | string? |
| `album_name` | `ComparisonHiddenGem.AlbumName` | string? |
| `artist_name` | `ComparisonHiddenGem.ArtistName` | string? |
| `trend_score` | `ComparisonHiddenGem.TrendScore` | decimal |
| `countries_charting_count` | `ComparisonHiddenGem.CountriesChartingCount` | int |

---

### 3.7 Dashboard SPs — Standard Date Range

All dashboard SPs except `sp_GetAverageDiscoveryGap` receive exactly two parameters:
`@DateStart DATE`, `@DateEnd DATE` — passed as `DateTime` from C# via `DateOnly.ToDateTime(TimeOnly.MinValue)`.

#### `sp_GetGlobalOverlapRate`
**KPI 1.** Single row.
| Column | C# property | Type |
|--------|------------|------|
| `overlap_pct` | `GlobalOverlapRateKpi.OverlapPct` | decimal |
| `total_unique_songs` | `GlobalOverlapRateKpi.TotalUniqueSongs` | int |
| `songs_in_2plus` | `GlobalOverlapRateKpi.SongsIn2Plus` | int |

#### `sp_GetAverageDiscoveryGap`
**KPI 2.** Single row. Extra param: `@MinCountries INT` (default 2).
| Column | C# property | Type |
|--------|------------|------|
| `avg_gap_days` | `DiscoveryGapKpi.AvgGapDays` | int |
| `median_gap_days` | `DiscoveryGapKpi.MedianGapDays` | int |
| `sample_size` | `DiscoveryGapKpi.SampleSize` | int |

#### `sp_GetDiscoveryGapDistribution`
Multiple rows (one per bucket).
| Column | C# property | Type |
|--------|------------|------|
| `bucket_label` | `DiscoveryGapBucket.BucketLabel` | string? |
| `bucket_order` | `DiscoveryGapBucket.BucketOrder` | int |
| `song_count` | `DiscoveryGapBucket.SongCount` | int |

#### `sp_GetIsolationLeader`
**KPI 3.** Single row (top result only).
| Column | C# property | Type |
|--------|------------|------|
| `country_name` | `IsolationLeaderKpi.CountryName` | string? |
| `iso_code` | `IsolationLeaderKpi.IsoCode` | string? |
| `isolation_score` | `IsolationLeaderKpi.IsolationScore` | decimal |

#### `sp_GetIsolationRanking`
Multiple rows (all qualifying countries).
| Column | C# property | Type |
|--------|------------|------|
| `country_name` | `IsolationRankingEntry.CountryName` | string? |
| `iso_code` | `IsolationRankingEntry.IsoCode` | string? |
| `isolation_score` | `IsolationRankingEntry.IsolationScore` | decimal |
| `isolation_tier` | `IsolationRankingEntry.IsolationTier` | string? |

#### `sp_GetPeakCrossRegionalReach`
**KPI 4.** Single row.
| Column | C# property | Type |
|--------|------------|------|
| `peak_country_count` | `PeakReachKpi.PeakCountryCount` | int |
| `song_title` | `PeakReachKpi.SongTitle` | string? |
| `artist_name` | `PeakReachKpi.ArtistName` | string? |
| `peak_date` | `PeakReachKpi.PeakDate` | DateOnly (from DateTime) |

#### `sp_GetGlobalOverlapTrend`
Multiple rows (one per year or month).
| Column | C# property | Type |
|--------|------------|------|
| `period_label` | `GlobalTrendPoint.PeriodLabel` | string? |
| `period_year` | `GlobalTrendPoint.PeriodYear` | int |
| `period_month` | `GlobalTrendPoint.PeriodMonth` | int? (nullable) |
| `overlap_pct` | `GlobalTrendPoint.OverlapPct` | decimal |
| `avg_countries` | `GlobalTrendPoint.AvgCountries` | decimal |
| `total_unique_songs` | `GlobalTrendPoint.TotalUniqueSongs` | int |
| `songs_in_2plus` | `GlobalTrendPoint.SongsIn2Plus` | int |
| `is_gap` | `GlobalTrendPoint.IsGap` | bool (from BIT) |

> `period_month` must be `NULL` in the SP output when using yearly granularity — the C# `AsNullableInt` helper maps SQL `NULL` to `null`.

---

## 4. DTO Inventory

All DTOs are plain classes with `{ get; set; }` properties and XML doc comments. No records.

| DTO class | Namespace | SP it maps to |
|-----------|-----------|--------------|
| `CountryGlobeSummary` | `Models.Globe` | `sp_GetGlobeSummary` |
| `CountryProfile` | `Models.Country` | `sp_GetCountryProfile` (set 0) |
| `HiddenGem` | `Models.HiddenGems` | `sp_GetHiddenGems`, `sp_GetCountryHiddenGemsPreview` |
| `HiddenGemResponse` | `Models.HiddenGems` | Wrapper around `HiddenGem` list + page metadata |
| `ComparisonResult` | `Models.Comparison` | `sp_GetCountryComparison` (assembled from 5 sets) |
| `CountryComparisonSide` | `Models.Comparison` | `sp_GetCountryComparison` (sets 0 and 1) |
| `ComparisonHiddenGem` | `Models.Comparison` | `sp_GetComparisonHiddenGems` |
| `Song` | `Models.Shared` | Shared: country profile song lists, comparison unique lists |
| `SharedSong` | `Models.Shared` | `sp_GetCountryComparison` set 2 |
| `GlobalOverlapRateKpi` | `Models.Dashboard` | `sp_GetGlobalOverlapRate` |
| `DiscoveryGapKpi` | `Models.Dashboard` | `sp_GetAverageDiscoveryGap` |
| `DiscoveryGapBucket` | `Models.Dashboard` | `sp_GetDiscoveryGapDistribution` |
| `IsolationLeaderKpi` | `Models.Dashboard` | `sp_GetIsolationLeader` |
| `IsolationRankingEntry` | `Models.Dashboard` | `sp_GetIsolationRanking` |
| `PeakReachKpi` | `Models.Dashboard` | `sp_GetPeakCrossRegionalReach` |
| `GlobalTrendPoint` | `Models.Dashboard` | `sp_GetGlobalOverlapTrend` |

---

## 5. Behavioural Conventions

- **Country code normalization:** All `code`, `countryA`, and `countryB` route/query params are uppercased in the controller before reaching the repository. The SP receives e.g. `"US"`, not `"us"`.
- **404 vs empty list:** Endpoints that represent a single entity (country profile, comparison result, KPI stat cards) return `404 Not Found` when the repository returns null. Endpoints that represent lists (globe summary, hidden gems, trend data, isolation ranking) return `200 OK` with an empty array — never 404.
- **Pagination:** Offset-based. The controller clamps page and pageSize, then computes the offset. The SP is responsible for applying `OFFSET` / `FETCH NEXT` — the API never slices lists in memory.
- **Date parameters:** Passed as `DateTime` at midnight (`TimeOnly.MinValue`) to satisfy ADO.NET's expectation for SQL `DATE` parameters.

---

## 6. SP Cross-Check Checklist

> Complete this checklist as each stored procedure is written and tested. If any SP output column name or parameter name differs from what is listed in Section 3, update the corresponding repository mapping — not the SP.

### Globe
- [ ] `sp_GetGlobeSummary` — verify `@Year`, verify all 6 output columns

### Country
- [ ] `sp_GetCountryProfile` — verify `@CountryCode`, `@Year`, verify 3-result-set structure, verify all column names in each set (especially `chart_year` — may be named differently in `CountryYearStats`)
- [ ] `sp_GetCountryHiddenGemsPreview` — verify `@CountryCode`, `@Year`, verify all 7 HiddenGem columns

### Hidden Gems
- [ ] `sp_GetHiddenGems` — verify `@CountryCode`, `@Year`, `@MinCountries`, `@Offset`, `@PageSize`, verify all 7 output columns

### Comparison
- [ ] `sp_GetCountryComparison` — verify `@CountryCodeA`, `@CountryCodeB`, `@Year`, verify 5-result-set structure and column names in each set (especially `rank_in_country_a` / `rank_in_country_b` — these depend on how the SP aliases the columns)
- [ ] `sp_GetComparisonHiddenGems` — verify `@CountryCodeA`, `@CountryCodeB`, `@Year`, verify 5 output columns

### Dashboard
- [ ] `sp_GetGlobalOverlapRate` — verify `@DateStart`, `@DateEnd`, verify `overlap_pct`, `total_unique_songs`, `songs_in_2plus`
- [ ] `sp_GetAverageDiscoveryGap` — verify `@DateStart`, `@DateEnd`, `@MinCountries`, verify `avg_gap_days`, `median_gap_days`, `sample_size`
- [ ] `sp_GetDiscoveryGapDistribution` — verify `@DateStart`, `@DateEnd`, verify `bucket_label`, `bucket_order`, `song_count`
- [ ] `sp_GetIsolationLeader` — verify `@DateStart`, `@DateEnd`, verify `country_name`, `iso_code`, `isolation_score`
- [ ] `sp_GetIsolationRanking` — verify `@DateStart`, `@DateEnd`, verify `country_name`, `iso_code`, `isolation_score`, `isolation_tier`
- [ ] `sp_GetPeakCrossRegionalReach` — verify `@DateStart`, `@DateEnd`, verify `peak_country_count`, `song_title`, `artist_name`, `peak_date` (must be SQL `DATE` or `DATETIME` — `AsDateOnly` expects `DateTime` at runtime)
- [ ] `sp_GetGlobalOverlapTrend` — verify `@DateStart`, `@DateEnd`, verify all 8 columns, confirm `period_month` is `NULL` for yearly granularity and `is_gap` is `BIT`

---

## 7. Known Gaps

- `HiddenGemResponse` does not include a `TotalCount`. If the frontend needs page indicators (not just infinite scroll), either add an `OUTPUT` parameter to `sp_GetHiddenGems` or create a separate count SP. Tracked in `backend/OPEN_DECISIONS.md`.
- `genre` on `HiddenGem` and `HiddenGemResponse` is nullable and will be null until a genre source is confirmed. Neither dataset includes genre natively.
- `preview_url` on `HiddenGem` is nullable — availability depends on the dataset.
- `GlobalTrendPoint.PeriodMonth` is nullable — the yearly vs. monthly granularity decision determines whether this will ever be populated.

---

## Related Documents

- `ADR-BACKEND-001-API-Architecture.md` — Framework, database, repository pattern, and CORS decisions

# Stored Procedures — HiddenGemMusic

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** Leena Komenski
**Date:** 2026-04-22
**Last updated:** 2026-05-15
**Status:** Active

---

> **Contributor documentation.** This document is intended for developers and contributors working on the HiddenGemMusic backend. It covers database setup, stored procedure behavior, and data layer internals. It is not relevant to end users of the app.

---
 
## Overview
 
This folder contains all MSSQL stored procedures for the HiddenGemMusic database. Procedures are split into two categories:
 
- **Population** — expensive procedures that build pre-computed summary tables from raw `ChartEntry` data. Run once after initial ingestion, or any time the summary tables need to be rebuilt. Never called at request time.
- **Read** — lightweight procedures called by the .NET 9 API at request time. Never touch `ChartEntry` directly — they read only from pre-computed summary tables.
> **Schema note:** As of April 26, 2026, the database was migrated from 3NF to a star schema. `Song`, `Artist`, `ArtistSong`, `AudioFeatures`, and `Album` were replaced by `DIM_Song`, `DIM_Artist`, and `Bridge_SongArtist`. All population procedures are unchanged. Seven read procedures were updated — see the Star Schema Migration ADR for full details.
>
> **Data quality fixes (May 2026):** Three population procedures were updated to exclude Viral 50 entries (`chart_type_id != 2`) — see affected procedures below. `DiscoveryGapByDay` received a new `first_chart_date DATE NULL` column (May 13 schema change). Two read procedures were updated to filter on `first_chart_date` directly rather than using a `SongCountryPresence chart_year` proxy. See `adr-discovery-gap-data-quality.md` for full details.
 
---
 
## Folder Structure
 
```
stored-procedures/
├── run-all-population.sql           ← Run this once after ingestion
├── population/
│   ├── sp_PopulateSongCountryPresence.sql
│   ├── sp_PopulateCountryYearStats.sql
│   ├── sp_PopulateGlobalOverlapByYear.sql
│   ├── sp_PopulateTrendVelocityBySong.sql
│   ├── sp_PopulateDiscoveryGapByDay.sql
│   ├── sp_PopulateIsolationScoreByCountry.sql
│   ├── sp_PopulatePeakReachBySong.sql
│   ├── sp_PopulateHiddenGems.sql
│   └── sp_PopulateTopSongByCountryYear  ← no .sql extension
└── read/
    ├── sp_GetAvailableYears.sql
    ├── sp_GetDiscoverPageInfo.sql
    ├── sp_GetCountryProfile.sql
    ├── sp_GetCountryHiddenGemsPreview.sql
    ├── sp_GetCountrySongsPaged.sql
    ├── sp_GetHiddenGems.sql
    ├── sp_GetCountryComparison.sql
    ├── sp_GetComparisonHiddenGems.sql
    ├── sp_GetGlobalOverlapRate.sql
    ├── sp_GetAverageDiscoveryGap.sql
    ├── sp_GetDiscoveryGapDistribution.sql
    ├── sp_GetIsolationLeader.sql
    ├── sp_GetIsolationRanking.sql
    ├── sp_GetPeakCrossRegionalReach.sql
    └── sp_GetGlobalOverlapTrend.sql
```
 
---
 
## Local Development Setup

> This section is for contributors setting up the database locally. It is not relevant to end users.

After the database schema is created and both datasets are ingested via BULK INSERT, run the population procedures **once** in order:
 
```sql
-- Option 1: run all at once (recommended)
-- Open run-all-population.sql in SSMS and execute
 
-- Option 2: run individually in SSMS in this exact order
EXEC sp_PopulateSongCountryPresence;
EXEC sp_PopulateCountryYearStats;
EXEC sp_PopulateGlobalOverlapByYear;
EXEC sp_PopulateTrendVelocityBySong;
EXEC sp_PopulateDiscoveryGapByDay;
EXEC sp_PopulateIsolationScoreByCountry;
EXEC sp_PopulatePeakReachBySong;
EXEC sp_PopulateHiddenGems;              -- run last among HiddenGems dependencies
EXEC sp_PopulateTopSongByCountryYear;    -- independent; can run any time after ingestion
```
 
> **Note:** `sp_PopulateHiddenGems` is the most expensive operation in the system. It runs a cross-country exclusion query across all years. Do not close SSMS while it's running.
 
After population completes, verify row counts:
 
```sql
SELECT 'SongCountryPresence'       AS tbl, COUNT(*) AS rows FROM SongCountryPresence
UNION ALL
SELECT 'CountryYearStats',          COUNT(*) FROM CountryYearStats
UNION ALL
SELECT 'GlobalOverlapByYear',       COUNT(*) FROM GlobalOverlapByYear
UNION ALL
SELECT 'TrendVelocityBySong',       COUNT(*) FROM TrendVelocityBySong
UNION ALL
SELECT 'DiscoveryGapByDay',         COUNT(*) FROM DiscoveryGapByDay
UNION ALL
SELECT 'IsolationScoreByCountry',   COUNT(*) FROM IsolationScoreByCountry
UNION ALL
SELECT 'PeakReachBySong',           COUNT(*) FROM PeakReachBySong
UNION ALL
SELECT 'HiddenGems',                COUNT(*) FROM HiddenGems
UNION ALL
SELECT 'TopSongByCountryYear',      COUNT(*) FROM TopSongByCountryYear;
```
 
**Confirmed row counts (post star schema migration, April 27, 2026 — six tables repopulated May 8, 2026 after Viral 50 exclusion fix):**
 
| Table | Rows (April 27) | Notes |
|---|---|---|
| `SongCountryPresence` | 289,690 (pre-fix) | Decreased after May 8 repopulation (Viral 50 excluded) — see `adr-discovery-gap-data-quality.md` for post-fix values |
| `CountryYearStats` | 546 | Repopulated May 8 |
| `GlobalOverlapByYear` | 9 | Repopulated May 8 |
| `TrendVelocityBySong` | 707,689 | Unchanged |
| `DiscoveryGapByDay` | 466,845 (pre-fix) | Decreased after May 8 + May 13 repopulation (Viral 50 excluded, floor raised to `> 1`, `first_chart_date` column added) — see `adr-discovery-gap-data-quality.md` for post-fix values |
| `IsolationScoreByCountry` | 546 | Repopulated May 8 |
| `PeakReachBySong` | 240,844 | Repopulated May 8 |
| `HiddenGems` | 2,585,433 | Unchanged |
| `TopSongByCountryYear` | — | Populated May 15, 2026 — run `EXEC sp_PopulateTopSongByCountryYear` for current count |
 
**ChartEntry and dimension table counts (confirmed April 27, 2026):**
 
| Table | Rows |
|---|---|
| `DIM_Song` | 240,848 |
| `DIM_Artist` | 103,015 |
| `Bridge_SongArtist` | 257,368 |
| `ChartEntry` (DS1) | 26,173,514 |
| `ChartEntry` (DS2) | 2,110,316 |
| `ChartEntry` (total) | 28,283,830 |
 
---
 
## Population Procedures
 
### `sp_PopulateSongCountryPresence`
For each song and year, counts how many distinct countries it charted in. This is the foundation of all Hidden Gems logic and powers the minimum country count filter in the UI.
 
- **Reads:** `ChartEntry`
- **Writes:** `SongCountryPresence`
- **Run order:** 1 — must run before all others
- **Data quality fix (May 8, 2026):** `AND ce.chart_type_id != 2` added to main WHERE clause — Viral 50 entries excluded. Table repopulated.
---
 
### `sp_PopulateCountryYearStats`
Aggregates per country per year: total songs charted, shared count (also charted elsewhere), unique count (only charted here), and overlap percentage. Feeds KPI displays on the country profile page, comparison page, and dashboard.
 
- **Reads:** `ChartEntry`, `SongCountryPresence`
- **Writes:** `CountryYearStats`
- **Run order:** 2
---
 
### `sp_PopulateGlobalOverlapByYear`
Year-by-year global overlap percentage and average countries per charting song. Inserts a **synthetic gap row for 2022** (`is_gap = 1`, all metrics `NULL`) so Recharts can render the dashed line segment across the 22-month data gap (Dec 2021 – Oct 2023).
 
- **Reads:** `SongCountryPresence`
- **Writes:** `GlobalOverlapByYear`
- **Run order:** 3
---
 
### `sp_PopulateTrendVelocityBySong`
Pre-computes a normalized trend velocity per song per country using a 4-snapshot rolling window. Dataset 1 trend strings are mapped to numeric signals (`MOVE_UP = +1`, `MOVE_DOWN = -1`, `SAME = 0`, `NEW_ENTRY = +1`). Dataset 2 uses `daily_movement` integers directly, clamped to ±10.
 
- **Reads:** `ChartEntry`
- **Writes:** `TrendVelocityBySong`
- **Run order:** 4
---
 
### `sp_PopulateDiscoveryGapByDay`
For each song charting in 2+ countries: calculates the number of days between its first chart appearance anywhere (origin country) and its first appearance in each subsequent country. Pre-buckets results into gap bands at population time so no client-side math is needed at render time. Also populates `first_chart_date` — the origin date of each spread event — directly on the output table for use by read SPs.
 
Gap bands: `1-7d` | `8-14d` | `15-30d` | `31-60d` | `61-90d` | `90d+`
 
- **Reads:** `ChartEntry`
- **Writes:** `DiscoveryGapByDay`
- **Run order:** 5 — most expensive date calculation in the system
- **Data quality fixes (May 2026):** `AND ce.chart_type_id != 2` added to FirstAppearance CTE (Viral 50 excluded). Final WHERE floor raised from `gap_days >= 0` to `gap_days > 1` (day-zero left-censorship artifacts and day-one global simultaneous rollouts excluded). HAVING filter added to Origin CTE to exclude dataset boundary-week origins. `first_chart_date DATE NULL` column added to `DiscoveryGapByDay` table (May 13) and populated from `origin_date` in the Spread CTE. Table repopulated.
---
 
### `sp_PopulateIsolationScoreByCountry`
Per country per year: `isolation_score = (local_songs - shared_songs) / local_songs * 100`. Only includes countries with ≥ 100 total `ChartEntry` rows. Assigns `isolation_tier` (`high` > 65%, `mid` 40–65%, `low` < 40%) for Recharts bar chart color coding.
 
- **Reads:** `CountryYearStats`, `ChartEntry`
- **Writes:** `IsolationScoreByCountry`
- **Run order:** 6
---
 
### `sp_PopulatePeakReachBySong`
For each song: finds the `snapshot_date` on which it charted in the most countries simultaneously. Stores the peak country count, song ID, and date. Song title and artist name are joined at read time by `sp_GetPeakCrossRegionalReach`.
 
- **Reads:** `ChartEntry`
- **Writes:** `PeakReachBySong`
- **Run order:** 7
- **Data quality fix (May 8, 2026):** `AND ce.chart_type_id != 2` added to DailyReach CTE — Viral 50 entries excluded. Table repopulated.
---
 
### `sp_PopulateHiddenGems`
**The most expensive procedure in the system.**
 
For each country and year: finds songs charting in `@MinCountries` or more other countries but completely absent from this country's charts. Computes a `TrendScore` composite for each result:
 
```
TrendScore = (countries_charting × 10)
           + (avg_rank_signal × 5)
           + (new_entry_bonus × 15)
           + (trend_velocity × 10)
```
 
Default minimum country threshold is 3. Can be re-run with a different threshold without affecting other tables:
 
```sql
EXEC sp_PopulateHiddenGems @MinCountries = 5;
```
 
- **Reads:** `ChartEntry`, `SongCountryPresence`, `TrendVelocityBySong`
- **Writes:** `HiddenGems`
- **Run order:** 8 — depends on all other population procedures
---
 
### `sp_PopulateTopSongByCountryYear`
Pre-computes the most frequently charted song per country per year. Stores `country_id`, `chart_year`, `song_id`, `album_name`, and primary `artist_name` in `TopSongByCountryYear` for use by `sp_GetDiscoverPageInfo` at request time. Without this table, the Discovery Map SP would need to scan `ChartEntry` live on every load.
 
Ties broken deterministically by `song_id ASC`. Includes a sanity-check result set on completion showing rows populated per year. Can be re-run any time `ChartEntry` is updated — uses `TRUNCATE` before repopulating.
 
> **Note:** File has no `.sql` extension — open it directly in SSMS and execute.
 
- **Reads:** `ChartEntry`, `DIM_Song`, `Bridge_SongArtist`, `DIM_Artist`
- **Writes:** `TopSongByCountryYear`
- **Run order:** 9 — independent of `sp_PopulateHiddenGems`; both read from base tables only
---
 
## Read Procedures
 
All read procedures are called by the .NET 9 API at request time. **None of them touch `ChartEntry` directly.**
 
> **Star schema update (April 26, 2026):** Seven read procedures were updated to reference `DIM_Song`, `Bridge_SongArtist`, and `DIM_Artist` instead of the old `Song`, `ArtistSong`, `Artist`, and `Album` tables. Output shapes and parameter signatures are identical — no API or DTO changes required.
>
> Updated procedures: `sp_GetDiscoverPageInfo` (replaced `sp_GetGlobeSummary`), `sp_GetCountryProfile`, `sp_GetCountryHiddenGemsPreview`, `sp_GetHiddenGems`, `sp_GetCountryComparison`, `sp_GetComparisonHiddenGems`, `sp_GetPeakCrossRegionalReach`
>
> Unchanged procedures: `sp_GetGlobalOverlapRate`, `sp_GetAverageDiscoveryGap`, `sp_GetDiscoveryGapDistribution`, `sp_GetIsolationLeader`, `sp_GetIsolationRanking`, `sp_GetGlobalOverlapTrend`
 
---
 
### Metadata
 
#### `sp_GetAvailableYears`
Returns the sorted list of distinct chart years present in `ChartEntry`. Called by the `/api/metadata/years` endpoint on app startup to populate year selectors across all screens.
 
```sql
EXEC sp_GetAvailableYears;
```
 
**Returns:** `chart_year`
 
---
 
### Discovery Screen
 
#### `sp_GetDiscoverPageInfo`
One lightweight row per country for the Discovery Map and the country list sidebar. Reads only pre-computed tables (`Country`, `HiddenGems`, `TopSongByCountryYear`) — near-instant response time. Countries are matched by `iso_code` (SVG map shape matching), so only rows with a valid `iso_code` are returned.
 
```sql
EXEC sp_GetDiscoverPageInfo @Year = 2021;
```
 
**Returns:** `country_code`, `country_name`, `latitude`, `longitude`, `region`, `hidden_gem_count`, `top_album_name`, `top_artist_name`
 
> `top_album_name` and `top_artist_name` come from `TopSongByCountryYear`. Countries with no chart data for the year return `NULL` for both fields — this is expected and handled by the frontend.
 
---
 
### Country Profile Page
 
#### `sp_GetCountryProfile`
Full summary stats for one country and year. Returns three result sets: KPI summary stats, top 10 shared songs, top 10 unique songs.
 
```sql
EXEC sp_GetCountryProfile @CountryCode = 'US', @Year = 2021;
```
 
#### `sp_GetCountryHiddenGemsPreview`
Top 5 hidden gems teaser for the country profile page widget. Ordered by `TrendScore DESC`.
 
```sql
EXEC sp_GetCountryHiddenGemsPreview @CountryCode = 'US', @Year = 2021;
```
 
#### `sp_GetCountrySongsPaged`
Paginated shared or unique song list for the country profile songs tab. `@ListType = 'shared'` returns songs that charted in more than one country; `@ListType = 'unique'` returns songs that charted only in this country. Uses `NOT EXISTS` against `HiddenGems` as a proxy for local chart presence (same approach as `sp_GetCountryProfile`). Includes `total_count` via `COUNT(1) OVER()` for pagination.
 
```sql
EXEC sp_GetCountrySongsPaged
    @CountryCode = 'US',
    @Year        = 2021,
    @ListType    = 'shared',
    @Offset      = 0,
    @PageSize    = 50;
```
 
**Returns:** `song_title`, `artist_name`, `album_name`, `total_count`
 
---
 
### Hidden Gems Screen
 
#### `sp_GetHiddenGems`
Full paginated hidden gems list. Filterable by minimum country count.
 
```sql
EXEC sp_GetHiddenGems
    @CountryCode  = 'US',
    @Year         = 2021,
    @MinCountries = 3,
    @Offset       = 0,
    @PageSize     = 20;
```
 
**Returns:** `song_id`, `song_title`, `artist_name`, `album_name`, `spotify_id` (preview URL), `is_explicit`, `countries_charting`, `trend_score`
 
---
 
### Country Comparison Page
 
#### `sp_GetCountryComparison`
Side-by-side KPIs and song lists for two countries. Returns five result sets: Country A stats, Country B stats, songs in both, songs unique to A, songs unique to B.
 
```sql
EXEC sp_GetCountryComparison
    @CountryCodeA = 'US',
    @CountryCodeB = 'GB',
    @Year         = 2021;
```
 
#### `sp_GetComparisonHiddenGems`
Songs trending regionally but absent from **both** selected countries — the gap both markets share.
 
```sql
EXEC sp_GetComparisonHiddenGems
    @CountryCodeA = 'US',
    @CountryCodeB = 'GB',
    @Year         = 2021;
```
 
---
 
### Global Overlap Dashboard
 
#### `sp_GetGlobalOverlapRate`
**KPI 1.** Percentage of all unique charting songs that appeared in 2+ countries during the date range.
 
```sql
EXEC sp_GetGlobalOverlapRate
    @DateStart = '2017-01-01',
    @DateEnd   = '2021-12-31';
```
 
**Returns:** `overlap_pct`, `total_unique_songs`, `songs_in_2plus_countries`
 
---
 
#### `sp_GetAverageDiscoveryGap`
**KPI 2.** Average and median days between a song's first chart appearance anywhere and its first appearance in a second country. Aggregates to one row per song (minimum gap) before averaging — both metrics count the same unit as `sp_GetDiscoveryGapDistribution`.
 
```sql
EXEC sp_GetAverageDiscoveryGap
    @DateStart    = '2017-01-01',
    @DateEnd      = '2021-12-31',
    @MinCountries = 2;
```
 
**Returns:** `avg_gap_days`, `median_gap_days`, `sample_size`
 
> **Data quality fix (May 2026):** Rewrote to aggregate to `SongFirstCrossing` CTE (MIN per song) before averaging. Date filter changed from `SongCountryPresence chart_year` proxy to `WHERE dgd.first_chart_date BETWEEN @DateStart AND @DateEnd`. Floor raised from `> 0` to `> 1`.
 
---
 
#### `sp_GetDiscoveryGapDistribution`
Feeds the Discovery Gap Distribution histogram. Returns pre-bucketed song counts — no client-side math.
 
```sql
EXEC sp_GetDiscoveryGapDistribution
    @DateStart = '2017-01-01',
    @DateEnd   = '2021-12-31';
```
 
**Returns:** `bucket_label`, `bucket_order`, `song_count`
 
> **Data quality fix (May 2026):** Date filter changed from `SongCountryPresence chart_year` proxy to `WHERE dgbd.first_chart_date BETWEEN @DateStart AND @DateEnd`. Floor raised from `>= 0` to `> 1`.
 
---
 
#### `sp_GetIsolationLeader`
**KPI 3.** The single most globally isolated country (highest isolation score) in the date range.
 
```sql
EXEC sp_GetIsolationLeader
    @DateStart = '2017-01-01',
    @DateEnd   = '2021-12-31';
```
 
**Returns:** `country_name`, `iso_code`, `region`, `isolation_score`
 
---
 
#### `sp_GetIsolationRanking`
All qualifying countries ranked by isolation score. Feeds the Regional Isolation Scores horizontal bar chart. Separated from `sp_GetIsolationLeader` so the KPI card and chart can be fetched independently.
 
```sql
EXEC sp_GetIsolationRanking
    @DateStart = '2017-01-01',
    @DateEnd   = '2021-12-31';
```
 
**Returns:** `country_name`, `iso_code`, `region`, `isolation_score`, `isolation_tier`
 
---
 
#### `sp_GetPeakCrossRegionalReach`
**KPI 4.** The highest number of countries a single song simultaneously charted in at any point in the date range. Result is displayed in a Vinyl card component.
 
```sql
EXEC sp_GetPeakCrossRegionalReach
    @DateStart = '2017-01-01',
    @DateEnd   = '2021-12-31';
```
 
**Returns:** `peak_country_count`, `song_title`, `artist_name`, `peak_date`, `preview_url`, `is_explicit`, `album_name`
 
---
 
#### `sp_GetGlobalOverlapTrend`
Feeds both dashboard trend charts: Global Overlap Rate Over Time (line chart) and Global Reach Over Time (bar chart). Returns one row per year including the synthetic 2022 gap row (`is_gap = 1`, `overlap_pct = NULL`) so Recharts renders the dashed gap segment and `ReferenceArea` correctly.
 
```sql
EXEC sp_GetGlobalOverlapTrend
    @DateStart = '2017-01-01',
    @DateEnd   = '2025-06-10';
```
 
**Returns:** `period_year`, `period_label`, `overlap_pct`, `total_unique_songs`, `songs_in_2plus`, `avg_countries`, `is_gap`
 
---
 
## Known Quirks
 
- `GlobalOverlapByYear` contains a synthetic row for 2022 with `is_gap = 1` and all metric columns `NULL`. This is intentional for Recharts gap rendering — do not flag as a data error during QA.
- All read procedures assume population procedures have been run. Running read procedures against empty summary tables returns empty result sets, not errors.
- `sp_GetCountryProfile` **shared songs** result set uses `NOT EXISTS` against `HiddenGems` (filtered by country_id) to exclude songs already categorised as hidden gems for this country. If `sp_PopulateHiddenGems` has not been run, those songs will appear in the shared list. The unique songs result set also has a `NOT EXISTS` against `HiddenGems`, but it is dead code — `country_count = 1` songs can never be in `HiddenGems` (which requires `country_count >= @MinCountries = 3`), so that filter never matches anything.
- `sp_PopulateHiddenGems` can be re-run independently with a different `@MinCountries` threshold without re-running any other population procedure.
- Audio feature columns on `DIM_Song` are NULL for all DS1-only songs. Any component using audio features must handle NULL values gracefully.
- `TopSongByCountryYear` uses `TRUNCATE` before each repopulation — running `sp_PopulateTopSongByCountryYear` twice is safe. If the table is empty, `sp_GetDiscoverPageInfo` still returns rows but `top_album_name` and `top_artist_name` will be `NULL` for all countries.
- `sp_GetAvailableYears` scans `ChartEntry` directly (no summary table). It is called once at startup and the result is cached in-memory by the API — not a hot path.
- `DiscoveryGapByDay` has a `first_chart_date DATE NULL` column added May 13, 2026. This stores the origin date of each spread event directly on the pre-computed table. Any read SP that date-filters discovery gap data must use `first_chart_date`, not `SongCountryPresence.chart_year`.
- Viral 50 entries (`chart_type_id = 2`) are excluded from `SongCountryPresence`, `DiscoveryGapByDay`, and `PeakReachBySong`. All KPI values, overlap rates, and peak reach figures reflect Top 200 and Top 50 chart entries only. Do not remove the `chart_type_id != 2` filter without understanding the downstream impact on all dashboard metrics.
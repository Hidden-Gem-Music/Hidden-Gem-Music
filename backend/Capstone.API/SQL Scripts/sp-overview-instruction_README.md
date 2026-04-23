# Stored Procedures — HiddenGemMusic

**SOFT290 Capstone** | Leena Komenski | April 2026

---

## Overview

This folder contains all MSSQL stored procedures for the HiddenGemMusic database. Procedures are split into two categories:

- **Population** — expensive procedures that build pre-computed summary tables from raw `ChartEntry` data. Run once after initial ingestion, or any time the summary tables need to be rebuilt. Never called at request time.
- **Read** — lightweight procedures called by the .NET 9 API at request time. Never touch `ChartEntry` directly — they read only from pre-computed summary tables.

---

## Folder Structure

```
stored-procedures/
├── run-all-population.sql       ← Run this once after ingestion
├── population/
│   ├── sp_PopulateSongCountryPresence.sql
│   ├── sp_PopulateCountryYearStats.sql
│   ├── sp_PopulateGlobalOverlapByYear.sql
│   ├── sp_PopulateTrendVelocityBySong.sql
│   ├── sp_PopulateDiscoveryGapByDay.sql
│   ├── sp_PopulateIsolationScoreByCountry.sql
│   ├── sp_PopulatePeakReachBySong.sql
│   └── sp_PopulateHiddenGems.sql
└── read/
    ├── sp_GetGlobeSummary.sql
    ├── sp_GetCountryProfile.sql
    ├── sp_GetCountryHiddenGemsPreview.sql
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

## First-Time Setup

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
EXEC sp_PopulateHiddenGems;        -- always last
```

> **Note:** `sp_PopulateHiddenGems` is the most expensive operation in the system. It runs a cross-country exclusion query across all years. Do not close SSMS while it's running.

After population completes, verify row counts:

```sql
SELECT 'SongCountryPresence'     AS tbl, COUNT(*) AS rows FROM SongCountryPresence
UNION ALL
SELECT 'CountryYearStats',        COUNT(*) FROM CountryYearStats
UNION ALL
SELECT 'GlobalOverlapByYear',     COUNT(*) FROM GlobalOverlapByYear
UNION ALL
SELECT 'TrendVelocityBySong',     COUNT(*) FROM TrendVelocityBySong
UNION ALL
SELECT 'DiscoveryGapByDay',       COUNT(*) FROM DiscoveryGapByDay
UNION ALL
SELECT 'IsolationScoreByCountry', COUNT(*) FROM IsolationScoreByCountry
UNION ALL
SELECT 'PeakReachBySong',         COUNT(*) FROM PeakReachBySong
UNION ALL
SELECT 'HiddenGems',              COUNT(*) FROM HiddenGems;
```

**Expected row counts (confirmed April 23, 2026):**

| Table | Rows |
|---|---|
| `SongCountryPresence` | — |
| `CountryYearStats` | — |
| `GlobalOverlapByYear` | — |
| `TrendVelocityBySong` | 707,628 |
| `DiscoveryGapByDay` | 467,045 |
| `IsolationScoreByCountry` | 549 |
| `PeakReachBySong` | 240,583 |
| `HiddenGems` | 2,586,390 |

---

## Population Procedures

### `sp_PopulateSongCountryPresence`
For each song and year, counts how many distinct countries it charted in. This is the foundation of all Hidden Gems logic and powers the minimum country count filter in the UI.

- **Reads:** `ChartEntry`
- **Writes:** `SongCountryPresence`
- **Run order:** 1 — must run before all others

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
For each song charting in 2+ countries: calculates the number of days between its first chart appearance anywhere (origin country) and its first appearance in each subsequent country. Pre-buckets results into gap bands at population time so no client-side math is needed at render time.

Gap bands: `0-7d` | `8-14d` | `15-30d` | `31-60d` | `61-90d` | `90d+`

- **Reads:** `ChartEntry`
- **Writes:** `DiscoveryGapByDay`
- **Run order:** 5 — most expensive date calculation in the system

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

---

### `sp_PopulateHiddenGems`
**The most expensive procedure in the system. Always run last.**

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

## Read Procedures

All read procedures are called by the .NET 9 API at request time. **None of them touch `ChartEntry` directly.**

---

### Globe / Discovery Screen

#### `sp_GetGlobeSummary`
One lightweight row per country for globe dots and the country list sidebar. Also used as the source for the Mapbox tileset export.

```sql
EXEC sp_GetGlobeSummary @Year = 2021;
```

**Returns:** `country_code`, `country_name`, `latitude`, `longitude`, `region`, `hidden_gem_count`, `top_album_name`

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
**KPI 2.** Average and median days between a song's first chart appearance anywhere and its first appearance in a second country.

```sql
EXEC sp_GetAverageDiscoveryGap
    @DateStart    = '2017-01-01',
    @DateEnd      = '2021-12-31',
    @MinCountries = 2;
```

**Returns:** `avg_gap_days`, `median_gap_days`, `sample_size`

---

#### `sp_GetDiscoveryGapDistribution`
Feeds the Discovery Gap Distribution histogram. Returns pre-bucketed song counts — no client-side math.

```sql
EXEC sp_GetDiscoveryGapDistribution
    @DateStart = '2017-01-01',
    @DateEnd   = '2021-12-31';
```

**Returns:** `bucket_label`, `bucket_order`, `song_count`

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
- `sp_GetCountryProfile` shared and unique song result sets use `NOT EXISTS` against `HiddenGems` as a proxy for local chart presence. Results will be incorrect if `sp_PopulateHiddenGems` has not been run.
- `sp_PopulateHiddenGems` can be re-run independently with a different `@MinCountries` threshold without re-running any other population procedure.
# Stored Procedure Build Notes
**SOFT290 Capstone — HiddenGemMusic**
Date: April 23, 2026 | Author: Leena

---

## Overview

All 8 population procedures and 13 read procedures written and compiled successfully. Notes below document every issue encountered during the build and how it was resolved. Useful for QA validation and future debugging reference.

---

## Issues Encountered & Resolutions

### 1. Column name mismatches (multiple procedures)

**Root cause:** Procedures were written against the reference doc's planned column names, which differed from the actual column names in the DB creation script in several places.

**Affected tables and corrections:**

| Table | Planned name (reference doc) | Actual column name |
|---|---|---|
| `GlobalOverlapByYear` | `avg_countries_per_song` | `avg_countries` |
| `DiscoveryGapByDay` | `origin_date`, `spread_date`, `gap_days`, `gap_bucket` | *(columns don't exist)* — table only stores `days_to_spread`, `bucket_label`, `bucket_order` |
| `PeakReachBySong` | `peak_country_count`, `song_title`, `artist_name` | *(columns don't exist)* — table only stores `song_id`, `peak_date`, `country_count` |
| `TrendVelocityBySong` | *(missing column)* | `chart_year` exists in table, was not in original INSERT |

**Resolution:** Aligned all INSERT column lists and SELECT references to match actual schema. `PeakReachBySong` song/artist info is now joined at read time in `sp_GetPeakCrossRegionalReach` rather than stored at population time.

**Lesson:** Before writing any future procedures, run `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'X'` first.

---

### 2. `sp_PopulateGlobalOverlapByYear` — missing columns in INSERT

**Error:** `Invalid column name 'avg_countries_per_song'`

**Resolution:** Column is `avg_countries` in the actual table. Also added `period_month`, `total_unique_songs`, and `songs_in_2plus` to the INSERT column list — these existed in the table but were missing from the original INSERT statement.

---

### 3. `sp_PopulateDiscoveryGapByDay` — nonexistent columns

**Error:** `Invalid column name 'origin_date'`, `'spread_date'`, `'gap_days'`, `'gap_bucket'`

**Resolution:** The `DiscoveryGapByDay` table does not store origin/spread dates or raw gap days — only the pre-bucketed result columns `days_to_spread`, `bucket_label`, `bucket_order`. INSERT and all read procedures updated accordingly. Date range filtering removed from `sp_GetAverageDiscoveryGap` since those date columns don't exist.

---

### 4. `sp_PopulateHiddenGems` — `LEFT JOIN` after `WHERE` clause

**Error:** `Incorrect syntax near the keyword 'LEFT'`

**Root cause:** The three scoring `LEFT JOIN` clauses were placed after the `WHERE NOT EXISTS` block, which is invalid SQL Server syntax. All JOINs must precede the WHERE clause.

**Resolution:** Moved `LEFT JOIN AvgRankSignal`, `LEFT JOIN NewEntryBonus`, and `LEFT JOIN BestVelocity` to before the `WHERE NOT EXISTS` block.

---

### 5. `sp_GetGlobeSummary` — `TOP 1` inside derived table subquery

**Error:** `Incorrect syntax near 'TOP'`

**Root cause:** SQL Server does not allow `TOP N` inside a derived table subquery used in a `FROM`/`JOIN` clause unless it also has an `ORDER BY`, and even then the pattern is unreliable.

**Resolution:** Replaced with `ROW_NUMBER() OVER (PARTITION BY country_id ORDER BY COUNT(*) DESC)` pattern inside a subquery, filtering to `WHERE rn = 1` in the outer query.

---

### 6. `sp_GetCountryProfile` — `EXISTS(...) = 0` invalid syntax

**Error:** `Incorrect syntax near '='`

**Root cause:** `EXISTS(...) = 0` is not valid SQL Server syntax. EXISTS returns a boolean and cannot be compared with `= 0`.

**Resolution:** Replaced with `NOT EXISTS(...)` which is the correct SQL Server idiom.

---

### 7. `sp_PopulateTrendVelocityBySong` — zero rows inserted, NULL `chart_year`

**Error sequence:**
1. First attempt: `Cannot insert the value NULL into column 'chart_year'` — ruled out NULL `snapshot_date` (0 NULL rows confirmed)
2. Added NULL guards (`WHERE rolling_velocity IS NOT NULL`) — procedure completed but inserted 0 rows, meaning `rolling_velocity` was NULL for every row
3. Rewrote `AVG()` window function as `SUM(...) OVER / NULLIF(COUNT(...) OVER, 0)` — still 0 rows
4. Checked `trend_velocity` column definition

**Root cause:** `trend_velocity` is `DECIMAL(10,4) NOT NULL` in the table. The procedure was computing `rolling_velocity` as `FLOAT` and relying on implicit cast to `DECIMAL(10,4)`. SQL Server was silently producing NULL on the implicit `FLOAT → DECIMAL` conversion for every row rather than throwing an overflow error.

**Resolution:** Explicit `CAST(... AS DECIMAL(10,4))` with a clamping CASE expression on the final INSERT to ensure no value exceeds the type's safe range. Result: 707,628 rows inserted across years 2017–2021 and 2023–2025.

**Note:** 2023–2025 row counts (54,656 combined) are significantly lower than 2017–2021 (652,972 combined) — this is expected. DS2 has far fewer source rows than DS1, and the velocity procedure keeps only one row per song per country (the most recent snapshot).

---

## Final Population Execution Order

```sql
EXEC sp_PopulateSongCountryPresence;      -- fast
EXEC sp_PopulateCountryYearStats;         -- fast
EXEC sp_PopulateGlobalOverlapByYear;      -- fast
EXEC sp_PopulateTrendVelocityBySong;      -- moderate — window functions across 28M rows
EXEC sp_PopulateDiscoveryGapByDay;        -- slow — date comparisons across 28M rows
EXEC sp_PopulateIsolationScoreByCountry;  -- moderate
EXEC sp_PopulatePeakReachBySong;          -- moderate
EXEC sp_PopulateHiddenGems;              -- slowest — cross-country exclusion logic
```

---

## Confirmed Row Counts (post-population)

| Table | Row Count |
|---|---|
| `TrendVelocityBySong` | 707,628 |
| `DiscoveryGapByDay` | 467,045 |
| `IsolationScoreByCountry` | 549 |
| `PeakReachBySong` | 240,583 |
| `HiddenGems` | 2,586,390 |

---

## Known Quirks for QA Reference

- `sp_PopulateGlobalOverlapByYear` inserts a **synthetic gap row for 2022** with all NULL metric columns and `is_gap = 1`. This is intentional — Recharts uses it to render the dashed line segment across the 22-month data gap. Do not flag as a data error during QA.
- `sp_GetCountryProfile` unique songs result set uses `NOT EXISTS` against `HiddenGems` as a proxy for local presence. If `sp_PopulateHiddenGems` has not been run, this result set will return incorrectly inflated results.
- All read procedures assume population procedures have been run. Running read procedures against empty summary tables will return empty result sets, not errors.
- `sp_PopulateHiddenGems` accepts `@MinCountries INT = 3` — default threshold is 3 countries. Can be re-run with a different threshold: `EXEC sp_PopulateHiddenGems @MinCountries = 5`.
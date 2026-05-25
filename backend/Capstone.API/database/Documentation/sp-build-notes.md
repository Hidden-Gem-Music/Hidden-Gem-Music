# Stored Procedure Build Notes

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** Leena Komenski
**Date:** 2026-04-23
**Last updated:** 2026-05-15
**Status:** Active

---

> **Contributor documentation.** This is an internal build and troubleshooting log documenting issues encountered during stored procedure development and the star schema migration. It is not relevant to end users of the app.

---
 
## Overview
 
All 8 population procedures and 13 read procedures written and compiled successfully on April 23, 2026. On April 26–27, 2026, all procedures were reviewed and updated as part of the star schema migration. On May 15, 2026, `sp_PopulateTopSongByCountryYear` (population) and `sp_GetDiscoverPageInfo` (read) were added, and `sp_GetAvailableYears` and `sp_GetCountrySongsPaged` were added as read procedures — bringing the totals to 9 population and 15 read procedures. Notes below document every issue encountered during the original build and the star schema migration, and how each was resolved.
 
---
 
## Part 1 — Original SP Build Issues (April 23, 2026)
 
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
 
**Resolution:** The `DiscoveryGapByDay` table does not store origin/spread dates or raw gap days — only the pre-bucketed result columns `days_to_spread`, `bucket_label`, `bucket_order`. INSERT and all read procedures updated accordingly.
 
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
 
## Part 2 — Star Schema Migration Issues (April 26–27, 2026)
 
### 8. Could not drop Song — FK constraint violations from summary tables
 
**Error:** `Could not drop object 'Song' because it is referenced by a FOREIGN KEY constraint`
 
**Root cause:** Five pre-computed summary tables (HiddenGems, SongCountryPresence, TrendVelocityBySong, PeakReachBySong, DiscoveryGapByDay) all held named FKs pointing at Song. ChartEntry also had an unnamed inline FK that did not appear in sys.foreign_keys queries against ChartEntry — it was dropped automatically when Song was dropped after the summary table FKs were removed.
 
**Resolution:** Dropped all five summary table FKs explicitly before dropping old tables. Re-added all FKs pointing at DIM_Song after both ingestion scripts completed and DIM_Song was fully populated.
 
---
 
### 9. FK re-adds failed immediately after DIM_Song creation
 
**Error:** `The ALTER TABLE statement conflicted with the FOREIGN KEY constraint`
 
**Root cause:** DIM_Song was empty. ChartEntry and all summary tables contained song_id values that could not be validated against an empty table. SQL Server enforces FK integrity immediately on constraint creation.
 
**Resolution:** Deferred all FK re-adds until after both DS1 and DS2 ingestion scripts completed and DIM_Song was confirmed fully populated.
 
---
 
### 10. BULK INSERT — IID_IColumnsInfo OLE DB error
 
**Error:** `Cannot obtain the required interface ("IID_IColumnsInfo") from OLE DB provider "BULK"`
 
**Root cause:** Both CSV files were stored in OneDrive paths. SQL Server's service account cannot access OneDrive virtualized directories regardless of user-level permissions.
 
**Resolution:** Copied both CSV files to `C:\CapstoneData\` — a simple local path accessible to the SQL Server service account. Confirmed accessibility with `EXEC xp_fileexist` before re-running.
 
---
 
### 11. DIM_Song title and album_name truncation
 
**Error:** `String or binary data would be truncated in table 'HiddenGemMusic.dbo.DIM_Song', column 'title'` and `column 'album_name'`
 
**Root cause:** Both columns were defined as NVARCHAR(255) in the original DDL. Some DS1 song titles and DS2 album names exceed 255 characters.
 
**Resolution:** `ALTER TABLE DIM_Song ALTER COLUMN title NVARCHAR(512)` and `ALTER TABLE DIM_Song ALTER COLUMN album_name NVARCHAR(MAX)` run before re-attempting the INSERT steps.
 
---
 
### 12. DIM_Artist artist_name truncation — repeated
 
**Error:** `String or binary data would be truncated in table 'HiddenGemMusic.dbo.DIM_Artist', column 'artist_name'`
 
**Root cause:** Hit twice — first at NVARCHAR(255), then at NVARCHAR(900). DS1 contains packed multi-artist strings exceeding 900 characters, and Japanese multi-byte characters consume more bytes than Latin characters at any given character length. SQL Server also cannot create a UNIQUE index on columns wider than 900 bytes, and cannot create any index on NVARCHAR(MAX).
 
**Resolution:** Dropped `UQ_DIM_Artist_Name` constraint, widened `artist_name` to NVARCHAR(MAX). Unique constraint not re-added — SQL Server cannot index MAX columns. Deduplication maintained via `NOT EXISTS` logic in both ingestion scripts. Documented as a known limitation in the Star Schema Migration ADR.
 
---
 
### 13. ChartEntry DS2 rows orphaned after migration
 
**Error:** FK re-add on ChartEntry failed — 2,110,316 orphaned rows with song_ids from the old Song table (range 516k–757k) that did not exist in DIM_Song (range 68k–321k).
 
**Root cause:** The original ingestion populated ChartEntry with DS2 rows before the star schema migration. DIM_Song was created fresh with a new IDENTITY sequence, assigning completely different song_id values. The old ChartEntry DS2 rows still referenced the pre-migration Song table IDs.
 
**Resolution:** Deleted all DS2 ChartEntry rows (`DELETE FROM ChartEntry WHERE source = 'Top50_73_Countries'`), re-ran DS2 staging (Steps 1 and 2 of DS2 ingestion script), re-ran FK pre-resolution (Step 4), and re-ran ChartEntry INSERT (Step 6). DIM_Song, DIM_Artist, and Bridge_SongArtist steps were skipped — dimension tables were already correctly populated.
 
---
 
### 14. ChartEntry duplicates from double ingestion
 
**Issue:** After migration, ChartEntry contained two copies of both DS1 and DS2 data — one from the original ingestion and one from the star schema re-ingestion. Total was ~56M rows instead of ~28M.
 
**Root cause:** The original ingestion was never cleared before the re-ingestion ran. DS1 appeared under two different source tag values (`Historical_Top200_and_Viral50` and `Spotify_Historical_Charts`). DS2 appeared twice under the same source tag.
 
**Resolution:**
- DS1 duplicate: `DELETE FROM ChartEntry WHERE source = 'Historical_Top200_and_Viral50'`
- DS2 duplicate: `DELETE FROM ChartEntry WHERE source = 'Top50_73_Countries' AND chart_entry_id > 60616149` — midpoint of the ID range cleanly split the two insertions
**Final confirmed counts:** DS1: 26,173,514 | DS2: 2,110,316 | Total: 28,283,830
 
---
 
### 15. All summary tables orphaned — population re-run required
 
**Issue:** After migration, all five summary tables with song_id FKs (PeakReachBySong, TrendVelocityBySong, HiddenGems, SongCountryPresence, DiscoveryGapByDay) were 100% orphaned — every row referenced old Song table IDs.
 
**Root cause:** Population procedures were originally run before the star schema migration. All pre-computed data referenced pre-migration song_id values.
 
**Resolution:** Truncated all eight summary tables, added FKs to empty tables successfully, then re-ran `run-all-population.sql` in full. All procedures completed successfully against the new DIM_Song IDs.
 
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
EXEC sp_PopulateHiddenGems;               -- slowest — cross-country exclusion logic
EXEC sp_PopulateTopSongByCountryYear;     -- fast — independent; reads base tables only
```
 
---
 
## Confirmed Row Counts (post star schema migration, April 27, 2026)
 
> **May 8, 2026 update:** Six tables were repopulated after the Viral 50 exclusion fix (`AND ce.chart_type_id != 2` added to `sp_PopulateSongCountryPresence`, `sp_PopulateDiscoveryGapByDay`, `sp_PopulatePeakReachBySong`). `DiscoveryGapByDay` also had the floor raised from `> 0` to `> 1`.
>
> **May 13, 2026 update:** `DiscoveryGapByDay` received a `first_chart_date DATE NULL` schema column (populated from `origin_date` in the Spread CTE). Floor raised again from `> 1` — table repopulated. See `adr-discovery-gap-data-quality.md` for full details.
>
> Counts below reflect the April 27 state — post-fix counts are lower for all repopulated tables.

| Table | Row Count (April 27) | Notes |
|---|---|---|
| `SongCountryPresence` | 289,690 | Decreased after May 8 repopulation |
| `CountryYearStats` | 546 | Repopulated May 8 |
| `GlobalOverlapByYear` | 9 | Repopulated May 8 |
| `TrendVelocityBySong` | 707,689 | Unchanged |
| `DiscoveryGapByDay` | 466,845 | Decreased after May 8 repopulation |
| `IsolationScoreByCountry` | 546 | Repopulated May 8 |
| `PeakReachBySong` | 240,844 | Repopulated May 8 |
| `HiddenGems` | 2,585,433 | Unchanged |
| `TopSongByCountryYear` | — | Populated May 15, 2026; repopulate after May 19 migration |
 
---

## Part 3 — Issue #148 Fix (May 19, 2026)

### 16. Discovery Map — "No song data" for all DS1 years (2017–2021)

**Issue:** Discovery Map hover cards and country cards showed "No song data for [year]" for virtually all countries in DS1 years (2017–2021). The display line was suppressed even though song titles and artist names were present in the database.

**Root cause:** The Historical Top 200 CSV (DS1) does not include album names. `DIM_Song.album_name` is `NULL` for all DS1 songs and is never populated by any enrichment process — Deezer enrichment tools write local output files only, not the database. The Discovery Map path reads `sp_GetDiscoverPageInfo` → `TopSongByCountryYear` → `DIM_Song.album_name`, which is always `NULL` for DS1. `hasSongData` required a non-null album_name, so the display was suppressed for all DS1 countries.

The bug was pre-existing; the May 13 optimization did not change this behavior. DS2 album data works correctly because the Top 50 CSV includes album names.

**Resolution:**

SP changes:
- `sp_PopulateTopSongByCountryYear` — Added `s.title AS song_name` to `SELECT`, `GROUP BY`, and `INSERT` so the winning song title is persisted in `TopSongByCountryYear`. Added `CASE WHEN a.artist_name IS NOT NULL THEN 0 ELSE 1 END ASC` as a secondary tie-break in `ROW_NUMBER()` (defensive: prefer known-artist songs at equal chart counts).
- `sp_GetDiscoverPageInfo` — Added `tscy.song_name AS top_song_name` to the `SELECT`.
- `TopSongByCountryYear` table — One-time migration required:
  ```sql
  ALTER TABLE TopSongByCountryYear ADD song_name NVARCHAR(512) NULL;
  ```

Frontend changes (see QA log for full scope):
- `hasSongData` now checks `topSongName` + `topArtistName` instead of `topAlbumName` + `topArtistName`.
- Hover card and country card label changed from "Most popular album" to "Most popular song."
- Display now uses `topSong` (song title) instead of `topAlbum` (album name).

**Action required:** In SSMS — run the `ALTER TABLE` above, re-apply both updated SP definitions, then `EXEC sp_PopulateTopSongByCountryYear;`. Note: `album_name` remaining `NULL` in the result set for DS1 entries is expected and correct.

---
 
## Known Quirks for QA Reference
 
- `sp_PopulateGlobalOverlapByYear` inserts a **synthetic gap row for 2022** with all NULL metric columns and `is_gap = 1`. This is intentional — Recharts uses it to render the dashed line segment across the 22-month data gap. Do not flag as a data error during QA.
- `sp_GetCountryProfile` **shared songs** result set uses `NOT EXISTS` against `HiddenGems` (filtered by country_id) to exclude songs already categorised as hidden gems for this country from the shared list. If `sp_PopulateHiddenGems` has not been run, the shared songs result set will include those songs. The unique songs result set also has a `NOT EXISTS` against `HiddenGems`, but it is dead code — `country_count = 1` songs can never appear in `HiddenGems` (which requires `country_count >= @MinCountries = 3`), so that filter never matches anything.
- All read procedures assume population procedures have been run. Running read procedures against empty summary tables will return empty result sets, not errors.
- `sp_PopulateHiddenGems` accepts `@MinCountries INT = 3` — default threshold is 3 countries. Can be re-run with a different threshold: `EXEC sp_PopulateHiddenGems @MinCountries = 5`
- Audio feature columns on `DIM_Song` are NULL for all DS1-only songs that were never matched to a DS2 entry. Any component using audio features must handle NULL values. 24,983 songs have audio features populated — all from DS2 coverage.
- `DIM_Artist.artist_name` has no UNIQUE index — SQL Server cannot index NVARCHAR(MAX) columns. Uniqueness is enforced by NOT EXISTS in ingestion only. Minor duplicates may exist where the same artist name appears with formatting differences across datasets.
- `DiscoveryGapByDay` has a `first_chart_date DATE NULL` column added May 13, 2026. It stores the origin date of each spread event directly on the pre-computed table. Any read SP filtering discovery gap data by date must use `first_chart_date` — not `SongCountryPresence.chart_year`.
- Viral 50 entries (`chart_type_id = 2`) are excluded from `SongCountryPresence`, `DiscoveryGapByDay`, and `PeakReachBySong` via `AND ce.chart_type_id != 2`. All KPI values, overlap rates, and peak reach figures reflect Top 200 and Top 50 chart entries only. Do not remove this filter without understanding the downstream impact on all dashboard metrics.
 
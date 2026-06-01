-- ============================================================
-- HIDDEN GEM MUSIC — DATASET 1 INGESTION SCRIPT
-- Source:  Kaggle Spotify Historical Charts (2017-2021)
-- File:    dataset1_top200_viral50.csv
-- Author:  Leena
-- Date:    April 2026
-- ============================================================

USE HiddenGemMusic;
GO


-- ============================================================
-- STEP 1 — CREATE STAGING TABLE
--   Columns are intentionally oversized (MAX where needed)
--   to prevent truncation errors on any row in the dataset.
--   Type casting and validation happen in later steps.
-- ============================================================
DROP TABLE IF EXISTS DS1_Staging;
GO

CREATE TABLE DS1_Staging (
    title   NVARCHAR(MAX) NULL,   -- oversized to prevent truncation
    rank    NVARCHAR(10)  NULL,
    date    NVARCHAR(20)  NULL,
    artist  NVARCHAR(MAX) NULL,   -- oversized — multi-artist strings vary widely
    url     NVARCHAR(MAX) NULL,
    region  NVARCHAR(200) NULL,
    chart   NVARCHAR(50)  NULL,
    trend   NVARCHAR(50)  NULL,
    streams NVARCHAR(50)  NULL
);
GO


-- ============================================================
-- STEP 2 — BULK INSERT
--   FORMAT = 'CSV' handles RFC 4180 parsing correctly in
--   SQL Server 2025 — quoted fields, embedded commas, and
--   Unix line endings (0x0A) all handled without escape issues.
--   MAXERRORS = 0 means load everything; log but don't abort
--   on any individual row errors.
-- ============================================================
BULK INSERT DS1_Staging
FROM 'C:\Users\lkome\OneDrive\School\Capstone Data\raw data- old\dataset1_top200_viral50.csv'
WITH (
    FORMAT          = 'CSV',
    FIRSTROW        = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR   = '0x0a',
    CODEPAGE        = '65001',
    MAXERRORS       = 0,
    TABLOCK
);
GO

-- ============================================================
-- CHECK ROW COUNT — must be > 0 before continuing.
-- Expected: ~26,090,476
-- Also check actual max lengths so we can document them.
-- ============================================================
SELECT 'DS1_Staging rows loaded' AS check_name, COUNT(*) AS row_count
FROM DS1_Staging;

SELECT
    MAX(LEN(title))  AS max_title_len,
    MAX(LEN(artist)) AS max_artist_len,
    MAX(LEN(url))    AS max_url_len
FROM DS1_Staging;
GO

-- ============================================================
-- STOP AND CHECK BOTH RESULTS ABOVE BEFORE CONTINUING.
-- ============================================================


-- ============================================================
-- STEP 3 — REMOVE DUPLICATE CHART ENTRIES
--   Composite key: title + date + region + chart
-- ============================================================
;WITH Deduped AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY title, date, region, chart
               ORDER BY (SELECT NULL)
           ) AS rn
    FROM DS1_Staging
)
DELETE FROM Deduped WHERE rn > 1;
GO

SELECT 'DS1_Staging rows after dedup' AS check_name, COUNT(*) AS row_count
FROM DS1_Staging;
GO


-- ============================================================
-- STEP 4 — POPULATE Song
--   Parse spotify_id from URL.
--   Format: https://open.spotify.com/track/TRACKID
-- ============================================================
INSERT INTO Song (spotify_id, title)
SELECT
    CASE
        WHEN url LIKE '%/track/%'
        THEN SUBSTRING(url, CHARINDEX('/track/', url) + 7, LEN(url))
        ELSE NULL
    END AS spotify_id,
    title
FROM (
    SELECT
        url,
        title,
        ROW_NUMBER() OVER (
            PARTITION BY
                CASE
                    WHEN url LIKE '%/track/%'
                    THEN SUBSTRING(url, CHARINDEX('/track/', url) + 7, LEN(url))
                    ELSE title
                END
            ORDER BY (SELECT NULL)
        ) AS rn
    FROM DS1_Staging
) AS Deduped
WHERE rn = 1;
GO

SELECT 'Song rows inserted' AS check_name, COUNT(*) AS row_count FROM Song;
GO


-- ============================================================
-- STEP 5 — POPULATE Artist
-- ============================================================
INSERT INTO Artist (name)
SELECT DISTINCT LTRIM(RTRIM(CAST(artist AS NVARCHAR(255))))
FROM DS1_Staging
WHERE artist IS NOT NULL
  AND LTRIM(RTRIM(artist)) != ''
  AND NOT EXISTS (
      SELECT 1 FROM Artist a
      WHERE a.name = LTRIM(RTRIM(CAST(DS1_Staging.artist AS NVARCHAR(255))))
  );
GO

SELECT 'Artist rows inserted' AS check_name, COUNT(*) AS row_count FROM Artist;
GO


-- ============================================================
-- STEP 6 — POPULATE ArtistSong
-- ============================================================
INSERT INTO ArtistSong (artist_id, song_id, is_primary)
SELECT DISTINCT
    a.artist_id,
    sg.song_id,
    1 AS is_primary
FROM DS1_Staging s
JOIN Artist a  ON a.name = LTRIM(RTRIM(CAST(s.artist AS NVARCHAR(255))))
JOIN Song   sg ON sg.title = CAST(s.title AS NVARCHAR(255))
WHERE NOT EXISTS (
    SELECT 1 FROM ArtistSong asg
    WHERE asg.artist_id = a.artist_id
      AND asg.song_id   = sg.song_id
);
GO

SELECT 'ArtistSong rows inserted' AS check_name, COUNT(*) AS row_count FROM ArtistSong;
GO


-- ============================================================
-- HIDDEN GEM MUSIC — STEP 7 OPTIMIZED
-- ChartEntry population for Dataset 1
-- ============================================================
-- Run this as a replacement for Step 7 in DS1_Ingestion.sql.
-- Assumes Steps 1-6 completed successfully:
--   - DS1_Staging exists with 26M rows
--   - Song, Artist, ArtistSong are populated
--   - ChartEntry is empty
-- ============================================================

USE HiddenGemMusic;
GO

-- ============================================================
-- 7a. ADD FK COLUMNS TO STAGING TABLE
-- ============================================================
ALTER TABLE DS1_Staging ADD
    song_id           INT            NULL,
    country_id        INT            NULL,
    chart_type_id     INT            NULL,
    parsed_spotify_id NVARCHAR(50)   NULL,
    title_key         NVARCHAR(512)  NULL;
GO

PRINT '7a complete — columns added';


-- ============================================================
-- 7b. POPULATE HELPER COLUMNS
--     Computed once, stored, then indexed.
--     Avoids recomputing SUBSTRING and CAST on every join.
-- ============================================================
-- Fix parsed_spotify_id — previous attempt failed because
-- SUBSTRING doesn't work correctly on NVARCHAR(MAX) in SQL 2025
-- Explicit CAST to NVARCHAR(500) fixes it
UPDATE DS1_Staging
SET parsed_spotify_id =
    CASE
        WHEN CAST(url AS NVARCHAR(500)) LIKE '%/track/%'
        THEN SUBSTRING(
            CAST(url AS NVARCHAR(500)),
            CHARINDEX('/track/', CAST(url AS NVARCHAR(500))) + 7,
            50)
        ELSE NULL
    END
WHERE parsed_spotify_id IS NULL;
GO

-- Verify it worked
SELECT
    COUNT(*)                                                    AS total_rows,
    SUM(CASE WHEN parsed_spotify_id IS NOT NULL THEN 1 ELSE 0 END) AS has_spotify_id,
    SUM(CASE WHEN parsed_spotify_id IS NULL     THEN 1 ELSE 0 END) AS still_null
FROM DS1_Staging;
GO

PRINT '7b complete — helper columns populated';


-- ============================================================
-- 7c. INDEX THE STAGING TABLE
--     Critical — without these, every UPDATE below is a
--     full 26M row scan. With them, each is an indexed seek.
--     These indexes are temporary and dropped with the table.
-- ============================================================
CREATE INDEX IX_Staging_SpotifyID ON DS1_Staging (parsed_spotify_id)
    WHERE parsed_spotify_id IS NOT NULL;

CREATE INDEX IX_Staging_TitleKey  ON DS1_Staging (title_key)
    WHERE parsed_spotify_id IS NULL;

CREATE INDEX IX_Staging_Region    ON DS1_Staging (region);
CREATE INDEX IX_Staging_Chart     ON DS1_Staging (chart);
GO

PRINT '7c complete — staging indexes created';


-- ============================================================
-- 7d. RESOLVE song_id
--     Two passes: spotify_id match first (fast, precise),
--     then title match for rows where URL didn't parse.
-- ============================================================
UPDATE s
SET s.song_id = sg.song_id
FROM DS1_Staging s
JOIN Song sg ON sg.spotify_id = s.parsed_spotify_id
WHERE s.parsed_spotify_id IS NOT NULL;
GO

UPDATE s
SET s.song_id = sg.song_id
FROM DS1_Staging s
JOIN Song sg ON sg.title = s.title_key
WHERE s.song_id IS NULL
  AND s.parsed_spotify_id IS NULL;
GO

PRINT '7d complete — song_id resolved';
SELECT 'Unresolved song_id' AS check_name,
       COUNT(*) AS rows
FROM DS1_Staging WHERE song_id IS NULL;
GO


-- ============================================================
-- 7e. RESOLVE country_id
--     Two passes: full name match, then GLOBAL fallback.
-- ============================================================
UPDATE s
SET s.country_id = c.country_id
FROM DS1_Staging s
JOIN Country c ON c.full_name = LTRIM(RTRIM(s.region));
GO

UPDATE s
SET s.country_id = c.country_id
FROM DS1_Staging s
JOIN Country c ON c.iso_code = '--'
WHERE s.country_id IS NULL
  AND LTRIM(RTRIM(ISNULL(s.region, ''))) IN ('', 'GLOBAL');
GO

PRINT '7e complete — country_id resolved';
SELECT 'Unresolved country_id' AS check_name,
       COUNT(*) AS rows
FROM DS1_Staging WHERE country_id IS NULL;
GO


-- ============================================================
-- 7f. RESOLVE chart_type_id
--     Tiny lookup table — instant.
-- ============================================================
UPDATE s
SET s.chart_type_id = ct.chart_type_id
FROM DS1_Staging s
JOIN ChartType ct
    ON (s.chart = 'top200'  AND ct.name = 'Top 200')
    OR (s.chart = 'viral50' AND ct.name = 'Viral 50');
GO

PRINT '7f complete — chart_type_id resolved';


-- ============================================================
-- PRE-INSERT SANITY CHECK
-- Review these numbers before continuing.
-- missing_song_id should be very close to 0.
-- missing_chart_type_id must be 0.
-- missing_country_id may have a small number — those rows
-- get NULL country_id which is allowed on ChartEntry.
-- ============================================================
SELECT
    COUNT(*) AS total_rows,
    SUM(CASE WHEN song_id       IS NULL THEN 1 ELSE 0 END) AS missing_song_id,
    SUM(CASE WHEN country_id    IS NULL THEN 1 ELSE 0 END) AS missing_country_id,
    SUM(CASE WHEN chart_type_id IS NULL THEN 1 ELSE 0 END) AS missing_chart_type_id
FROM DS1_Staging;
GO

-- ============================================================
-- STOP HERE — check the counts above before continuing.
-- ============================================================


-- ============================================================
-- 7g. DROP CHARTENTRY INDEXES BEFORE INSERT
--     Maintaining 6 nonclustered indexes during a 26M row
--     INSERT multiplies write cost by 6x. Drop them now,
--     rebuild after. Safe because ChartEntry is empty.
-- ============================================================
DROP INDEX IF EXISTS IX_ChartEntry_Country_Date ON ChartEntry;
DROP INDEX IF EXISTS IX_ChartEntry_Song_Country  ON ChartEntry;
DROP INDEX IF EXISTS IX_ChartEntry_Song_Date     ON ChartEntry;
DROP INDEX IF EXISTS IX_ChartEntry_Date          ON ChartEntry;
DROP INDEX IF EXISTS IX_ChartEntry_ChartType     ON ChartEntry;
DROP INDEX IF EXISTS IX_ChartEntry_Source        ON ChartEntry;
GO

PRINT '7g complete — ChartEntry indexes dropped';


-- ============================================================
-- 7h. DISABLE FK CONSTRAINTS DURING INSERT
--     FKs validated during staging enrichment steps above.
--     Disabling them removes per-row constraint check overhead.
-- ============================================================
ALTER TABLE ChartEntry NOCHECK CONSTRAINT FK_ChartEntry_Song;
ALTER TABLE ChartEntry NOCHECK CONSTRAINT FK_ChartEntry_Country;
ALTER TABLE ChartEntry NOCHECK CONSTRAINT FK_ChartEntry_ChartType;
GO

PRINT '7h complete — FK constraints disabled';


-- ============================================================
-- 7i. INSERT INTO CHARTENTRY
--     No joins — all FKs already resolved in staging.
--     Simple indexed scan of DS1_Staging into ChartEntry.
--     This should be the fastest possible INSERT.
-- ============================================================
INSERT INTO ChartEntry (
    song_id, country_id, chart_type_id, snapshot_date,
    rank, streams, trend, trend_velocity, source
)
SELECT
    song_id,
    country_id,
    chart_type_id,
    CAST(date    AS DATE),
    CAST(rank    AS SMALLINT),
    CASE
        WHEN streams IS NULL OR LTRIM(RTRIM(streams)) = ''
        THEN NULL
        ELSE CAST(streams AS BIGINT)
    END,
    trend,
    CASE trend
        WHEN 'MOVE_UP'       THEN  1.0
        WHEN 'MOVE_DOWN'     THEN -1.0
        WHEN 'SAME_POSITION' THEN  0.0
        WHEN 'NEW_ENTRY'     THEN  1.0
        ELSE NULL
    END,
    'Historical_Top200_and_Viral50'
FROM DS1_Staging
WHERE song_id       IS NOT NULL
  AND chart_type_id IS NOT NULL;
GO

PRINT '7i complete — ChartEntry populated';

SELECT 'ChartEntry rows inserted (DS1)' AS check_name, COUNT(*) AS row_count
FROM ChartEntry WHERE source = 'Historical_Top200_and_Viral50';
GO


-- ============================================================
-- 7j. RE-ENABLE FK CONSTRAINTS
-- ============================================================
ALTER TABLE ChartEntry CHECK CONSTRAINT FK_ChartEntry_Song;
ALTER TABLE ChartEntry CHECK CONSTRAINT FK_ChartEntry_Country;
ALTER TABLE ChartEntry CHECK CONSTRAINT FK_ChartEntry_ChartType;
GO

PRINT '7j complete — FK constraints re-enabled';


-- ============================================================
-- 7k. REBUILD CHARTENTRY INDEXES
--     Building indexes on a populated table in one pass is
--     faster than maintaining them during the INSERT.
-- ============================================================
CREATE NONCLUSTERED INDEX IX_ChartEntry_Country_Date
    ON ChartEntry (country_id, snapshot_date)
    INCLUDE (song_id, rank, chart_type_id);

CREATE NONCLUSTERED INDEX IX_ChartEntry_Song_Country
    ON ChartEntry (song_id, country_id)
    INCLUDE (snapshot_date, rank);

CREATE NONCLUSTERED INDEX IX_ChartEntry_Song_Date
    ON ChartEntry (song_id, snapshot_date)
    INCLUDE (country_id, rank);

CREATE NONCLUSTERED INDEX IX_ChartEntry_Date
    ON ChartEntry (snapshot_date)
    INCLUDE (song_id, country_id, chart_type_id);

CREATE NONCLUSTERED INDEX IX_ChartEntry_ChartType
    ON ChartEntry (chart_type_id);

CREATE NONCLUSTERED INDEX IX_ChartEntry_Source
    ON ChartEntry (source);
GO

PRINT '7k complete — ChartEntry indexes rebuilt';


-- ============================================================
-- STEP 8 — DROP STAGING TABLE
-- ============================================================
DROP TABLE IF EXISTS DS1_Staging;
GO

PRINT 'Staging table dropped';


-- ============================================================
-- STEP 9 — VALIDATION
-- ============================================================
SELECT 'Total DS1 ChartEntry rows' AS check_name, COUNT(*) AS row_count
FROM ChartEntry WHERE source = 'Historical_Top200_and_Viral50';

SELECT ct.name AS chart_type, COUNT(*) AS row_count
FROM ChartEntry ce
JOIN ChartType ct ON ct.chart_type_id = ce.chart_type_id
WHERE ce.source = 'Historical_Top200_and_Viral50'
GROUP BY ct.name;

SELECT 'NULL streams count' AS check_name, COUNT(*) AS row_count
FROM ChartEntry
WHERE source = 'Historical_Top200_and_Viral50'
  AND streams IS NULL;

SELECT MIN(snapshot_date) AS earliest_date,
       MAX(snapshot_date) AS latest_date
FROM ChartEntry WHERE source = 'Historical_Top200_and_Viral50';

SELECT trend, COUNT(*) AS row_count
FROM ChartEntry WHERE source = 'Historical_Top200_and_Viral50'
GROUP BY trend ORDER BY row_count DESC;

SELECT 'Unmatched country rows' AS check_name, COUNT(*) AS row_count
FROM ChartEntry
WHERE source = 'Historical_Top200_and_Viral50'
  AND country_id IS NULL;

PRINT 'Dataset 1 ingestion complete.';
GO
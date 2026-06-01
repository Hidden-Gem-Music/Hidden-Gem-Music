-- ============================================================
-- HiddenGemMusic — DATASET 1 INGESTION (Star Schema)
-- Source:  Kaggle Spotify Historical Charts (2017–2021)
-- Targets: DIM_Song, DIM_Artist, Bridge_SongArtist, ChartEntry
-- Author:  Leena
-- Version: Star Schema rewrite — April 2026
-- ============================================================
-- Run AFTER star_schema_ddl.sql has been executed.
-- ChartEntry already exists with all 28M rows intact.
-- This script only populates the new dimension tables.
--
-- WHAT CHANGED FROM THE ORIGINAL:
--   - Song      → DIM_Song       (same columns, audio features now included
--                                  as nullable cols — DS1 rows leave them NULL)
--   - Artist    → DIM_Artist     (same logic, new table name)
--   - ArtistSong→ Bridge_SongArtist (artist_order replaces is_primary BIT)
--   - Album     → DROPPED        (album_name is now a plain string on DIM_Song)
--   - AudioFeatures → DROPPED    (columns absorbed into DIM_Song)
--
-- WHAT IS IDENTICAL TO THE ORIGINAL:
--   - BULK INSERT settings, file path, encoding
--   - Staging table structure and column list
--   - spotify_id parse logic from URL
--   - Two-pass artist ingestion (dedup → insert → lookup)
--   - ChartEntry INSERT (song_id values are identical — no ChartEntry changes)
-- ============================================================

USE HiddenGemMusic;
GO

-- ============================================================
-- STEP 1 — STAGING TABLE
-- Identical to original. Raw CSV lands here before any
-- transformation. All columns NVARCHAR to survive dirty data.
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
-- !! UPDATE THE FILE PATH BEFORE RUNNING !!
-- Encoding: CODEPAGE 65001 = UTF-8 (handles accented characters).
-- If you still see garbled characters try 1252 instead.
-- ============================================================
BULK INSERT DS1_Staging
FROM 'C:\CapstoneData\dataset1_top200_viral50.csv'
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

-- Confirm raw row count before continuing.
SELECT 'DS1_Staging raw rows' AS check_name, COUNT(*) AS row_count
FROM DS1_Staging;
GO
-- Expected: ~26,000,000 rows
-- STOP IF THIS IS 0 OR FAR OFF — do not continue past this point.

-- ============================================================
-- STEP 3 — ADD COMPUTED COLUMNS TO STAGING
-- Parse spotify_id from URL and normalize chart/trend values.
-- Identical to original script.
-- ============================================================
ALTER TABLE DS1_Staging ADD
    spotify_id     NVARCHAR(50)  NULL,
    chart_type     NVARCHAR(50)  NULL,   -- normalized: 'Top 200' or 'Viral 50'
    trend_clean    NVARCHAR(20)  NULL,   -- normalized trend string
    trend_velocity DECIMAL(5,2)  NULL;   -- +1.0 / 0.0 / -1.0
GO

-- Parse spotify_id from the last segment of the Spotify URL
-- e.g. https://open.spotify.com/track/1bDbXMyjaUIooNwFE9wn0N → 1bDbXMyjaUIooNwFE9wn0N
UPDATE DS1_Staging
SET spotify_id = REVERSE(LEFT(REVERSE(url), CHARINDEX('/', REVERSE(url)) - 1))
WHERE url LIKE '%/track/%';
GO

-- Normalize chart type string
UPDATE DS1_Staging
SET chart_type = CASE
    WHEN LOWER(LTRIM(RTRIM(chart))) = 'top200'   THEN 'Top 200'
    WHEN LOWER(LTRIM(RTRIM(chart))) = 'viral50'  THEN 'Viral 50'
    ELSE NULL
END;
GO

-- Normalize trend string and compute trend_velocity
-- SAME_POSITION treated as SAME for consistency
UPDATE DS1_Staging
SET
    trend_clean    = CASE
        WHEN UPPER(LTRIM(RTRIM(trend))) = 'MOVE_UP'        THEN 'MOVE_UP'
        WHEN UPPER(LTRIM(RTRIM(trend))) = 'MOVE_DOWN'      THEN 'MOVE_DOWN'
        WHEN UPPER(LTRIM(RTRIM(trend))) IN ('SAME', 'SAME_POSITION') THEN 'SAME'
        WHEN UPPER(LTRIM(RTRIM(trend))) = 'NEW_ENTRY'      THEN 'NEW_ENTRY'
        ELSE NULL
    END,
    trend_velocity = CASE
        WHEN UPPER(LTRIM(RTRIM(trend))) = 'MOVE_UP'        THEN  1.0
        WHEN UPPER(LTRIM(RTRIM(trend))) = 'MOVE_DOWN'      THEN -1.0
        WHEN UPPER(LTRIM(RTRIM(trend))) IN ('SAME', 'SAME_POSITION') THEN 0.0
        WHEN UPPER(LTRIM(RTRIM(trend))) = 'NEW_ENTRY'      THEN  1.0  -- positive signal for Hidden Gem scoring
        ELSE NULL
    END;
GO

-- ============================================================
-- STEP 4 — POPULATE DIM_Song (DS1 rows)
-- One row per unique spotify_id.
-- DS1 songs get title only — all DS2-only columns are NULL.
-- ROW_NUMBER() dedup prevents duplicate spotify_id violations.
-- ============================================================
ALTER TABLE DIM_Song
    ALTER COLUMN title NVARCHAR(512);
GO

SELECT 'Distinct spotify_ids in DS1 staging' AS check_name,
       COUNT(DISTINCT spotify_id) AS cnt
FROM DS1_Staging
WHERE spotify_id IS NOT NULL;
GO

WITH DS1_Songs AS (
    SELECT
        spotify_id,
        LTRIM(RTRIM(title)) AS title,
        ROW_NUMBER() OVER (
            PARTITION BY spotify_id
            ORDER BY [date] ASC
        ) AS rn
    FROM DS1_Staging
    WHERE spotify_id IS NOT NULL
      AND LTRIM(RTRIM(title)) IS NOT NULL
)
INSERT INTO DIM_Song (spotify_id, title)
SELECT spotify_id, title
FROM DS1_Songs
WHERE rn = 1
  AND NOT EXISTS (
      SELECT 1 FROM DIM_Song s WHERE s.spotify_id = DS1_Songs.spotify_id
  );
GO

WITH NoId_Songs AS (
    SELECT
        LTRIM(RTRIM(title)) AS title,
        ROW_NUMBER() OVER (
            PARTITION BY LTRIM(RTRIM(title))
            ORDER BY [date] ASC
        ) AS rn
    FROM DS1_Staging
    WHERE (spotify_id IS NULL OR spotify_id = '')
      AND LTRIM(RTRIM(title)) IS NOT NULL
)
INSERT INTO DIM_Song (title)
SELECT title
FROM NoId_Songs
WHERE rn = 1
  AND NOT EXISTS (
      SELECT 1 FROM DIM_Song s
      WHERE s.spotify_id IS NULL
        AND s.title = NoId_Songs.title
  );
GO

SELECT 'DIM_Song after DS1 load' AS check_name, COUNT(*) AS row_count
FROM DIM_Song;
GO

-- ============================================================
-- STEP 5 — RESOLVE song_id BACK INTO STAGING
-- Pre-resolve FKs into staging so the ChartEntry INSERT
-- has no joins and runs as fast as possible.
-- ============================================================
ALTER TABLE DS1_Staging ADD
    song_id       INT NULL,
    country_id    INT NULL,
    chart_type_id INT NULL;
GO

UPDATE s
SET s.song_id = ds.song_id
FROM DS1_Staging s
JOIN DIM_Song ds ON ds.spotify_id = s.spotify_id
WHERE s.spotify_id IS NOT NULL AND s.spotify_id != '';

UPDATE s
SET s.song_id = ds.song_id
FROM DS1_Staging s
JOIN DIM_Song ds ON ds.title = LTRIM(RTRIM(s.title))
WHERE (s.spotify_id IS NULL OR s.spotify_id = '')
  AND s.song_id IS NULL;

UPDATE s
SET s.country_id = c.country_id
FROM DS1_Staging s
JOIN Country c ON c.full_name = LTRIM(RTRIM(s.region));

UPDATE s
SET s.chart_type_id = ct.chart_type_id
FROM DS1_Staging s
JOIN ChartType ct ON ct.name = s.chart_type;
GO

SELECT 'DS1 rows missing song_id'       AS issue, COUNT(*) AS cnt FROM DS1_Staging WHERE song_id IS NULL
UNION ALL
SELECT 'DS1 rows missing country_id'    AS issue, COUNT(*) AS cnt FROM DS1_Staging WHERE country_id IS NULL
UNION ALL
SELECT 'DS1 rows missing chart_type_id' AS issue, COUNT(*) AS cnt FROM DS1_Staging WHERE chart_type_id IS NULL;
GO

SELECT 
    COUNT(*) AS total_rows,
    SUM(CASE WHEN song_id IS NOT NULL THEN 1 ELSE 0 END) AS has_song_id,
    SUM(CASE WHEN country_id IS NOT NULL THEN 1 ELSE 0 END) AS has_country_id,
    SUM(CASE WHEN chart_type_id IS NOT NULL THEN 1 ELSE 0 END) AS has_chart_type_id,
    SUM(CASE WHEN song_id IS NOT NULL 
             AND country_id IS NOT NULL 
             AND chart_type_id IS NOT NULL THEN 1 ELSE 0 END) AS all_three_resolved
FROM DS1_Staging;
GO

-- ============================================================
-- STEP 6 — TWO-PASS ARTIST INGESTION
-- Pass 1: collect all unique artist names → DIM_Artist
-- Pass 2: resolve artist_id → Bridge_SongArtist
--
-- DS1 artist field is a single artist string (no comma packing
-- in DS1 — packing only occurs in DS2). Still deduplicated
-- and trimmed for consistency.
-- ============================================================

-- Pass 1: insert unique artist names into DIM_Artist
INSERT INTO DIM_Artist (artist_name)
SELECT DISTINCT LTRIM(RTRIM(artist))
FROM DS1_Staging
WHERE artist IS NOT NULL
  AND LTRIM(RTRIM(artist)) != ''
  AND NOT EXISTS (
      SELECT 1 FROM DIM_Artist a
      WHERE a.artist_name = LTRIM(RTRIM(DS1_Staging.artist))
  );
GO

SELECT 'DIM_Artist after DS1 load' AS check_name, COUNT(*) AS row_count
FROM DIM_Artist;
GO

-- Pass 2: insert Bridge_SongArtist rows
-- artist_order = 1 for all DS1 rows (single artist per song in DS1)
INSERT INTO Bridge_SongArtist (song_id, artist_id, artist_order)
SELECT DISTINCT
    s.song_id,
    a.artist_id,
    1 AS artist_order
FROM DS1_Staging stg
JOIN DIM_Song   s ON s.song_id   = stg.song_id
JOIN DIM_Artist a ON a.artist_name = LTRIM(RTRIM(stg.artist))
WHERE stg.song_id IS NOT NULL
  AND stg.artist  IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM Bridge_SongArtist b
      WHERE b.song_id   = s.song_id
        AND b.artist_id = a.artist_id
  );
GO

SELECT 'Bridge_SongArtist after DS1 load' AS check_name, COUNT(*) AS row_count
FROM Bridge_SongArtist;
GO

-- ============================================================
-- STEP 7 — INSERT INTO ChartEntry
-- Identical to original — song_id values are unchanged.
-- Viral 50 rows: streams = NULL, trend populated.
-- Top 200 rows:  streams populated where not empty.
-- ============================================================
INSERT INTO ChartEntry (
    song_id,
    country_id,
    chart_type_id,
    snapshot_date,
    rank,
    streams,
    trend,
    trend_velocity,
    source
)
SELECT
    song_id,
    country_id,
    chart_type_id,
    CAST([date] AS DATE),
    CAST(rank AS SMALLINT),
    CASE
        WHEN LTRIM(RTRIM(streams)) = '' OR streams IS NULL THEN NULL
        ELSE TRY_CAST(streams AS BIGINT)
    END,
    trend_clean,
    trend_velocity,
    'Spotify_Historical_Charts'
FROM DS1_Staging
WHERE song_id       IS NOT NULL
  AND country_id    IS NOT NULL
  AND chart_type_id IS NOT NULL
  AND TRY_CAST([date] AS DATE) IS NOT NULL
  AND TRY_CAST(rank AS SMALLINT) IS NOT NULL;
GO

-- ============================================================
-- STEP 8 — CLEANUP + VALIDATION
-- ============================================================
DROP TABLE IF EXISTS DS1_Staging;
GO

SELECT 'DIM_Song'              AS tbl, COUNT(*) AS rows FROM DIM_Song
UNION ALL
SELECT 'DIM_Artist'            AS tbl, COUNT(*) AS rows FROM DIM_Artist
UNION ALL
SELECT 'Bridge_SongArtist'     AS tbl, COUNT(*) AS rows FROM Bridge_SongArtist
UNION ALL
SELECT 'ChartEntry DS1'        AS tbl, COUNT(*) AS rows FROM ChartEntry
    WHERE source = 'Spotify_Historical_Charts';
GO

SELECT MIN(snapshot_date) AS earliest, MAX(snapshot_date) AS latest
FROM ChartEntry
WHERE source = 'Spotify_Historical_Charts';
GO

PRINT 'Dataset 1 ingestion complete.';
GO

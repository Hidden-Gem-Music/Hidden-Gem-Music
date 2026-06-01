-- ============================================================
-- HiddenGemMusic — DATASET 2 INGESTION (Star Schema)
-- Source:  Kaggle Top Spotify Songs in 73 Countries (2023–2025)
-- Targets: DIM_Song, DIM_Artist, Bridge_SongArtist, ChartEntry
-- Author:  Leena
-- Version: Star Schema rewrite — April 2026
-- ============================================================
-- Run AFTER DS1_Ingestion_StarSchema.sql completes successfully.
-- DS1 will have already populated DIM_Song, DIM_Artist, and
-- Bridge_SongArtist. This script merges DS2 data in on top.
--
-- WHAT CHANGED FROM THE ORIGINAL:
--   - Album INSERT removed — album_name/album_release_date now go
--     directly onto DIM_Song as plain string columns
--   - Song INSERT updated to include all audio feature columns
--     and album columns directly (no separate AudioFeatures table)
--   - Album name column widened to NVARCHAR(512) in DIM_Song DDL
--     to prevent the truncation error that hit the original script
--   - ArtistSong → Bridge_SongArtist (artist_order replaces is_primary)
--
-- WHAT IS IDENTICAL TO THE ORIGINAL:
--   - BULK INSERT settings and file path placeholder
--   - Staging table structure and all column names
--   - is_explicit 'True'/'False' string → BIT conversion
--   - artist string split on ', ' with recursive CTE
--   - Two-pass artist ingestion (dedup → insert → lookup)
--   - Global row handling (empty string country → country_id = NULL)
--   - TRY_CAST on all numeric columns for scientific notation safety
--   - ChartEntry INSERT logic and source tag
-- ============================================================

USE HiddenGemMusic;
GO

-- ============================================================
-- STEP 1 — STAGING TABLE
-- All columns NVARCHAR. Identical structure to original.
-- ============================================================
DROP TABLE IF EXISTS DS2_Staging;
GO

CREATE TABLE DS2_Staging (
    spotify_id         NVARCHAR(50)   NULL,
    [name]             NVARCHAR(500)  NULL,
    artists            NVARCHAR(MAX) NULL,   -- comma-packed multi-artist string
    daily_rank         NVARCHAR(10)   NULL,
    daily_movement     NVARCHAR(10)   NULL,
    weekly_movement    NVARCHAR(10)   NULL,
    country            NVARCHAR(10)   NULL,   -- ISO code or empty string for Global
    snapshot_date      NVARCHAR(20)   NULL,
    popularity         NVARCHAR(10)   NULL,
    is_explicit        NVARCHAR(10)   NULL,   -- 'True' / 'False' as strings
    duration_ms        NVARCHAR(15)   NULL,
    album_name         NVARCHAR(512)  NULL,   -- widened from 255 to prevent truncation
    album_release_date NVARCHAR(20)   NULL,
    danceability       NVARCHAR(20)   NULL,
    energy             NVARCHAR(20)   NULL,
    [key]              NVARCHAR(5)    NULL,
    loudness           NVARCHAR(20)   NULL,
    mode               NVARCHAR(5)    NULL,
    speechiness        NVARCHAR(20)   NULL,
    acousticness       NVARCHAR(20)   NULL,
    instrumentalness   NVARCHAR(20)   NULL,
    liveness           NVARCHAR(20)   NULL,
    valence            NVARCHAR(20)   NULL,
    tempo              NVARCHAR(20)   NULL,
    time_signature     NVARCHAR(5)    NULL
);
GO

-- ============================================================
-- STEP 2 — BULK INSERT
-- !! UPDATE THE FILE PATH BEFORE RUNNING !!
-- All fields quoted in DS2 — FORMAT CSV handles this correctly.
-- ============================================================
BULK INSERT DS2_Staging
FROM 'C:\CapstoneData\dataset2_top_songs_73_countries.csv'
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

SELECT 'DS2_Staging rows loaded' AS check_name, COUNT(*) AS row_count
FROM DS2_Staging;
GO
-- Expected: ~2,100,000 rows
-- STOP IF THIS IS 0 OR FAR OFF.

-- ============================================================
-- STEP 3 — POPULATE DIM_Song (DS2 rows)
-- Two sub-steps:
--   3a: UPDATE existing DS1 songs — enrich with DS2 audio features
--       and album data where the spotify_id already exists
--   3b: INSERT new DS2-only songs not seen in DS1
--
-- Audio features go directly onto DIM_Song (no separate table).
-- album_name is a plain string — no FK, no surrogate key.
-- TRY_CAST on all numeric columns handles scientific notation.
-- ============================================================
ALTER TABLE DIM_Song
    ALTER COLUMN album_name NVARCHAR(MAX);
GO

-- 3a: Enrich existing DS1 songs with DS2 data
-- Only updates NULL columns — does not overwrite DS1 data
WITH DS2_Deduped AS (
    SELECT
        spotify_id,
        [name]             AS title,
        TRY_CAST(duration_ms AS INT)         AS duration_ms,
        CASE WHEN LOWER(LTRIM(RTRIM(is_explicit))) = 'true' THEN 1 ELSE 0 END AS is_explicit,
        LTRIM(RTRIM(album_name))             AS album_name,
        TRY_CAST(
            CASE
                WHEN album_release_date LIKE '____'         -- YYYY only
                THEN album_release_date + '-01-01'
                WHEN album_release_date LIKE '____-__'      -- YYYY-MM only
                THEN album_release_date + '-01'
                ELSE album_release_date
            END
        AS DATE)                             AS album_release_date,
        TRY_CAST(danceability    AS FLOAT)   AS danceability,
        TRY_CAST(energy          AS FLOAT)   AS energy,
        TRY_CAST([key]           AS TINYINT) AS [key],
        TRY_CAST(loudness        AS FLOAT)   AS loudness,
        TRY_CAST(mode            AS TINYINT) AS mode,
        TRY_CAST(speechiness     AS FLOAT)   AS speechiness,
        TRY_CAST(acousticness    AS FLOAT)   AS acousticness,
        TRY_CAST(instrumentalness AS FLOAT)  AS instrumentalness,
        TRY_CAST(liveness        AS FLOAT)   AS liveness,
        TRY_CAST(valence         AS FLOAT)   AS valence,
        TRY_CAST(tempo           AS FLOAT)   AS tempo,
        TRY_CAST(time_signature  AS TINYINT) AS time_signature,
        ROW_NUMBER() OVER (
            PARTITION BY spotify_id
            ORDER BY snapshot_date DESC      -- most recent row wins for enrichment
        ) AS rn
    FROM DS2_Staging
    WHERE spotify_id IS NOT NULL
      AND LTRIM(RTRIM(spotify_id)) != ''
)
UPDATE ds
SET
    ds.duration_ms        = COALESCE(ds.duration_ms,        d.duration_ms),
    ds.is_explicit        = COALESCE(ds.is_explicit,        d.is_explicit),
    ds.album_name         = COALESCE(ds.album_name,         d.album_name),
    ds.album_release_date = COALESCE(ds.album_release_date, d.album_release_date),
    ds.danceability       = COALESCE(ds.danceability,       d.danceability),
    ds.energy             = COALESCE(ds.energy,             d.energy),
    ds.[key]              = COALESCE(ds.[key],              d.[key]),
    ds.loudness           = COALESCE(ds.loudness,           d.loudness),
    ds.mode               = COALESCE(ds.mode,               d.mode),
    ds.speechiness        = COALESCE(ds.speechiness,        d.speechiness),
    ds.acousticness       = COALESCE(ds.acousticness,       d.acousticness),
    ds.instrumentalness   = COALESCE(ds.instrumentalness,   d.instrumentalness),
    ds.liveness           = COALESCE(ds.liveness,           d.liveness),
    ds.valence            = COALESCE(ds.valence,            d.valence),
    ds.tempo              = COALESCE(ds.tempo,              d.tempo),
    ds.time_signature     = COALESCE(ds.time_signature,     d.time_signature)
FROM DIM_Song ds
JOIN DS2_Deduped d ON d.spotify_id = ds.spotify_id
WHERE d.rn = 1;
GO

SELECT 'DIM_Song rows enriched from DS2' AS check_name, @@ROWCOUNT AS rows_updated;
GO

-- 3b: Insert new DS2-only songs
WITH DS2_NewSongs AS (
    SELECT
        spotify_id,
        LTRIM(RTRIM([name]))                 AS title,
        TRY_CAST(duration_ms AS INT)         AS duration_ms,
        CASE WHEN LOWER(LTRIM(RTRIM(is_explicit))) = 'true' THEN 1 ELSE 0 END AS is_explicit,
        LTRIM(RTRIM(album_name))             AS album_name,
        TRY_CAST(
            CASE
                WHEN album_release_date LIKE '____'
                THEN album_release_date + '-01-01'
                WHEN album_release_date LIKE '____-__'
                THEN album_release_date + '-01'
                ELSE album_release_date
            END
        AS DATE)                             AS album_release_date,
        TRY_CAST(danceability    AS FLOAT)   AS danceability,
        TRY_CAST(energy          AS FLOAT)   AS energy,
        TRY_CAST([key]           AS TINYINT) AS [key],
        TRY_CAST(loudness        AS FLOAT)   AS loudness,
        TRY_CAST(mode            AS TINYINT) AS mode,
        TRY_CAST(speechiness     AS FLOAT)   AS speechiness,
        TRY_CAST(acousticness    AS FLOAT)   AS acousticness,
        TRY_CAST(instrumentalness AS FLOAT)  AS instrumentalness,
        TRY_CAST(liveness        AS FLOAT)   AS liveness,
        TRY_CAST(valence         AS FLOAT)   AS valence,
        TRY_CAST(tempo           AS FLOAT)   AS tempo,
        TRY_CAST(time_signature  AS TINYINT) AS time_signature,
        ROW_NUMBER() OVER (
            PARTITION BY spotify_id
            ORDER BY snapshot_date DESC
        ) AS rn
    FROM DS2_Staging
    WHERE spotify_id IS NOT NULL
      AND LTRIM(RTRIM(spotify_id)) != ''
)
INSERT INTO DIM_Song (
    spotify_id, title, duration_ms, is_explicit,
    album_name, album_release_date,
    danceability, energy, [key], loudness, mode,
    speechiness, acousticness, instrumentalness,
    liveness, valence, tempo, time_signature
)
SELECT
    spotify_id, title, duration_ms, is_explicit,
    album_name, album_release_date,
    danceability, energy, [key], loudness, mode,
    speechiness, acousticness, instrumentalness,
    liveness, valence, tempo, time_signature
FROM DS2_NewSongs
WHERE rn = 1
  AND NOT EXISTS (
      SELECT 1 FROM DIM_Song s WHERE s.spotify_id = DS2_NewSongs.spotify_id
  );
GO

SELECT 'DIM_Song total after DS2 load' AS check_name, COUNT(*) AS row_count
FROM DIM_Song;
GO

-- ============================================================
-- STEP 4 — RESOLVE FKs INTO STAGING
-- Pre-resolve song_id, country_id, chart_type_id into staging
-- so the ChartEntry INSERT has no joins.
-- ============================================================
ALTER TABLE DS2_Staging ADD
    song_id       INT NULL,
    country_id    INT NULL,
    chart_type_id INT NULL;
GO

-- song_id: DS2 always has spotify_id natively
UPDATE s
SET s.song_id = ds.song_id
FROM DS2_Staging s
JOIN DIM_Song ds ON ds.spotify_id = LTRIM(RTRIM(s.spotify_id))
WHERE s.spotify_id IS NOT NULL
  AND LTRIM(RTRIM(s.spotify_id)) != '';

-- country_id: DS2 uses ISO codes. Empty string = Global Top 50 → country_id stays NULL
UPDATE s
SET s.country_id = c.country_id
FROM DS2_Staging s
JOIN Country c ON c.iso_code = LTRIM(RTRIM(s.country))
WHERE LTRIM(RTRIM(s.country)) != ''
  AND s.country IS NOT NULL;

-- chart_type_id: DS2 is always Top 50
UPDATE DS2_Staging
SET chart_type_id = (SELECT chart_type_id FROM ChartType WHERE name = 'Top 50');
GO

-- Sanity check
SELECT 'DS2 rows missing song_id'       AS issue, COUNT(*) AS cnt FROM DS2_Staging WHERE song_id IS NULL
UNION ALL
SELECT 'DS2 rows missing chart_type_id' AS issue, COUNT(*) AS cnt FROM DS2_Staging WHERE chart_type_id IS NULL;
GO
-- country_id NULL is expected for Global rows — do not flag those.
-- STOP IF song_id or chart_type_id counts are unexpectedly high.

-- ============================================================
-- STEP 5 — TWO-PASS ARTIST INGESTION (DS2)
-- DS2 artists column is a comma-packed string: "Lady Gaga, Bruno Mars"
-- Split on ', ' using recursive CTE → one row per artist name.
-- artist_order tracks position in the original string (1 = first listed).
-- ============================================================

-- Explode packed artist strings into one row per artist
DROP TABLE IF EXISTS #DS2_ArtistExploded;
GO

WITH ArtistSplit AS (
    -- Anchor: first artist in each packed string
    SELECT
        song_id,
        LTRIM(RTRIM(
            CASE
                WHEN CHARINDEX(', ', artists) > 0
                THEN LEFT(artists, CHARINDEX(', ', artists) - 1)
                ELSE artists
            END
        )) AS artist_name,
        CASE
            WHEN CHARINDEX(', ', artists) > 0
            THEN SUBSTRING(artists, CHARINDEX(', ', artists) + 2, LEN(artists))
            ELSE NULL
        END AS remaining,
        1 AS artist_order
    FROM DS2_Staging
    WHERE song_id IS NOT NULL
      AND artists IS NOT NULL
      AND LTRIM(RTRIM(artists)) != ''

    UNION ALL

    -- Recursive: each subsequent artist
    SELECT
        song_id,
        LTRIM(RTRIM(
            CASE
                WHEN CHARINDEX(', ', remaining) > 0
                THEN LEFT(remaining, CHARINDEX(', ', remaining) - 1)
                ELSE remaining
            END
        )) AS artist_name,
        CASE
            WHEN CHARINDEX(', ', remaining) > 0
            THEN SUBSTRING(remaining, CHARINDEX(', ', remaining) + 2, LEN(remaining))
            ELSE NULL
        END AS remaining,
        artist_order + 1
    FROM ArtistSplit
    WHERE remaining IS NOT NULL
)
SELECT DISTINCT
    song_id,
    artist_name,
    MIN(artist_order) OVER (PARTITION BY song_id, artist_name) AS artist_order
INTO #DS2_ArtistExploded
FROM ArtistSplit
WHERE artist_name IS NOT NULL
  AND artist_name != '';
GO

-- Pass 1: insert new unique artist names into DIM_Artist
INSERT INTO DIM_Artist (artist_name)
SELECT DISTINCT artist_name
FROM #DS2_ArtistExploded
WHERE NOT EXISTS (
    SELECT 1 FROM DIM_Artist a WHERE a.artist_name = [#DS2_ArtistExploded].artist_name
);
GO

SELECT 'DIM_Artist total after DS2 load' AS check_name, COUNT(*) AS row_count
FROM DIM_Artist;
GO

-- Pass 2: insert Bridge_SongArtist rows
INSERT INTO Bridge_SongArtist (song_id, artist_id, artist_order)
SELECT
    e.song_id,
    a.artist_id,
    e.artist_order
FROM #DS2_ArtistExploded e
JOIN DIM_Artist a ON a.artist_name = e.artist_name
WHERE NOT EXISTS (
    SELECT 1 FROM Bridge_SongArtist b
    WHERE b.song_id   = e.song_id
      AND b.artist_id = a.artist_id
);
GO

SELECT 'Bridge_SongArtist total after DS2 load' AS check_name, COUNT(*) AS row_count
FROM Bridge_SongArtist;
GO

DROP TABLE IF EXISTS #DS2_ArtistExploded;
GO

-- ============================================================
-- STEP 6 — INSERT INTO ChartEntry
-- Identical logic to original DS2 script.
-- popularity, daily_movement, weekly_movement DS2-only columns.
-- trend and streams stay NULL for all DS2 rows.
-- ============================================================
INSERT INTO ChartEntry (
    song_id,
    country_id,
    chart_type_id,
    snapshot_date,
    rank,
    popularity,
    daily_movement,
    weekly_movement,
    trend_velocity,
    source
)
SELECT
    song_id,
    country_id,
    chart_type_id,
    CAST(snapshot_date AS DATE),
    CAST(daily_rank AS SMALLINT),
    TRY_CAST(popularity      AS TINYINT),
    TRY_CAST(daily_movement  AS SMALLINT),
    TRY_CAST(weekly_movement AS SMALLINT),
    CASE
        WHEN TRY_CAST(daily_movement AS INT) > 0 THEN  1.0
        WHEN TRY_CAST(daily_movement AS INT) < 0 THEN -1.0
        ELSE 0.0
    END,
    'Top50_73_Countries'
FROM DS2_Staging
WHERE song_id       IS NOT NULL
  AND chart_type_id IS NOT NULL
  AND TRY_CAST(snapshot_date AS DATE) IS NOT NULL
  AND TRY_CAST(daily_rank    AS SMALLINT) IS NOT NULL;
GO

-- ============================================================
-- STEP 7 — CLEANUP + FINAL VALIDATION
-- ============================================================
DROP TABLE IF EXISTS DS2_Staging;
GO

-- Full counts across all affected tables
SELECT 'DIM_Song'                  AS tbl, COUNT(*) AS rows FROM DIM_Song
UNION ALL
SELECT 'DIM_Artist'                AS tbl, COUNT(*) AS rows FROM DIM_Artist
UNION ALL
SELECT 'Bridge_SongArtist'         AS tbl, COUNT(*) AS rows FROM Bridge_SongArtist
UNION ALL
SELECT 'ChartEntry DS1'            AS tbl, COUNT(*) AS rows FROM ChartEntry WHERE source = 'Spotify_Historical_Charts'
UNION ALL
SELECT 'ChartEntry DS2'            AS tbl, COUNT(*) AS rows FROM ChartEntry WHERE source = 'Top50_73_Countries'
UNION ALL
SELECT 'ChartEntry TOTAL'          AS tbl, COUNT(*) AS rows FROM ChartEntry;
GO

-- Date range check
SELECT
    source,
    MIN(snapshot_date) AS earliest,
    MAX(snapshot_date) AS latest
FROM ChartEntry
GROUP BY source;
GO

-- Audio features coverage — should be close to DS2 song count
SELECT
    'Songs with audio features' AS check_name,
    COUNT(*) AS cnt
FROM DIM_Song
WHERE danceability IS NOT NULL;
GO

PRINT 'Dataset 2 ingestion complete. Star schema population done.';
GO

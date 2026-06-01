-- ============================================================
-- HIDDEN GEM MUSIC — DATASET 2 INGESTION SCRIPT
-- Source:  Kaggle Top Spotify Songs in 73 Countries (2023-2025)
-- File:    dataset2_top_songs_73_countries.csv
-- Author:  Leena
-- Date:    April 2026
-- ============================================================
-- Run AFTER DS1_Ingestion.sql has completed successfully.
-- DS2 is smaller (2.1M rows) and should load much faster.
-- ============================================================

USE HiddenGemMusic;
GO


-- ============================================================
-- STEP 1 — CREATE STAGING TABLE
-- ============================================================
DROP TABLE IF EXISTS DS2_Staging;
GO

CREATE TABLE DS2_Staging (
    spotify_id         NVARCHAR(100) NULL,
    name               NVARCHAR(512) NULL,
    artists            NVARCHAR(MAX) NULL,
    daily_rank         NVARCHAR(10)  NULL,
    daily_movement     NVARCHAR(20)  NULL,
    weekly_movement    NVARCHAR(20)  NULL,
    country            NVARCHAR(10)  NULL,
    snapshot_date      NVARCHAR(20)  NULL,
    popularity         NVARCHAR(10)  NULL,
    is_explicit        NVARCHAR(10)  NULL,
    duration_ms        NVARCHAR(20)  NULL,
    album_name         NVARCHAR(512) NULL,
    album_release_date NVARCHAR(20)  NULL,
    danceability       NVARCHAR(20)  NULL,
    energy             NVARCHAR(20)  NULL,
    [key]              NVARCHAR(10)  NULL,
    loudness           NVARCHAR(20)  NULL,
    mode               NVARCHAR(10)  NULL,
    speechiness        NVARCHAR(20)  NULL,
    acousticness       NVARCHAR(20)  NULL,
    instrumentalness   NVARCHAR(20)  NULL,
    liveness           NVARCHAR(20)  NULL,
    valence            NVARCHAR(20)  NULL,
    tempo              NVARCHAR(20)  NULL,
    time_signature     NVARCHAR(10)  NULL
);
GO


-- ============================================================
-- STEP 2 — BULK INSERT
--   FORMAT = 'CSV' handles all fields quoted with double
--   quotes (DS2 quotes every field), embedded commas in
--   artist strings, and Unix line endings correctly.
-- ============================================================
BULK INSERT DS2_Staging
FROM 'C:\Users\lkome\OneDrive\School\Capstone Data\raw data- old\dataset2_top_songs_73_countries.csv'
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

-- ============================================================
-- STOP — check row count. Expected: ~2,110,316
-- ============================================================


-- ============================================================
-- STEP 3 — REMOVE DUPLICATES
--   Composite key: spotify_id + country + snapshot_date
-- ============================================================
;WITH Deduped AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY spotify_id, country, snapshot_date
               ORDER BY (SELECT NULL)
           ) AS rn
    FROM DS2_Staging
)
DELETE FROM Deduped WHERE rn > 1;
GO

SELECT 'DS2_Staging rows after dedup' AS check_name, COUNT(*) AS row_count
FROM DS2_Staging;
GO


-- ============================================================
-- STEP 4 — POPULATE Album
--   DS2 is the only dataset with album data natively.
-- ============================================================
-- STEP 4 — Album (fixed)
INSERT INTO Album (name, release_date)
SELECT DISTINCT
    CAST(album_name AS NVARCHAR(512)),
    CASE
        WHEN album_release_date IS NULL
          OR LTRIM(RTRIM(album_release_date)) = ''
        THEN NULL
        WHEN album_release_date LIKE '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
        THEN CAST(album_release_date AS DATE)
        WHEN album_release_date LIKE '[0-9][0-9][0-9][0-9]'
        THEN CAST(album_release_date + '-01-01' AS DATE)
        ELSE NULL
    END
FROM DS2_Staging
WHERE album_name IS NOT NULL
  AND LTRIM(RTRIM(album_name)) != ''
  AND NOT EXISTS (
      SELECT 1 FROM Album a
      WHERE a.name = CAST(DS2_Staging.album_name AS NVARCHAR(512))
  );
GO

SELECT 'Album rows inserted' AS check_name, COUNT(*) AS row_count FROM Album;
GO



-- ============================================================
-- STEP 5 — POPULATE Song
--   5a: UPDATE existing DS1 songs with DS2 enrichment data
--   5b: INSERT new DS2-only songs
-- ============================================================

-- 5a — Enrich existing DS1 songs that match by spotify_id
UPDATE sg
SET
    sg.duration_ms = CAST(s.duration_ms AS INT),
    sg.is_explicit = CASE WHEN UPPER(s.is_explicit) = 'TRUE' THEN 1 ELSE 0 END,
    sg.album_id    = al.album_id
FROM Song sg
JOIN DS2_Staging s ON s.spotify_id = sg.spotify_id
LEFT JOIN Album al  ON al.name = CAST(s.album_name AS NVARCHAR(512))
WHERE sg.spotify_id IS NOT NULL
  AND s.spotify_id  IS NOT NULL
  AND s.spotify_id  != '';
GO

SELECT 'DS1 songs enriched' AS check_name, @@ROWCOUNT AS rows_updated;
GO

-- 5b — Insert new songs only in DS2
INSERT INTO Song (spotify_id, title, duration_ms, is_explicit, album_id)
SELECT
    spotify_id,
    name,
    CAST(duration_ms AS INT),
    CASE WHEN UPPER(is_explicit) = 'TRUE' THEN 1 ELSE 0 END,
    album_id
FROM (
    SELECT
        s.spotify_id,
        s.name,
        s.duration_ms,
        s.is_explicit,
        al.album_id,
        ROW_NUMBER() OVER (
            PARTITION BY s.spotify_id
            ORDER BY (SELECT NULL)
        ) AS rn
    FROM DS2_Staging s
    LEFT JOIN Album al ON al.name = CAST(s.album_name AS NVARCHAR(512))
    WHERE s.spotify_id IS NOT NULL
      AND s.spotify_id != ''
      AND NOT EXISTS (
          SELECT 1 FROM Song sg
          WHERE sg.spotify_id = s.spotify_id
      )
) AS Deduped
WHERE rn = 1;
GO

SELECT 'Song rows total after DS2' AS check_name, COUNT(*) AS row_count FROM Song;
GO


-- ============================================================
-- STEP 6 — POPULATE Artist AND ArtistSong
--   DS2 artists are comma-separated in one field.
--   STRING_SPLIT on ',' then LTRIM to clean spaces.
--   Position 1 = primary artist, 2+ = featured.
-- ============================================================
;WITH ArtistSplit AS (
    SELECT
        s.spotify_id,
        LTRIM(RTRIM(value))                       AS artist_name,
        ROW_NUMBER() OVER (
            PARTITION BY s.spotify_id, LTRIM(RTRIM(value))
            ORDER BY (SELECT NULL)
        ) AS rn_artist,
        ROW_NUMBER() OVER (
            PARTITION BY s.spotify_id
            ORDER BY (SELECT NULL)
        ) AS artist_position
    FROM DS2_Staging s
    CROSS APPLY STRING_SPLIT(s.artists, ',')
    WHERE s.spotify_id IS NOT NULL
      AND s.spotify_id != ''
      AND s.artists    IS NOT NULL
      AND s.artists    != ''
      AND LTRIM(RTRIM(value)) != ''
)
INSERT INTO ArtistSong (artist_id, song_id, is_primary)
SELECT DISTINCT
    a.artist_id,
    sg.song_id,
    CASE WHEN sp.artist_position = 1 THEN 1 ELSE 0 END
FROM ArtistSplit sp
JOIN Artist a  ON a.name        = sp.artist_name
JOIN Song   sg ON sg.spotify_id = sp.spotify_id
WHERE sp.rn_artist = 1
  AND NOT EXISTS (
      SELECT 1 FROM ArtistSong asg
      WHERE asg.artist_id = a.artist_id
        AND asg.song_id   = sg.song_id
  );
GO

SELECT 'ArtistSong total' AS check_name, COUNT(*) AS row_count FROM ArtistSong;
GO


-- ============================================================
-- STEP 7 — POPULATE AudioFeatures
--   DS2 only. TRY_CAST handles scientific notation values
--   like 6.59e-06 correctly when casting to FLOAT.
-- ============================================================
INSERT INTO AudioFeatures (
    song_id, danceability, energy, [key], loudness, mode,
    speechiness, acousticness, instrumentalness, liveness,
    valence, tempo, time_signature
)
SELECT
    song_id,
    TRY_CAST(danceability     AS FLOAT),
    TRY_CAST(energy           AS FLOAT),
    TRY_CAST([key]            AS TINYINT),
    TRY_CAST(loudness         AS FLOAT),
    TRY_CAST(mode             AS TINYINT),
    TRY_CAST(speechiness      AS FLOAT),
    TRY_CAST(acousticness     AS FLOAT),
    TRY_CAST(instrumentalness AS FLOAT),
    TRY_CAST(liveness         AS FLOAT),
    TRY_CAST(valence          AS FLOAT),
    TRY_CAST(tempo            AS FLOAT),
    TRY_CAST(time_signature   AS TINYINT)
FROM (
    SELECT
        sg.song_id,
        s.danceability, s.energy, s.[key], s.loudness, s.mode,
        s.speechiness, s.acousticness, s.instrumentalness,
        s.liveness, s.valence, s.tempo, s.time_signature,
        ROW_NUMBER() OVER (
            PARTITION BY sg.song_id
            ORDER BY (SELECT NULL)
        ) AS rn
    FROM DS2_Staging s
    JOIN Song sg ON sg.spotify_id = s.spotify_id
    WHERE NOT EXISTS (
        SELECT 1 FROM AudioFeatures af
        WHERE af.song_id = sg.song_id
    )
) AS Deduped
WHERE rn = 1;
GO

SELECT 'AudioFeatures rows inserted' AS check_name, COUNT(*) AS row_count
FROM AudioFeatures;
GO


-- ============================================================
-- STEP 8 — POPULATE ChartEntry
--   Uses same pre-resolution strategy as DS1 for performance.
-- ============================================================

-- Add FK columns to staging
ALTER TABLE DS2_Staging ADD
    song_id       INT NULL,
    country_id    INT NULL,
    chart_type_id INT NULL;
GO

-- Resolve song_id
UPDATE s
SET s.song_id = sg.song_id
FROM DS2_Staging s
JOIN Song sg ON sg.spotify_id = s.spotify_id
WHERE s.spotify_id IS NOT NULL AND s.spotify_id != '';
GO

PRINT 'song_id resolved';

-- Resolve country_id
-- Empty country = Global ('--' row)
UPDATE s
SET s.country_id = c.country_id
FROM DS2_Staging s
JOIN Country c ON c.iso_code = LTRIM(RTRIM(s.country))
WHERE LTRIM(RTRIM(s.country)) != '';
GO

UPDATE s
SET s.country_id = c.country_id
FROM DS2_Staging s
JOIN Country c ON c.iso_code = '--'
WHERE s.country_id IS NULL
  AND LTRIM(RTRIM(ISNULL(s.country, ''))) = '';
GO

PRINT 'country_id resolved';

-- Resolve chart_type_id — DS2 is always Top 50
UPDATE DS2_Staging
SET chart_type_id = (SELECT chart_type_id FROM ChartType WHERE name = 'Top 50');
GO

PRINT 'chart_type_id resolved';

-- Pre-insert sanity check
SELECT
    COUNT(*) AS total_rows,
    SUM(CASE WHEN song_id       IS NULL THEN 1 ELSE 0 END) AS missing_song_id,
    SUM(CASE WHEN country_id    IS NULL THEN 1 ELSE 0 END) AS missing_country_id,
    SUM(CASE WHEN chart_type_id IS NULL THEN 1 ELSE 0 END) AS missing_chart_type_id
FROM DS2_Staging;
GO

-- ============================================================
-- STOP — check sanity numbers before continuing.
-- All three missing counts should be 0 or very close to 0.
-- ============================================================

-- INSERT into ChartEntry
INSERT INTO ChartEntry (
    song_id, country_id, chart_type_id, snapshot_date,
    rank, popularity, daily_movement, weekly_movement,
    trend_velocity, source
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
  AND chart_type_id IS NOT NULL;
GO

SELECT 'ChartEntry rows inserted (DS2)' AS check_name, COUNT(*) AS row_count
FROM ChartEntry WHERE source = 'Top50_73_Countries';
GO


-- ============================================================
-- STEP 9 — DROP STAGING TABLE
-- ============================================================
DROP TABLE IF EXISTS DS2_Staging;
GO


-- ============================================================
-- STEP 10 — VALIDATION
-- ============================================================
SELECT 'Total DS2 ChartEntry rows' AS check_name, COUNT(*) AS row_count
FROM ChartEntry WHERE source = 'Top50_73_Countries';

SELECT MIN(snapshot_date) AS earliest_date, MAX(snapshot_date) AS latest_date
FROM ChartEntry WHERE source = 'Top50_73_Countries';

SELECT 'Global rows' AS check_name, COUNT(*) AS row_count
FROM ChartEntry ce
JOIN Country c ON c.country_id = ce.country_id
WHERE ce.source = 'Top50_73_Countries' AND c.iso_code = '--';

SELECT 'NULL trend_velocity' AS check_name, COUNT(*) AS row_count
FROM ChartEntry
WHERE source = 'Top50_73_Countries' AND trend_velocity IS NULL;

SELECT source, COUNT(*) AS row_count
FROM ChartEntry
GROUP BY source;

PRINT 'Dataset 2 ingestion complete.';
GO

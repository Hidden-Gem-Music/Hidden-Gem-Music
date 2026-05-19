-- ============================================================
-- HiddenGemMusic — Star Schema DDL
-- Replaces: Song, Artist, ArtistSong, AudioFeatures, Album
-- Unchanged: Country, ChartType, ChartEntry, all indexes,
--            all pre-computed summary tables
-- ============================================================

USE HiddenGemMusic;
GO

-- ============================================================
-- STEP 1 — DROP OLD TABLES (in FK-safe order)
-- ============================================================
-- Run this block only when you are ready to rebuild from scratch.
-- These drops are safe because ChartEntry.song_id will be
-- re-pointed to DIM_Song which keeps the same song_id values.

IF OBJECT_ID('AudioFeatures',     'U') IS NOT NULL DROP TABLE AudioFeatures;
IF OBJECT_ID('ArtistSong',        'U') IS NOT NULL DROP TABLE ArtistSong;
IF OBJECT_ID('Artist',            'U') IS NOT NULL DROP TABLE Artist;
IF OBJECT_ID('Song',              'U') IS NOT NULL DROP TABLE Song;
IF OBJECT_ID('Album',             'U') IS NOT NULL DROP TABLE Album;
GO

-- ============================================================
-- STEP 2 — DIM_Artist
-- One row per unique artist name.
-- artist_id is the stable PK used by Bridge_SongArtist.
-- ============================================================
CREATE TABLE DIM_Artist (
    artist_id   INT           NOT NULL IDENTITY(1,1),
    artist_name NVARCHAR(255) NOT NULL,

    CONSTRAINT PK_DIM_Artist        PRIMARY KEY (artist_id),
    CONSTRAINT UQ_DIM_Artist_Name   UNIQUE      (artist_name)
);
GO

-- ============================================================
-- STEP 3 — DIM_Song
-- One row per unique track regardless of how many chart entries.
-- spotify_id is the cross-dataset deduplication key.
-- All DS2-only columns are nullable — DS1 songs leave them NULL.
-- Audio features stay nullable even for DS2 rows where the
-- Spotify API returned incomplete data.
-- Album is flattened to plain string columns — no surrogate key,
-- no separate Album table. Album art is pulled from Spotify API
-- at display time using spotify_id.
-- ============================================================
CREATE TABLE DIM_Song (
    song_id            INT           NOT NULL IDENTITY(1,1),
    spotify_id         NVARCHAR(50)  NULL,

    -- Core track info
    title              NVARCHAR(255) NOT NULL,
    duration_ms        INT           NULL,       -- DS2 only
    is_explicit        BIT           NULL,       -- DS2 only

    -- Album (flattened — DS2 only)
    album_name         NVARCHAR(255) NULL,       -- DS2 only
    album_release_date DATE          NULL,       -- DS2 only

    -- Audio features (DS2 only — all nullable)
    danceability       FLOAT         NULL,       -- 0.0–1.0
    energy             FLOAT         NULL,       -- 0.0–1.0
    [key]              TINYINT       NULL,       -- 0=C, 1=C#/Db … 11=B, -1=none
    loudness           FLOAT         NULL,       -- dB, typical range -60 to 0
    mode               TINYINT       NULL,       -- 1=major, 0=minor
    speechiness        FLOAT         NULL,       -- 0.0–1.0
    acousticness       FLOAT         NULL,       -- 0.0–1.0
    instrumentalness   FLOAT         NULL,       -- >0.5 = likely instrumental
    liveness           FLOAT         NULL,       -- >0.8 = strong live signal
    valence            FLOAT         NULL,       -- 0.0–1.0, high=happy
    tempo              FLOAT         NULL,       -- BPM
    time_signature     TINYINT       NULL,       -- beats per bar, range 3–7

    CONSTRAINT PK_DIM_Song         PRIMARY KEY (song_id),
    CONSTRAINT UQ_DIM_Song_Spotify UNIQUE      (spotify_id)
);
GO

-- ============================================================
-- STEP 4 — Bridge_SongArtist
-- Resolves many-to-many between DIM_Song and DIM_Artist.
-- artist_order: 1 = first-listed (primary), 2+ = featured.
-- Uses artist_order instead of is_primary BIT — more honest
-- about what the source data actually tells us (string position),
-- without asserting primary/featured status the data doesn't
-- explicitly encode.
-- ============================================================
CREATE TABLE Bridge_SongArtist (
    song_id      INT     NOT NULL,
    artist_id    INT     NOT NULL,
    artist_order TINYINT NOT NULL DEFAULT 1,  -- 1 = first listed

    CONSTRAINT PK_Bridge_SongArtist
        PRIMARY KEY (song_id, artist_id),
    CONSTRAINT FK_Bridge_Song
        FOREIGN KEY (song_id)   REFERENCES DIM_Song   (song_id),
    CONSTRAINT FK_Bridge_Artist
        FOREIGN KEY (artist_id) REFERENCES DIM_Artist (artist_id)
);
GO

-- ============================================================
-- STEP 5 — Update ChartEntry FK to reference DIM_Song
-- ChartEntry itself is unchanged — only the FK target name
-- changes from Song to DIM_Song. song_id values are identical.
-- ============================================================

-- Drop existing FK
ALTER TABLE ChartEntry
    DROP CONSTRAINT FK_ChartEntry_Song;  -- use your actual constraint name
GO

-- Re-add pointing at DIM_Song
ALTER TABLE ChartEntry
    ADD CONSTRAINT FK_ChartEntry_DIM_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
GO

-- ============================================================
-- STEP 6 — Indexes on new tables
-- ChartEntry indexes are unchanged — do not re-run those.
-- ============================================================

-- Bridge table — both directions for join performance
CREATE INDEX IX_Bridge_song_id
    ON Bridge_SongArtist (song_id);

CREATE INDEX IX_Bridge_artist_id
    ON Bridge_SongArtist (artist_id);

-- DIM_Song — spotify_id lookups during ingestion merge
CREATE INDEX IX_DIM_Song_spotify_id
    ON DIM_Song (spotify_id);

-- DIM_Artist — name lookups during ingestion (two-pass artist insert)
CREATE INDEX IX_DIM_Artist_name
    ON DIM_Artist (artist_name);
GO

-- ============================================================
-- VERIFICATION QUERIES
-- Run after ingestion to confirm row counts look right.
-- ============================================================

SELECT 'DIM_Song'          AS tbl, COUNT(*) AS rows FROM DIM_Song
UNION ALL
SELECT 'DIM_Artist'        AS tbl, COUNT(*) AS rows FROM DIM_Artist
UNION ALL
SELECT 'Bridge_SongArtist' AS tbl, COUNT(*) AS rows FROM Bridge_SongArtist
UNION ALL
SELECT 'ChartEntry'        AS tbl, COUNT(*) AS rows FROM ChartEntry;
GO

-- Expected rough targets after full ingestion:
--   DIM_Song          ~240,000 rows  (all unique tracks)
--   DIM_Artist        ~150,000 rows  (unique artist names)
--   Bridge_SongArtist ~300,000 rows  (song × artist pairings, >1 per multi-artist song)
--   ChartEntry        ~28,000,000 rows  (unchanged)

-- ============================================================
-- FINAL STEP — Add FKs from summary tables to DIM_Song
-- Adds FK constraints from all summary tables that reference song_id
-- ============================================================
USE HiddenGemMusic;
GO

ALTER TABLE PeakReachBySong
    ADD CONSTRAINT FK_PeakReachBySong_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
ALTER TABLE TrendVelocityBySong
    ADD CONSTRAINT FK_TrendVelocity_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
ALTER TABLE HiddenGems
    ADD CONSTRAINT FK_HiddenGems_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
ALTER TABLE SongCountryPresence
    ADD CONSTRAINT FK_SongCountryPresence_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
ALTER TABLE DiscoveryGapByDay
    ADD CONSTRAINT FK_DiscoveryGap_Song
        FOREIGN KEY (song_id) REFERENCES DIM_Song (song_id);
GO
-- ============================================================
-- HIDDEN GEM MUSIC — DATABASE CREATION SCRIPT
-- Project: Hidden Gem Music Capstone | SOFT290
-- Author:  Leena Komenski
-- Date:    April 18, 2026
-- ============================================================
-- Run this entire script once to build the full database from
-- scratch. Order matters — FK dependencies are respected.
-- ============================================================


-- ============================================================
-- 0.  CREATE DATABASE
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'HiddenGemMusic')
BEGIN
    ALTER DATABASE HiddenGemMusic SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE HiddenGemMusic;
END
GO

CREATE DATABASE HiddenGemMusic;
GO

USE HiddenGemMusic;
GO


-- ============================================================
-- 1.  LOOKUP TABLES
-- ============================================================

-- ------------------------------------------------------------
-- 1a. Country
--     Bridges Dataset 1 full country names <-> Dataset 2
--     ISO codes. Populated via BULK INSERT from the
--     instructor-provided CountryDataset.csv (245 rows),
--     then enriched with region values and a manual Global row.
--     region is NULL after BULK INSERT — assigned in Section 2d.
-- ------------------------------------------------------------
CREATE TABLE Country (
    country_id  INT           NOT NULL IDENTITY(1,1),
    full_name   NVARCHAR(100) NOT NULL,
    iso_code    CHAR(2)       NOT NULL,
    region      NVARCHAR(50)  NULL,     -- populated via UPDATE in Section 2d
    latitude    FLOAT         NULL,
    longitude   FLOAT         NULL,

    CONSTRAINT PK_Country      PRIMARY KEY (country_id),
    CONSTRAINT UQ_Country_Name UNIQUE      (full_name),
    CONSTRAINT UQ_Country_ISO  UNIQUE      (iso_code)
);
GO

-- ------------------------------------------------------------
-- 1b. ChartType
--     Three chart types across both datasets:
--     Top 200 (DS1), Viral 50 (DS1), Top 50 (DS2)
-- ------------------------------------------------------------
CREATE TABLE ChartType (
    chart_type_id INT          NOT NULL IDENTITY(1,1),
    name          NVARCHAR(50) NOT NULL,
    rank_start    SMALLINT     NOT NULL,   -- always 1
    rank_end      SMALLINT     NOT NULL,   -- 50 or 200

    CONSTRAINT PK_ChartType      PRIMARY KEY (chart_type_id),
    CONSTRAINT UQ_ChartType_Name UNIQUE      (name)
);
GO

-- ------------------------------------------------------------
-- 1c. Language
--     Lookup table for song language. Populated incrementally
--     during external API enrichment (stretch goal). Not
--     required for any MVP feature — song.language_id is
--     nullable and will be NULL until enrichment runs.
--
--     language_code uses ISO 639-1 (e.g. 'en', 'es', 'pt').
--     This matches what the Spotify API returns, making the
--     enrichment script lookup clean and collision-free.
--
--     Language is a property of the track, not the album —
--     an album can contain songs in multiple languages, so
--     putting this on Album would be incorrect. One language
--     per song is sufficient for project scope. If many-to-
--     many is ever needed, this lookup table structure
--     supports migration to a SongLanguage join table without
--     a schema redesign.
-- ------------------------------------------------------------
CREATE TABLE Language (
    language_id   INT           NOT NULL IDENTITY(1,1),
    language_name NVARCHAR(100) NOT NULL,   -- e.g. 'Spanish', 'English'
    language_code NVARCHAR(10)  NOT NULL,   -- ISO 639-1 e.g. 'es', 'en'

    CONSTRAINT PK_Language      PRIMARY KEY (language_id),
    CONSTRAINT UQ_Language_Name UNIQUE      (language_name),
    CONSTRAINT UQ_Language_Code UNIQUE      (language_code)
);
GO


-- ============================================================
-- 2.  STATIC DATA — LOOKUP TABLE POPULATION
-- ============================================================

-- ------------------------------------------------------------
-- 2a. ChartType rows (3 rows — fixed, never changes)
-- ------------------------------------------------------------
INSERT INTO ChartType (name, rank_start, rank_end) VALUES
    ('Top 200',  1, 200),
    ('Viral 50', 1,  50),
    ('Top 50',   1,  50);
GO

-- ------------------------------------------------------------
-- 2b. Country — BULK INSERT from CountryDataset.csv
--
--     The instructor-provided CSV has columns:
--       CountryID, Country (ISO code), Latitude, Longitude, Name (full name)
--
--     We stage it first because the CSV column order does not
--     match the Country table directly, and lat/long are NULL
--     for one row (U.S. Minor Outlying Islands — UM).
-- ------------------------------------------------------------
CREATE TABLE Country_Staging (
    src_id    INT           NULL,
    iso_code  CHAR(2)       NOT NULL,
    latitude  FLOAT         NULL,
    longitude FLOAT         NULL,
    full_name NVARCHAR(100) NOT NULL
);
GO

BULK INSERT Country_Staging
FROM 'C:\Users\lkome\OneDrive\School\Capstone Data\CountryDataset.csv'    
WITH (
    FIRSTROW        = 2,                -- skip header row
    FIELDTERMINATOR = ',',
    ROWTERMINATOR   = '\n',
    TABLOCK
);
GO

INSERT INTO Country (full_name, iso_code, latitude, longitude)
SELECT full_name, iso_code, latitude, longitude
FROM Country_Staging
ORDER BY src_id;
GO

DROP TABLE Country_Staging;
GO

-- ------------------------------------------------------------
-- 2c. Add the Global virtual row
--     Represents NULL country entries in both datasets —
--     the Global Top 50 playlist in DS2, and any unassigned
--     region value in DS1. Not in the CSV — inserted manually.
-- ------------------------------------------------------------
INSERT INTO Country (full_name, iso_code, region, latitude, longitude)
VALUES ('Global', '--', 'Global', 0.0, 0.0);
GO

-- ------------------------------------------------------------
-- 2d. Assign region to all 245 country rows
--     Based on standard geographic groupings aligned with
--     how Spotify chart data is typically regionalised.
--     Run after BULK INSERT — region is NULL until this runs.
--
--     After running, verify zero unassigned rows with:
--       SELECT iso_code, full_name FROM Country
--       WHERE region IS NULL AND iso_code != 'GL';
-- ------------------------------------------------------------
UPDATE Country SET region = 'Europe' WHERE iso_code IN (
    'AD','AL','AT','BA','BE','BG','BY','CH','CY','CZ','DE','DK','EE',
    'ES','FI','FO','FR','GB','GE','GG','GI','GR','HR','HU','IE','IM',
    'IS','IT','JE','LI','LT','LU','LV','MC','MD','ME','MK','MT','NL',
    'NO','PL','PT','RO','RS','RU','SE','SI','SJ','SK','SM','TR','UA',
    'VA','XK'
);
GO
UPDATE Country SET region = 'Latin America' WHERE iso_code IN (
    'AG','AI','AN','AR','AW','BB','BM','BO','BR','BS','BZ','CO','CR',
    'CU','DM','DO','EC','GD','GF','GP','GT','GY','HN','HT','JM','KN',
    'KY','LC','MQ','MS','MX','NI','PA','PE','PR','PY','SR','SV','TC',
    'TT','UY','VC','VE','VG','VI'
);
GO
UPDATE Country SET region = 'North America' WHERE iso_code IN (
    'CA','PM','UM','US'
);
GO
UPDATE Country SET region = 'Asia' WHERE iso_code IN (
    'AF','BD','BN','BT','CN','HK','ID','IN','JP','KH','KP','KR','LA',
    'LK','MM','MN','MO','MV','MY','NP','PH','PK','SG','TH','TL','TW','VN'
);
GO
UPDATE Country SET region = 'Central Asia' WHERE iso_code IN (
    'AM','AZ','KG','KZ','TJ','TM','UZ'
);
GO
UPDATE Country SET region = 'Middle East' WHERE iso_code IN (
    'AE','BH','DZ','EG','GZ','IL','IQ','IR','JO','KW','LB','LY','MA',
    'OM','PS','QA','SA','SY','TN','YE'
);
GO
UPDATE Country SET region = 'Africa' WHERE iso_code IN (
    'AO','BI','BJ','BF','BW','CD','CF','CG','CI','CM','CV','DJ','EH',
    'ER','ET','GA','GH','GM','GN','GQ','GW','KE','KM','LR','LS','MG',
    'ML','MR','MU','MW','MZ','NA','NE','NG','RE','RW','SC','SD','SH',
    'SL','SN','SO','ST','SZ','TD','TG','TZ','UG','YT','ZA','ZM','ZW'
);
GO
UPDATE Country SET region = 'Oceania' WHERE iso_code IN (
    'AS','AU','CC','CK','CX','FJ','FM','GU','KI','MH','MP','NC','NF',
    'NR','NU','NZ','PF','PG','PN','PW','SB','TK','TO','TV','VU','WF','WS'
);
GO
UPDATE Country SET region = 'Other' WHERE iso_code IN (
    'AQ','BV','FK','GS','HM','IO','TF'
);
GO


-- ============================================================
-- 3.  CORE ENTITY TABLES
-- ============================================================

-- ------------------------------------------------------------
-- 3a. Artist
-- ------------------------------------------------------------
CREATE TABLE Artist (
    artist_id INT           NOT NULL IDENTITY(1,1),
    name      NVARCHAR(255) NOT NULL,

    CONSTRAINT PK_Artist      PRIMARY KEY (artist_id),
    CONSTRAINT UQ_Artist_Name UNIQUE      (name)
);
GO

-- ------------------------------------------------------------
-- 3b. Album
--     Dataset 1 has no album data — album_id on Song is
--     nullable for all DS1 rows. DS2 provides album_name and
--     album_release_date natively.
--
--     album_spotify_id is added for external API enrichment.
--     When the Spotify API returns album data for a DS1 song,
--     the enrichment script checks this column first to avoid
--     creating duplicate Album rows — the same deduplication
--     pattern used by spotify_id on Song.
-- ------------------------------------------------------------
CREATE TABLE Album (
    album_id         INT           NOT NULL IDENTITY(1,1),
    name             NVARCHAR(255) NOT NULL,
    release_date     DATE          NULL,
    album_spotify_id NVARCHAR(50)  NULL,   -- for API enrichment deduplication

    CONSTRAINT PK_Album           PRIMARY KEY (album_id),
    CONSTRAINT UQ_Album_SpotifyID UNIQUE      (album_spotify_id)
);
GO

-- ------------------------------------------------------------
-- 3c. Song
--     One row per unique track. spotify_id is the cross-
--     dataset matching key — parsed from URL in DS1, native
--     in DS2.
--
--     language_id is a nullable FK to the Language lookup
--     table. NULL for all rows until external API enrichment
--     runs. Language is a property of the track itself, not
--     the album — see Language table comment in Section 1c.
-- ------------------------------------------------------------
CREATE TABLE Song (
    song_id     INT           NOT NULL IDENTITY(1,1),
    spotify_id  NVARCHAR(50)  NULL,       -- NULL where DS1 URL parse fails
    title       NVARCHAR(255) NOT NULL,
    duration_ms INT           NULL,       -- DS2 only
    is_explicit BIT           NULL,       -- DS2 only
    album_id    INT           NULL,       -- DS2 native; DS1 via API enrichment
    language_id INT           NULL,       -- populated via API enrichment (stretch goal)

    CONSTRAINT PK_Song          PRIMARY KEY (song_id),
    CONSTRAINT UQ_Song_Spotify  UNIQUE      (spotify_id),
    CONSTRAINT FK_Song_Album    FOREIGN KEY (album_id)
        REFERENCES Album    (album_id),
    CONSTRAINT FK_Song_Language FOREIGN KEY (language_id)
        REFERENCES Language (language_id)
);
GO

-- ------------------------------------------------------------
-- 3d. ArtistSong  (many-to-many join table)
--     is_primary distinguishes the lead artist from featured
--     artists. Used by the Vinyl card component to display
--     'Drake ft. 21 Savage' vs '21 Savage ft. Drake'.
-- ------------------------------------------------------------
CREATE TABLE ArtistSong (
    artist_song_id INT NOT NULL IDENTITY(1,1),
    artist_id      INT NOT NULL,
    song_id        INT NOT NULL,
    is_primary     BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_ArtistSong        PRIMARY KEY (artist_song_id),
    CONSTRAINT FK_ArtistSong_Artist FOREIGN KEY (artist_id)
        REFERENCES Artist (artist_id),
    CONSTRAINT FK_ArtistSong_Song   FOREIGN KEY (song_id)
        REFERENCES Song   (song_id),
    CONSTRAINT UQ_ArtistSong        UNIQUE      (artist_id, song_id)
);
GO

-- ------------------------------------------------------------
-- 3e. AudioFeatures
--     DS2 only. Separated from Song to signal clearly that
--     audio features are reach-goal data not required for
--     any MVP feature. UNIQUE on song_id enforces the strict
--     one-to-one relationship.
-- ------------------------------------------------------------
CREATE TABLE AudioFeatures (
    audio_features_id INT     NOT NULL IDENTITY(1,1),
    song_id           INT     NOT NULL,
    danceability      FLOAT   NULL,   -- 0.0-1.0
    energy            FLOAT   NULL,   -- 0.0-1.0
    [key]             TINYINT NULL,   -- pitch class 0=C...11=B; -1=none detected
    loudness          FLOAT   NULL,   -- dB, typically -60 to 0
    mode              TINYINT NULL,   -- 1=major, 0=minor
    speechiness       FLOAT   NULL,   -- 0.0-1.0
    acousticness      FLOAT   NULL,   -- 0.0-1.0
    instrumentalness  FLOAT   NULL,   -- 0.0-1.0; >0.5 = likely instrumental
    liveness          FLOAT   NULL,   -- 0.0-1.0; >0.8 = likely live recording
    valence           FLOAT   NULL,   -- 0.0-1.0; high=happy, low=sad
    tempo             FLOAT   NULL,   -- BPM
    time_signature    TINYINT NULL,   -- typically 3 or 4

    CONSTRAINT PK_AudioFeatures      PRIMARY KEY (audio_features_id),
    CONSTRAINT UQ_AudioFeatures_Song UNIQUE      (song_id),
    CONSTRAINT FK_AudioFeatures_Song FOREIGN KEY (song_id)
        REFERENCES Song (song_id)
);
GO


-- ============================================================
-- 4.  CHART ENTRY — CORE FACT TABLE
--     ~13-16 million rows combined across both datasets.
--     All heavy computation runs in stored procedures.
--     The API layer never receives raw ChartEntry rows —
--     only pre-aggregated results from the summary tables
--     in Section 5.
--
-- MOVEMENT TRACKING — CONSISTENCY ACROSS BOTH DATASETS
-- -------------------------------------------------------
-- The two datasets measure chart movement differently:
--
--   DS1: categorical trend string stored in the 'trend'
--        column. Values: MOVE_UP, MOVE_DOWN, SAME, NEW_ENTRY.
--        No numeric delta is available in this dataset.
--
--   DS2: numeric integer deltas stored in daily_movement
--        and weekly_movement. More precise than DS1.
--
-- To enable cross-dataset movement analysis, a third column
-- — trend_velocity — normalises both into a shared DECIMAL
-- scale, populated at ingestion time:
--
--   DS1 MOVE_UP    -> trend_velocity = +1.0
--   DS1 MOVE_DOWN  -> trend_velocity = -1.0
--   DS1 SAME_POSITION -> trend_velocity =  0.0
--   DS1 NEW_ENTRY  -> trend_velocity = +1.0
--       (positive signal — a song's first chart appearance
--        is the strongest early indicator for Hidden Gem
--        scoring and should not be treated as zero movement)
--
--   DS2             -> trend_velocity = daily_movement cast
--                      to DECIMAL, normalised to the same
--                      +1/0/-1 scale using SIGN() or a CASE.
--
-- This means:
--   trend           — raw DS1 string only. NULL for DS2.
--   daily_movement  — raw DS2 integer only. NULL for DS1.
--   weekly_movement — raw DS2 integer only. NULL for DS1.
--   trend_velocity  — normalised value present for ALL rows
--                     regardless of source dataset.
--
-- Stored procedures that need movement data use
-- trend_velocity exclusively. The raw columns are retained
-- for source fidelity and debugging.
-- ============================================================
CREATE TABLE ChartEntry (
    chart_entry_id  INT          NOT NULL IDENTITY(1,1),
    song_id         INT          NOT NULL,
    country_id      INT          NULL,       -- NULL = Global Top 50 (DS2 only)
    chart_type_id   INT          NOT NULL,
    snapshot_date   DATE         NOT NULL,
    rank            SMALLINT     NOT NULL,
    streams         BIGINT       NULL,       -- DS1 Top 200 only; NULL for DS2
    popularity      TINYINT      NULL,       -- DS2 only; Spotify score 0-100
    daily_movement  SMALLINT     NULL,       -- DS2 only; raw integer delta
    weekly_movement SMALLINT     NULL,       -- DS2 only; raw integer delta
    trend           NVARCHAR(20) NULL,       -- DS1 only: MOVE_UP/MOVE_DOWN/SAME_POSITION/NEW_ENTRY
    trend_velocity  DECIMAL(5,2) NULL,       -- normalised for BOTH datasets; see note above
    source          NVARCHAR(50) NOT NULL,   -- 'Historical_Top200_and_Viral50' | 'Top50_73_Countries'

    CONSTRAINT PK_ChartEntry           PRIMARY KEY (chart_entry_id),
    CONSTRAINT FK_ChartEntry_Song      FOREIGN KEY (song_id)
        REFERENCES Song      (song_id),
    CONSTRAINT FK_ChartEntry_Country   FOREIGN KEY (country_id)
        REFERENCES Country   (country_id),
    CONSTRAINT FK_ChartEntry_ChartType FOREIGN KEY (chart_type_id)
        REFERENCES ChartType (chart_type_id)
);
GO

-- ============================================================
-- CHARTENTRY INDEXES
--
-- At 13-16 million rows, every stored procedure's performance
-- depends entirely on whether SQL Server can satisfy its WHERE
-- and JOIN conditions using an index rather than scanning the
-- full table. Each index below targets one or more specific
-- query patterns used by the population stored procedures.
-- The INCLUDE columns cover the SELECT list so SQL Server
-- can satisfy the entire query from the index alone without
-- a second lookup into the clustered index (key lookups at
-- this scale are expensive enough to negate the index benefit).
-- ============================================================

-- (country_id, snapshot_date)
-- The most frequently used composite key across the entire
-- application. Every country-scoped query filters by both
-- country and a date range — country profiles, hidden gem
-- population, isolation scores, and discovery gap all begin
-- here. Leading with country_id means this index is also
-- used for country-only filters, covering all queries where
-- date range is optional.
CREATE NONCLUSTERED INDEX IX_ChartEntry_Country_Date
    ON ChartEntry (country_id, snapshot_date)
    INCLUDE (song_id, rank, chart_type_id);
GO

-- (song_id, country_id)
-- Required for cross-country song presence queries — the
-- foundation of Hidden Gem logic and overlap calculations.
-- "Which countries does this song chart in?" and "Does this
-- song appear in country X?" both land here. Without this
-- index, answering either question requires a full table scan
-- across millions of rows for every song evaluated.
CREATE NONCLUSTERED INDEX IX_ChartEntry_Song_Country
    ON ChartEntry (song_id, country_id)
    INCLUDE (snapshot_date, rank);
GO

-- (song_id, snapshot_date)
-- Powers geographic spread calculations — specifically
-- sp_PopulateDiscoveryGapByDay, which needs MIN(snapshot_date)
-- per country per song to determine when a song first appeared
-- in each market. Without this index, that MIN() requires
-- reading every ChartEntry row for every song, repeated
-- across every song in the dataset.
CREATE NONCLUSTERED INDEX IX_ChartEntry_Song_Date
    ON ChartEntry (song_id, snapshot_date)
    INCLUDE (country_id, rank);
GO

-- (snapshot_date)
-- A standalone date index for sp_PopulateGlobalOverlapByYear,
-- which filters by date range across the full table without
-- also filtering by song or country. The composite indexes
-- above all have song_id or country_id as their leading
-- column, which makes them ineligible for a date-range-only
-- filter. This index fills that gap specifically for the
-- global-level trend aggregation queries.
CREATE NONCLUSTERED INDEX IX_ChartEntry_Date
    ON ChartEntry (snapshot_date)
    INCLUDE (song_id, country_id, chart_type_id);
GO

-- (chart_type_id)
-- Enables fast filtering by chart type — Top 200, Viral 50,
-- or Top 50. The Viral 50 is the strongest early signal for
-- cross-regional discovery and will be filtered frequently
-- in Hidden Gem and trend queries. A single-column index here
-- is appropriate because chart_type_id is always used as a
-- secondary filter alongside other conditions, not as the
-- primary filter — so it doesn't need INCLUDE columns.
CREATE NONCLUSTERED INDEX IX_ChartEntry_ChartType
    ON ChartEntry (chart_type_id);
GO

-- (source)
-- Allows fast isolation of rows by source dataset. Primarily
-- useful during ingestion validation and stored procedure
-- development — verifying row counts, checking behaviour
-- against each dataset independently, and debugging any
-- cases where DS1 and DS2 behave differently before running
-- against the full combined table.
CREATE NONCLUSTERED INDEX IX_ChartEntry_Source
    ON ChartEntry (source);
GO


-- ============================================================
-- 5.  PRE-COMPUTED SUMMARY TABLES  (empty shells)
--     Population stored procedures fill these after ingestion.
--     The API never reads from ChartEntry directly at runtime
--     — it reads only from these pre-computed tables.
-- ============================================================

-- ------------------------------------------------------------
-- 5a. HiddenGems
--     For every country + year: songs that chart in N+ other
--     countries but are absent from this country's charts.
--     Most expensive derivation — run once at population time,
--     fast indexed read at request time.
-- ------------------------------------------------------------
CREATE TABLE HiddenGems (
    hidden_gem_id      INT           NOT NULL IDENTITY(1,1),
    country_id         INT           NOT NULL,
    song_id            INT           NOT NULL,
    chart_year         INT           NOT NULL,
    countries_charting INT           NOT NULL,
    trend_score        DECIMAL(10,4) NULL,

    CONSTRAINT PK_HiddenGems         PRIMARY KEY (hidden_gem_id),
    CONSTRAINT FK_HiddenGems_Country FOREIGN KEY (country_id)
        REFERENCES Country (country_id),
    CONSTRAINT FK_HiddenGems_Song    FOREIGN KEY (song_id)
        REFERENCES Song    (song_id),
    CONSTRAINT UQ_HiddenGems_Key     UNIQUE (country_id, song_id, chart_year)
);
GO

CREATE NONCLUSTERED INDEX IX_HiddenGems_Country_Year
    ON HiddenGems (country_id, chart_year)
    INCLUDE (song_id, countries_charting, trend_score);
GO

-- ------------------------------------------------------------
-- 5b. CountryYearStats
--     One row per country per year.
--     Feeds KPI displays on country profile, comparison page,
--     and dashboard.
-- ------------------------------------------------------------
CREATE TABLE CountryYearStats (
    country_year_stat_id INT          NOT NULL IDENTITY(1,1),
    country_id           INT          NOT NULL,
    chart_year           INT          NOT NULL,
    total_charted        INT          NOT NULL,
    shared_count         INT          NOT NULL,
    unique_count         INT          NOT NULL,
    overlap_pct          DECIMAL(6,2) NOT NULL,

    CONSTRAINT PK_CountryYearStats         PRIMARY KEY (country_year_stat_id),
    CONSTRAINT FK_CountryYearStats_Country FOREIGN KEY (country_id)
        REFERENCES Country (country_id),
    CONSTRAINT UQ_CountryYearStats_Key     UNIQUE (country_id, chart_year)
);
GO

-- ------------------------------------------------------------
-- 5c. SongCountryPresence
--     For each song + year: how many distinct countries it
--     charted in. Foundation of Hidden Gems logic and the
--     minimum country count filter on the globe screen.
-- ------------------------------------------------------------
CREATE TABLE SongCountryPresence (
    presence_id   INT NOT NULL IDENTITY(1,1),
    song_id       INT NOT NULL,
    chart_year    INT NOT NULL,
    country_count INT NOT NULL,

    CONSTRAINT PK_SongCountryPresence      PRIMARY KEY (presence_id),
    CONSTRAINT FK_SongCountryPresence_Song FOREIGN KEY (song_id)
        REFERENCES Song (song_id),
    CONSTRAINT UQ_SongCountryPresence_Key  UNIQUE (song_id, chart_year)
);
GO

-- ------------------------------------------------------------
-- 5d. GlobalOverlapByYear
--     Year-by-year global overlap percentage.
--     is_gap flags the 22-month data gap (Dec 2021-Oct 2023)
--     so Recharts can render the dashed line segment and
--     ReferenceArea on the dashboard trend chart.
--     overlap_pct and avg_countries are NULL for gap periods.
-- ------------------------------------------------------------
CREATE TABLE GlobalOverlapByYear (
    overlap_year_id    INT          NOT NULL IDENTITY(1,1),
    period_label       NVARCHAR(10) NOT NULL,
    period_year        INT          NOT NULL,
    period_month       INT          NULL,
    overlap_pct        DECIMAL(6,2) NULL,
    total_unique_songs INT          NULL,
    songs_in_2plus     INT          NULL,
    avg_countries      DECIMAL(4,2) NULL,
    is_gap             BIT          NOT NULL DEFAULT 0,

    CONSTRAINT PK_GlobalOverlapByYear PRIMARY KEY (overlap_year_id),
    CONSTRAINT UQ_GlobalOverlapByYear UNIQUE (period_year, period_month)
);
GO

-- ------------------------------------------------------------
-- 5e. DiscoveryGapByDay
--     For each song: origin country, spread country, and days
--     between first chart appearances. Feeds KPI 2 and the
--     Discovery Gap Distribution histogram. Bucketing into
--     bands is done at population time — never in JavaScript.
-- ------------------------------------------------------------
CREATE TABLE DiscoveryGapByDay (
    discovery_gap_id  INT          NOT NULL IDENTITY(1,1),
    song_id           INT          NOT NULL,
    origin_country_id INT          NOT NULL,
    spread_country_id INT          NOT NULL,
    days_to_spread    INT          NOT NULL,
    bucket_label      NVARCHAR(10) NOT NULL,
    bucket_order      TINYINT      NOT NULL,

    CONSTRAINT PK_DiscoveryGapByDay          PRIMARY KEY (discovery_gap_id),
    CONSTRAINT FK_DiscoveryGap_Song          FOREIGN KEY (song_id)
        REFERENCES Song    (song_id),
    CONSTRAINT FK_DiscoveryGap_OriginCountry FOREIGN KEY (origin_country_id)
        REFERENCES Country (country_id),
    CONSTRAINT FK_DiscoveryGap_SpreadCountry FOREIGN KEY (spread_country_id)
        REFERENCES Country (country_id)
);
GO

CREATE NONCLUSTERED INDEX IX_DiscoveryGap_Song
    ON DiscoveryGapByDay (song_id);
GO

CREATE NONCLUSTERED INDEX IX_DiscoveryGap_Bucket
    ON DiscoveryGapByDay (bucket_order)
    INCLUDE (bucket_label, song_id);
GO

-- ------------------------------------------------------------
-- 5f. IsolationScoreByCountry
--     Per country per year: what percentage of that country's
--     charting songs appear nowhere else. Feeds KPI 3 and the
--     Regional Isolation Scores bar chart. Countries with
--     fewer than 100 ChartEntry rows are excluded at
--     population time to avoid misleadingly high scores from
--     countries with very thin data coverage.
-- ------------------------------------------------------------
CREATE TABLE IsolationScoreByCountry (
    isolation_id    INT          NOT NULL IDENTITY(1,1),
    country_id      INT          NOT NULL,
    chart_year      INT          NOT NULL,
    local_songs     INT          NOT NULL,
    shared_songs    INT          NOT NULL,
    isolation_score DECIMAL(6,2) NOT NULL,
    isolation_tier  NVARCHAR(10) NOT NULL,
    total_entries   INT          NOT NULL,

    CONSTRAINT PK_IsolationScore         PRIMARY KEY (isolation_id),
    CONSTRAINT FK_IsolationScore_Country FOREIGN KEY (country_id)
        REFERENCES Country (country_id),
    CONSTRAINT UQ_IsolationScore_Key     UNIQUE (country_id, chart_year)
);
GO

-- ------------------------------------------------------------
-- 5g. PeakReachBySong
--     For each song: the max number of countries it charted
--     in simultaneously, and the date it peaked. One row per
--     song — enforced by UNIQUE on song_id. Feeds KPI 4 and
--     the Vinyl card display on the dashboard.
-- ------------------------------------------------------------
CREATE TABLE PeakReachBySong (
    peak_reach_id INT  NOT NULL IDENTITY(1,1),
    song_id       INT  NOT NULL,
    peak_date     DATE NOT NULL,
    country_count INT  NOT NULL,

    CONSTRAINT PK_PeakReachBySong      PRIMARY KEY (peak_reach_id),
    CONSTRAINT FK_PeakReachBySong_Song FOREIGN KEY (song_id)
        REFERENCES Song (song_id),
    CONSTRAINT UQ_PeakReachBySong_Song UNIQUE (song_id)
);
GO

CREATE NONCLUSTERED INDEX IX_PeakReach_CountryCount
    ON PeakReachBySong (country_count DESC)
    INCLUDE (song_id, peak_date);
GO

-- ------------------------------------------------------------
-- 5h. TrendVelocityBySong
--     Pre-computed normalised trend velocity per song per
--     country per year. Derived from trend_velocity on
--     ChartEntry (already normalised at ingestion for both
--     datasets) as a rolling average over a defined window.
--     Never derived live from ChartEntry at request time.
-- ------------------------------------------------------------
CREATE TABLE TrendVelocityBySong (
    velocity_id    INT           NOT NULL IDENTITY(1,1),
    song_id        INT           NOT NULL,
    country_id     INT           NOT NULL,
    chart_year     INT           NOT NULL,
    trend_velocity DECIMAL(10,4) NOT NULL,

    CONSTRAINT PK_TrendVelocity         PRIMARY KEY (velocity_id),
    CONSTRAINT FK_TrendVelocity_Song    FOREIGN KEY (song_id)
        REFERENCES Song    (song_id),
    CONSTRAINT FK_TrendVelocity_Country FOREIGN KEY (country_id)
        REFERENCES Country (country_id),
    CONSTRAINT UQ_TrendVelocity_Key     UNIQUE (song_id, country_id, chart_year)
);
GO


-- ============================================================
-- END OF SCRIPT
-- ============================================================
-- Next steps after running this script:
--   1.  BULK INSERT Dataset 1 (Historical_Top200_and_Viral50)
--   2.  BULK INSERT Dataset 2 (Top50_73_Countries)
--   3.  Run EDA queries to validate country coverage, NULL
--       rates, date ranges, and spotify_id parse success rate
--   4.  Run population stored procedures in order:
--         sp_PopulateSongCountryPresence
--         sp_PopulateCountryYearStats
--         sp_PopulateTrendVelocityBySong
--         sp_PopulateGlobalOverlapByYear
--         sp_PopulateDiscoveryGapByDay
--         sp_PopulateIsolationScoreByCountry
--         sp_PopulatePeakReachBySong
--         sp_PopulateHiddenGems  (run last - depends on all above)
-- ============================================================
PRINT 'Hidden Gem Music database created successfully.';
GO

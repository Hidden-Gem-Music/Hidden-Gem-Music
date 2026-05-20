-- =============================================
-- Author:      Leena Komenski
-- Create date: 05/13/2026
-- Updated:     05/15/2026 — Refactored inline subquery to named CTE (RankedSongs)
--                           for readability. Added song_id to INSERT for traceability.
--                           Confirmed table name as ChartEntry (star schema).
--                           Added sanity-check result set (rows per year) at end.
--              05/19/2026 — Bug fix (issue #148): DS1 CSV has no album names so
--                           DIM_Song.album_name is NULL for all DS1 songs. The hover
--                           card guard (hasSongData) was requiring a non-null album_name,
--                           suppressing the display for all DS1 years.
--                           Added song_name (DIM_Song.title) so the hover card can show
--                           "Most popular song: X by Y" using data that IS in the CSV.
--                           DS2 album_name is populated from its CSV and will appear as
--                           a secondary line on the hover card automatically.
--                           Added artist_name IS NOT NULL as secondary tie-break in
--                           ROW_NUMBER (defensive: prefer known-artist songs at ties).
--                           BEFORE re-running this SP, apply the migration in SSMS:
--                             ALTER TABLE TopSongByCountryYear
--                               ADD song_name NVARCHAR(512) NULL;
-- Description: Pre-computes the most frequently charted song per country per year.
--              Stores country_id, chart_year, song_id, song_name, album_name, and
--              primary artist_name in TopSongByCountryYear for use by
--              sp_GetDiscoverPageInfo without scanning ChartEntry at read time.
--              Tie-break order: COUNT(*) DESC → artist known first → song_id ASC.
--              Run once after ChartEntry is populated or updated.
-- Table:       TopSongByCountryYear — DDL (original + 05/19/2026 migration):
--                CREATE TABLE TopSongByCountryYear (
--                    country_id   INT            NOT NULL,
--                    chart_year   INT            NOT NULL,
--                    song_id      INT            NOT NULL,
--                    song_name    NVARCHAR(512)  NULL,   -- added 05/19/2026
--                    album_name   NVARCHAR(512)  NULL,
--                    artist_name  NVARCHAR(MAX)  NULL,
--                    CONSTRAINT PK_TopSongByCountryYear PRIMARY KEY (country_id, chart_year),
--                    CONSTRAINT FK_TSCY_Country FOREIGN KEY (country_id) REFERENCES Country(country_id),
--                    CONSTRAINT FK_TSCY_Song    FOREIGN KEY (song_id)    REFERENCES DIM_Song(song_id)
--                );
-- EXEC sp_PopulateTopSongByCountryYear;
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[sp_PopulateTopSongByCountryYear]
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE TopSongByCountryYear;

    WITH RankedSongs AS (
        SELECT
            ce.country_id,
            YEAR(ce.snapshot_date)      AS chart_year,
            ce.song_id,
            s.title                     AS song_name,
            s.album_name,
            a.artist_name,
            COUNT(*)                    AS chart_appearances,
            ROW_NUMBER() OVER (
                PARTITION BY ce.country_id, YEAR(ce.snapshot_date)
                ORDER BY
                    COUNT(*) DESC,
                    CASE WHEN a.artist_name IS NOT NULL THEN 0 ELSE 1 END ASC,
                    ce.song_id ASC
            ) AS rn
        FROM ChartEntry ce
        JOIN DIM_Song s
            ON s.song_id = ce.song_id
        LEFT JOIN Bridge_SongArtist bsa
            ON bsa.song_id = s.song_id
           AND bsa.artist_order = 1
        LEFT JOIN DIM_Artist a
            ON a.artist_id = bsa.artist_id
        WHERE ce.country_id IS NOT NULL
        GROUP BY
            ce.country_id,
            YEAR(ce.snapshot_date),
            ce.song_id,
            s.title,
            s.album_name,
            a.artist_name
    )
    INSERT INTO TopSongByCountryYear (country_id, chart_year, song_id, song_name, album_name, artist_name)
    SELECT country_id, chart_year, song_id, song_name, album_name, artist_name
    FROM RankedSongs
    WHERE rn = 1;

    -- Sanity check output
    SELECT chart_year, COUNT(*) AS countries_populated
    FROM TopSongByCountryYear
    GROUP BY chart_year
    ORDER BY chart_year;
END;

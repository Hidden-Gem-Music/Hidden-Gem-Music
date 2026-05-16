-- =============================================
-- Author:      Leena Komenski
-- Create date: 05/13/2026
-- Updated:     05/15/2026 — Refactored inline subquery to named CTE (RankedSongs)
--                           for readability. Added song_id to INSERT for traceability.
--                           Confirmed table name as ChartEntry (star schema).
--                           Added sanity-check result set (rows per year) at end.
-- Description: Pre-computes the most frequently charted song per country per year.
--              Stores country_id, chart_year, song_id, album_name, and primary artist_name
--              in TopSongByCountryYear for use by sp_GetDiscoverPageInfo without scanning
--              ChartEntry at read time. Ties broken deterministically by song_id ASC.
--              Run once after ChartEntry is populated or updated.
-- Table:       TopSongByCountryYear — DDL:
--                CREATE TABLE TopSongByCountryYear (
--                    country_id   INT            NOT NULL,
--                    chart_year   INT            NOT NULL,
--                    song_id      INT            NOT NULL,
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
            s.album_name,
            a.artist_name,
            COUNT(*)                    AS chart_appearances,
            ROW_NUMBER() OVER (
                PARTITION BY ce.country_id, YEAR(ce.snapshot_date)
                ORDER BY COUNT(*) DESC, ce.song_id ASC  -- song_id tiebreak = deterministic
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
            s.album_name,
            a.artist_name
    )
    INSERT INTO TopSongByCountryYear (country_id, chart_year, song_id, album_name, artist_name)
    SELECT country_id, chart_year, song_id, album_name, artist_name
    FROM RankedSongs
    WHERE rn = 1;

    -- Sanity check output
    SELECT chart_year, COUNT(*) AS countries_populated
    FROM TopSongByCountryYear
    GROUP BY chart_year
    ORDER BY chart_year;
END;
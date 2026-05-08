-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     04/26/2026 — Star schema rewrite
-- Changes:     Song → DIM_Song, Album join removed (album_name on DIM_Song).
--              Top album subquery simplified — album_name now a direct string column
--              on DIM_Song, no album_id FK needed.
-- Description: One lightweight row per country for globe dots and country list sidebar.
-- Also feeds Mapbox tileset export. Reads only pre-computed tables.
-- EXEC sp_GetDiscoverPageInfo @Year = 2021;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetDiscoverPageInfo
    @Year INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.iso_code                          AS country_code,
        c.full_name                         AS country_name,
        c.latitude,
        c.longitude,
        c.region,
        ISNULL(hg_agg.hidden_gem_count, 0)  AS hidden_gem_count,
        top_song.album_name                 AS top_album_name,
        top_song.artist_name                AS top_artist_name
    FROM Country c
    -- hidden gem count per country
    LEFT JOIN (
        SELECT
            country_id,
            COUNT(*) AS hidden_gem_count
        FROM HiddenGems
        WHERE chart_year = @Year
        GROUP BY country_id
    ) hg_agg ON hg_agg.country_id = c.country_id
    -- top song detail: most frequent charted song in each country/year
    -- this is independent from hidden gems and reflects overall country popularity
    LEFT JOIN (
        SELECT
            ce.country_id,
            s_inner.album_name,
            a_inner.artist_name,
            ROW_NUMBER() OVER (
                PARTITION BY ce.country_id
                ORDER BY COUNT(*) DESC, ce.song_id ASC
            ) AS rn
        FROM ChartEntry ce
        JOIN DIM_Song s_inner ON s_inner.song_id = ce.song_id
        LEFT JOIN Bridge_SongArtist bsa_inner
            ON bsa_inner.song_id = s_inner.song_id
           AND bsa_inner.artist_order = 1
        LEFT JOIN DIM_Artist a_inner ON a_inner.artist_id = bsa_inner.artist_id
        WHERE ce.country_id IS NOT NULL
          AND ce.snapshot_date >= DATEFROMPARTS(@Year, 1, 1)
          AND ce.snapshot_date <  DATEFROMPARTS(@Year + 1, 1, 1)
        GROUP BY ce.country_id, ce.song_id, s_inner.album_name, a_inner.artist_name
    ) top_song ON top_song.country_id = c.country_id AND top_song.rn = 1
    WHERE c.latitude  IS NOT NULL
      AND c.longitude IS NOT NULL
    ORDER BY c.full_name;
END;
GO

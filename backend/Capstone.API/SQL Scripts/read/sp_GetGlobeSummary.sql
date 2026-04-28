-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     04/26/2026 — Star schema rewrite
-- Changes:     Song → DIM_Song, Album join removed (album_name on DIM_Song).
--              Top album subquery simplified — album_name now a direct string column
--              on DIM_Song, no album_id FK needed.
-- Description: One lightweight row per country for globe dots and country list sidebar.
-- Also feeds Mapbox tileset export. Reads only pre-computed tables.
-- EXEC sp_GetGlobeSummary @Year = 2021;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetGlobeSummary
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
        top_alb.album_name                  AS top_album_name
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
    -- top album: album_name appearing most in this country's hidden gems this year
    -- simplified from original — album_name is now a plain string on DIM_Song
    LEFT JOIN (
        SELECT
            hg_src.country_id,
            s_inner.album_name,
            ROW_NUMBER() OVER (
                PARTITION BY hg_src.country_id
                ORDER BY COUNT(*) DESC
            ) AS rn
        FROM HiddenGems hg_src
        JOIN DIM_Song s_inner ON s_inner.song_id = hg_src.song_id
        WHERE hg_src.chart_year    = @Year
          AND s_inner.album_name   IS NOT NULL
        GROUP BY hg_src.country_id, s_inner.album_name
    ) top_alb ON top_alb.country_id = c.country_id AND top_alb.rn = 1
    WHERE c.latitude  IS NOT NULL
      AND c.longitude IS NOT NULL
    ORDER BY c.full_name;
END;
GO

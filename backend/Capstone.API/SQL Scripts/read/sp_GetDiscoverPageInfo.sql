-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     04/26/2026 — Star schema rewrite
--              05/13/2026 — Replaced live ChartEntry top_song subquery with
--                           TopSongByCountryYear summary table (pre-computed).
--                           Reads only pre-computed tables; SP is now near-instant.
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
        ts.album_name                       AS top_album_name,
        ts.artist_name                      AS top_artist_name
    FROM Country c
    LEFT JOIN (
        SELECT
            country_id,
            COUNT(*) AS hidden_gem_count
        FROM HiddenGems
        WHERE chart_year = @Year
        GROUP BY country_id
    ) hg_agg ON hg_agg.country_id = c.country_id
    LEFT JOIN TopSongByCountryYear ts
        ON ts.country_id = c.country_id
       AND ts.chart_year = @Year
    WHERE c.latitude  IS NOT NULL
      AND c.longitude IS NOT NULL
    ORDER BY c.full_name;
END;
GO

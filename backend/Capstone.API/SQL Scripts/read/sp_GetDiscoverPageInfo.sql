-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     04/26/2026 — Star schema rewrite
--              05/13/2026 — Replaced live FACT_ChartEntry top-song subquery with
--                           TopSongByCountryYear summary table (pre-computed).
--                           Reads only pre-computed tables; SP is now near-instant.
--              05/15/2026 — Replaced WHERE latitude/longitude IS NOT NULL filter with
--                           WHERE iso_code IS NOT NULL to match SVG map ISO-code-based
--                           country matching (Mapbox globe replaced by SVG Discovery Map).
-- Description: One lightweight row per country for the Discovery Map and country
--              sidebar list. Returns country metadata, hidden gem count for the year,
--              and most-charted album/artist name from TopSongByCountryYear.
--              Reads only pre-computed tables (Country, HiddenGems, TopSongByCountryYear).
-- EXEC sp_GetDiscoverPageInfo @Year = 2021;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_GetDiscoverPageInfo]
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
        tscy.album_name                     AS top_album_name,
        tscy.artist_name                    AS top_artist_name
    FROM Country c
    LEFT JOIN (
        SELECT country_id, COUNT(*) AS hidden_gem_count
        FROM HiddenGems
        WHERE chart_year = @Year
        GROUP BY country_id
    ) hg_agg ON hg_agg.country_id = c.country_id
    LEFT JOIN TopSongByCountryYear tscy
        ON tscy.country_id = c.country_id
       AND tscy.chart_year = @Year
    WHERE c.iso_code IS NOT NULL
    ORDER BY c.full_name;
END;

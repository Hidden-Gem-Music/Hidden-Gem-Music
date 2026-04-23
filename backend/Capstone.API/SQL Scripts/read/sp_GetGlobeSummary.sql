-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
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
        c.iso_code                              AS country_code,
        c.full_name                             AS country_name,
        c.latitude,
        c.longitude,
        c.region,
        -- total hidden gems for this country in this year
        ISNULL(hg_agg.hidden_gem_count, 0)      AS hidden_gem_count,
        -- top album: album with the most chart entries for this country this year
        alb.name                                AS top_album_name
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
    -- top album: album appearing most often in this country's hidden gems this year
    LEFT JOIN (
        SELECT country_id, album_id
        FROM (
            SELECT
                hg_src.country_id,
                s_inner.album_id,
                ROW_NUMBER() OVER (
                    PARTITION BY hg_src.country_id
                    ORDER BY COUNT(*) DESC
                ) AS rn
            FROM HiddenGems hg_src
            JOIN Song s_inner ON s_inner.song_id = hg_src.song_id
            WHERE hg_src.chart_year = @Year
              AND s_inner.album_id  IS NOT NULL
            GROUP BY hg_src.country_id, s_inner.album_id
        ) ranked
        WHERE rn = 1
    ) top_alb ON top_alb.country_id = c.country_id
    LEFT JOIN Album alb ON alb.album_id = top_alb.album_id
    WHERE c.latitude  IS NOT NULL
      AND c.longitude IS NOT NULL
    ORDER BY c.full_name;
END;
GO

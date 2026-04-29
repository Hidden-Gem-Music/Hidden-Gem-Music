-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: KPI 2: average and median days between a song's first chart appearance
-- anywhere and its first appearance in a second country.
-- EXEC sp_GetAverageDiscoveryGap @DateStart = '2017-01-01', @DateEnd = '2021-12-31', @MinCountries = 2;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetAverageDiscoveryGap
    @DateStart    DATE,
    @DateEnd      DATE,
    @MinCountries INT = 2
AS
BEGIN
    SET NOCOUNT ON;

    -- Only include songs that spread to N+ countries within the date range
       WITH SongFirstCrossing AS (
        SELECT
            song_id,
            MIN(days_to_spread) AS days_to_spread
        FROM DiscoveryGapByDay
        WHERE days_to_spread > 0 --was >= 0, excludes same-day left-censored artifacts        
        GROUP BY song_id
    ),
    Filtered AS (
        SELECT
            sfc.song_id,
            sfc.days_to_spread
        FROM SongFirstCrossing sfc
        WHERE EXISTS (
            SELECT 1
            FROM SongCountryPresence scp
            WHERE scp.song_id      = sfc.song_id
              AND scp.chart_year   BETWEEN YEAR(@DateStart) AND YEAR(@DateEnd)
              AND scp.country_count >= @MinCountries
        )
    ),
    MedianCalc AS (
        SELECT
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_spread)
                OVER () AS median_gap_days
        FROM Filtered
    )
    SELECT
        CAST(AVG(CAST(f.days_to_spread AS DECIMAL(10,4))) AS INT) AS avg_gap_days,
        CAST(MAX(mc.median_gap_days) AS INT)                      AS median_gap_days,
        COUNT(DISTINCT f.song_id)                                 AS sample_size
    FROM Filtered f
    CROSS JOIN (SELECT TOP 1 median_gap_days FROM MedianCalc) mc;
END;

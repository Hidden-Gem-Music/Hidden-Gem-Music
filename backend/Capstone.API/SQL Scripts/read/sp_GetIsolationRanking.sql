-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Returns all qualifying countries ranked by isolation score.
-- Feeds Regional Isolation Scores horizontal bar chart. Separated from
-- sp_GetIsolationLeader so KPI card and chart can be fetched independently.
-- EXEC sp_GetIsolationRanking @DateStart = '2017-01-01', @DateEnd = '2021-12-31';
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetIsolationRanking
    @DateStart DATE,
    @DateEnd   DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @YearStart INT = YEAR(@DateStart);
    DECLARE @YearEnd   INT = YEAR(@DateEnd);

    SELECT
        c.full_name                     AS country_name,
        c.iso_code,
        c.region,
        AVG(isc.isolation_score)        AS isolation_score,
        -- return the most common tier for this country across years
        -- (used for Recharts bar coloring)
        MAX(isc.isolation_tier)         AS isolation_tier
    FROM IsolationScoreByCountry isc
    JOIN Country c ON c.country_id = isc.country_id
    WHERE isc.chart_year BETWEEN @YearStart AND @YearEnd
      AND LOWER(c.full_name) != 'global'
      AND UPPER(c.iso_code) != 'GLOBAL'
    GROUP BY c.country_id, c.full_name, c.iso_code, c.region
    ORDER BY AVG(isc.isolation_score) DESC;
END;
GO

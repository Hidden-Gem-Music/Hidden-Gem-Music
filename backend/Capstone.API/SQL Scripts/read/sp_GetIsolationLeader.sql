-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: KPI 3: the single most globally isolated country (highest isolation score)
-- in the date range. Feeds the KPI 3 stat card.
-- EXEC sp_GetIsolationLeader @DateStart = '2017-01-01', @DateEnd = '2021-12-31';
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetIsolationLeader
    @DateStart DATE,
    @DateEnd   DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @YearStart INT = YEAR(@DateStart);
    DECLARE @YearEnd   INT = YEAR(@DateEnd);

    SELECT TOP 1
        c.full_name         AS country_name,
        c.iso_code,
        c.region,
        AVG(isc.isolation_score) AS isolation_score   -- avg across years in range
    FROM IsolationScoreByCountry isc
    JOIN Country c ON c.country_id = isc.country_id
    WHERE isc.chart_year BETWEEN @YearStart AND @YearEnd
    GROUP BY c.country_id, c.full_name, c.iso_code, c.region
    ORDER BY AVG(isc.isolation_score) DESC;
END;
GO

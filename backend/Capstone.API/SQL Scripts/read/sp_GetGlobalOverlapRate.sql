-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: KPI 1: of all unique charting songs in the date range, what % appeared
-- in 2+ countries? Feeds the headline overlap % stat card on the dashboard.
-- EXEC sp_GetGlobalOverlapRate @DateStart = '2017-01-01', @DateEnd = '2021-12-31';
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetGlobalOverlapRate
    @DateStart DATE,
    @DateEnd   DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @YearStart INT = YEAR(@DateStart);
    DECLARE @YearEnd   INT = YEAR(@DateEnd);

    SELECT
        COUNT(*)                                            AS total_unique_songs,
        SUM(CASE WHEN country_count >= 2 THEN 1 ELSE 0 END) AS songs_in_2plus_countries,
        CAST(
            CAST(SUM(CASE WHEN country_count >= 2 THEN 1 ELSE 0 END) AS DECIMAL(10,4))
          / CAST(COUNT(*) AS DECIMAL(10,4)) * 100
        AS DECIMAL(10,4))                                   AS overlap_pct
    FROM SongCountryPresence
    WHERE chart_year BETWEEN @YearStart AND @YearEnd
      -- exclude gap years from the calculation
      AND chart_year NOT BETWEEN 2022 AND 2022;
END;
GO

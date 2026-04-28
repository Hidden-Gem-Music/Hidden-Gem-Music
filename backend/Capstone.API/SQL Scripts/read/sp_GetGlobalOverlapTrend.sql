-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Feeds both dashboard trend charts: Global Overlap Rate Over Time (LineChart)
-- and Global Reach Over Time (BarChart). Returns gap rows with is_gap=1 and
-- NULL overlap_pct so Recharts renders the dashed 22-month gap segment.
-- EXEC sp_GetGlobalOverlapTrend @DateStart = '2017-01-01', @DateEnd = '2025-06-10';
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetGlobalOverlapTrend
    @DateStart DATE,
    @DateEnd   DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @YearStart INT = YEAR(@DateStart);
    DECLARE @YearEnd   INT = YEAR(@DateEnd);

    SELECT
        period_year,
        period_label,
        overlap_pct,                -- NULL for gap rows — Recharts uses this signal
        total_unique_songs,
        songs_in_2plus,
        avg_countries,
        is_gap
    FROM GlobalOverlapByYear
    WHERE period_year BETWEEN @YearStart AND @YearEnd
    ORDER BY period_year;
END;
GO

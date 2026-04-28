-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Year-by-year global overlap % and average countries per charting song.
-- Inserts synthetic gap row for 2022 (is_gap=1, NULL metrics) for Recharts rendering.
-- EXEC sp_PopulateGlobalOverlapByYear;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulateGlobalOverlapByYear
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE GlobalOverlapByYear;

    -- Real data years: 2017-2021, 2023-2025
    -- Gap years:       2022 (data ends Dec 2021, resumes Oct 2023)
    -- We insert a synthetic gap row for 2022 so Recharts can render
    -- the dashed gap segment with a NULL overlap_pct.

    -- Real data rows
    INSERT INTO GlobalOverlapByYear
        (period_year, period_label, period_month,
         overlap_pct, total_unique_songs, songs_in_2plus, avg_countries, is_gap)
    SELECT
        scp.chart_year                                     AS period_year,
        CAST(scp.chart_year AS NVARCHAR(10))               AS period_label,
        NULL                                               AS period_month,   -- yearly granularity
        -- overlap %: songs in 2+ countries / total unique charting songs * 100
        CAST(
            SUM(CASE WHEN scp.country_count >= 2 THEN 1 ELSE 0 END) AS DECIMAL(10,4)
        ) / CAST(COUNT(*) AS DECIMAL(10,4)) * 100          AS overlap_pct,
        COUNT(*)                                           AS total_unique_songs,
        SUM(CASE WHEN scp.country_count >= 2 THEN 1 ELSE 0 END) AS songs_in_2plus,
        -- average countries per charting song
        CAST(SUM(scp.country_count) AS DECIMAL(10,4))
        / CAST(COUNT(*)             AS DECIMAL(10,4))       AS avg_countries,
        0                                                  AS is_gap
    FROM SongCountryPresence scp
    GROUP BY scp.chart_year;

    -- Synthetic gap row for 2022 — NULL overlap_pct signals Recharts to render
    -- a dashed line segment and ReferenceArea across the gap.
    INSERT INTO GlobalOverlapByYear
        (period_year, period_label, period_month,
         overlap_pct, total_unique_songs, songs_in_2plus, avg_countries, is_gap)
    VALUES
        (2022, N'2022', NULL, NULL, NULL, NULL, NULL, 1);
END;
GO

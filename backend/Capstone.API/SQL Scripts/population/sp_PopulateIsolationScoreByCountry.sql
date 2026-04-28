-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Per country per year: isolation_score = (local - shared) / local * 100.
-- Only includes countries with >= 100 ChartEntry rows.
-- Assigns isolation_tier (high/mid/low) for Recharts bar chart color coding.
-- EXEC sp_PopulateIsolationScoreByCountry;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulateIsolationScoreByCountry
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE IsolationScoreByCountry;

    -- CTE: count total ChartEntry rows per country (all years) for threshold
    WITH EntryCount AS (
        SELECT
            country_id,
            COUNT(*) AS total_entries
        FROM ChartEntry
        WHERE country_id IS NOT NULL
        GROUP BY country_id
    )
    INSERT INTO IsolationScoreByCountry
        (country_id, chart_year, local_songs, shared_songs,
         isolation_score, isolation_tier, total_entries)
    SELECT
        cys.country_id,
        cys.chart_year,
        cys.total_charted     AS local_songs,
        cys.shared_count      AS shared_songs,
        -- isolation_score: percentage of local songs that appear NOWHERE else
        CASE
            WHEN cys.total_charted = 0 THEN 0
            ELSE CAST(cys.unique_count AS DECIMAL(10,4))
                 / CAST(cys.total_charted AS DECIMAL(10,4)) * 100
        END                   AS isolation_score,
        -- tier for Recharts color coding
        CASE
            WHEN (CAST(cys.unique_count AS DECIMAL(10,4))
                  / CAST(cys.total_charted AS DECIMAL(10,4)) * 100) > 65
                THEN N'high'
            WHEN (CAST(cys.unique_count AS DECIMAL(10,4))
                  / CAST(cys.total_charted AS DECIMAL(10,4)) * 100) >= 40
                THEN N'mid'
            ELSE N'low'
        END                   AS isolation_tier,
        ec.total_entries
    FROM CountryYearStats cys
    JOIN EntryCount ec ON ec.country_id = cys.country_id
    WHERE ec.total_entries >= 100;   -- minimum threshold
END;
GO

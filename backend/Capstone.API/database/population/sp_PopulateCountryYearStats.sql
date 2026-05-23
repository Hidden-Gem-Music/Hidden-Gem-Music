-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Aggregates per country per year: total charted, shared count, unique count,
-- and overlap %. Feeds KPI displays on country profile, comparison, and dashboard.
-- EXEC sp_PopulateCountryYearStats;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulateCountryYearStats
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE CountryYearStats;

    -- CTE: distinct songs per country per year
    WITH SongsPerCountryYear AS (
        SELECT
            ce.country_id,
            YEAR(ce.snapshot_date) AS chart_year,
            ce.song_id
        FROM ChartEntry ce
        WHERE ce.country_id IS NOT NULL
          AND ce.chart_type_id != 2
        GROUP BY
            ce.country_id,
            YEAR(ce.snapshot_date),
            ce.song_id
    ),
    -- CTE: join to SongCountryPresence to determine shared vs unique
    Classified AS (
        SELECT
            s.country_id,
            s.chart_year,
            s.song_id,
            -- shared = also charted in at least one other country this year
            CASE WHEN scp.country_count > 1 THEN 1 ELSE 0 END AS is_shared
        FROM SongsPerCountryYear s
        JOIN SongCountryPresence scp
            ON scp.song_id    = s.song_id
           AND scp.chart_year = s.chart_year
    )
    INSERT INTO CountryYearStats
        (country_id, chart_year, total_charted, shared_count, unique_count, overlap_pct)
    SELECT
        country_id,
        chart_year,
        COUNT(*)                                           AS total_charted,
        SUM(is_shared)                                     AS shared_count,
        COUNT(*) - SUM(is_shared)                          AS unique_count,
        CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE CAST(SUM(is_shared) AS DECIMAL(10,4))
                 / CAST(COUNT(*)     AS DECIMAL(10,4)) * 100
        END                                                AS overlap_pct
    FROM Classified
    GROUP BY country_id, chart_year;
END;
GO
